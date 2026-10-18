/**
 * Learner model: per-concept mastery estimated with a small Bayesian Knowledge
 * Tracing update, plus a history of diagnosed error types. Persisted locally.
 */
import type { ErrorType, LearningEvent } from "./types";

export interface ConceptState {
  mastery: number;
  attempts: number;
}

export interface LearnerState {
  concepts: Record<string, ConceptState>;
  errors: Record<ErrorType, number>;
  completedMissions: string[];
  events: LearningEvent[];
}

const KEY = "mikhyal.learner.v1";

/** BKT parameters: initial knowledge, learning, slip, guess. */
const P_INIT = 0.15;
const P_LEARN = 0.2;
const P_SLIP = 0.1;
const P_GUESS = 0.2;

export function emptyState(): LearnerState {
  return {
    concepts: {},
    errors: { conceptual: 0, mathematical: 0, representational: 0, procedural: 0, transfer: 0 },
    completedMissions: [],
    events: [],
  };
}

export function bktUpdate(prior: number, correct: boolean, hintsUsed = 0): number {
  const posterior = correct
    ? (prior * (1 - P_SLIP)) / (prior * (1 - P_SLIP) + (1 - prior) * P_GUESS)
    : (prior * P_SLIP) / (prior * P_SLIP + (1 - prior) * (1 - P_GUESS));
  // Help received means less evidence of independent mastery.
  const learn = correct ? P_LEARN / (1 + hintsUsed) : P_LEARN;
  return Math.min(0.99, posterior + (1 - posterior) * learn);
}

export function recordEvidence(
  state: LearnerState,
  concepts: string[],
  correct: boolean,
  hintsUsed = 0,
): LearnerState {
  const next = { ...state, concepts: { ...state.concepts } };
  for (const c of concepts) {
    const prev = next.concepts[c] ?? { mastery: P_INIT, attempts: 0 };
    next.concepts[c] = {
      mastery: bktUpdate(prev.mastery, correct, hintsUsed),
      attempts: prev.attempts + 1,
    };
  }
  return next;
}

export function recordEvent(state: LearnerState, event: LearningEvent): LearnerState {
  const errors = { ...state.errors };
  if (event.diagnosis) errors[event.diagnosis.errorType] += 1;
  return { ...state, errors, events: [...state.events.slice(-199), event] };
}

export function missionMastery(state: LearnerState, concepts: string[]): number {
  if (!concepts.length) return 0;
  const sum = concepts.reduce((s, c) => s + (state.concepts[c]?.mastery ?? 0), 0);
  return sum / concepts.length;
}

export function loadState(): LearnerState {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptyState();
    return { ...emptyState(), ...JSON.parse(raw) };
  } catch {
    return emptyState();
  }
}

export function saveState(state: LearnerState): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage unavailable (private mode); the session still works in memory.
  }
}
