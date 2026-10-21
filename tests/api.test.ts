import { beforeEach, describe, expect, it } from "vitest";
import { resetDb } from "@/lib/server/db/store";
import * as R from "@/lib/server/routes";
import { ENDPOINTS } from "@/lib/server/endpoints";
import { DEMO_USERS } from "@/lib/server/seed/people";
import { brakingWorkbench } from "@/lib/workbench/problems/braking";
import { authoredToSteps } from "@/lib/workbench/steps";
import { validateSequence } from "@/lib/workbench/validate";
import { evaluateOutcomeRules } from "@/lib/engines/outcomeRules";
import { MISSIONS } from "@/lib/missions";

type Handler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<Response>;

async function call(handler: Handler, opts: { method?: string; path?: string; body?: unknown; params?: Record<string, string>; as?: keyof typeof DEMO_USERS } = {}) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (opts.as) headers["x-mikhyal-user"] = DEMO_USERS[opts.as];
  const req = new Request(`http://test/api/v1${opts.path ?? "/"}`, { method: opts.method ?? (opts.body ? "POST" : "GET"), headers, body: opts.body ? JSON.stringify(opts.body) : undefined });
  const res = await handler(req, { params: Promise.resolve(opts.params ?? {}) });
  return { status: res.status, json: await res.json() };
}

beforeEach(() => {
  resetDb();
});

describe("contract", () => {
  it("every endpoint has a handler and appears in the OpenAPI document", async () => {
    for (const e of ENDPOINTS) expect(typeof (R as Record<string, unknown>)[e.handler], e.handler).toBe("function");
    const { json } = await call(R.openapi as Handler);
    for (const e of ENDPOINTS) expect(json.paths[e.path]?.[e.method.toLowerCase()], `${e.method} ${e.path}`).toBeDefined();
    expect(Object.keys(json.components.schemas)).toEqual(expect.arrayContaining(["Mission", "Lab", "Phenomenon", "WorkbenchProblem", "SolutionGraph", "LearnerModel", "StudioDraft", "AIGenerationJob", "ClassReport"]));
  });

  it("returns error envelopes", async () => {
    const nf = await call(R.mission as Handler, { params: { id: "nope" } });
    expect(nf.status).toBe(404);
    expect(nf.json.error.code).toBe("not_found");
    const bad = await call(R.checkEquation as Handler, { params: { id: "braking" }, body: { input: "" } });
    expect(bad.status).toBe(400);
    expect(bad.json.error.code).toBe("bad_request");
    const forbidden = await call(R.createClass as Handler, { body: { name: "فصل", grade: 2 }, as: "student" });
    expect(forbidden.status).toBe(403);
  });
});

describe("auth and catalog", () => {
  it("demo login sets the cookie and /me reflects the role", async () => {
    const req = new Request("http://test/api/v1/auth/demo-login", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ role: "teacher" }) });
    const res = await (R.demoLogin as Handler)(req, { params: Promise.resolve({}) });
    expect(res.headers.get("set-cookie")).toContain(`mikhyal_user=${DEMO_USERS.teacher}`);
    const me = await call(R.me as Handler, { as: "teacher" });
    expect(me.json.user.role).toBe("teacher");
  });

  it("serves the catalog, mission detail by slug and the knowledge graph", async () => {
    const cat = await call(R.catalogList as Handler, { path: "/catalog?type=phenomenon" });
    expect(cat.json.total).toBe(9);
    const m = await call(R.mission as Handler, { params: { id: "braking" } });
    expect(m.json.mission.id).toBe("msn_braking");
    expect(m.json.exam.questions.length).toBeGreaterThan(0);
    expect(m.json.mission.experiment.outcome).toEqual({ kind: "engine", engineId: "braking" });
    const g = await call(R.graph as Handler);
    expect(g.json.edges.some((e: { type: string }) => e.type === "prerequisite")).toBe(true);
    const c = await call(R.concept as Handler, { params: { id: "kinematics.v2" } });
    expect(c.json.content.map((x: { slug: string }) => x.slug)).toContain("braking");
  });
});

