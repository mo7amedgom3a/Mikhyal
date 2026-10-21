/**
 * Client-side engine registry: turns a serialisable Mission record (from the API) back into the
 * runtime mission the player needs, attaching the code engine (physics evaluate) by id, or the
 * declarative rules evaluator for missions authored without code.
 */
import type { Exam, Mission as MissionRecord } from "@/lib/domain";
import type { Mission as RuntimeMission, SimId } from "@/lib/engine/types";
import { MISSIONS } from "@/lib/missions";
import { evaluateOutcomeRules } from "./outcomeRules";

const ENGINES = new Map(MISSIONS.map((m) => [m.experiment.sim as string, m.experiment.evaluate]));

import { conceptKey, slugOf } from "./ids";
export { conceptKey, slugOf };

export function hasEngine(engineId: string) {
  return ENGINES.has(engineId);
}

export function hydrateMission(dto: MissionRecord, exam?: Exam): RuntimeMission {
  const outcome = dto.experiment.outcome;
  const evaluate =
    outcome.kind === "rules"
      ? (p: Record<string, number>) => evaluateOutcomeRules(outcome, p)
      : (ENGINES.get(outcome.engineId) ??
        (() => ({ success: false, message: `المحرك «${outcome.engineId}» مش متاح في النسخة دي من التطبيق.`, readouts: [] })));
  return {
    id: dto.slug,
    subject: dto.subject,
    order: dto.order,
    title: dto.title,
    tagline: dto.tagline,
    icon: dto.icon,
    enrichment: dto.enrichment,
    concepts: dto.conceptIds.map(conceptKey),
    groundTruth: dto.groundTruth,
    challenge: dto.challenge,
    prediction: dto.prediction,
    experiment: { sim: dto.experiment.engineId as SimId, instruction: dto.experiment.instruction, params: dto.experiment.params, evaluate },
    discovery: dto.discovery,
    application: dto.application,
    exam: {
      timeLimitSec: exam?.timeLimitSec ?? 120,
      questions: (exam?.questions ?? []).flatMap((q) => (q.kind === "choice" ? [{ id: q.id, question: q.question, options: q.options, correctId: q.correctId, explanation: q.explanation, rules: q.rules }] : [])),
    },
    hints: dto.hints,
    reflection: {
      summary: dto.reflection.summary,
      nextMissionId: dto.reflection.nextMissionId ? slugOf(dto.reflection.nextMissionId) : undefined,
      sandbox: dto.reflection.labId ? slugOf(dto.reflection.labId) : undefined,
    },
  };
}
