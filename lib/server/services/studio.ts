/** Teacher authoring: drafts from templates/scratch/forks, validation, publishing, versions, AI jobs. */
import type { z } from "zod";
import * as D from "@/lib/domain";
import type { AIGenerationJob, AIGenerationRequest, ContentType, StudioDraft, User, ValidationIssue } from "@/lib/domain";
import { lintOutcome } from "@/lib/engines/outcomeRules";
import { validateGraph } from "@/lib/workbench/graph";
import { db, newId, nowIso } from "../db/store";
import { badRequest, forbidden, notFound, requireRole } from "../http";

const SCHEMA: Partial<Record<ContentType, z.ZodTypeAny>> = { mission: D.Mission, lab: D.Lab, phenomenon: D.Phenomenon, workbench: D.WorkbenchProblem, exam: D.Exam, visualization: D.Visualization };
const PREFIX: Record<ContentType, string> = { mission: "msn", lab: "lab", phenomenon: "phn", workbench: "wbp", exam: "exm", visualization: "vis" };
const COLLECTION = { mission: "missions", lab: "labs", phenomenon: "phenomena", workbench: "workbench", exam: "exams" } as const;

/** Replace {{slot}} placeholders. A string that is exactly "{{slot}}" takes the slot's raw value (arrays, numbers). */
export function fillTemplate(value: unknown, slots: Record<string, unknown>): unknown {
  if (typeof value === "string") {
    const whole = value.match(/^\{\{(\w+)\}\}$/);
    if (whole) return slots[whole[1]] ?? value;
    return value.replace(/\{\{(\w+)\}\}/g, (_m, k) => (slots[k] === undefined ? `{{${k}}}` : String(slots[k])));
  }
  if (Array.isArray(value)) return value.map((v) => fillTemplate(v, slots));
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fillTemplate(v, slots)]));
  return value;
}

function ownDraft(user: User, id: string) {
  const d = db().drafts.get(id);
  if (!d) throw notFound(`draft ${id}`);
  if (d.ownerId !== user.id && user.role !== "admin") throw forbidden();
  return d;
}

export function listDrafts(user: User) {
  requireRole(user, "teacher");
  return db().drafts.list((d) => d.ownerId === user.id || user.role === "admin");
}