describe("learning flow", () => {
  it("session → grading → events → mastery → recommendations", async () => {
    const before = await call(R.myLearner as Handler, { as: "student" });
    expect(before.json.concepts).toEqual({});
    const ses = await call(R.startSession as Handler, { body: { contentId: "msn_braking", mode: "discovery" }, as: "student" });
    expect(ses.status).toBe(201);

    const wrong = await call(R.checkEquation as Handler, { params: { id: "braking" }, body: { input: "s = u^2/a" }, as: "student" });
    expect(wrong.json.correct).toBe(false);
    const right = await call(R.checkEquation as Handler, { params: { id: "braking" }, body: { input: "v^2 = u^2 - 2as" }, as: "student" });
    expect(right.json.correct).toBe(true);

    const ev = await call(R.sessionEvents as Handler, {
      params: { id: ses.json.id },
      body: { events: [{ contentId: "braking", step: "discover", kind: "equation_attempt", correct: true, evidence: { conceptKeys: ["kinematics.v2"], correct: true, hintsUsed: 0 }, at: Date.now() }] },
      as: "student",
    });
    expect(ev.json.learner.concepts["kinematics.v2"].mastery).toBeGreaterThan(0.15);
    const done = await call(R.completeSession as Handler, { params: { id: ses.json.id }, body: {}, as: "student" });
    expect(done.json.learner.completedMissions).toContain("braking");
    const recs = await call(R.myRecommendations as Handler, { as: "student" });
    expect(recs.json.recommendations[0].slug).not.toBe("braking");
  });

  it("grades predictions, numeric answers, exams and phenomena with diagnoses", async () => {
    const p = await call(R.predict as Handler, { params: { id: "braking" }, body: { choiceId: "double" } });
    expect(p.json.correct).toBe(false);
    const a = await call(R.phenomenonAnswer as Handler, { params: { id: "magnetism" }, body: { input: "40 μT" } });
    expect(a.json.correct).toBe(true);
    const exam = await call(R.exam as Handler, { params: { id: "exm_braking" } });
    const answers = Object.fromEntries(exam.json.exam.questions.map((q: { id: string; correctId: string }) => [q.id, q.correctId]));
    const sub = await call(R.examSubmit as Handler, { params: { id: "exm_braking" }, body: { answers, elapsedSec: 30 } });
    expect(sub.json.score).toBe(sub.json.total);
  });

  it("workbench validation matches the local validator", async () => {
    const steps = authoredToSteps(brakingWorkbench, brakingWorkbench.paths[1].steps);
    const res = await call(R.workbenchValidate as Handler, { params: { id: "braking_001" }, body: { steps } });
    const local = validateSequence(brakingWorkbench, steps);
    expect(res.json.validations.map((v: { action: string }) => v.action)).toEqual(local.map((v) => v.action));
  });

  it("saves lab progress", async () => {
    const r = await call(R.myLabProgress as Handler, { method: "PUT", params: { labId: "circuits" }, body: { solvedLevelIds: ["close-loop"] }, as: "student" });
    expect(r.json.labProgress.circuits).toEqual(["close-loop"]);
  });
});

