/** Request bodies for the v1 API (shared by route handlers and the frontend service layer). */
import { Role } from "./common";
import { ContentType } from "./content";
import { LearningEvent, SessionMode, TutorTurn } from "./runtime";
import { OutcomeSpec } from "./simulation";
import { named, z } from "./z";

export const DemoLoginBody = named("DemoLoginBody", z.object({ role: Role }));
export const PredictBody = named("PredictBody", z.object({ choiceId: z.string() }));
export const CheckInputBody = named(
  "CheckInputBody",
  z.object({ input: z.string().min(1).max(400), attempts: z.number().int().min(0).optional(), hintLevel: z.number().int().min(0).optional() }),
);
export const ExamSubmitBody = named("ExamSubmitBody", z.object({ answers: z.record(z.string(), z.string()), elapsedSec: z.number().min(0) }));
export const OutcomeEvaluateBody = named("OutcomeEvaluateBody", z.object({ outcome: OutcomeSpec, params: z.record(z.string(), z.number()) }));

const StepWire = z.object({
  step_id: z.string(),
  attempt_id: z.string(),
  expression_latex: z.string().max(400),
  expression_ast: z.unknown().optional(),
  ast_version: z.literal("mathjson/1").optional(),
  operation: z.enum(["select_principle", "isolate_variable", "substitute", "compute", "simplify", "solve_equation", "verify"]),
  inputs: z.array(z.string()).max(6),
  target_variable: z.string(),
  unit: z.string().max(20),
  student_explanation: z.string().max(600),
  client_step_id: z.string(),
});
export const WorkbenchValidateBody = named(
  "WorkbenchValidateBody",
  z.object({ steps: z.array(StepWire).max(30), prior_failed_attempts: z.record(z.string(), z.number()).optional(), mastery: z.number().min(0).max(1).optional() }),
);
export const SubtleAnalyzeBody = named("SubtleAnalyzeBody", z.object({ caseId: z.string(), assumed: z.boolean().default(false) }));

export const StartSessionBody = named("StartSessionBody", z.object({ contentId: z.string(), mode: SessionMode, assignmentId: z.string().optional() }));
export const EventsBody = named("EventsBody", z.object({ events: z.array(LearningEvent).min(1).max(100) }));
export const LabProgressBody = named("LabProgressBody", z.object({ solvedLevelIds: z.array(z.string()) }));

export const TutorBody = named(
  "TutorBody",
  z.object({
    missionId: z.string().optional(),
    sandboxId: z.string().optional(),
    levelId: z.string().optional(),
    workbenchId: z.string().optional(),
    step: z.string(),
    message: z.string().max(1200).optional(),
    hintLevel: z.number().int().min(0),
    diagnosis: z.object({ ruleId: z.string(), errorType: z.string(), prompt: z.string() }).optional(),
    context: z.string().max(4000).optional(),
    history: z.array(TutorTurn).max(12).optional(),
  }),
);
export const TutorReply = named("TutorReply", z.object({ reply: z.string(), hintLevel: z.number().int(), source: z.enum(["rules", "llm"]) }));

export const CreateClassBody = named("CreateClassBody", z.object({ name: z.string().min(2), grade: z.number().int().min(1).max(3) }));
export const AddStudentBody = named("AddStudentBody", z.object({ studentId: z.string() }));
export const CreateAssignmentBody = named(
  "CreateAssignmentBody",
  z.object({ contentId: z.string(), contentType: z.enum(["mission", "lab", "phenomenon", "workbench", "exam"]), mode: z.enum(["discovery", "exam"]), dueAt: z.string().datetime().optional() }),
);

export const CreateDraftBody = named(
  "CreateDraftBody",
  z.object({
    contentType: ContentType.optional(),
    templateId: z.string().optional(),
    slots: z.record(z.string(), z.unknown()).optional(),
    forkOf: z.string().optional(),
    title: z.string().optional(),
    content: z.record(z.string(), z.unknown()).optional(),
  }),
);
export const UpdateDraftBody = named("UpdateDraftBody", z.object({ title: z.string().optional(), content: z.record(z.string(), z.unknown()).optional() }));
export const PublishBody = named("PublishBody", z.object({ note: z.string().max(500).optional() }));
export const GraphValidateBody = named("GraphValidateBody", z.object({ graph: z.unknown(), symbols: z.array(z.string()) }));
