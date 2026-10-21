/**
 * Frontend service layer: one function per backend endpoint, grouped by domain.
 * Components never call fetch directly; they use these (or the hooks built on them).
 */
import type {
  AIGenerationJob,
  AIGenerationRequest,
  Assignment,
  ClassReport,
  Classroom,
  Concept,
  ContentSummary,
  ContentVersion,
  Diagnosis,
  Enrollment,
  Equation,
  Exam,
  KnowledgeGraph,
  Lab,
  LearnerModel,
  LearningEvent,
  ListQuery,
  Mission,
  NextAction,
  Page,
  ParentLink,
  ParentReport,
  Phenomenon,
  Session,
  SimulationEngine,
  StudentDashboard,
  StudioDraft,
  Template,
  User,
  VisualComponent,
  WorkbenchProblem,
} from "@/lib/domain";
import type { TutorRequest, TutorResponse } from "@/lib/engine/tutor";
import type { ExperimentOutcome } from "@/lib/engine/types";
import type { SolutionStep, StepValidation } from "@/lib/workbench/types";
import type { SubtleCase, SubtleResult } from "@/lib/workbench/subtleErrors";
import type { GraphIssue } from "@/lib/workbench/graph";
import { api, qs } from "./client";

const q = (query: ListQuery = {}) => qs(query as Record<string, string | number | undefined>);

export interface GradeResult {
  status: "correct" | "incorrect" | "parse_error";
  correct: boolean;
  diagnosis?: Diagnosis;
  next?: NextAction;
}

export const authService = {
  me: () => api<{ user: User }>("/me"),
  demoLogin: (role: User["role"]) => api<{ user: User }>("/auth/demo-login", { body: { role } }),
};

export const curriculumService = {
  curriculum: () => api<{ subjects: unknown[]; units: unknown[]; outcomes: unknown[] }>("/curriculum"),
  concepts: (query?: ListQuery) => api<Page<Concept>>(`/concepts${q(query)}`),
  concept: (id: string) => api<{ concept: Concept; prerequisites: Concept[]; unlocks: Concept[]; equations: Equation[]; content: ContentSummary[] }>(`/concepts/${encodeURIComponent(id)}`),
  knowledgeGraph: () => api<KnowledgeGraph>("/knowledge-graph"),
  equations: (query?: ListQuery) => api<Page<Equation>>(`/equations${q(query)}`),
};

export const contentService = {
  catalog: (query?: ListQuery) => api<Page<ContentSummary>>(`/catalog${q(query)}`),
  mission: (id: string) => api<{ mission: Mission; exam: Exam | null; equations: Equation[]; simulation: SimulationEngine | null }>(`/missions/${encodeURIComponent(id)}`),
  lab: (id: string) => api<{ lab: Lab }>(`/labs/${encodeURIComponent(id)}`),
  phenomena: (query?: ListQuery) => api<Page<Phenomenon>>(`/phenomena${q(query)}`),
  phenomenon: (id: string) => api<{ phenomenon: Phenomenon; simulation: SimulationEngine | null }>(`/phenomena/${encodeURIComponent(id)}`),
  workbenchProblem: (id: string) => api<{ problem: WorkbenchProblem }>(`/workbench/problems/${encodeURIComponent(id)}`),
  exam: (id: string) => api<{ exam: Exam }>(`/exams/${encodeURIComponent(id)}`),
  simulations: () => api<Page<SimulationEngine>>("/simulations"),
  visualComponents: () => api<{ items: VisualComponent[] }>("/visual-components"),
  templates: () => api<{ items: Template[] }>("/templates"),
};

export const gradingService = {
  predict: (missionId: string, choiceId: string) => api<{ correct: boolean; diagnosis?: Diagnosis; reveal: string }>(`/missions/${missionId}/predict`, { body: { choiceId } }),
  checkEquation: (missionId: string, input: string, ctx: { attempts?: number; hintLevel?: number } = {}) => api<GradeResult>(`/missions/${missionId}/check-equation`, { body: { input, ...ctx } }),
  checkAnswer: (missionId: string, input: string, ctx: { attempts?: number; hintLevel?: number } = {}) => api<GradeResult>(`/missions/${missionId}/check-answer`, { body: { input, ...ctx } }),
  phenomenonAnswer: (id: string, input: string) => api<GradeResult & { solution?: string }>(`/phenomena/${id}/check-answer`, { body: { input } }),
  submitExam: (examId: string, answers: Record<string, string>, elapsedSec: number) =>
    api<{ score: number; total: number; overTime: boolean; results: { questionId: string; correct: boolean; diagnosis?: Diagnosis; explanation: string }[] }>(`/exams/${examId}/submit`, { body: { answers, elapsedSec } }),
  evaluateOutcome: (outcome: Mission["experiment"]["outcome"], params: Record<string, number>) => api<ExperimentOutcome>("/outcomes/evaluate", { body: { outcome, params } }),
};

