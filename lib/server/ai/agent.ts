/**
 * Mock AI agents. A deterministic planner decides which tools to call (the way an LLM with
 * tool-use would), executes them for real against the store, and records a transcript:
 * thoughts → tool calls → tool results → final message → generated UI.
 * Swapping the planner for an LLM keeps the tools, transcript format and endpoints unchanged.
 */
import type { AgentRun, AgentStep, RunRequest, UiBlock, UiSpec, User } from "@/lib/domain";
import { db, newId, nowIso } from "../db/store";
import { HttpError } from "../http";
import { topicOf } from "./builders";
import { LIBRARIES } from "./catalog";
import { invokeTool, tokens } from "./tools";

export const MODEL = "mock-planner-1";

class Recorder {
  steps: AgentStep[] = [];
  latency = 0;
  calls = 0;
  constructor(private user: User) {}
  private at(ms: number) {
    this.latency += ms;
    return this.latency;
  }
  think(text: string) {
    this.steps.push({ type: "thought", text, at: this.at(350 + text.length * 4) });
  }
  call<T = unknown>(tool: string, args: Record<string, unknown>): T {
    const callId = `call_${++this.calls}`;
    this.steps.push({ type: "tool_call", callId, tool, args, at: this.at(120) });
    const t0 = Date.now();
    try {
      const out = invokeTool(tool, args, { user: this.user });
      const ms = Math.max(Date.now() - t0, 40 + ((tool.length * 37) % 260));
      this.steps.push({ type: "tool_result", callId, tool, ok: true, summary: out.summary, result: out.result, ms, at: this.at(ms) });
      return out.result as T;
    } catch (e) {
      const msg = e instanceof HttpError ? e.message : e instanceof Error ? e.message : String(e);
      this.steps.push({ type: "tool_result", callId, tool, ok: false, summary: msg, result: null, ms: 50, at: this.at(50) });
      throw e;
    }
  }
  say(text: string) {
    this.steps.push({ type: "message", text, at: this.at(200 + text.length * 2) });
  }
  ui(spec: UiSpec) {
    this.steps.push({ type: "ui", spec, at: this.at(150) });
  }
}

type SearchResult = { topics: { slug: string; title: string; score: number }[]; concepts: { key: string; title: string }[]; content: { id: string; title: string; href: string }[] };

/** Libraries a spec needs: whichever library provides each block type or scene it uses. */
function librariesFor(blocks: UiBlock[]) {
  const used = new Set<string>(["genui-core", "mathjs-rules"]);
  const need = (feature: string) => LIBRARIES.filter((l) => l.provides.includes(feature)).forEach((l) => used.add(l.id));
  const walk = (bs: UiBlock[]) =>
    bs.forEach((b) => {
      need(b.type === "scene" ? `scene:${b.component}` : b.type);
      if (b.type === "sim" || b.type === "section") walk(b.children);
    });
  walk(blocks);
  return used;
}

// ───────────────────────────── Generator ─────────────────────────────

