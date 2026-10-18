/**
 * Pedagogical engine: turns a diagnosis + attempt history into the next action.
 * Each error type triggers a different kind of intervention.
 */
import type { Diagnosis, ErrorType, StepId } from "./types";

export type ActionKind = "advance" | "hint" | "question" | "experiment" | "remediation";

export interface NextAction {
  kind: ActionKind;
  message: string;
  /** Hint level reached (0 = none). */
  hintLevel: number;
  /** When true, the UI may reveal a worked step/solution. */
  reveal: boolean;
}

const INTERVENTION: Record<ErrorType, { kind: ActionKind; lead: string }> = {
  conceptual: { kind: "experiment", lead: "🔬 جرّب تجربة مقارنة: " },
  mathematical: { kind: "question", lead: "🧮 راجع الخطوة دي: " },
  representational: { kind: "remediation", lead: "✏️ خلينا نرسمها تاني: " },
  procedural: { kind: "hint", lead: "🧭 فكّر في الطريقة: " },
  transfer: { kind: "remediation", lead: "🔁 نفس الفكرة في موقف جديد: " },
};

export const ERROR_LABELS: Record<ErrorType, string> = {
  conceptual: "مفاهيمي",
  mathematical: "رياضي",
  representational: "تمثيلي",
  procedural: "إجرائي",
  transfer: "نقل المعرفة",
};

export function decideNext(input: {
  correct: boolean;
  diagnosis?: Diagnosis;
  attempts: number;
  hintLevel: number;
  hints: string[];
}): NextAction {
  const { correct, diagnosis, attempts, hintLevel, hints } = input;
  if (correct) {
    return { kind: "advance", message: "برافو! كده انت وصلت للفكرة بنفسك ✨", hintLevel, reveal: false };
  }
  if (diagnosis) {
    const iv = INTERVENTION[diagnosis.errorType];
    return {
      kind: iv.kind,
      message: iv.lead + diagnosis.prompt,
      hintLevel,
      reveal: attempts >= 4,
    };
  }
  // Undiagnosed error: escalate along the hint ladder.
  const level = Math.min(Math.max(hintLevel, attempts), hints.length);
  return {
    kind: "hint",
    message: level > 0 ? hints[level - 1] : "لسه في فكرة محتاجة تجربة تانية. جرّب كمان مرة.",
    hintLevel: level,
    reveal: attempts >= 4,
  };
}

export function nextHint(hints: string[], hintLevel: number): { message: string; hintLevel: number } {
  const level = Math.min(hintLevel + 1, hints.length);
  return {
    message: hints[level - 1] ?? "جرّب ترجع للتجربة وتغيّر متغير واحد بس وتلاحظ.",
    hintLevel: level,
  };
}

export type Scaffold = "full" | "partial" | "none";

/** Problem Solver Framework scaffolding fades as mastery grows. */
export function solverScaffold(mastery: number): Scaffold {
  if (mastery < 0.45) return "full";
  if (mastery < 0.75) return "partial";
  return "none";
}

/** Should the tutor escalate to the LLM? Only for free text or deep hints. */
export function shouldUseLLM(opts: { freeText: boolean; hintLevel: number; step: StepId }): boolean {
  return opts.freeText || opts.hintLevel >= 2;
}
