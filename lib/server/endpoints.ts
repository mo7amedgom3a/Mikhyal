/**
 * The v1 endpoint table: one row per endpoint. It drives the OpenAPI document, the generated
 * route files (scripts/gen-api-routes.ts) and the backend docs, so they never drift apart.
 */
import type { z } from "zod";
import * as D from "@/lib/domain";

export type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface Endpoint {
  method: Method;
  /** OpenAPI-style path under /api/v1, e.g. "/missions/{id}". */
  path: string;
  /** Export name in lib/server/routes.ts. */
  handler: string;
  tag: string;
  summary: string;
  roles?: D.Role[];
  body?: z.ZodTypeAny;
  response?: z.ZodTypeAny;
  query?: boolean;
}

const E = (method: Method, path: string, handler: string, tag: string, summary: string, extra: Partial<Endpoint> = {}): Endpoint => ({ method, path, handler, tag, summary, ...extra });

export const ENDPOINTS: Endpoint[] = [
  E("GET", "/health", "health", "Meta", "Liveness and store counts"),
  E("GET", "/openapi.json", "openapi", "Meta", "This OpenAPI document"),
  E("POST", "/auth/demo-login", "demoLogin", "Auth", "Switch the demo identity (student / teacher / parent / admin); sets the mikhyal_user cookie", { body: D.DemoLoginBody }),
  E("GET", "/me", "me", "Auth", "Current user", { response: D.User }),

  E("GET", "/subjects", "subjects", "Curriculum", "Subjects"),
  E("GET", "/curriculum", "curriculum", "Curriculum", "Subjects, units and syllabus outcomes"),
  E("GET", "/concepts", "concepts", "Curriculum", "Concepts (knowledge-graph nodes)", { query: true }),
  E("GET", "/concepts/{id}", "concept", "Curriculum", "Concept with prerequisites, unlocks, equations, misconceptions, outcomes and content"),
  E("GET", "/knowledge-graph", "graph", "Curriculum", "Concepts, equations and content with typed edges", { response: D.KnowledgeGraph }),
  E("GET", "/equations", "equations", "Curriculum", "Equation registry", { query: true }),
  E("GET", "/equations/{id}", "equation", "Curriculum", "Equation with its quantities and concepts"),
  E("GET", "/quantities", "quantities", "Curriculum", "Physical quantities (symbol, unit, dimension)", { query: true }),
  E("GET", "/misconceptions", "misconceptions", "Curriculum", "Misconception catalog with detectors and interventions", { query: true }),

  E("GET", "/catalog", "catalogList", "Catalog", "Unified content catalog (filter by type, subject, concept, q)", { query: true }),
  E("GET", "/templates", "templates", "Catalog", "Authoring templates"),
  E("GET", "/simulations", "simulations", "Catalog", "Simulation engines (params, observables, visual components)", { query: true }),
  E("GET", "/simulations/{id}", "simulation", "Catalog", "Simulation engine detail"),
  E("GET", "/visual-components", "visualComponents", "Catalog", "Visual component library"),

  E("GET", "/missions", "missions", "Content", "Missions (6-step learning loop)", { query: true }),
  E("GET", "/missions/{id}", "mission", "Content", "Mission with its exam, equations and simulation (id or slug)"),
  E("GET", "/labs", "labs", "Content", "Constructive sandbox labs", { query: true }),
  E("GET", "/labs/{id}", "lab", "Content", "Lab with levels and goals"),
  E("GET", "/phenomena", "phenomena", "Content", "Phenomena modules (type = category)", { query: true }),
  E("GET", "/phenomena/{id}", "phenomenon", "Content", "Phenomenon with its simulation"),
  E("GET", "/workbench/problems", "workbenchProblems", "Content", "Mathematical Workbench problems", { query: true }),
  E("GET", "/workbench/problems/{id}", "workbenchProblem", "Content", "Workbench problem with its solution graph"),
  E("GET", "/exams/{id}", "exam", "Content", "Exam (curriculum-style, timed)"),

  E("POST", "/missions/{id}/predict", "predict", "Grading", "Grade a prediction choice; returns a diagnosis for known misconceptions", { body: D.PredictBody }),
  E("POST", "/missions/{id}/check-equation", "checkEquation", "Grading", "Check a discovered relation symbolically", { body: D.CheckInputBody }),
  E("POST", "/missions/{id}/check-answer", "checkAnswer", "Grading", "Check a numeric answer with units", { body: D.CheckInputBody }),
  E("POST", "/phenomena/{id}/check-answer", "phenomenonAnswer", "Grading", "Check a phenomenon mission answer", { body: D.CheckInputBody }),
  E("POST", "/exams/{id}/submit", "examSubmit", "Grading", "Grade an exam attempt with per-question diagnoses", { body: D.ExamSubmitBody }),
  E("POST", "/workbench/problems/{id}/validate", "workbenchValidate", "Grading", "Validate a sequence of reasoning steps (math / physics / pedagogy)", { body: D.WorkbenchValidateBody }),
  E("GET", "/workbench/subtle", "subtleList", "Grading", "Subtle-error showcase cases with their analysis"),
  E("POST", "/workbench/subtle/analyze", "subtleAnalyze", "Grading", "Analyze a subtle-error case under an assumption", { body: D.SubtleAnalyzeBody }),
  E("POST", "/outcomes/evaluate", "outcomeEvaluate", "Grading", "Evaluate a declarative (rules) experiment outcome", { body: D.OutcomeEvaluateBody }),

  E("POST", "/sessions", "startSession", "Runtime", "Start a learning session", { body: D.StartSessionBody, response: D.Session }),
  E("GET", "/sessions/{id}", "session", "Runtime", "Session with its events"),
  E("POST", "/sessions/{id}/events", "sessionEvents", "Runtime", "Append learning events (updates the learner model)", { body: D.EventsBody }),
  E("POST", "/sessions/{id}/complete", "completeSession", "Runtime", "Complete a session"),
  E("POST", "/tutor", "tutor", "Runtime", "Socratic tutor reply (rules, or Claude when configured)", { body: D.TutorBody, response: D.TutorReply }),

  E("GET", "/me/learner-model", "myLearner", "Learner", "My learner model (BKT mastery, errors, progress)", { response: D.LearnerModel }),
  E("POST", "/me/events", "myEvents", "Learner", "Append learning events outside a session", { body: D.EventsBody }),
  E("GET", "/me/progress", "myProgress", "Learner", "Mission mastery and lab progress"),
  E("GET", "/me/recommendations", "myRecommendations", "Learner", "Adaptive next activities"),
  E("GET", "/me/dashboard", "myDashboard", "Learner", "Student dashboard read model", { response: D.StudentDashboard }),
  E("PUT", "/me/labs/{labId}/progress", "myLabProgress", "Learner", "Save solved lab levels", { body: D.LabProgressBody }),
  E("POST", "/me/missions/{id}/complete", "myMissionComplete", "Learner", "Mark a mission complete"),

  E("GET", "/classes", "classes", "Teacher", "My classrooms"),
  E("POST", "/classes", "createClass", "Teacher", "Create a classroom", { roles: ["teacher"], body: D.CreateClassBody, response: D.Classroom }),
  E("GET", "/classes/{id}", "classDetail", "Teacher", "Classroom with students and assignments"),
  E("POST", "/classes/{id}/students", "classAddStudent", "Teacher", "Enroll a student", { roles: ["teacher"], body: D.AddStudentBody }),
  E("POST", "/classes/{id}/assignments", "classAssign", "Teacher", "Assign content", { roles: ["teacher"], body: D.CreateAssignmentBody, response: D.Assignment }),
  E("GET", "/classes/{id}/report", "classReport", "Teacher", "Class reasoning report (step validity, misconceptions, routes)", { roles: ["teacher"], response: D.ClassReport }),
  E("GET", "/classes/{id}/students/{studentId}/reasoning", "classStudentReasoning", "Teacher", "One student's reasoning path", { roles: ["teacher"] }),

  E("GET", "/me/children", "myChildren", "Parent", "Linked children", { roles: ["parent"] }),
  E("GET", "/children/{id}/report", "childReport", "Parent", "Parent report: mastery, reasoning quality, discussion prompts", { roles: ["parent"], response: D.ParentReport }),

  E("GET", "/studio/drafts", "drafts", "Studio", "My drafts", { roles: ["teacher"] }),
  E("POST", "/studio/drafts", "createDraft", "Studio", "Create a draft from a template, from scratch, or by forking content", { roles: ["teacher"], body: D.CreateDraftBody, response: D.StudioDraft }),
  E("GET", "/studio/drafts/{id}", "draft", "Studio", "Draft", { roles: ["teacher"], response: D.StudioDraft }),
  E("PATCH", "/studio/drafts/{id}", "updateDraft", "Studio", "Update a draft (re-validates)", { roles: ["teacher"], body: D.UpdateDraftBody, response: D.StudioDraft }),
  E("DELETE", "/studio/drafts/{id}", "deleteDraft", "Studio", "Delete a draft", { roles: ["teacher"] }),
  E("POST", "/studio/drafts/{id}/validate", "validateDraft", "Studio", "Validate a draft against the content schema and domain rules", { roles: ["teacher"], response: D.StudioDraft }),
  E("POST", "/studio/drafts/{id}/publish", "publishDraft", "Studio", "Publish a draft as a new content version", { roles: ["teacher"], body: D.PublishBody }),
  E("GET", "/content/{id}/versions", "versions", "Studio", "Published versions of a content item"),
  E("POST", "/studio/solution-graphs/validate", "graphValidate", "Studio", "Validate a solution graph (cycles, reachability, formulas)", { roles: ["teacher"], body: D.GraphValidateBody }),
  E("POST", "/ai/generations", "aiGenerate", "AI", "Generate a lesson / lab / exam / visualization draft", { roles: ["teacher"], body: D.AIGenerationRequest, response: D.AIGenerationJob }),
  E("GET", "/ai/generations/{id}", "aiJob", "AI", "Generation job with its draft", { roles: ["teacher"] }),

  E("GET", "/ai/tools", "aiTools", "AI agents", "Tools the advisor and generator agents can call"),
  E("GET", "/ai/libraries", "aiLibraries", "AI agents", "Rendering / maths / physics libraries available to generated UI"),
  E("POST", "/ai/runs", "aiRunCreate", "AI agents", "Run the advisor or generator agent (tool calls + message + generated UI)", { body: D.RunRequest, response: D.AgentRun }),
  E("GET", "/ai/runs/{id}", "aiRun", "AI agents", "Agent run transcript", { response: D.AgentRun }),
  E("GET", "/ai/runs/{id}/stream", "aiRunStream", "AI agents", "Server-sent events replaying the run step by step (?speed=)"),
  E("POST", "/ai/tools/{name}/invoke", "aiToolInvoke", "AI agents", "Invoke one tool directly (debugging / studio)", { body: D.ToolInvokeBody }),
  E("GET", "/lessons", "lessons", "Generated lessons", "Lessons published by the generator"),
  E("GET", "/lessons/{slug}", "lesson", "Generated lessons", "Generated lesson (UI spec) with the run that produced it"),
  E("GET", "/topics", "topics", "Knowledge base", "Knowledge-base topics"),
  E("GET", "/topics/{slug}", "topic", "Knowledge base", "Topic outline, timeline and FAQ", { response: D.Topic }),
  E("GET", "/elements", "elements", "Knowledge base", "Element data (Z, N, shells, radii, isotopes)"),
  E("GET", "/elements/{symbol}", "elementBySymbol", "Knowledge base", "One element", { response: D.ElementRecord }),
  E("GET", "/atom-models", "atomModels", "Knowledge base", "How the atom was imagined: historical models in order"),
  E("GET", "/particles", "particles", "Knowledge base", "Proton, neutron, electron: charge, mass, location"),
  E("GET", "/datasets/{id}", "dataset", "Knowledge base", "Experimental dataset (e.g. dst_geiger_marsden_1913)", { response: D.Dataset }),
];