function runGenerator(r: Recorder, req: RunRequest, runId: string) {
  r.think(`المطلوب: «${req.prompt.slice(0, 120)}». هدوّر في قاعدة المعرفة على موضوع مناسب قبل ما أبني أي واجهة.`);
  const found = r.call<SearchResult>("search_knowledge", { query: req.prompt });
  const topicSlug = found.topics[0]?.slug;

  if (!topicSlug) return runGenericGenerator(r, req, found);

  const topic = r.call<{ slug: string; title: string; conceptKeys: string[]; sections: { id: string; title: string; goal: string; build: string[] }[] }>("get_topic", { slug: topicSlug });
  r.think(`لقيت الموضوع «${topic.title}» وفيه ${topic.sections.length} أقسام. هشوف المكتبات المتاحة للرسم والمحاكاة، وبعدين أجيب البيانات (المعادلات، العناصر، بيانات التجربة).`);
  const libs = r.call<{ id: string }[]>("list_libraries", {});
  r.call("get_concepts", { keys: topic.conceptKeys });
  r.call("get_equations", { conceptKeys: topic.conceptKeys });
  r.call("get_elements", { symbols: ["H", "He", "C", "O", "Cu", "Au"] });
  r.call("get_dataset", { id: "dst_geiger_marsden_1913" });
  r.think("محتاج كمان تاريخ تخيّل الذرة ومكوّناتها (شحنة وكتلة كل جسيم) عشان أقسام «الخيال» و«رحلة جوه الذرة».");
  r.call("get_atom_models", {});
  r.call("get_particles", {});

  const full = topicOf(topicSlug);
  const blocks: UiBlock[] = [];
  for (const s of topic.sections) {
    r.think(`قسم «${s.title}»: ${s.goal} هبني: ${s.build.join("، ")}.`);
    const children: UiBlock[] = (full.sections.find((x) => x.id === s.id)?.narrative ?? []).map((text) => ({ type: "text" as const, text }));
    for (const kind of s.build) children.push(r.call<UiBlock>("compose_block", { kind, topic: topicSlug, section: s.id }));
    blocks.push({ type: "section", id: s.id, title: s.title, children });
  }
  const used = librariesFor(blocks);
  const spec: UiSpec = {
    version: "genui/1",
    title: topic.title,
    subtitle: "درس اتولّد من قاعدة المعرفة بالأدوات — كل رقم ورسمة جاية من البيانات.",
    blocks,
    libraries: [...used].filter((l) => libs.some((x) => x.id === l)),
  };
  r.think("هتحقق من الواجهة: كل تعبير رياضي، كل ربط بين المحاكاة والمشهد، وكل مكتبة مطلوبة.");
  const check = r.call<{ valid: boolean; issues: string[] }>("validate_ui", { spec });
  if (!check.valid) throw new HttpError(422, "unprocessable", "generated UI failed validation", check.issues);
  let lessonSlug: string | undefined;
  if (req.publish) {
    r.call("publish_lesson", { slug: req.publish.slug, spec, runId });
    lessonSlug = req.publish.slug;
  }
  r.ui(spec);
  const sims = JSON.stringify(spec).match(/"type":"sim"/g)?.length ?? 0;
  const scenes3d = JSON.stringify(spec).match(/"component":"(atom_3d|nucleus_3d|copper_zoom)"/g)?.length ?? 0;
  const message = `جهّزت درس «${topic.title}»: ${topic.sections.length} أقسام، ${sims} محاكاة تفاعلية (منها ${scenes3d} مشاهد 3D)، تاريخ تخيّل الذرة، رحلة جوه ذرة النحاس، رسم بيانات جايجر ومارسدن مقابل قانون رذرفورد، وأسئلة تشخيصية. كل حاجة اتبنت من الأدوات والبيانات${lessonSlug ? ` واتنشرت في /explore/${lessonSlug}` : ""}.`;
  r.say(message);
  return { message, ui: spec, lessonSlug };
}

function runGenericGenerator(r: Recorder, req: RunRequest, found: SearchResult) {
  const concept = found.concepts[0];
  if (!concept) {
    const message = "مالقيتش موضوع أو مفهوم مطابق في قاعدة المعرفة. جرّب تذكر اسم الظاهرة أو القانون (مثلًا: قانون أوم، التمدد الحراري).";
    r.say(message);
    return { message };
  }
  r.think(`مافيش موضوع جاهز، بس لقيت المفهوم «${concept.title}». هبني مستكشف معادلة تفاعلي من أول معادلة مرتبطة بيه.`);
  const eqs = r.call<{ id: string; name: string }[]>("get_equations", { conceptKeys: [concept.key] });
  if (!eqs.length) {
    const message = `المفهوم «${concept.title}» مالوش معادلات مسجّلة لسه.`;
    r.say(message);
    return { message };
  }
  const block = r.call<UiBlock>("compose_block", { kind: "equation_explorer", equationId: eqs[0].id });
  const spec: UiSpec = { version: "genui/1", title: concept.title, blocks: [block], libraries: ["genui-core", "katex", "mafs", "mathjs-rules"] };
  r.call("validate_ui", { spec });
  r.ui(spec);
  const message = `عملت محاكاة لـ «${eqs[0].name}»: منزلق لكل متغير ورسم بياني للعلاقة.`;
  r.say(message);
  return { message, ui: spec };
}

// ───────────────────────────── Advisor ─────────────────────────────

const PROGRESS_WORDS = ["أذاكر", "اذاكر", "الجاي", "ضعيف", "مستوايا", "مستواي", "تقدمي", "next", "progress", "أبدأ", "ابدأ"];

