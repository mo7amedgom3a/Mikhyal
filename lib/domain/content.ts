/**
 * Learning content. Every item shares ContentBase (catalog fields + authoring metadata) and adds a
 * type-specific, fully serialisable body. Code-only behaviour (physics engines, sandbox solvers)
 * is referenced by id and lives in the frontend engine registry.
 */
import { Authored, Diagnosis, idOf, Latex, MathExpr, Subject } from "./common";
import { HintLadder, SolverPrompts } from "./pedagogy";
import { OutcomeSpec, ParamSpec } from "./simulation";
import { named, z } from "./z";

export const ContentType = named("ContentType", z.enum(["mission", "lab", "phenomenon", "workbench", "exam", "visualization"]));
export type ContentType = z.infer<typeof ContentType>;

export const ContentBase = Authored.extend({
  id: z.string(),
  /** URL slug, stable across versions (e.g. "braking"). */
  slug: z.string(),
  type: ContentType,
  title: z.string(),
  tagline: z.string(),
  icon: z.string(),
  subject: Subject,
  conceptIds: z.array(idOf("concept")),
  outcomeIds: z.array(idOf("outcome")),
  difficulty: z.number().int().min(1).max(5),
  estimatedMinutes: z.number().int().positive(),
  tags: z.array(z.string()),
});

/** Catalog entry: what lists, search and dashboards need. */
export const ContentSummary = named(
  "ContentSummary",
  ContentBase.pick({ id: true, slug: true, type: true, title: true, tagline: true, icon: true, subject: true, conceptIds: true, difficulty: true, estimatedMinutes: true, status: true, version: true, authorId: true, tags: true }).extend({
    order: z.number().int().optional(),
    href: z.string(),
  }),
);
export type ContentSummary = z.infer<typeof ContentSummary>;

// ───────────────────────────── Missions (the 6-step learning loop) ─────────────────────────────

const Choice = z.object({ id: z.string(), label: z.string() });
const ChoiceRule = Diagnosis.extend({ choiceId: z.string() });
const ExplicitRelation = z.object({ variable: z.string(), expr: MathExpr });
const NumericTarget = named("NumericTarget", z.object({ value: z.number(), unit: z.string(), tolerance: z.number().positive() }));

export const Mission = named(
  "Mission",
  ContentBase.extend({
    id: idOf("mission"),
    type: z.literal("mission"),
    order: z.number().int(),
    enrichment: z.boolean().optional(),
    /** Verified statement grounding the AI tutor. */
    groundTruth: z.string(),
    equationIds: z.array(idOf("equation")),
    challenge: z.object({ story: z.string(), goal: z.string() }),
    prediction: z.object({ question: z.string(), options: z.array(Choice), correctId: z.string(), reveal: z.string(), rules: z.array(ChoiceRule) }),
    experiment: z.object({
      simulationId: idOf("simulation"),
      engineId: z.string(),
      instruction: z.string(),
      params: z.array(ParamSpec),
      outcome: OutcomeSpec,
    }),
    discovery: z.object({
      prompt: z.string(),
      variables: z.record(z.string(), z.string()),
      targets: z.array(ExplicitRelation),
      domain: z.record(z.string(), z.tuple([z.number(), z.number()])),
      latex: Latex,
      derivation: z.array(Latex),
      clipAssetId: z.string().optional(),
      clip: z.string().optional(),
      wrongRelations: z.array(Diagnosis.extend({ relation: ExplicitRelation })),
      forbiddenSymbols: z.record(z.string(), Diagnosis),
    }),
    application: z.object({
      problem: z.string(),
      answer: NumericTarget,
      unitHint: z.string(),
      wrongValues: z.array(Diagnosis.extend({ value: z.number() })),
      solver: SolverPrompts,
      solution: Latex,
    }),
    examId: idOf("exam"),
    hints: z.object({
      predict: z.array(z.string()).optional(),
      experiment: z.array(z.string()).optional(),
      discover: z.array(z.string()).optional(),
      apply: z.array(z.string()).optional(),
    }),
    reflection: z.object({ summary: z.string(), nextMissionId: idOf("mission").optional(), labId: idOf("lab").optional() }),
  }),
);
export type Mission = z.infer<typeof Mission>;