export function createDraft(user: User, input: { contentType?: ContentType; templateId?: string; slots?: Record<string, unknown>; forkOf?: string; title?: string; content?: Record<string, unknown> }) {
  requireRole(user, "teacher");
  const s = db();
  let source: StudioDraft["source"] = { kind: "scratch" };
  let contentType: ContentType = input.contentType ?? "mission";
  let content: Record<string, unknown> = input.content ?? {};
  if (input.templateId) {
    const t = s.templates.get(input.templateId);
    if (!t) throw notFound(`template ${input.templateId}`);
    contentType = t.contentType;
    content = fillTemplate(t.skeleton, input.slots ?? {}) as Record<string, unknown>;
    source = { kind: "template", templateId: t.id };
  } else if (input.forkOf) {
    const c = s.missions.get(input.forkOf) ?? s.labs.get(input.forkOf) ?? s.phenomena.get(input.forkOf) ?? s.workbench.get(input.forkOf) ?? s.exams.get(input.forkOf);
    if (!c) throw notFound(`content ${input.forkOf}`);
    contentType = c.type;
    const { id: _id, version: _v, status: _s, authorId: _a, createdAt: _c, updatedAt: _u, ...rest } = structuredClone(c) as Record<string, unknown>;
    void [_id, _v, _s, _a, _c, _u];
    content = { ...rest, title: `${String(rest.title)} (نسخة)`, slug: `${String(rest.slug)}-copy` };
    source = { kind: "fork", contentId: c.id };
  }
  const draft: StudioDraft = {
    id: newId("drf"),
    contentType,
    title: input.title ?? String(content.title ?? "مسودة جديدة"),
    ownerId: user.id,
    source,
    content,
    issues: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  db().drafts.insert(draft);
  return validateDraft(user, draft.id);
}

export function getDraft(user: User, id: string) {
  return ownDraft(user, id);
}

export function updateDraft(user: User, id: string, patch: { title?: string; content?: Record<string, unknown> }) {
  const d = ownDraft(user, id);
  db().drafts.update(id, { title: patch.title ?? d.title, content: patch.content ? { ...d.content, ...patch.content } : d.content, updatedAt: nowIso() });
  return validateDraft(user, id);
}

export function deleteDraft(user: User, id: string) {
  ownDraft(user, id);
  db().drafts.remove(id);
  return { deleted: id };
}

/** Fill the authoring metadata a published record needs, so validation focuses on the body. */
function materialize(d: StudioDraft, user: User, id: string, version: number) {
  const now = nowIso();
  const c = d.content as Record<string, unknown>;
  return {
    status: "published",
    locale: "ar-EG",
    tagline: "",
    icon: "Sparkles",
    subject: "physics",
    conceptIds: [],
    outcomeIds: [],
    difficulty: 2,
    estimatedMinutes: 20,
    tags: ["teacher-made"],
    ...c,
    id,
    slug: String(c.slug ?? id.replace(/^[a-z]+_/, "")),
    type: d.contentType,
    title: String(c.title ?? d.title),
    version,
    authorId: user.id,
    createdAt: d.createdAt,
    updatedAt: now,
  };
}

export function validateDraft(user: User, id: string): StudioDraft {
  const d = ownDraft(user, id);
  const issues: ValidationIssue[] = [];
  const schema = SCHEMA[d.contentType];
  const candidate = materialize(d, user, d.publishedContentId ?? `${PREFIX[d.contentType]}_draft`, 1);
  if (schema) {
    const r = schema.safeParse(candidate);
    if (!r.success) for (const i of r.error.issues.slice(0, 30)) issues.push({ level: "error", path: i.path.join("."), message: i.message });
  }
  // Placeholders left unfilled.
  const text = JSON.stringify(d.content);
  for (const m of text.matchAll(/\{\{(\w+)\}\}/g)) issues.push({ level: "error", path: m[1], message: `fill the "${m[1]}" slot` });
  // Domain checks beyond the schema.
  const exp = (d.content as { experiment?: { outcome?: D.OutcomeSpec; params?: { key: string }[] } }).experiment;
  if (exp?.outcome && Array.isArray(exp.params)) for (const p of lintOutcome(exp.outcome, exp.params.map((x) => x.key))) issues.push({ level: "error", path: "experiment.outcome", message: p });
  const spec = (d.content as { spec?: { graph?: D.SolutionGraph; symbols?: Record<string, unknown> } }).spec;
  if (spec?.graph && spec.graph.nodes?.length) for (const g of validateGraph(spec.graph, Object.keys(spec.symbols ?? {}))) issues.push({ level: g.level, path: "spec.graph", message: g.message_ar });
  for (const cid of ((d.content as { conceptIds?: string[] }).conceptIds ?? [])) if (!db().concepts.get(cid)) issues.push({ level: "warning", path: "conceptIds", message: `unknown concept ${cid}` });
  return db().drafts.update(id, { issues, updatedAt: nowIso() })!;
}

export function publishDraft(user: User, id: string, note?: string) {
  const d = validateDraft(user, id);
  const errors = d.issues.filter((i) => i.level === "error");
  if (errors.length) throw badRequest("draft has validation errors", errors);
  if (d.contentType === "visualization") {
    const vis = db().visualizations.insert({ ...(d.content as object), id: d.publishedContentId ?? newId("vis") } as D.Visualization);
    return { draft: db().drafts.update(id, { publishedContentId: vis.id })!, content: vis, version: null };
  }
  const contentId = d.publishedContentId ?? newId(PREFIX[d.contentType]);
  const versions = db().versions.list((v) => v.contentId === contentId);
  const version = versions.length + 1;
  const record = SCHEMA[d.contentType]!.parse(materialize(d, user, contentId, version));
  const col = db()[COLLECTION[d.contentType as keyof typeof COLLECTION]] as unknown as { get(id: string): unknown; insert(x: unknown): unknown; update(id: string, x: unknown): unknown };
  if (col.get(contentId)) col.update(contentId, record);
  else col.insert(record);
  const v = db().versions.insert({ id: newId("ver"), contentId, version, snapshot: record, publishedBy: user.id, publishedAt: nowIso(), note });
  return { draft: db().drafts.update(id, { publishedContentId: contentId, updatedAt: nowIso() })!, content: record, version: v };
}

export function contentVersions(contentId: string) {
  return db().versions.list((v) => v.contentId === contentId).sort((a, b) => a.version - b.version);
}

// ───────────────────────────── AI generation (deterministic mock) ─────────────────────────────

/**
 * Builds a structured draft from the request: picks the concept, an equation linked to it, and
 * a template, and writes Arabic scaffolding text. The interface matches an LLM-backed generator,
 * which can later replace this function without changing the API.
 */
export function generate(user: User, req: AIGenerationRequest): AIGenerationJob {
  requireRole(user, "teacher");
  const s = db();
  const concept = s.concepts.get(req.conceptIds[0] ?? "") ?? s.concepts.list().find((c) => req.prompt.includes(c.title)) ?? s.concepts.get("cpt_dynamics.newton2")!;
  const equation = s.equations.list((e) => e.conceptIds.includes(concept.id))[0];
  const job: AIGenerationJob = { id: newId("job"), request: req, requestedBy: user.id, status: "running", generator: "template-mock", createdAt: nowIso() };
  s.jobs.insert(job);
  const [target, expr] = (equation?.relation ?? "y = x").split("=").map((x) => x.trim());
  const vars = [...new Set((expr.match(/[A-Za-zͰ-Ͽ][A-Za-z0-9Ͱ-Ͽ]*/g) ?? []).filter((v) => !["pi", "e", "sqrt", "sin", "cos", "tan", "exp", "abs"].includes(v)))].slice(0, 3);
  const params = vars.map((v) => ({ key: v, label: v, symbol: v, min: 1, max: 10, step: 0.5, unit: "", default: 5 }));
  const slotValues = {
    title: `${concept.title}: درس مولّد`,
    story: `موقف من الحياة اليومية عن ${concept.title}. ${req.prompt}`,
    goal: `اكتشف العلاقة اللي بتحكم ${concept.title}.`,
    conceptKey: concept.key,
    relation: equation?.latex ?? "",
    params,
    success: params.length ? `${params[0].key} > 5` : "true",
  };
  let draft: StudioDraft;
  if (req.kind === "exam") draft = createDraft(user, { templateId: "tpl_exam", slots: { title: `امتحان: ${concept.title}`, timeLimitSec: 300 } });
  else if (req.kind === "visualization") draft = createDraft(user, { templateId: "tpl_visualization", slots: { title: concept.title, expr: expr ?? "x" } });
  else {
    draft = createDraft(user, { templateId: req.kind === "lab" ? "tpl_rules_lab" : "tpl_discovery_lesson", slots: { ...slotValues, readouts: params.length ? [{ label: target ?? "y", expr: expr ?? "0", unit: "", digits: 2 }] : [] } });
    draft = updateDraft(user, draft.id, {
      content: {
        conceptIds: [concept.id],
        equationIds: equation ? [equation.id] : [],
        groundTruth: equation ? `${equation.name}: ${equation.relation}` : concept.title,
        experiment: { ...(draft.content.experiment as object), simulationId: "sim_generated", engineId: "rules", instruction: "حرّك المتغيرات وراقب النتيجة.", outcome: { kind: "rules", readouts: params.length ? [{ label: target ?? "y", expr: expr ?? "0", unit: "", digits: 2 }] : [], success: slotValues.success, messages: [{ when: slotValues.success, text: "ممتاز! لاحظ العلاقة." }, { when: "true", text: "جرّب قيم تانية." }] } },
      },
    });
  }
  db().drafts.update(draft.id, { source: { kind: "ai", jobId: job.id } });
  return s.jobs.update(job.id, { status: "succeeded", draftId: draft.id, finishedAt: nowIso() })!;
}

export function getJob(user: User, id: string) {
  const j = db().jobs.get(id);
  if (!j) throw notFound(`job ${id}`);
  if (j.requestedBy !== user.id && user.role !== "admin") throw forbidden();
  return { job: j, draft: j.draftId ? db().drafts.get(j.draftId) ?? null : null };
}
