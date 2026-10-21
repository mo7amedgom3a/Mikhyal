/** Read models for dashboards (teacher, parent, student). */
import { idOf } from "./common";
import { ContentSummary } from "./content";
import { Recommendation } from "./runtime";
import { named, z } from "./z";

const Verdict3 = z.enum(["mathematical", "physical", "pedagogical"]);

export const StudentReasoning = named(
  "StudentReasoning",
  z.object({
    studentId: z.string(),
    name: z.string(),
    archetype: z.string(),
    route: z.enum(["A", "B", "unanticipated", "stuck"]),
    reached: z.array(z.string()),
    goalReached: z.boolean(),
    divergedAt: z.string().optional(),
    mistake: z.object({ code: z.string(), action: z.string(), feedback: z.string() }).optional(),
    recovered: z.boolean(),
    steps: z.number().int(),
    verified: z.boolean(),
  }),
);

export const ClassReport = named(
  "ClassReport",
  z.object({
    classroomId: idOf("classroom"),
    contentId: z.string(),
    problemId: z.string(),
    students: z.array(StudentReasoning),
    heatmap: z.array(z.object({ stage: z.enum(["select", "rearrange", "substitute", "verify"]), property: Verdict3, pass: z.number().int(), warn: z.number().int(), fail: z.number().int(), n: z.number().int() })),
    misconceptions: z.array(z.object({ code: z.string(), label: z.string(), count: z.number().int(), recovered: z.number().int(), action: z.string() })),
    routes: z.array(z.object({ route: z.enum(["A", "B", "unanticipated", "stuck"]), count: z.number().int() })),
    generatedAt: z.string(),
    source: z.enum(["mock", "live"]),
  }),
);
export type ClassReport = z.infer<typeof ClassReport>;

export const ParentReport = named(
  "ParentReport",
  z.object({
    child: z.object({ id: idOf("user"), name: z.string(), grade: z.string(), week: z.string() }),
    week: z.object({ minutes: z.number(), missions: z.number(), steps: z.number(), validFirstTry: z.number(), hintsUsed: z.number() }),
    categoryMastery: z.array(z.object({ id: z.string(), label: z.string(), mastery: z.number(), trend: z.number() })),
    solverSkills: z.array(z.object({ id: z.string(), label: z.string(), value: z.number() })),
    insights: z.array(z.object({ tone: z.enum(["strength", "watch"]), title: z.string(), detail: z.string(), evidence: z.string() })),
    discussionPrompts: z.array(z.object({ title: z.string(), phenomenon: z.string().nullable(), prompt: z.string() })),
    source: z.enum(["mock", "live"]),
  }),
);
export type ParentReport = z.infer<typeof ParentReport>;

export const StudentDashboard = named(
  "StudentDashboard",
  z.object({
    next: Recommendation.nullable(),
    recommendations: z.array(Recommendation),
    assignments: z.array(z.object({ assignmentId: z.string(), content: ContentSummary, dueAt: z.string().optional(), done: z.boolean() })),
    masteryBySubject: z.record(z.string(), z.number()),
    errors: z.record(z.string(), z.number()),
  }),
);
export type StudentDashboard = z.infer<typeof StudentDashboard>;
