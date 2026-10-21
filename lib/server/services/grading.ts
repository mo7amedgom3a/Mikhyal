/** Deterministic grading behind the API (same engines the client used to run locally). */
import type { Diagnosis, OutcomeSpec } from "@/lib/domain";
import { checkEquation, checkNumeric } from "@/lib/engine/evaluator";
import { decideNext } from "@/lib/engine/pedagogy";
import { evaluateOutcomeRules, lintOutcome, RuleError } from "@/lib/engines/outcomeRules";
import { WORKBENCH_PROBLEMS } from "@/lib/workbench/problems";
import { analyzeSubtle, SUBTLE_CASES } from "@/lib/workbench/subtleErrors";
import type { SolutionStep, WorkbenchProblem as Spec } from "@/lib/workbench/types";
import { validateSequence } from "@/lib/workbench/validate";
import { badRequest, HttpError, notFound } from "../http";
import { findContent } from "./content";

export function gradePrediction(missionId: string, choiceId: string) {
  const m = findContent("missions", missionId);
  const correct = choiceId === m.prediction.correctId;
  const rule = m.prediction.rules.find((r) => r.choiceId === choiceId);
  const diagnosis: Diagnosis | undefined = rule ? { ruleId: rule.ruleId, errorType: rule.errorType, prompt: rule.prompt } : undefined;
  return { correct, diagnosis: correct ? undefined : diagnosis, reveal: m.prediction.reveal };
}

export function gradeEquation(missionId: string, input: string, ctx: { attempts?: number; hintLevel?: number } = {}) {
  const m = findContent("missions", missionId);
  const d = m.discovery;
  const res = checkEquation(input, { variables: Object.keys(d.variables), targets: d.targets, domain: d.domain, wrongRelations: d.wrongRelations, forbiddenSymbols: d.forbiddenSymbols });
  const correct = res.status === "correct";
  const diagnosis = res.status === "incorrect" ? res.diagnosis : undefined;
  const next = decideNext({ correct, diagnosis, attempts: ctx.attempts ?? 1, hintLevel: ctx.hintLevel ?? 0, hints: m.hints.discover ?? [] });
  return { status: res.status, correct, diagnosis, next };
}

export function gradeAnswer(missionId: string, input: string, ctx: { attempts?: number; hintLevel?: number } = {}) {
  const m = findContent("missions", missionId);
  const a = m.application;
  const res = checkNumeric(input, a.answer, a.wrongValues);
  const correct = res.status === "correct";
  const diagnosis = res.status === "incorrect" ? res.diagnosis : undefined;
  const next = decideNext({ correct, diagnosis, attempts: ctx.attempts ?? 1, hintLevel: ctx.hintLevel ?? 0, hints: m.hints.apply ?? [] });
  return { status: res.status, correct, diagnosis, next };
}

export function gradePhenomenon(id: string, input: string) {
  const p = findContent("phenomena", id);
  const res = checkNumeric(input, p.mission.answer, p.mission.wrongValues);
  return { status: res.status, correct: res.status === "correct", diagnosis: res.status === "incorrect" ? res.diagnosis : undefined, solution: res.status === "correct" ? p.mission.solution : undefined };
}

export function submitExam(examId: string, answers: Record<string, string>, elapsedSec: number) {
  const exam = findContent("exams", examId);
  const results = exam.questions.map((q) => {
    const given = answers[q.id];
    if (q.kind === "choice") {
      const correct = given === q.correctId;
      const rule = q.rules.find((r) => r.choiceId === given);
      return { questionId: q.id, correct, diagnosis: correct || !rule ? undefined : { ruleId: rule.ruleId, errorType: rule.errorType, prompt: rule.prompt }, explanation: q.explanation };
    }
    const r = given ? checkNumeric(given, q.answer, q.wrongValues) : { status: "parse_error" as const };
    return { questionId: q.id, correct: r.status === "correct", diagnosis: r.status === "incorrect" ? r.diagnosis : undefined, explanation: q.explanation };
  });
  const score = results.filter((r) => r.correct).length;
  return { examId: exam.id, score, total: results.length, overTime: elapsedSec > exam.timeLimitSec, results };
}

export function evaluateOutcome(spec: OutcomeSpec, params: Record<string, number>) {
  if (spec.kind === "engine") throw badRequest("engine outcomes are evaluated by the client engine; send a rules spec");
  const problems = lintOutcome(spec, Object.keys(params));
  if (problems.length) throw new HttpError(422, "unprocessable", "invalid outcome rules", problems);
  try {
    return evaluateOutcomeRules(spec, params);
  } catch (e) {
    if (e instanceof RuleError) throw new HttpError(422, "unprocessable", e.message);
    throw e;
  }
}

/** The validator works on the engine spec; content records carry it as `spec`. */
export function workbenchSpec(idOrSlug: string): Spec {
  const rec = findContent("workbench", idOrSlug);
  return (WORKBENCH_PROBLEMS.find((p) => p.id === rec.spec.id) ?? rec.spec) as Spec;
}

export function validateWorkbench(idOrSlug: string, steps: SolutionStep[], opts: { priorFailedAttempts?: Record<string, number>; mastery?: number }) {
  const spec = workbenchSpec(idOrSlug);
  return { problem_id: spec.id, ast_version: "mathjson/1" as const, validations: validateSequence(spec, steps, opts) };
}

export function subtleAnalyze(caseId: string, assumed: boolean) {
  const c = SUBTLE_CASES.find((x) => x.id === caseId);
  if (!c) throw notFound(`subtle case ${caseId}`);
  return { case: c, result: analyzeSubtle(c, assumed) };
}

export function subtleCases() {
  return SUBTLE_CASES.map((c) => ({ ...c, result: analyzeSubtle(c, false) }));
}
