/**
 * Tool handlers the agents call. Each returns a JSON-serialisable result plus a short summary
 * for the run transcript. They read and write the same store the REST endpoints use.
 */
import { UiSpec, type UiBlock, type User } from "@/lib/domain";
import { compileRule } from "@/lib/engines/outcomeRules";
import { db, newId, nowIso } from "../db/store";
import { badRequest, notFound } from "../http";
import { catalog } from "../services/content";
import { learnerModel, recommendations } from "../services/learner";
import { composeBlock, equationsFor, topicOf } from "./builders";
import { LIBRARIES, TOOLS } from "./catalog";

export interface ToolContext {
  user: User;
}
export interface ToolOutput {
  result: unknown;
  summary: string;
}
type Handler = (args: Record<string, unknown>, ctx: ToolContext) => ToolOutput;

const str = (v: unknown, name: string) => {
  if (typeof v !== "string" || !v) throw badRequest(`${name} must be a non-empty string`);
  return v;
};
const strs = (v: unknown) => (Array.isArray(v) ? v.map(String) : []);

/** Arabic-aware tokenizer for matching: strips the definite article and short words. */
export function tokens(text: string) {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter((w) => w.length > 1)
    .flatMap((w) => [w, w.replace(/^ال/, "")]);
}

function score(text: string, keywords: string[]) {
  const t = tokens(text);
  return keywords.filter((k) => t.some((w) => w.includes(k.toLowerCase().replace(/^ال/, "")) || k.toLowerCase().includes(w))).length;
}

/** Free names a sim makes available to its readouts, plots and observations. */
function simVars(block: Extract<UiBlock, { type: "sim" }>) {
  const vars = new Set(block.params.map((p) => p.key));
  for (const c of block.choices ?? []) for (const o of c.options) for (const k of Object.keys(o.values)) vars.add(k);
  return [...vars];
}

export function validateSpec(raw: unknown) {
  const parsed = UiSpec.safeParse(raw);
  if (!parsed.success) return { valid: false, issues: parsed.error.issues.slice(0, 20).map((i) => `${i.path.join(".")}: ${i.message}`) };
  const issues: string[] = [];
  const provided = new Set(LIBRARIES.flatMap((l) => l.provides));
  const walk = (blocks: UiBlock[], vars: string[], path: string) =>
    blocks.forEach((b, i) => {
      const at = `${path}[${i}]`;
      const tryExpr = (expr: string, names: string[], where: string) => {
        try {
          compileRule(expr, names);
        } catch (e) {
          issues.push(`${at}.${where}: ${e instanceof Error ? e.message : e}`);
        }
      };
      if (b.type === "sim") {
        const v = simVars(b);
        b.readouts.forEach((r, j) => tryExpr(r.expr, v, `readouts[${j}]`));
        (b.observations ?? []).forEach((o, j) => tryExpr(o.when, v, `observations[${j}]`));
        walk(b.children, v, `${at}.children`);
      } else if (b.type === "section") walk(b.children, vars, `${at}.children`);
      else if (b.type === "plot") b.series.forEach((s, j) => tryExpr(s.expr, ["x", ...vars], `series[${j}]`));
      else if (b.type === "scene") {
        if (!provided.has(`scene:${b.component}`)) issues.push(`${at}: no library renders scene "${b.component}"`);
        for (const [prop, key] of Object.entries(b.bind ?? {})) if (!vars.includes(key)) issues.push(`${at}.bind.${prop}: "${key}" is not a sim value`);
      } else if (b.type === "quiz" && !b.options.some((o) => o.id === b.correctId)) issues.push(`${at}: correctId not among options`);
    });
  walk(parsed.data.blocks, [], "blocks");
  const unknownLibs = parsed.data.libraries.filter((l) => !LIBRARIES.some((x) => x.id === l));
  if (unknownLibs.length) issues.push(`unknown libraries: ${unknownLibs.join(", ")}`);
  return { valid: issues.length === 0, issues };
}

