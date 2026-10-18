"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getMission } from "@/lib/missions";
import { STEP_ORDER, type ChoiceRule, type Diagnosis, type ExperimentOutcome, type LearningEvent, type StepId } from "@/lib/engine/types";
import { checkEquation, checkNumeric } from "@/lib/engine/evaluator";
import { decideNext, nextHint, shouldUseLLM, solverScaffold, ERROR_LABELS, type NextAction } from "@/lib/engine/pedagogy";
import { emptyState, loadState, missionMastery, recordEvent, recordEvidence, saveState, type LearnerState } from "@/lib/engine/learnerModel";
import type { TutorRequest, TutorResponse } from "@/lib/engine/tutor";
import { SIMS } from "@/components/sims";
import { Logo } from "@/components/ui/Logo";
import { Tex } from "@/components/ui/Tex";
import { LessonProgress, STEP_LABELS } from "./LessonProgress";
import { VariableSlider } from "./VariableSlider";
import { FeedbackPanel } from "./FeedbackPanel";
import { EquationInput } from "./EquationInput";
import { NumericInput } from "./NumericInput";
import { ProblemSolverSteps } from "./ProblemSolverSteps";
import { DiscoveryClip } from "./DiscoveryClip";
import { MasteryRing, masteryLabel } from "./MasteryIndicator";
import { TutorPanel, type TutorMessage } from "./TutorPanel";
import { ExamMode } from "./ExamMode";

interface Run {
  params: Record<string, number>;
  outcome: ExperimentOutcome;
}

interface Feedback {
  action: NextAction;
  diagnosis?: Diagnosis;
}