export const workbenchService = {
  validate: (problemId: string, steps: SolutionStep[], opts: { prior_failed_attempts?: Record<string, number>; mastery?: number } = {}) =>
    api<{ problem_id: string; validations: StepValidation[] }>(`/workbench/problems/${encodeURIComponent(problemId)}/validate`, { body: { steps, ...opts } }),
  subtleCases: () => api<{ items: (SubtleCase & { result: SubtleResult })[] }>("/workbench/subtle"),
  analyzeSubtle: (caseId: string, assumed: boolean) => api<{ case: SubtleCase; result: SubtleResult }>("/workbench/subtle/analyze", { body: { caseId, assumed } }),
};

export const sessionService = {
  start: (contentId: string, mode: Session["mode"], assignmentId?: string) => api<Session>("/sessions", { body: { contentId, mode, assignmentId } }),
  events: (sessionId: string, events: LearningEvent[]) => api<{ learner: LearnerModel }>(`/sessions/${sessionId}/events`, { body: { events } }),
  complete: (sessionId: string) => api<{ session: Session; learner: LearnerModel }>(`/sessions/${sessionId}/complete`, { body: {} }),
};

export const learnerService = {
  model: () => api<LearnerModel>("/me/learner-model"),
  events: (events: LearningEvent[]) => api<{ learner: LearnerModel }>("/me/events", { body: { events } }),
  progress: () => api<{ completedMissions: string[]; labProgress: Record<string, string[]>; missions: { id: string; slug: string; mastery: number; done: boolean }[]; errors: Record<string, number> }>("/me/progress"),
  recommendations: () => api<{ recommendations: StudentDashboard["recommendations"]; dominantError: string | null }>("/me/recommendations"),
  dashboard: () => api<StudentDashboard>("/me/dashboard"),
  saveLabProgress: (labId: string, solvedLevelIds: string[]) => api<LearnerModel>(`/me/labs/${labId}/progress`, { method: "PUT", body: { solvedLevelIds } }),
  completeMission: (missionId: string) => api<LearnerModel>(`/me/missions/${missionId}/complete`, { body: {} }),
};

export const tutorService = {
  ask: (req: TutorRequest) => api<TutorResponse>("/tutor", { body: req }),
};

export const classroomService = {
  list: () => api<{ items: Classroom[] }>("/classes"),
  create: (name: string, grade: number) => api<Classroom>("/classes", { body: { name, grade } }),
  get: (id: string) => api<{ classroom: Classroom; students: User[]; assignments: Assignment[] }>(`/classes/${id}`),
  addStudent: (id: string, studentId: string) => api<Enrollment>(`/classes/${id}/students`, { body: { studentId } }),
  assign: (id: string, input: Omit<Assignment, "id" | "classroomId" | "createdAt">) => api<Assignment>(`/classes/${id}/assignments`, { body: input }),
  report: (id: string, contentId?: string) => api<ClassReport>(`/classes/${id}/report${qs({ contentId })}`),
};

export const parentService = {
  children: () => api<{ items: { link: ParentLink; child: User }[] }>("/me/children"),
  report: (childId: string) => api<ParentReport>(`/children/${childId}/report`),
};

export const studioService = {
  drafts: () => api<{ items: StudioDraft[] }>("/studio/drafts"),
  create: (input: { contentType?: StudioDraft["contentType"]; templateId?: string; slots?: Record<string, unknown>; forkOf?: string; title?: string; content?: Record<string, unknown> }) => api<StudioDraft>("/studio/drafts", { body: input }),
  get: (id: string) => api<StudioDraft>(`/studio/drafts/${id}`),
  update: (id: string, patch: { title?: string; content?: Record<string, unknown> }) => api<StudioDraft>(`/studio/drafts/${id}`, { method: "PATCH", body: patch }),
  remove: (id: string) => api<{ deleted: string }>(`/studio/drafts/${id}`, { method: "DELETE" }),
  validate: (id: string) => api<StudioDraft>(`/studio/drafts/${id}/validate`, { body: {} }),
  publish: (id: string, note?: string) => api<{ draft: StudioDraft; content: unknown; version: ContentVersion | null }>(`/studio/drafts/${id}/publish`, { body: { note } }),
  versions: (contentId: string) => api<{ items: ContentVersion[] }>(`/content/${contentId}/versions`),
  validateGraph: (graph: unknown, symbols: string[]) => api<{ issues: GraphIssue[] }>("/studio/solution-graphs/validate", { body: { graph, symbols } }),
};

export const aiService = {
  generate: (req: Partial<AIGenerationRequest> & Pick<AIGenerationRequest, "kind" | "prompt">) => api<AIGenerationJob>("/ai/generations", { body: req }),
  job: (id: string) => api<{ job: AIGenerationJob; draft: StudioDraft | null }>(`/ai/generations/${id}`),
};
