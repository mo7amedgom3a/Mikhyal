/** Content catalog, lookups by id or slug, and the knowledge graph. */
import type { ContentSummary, Exam, KnowledgeGraph, ListQuery } from "@/lib/domain";
import { db } from "../db/store";
import { notFound } from "../http";

type Store = ReturnType<typeof db>;
type ContentCollection = "missions" | "labs" | "phenomena" | "workbench" | "exams";

const HREF = {
  mission: (slug: string) => `/learn/${slug}`,
  lab: (slug: string) => `/play/${slug}`,
  phenomenon: (slug: string) => `/phenomena/${slug}`,
  workbench: (slug: string) => `/workbench/${slug}`,
  exam: (slug: string) => `/learn/${slug}?mode=exam`,
  visualization: (slug: string) => `/visualizations/${slug}`,
} as const;

/** Find a content record by id ("msn_braking") or slug ("braking"). */
export function findContent<K extends ContentCollection>(kind: K, idOrSlug: string): ReturnType<Store[K]["list"]>[number] {
  const col = db()[kind] as unknown as { get(id: string): { slug: string } | undefined; list(): { slug: string; status: string }[] };
  const hit = col.get(idOrSlug) ?? col.list().find((c) => c.slug === idOrSlug);
  if (!hit) throw notFound(`${kind.replace(/s$/, "")} ${idOrSlug}`);
  return hit as ReturnType<Store[K]["list"]>[number];
}

export function summarize(c: { id: string; slug: string; type: ContentSummary["type"]; title: string; tagline: string; icon: string; subject: ContentSummary["subject"]; conceptIds: string[]; difficulty: number; estimatedMinutes: number; status: ContentSummary["status"]; version: number; authorId: string; tags: string[]; order?: number }): ContentSummary {
  return {
    id: c.id,
    slug: c.slug,
    type: c.type,
    title: c.title,
    tagline: c.tagline,
    icon: c.icon,
    subject: c.subject,
    conceptIds: c.conceptIds,
    difficulty: c.difficulty,
    estimatedMinutes: c.estimatedMinutes,
    status: c.status,
    version: c.version,
    authorId: c.authorId,
    tags: c.tags,
    order: c.order,
    href: HREF[c.type](c.slug),
  };
}

export function catalog(q: ListQuery = {}): ContentSummary[] {
  const s = db();
  const all = [...s.missions.list(), ...s.labs.list(), ...s.phenomena.list(), ...s.workbench.list(), ...s.exams.list()].map(summarize);
  const text = q.q?.toLowerCase();
  return all
    .filter((c) => (q.status ? c.status === q.status : c.status === "published"))
    .filter((c) => !q.type || c.type === q.type)
    .filter((c) => !q.subject || c.subject === q.subject)
    .filter((c) => !q.concept || c.conceptIds.includes(q.concept) || c.conceptIds.includes(`cpt_${q.concept}`))
    .filter((c) => !text || `${c.slug} ${c.title} ${c.tagline} ${c.tags.join(" ")}`.toLowerCase().includes(text))
    .sort((a, b) => a.type.localeCompare(b.type) || (a.order ?? 99) - (b.order ?? 99));
}

export function missionDetail(idOrSlug: string) {
  const mission = findContent("missions", idOrSlug);
  const exam = db().exams.get(mission.examId) as Exam | undefined;
  const equations = mission.equationIds.map((id) => db().equations.get(id)).filter(Boolean);
  const simulation = db().simulations.get(mission.experiment.simulationId);
  return { mission, exam: exam ?? null, equations, simulation: simulation ?? null };
}

export function conceptDetail(idOrKey: string) {
  const s = db();
  const concept = s.concepts.get(idOrKey) ?? s.concepts.get(`cpt_${idOrKey}`);
  if (!concept) throw notFound(`concept ${idOrKey}`);
  return {
    concept,
    prerequisites: concept.prerequisites.map((id) => s.concepts.get(id)!),
    unlocks: s.concepts.list((c) => c.prerequisites.includes(concept.id)),
    equations: s.equations.list((e) => e.conceptIds.includes(concept.id)),
    misconceptions: s.misconceptions.list((m) => m.conceptIds.includes(concept.id)),
    outcomes: s.outcomes.list((o) => o.conceptIds.includes(concept.id)),
    content: catalog({ concept: concept.id }),
  };
}

export function knowledgeGraph(): KnowledgeGraph {
  const s = db();
  const subjectKey = Object.fromEntries(s.subjects.list().map((x) => [x.id, x.key]));
  const nodes: KnowledgeGraph["nodes"] = [
    ...s.concepts.list().map((c) => ({ id: c.id, kind: "concept" as const, label: c.title, subject: subjectKey[c.subjectId] })),
    ...s.equations.list().map((e) => ({ id: e.id, kind: "equation" as const, label: e.latex })),
    ...catalog().map((c) => ({ id: c.id, kind: "content" as const, label: c.title, subject: c.subject })),
  ];
  const edges: KnowledgeGraph["edges"] = [
    ...s.concepts.list().flatMap((c) => c.prerequisites.map((p) => ({ from: p, to: c.id, type: "prerequisite" as const }))),
    ...s.concepts.list().flatMap((c) => c.related.map((r) => ({ from: c.id, to: r, type: "related" as const }))),
    ...s.equations.list().flatMap((e) => e.conceptIds.map((c) => ({ from: c, to: e.id, type: "uses_equation" as const }))),
    ...catalog().flatMap((c) => c.conceptIds.map((cid) => ({ from: cid, to: c.id, type: (c.type === "exam" ? "assessed_by" : "taught_by") as "assessed_by" | "taught_by" }))),
  ];
  return { nodes, edges };
}

/** Published missions in path order (full records, for server-rendered pages). */
export function publishedMissions() {
  return db()
    .missions.list((m) => m.status === "published")
    .sort((a, b) => a.order - b.order);
}