export function MissionPlayer({ missionId }: { missionId: string }) {
  const mission = getMission(missionId)!;
  const defaults = useMemo(
    () => Object.fromEntries(mission.experiment.params.map((p) => [p.key, p.default])),
    [mission],
  );

  const [mode, setMode] = useState<"discovery" | "exam">("discovery");
  const [stepIdx, setStepIdx] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [learner, setLearner] = useState<LearnerState>(emptyState);
  const [hydrated, setHydrated] = useState(false);

  const [params, setParams] = useState<Record<string, number>>(defaults);
  const [runKey, setRunKey] = useState(0);
  const pendingRun = useRef<Record<string, number> | null>(null);
  const [simRunning, setSimRunning] = useState(false);
  const [runs, setRuns] = useState<Run[]>([]);
  const [expSuccess, setExpSuccess] = useState(false);

  const [choice, setChoice] = useState<string | null>(null);
  const [predictionLocked, setPredictionLocked] = useState(false);

  const [equation, setEquation] = useState("");
  const [eqSolved, setEqSolved] = useState(false);
  const [numeric, setNumeric] = useState("");
  const [numSolved, setNumSolved] = useState(false);
  const [attempts, setAttempts] = useState<Partial<Record<StepId, number>>>({});
  const [hintLevel, setHintLevel] = useState<Partial<Record<StepId, number>>>({});
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [sessionErrors, setSessionErrors] = useState<Diagnosis[]>([]);

  const [tutorOpen, setTutorOpen] = useState(false);
  const [tutorBusy, setTutorBusy] = useState(false);
  const [messages, setMessages] = useState<TutorMessage[]>([]);

  const step = STEP_ORDER[stepIdx];
  const mastery = missionMastery(learner, mission.concepts);

  useEffect(() => {
    setLearner(loadState());
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) saveState(learner);
  }, [learner, hydrated]);

  const log = useCallback(
    (e: Omit<LearningEvent, "missionId" | "at">, evidence?: { correct: boolean; hints?: number }) => {
      setLearner((s) => {
        let next = recordEvent(s, { ...e, missionId: mission.id, at: Date.now() });
        if (evidence) next = recordEvidence(next, mission.concepts, evidence.correct, evidence.hints ?? 0);
        return next;
      });
      if (e.diagnosis) setSessionErrors((d) => [...d, e.diagnosis!]);
    },
    [mission],
  );

  const goTo = (i: number) => {
    setStepIdx(i);
    setMaxReached((m) => Math.max(m, i));
    setFeedback(null);
    setRevealed(false);
    if (STEP_ORDER[i] === "reflect" && !learner.completedMissions.includes(mission.id)) {
      setLearner((s) => ({ ...s, completedMissions: [...s.completedMissions, mission.id] }));
    }
  };
  const next = () => goTo(Math.min(stepIdx + 1, STEP_ORDER.length - 1));

  // ── experiment ──────────────────────────────────────────────
  const outcome = mission.experiment.evaluate(params);
  const run = () => {
    pendingRun.current = params;
    setSimRunning(true);
    setRunKey((k) => k + 1);
  };
  const onRunFinished = useCallback(() => {
    const p = pendingRun.current;
    if (!p) return;
    pendingRun.current = null;
    setSimRunning(false);
    const o = mission.experiment.evaluate(p);
    setRuns((r) => [{ params: p, outcome: o }, ...r].slice(0, 8));
    if (o.success) setExpSuccess(true);
    log({ step: "experiment", kind: "experiment_run", correct: o.success, detail: JSON.stringify(p) });
  }, [mission, log]);

  const resetRun = () => {
    pendingRun.current = null;
    setSimRunning(false);
    setRunKey(0);
  };
  const setParam = (k: string, v: number) => {
    setParams((p) => ({ ...p, [k]: v }));
    resetRun();
  };

  // ── checks ──────────────────────────────────────────────────
  const bump = (s: StepId) => {
    const n = (attempts[s] ?? 0) + 1;
    setAttempts((a) => ({ ...a, [s]: n }));
    return n;
  };

  const submitPrediction = () => {
    if (!choice) return;
    const correct = choice === mission.prediction.correctId;
    const rule: ChoiceRule | undefined = mission.prediction.rules.find((r) => r.choiceId === choice);
    setPredictionLocked(true);
    const diagnosis = rule ? { ruleId: rule.ruleId, errorType: rule.errorType, prompt: rule.prompt } : undefined;
    log({ step: "predict", kind: "prediction", correct, diagnosis, detail: choice }, { correct });
    setFeedback({
      action: correct
        ? { kind: "advance", message: `توقّع ممتاز! ${mission.prediction.reveal}`, hintLevel: 0, reveal: false }
        : decideNext({ correct, diagnosis, attempts: 1, hintLevel: 0, hints: mission.hints.predict ?? [] }),
      diagnosis,
    });
  };

  const submitEquation = () => {
    const d = mission.discovery;
    const res = checkEquation(equation, {
      variables: Object.keys(d.variables),
      targets: d.targets,
      domain: d.domain,
      wrongRelations: d.wrongRelations,
      forbiddenSymbols: d.forbiddenSymbols,
    });
    if (res.status === "parse_error") {
      setFeedback({
        action: { kind: "hint", message: "مش قادر أقرا المعادلة. اكتبها كده مثلًا: a = F/m أو v^2 = u^2 + ...", hintLevel: 0, reveal: false },
      });
      return;
    }
    const n = bump("discover");
    const correct = res.status === "correct";
    const diagnosis = res.status === "incorrect" ? res.diagnosis : undefined;
    const hl = hintLevel.discover ?? 0;
    log({ step: "discover", kind: "equation_attempt", correct, diagnosis, detail: equation }, { correct, hints: hl });
    const action = decideNext({ correct, diagnosis, attempts: n, hintLevel: hl, hints: mission.hints.discover ?? [] });
    if (!correct && !diagnosis) setHintLevel((h) => ({ ...h, discover: action.hintLevel }));
    if (correct) setEqSolved(true);
    setFeedback({ action, diagnosis });
  };

  const submitNumeric = () => {
    const a = mission.application;
    const res = checkNumeric(numeric, a.answer, a.wrongValues);
    if (res.status === "parse_error") {
      setFeedback({ action: { kind: "hint", message: `اكتب رقم وبعده الوحدة، ${a.unitHint}`, hintLevel: 0, reveal: false } });
      return;
    }
    const n = bump("apply");
    const correct = res.status === "correct";
    const diagnosis = res.status === "incorrect" ? res.diagnosis : undefined;
    const hl = hintLevel.apply ?? 0;
    log({ step: "apply", kind: "numeric_attempt", correct, diagnosis, detail: numeric }, { correct, hints: hl });
    const action = decideNext({ correct, diagnosis, attempts: n, hintLevel: hl, hints: mission.hints.apply ?? [] });
    if (!correct && !diagnosis) setHintLevel((h) => ({ ...h, apply: action.hintLevel }));
    if (correct) setNumSolved(true);
    setFeedback({ action, diagnosis });
  };

  // ── tutor ───────────────────────────────────────────────────
  const workspaceContext = () => {
    const p = Object.entries(params).map(([k, v]) => `${k}=${v}`).join(", ");
    const parts = [`sim params: ${p}`, `sim outcome: ${outcome.message}`];
    if (step === "discover" && equation) parts.push(`student equation: ${equation}`);
    if (step === "apply" && numeric) parts.push(`student answer: ${numeric}`);
    if (step === "predict" && choice) parts.push(`prediction: ${choice}`);
    return parts.join(" | ");
  };

  const askTutor = async (message?: string) => {
    const s = step;
    const level = hintLevel[s] ?? 0;
    const hints = mission.hints[s] ?? [];
    const diagnosis = feedback?.diagnosis;
    if (message) setMessages((m) => [...m, { role: "student", text: message }]);
    log({ step: s, kind: message ? "tutor_message" : "hint_requested", detail: message });

    // Shallow hints come straight from the rules engine; the LLM is reserved for free text and deeper help.
    if (!shouldUseLLM({ freeText: !!message, hintLevel: level + 1, step: s })) {
      const h = diagnosis && level === 0 ? { message: diagnosis.prompt, hintLevel: 1 } : nextHint(hints, level);
      setHintLevel((x) => ({ ...x, [s]: h.hintLevel }));
      setMessages((m) => [...m, { role: "tutor", text: h.message, source: "rules" }]);
      return;
    }
    setTutorBusy(true);
    try {
      const req: TutorRequest = {
        missionId: mission.id,
        step: s,
        message,
        hintLevel: level,
        diagnosis,
        context: workspaceContext(),
        history: messages.slice(-6).map((m) => ({ role: m.role, text: m.text })),
      };
      const res = await fetch("/api/tutor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(req) });
      const data = (await res.json()) as TutorResponse;
      if (!message) setHintLevel((x) => ({ ...x, [s]: data.hintLevel }));
      setMessages((m) => [...m, { role: "tutor", text: data.reply, source: data.source }]);
    } catch {
      const h = nextHint(hints, level);
      setHintLevel((x) => ({ ...x, [s]: h.hintLevel }));
      setMessages((m) => [...m, { role: "tutor", text: h.message, source: "rules" }]);
    } finally {
      setTutorBusy(false);
    }
  };

  // ── render helpers ─────────────────────────────────────────
  const Sim = SIMS[mission.experiment.sim];
  const simInteractive = step === "experiment" || step === "discover";
  const showSim = step !== "apply" && step !== "reflect";
  const scaffold = solverScaffold(mastery);

  const canAdvance =
    step === "challenge" ||
    (step === "predict" && predictionLocked) ||
    (step === "experiment" && (expSuccess || runs.length >= 4)) ||
    (step === "discover" && (eqSolved || revealed)) ||
    (step === "apply" && (numSolved || revealed));

  return (
    <div className="min-h-dvh bg-canvas">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b-2 border-line bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5">
          <div className="hidden sm:block">
            <Logo href="/learn" />
          </div>
          <Link href="/learn" className="btn btn-ghost !min-h-10 !px-3 sm:hidden" aria-label="رجوع لمسار التعلم">
            ✕
          </Link>
          <div className="flex-1">{mode === "discovery" ? <LessonProgress current={stepIdx} maxReached={maxReached} onJump={goTo} /> : <p className="font-bold text-ink">📝 وضع الامتحان — {mission.title}</p>}</div>
          <div className="flex rounded-[14px] border-2 border-line bg-muted p-1 text-sm font-bold" role="tablist" aria-label="الوضع">
            {(["discovery", "exam"] as const).map((m) => (
              <button
                key={m}
                role="tab"
                aria-selected={mode === m}
                onClick={() => setMode(m)}
                className={`rounded-[10px] px-3 py-1.5 ${mode === m ? "bg-surface text-primary shadow-[0_2px_0_0_var(--border-strong)]" : "text-ink-3"}`}
              >
                {m === "discovery" ? "🔬 اكتشاف" : "📝 امتحان"}
              </button>
            ))}
          </div>
        </div>
      </header>

      {mode === "exam" ? (
        <main className="px-4 py-8">
          <ExamMode
            mission={mission}
            onAnswer={(correct, rule) =>
              log(
                { step: "exam", kind: "exam_answer", correct, diagnosis: rule ? { ruleId: rule.ruleId, errorType: rule.errorType, prompt: rule.prompt } : undefined },
                { correct },
              )
            }
          />
        </main>
      ) : (
        <main className="mx-auto grid max-w-[1280px] gap-5 px-4 py-5 lg:grid-cols-[minmax(340px,420px)_1fr]">
          {/* instruction column */}
          <section className="card space-y-4 p-5 lg:self-start" aria-labelledby="step-title">
            <div className="flex items-center justify-between">
              <span className="chip">
                {mission.icon} {mission.tagline}
              </span>
              {mission.enrichment && <span className="chip !border-amber !text-amber-dark">إثرائي</span>}
            </div>
            <h1 id="step-title" className="font-display text-[26px] font-extrabold leading-tight text-ink">
              {stepIdx + 1}. {STEP_LABELS[step]}
            </h1>

            {step === "challenge" && (
              <div className="space-y-3">
                <p className="text-[18px] leading-9 text-ink">{mission.challenge.story}</p>
                <p className="rounded-[14px] border-2 border-primary bg-primary-soft p-4 text-[17px] font-semibold leading-8 text-primary">🎯 {mission.challenge.goal}</p>
                <p className="text-sm text-ink-3">قبل أي قانون، هنفكر ونجرّب بنفسنا.</p>
              </div>
            )}

            {step === "predict" && (
              <div className="space-y-3">
                <p className="text-[18px] leading-9 text-ink">{mission.prediction.question}</p>
                <div className="grid grid-cols-2 gap-2">
                  {mission.prediction.options.map((o) => (
                    <button
                      key={o.id}
                      disabled={predictionLocked}
                      onClick={() => setChoice(o.id)}
                      aria-pressed={choice === o.id}
                      className={`min-h-14 rounded-[14px] border-2 px-3 font-bold transition-colors ${
                        predictionLocked && o.id === mission.prediction.correctId
                          ? "border-mint bg-mint-soft text-mint-dark"
                          : choice === o.id
                            ? "border-primary bg-primary-soft text-primary shadow-[0_4px_0_0_var(--brand-primary)]"
                            : "border-line-strong bg-surface text-ink shadow-[0_4px_0_0_var(--border-strong)]"
                      }`}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
                {!predictionLocked && (
                  <button disabled={!choice} onClick={submitPrediction} className="btn btn-primary w-full">
                    ثبّت توقّعي
                  </button>
                )}
              </div>
            )}

            {step === "experiment" && (
              <div className="space-y-3">
                <p className="text-[17px] leading-8 text-ink">{mission.experiment.instruction}</p>
                {runs.length >= 4 && !expSuccess && <p className="text-sm text-ink-3">تقدر تكمّل، بس حاول توصل للهدف الأول 😉</p>}
              </div>
            )}

            {step === "discover" && (
              <div className="space-y-3">
                <p className="text-[17px] leading-8 text-ink">{mission.discovery.prompt}</p>
                {!eqSolved && !revealed ? (
                  <EquationInput value={equation} onChange={setEquation} onSubmit={submitEquation} variables={mission.discovery.variables} />
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-[16px] border-2 border-mint bg-mint-soft p-4 text-center text-2xl">
                      <Tex block>{mission.discovery.latex}</Tex>
                    </div>
                    <DiscoveryClip clip={mission.discovery.clip} derivation={mission.discovery.derivation} />
                  </div>
                )}
                {!eqSolved && !revealed && (attempts.discover ?? 0) >= 4 && (
                  <button onClick={() => setRevealed(true)} className="btn btn-ghost w-full">
                    ورّيني الاشتقاق خطوة بخطوة
                  </button>
                )}
              </div>
            )}

            {step === "apply" && (
              <div className="space-y-4">
                <p className="rounded-[14px] border-2 border-line bg-muted p-4 text-[18px] leading-9 text-ink">{mission.application.problem}</p>
                <NumericInput value={numeric} onChange={setNumeric} onSubmit={submitNumeric} placeholder={mission.application.unitHint} disabled={numSolved} />
                {(numSolved || revealed) && (
                  <div className="rounded-[14px] bg-sim p-3 text-lg">
                    <Tex block>{mission.application.solution}</Tex>
                  </div>
                )}
                {!numSolved && !revealed && (attempts.apply ?? 0) >= 4 && (
                  <button onClick={() => setRevealed(true)} className="btn btn-ghost w-full">
                    ورّيني الحل
                  </button>
                )}
              </div>
            )}

            {step === "reflect" && (
              <div className="space-y-4">
                <div className="flex items-center gap-4 rounded-[16px] border-2 border-line p-4">
                  <MasteryRing value={mastery} size={72} />
                  <div>
                    <p className="font-bold text-ink">الإتقان: {masteryLabel(mastery)}</p>
                    <p className="text-sm text-ink-2">مبني على أدائك المستقل، مش عدد الدروس.</p>
                  </div>
                </div>
                <p className="text-[17px] leading-8 text-ink">✅ {mission.reflection.summary}</p>
                {sessionErrors.length > 0 ? (
                  <div className="rounded-[16px] border-2 border-amber bg-amber-soft p-4">
                    <p className="mb-2 font-bold text-ink">أفكار لسه محتاجة شغل:</p>
                    <ul className="space-y-1 text-sm text-ink-2">
                      {[...new Map(sessionErrors.map((d) => [d.ruleId, d])).values()].slice(0, 4).map((d) => (
                        <li key={d.ruleId}>
                          • <b>{ERROR_LABELS[d.errorType]}:</b> {d.prompt}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <p className="rounded-[16px] border-2 border-mint bg-mint-soft p-4 text-mint-dark">مفيش أخطاء متشخّصة المرة دي — عاش! 🎉</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <button onClick={() => setMode("exam")} className="btn btn-amber flex-1">
                    📝 جرّب وضع الامتحان
                  </button>
                  {mission.reflection.nextMissionId ? (
                    <Link href={`/learn/${mission.reflection.nextMissionId}`} className="btn btn-primary flex-1">
                      المهمة الجاية ←
                    </Link>
                  ) : (
                    <Link href="/learn" className="btn btn-primary flex-1">
                      مسار التعلم
                    </Link>
                  )}
                </div>
              </div>
            )}

            {feedback && (
              <FeedbackPanel kind={feedback.action.kind} message={feedback.action.message} errorType={feedback.diagnosis?.errorType} />
            )}

            {step !== "reflect" && (
              <div className="flex gap-2 pt-1">
                <button onClick={next} disabled={!canAdvance} className="btn btn-mint flex-1">
                  {step === "challenge" ? "يلا نبدأ" : "كمّل"} ←
                </button>
                {step !== "challenge" && (
                  <button onClick={() => setTutorOpen(true)} className="btn btn-ghost" aria-label="اسأل مِخيال">
                    🦉 <span className="hidden sm:inline">اسأل مِخيال</span>
                  </button>
                )}
              </div>
            )}
          </section>

          {/* workspace column */}
          <section className="space-y-4" aria-label="مساحة العمل">
            {showSim ? (
              <>
                <div className="card overflow-hidden" dir="ltr">
                  <Sim params={params} runKey={runKey} onFinish={onRunFinished} />
                </div>
                {simInteractive && (
                  <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {mission.experiment.params.map((p) => (
                          <VariableSlider key={p.key} param={p} value={params[p.key]} onChange={(v) => setParam(p.key, v)} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <button onClick={run} className="btn btn-primary flex-1">
                          ▶ شغّل التجربة
                        </button>
                        <button onClick={() => { setParams(defaults); resetRun(); }} className="btn btn-ghost">
                          ↺ إعادة ضبط
                        </button>
                      </div>
                      {runKey > 0 && !simRunning && (
                        <p role="status" className={`pop-in rounded-[14px] border-2 p-3 font-semibold ${outcome.success ? "border-mint bg-mint-soft text-mint-dark" : "border-line bg-surface text-ink"}`}>
                          {outcome.message}
                        </p>
                      )}
                    </div>
                    <div className="space-y-3">
                      <div className="card p-4">
                        <p className="mb-2 text-sm font-bold text-ink-2">قراءات مباشرة</p>
                        <dl className="space-y-1.5">
                          {outcome.readouts.map((r) => (
                            <div key={r.label} className="flex items-baseline justify-between gap-2">
                              <dt className="text-sm text-ink-3">{r.label}</dt>
                              <dd className="ltr font-latin font-bold text-ink">
                                {r.value} <span className="text-xs text-ink-3">{r.unit}</span>
                              </dd>
                            </div>
                          ))}
                        </dl>
                      </div>
                      {runs.length > 0 && (
                        <div className="card p-4">
                          <p className="mb-2 text-sm font-bold text-ink-2">سجل التجارب</p>
                          <ul className="space-y-1.5">
                            {runs.map((r, i) => (
                              <li key={i}>
                                <button
                                  onClick={() => { setParams(r.params); resetRun(); }}
                                  className="flex w-full items-center justify-between gap-2 rounded-[10px] px-2 py-1 text-start text-sm hover:bg-muted"
                                  title="رجّع الإعدادات دي"
                                >
                                  <span className="ltr font-latin text-ink-2">
                                    {Object.entries(r.params).map(([k, v]) => `${k}=${v}`).join("  ")}
                                  </span>
                                  <span aria-label={r.outcome.success ? "نجحت" : "لم تنجح"}>{r.outcome.success ? "✅" : "✖️"}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : step === "apply" ? (
              <div className="card space-y-3 p-5">
                <div className="flex items-center justify-between">
                  <h2 className="font-bold text-ink">🧠 إطار حل المشكلات</h2>
                  <span className="chip text-xs">{scaffold === "full" ? "إرشاد كامل" : scaffold === "partial" ? "إرشاد جزئي" : "حل مستقل"}</span>
                </div>
                <p className="text-sm text-ink-3">موقف جديد بنفس الفكرة. المساعدة بتقل كل ما إتقانك يزيد.</p>
                <ProblemSolverSteps prompts={mission.application.solver} scaffold={scaffold} />
              </div>
            ) : (
              <div className="card space-y-4 p-6">
                <h2 className="font-display text-2xl font-extrabold text-ink">رحلتك في المهمة دي</h2>
                <ol className="grid gap-2 sm:grid-cols-3">
                  {STEP_ORDER.slice(0, 5).map((s, i) => (
                    <li key={s} className="rounded-[14px] border-2 border-mint bg-mint-soft p-3 text-sm font-semibold text-mint-dark">
                      ✓ {i + 1}. {STEP_LABELS[s]}
                    </li>
                  ))}
                </ol>
                <div className="rounded-[16px] bg-sim p-4 text-center text-2xl">
                  <Tex block>{mission.discovery.latex}</Tex>
                </div>
                <p className="text-sm text-ink-3">جرّبت {runs.length} تجربة، وعملت {(attempts.discover ?? 0) + (attempts.apply ?? 0)} محاولة حل.</p>
              </div>
            )}
          </section>
        </main>
      )}

      <TutorPanel open={tutorOpen} onClose={() => setTutorOpen(false)} messages={messages} busy={tutorBusy} onSend={(t) => askTutor(t)} onHint={() => askTutor()} />
    </div>
  );
}