// ───────────────────────────── Exams ─────────────────────────────

export const Question = named(
  "Question",
  z.discriminatedUnion("kind", [
    z.object({
      id: z.string(),
      kind: z.literal("choice"),
      question: z.string(),
      options: z.array(Choice),
      correctId: z.string(),
      explanation: z.string(),
      rules: z.array(ChoiceRule),
      outcomeIds: z.array(idOf("outcome")).default([]),
    }),
    z.object({
      id: z.string(),
      kind: z.literal("numeric"),
      question: z.string(),
      answer: NumericTarget,
      explanation: z.string(),
      wrongValues: z.array(Diagnosis.extend({ value: z.number() })),
      outcomeIds: z.array(idOf("outcome")).default([]),
    }),
  ]),
);
export type Question = z.infer<typeof Question>;

export const Exam = named(
  "Exam",
  ContentBase.extend({
    id: idOf("exam"),
    type: z.literal("exam"),
    missionId: idOf("mission").optional(),
    timeLimitSec: z.number().int().positive(),
    questions: z.array(Question),
  }),
);
export type Exam = z.infer<typeof Exam>;

// ───────────────────────────── Labs (constructive sandboxes) ─────────────────────────────

export const LabGoal = z.object({
  id: z.string(),
  label: z.string(),
  anchor: z.string().optional(),
  /** Either a key implemented by the lab engine or a rule over the solved state. */
  check: z.discriminatedUnion("kind", [z.object({ kind: z.literal("engine"), key: z.string() }), z.object({ kind: z.literal("rule"), expr: MathExpr })]),
});

export const LabLevel = named(
  "LabLevel",
  z.object({
    id: z.string(),
    order: z.number().int(),
    title: z.string(),
    story: z.string(),
    /** Engine-specific initial board (e.g. circuit parts on grid edges). */
    initial: z.unknown(),
    goals: z.array(LabGoal),
    hints: z.array(z.string()),
    conceptIds: z.array(idOf("concept")),
    takeaway: z.string(),
    freeBuild: z.boolean().optional(),
  }),
);
export type LabLevel = z.infer<typeof LabLevel>;

export const Lab = named(
  "Lab",
  ContentBase.extend({
    id: idOf("lab"),
    type: z.literal("lab"),
    simulationId: idOf("simulation"),
    engineId: z.string(),
    levels: z.array(LabLevel),
  }),
);
export type Lab = z.infer<typeof Lab>;

// ───────────────────────────── Phenomena ─────────────────────────────

export const Phenomenon = named(
  "Phenomenon",
  ContentBase.extend({
    id: idOf("phenomenon"),
    type: z.literal("phenomenon"),
    category: z.enum(["electromagnetic", "thermal", "quantum"]),
    advanced: z.boolean().optional(),
    description: z.string(),
    famous: z.object({ title: z.string(), who: z.string(), year: z.string(), text: z.string() }),
    equation: z.object({ latex: Latex, meaning: z.string() }),
    equationIds: z.array(idOf("equation")),
    workbench: z.object({ chain: z.array(Latex), checks: z.array(z.string()) }),
    mission: z.object({
      title: z.string(),
      story: z.string(),
      question: z.string(),
      answer: NumericTarget,
      unitHint: z.string(),
      wrongValues: z.array(Diagnosis.extend({ value: z.number() })),
      solution: Latex,
    }),
    hints: HintLadder,
    homePrompt: z.string(),
    simulationId: idOf("simulation"),
    workbenchProblemId: idOf("workbench").optional(),
  }),
);
export type Phenomenon = z.infer<typeof Phenomenon>;

// ───────────────────────────── Workbench problems + solution graphs ─────────────────────────────

const Verdict = z.enum(["pass", "warn", "fail", "na"]);
const Operation = z.enum(["select_principle", "isolate_variable", "substitute", "compute", "simplify", "solve_equation", "verify"]);
const AuthoredStep = z.object({ latex: Latex, operation: Operation, target: z.string(), unit: z.string().optional(), explanation: z.string(), inputs: z.array(z.number().int()).optional() });