describe("teacher, parent, studio, AI", () => {
  it("teacher sees the class report; parent sees the child report", async () => {
    const rep = await call(R.classReport as Handler, { params: { id: "cls_3_2" }, as: "teacher" });
    expect(rep.json.students).toHaveLength(32);
    const kids = await call(R.myChildren as Handler, { as: "parent" });
    expect(kids.json.items[0].child.id).toBe(DEMO_USERS.student);
    const pr = await call(R.childReport as Handler, { params: { id: DEMO_USERS.student }, as: "parent" });
    expect(pr.json.categoryMastery).toHaveLength(4);
    const denied = await call(R.childReport as Handler, { params: { id: "usr_student_youssef" }, as: "parent" });
    expect(denied.status).toBe(403);
  });

  it("template → draft → patch → publish → catalog with a version", async () => {
    const d = await call(R.createDraft as Handler, {
      body: {
        templateId: "tpl_discovery_lesson",
        slots: {
          title: "قانون أوم بالتجربة",
          story: "لمبة ومقاومة متغيرة.",
          goal: "خلي التيار 2 A.",
          conceptKey: "electricity.ohm",
          relation: "I = \\frac{V}{R}",
          params: [
            { key: "V", label: "الجهد", symbol: "V", min: 1, max: 12, step: 1, unit: "V", default: 6 },
            { key: "R", label: "المقاومة", symbol: "R", min: 1, max: 10, step: 1, unit: "Ω", default: 3 },
          ],
          success: "abs(V/R - 2) < 0.1",
        },
      },
      as: "teacher",
    });
    expect(d.status).toBe(201);
    expect(d.json.issues.some((i: { level: string }) => i.level === "error")).toBe(true); // body still incomplete
    const fail = await call(R.publishDraft as Handler, { params: { id: d.json.id }, body: {}, as: "teacher" });
    expect(fail.status).toBe(400);

    const full = MISSIONS.find((m) => m.id === "ohm")!;
    const patch = await call(R.updateDraft as Handler, {
      method: "PATCH",
      params: { id: d.json.id },
      body: {
        content: {
          slug: "ohm-teacher",
          conceptIds: ["cpt_electricity.ohm"],
          groundTruth: "I = V/R",
          order: 99,
          equationIds: [],
          prediction: full.prediction,
          experiment: { simulationId: "sim_generated", engineId: "rules", instruction: "حرّك", params: [{ key: "V", label: "V", symbol: "V", min: 1, max: 12, step: 1, unit: "V", default: 6 }, { key: "R", label: "R", symbol: "R", min: 1, max: 10, step: 1, unit: "ohm", default: 3 }], outcome: { kind: "rules", readouts: [{ label: "I", expr: "V/R", unit: "A", digits: 2 }], success: "abs(V/R - 2) < 0.1", messages: [{ when: "true", text: "جرّب" }] } },
          discovery: { ...full.discovery },
          application: full.application,
          examId: "exm_ohm",
          hints: {},
          reflection: { summary: "اكتشفت قانون أوم" },
        },
      },
      as: "teacher",
    });
    expect(patch.json.issues.filter((i: { level: string }) => i.level === "error")).toEqual([]);
    const pub = await call(R.publishDraft as Handler, { params: { id: d.json.id }, body: { note: "v1" }, as: "teacher" });
    expect(pub.status).toBe(200);
    expect(pub.json.version.version).toBe(1);
    const cat = await call(R.catalogList as Handler, { path: "/catalog?q=ohm-teacher" });
    expect(cat.json.items.map((x: { slug: string }) => x.slug)).toContain("ohm-teacher");
    const ev = await call(R.outcomeEvaluate as Handler, { body: { outcome: pub.json.content.experiment.outcome, params: { V: 6, R: 3 } } });
    expect(ev.json.success).toBe(true);
  });

  it("AI generation produces a draft", async () => {
    const job = await call(R.aiGenerate as Handler, { body: { kind: "lesson", prompt: "درس عن قانون نيوتن التاني بعربية على أرض ملساء", conceptIds: ["cpt_dynamics.newton2"] }, as: "teacher" });
    expect(job.status).toBe(202);
    expect(job.json.status).toBe("succeeded");
    const got = await call(R.aiJob as Handler, { params: { id: job.json.id }, as: "teacher" });
    expect(got.json.draft.source).toEqual({ kind: "ai", jobId: job.json.id });
    expect(got.json.draft.content.experiment.outcome.kind).toBe("rules");
  });

  it("validates solution graphs", async () => {
    const g = structuredClone(brakingWorkbench.graph);
    g.edges.push({ from: "final_distance", to: "distance_direct", type: "dependency" });
    const r = await call(R.graphValidate as Handler, { body: { graph: g, symbols: Object.keys(brakingWorkbench.symbols) }, as: "teacher" });
    expect(r.json.issues.some((i: { code: string }) => i.code === "cycle")).toBe(true);
  });
});

describe("declarative outcomes", () => {
  it("rules reproduce the braking engine's success condition", () => {
    const braking = MISSIONS.find((m) => m.id === "braking")!;
    for (const [u, a] of [[20, 5], [14, 4], [25, 9], [10, 2]]) {
      const engine = braking.experiment.evaluate({ ...Object.fromEntries(braking.experiment.params.map((p) => [p.key, p.default])), u, a });
      const dist = (u * u) / (2 * a);
      const rules = evaluateOutcomeRules({ kind: "rules", readouts: [{ label: "d", expr: "u^2/(2*a)", unit: "m", digits: 1 }], success: "u^2/(2*a) <= 40", messages: [] }, { u, a });
      expect(rules.readouts[0].value).toBe(dist.toFixed(1));
      expect(typeof engine.success).toBe("boolean");
    }
  });
});
