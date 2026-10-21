import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/server/db/store";
import * as R from "@/lib/server/routes";
import { validateSpec } from "@/lib/server/ai/tools";
import { bohrEnergy, closestApproach, fractionBeyond, rutherfordAngle, sampleAngles, trajectory, transitionWavelength } from "@/lib/physics/atomic";
import { rng } from "@/lib/workbench/algebra";
import type { AgentRun, UiBlock, UiSpec } from "@/lib/domain";

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

async function call(handler: Handler, opts: { path?: string; body?: unknown; params?: Record<string, string> } = {}) {
  const req = new Request(`http://test/api/v1${opts.path ?? "/"}`, { method: opts.body ? "POST" : "GET", headers: { "content-type": "application/json" }, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const res = await handler(req, { params: Promise.resolve(opts.params ?? {}) });
  return { status: res.status, res, json: res.headers.get("content-type")?.includes("json") ? await res.json() : null };
}

const flat = (blocks: UiBlock[]): UiBlock[] => blocks.flatMap((b) => [b, ...("children" in b ? flat(b.children) : [])]);

beforeEach(() => resetDb());

describe("atomic physics", () => {
  it("matches textbook numbers", () => {
    expect(closestApproach(79, 5)).toBeCloseTo(45.5, 1);
    expect(bohrEnergy(1, 1)).toBeCloseTo(-13.6);
    expect(transitionWavelength(1, 3, 2)).toBeCloseTo(656, -1);
    expect(rutherfordAngle(closestApproach(79, 5) / 2, 79, 5)).toBeCloseTo(Math.PI / 2, 5);
  });

  it("numerical trajectory agrees with the analytic deflection", () => {
    const pts = trajectory(5, 10);
    const [a, b] = pts.slice(-2);
    const angle = (Math.atan2(b[1] - a[1], b[0] - a[0]) * 180) / Math.PI;
    expect(Math.abs(angle)).toBeGreaterThan(85);
    expect(Math.abs(angle)).toBeLessThan(95);
  });

  it("Thomson atom never back-scatters; Rutherford occasionally does", () => {
    const th = sampleAngles(20000, 79, 5, "thomson", rng(1));
    const ru = sampleAngles(20000, 79, 5, "rutherford", rng(1));
    expect(th.filter((a) => a > 90).length).toBe(0);
    expect(ru.filter((a) => a > 90).length).toBeGreaterThan(0);
    expect(ru.filter((a) => a > 90).length / ru.length).toBeLessThan(0.01);
    expect(fractionBeyond(90, 79, 5, 2000)).toBeLessThan(0.01);
  });
});

describe("ui spec validation", () => {
  const base: UiSpec = { version: "genui/1", title: "t", blocks: [], libraries: ["genui-core"] };
  it("rejects unknown scenes, unsafe expressions and bad bindings", () => {
    const bad = validateSpec({
      ...base,
      blocks: [
        { type: "scene", component: "evil", props: {} },
        { type: "sim", id: "s", title: "s", params: [{ key: "a", label: "a", symbol: "a", min: 0, max: 1, step: 0.1, unit: "", default: 0 }], readouts: [{ label: "x", expr: "import('fs')", unit: "", digits: 2 }], children: [{ type: "scene", component: "atom_model", props: {}, bind: { Z: "nope" } }] },
        { type: "quiz", question: "q", options: [{ id: "a", label: "a" }], correctId: "b", explanation: "", feedback: {} },
      ],
    });
    expect(bad.valid).toBe(false);
    expect(bad.issues.join("\n")).toMatch(/evil/);
    expect(bad.issues.join("\n")).toMatch(/nope/);
    expect(bad.issues.join("\n")).toMatch(/correctId/);
    expect(bad.issues.some((i) => i.includes("readouts[0]"))).toBe(true);
    expect(validateSpec({ ...base, blocks: [{ type: "text", text: "ok" }] }).valid).toBe(true);
  });
});

describe("AI agents over the API", () => {
  it("lists tools and libraries", async () => {
    const t = await call(R.aiTools as Handler);
    expect(t.json.items.map((x: { name: string }) => x.name)).toEqual(expect.arrayContaining(["get_topic", "compose_block", "validate_ui", "publish_lesson", "answer_faq"]));
    const l = await call(R.aiLibraries as Handler);
    expect(l.json.items.flatMap((x: { provides: string[] }) => x.provides)).toEqual(expect.arrayContaining(["scene:rutherford_scattering", "scene:atom_model", "scene:energy_levels"]));
  });

  it("generator builds, validates and publishes the atomic-structure lesson from the knowledge base", async () => {
    const missing = await call(R.lesson as Handler, { params: { slug: "atomic-structure" } });
    expect(missing.status).toBe(404);
    const r = await call(R.aiRunCreate as Handler, { body: { agent: "generator", prompt: "اشرح طبيعة الذرة وتجربة رذرفورد", publish: { slug: "atomic-structure" } } });
    expect(r.status).toBe(201);
    const run = r.json as AgentRun;
    expect(run.status).toBe("succeeded");
    const tools = run.steps.filter((s) => s.type === "tool_call").map((s) => (s as { tool: string }).tool);
    expect(tools).toEqual(expect.arrayContaining(["search_knowledge", "get_topic", "get_elements", "get_dataset", "compose_block", "validate_ui", "publish_lesson"]));
    const ui = run.output!.ui!;
    expect(validateSpec(ui).valid).toBe(true);
    const scenes = flat(ui.blocks).filter((b) => b.type === "scene").map((b) => (b as { component: string }).component);
    expect(scenes).toEqual(expect.arrayContaining(["rutherford_scattering", "atom_model", "energy_levels", "plum_pudding"]));
    // Data comes from the store: the Geiger–Marsden points are the dataset's counts.
    const plot = flat(ui.blocks).find((b) => b.type === "plot") as Extract<UiBlock, { type: "plot" }>;
    expect(plot.points?.length).toBe(11);

    const got = await call(R.lesson as Handler, { params: { slug: "atomic-structure" } });
    expect(got.status).toBe(200);
    expect(got.json.lesson.ui.title).toBe(ui.title);
    expect(got.json.run.id).toBe(run.id);
    const list = await call(R.lessons as Handler);
    expect(list.json.items.map((x: { slug: string }) => x.slug)).toContain("atomic-structure");
  });

  it("advisor answers from the topic FAQ and attaches a visual", async () => {
    const r = await call(R.aiRunCreate as Handler, { body: { agent: "advisor", prompt: "ليه أغلب جسيمات ألفا عدّت؟ هي الذرة فاضية؟", context: { lessonSlug: "atomic-structure" } } });
    const run = r.json as AgentRun;
    expect(run.steps.some((s) => s.type === "tool_call" && s.tool === "answer_faq")).toBe(true);
    expect(run.output!.message.length).toBeGreaterThan(40);
    const p = await call(R.aiRunCreate as Handler, { body: { agent: "advisor", prompt: "أذاكر إيه الجاي؟" } });
    expect(p.json.steps.some((s: { type: string; tool?: string }) => s.type === "tool_call" && s.tool === "get_learner_state")).toBe(true);
  });

  it("invokes a tool directly and streams a run as SSE", async () => {
    const t = await call(R.aiToolInvoke as Handler, { params: { name: "get_elements" }, body: { args: { symbols: ["Au"] } } });
    expect(t.status).toBe(200);
    expect(JSON.stringify(t.json)).toContain("Au");
    const r = await call(R.aiRunCreate as Handler, { body: { agent: "advisor", prompt: "مدارات بور" } });
    const s = await call(R.aiRunStream as Handler, { params: { id: r.json.id }, path: `/ai/runs/${r.json.id}/stream?speed=10000` });
    expect(s.res.headers.get("content-type")).toContain("text/event-stream");
    const text = await s.res.text();
    expect(text).toContain("event: step");
    expect(text).toContain("event: done");
  });
});
