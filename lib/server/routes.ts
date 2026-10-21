/**
 * All v1 route handlers in one place. Files under app/api/v1/** re-export these, and the
 * endpoint table in ./endpoints.ts documents the same handlers for OpenAPI.
 */
import { NextResponse } from "next/server";
import * as D from "@/lib/domain";
import { validateGraph } from "@/lib/workbench/graph";
import type { SolutionGraph } from "@/lib/workbench/types";
import type { TutorRequest } from "@/lib/engine/tutor";
import { db } from "./db/store";
import { badRequest, notFound, page, requireRole, route, USER_COOKIE } from "./http";
import { DEMO_USERS } from "./seed/people";
import { catalog, conceptDetail, findContent, knowledgeGraph, missionDetail } from "./services/content";
import * as grading from "./services/grading";
import * as learner from "./services/learner";
import * as people from "./services/people";
import * as studio from "./services/studio";
import { tutorReply } from "./services/tutor";
import { openApiDocument } from "./openapi";

// ── Meta & auth ─────────────────────────────────────────────────────────────
export const health = route(() => ({ status: "ok", store: "memory", counts: Object.fromEntries(Object.entries(db()).map(([k, v]) => [k, (v as { count(): number }).count()])) }));
export const openapi = route(() => openApiDocument());
export const demoLogin = route(
  ({ body }) => {
    const userId = DEMO_USERS[body.role];
    const res = NextResponse.json({ user: db().users.get(userId) });
    res.cookies.set(USER_COOKIE, userId, { path: "/", sameSite: "lax", httpOnly: false });
    return res;
  },
  { body: D.DemoLoginBody },
);
export const me = route(({ user }) => ({ user: user() }));

// ── Curriculum & knowledge graph ────────────────────────────────────────────
export const subjects = route(() => ({ items: db().subjects.list() }));
export const curriculum = route(() => ({ subjects: db().subjects.list(), units: db().units.list(), outcomes: db().outcomes.list() }));
export const concepts = route(({ query }) => page(db().concepts.list((c) => !query.subject || c.subjectId === `sbj_${query.subject}`), query), { query: D.ListQuery });
export const concept = route(({ params }) => conceptDetail(params.id));
export const graph = route(() => knowledgeGraph());
export const equations = route(({ query }) => page(db().equations.list((e) => !query.concept || e.conceptIds.includes(query.concept)), query), { query: D.ListQuery });
export const equation = route(({ params }) => {
  const e = db().equations.get(params.id);
  if (!e) throw notFound(`equation ${params.id}`);
  return { equation: e, quantities: e.quantityIds.map((q) => db().quantities.get(q)), concepts: e.conceptIds.map((c) => db().concepts.get(c)) };
});
export const quantities = route(({ query }) => page(db().quantities.list(), query), { query: D.ListQuery });
export const misconceptions = route(({ query }) => page(db().misconceptions.list((m) => !query.concept || m.conceptIds.includes(query.concept)), query), { query: D.ListQuery });

// ── Catalog, templates, simulations ─────────────────────────────────────────
export const catalogList = route(({ query }) => page(catalog(query), query), { query: D.ListQuery });
export const templates = route(() => ({ items: db().templates.list() }));
export const simulations = route(({ query }) => page(db().simulations.list((s) => !query.type || s.kind === query.type), query), { query: D.ListQuery });
export const simulation = route(({ params }) => {
  const s = db().simulations.get(params.id);
  if (!s) throw notFound(`simulation ${params.id}`);
  return { simulation: s, visualComponents: s.visualComponentIds.map((id) => db().visualComponents.get(id)) };
});
export const visualComponents = route(() => ({ items: db().visualComponents.list() }));

// ── Content ─────────────────────────────────────────────────────────────────
export const missions = route(({ query }) => page(catalog({ ...query, type: "mission" }), query), { query: D.ListQuery });
export const mission = route(({ params }) => missionDetail(params.id));
export const labs = route(({ query }) => page(catalog({ ...query, type: "lab" }), query), { query: D.ListQuery });
export const lab = route(({ params }) => ({ lab: findContent("labs", params.id) }));
export const phenomena = route(({ query }) => page(db().phenomena.list((p) => p.status === "published" && (!query.type || p.category === query.type)), query), { query: D.ListQuery });
export const phenomenon = route(({ params }) => {
  const p = findContent("phenomena", params.id);
  return { phenomenon: p, simulation: db().simulations.get(p.simulationId) ?? null };
});
export const workbenchProblems = route(({ query }) => page(catalog({ ...query, type: "workbench" }), query), { query: D.ListQuery });
export const workbenchProblem = route(({ params }) => ({ problem: findContent("workbench", params.id) }));
export const exam = route(({ params }) => ({ exam: findContent("exams", params.id) }));