export const GraphNode = named(
  "SolutionGraphNode",
  z.object({
    id: z.string(),
    type: z.enum(["known_quantity", "principle", "equation_application", "transformation", "intermediate_goal", "intermediate_value", "constraint", "subgoal", "goal"]),
    label_ar: z.string(),
    formula: MathExpr.optional(),
    requires: z.array(z.string()).optional(),
    produces: z.array(z.string()).optional(),
    expected_quantity: z.string().optional(),
    hints: HintLadder.partial().optional(),
    intervention: z.enum(["clarify", "hint", "experiment", "ai_interpret"]).optional(),
  }),
);

export const SolutionGraph = named(
  "SolutionGraph",
  z.object({
    problem_id: z.string(),
    goal: z.string(),
    nodes: z.array(GraphNode),
    edges: z.array(z.object({ from: z.string(), to: z.string(), type: z.enum(["dependency", "derivation", "substitution", "alternative"]) })),
    paths: z.array(z.array(z.string())).openapi({ description: "Authored known routes — not an exhaustive list of allowed solutions" }),
  }),
);
export type SolutionGraph = z.infer<typeof SolutionGraph>;

/** The engine-level problem spec (same shape the validator consumes). */
export const WorkbenchSpec = z.object({
  id: z.string(),
  title: z.string(),
  subject: z.enum(["mechanics", "electromagnetic", "thermal"]),
  scenario: z.string(),
  ask: z.string(),
  symbols: z.record(
    z.string(),
    z.object({
      label_ar: z.string(),
      tex: Latex,
      unit: z.string(),
      domain: z.tuple([z.number(), z.number()]),
      sign: z.enum(["positive", "nonnegative", "negative"]).optional(),
      altUnits: z.array(z.string()).optional(),
    }),
  ),
  knowns: z.record(z.string(), z.number()),
  truth: z.record(z.string(), z.number()),
  goal: z.string(),
  assumptions: z.array(z.object({ id: z.string(), label_ar: z.string() })),
  model: z.object({ free: z.record(z.string(), z.tuple([z.number(), z.number()])), derived: z.record(z.string(), MathExpr) }),
  principles: z.array(z.object({ id: z.string(), latex: Latex, relation: MathExpr, status: z.enum(["applicable", "incomplete", "inapplicable"]), note_ar: z.string() })),
  misconceptions: z.array(
    z.object({
      id: z.string(),
      match: z.union([z.object({ relation: MathExpr }), z.object({ symbol: z.string(), value: z.number() })]),
      action: z.enum(["clarify", "hint", "experiment", "ai_interpret"]),
      tier: z.enum(["conceptual", "strategic", "procedural", "verification"]).optional(),
      feedback_ar: z.string(),
    }),
  ),
  graph: SolutionGraph,
  hints: HintLadder,
  checklist: z.array(z.object({ id: z.string(), label_ar: z.string(), label_en: z.string() })),
  paths: z.array(z.object({ id: z.string(), title_ar: z.string(), steps: z.array(AuthoredStep) })),
  recoverableErrors: z.array(
    z.object({
      id: z.string(),
      title_ar: z.string(),
      steps: z.array(AuthoredStep),
      expected: z.object({ mathematical: Verdict, physical: Verdict, action: z.enum(["accept", "clarify", "hint", "experiment", "ai_interpret"]) }),
    }),
  ),
  keepDelta: z.boolean().optional(),
  experimentHref: z.string().optional(),
  demo: z.object({ steps: z.array(AuthoredStep), fixIndex: z.number().int(), fix: AuthoredStep, after: z.array(AuthoredStep).optional() }).optional(),
});

export const WorkbenchProblem = named(
  "WorkbenchProblem",
  ContentBase.extend({
    id: idOf("workbench"),
    type: z.literal("workbench"),
    equationIds: z.array(idOf("equation")),
    spec: WorkbenchSpec,
  }),
);
export type WorkbenchProblem = z.infer<typeof WorkbenchProblem>;

/** Any content record. */
export const AnyContent = z.union([Mission, Lab, Phenomenon, WorkbenchProblem, Exam]);
export type AnyContent = z.infer<typeof AnyContent>;

