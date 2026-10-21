/** Teacher authoring: templates, studio drafts, immutable versions, AI generation jobs. */
import { idOf, Timestamp } from "./common";
import { ContentType } from "./content";
import { named, z } from "./z";

export const TemplateSlot = z.object({
  key: z.string(),
  label: z.string(),
  type: z.enum(["text", "latex", "number", "concept", "equation", "simulation", "choice_list", "param_list"]),
  required: z.boolean(),
  default: z.unknown().optional(),
});

export const Template = named(
  "Template",
  z.object({
    id: idOf("template"),
    kind: z.enum(["lesson", "lab", "simulation", "visualization", "exam", "workbench"]),
    contentType: ContentType,
    title: z.string(),
    description: z.string(),
    slots: z.array(TemplateSlot),
    /** Content skeleton; string values may contain {{slot}} placeholders. */
    skeleton: z.record(z.string(), z.unknown()),
    previewImage: z.string().optional(),
  }),
);
export type Template = z.infer<typeof Template>;

export const ValidationIssue = named(
  "ValidationIssue",
  z.object({ level: z.enum(["error", "warning"]), path: z.string(), message: z.string() }),
);
export type ValidationIssue = z.infer<typeof ValidationIssue>;

export const StudioDraft = named(
  "StudioDraft",
  z.object({
    id: idOf("draft"),
    contentType: ContentType,
    title: z.string(),
    ownerId: idOf("user"),
    source: z.discriminatedUnion("kind", [
      z.object({ kind: z.literal("template"), templateId: idOf("template") }),
      z.object({ kind: z.literal("scratch") }),
      z.object({ kind: z.literal("fork"), contentId: z.string() }),
      z.object({ kind: z.literal("ai"), jobId: idOf("job") }),
    ]),
    /** Partial content body; validated against the content schema on validate/publish. */
    content: z.record(z.string(), z.unknown()),
    issues: z.array(ValidationIssue),
    publishedContentId: z.string().optional(),
    createdAt: Timestamp,
    updatedAt: Timestamp,
  }),
);
export type StudioDraft = z.infer<typeof StudioDraft>;

export const ContentVersion = named(
  "ContentVersion",
  z.object({
    id: idOf("version"),
    contentId: z.string(),
    version: z.number().int(),
    snapshot: z.record(z.string(), z.unknown()),
    publishedBy: idOf("user"),
    publishedAt: Timestamp,
    note: z.string().optional(),
  }),
);
export type ContentVersion = z.infer<typeof ContentVersion>;

export const AIGenerationRequest = named(
  "AIGenerationRequest",
  z.object({
    kind: z.enum(["lesson", "lab", "exam", "visualization"]),
    prompt: z.string().min(3).max(2000),
    conceptIds: z.array(idOf("concept")).default([]),
    grade: z.number().int().min(1).max(3).default(2),
    includeSimulation: z.boolean().default(true),
    includeExam: z.boolean().default(true),
  }),
);
export type AIGenerationRequest = z.infer<typeof AIGenerationRequest>;

export const AIGenerationJob = named(
  "AIGenerationJob",
  z.object({
    id: idOf("job"),
    request: AIGenerationRequest,
    requestedBy: idOf("user"),
    status: z.enum(["queued", "running", "succeeded", "failed"]),
    /** Which generator produced the draft. */
    generator: z.enum(["template-mock", "llm"]),
    draftId: idOf("draft").optional(),
    error: z.string().optional(),
    createdAt: Timestamp,
    finishedAt: Timestamp.optional(),
  }),
);
export type AIGenerationJob = z.infer<typeof AIGenerationJob>;
