/** Server-side learner model (BKT per concept), sessions, events and adaptive recommendations. */
import type { LearnerModel, LearningEvent, Session, User } from "@/lib/domain";
import { emptyState, recordEvent, recordEvidence, type LearnerState } from "@/lib/engine/learnerModel";
import { solverScaffold } from "@/lib/engine/pedagogy";
import type { LearningEvent as RuntimeEvent, StepId } from "@/lib/engine/types";
import { db, newId, nowIso } from "../db/store";
import { forbidden, notFound } from "../http";
import { catalog, summarize } from "./content";

type Row = LearnerModel & { id: string };

function toState(m: LearnerModel): LearnerState {
  return { concepts: m.concepts, errors: m.errors as LearnerState["errors"], completedMissions: m.completedMissions, events: [] };
}

export function learnerModel(userId: string): LearnerModel {
  const row = db().learners.get(userId);
  if (row) {
    const { id: _id, ...m } = row;
    void _id;
    return m;
  }
  const e = emptyState();
  return { userId, concepts: e.concepts, errors: e.errors, completedMissions: [], labProgress: {}, updatedAt: nowIso() };
}

function save(m: LearnerModel) {
  const row: Row = { ...m, id: m.userId, updatedAt: nowIso() };
  if (db().learners.get(m.userId)) db().learners.update(m.userId, row);
  else db().learners.insert(row);
  return learnerModel(m.userId);
}

export function startSession(user: User, input: { contentId: string; mode: Session["mode"]; assignmentId?: string }): Session {
  const session: Session = { id: newId("ses"), userId: user.id, contentId: input.contentId, mode: input.mode, status: "active", startedAt: nowIso(), assignmentId: input.assignmentId };
  return db().sessions.insert(session);
}

export function getSession(user: User, id: string): Session {
  const s = db().sessions.get(id);
  if (!s) throw notFound(`session ${id}`);
  if (s.userId !== user.id && user.role !== "admin") throw forbidden();
  return s;
}

/** Apply a batch of events: log them, update error histogram and BKT mastery. */
export function recordEvents(user: User, sessionId: string | undefined, events: LearningEvent[]) {
  if (sessionId) getSession(user, sessionId);
  let state = toState(learnerModel(user.id));
  for (const e of events) {
    db().events.insert({ ...e, id: newId("evt"), sessionId, userId: user.id });
    const runtime: RuntimeEvent = { missionId: e.contentId, step: e.step as StepId, kind: e.kind as RuntimeEvent["kind"], correct: e.correct, diagnosis: e.diagnosis, detail: e.detail, at: e.at };
    state = recordEvent(state, runtime);
    if (e.evidence) state = recordEvidence(state, e.evidence.conceptKeys, e.evidence.correct, e.evidence.hintsUsed);
  }
  const prev = learnerModel(user.id);
  return save({ ...prev, concepts: state.concepts, errors: state.errors });
}

export function completeSession(user: User, sessionId: string) {
  const s = getSession(user, sessionId);
  db().sessions.update(s.id, { status: "completed", completedAt: nowIso() });
  const m = learnerModel(user.id);
  const mission = db().missions.get(s.contentId);
  if (mission && !m.completedMissions.includes(mission.slug)) save({ ...m, completedMissions: [...m.completedMissions, mission.slug] });
  return { session: db().sessions.get(s.id)!, learner: learnerModel(user.id) };
}

export function markMissionComplete(user: User, slug: string) {
  const m = learnerModel(user.id);
  return m.completedMissions.includes(slug) ? m : save({ ...m, completedMissions: [...m.completedMissions, slug] });
}

export function saveLabProgress(user: User, labSlug: string, solvedLevelIds: string[]) {
  const m = learnerModel(user.id);
  const merged = [...new Set([...(m.labProgress[labSlug] ?? []), ...solvedLevelIds])];
  return save({ ...m, labProgress: { ...m.labProgress, [labSlug]: merged } });
}

