/** Pedagogical vocabulary: misconceptions, interventions, hint ladders, scaffolding. */
import { Diagnosis, ErrorType, idOf, MathExpr } from "./common";
import { named, z } from "./z";

export const Intervention = named("Intervention", z.enum(["hint", "question", "experiment", "remediation", "clarify", "ai_interpret", "advance"]));

/** How a misconception is recognised in student work. */
export const MisconceptionDetector = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("choice"), questionRef: z.string(), choiceId: z.string() }),
  z.object({ kind: z.literal("wrong_relation"), variable: z.string(), expr: MathExpr }),
  z.object({ kind: z.literal("wrong_value"), value: z.number(), unit: z.string().optional() }),
  z.object({ kind: z.literal("forbidden_symbol"), symbol: z.string() }),
]);

export const Misconception = named(
  "Misconception",
  z.object({
    id: idOf("misconception"),
    ruleId: z.string(),
    errorType: ErrorType,
    conceptIds: z.array(idOf("concept")),
    detector: MisconceptionDetector,
    prompt: z.string(),
    intervention: Intervention,
    /** Content where this misconception is checked. */
    sourceId: z.string(),
  }),
);
export type Misconception = z.infer<typeof Misconception>;

export const HintTier = z.enum(["conceptual", "strategic", "procedural", "verification"]);
export const HintLadder = named("HintLadder", z.object({ conceptual: z.string(), strategic: z.string(), procedural: z.string(), verification: z.string() }));
export type HintLadder = z.infer<typeof HintLadder>;

/** The five Problem Solver Framework prompts shown with fading scaffolding. */
export const SolverPrompts = named(
  "SolverPrompts",
  z.object({ understand: z.string(), represent: z.string(), model: z.string(), translate: z.string(), verify: z.string() }),
);

export const ScaffoldPolicy = named(
  "ScaffoldPolicy",
  z.object({ fullBelow: z.number().min(0).max(1), partialBelow: z.number().min(0).max(1) }).openapi({ description: "Mastery thresholds for full / partial / no scaffolding" }),
);

export const NextAction = named(
  "NextAction",
  z.object({
    kind: Intervention,
    message: z.string(),
    hintLevel: z.number().int().optional(),
    diagnosis: Diagnosis.optional(),
  }),
);
export type NextAction = z.infer<typeof NextAction>;