export const TOOL_HANDLERS: Record<string, Handler> = {
  search_knowledge: (args) => {
    const query = str(args.query, "query");
    const topics = db()
      .topics.list()
      .map((t) => ({ slug: t.slug, title: t.title, score: score(query, t.keywords) }))
      .filter((t) => t.score > 0)
      .sort((a, b) => b.score - a.score);
    const concepts = db()
      .concepts.list()
      .map((c) => ({ key: c.key, title: c.title, score: score(query, [c.title, ...c.title.split(" "), c.key.split(".").pop() ?? ""]) }))
      .filter((c) => c.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 5);
    const content = catalog({ q: query }).slice(0, 5).map((c) => ({ id: c.id, title: c.title, href: c.href }));
    return { result: { topics, concepts, content }, summary: `${topics.length} موضوع، ${concepts.length} مفهوم، ${content.length} محتوى` };
  },

  get_topic: (args) => {
    const t = topicOf(str(args.slug, "slug"));
    return { result: { slug: t.slug, title: t.title, conceptKeys: t.conceptKeys, sections: t.sections.map((s) => ({ id: s.id, title: s.title, goal: s.goal, build: s.build })) }, summary: `${t.title} — ${t.sections.length} أقسام` };
  },

  get_concepts: (args) => {
    const keys = strs(args.keys);
    const items = keys.map((k) => db().concepts.get(`cpt_${k}`)).filter(Boolean);
    return { result: items.map((c) => ({ key: c!.key, title: c!.title, prerequisites: c!.prerequisites })), summary: `${items.length} مفهوم` };
  },

  get_equations: (args) => {
    const eqs = equationsFor(strs(args.conceptKeys));
    return { result: eqs.map((e) => ({ id: e.id, name: e.name, latex: e.latex, relation: e.relation, assumptions: e.assumptions })), summary: `${eqs.length} معادلة` };
  },

  get_elements: (args) => {
    const symbols = strs(args.symbols);
    const els = db().elements.list((e) => !symbols.length || symbols.includes(e.symbol));
    return { result: els, summary: els.map((e) => e.symbol).join("، ") };
  },

  get_dataset: (args) => {
    const ds = db().datasets.get(str(args.id, "id"));
    if (!ds) throw notFound(`dataset ${String(args.id)}`);
    return { result: ds, summary: `${ds.title}: ${ds.rows.length} قراءة` };
  },

  list_libraries: () => ({ result: LIBRARIES, summary: LIBRARIES.map((l) => l.id).join("، ") }),

  compose_block: (args) => {
    const block = composeBlock(str(args.kind, "kind"), { topic: args.topic as string | undefined, section: args.section as string | undefined, equationId: args.equationId as string | undefined });
    const label = block.type === "sim" ? `محاكاة «${block.title}»` : block.type === "scene" ? `مشهد ${block.component}` : block.type === "plot" ? "رسم بياني" : block.type;
    return { result: block, summary: label };
  },

  validate_ui: (args) => {
    const r = validateSpec(args.spec);
    return { result: r, summary: r.valid ? "الواجهة سليمة ✓" : `${r.issues.length} مشكلة` };
  },

  publish_lesson: (args, ctx) => {
    const slug = str(args.slug, "slug");
    const v = validateSpec(args.spec);
    if (!v.valid) throw badRequest("spec is invalid", v.issues);
    const spec = UiSpec.parse(args.spec);
    const topic = db().topics.list((t) => t.slug === slug)[0];
    const existing = db().lessons.list((l) => l.slug === slug)[0];
    const lesson = {
      id: existing?.id ?? newId("lsn"),
      slug,
      title: spec.title,
      subject: "physics" as const,
      conceptIds: (topic?.conceptKeys ?? []).map((k) => `cpt_${k}`),
      ui: spec,
      runId: String(args.runId ?? ""),
      status: "published" as const,
      createdAt: nowIso(),
    };
    if (existing) db().lessons.update(existing.id, lesson);
    else db().lessons.insert(lesson);
    void ctx;
    return { result: { slug, href: `/explore/${slug}` }, summary: `اتنشر في /explore/${slug}` };
  },

  answer_faq: (args) => {
    const t = topicOf(str(args.topic, "topic"));
    const q = str(args.question, "question");
    const ranked = t.faq.map((f) => ({ f, s: score(q, f.keywords) })).sort((a, b) => b.s - a.s);
    const best = ranked[0]?.s ? ranked[0].f : null;
    return { result: best ? { answer: best.answer, conceptKey: best.conceptKey } : null, summary: best ? "لقيت إجابة في قاعدة المعرفة" : "مفيش إجابة مطابقة" };
  },

  get_learner_state: (_args, ctx) => {
    const m = learnerModel(ctx.user.id);
    const weak = Object.entries(m.concepts)
      .filter(([, c]) => c.mastery < 0.5)
      .map(([k, c]) => ({ concept: k, mastery: +c.mastery.toFixed(2) }));
    return { result: { completed: m.completedMissions, weak, errors: m.errors }, summary: `${m.completedMissions.length} مهمة مكتملة، ${weak.length} مفهوم ضعيف` };
  },

  recommend_content: (_args, ctx) => {
    const r = recommendations(ctx.user);
    return { result: r, summary: r.recommendations.map((x) => x.title).slice(0, 3).join("، ") || "لا شيء" };
  },
};

export function invokeTool(name: string, args: Record<string, unknown>, ctx: ToolContext): ToolOutput {
  const h = TOOL_HANDLERS[name];
  if (!h || !TOOLS.some((t) => t.name === name)) throw notFound(`tool ${name}`);
  return h(args, ctx);
}
