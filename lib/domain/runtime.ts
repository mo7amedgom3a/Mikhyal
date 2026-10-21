/** What happens while students learn: sessions, events, submissions, the learner model. */
import { Diagnosis, ErrorType, idOf, Timestamp } from "./common";
import { NextAction } from "./pedagogy";
import { named, z } from "./z";

export const SessionMode = z.enum(["discovery", "exam", "workbench", "lab", "phenomenon"]);

export const Session = named(
  "Session",
  z.object({
    id: idOf("session"),
    userId: idOf("user"),
    contentId: z.string(),
    mode: SessionMode,
    status: z.enum(["active", "completed", "abandoned"]),
    startedAt: Timestamp,
    completedAt: Timestamp.optional(),
    assignmentId: idOf("assignment").optional(),
  }),
);
export type Session = z.infer<typeof Session>;

export const LearningEventKind = named(
  "LearningEventKind",
  z.enum([
    "prediction",
    "experiment_run",
    "equation_attempt",
    "numeric_attempt",
    "exam_answer",
    "hint_requested",
    "tutor_message",
    "sandbox_edit",
    "sandbox_level_complete",
    "step_submitted",
    "observation_met",
    "phenomenon_answer",
  ]),
);

export const LearningEvent = named(
  "LearningEvent",
  z.object({
    id: idOf("event").optional(),
    sessionId: idOf("session").optional(),
    contentId: z.string(),
    step: z.string(),
    kind: LearningEventKind,
    correct: z.boolean().optional(),
    diagnosis: Diagnosis.optional(),
    detail: z.string().optional(),
    /** Evidence for the learner model: these concepts, this outcome, with this much help. */
    evidence: z.object({ conceptKeys: z.array(z.string()), correct: z.boolean(), hintsUsed: z.number().int().min(0).default(0) }).optional(),
    at: z.number().int().openapi({ description: "Epoch ms on the client" }),
  }),
);
export type LearningEvent = z.infer<typeof LearningEvent>;

export const ConceptMastery = named(
  "ConceptMastery",
  z.object({ conceptKey: z.string(), mastery: z.number().min(0).max(1), attempts: z.number().int(), lastSeenAt: Timestamp.optional() }),
);

export const LearnerModel = named(
  "LearnerModel",
  z.object({
    userId: idOf("user"),
    concepts: z.record(z.string(), z.object({ mastery: z.number(), attempts: z.number().int() })),
    errors: z.record(ErrorType, z.number().int()),
    completedMissions: z.array(z.string()).openapi({ description: "Mission slugs" }),
    labProgress: z.record(z.string(), z.array(z.string())).openapi({ description: "lab slug → solved level ids" }),
    updatedAt: Timestamp,
  }),
);
export type LearnerModel = z.infer<typeof LearnerModel>;

export const Recommendation = named(
  "Recommendation",
  z.object({
    contentId: z.string(),
    slug: z.string(),
    type: z.string(),
    title: z.string(),
    reason: z.string(),
    href: z.string(),
    action: NextAction.optional(),
  }),
);

export const TutorTurn = named("TutorTurn", z.object({ role: z.enum(["student", "tutor"]), text: z.string() }));