const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);

export function masteryOf(m: LearnerModel, conceptIds: string[]) {
  return mean(conceptIds.map((c) => m.concepts[c.replace(/^cpt_/, "")]?.mastery ?? 0));
}

/** Adaptive next steps: unfinished missions whose prerequisites are mastered, then weak concepts. */
export function recommendations(user: User) {
  const m = learnerModel(user.id);
  const s = db();
  const missions = s.missions.list((x) => x.status === "published").sort((a, b) => a.order - b.order);
  const prereqsReady = (conceptIds: string[]) =>
    conceptIds.every((cid) => (s.concepts.get(cid)?.prerequisites ?? []).every((p) => (m.concepts[p.replace(/^cpt_/, "")]?.mastery ?? 0) >= 0.4 || !missions.some((x) => x.conceptIds.includes(p))));
  const recs = [];
  const next = missions.find((x) => !m.completedMissions.includes(x.slug) && prereqsReady(x.conceptIds)) ?? missions.find((x) => !m.completedMissions.includes(x.slug));
  if (next) {
    const mastery = masteryOf(m, next.conceptIds);
    recs.push({ contentId: next.id, slug: next.slug, type: "mission", title: next.title, href: `/learn/${next.slug}`, reason: m.completedMissions.length ? "الخطوة الجاية في مسارك — المتطلبات السابقة جاهزة." : "ابدأ من هنا.", action: { kind: "advance" as const, message: `الإرشاد: ${solverScaffold(mastery)}` } });
  }
  const weak = Object.entries(m.concepts)
    .filter(([, c]) => c.attempts > 0 && c.mastery < 0.5)
    .sort((a, b) => a[1].mastery - b[1].mastery)
    .slice(0, 3);
  for (const [key] of weak) {
    const item = catalog({ concept: key }).find((c) => c.type === "lab" || c.type === "workbench" || c.type === "phenomenon");
    if (item) recs.push({ contentId: item.id, slug: item.slug, type: item.type, title: item.title, href: item.href, reason: `مفهوم محتاج تقوية: ${s.concepts.get(`cpt_${key}`)?.title ?? key}`, action: { kind: "experiment" as const, message: "جرّب الفكرة بإيدك قبل ما تكمّل." } });
  }
  const top = Object.entries(m.errors).sort((a, b) => b[1] - a[1])[0];
  return { recommendations: recs, dominantError: top && top[1] > 0 ? top[0] : null };
}

export function studentDashboard(user: User) {
  const m = learnerModel(user.id);
  const s = db();
  const classIds = s.enrollments.list((e) => e.studentId === user.id).map((e) => e.classroomId);
  const assignments = s.assignments.list((a) => classIds.includes(a.classroomId)).flatMap((a) => {
    const c = s.missions.get(a.contentId) ?? s.labs.get(a.contentId) ?? s.workbench.get(a.contentId) ?? s.phenomena.get(a.contentId) ?? s.exams.get(a.contentId);
    if (!c) return [];
    const done = c.type === "mission" ? m.completedMissions.includes(c.slug) : c.type === "lab" ? (m.labProgress[c.slug]?.length ?? 0) > 0 : s.sessions.list((x) => x.userId === user.id && x.contentId === c.id && x.status === "completed").length > 0;
    return [{ assignmentId: a.id, content: summarize(c), dueAt: a.dueAt, done }];
  });
  const bySubject: Record<string, number[]> = {};
  for (const c of s.concepts.list()) {
    const key = s.subjects.get(c.subjectId)?.key ?? "physics";
    const st = m.concepts[c.key];
    if (st) (bySubject[key] ??= []).push(st.mastery);
  }
  const recs = recommendations(user).recommendations;
  return {
    next: recs[0] ?? null,
    recommendations: recs,
    assignments,
    masteryBySubject: Object.fromEntries(Object.entries(bySubject).map(([k, v]) => [k, mean(v)])),
    errors: m.errors,
  };
}
