/**
 * Mathematical Workbench domain types.
 *
 * A student's solution is a sequence of structured steps (not strings). Every step is graded on
 * three independent properties — mathematical validity, physical validity and pedagogical
 * relevance — and matched against an authored solution graph that is NOT exhaustive: an
 * unanticipated but valid derivation is accepted and recorded as a divergence.
 */

/** MathJSON (https://cortexjs.io/math-json/): numbers, symbol names, or ["Head", ...args]. */
export type MathJSON = number | string | [string, ...MathJSON[]];

export const AST_VERSION = "mathjson/1" as const;

export type StepOperation =
  | "select_principle"
  | "isolate_variable"
  | "substitute"
  | "compute"
  | "simplify"
  | "solve_equation"
  | "verify";

/** Wire format of one submitted step (the backend contract). */
export interface SolutionStep {
  step_id: string;
  attempt_id: string;
  expression_latex: string;
  /** Canonical, versioned representation. The server recomputes it; the client value is advisory. */
  expression_ast: MathJSON | null;
  ast_version: typeof AST_VERSION;
  operation: StepOperation;
  inputs: string[];
  target_variable: string;
  unit: string;
  student_explanation: string;
  /** Idempotency key: a retry gets a fresh one so the backend never double-applies a submission. */
  client_step_id: string;
}

export type VerdictStatus = "pass" | "warn" | "fail" | "na";

export interface Verdict {
  status: VerdictStatus;
  /** Machine-readable reason, e.g. "equivalent", "lost_solutions", "sign_convention:a". */
  code: string;
  note_ar: string;
}

export type PedagogicalAction = "accept" | "clarify" | "hint" | "experiment" | "ai_interpret";

export type LayerId =
  | "syntax"
  | "canonical"
  | "symbolic"
  | "units"
  | "physics"
  | "reasoning"
  | "pedagogy"
  | "language";

export interface LayerOutput {
  layer: LayerId;
  status: VerdictStatus;
  /** Short human-readable output of this layer for the trace view. */
  output: string;
}

export type HintTier = "conceptual" | "strategic" | "procedural" | "verification";
export const HINT_TIERS: HintTier[] = ["conceptual", "strategic", "procedural", "verification"];

export type GraduatedHints = Record<HintTier, string>;

export interface StepValidation {
  step_id: string;
  attempt_id: string;
  client_step_id: string;
  expression_ast: MathJSON | null;
  mathematical: Verdict;
  physical: Verdict;
  pedagogical: Verdict;
  action: PedagogicalAction;
  feedback_ar: string;
  /** Set when action is "hint". */
  hint?: { tier: HintTier; text: string };
  trace: LayerOutput[];
  matchedNodes: string[];
  /** Valid step that matches no authored node: the student found their own route. */
  unanticipated: boolean;
  /** Value the step established, in the target's SI unit (numeric steps only). */
  value?: { symbol: string; si: number };
  goalReached: boolean;
}

// ───────────────────────────── Solution graph ─────────────────────────────

export type GraphNodeType =
  | "known_quantity"
  | "principle"
  | "equation_application"
  | "transformation"
  | "intermediate_goal"
  | "intermediate_value"
  | "constraint"
  | "subgoal"
  | "goal";

export type GraphEdgeType = "dependency" | "derivation" | "substitution" | "alternative";

export type Intervention = Exclude<PedagogicalAction, "accept">;

export interface GraphNode {
  id: string;
  type: GraphNodeType;
  label_ar: string;
  /** Relation this node represents, in mathjs syntax (e.g. "s = u*t + a*t^2/2"). */
  formula?: string;
  /** Quantities that must be available before this node can be applied. */
  requires?: string[];
  /** Quantities this node makes available. */
  produces?: string[];
  /** For goal / value nodes: the dimension expected, e.g. "length". */
  expected_quantity?: string;
  hints?: Partial<GraduatedHints>;
  intervention?: Intervention;
}

export interface GraphEdge {
  from: string;
  to: string;
  type: GraphEdgeType;
}

export interface SolutionGraph {
  problem_id: string;
  goal: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  /** Authored known routes — not an exhaustive list of allowed solutions. */
  paths: string[][];
}

// ───────────────────────────── Problems ─────────────────────────────

export interface SymbolSpec {
  label_ar: string;
  /** Pretty LaTeX for display (e.g. "\\Delta L", "K_{max}"). */
  tex: string;
  /** SI unit understood by mathjs; "" for dimensionless. */
  unit: string;
  /** Range used when sampling relations for symbolic checks. */
  domain: [number, number];
  /** Physical constraint on the value in this problem. */
  sign?: "positive" | "nonnegative" | "negative";
  /** Units a student might forget to convert from (e.g. "eV", "nm", "km/h"). */
  altUnits?: string[];
}

export interface Principle {
  id: string;
  latex: string;
  relation: string;
  /** applicable: valid here · incomplete: valid law but ignores something stated · inapplicable: wrong model. */
  status: "applicable" | "incomplete" | "inapplicable";
  note_ar: string;
}

/** A known, plausible-but-wrong step and how the platform recovers from it. */
export interface Misconception {
  id: string;
  /** Matches a relation (equivalent) or a value of a symbol (SI, 1% tolerance). */
  match: { relation: string } | { symbol: string; value: number };
  action: Intervention;
  tier?: HintTier;
  feedback_ar: string;
}

export interface ChecklistItem {
  id: string;
  label_ar: string;
  label_en: string;
}

export interface AuthoredStep {
  latex: string;
  operation: StepOperation;
  target: string;
  unit?: string;
  explanation: string;
  /** Indexes of earlier steps in the same path (default: the previous step). */
  inputs?: number[];
}

export interface AuthoredPath {
  id: string;
  title_ar: string;
  steps: AuthoredStep[];
}

export interface RecoverableErrorScenario {
  id: string;
  title_ar: string;
  /** Steps leading up to the mistake (valid), then the mistaken step last. */
  steps: AuthoredStep[];
  expected: { mathematical: VerdictStatus; physical: VerdictStatus; action: PedagogicalAction };
}

export interface WorkbenchProblem {
  id: string;
  title: string;
  subject: "mechanics" | "electromagnetic" | "thermal";
  scenario: string;
  ask: string;
  symbols: Record<string, SymbolSpec>;
  /** Given values (SI). Constants such as h or c also live here. */
  knowns: Record<string, number>;
  /** Correct values of every quantity in this situation (SI). */
  truth: Record<string, number>;
  goal: string;
  assumptions: { id: string; label_ar: string }[];
  /** The physical model: free parameters and derived quantities. Used to test whether a relation holds. */
  model: { free: Record<string, [number, number]>; derived: Record<string, string> };
  principles: Principle[];
  misconceptions: Misconception[];
  graph: SolutionGraph;
  hints: GraduatedHints;
  checklist: ChecklistItem[];
  paths: AuthoredPath[];
  recoverableErrors: RecoverableErrorScenario[];
  /** Keep ΔL / ΔT as their own symbols (dL, dT) instead of dropping Δ. */
  keepDelta?: boolean;
  /** Related mission whose simulation is used for "experiment" interventions. */
  experimentHref?: string;
  /** Scripted showcase: steps with a mistake at `fixIndex`, then the retried step and the rest. */
  demo?: { steps: AuthoredStep[]; fixIndex: number; fix: AuthoredStep; after?: AuthoredStep[] };
}
