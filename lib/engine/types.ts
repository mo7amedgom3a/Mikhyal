/** Core domain types for the reactive learning engine. */

export type ErrorType =
  | "conceptual"
  | "mathematical"
  | "representational"
  | "procedural"
  | "transfer";

export type StepId =
  | "challenge"
  | "predict"
  | "experiment"
  | "discover"
  | "apply"
  | "reflect";

export const STEP_ORDER: StepId[] = [
  "challenge",
  "predict",
  "experiment",
  "discover",
  "apply",
  "reflect",
];

export interface Diagnosis {
  ruleId: string;
  errorType: ErrorType;
  /** Socratic prompt shown to the student (Egyptian Arabic). Never the final answer. */
  prompt: string;
}

/** A relation solved explicitly for one variable, used to sample valid points. */
export interface ExplicitRelation {
  variable: string;
  expr: string;
}

export interface EquationRule extends Diagnosis {
  relation: ExplicitRelation;
}

export interface NumericTarget {
  value: number;
  /** Canonical unit understood by mathjs, e.g. "m/s^2". Empty string for dimensionless. */
  unit: string;
  /** Relative tolerance, e.g. 0.02 = 2%. */
  tolerance: number;
}

export interface WrongValueRule extends Diagnosis {
  value: number;
}

export interface Choice {
  id: string;
  label: string;
}

export interface ChoiceRule extends Diagnosis {
  choiceId: string;
}

export interface SimParam {
  key: string;
  label: string;
  symbol: string;
  min: number;
  max: number;
  step: number;
  unit: string;
  default: number;
}

export interface Readout {
  label: string;
  value: string;
  unit?: string;
}

export interface ExperimentOutcome {
  success: boolean;
  message: string;
  readouts: Readout[];
}

export type SimId =
  | "braking"
  | "newton"
  | "circular"
  | "ohm"
  | "relativity"
  | "fountain"
  | "elevation"
  | "vectors"
  | "statics"
  | "moments"
  | "incline";

export interface SolverPrompts {
  understand: string;
  represent: string;
  model: string;
  translate: string;
  verify: string;
}

export interface ExamQuestion {
  id: string;
  question: string;
  options: Choice[];
  correctId: string;
  explanation: string;
  rules: ChoiceRule[];
}

export interface Mission {
  id: string;
  subject: "physics" | "math" | "applied";
  order: number;
  title: string;
  tagline: string;
  icon: string;
  enrichment?: boolean;
  /** Concept ids tracked by the learner model. */
  concepts: string[];
  /** Short verified statement of the governing relation, used to ground the AI tutor. */
  groundTruth: string;
  challenge: { story: string; goal: string };
  prediction: {
    question: string;
    options: Choice[];
    correctId: string;
    reveal: string;
    rules: ChoiceRule[];
  };
  experiment: {
    sim: SimId;
    instruction: string;
    params: SimParam[];
    evaluate: (p: Record<string, number>) => ExperimentOutcome;
  };
  discovery: {
    prompt: string;
    /** Symbols the student may use, with Arabic meaning. */
    variables: Record<string, string>;
    targets: ExplicitRelation[];
    /** Sampling ranges for each variable. */
    domain: Record<string, [number, number]>;
    latex: string;
    derivation: string[];
    clip?: string;
    wrongRelations: EquationRule[];
    forbiddenSymbols: Record<string, Diagnosis>;
  };
  application: {
    problem: string;
    answer: NumericTarget;
    unitHint: string;
    wrongValues: WrongValueRule[];
    solver: SolverPrompts;
    solution: string;
  };
  exam: { timeLimitSec: number; questions: ExamQuestion[] };
  hints: Partial<Record<StepId, string[]>>;
  reflection: { summary: string; nextMissionId?: string };
}

export type LearningEventKind =
  | "prediction"
  | "experiment_run"
  | "equation_attempt"
  | "numeric_attempt"
  | "exam_answer"
  | "hint_requested"
  | "tutor_message";

export interface LearningEvent {
  missionId: string;
  step: StepId | "exam";
  kind: LearningEventKind;
  correct?: boolean;
  diagnosis?: Diagnosis;
  detail?: string;
  at: number;
}