// ── Grading ─────────────────────────────────────────────────────────────────
export const predict = route(({ params, body }) => grading.gradePrediction(params.id, body.choiceId), { body: D.PredictBody });
export const checkEquation = route(({ params, body }) => grading.gradeEquation(params.id, body.input, body), { body: D.CheckInputBody });
export const checkAnswer = route(({ params, body }) => grading.gradeAnswer(params.id, body.input, body), { body: D.CheckInputBody });
export const phenomenonAnswer = route(({ params, body }) => grading.gradePhenomenon(params.id, body.input), { body: D.CheckInputBody });
export const examSubmit = route(({ params, body }) => grading.submitExam(params.id, body.answers, body.elapsedSec), { body: D.ExamSubmitBody });
export const workbenchValidate = route(
  ({ params, body }) =>
    grading.validateWorkbench(
      params.id,
      body.steps.map((s) => ({ ...s, expression_ast: null, ast_version: "mathjson/1" as const })),
      { priorFailedAttempts: body.prior_failed_attempts, mastery: body.mastery },
    ),
  { body: D.WorkbenchValidateBody },
);
export const subtleList = route(() => ({ items: grading.subtleCases() }));
export const subtleAnalyze = route(({ body }) => grading.subtleAnalyze(body.caseId, body.assumed), { body: D.SubtleAnalyzeBody });
export const outcomeEvaluate = route(({ body }) => grading.evaluateOutcome(body.outcome, body.params), { body: D.OutcomeEvaluateBody });

// ── Runtime ─────────────────────────────────────────────────────────────────
export const startSession = route(({ user, body }) => learner.startSession(user(), body), { body: D.StartSessionBody, status: 201 });
export const session = route(({ user, params }) => {
  const s = learner.getSession(user(), params.id);
  return { session: s, events: db().events.list((e) => e.sessionId === s.id) };
});
export const sessionEvents = route(({ user, params, body }) => ({ learner: learner.recordEvents(user(), params.id, body.events) }), { body: D.EventsBody });
export const completeSession = route(({ user, params }) => learner.completeSession(user(), params.id));
export const tutor = route(({ body }) => tutorReply(body as TutorRequest), { body: D.TutorBody });

// ── Learner (me) ────────────────────────────────────────────────────────────
export const myLearner = route(({ user }) => learner.learnerModel(user().id));
export const myEvents = route(({ user, body }) => ({ learner: learner.recordEvents(user(), undefined, body.events) }), { body: D.EventsBody });
export const myProgress = route(({ user }) => {
  const m = learner.learnerModel(user().id);
  const missions = db().missions.list((x) => x.status === "published");
  return {
    completedMissions: m.completedMissions,
    labProgress: m.labProgress,
    missions: missions.map((x) => ({ id: x.id, slug: x.slug, mastery: learner.masteryOf(m, x.conceptIds), done: m.completedMissions.includes(x.slug) })),
    errors: m.errors,
  };
});
export const myRecommendations = route(({ user }) => learner.recommendations(user()));
export const myDashboard = route(({ user }) => learner.studentDashboard(user()));
export const myLabProgress = route(({ user, params, body }) => learner.saveLabProgress(user(), params.labId.replace(/^lab_/, ""), body.solvedLevelIds), { body: D.LabProgressBody });
export const myMissionComplete = route(({ user, params }) => learner.markMissionComplete(user(), params.id.replace(/^msn_/, "")));

// ── Teacher ─────────────────────────────────────────────────────────────────
export const classes = route(({ user }) => ({ items: people.listClasses(user()) }));
export const createClass = route(({ user, body }) => people.createClass(user(), body), { body: D.CreateClassBody, status: 201 });
export const classDetail = route(({ user, params }) => people.getClass(user(), params.id));
export const classAddStudent = route(({ user, params, body }) => people.addStudent(user(), params.id, body.studentId), { body: D.AddStudentBody, status: 201 });
export const classAssign = route(({ user, params, body }) => people.createAssignment(user(), params.id, body), { body: D.CreateAssignmentBody, status: 201 });
export const classReport = route(({ user, params, query }) => people.classReport(user(), params.id, query.contentId));
export const classStudentReasoning = route(({ user, params }) => people.studentReasoning(user(), params.id, params.studentId));

// ── Parent ──────────────────────────────────────────────────────────────────
export const myChildren = route(({ user }) => ({ items: people.children(user()) }));
export const childReport = route(({ user, params }) => people.parentReport(user(), params.id));

// ── Studio & AI ─────────────────────────────────────────────────────────────
export const drafts = route(({ user }) => ({ items: studio.listDrafts(user()) }));
export const createDraft = route(({ user, body }) => studio.createDraft(user(), body), { body: D.CreateDraftBody, status: 201 });
export const draft = route(({ user, params }) => studio.getDraft(user(), params.id));
export const updateDraft = route(({ user, params, body }) => studio.updateDraft(user(), params.id, body), { body: D.UpdateDraftBody });
export const deleteDraft = route(({ user, params }) => studio.deleteDraft(user(), params.id));
export const validateDraft = route(({ user, params }) => studio.validateDraft(user(), params.id));
export const publishDraft = route(({ user, params, body }) => studio.publishDraft(user(), params.id, body.note), { body: D.PublishBody });
export const versions = route(({ params }) => ({ items: studio.contentVersions(params.id) }));
export const graphValidate = route(
  ({ user, body }) => {
    requireRole(user(), "teacher");
    const g = body.graph as SolutionGraph;
    if (!g || !Array.isArray(g.nodes) || !Array.isArray(g.edges) || !Array.isArray(g.paths)) throw badRequest("graph must have nodes, edges and paths");
    return { issues: validateGraph(g, body.symbols) };
  },
  { body: D.GraphValidateBody },
);
export const aiGenerate = route(({ user, body }) => studio.generate(user(), body), { body: D.AIGenerationRequest, status: 202 });
export const aiJob = route(({ user, params }) => studio.getJob(user(), params.id));

