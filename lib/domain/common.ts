import { named, z } from "./z";

/** Prefixed string ids. The prefix tells a backend which table an id belongs to. */
export const ID_PREFIX = {
  user: "usr",
  classroom: "cls",
  enrollment: "enr",
  parentLink: "pln",
  assignment: "asg",
  subject: "sbj",
  unit: "unt",
  concept: "cpt",
  outcome: "out",
  quantity: "qty",
  equation: "eqn",
  misconception: "mis",
  mission: "msn",
  lab: "lab",
  phenomenon: "phn",
  workbench: "wbp",
  simulation: "sim",
  visualComponent: "vcp",
  visualization: "vis",
  exam: "exm",
  question: "qst",
  template: "tpl",
  draft: "drf",
  version: "ver",
  job: "job",
  session: "ses",
  event: "evt",
  asset: "ast",
} as const;
export type IdKind = keyof typeof ID_PREFIX;

export const idOf = (kind: IdKind) =>
  z
    .string()
    .regex(new RegExp(`^${ID_PREFIX[kind]}_[A-Za-z0-9._-]+$`), `expected a ${ID_PREFIX[kind]}_… id`)
    .openapi({ example: `${ID_PREFIX[kind]}_example` });

export const Timestamp = z.string().datetime().openapi({ example: "2026-10-21T09:00:00.000Z" });
export const Latex = z.string().openapi({ description: "LaTeX; prose fields may embed $…$ inline math" });
/** mathjs-syntax relation or expression, parsed only by the restricted Workbench parser. */
export const MathExpr = z.string().openapi({ description: "Restricted mathjs expression (no code execution)", example: "u*t + a*t^2/2" });

export const Subject = named("SubjectKey", z.enum(["physics", "math", "applied"]));
export const ContentStatus = named("ContentStatus", z.enum(["draft", "published", "archived"]));
export const Role = named("Role", z.enum(["student", "teacher", "parent", "admin"]));
export type Role = z.infer<typeof Role>;
export type SubjectKey = z.infer<typeof Subject>;
export const Locale = z.enum(["ar-EG", "en"]).default("ar-EG");

/** Fields every authored, versioned content record carries. */
export const Authored = z.object({
  status: ContentStatus,
  version: z.number().int().positive(),
  authorId: idOf("user"),
  createdAt: Timestamp,
  updatedAt: Timestamp,
  locale: Locale,
});

export const ErrorType = named("ErrorType", z.enum(["conceptual", "mathematical", "representational", "procedural", "transfer"]));
export type ErrorType = z.infer<typeof ErrorType>;

export const Diagnosis = named(
  "Diagnosis",
  z.object({
    ruleId: z.string(),
    errorType: ErrorType,
    prompt: z.string().openapi({ description: "Socratic prompt (Egyptian Arabic); never the final answer" }),
  }),
);
export type Diagnosis = z.infer<typeof Diagnosis>;