function runAdvisor(r: Recorder, req: RunRequest) {
  const words = tokens(req.prompt);
  const wantsProgress = PROGRESS_WORDS.some((w) => words.some((x) => x.includes(w.replace(/^ال/, ""))));
  if (wantsProgress) {
    r.think("السؤال عن المسار والمستوى. هشوف نموذج المتعلم وبعدين أرشّح الخطوة الجاية.");
    const state = r.call<{ completed: string[]; weak: { concept: string; mastery: number }[]; errors: Record<string, number> }>("get_learner_state", {});
    const recs = r.call<{ recommendations: { title: string; href: string; reason: string }[]; dominantError: string | null }>("recommend_content", {});
    const top = recs.recommendations[0];
    const weak = state.weak.length ? ` ومحتاج تقوّي: ${state.weak.map((w) => w.concept).join("، ")}.` : "";
    const message = top ? `أنصحك تبدأ بـ «${top.title}» (${top.reason}).${weak}` : `أنت خلّصت كل المسار المتاح!${weak}`;
    r.say(message);
    const ui: UiSpec | undefined = top
      ? { version: "genui/1", title: "خطتك الجاية", blocks: recs.recommendations.slice(0, 3).map((x) => ({ type: "callout" as const, tone: "info" as const, title: x.title, text: `${x.reason} ← ${x.href}` })), libraries: ["genui-core"] }
      : undefined;
    if (ui) r.ui(ui);
    return { message, ui };
  }

  const topicSlug = req.context?.lessonSlug ?? undefined;
  r.think(topicSlug ? `الطالب بيسأل جوه درس «${topicSlug}». هدوّر في الأسئلة الشائعة للموضوع.` : "هدوّر على الموضوع الأقرب للسؤال.");
  const searched = topicSlug ? null : r.call<SearchResult>("search_knowledge", { query: req.prompt });
  const slug = topicSlug ?? searched?.topics[0]?.slug;
  if (slug) {
    const faq = r.call<{ answer: string; conceptKey?: string; visual?: string } | null>("answer_faq", { topic: slug, question: req.prompt });
    if (faq) {
      const blocks: UiBlock[] = [];
      if (faq.conceptKey) {
        const eqs = r.call<{ latex: string; name: string }[]>("get_equations", { conceptKeys: [faq.conceptKey] });
        blocks.push(...eqs.slice(0, 2).map((e) => ({ type: "equation" as const, latex: e.latex, caption: e.name })));
      }
      if (faq.visual) {
        r.think(`الإجابة دي أوضح برسمة: هبني «${faq.visual}» من البيانات.`);
        blocks.push(r.call<UiBlock>("compose_block", { kind: faq.visual, topic: slug }));
      }
      r.say(faq.answer);
      const ui: UiSpec | undefined = blocks.length ? { version: "genui/1", title: "توضيح", blocks, libraries: [...librariesFor(blocks)] } : undefined;
      if (ui) r.ui(ui);
      return { message: faq.answer, ui };
    }
  }
  const found = searched ?? r.call<SearchResult>("search_knowledge", { query: req.prompt });
  const c = found.concepts[0];
  if (c) {
    const eqs = r.call<{ latex: string; name: string }[]>("get_equations", { conceptKeys: [c.key] });
    const message = `سؤالك مرتبط بـ «${c.title}». ${eqs[0] ? `أهم علاقة هنا: $${eqs[0].latex}$.` : ""} جرّب تتوقع الأول، وبعدين اختبر توقعك في المحاكاة.`;
    r.say(message);
    return { message };
  }
  const message = "مش متأكد إني فهمت السؤال. ممكن توضّح أكتر الظاهرة أو الخطوة اللي واقف فيها؟";
  r.say(message);
  return { message };
}

// ───────────────────────────── Entry point ─────────────────────────────

export function runAgent(user: User, req: RunRequest): AgentRun {
  const id = newId("run");
  const r = new Recorder(user);
  let output: AgentRun["output"];
  let status: AgentRun["status"] = "succeeded";
  try {
    output = req.agent === "generator" ? runGenerator(r, req, id) : runAdvisor(r, req);
  } catch (e) {
    status = "failed";
    const msg = e instanceof Error ? e.message : String(e);
    r.say(`حصلت مشكلة: ${msg}`);
    output = { message: msg };
  }
  const run: AgentRun = {
    id,
    agent: req.agent,
    model: MODEL,
    request: req,
    userId: user.id,
    status,
    steps: r.steps,
    output,
    usage: { toolCalls: r.calls, steps: r.steps.length, simulatedLatencyMs: r.latency },
    createdAt: nowIso(),
  };
  return db().agentRuns.insert(run);
}

export function getRun(user: User, id: string) {
  const run = db().agentRuns.get(id);
  if (!run) throw new HttpError(404, "not_found", `run ${id} not found`);
  if (run.userId !== user.id && user.role !== "admin") throw new HttpError(403, "forbidden", "not your run");
  return run;
}

/** Server-sent events that replay the transcript with its simulated timing (time-compressed). */
export function streamRun(run: AgentRun, speed = 2.5): Response {
  const enc = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      let prev = 0;
      for (const step of run.steps) {
        const wait = Math.min(900, (step.at - prev) / speed);
        prev = step.at;
        await new Promise((res) => setTimeout(res, wait));
        controller.enqueue(enc.encode(`event: step\ndata: ${JSON.stringify(step)}\n\n`));
      }
      controller.enqueue(enc.encode(`event: done\ndata: ${JSON.stringify({ id: run.id, status: run.status, output: run.output ? { message: run.output.message, lessonSlug: run.output.lessonSlug } : null })}\n\n`));
      controller.close();
    },
  });
  return new Response(stream, { headers: { "content-type": "text/event-stream; charset=utf-8", "cache-control": "no-cache, no-transform", connection: "keep-alive" } });
}
