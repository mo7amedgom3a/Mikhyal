"use client";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { STEP_ORDER, type ChoiceRule, type Diagnosis, type ExperimentOutcome, type LearningEvent, type Mission, type StepId } from "@/lib/engine/types";
import { checkEquation, checkNumeric } from "@/lib/engine/evaluator";
import { decideNext, nextHint, shouldUseLLM, solverScaffold, ERROR_LABELS, type NextAction } from "@/lib/engine/pedagogy";
import { emptyState, missionMastery, recordEvent, recordEvidence, type LearnerState } from "@/lib/engine/learnerModel";
import type { LearnerModel } from "@/lib/domain";
import { useLearnerModel, useMission } from "@/lib/api/hooks";
import { gradingService, learnerService, sessionService, tutorService } from "@/lib/api/services";
import { hydrateMission } from "@/lib/engines/missions";
import type { TutorRequest, TutorResponse } from "@/lib/engine/tutor";
import { SIMS } from "@/components/sims";
import { snapToParam } from "@/components/sims/useSimClock";
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
import { MissionIcon } from "@/lib/missions/icons";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MathText } from "@/components/ui/MathText";
import {
  ArrowLeft,
  Bot,
  Brain,
  Check,
  CircleCheck,
  ClipboardCheck,
  Compass,
  Eye,
  FlaskConical,
  Gauge,
  History,
  PartyPopper,
  Puzzle,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  TriangleAlert,
  X,
} from "lucide-react";

interface Run {
  params: Record<string, number>;
  outcome: ExperimentOutcome;
}

interface Feedback {
  action: NextAction;
  diagnosis?: Diagnosis;
}

/** Loads the mission record and learner model from the API, starts a session, then renders the player. */
export function MissionPlayer({ missionId }: { missionId: string }) {
  const detail = useMission(missionId);
  const learner = useLearnerModel();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const mission = useMemo(() => (detail.data ? hydrateMission(detail.data.mission, detail.data.exam ?? undefined) : null), [detail.data]);
  const recordId = detail.data?.mission.id;
  useEffect(() => {
    if (!recordId) return;
    let alive = true;
    sessionService
      .start(recordId, "discovery")
      .then((s) => alive && setSessionId(s.id))
      .catch(() => alive && setSessionId("offline"));
    return () => {
      alive = false;
    };
  }, [recordId]);

  if (detail.error)
    return (
      <div className="mx-auto max-w-lg p-8 text-center text-ink-2" role="alert">
        مش قادرين نحمّل المهمة دلوقتي. <Link href="/learn" className="font-semibold text-primary underline">ارجع للمسار</Link>
      </div>
    );
  if (!mission || !recordId || learner.isLoading || !sessionId)
    return <div className="mx-auto mt-10 h-[60vh] max-w-[1280px] animate-pulse rounded-[20px] border-2 border-border bg-sim" aria-label="بيحمّل المهمة" />;
  return <MissionPlayerView mission={mission} recordId={recordId} examId={detail.data?.exam?.id} sessionId={sessionId} initialLearner={learner.data} />;
}

function toLearnerState(m?: LearnerModel): LearnerState {
  if (!m) return emptyState();
  return { concepts: m.concepts, errors: m.errors as LearnerState["errors"], completedMissions: m.completedMissions, events: [] };
}

function MissionPlayerView({ mission, recordId, examId, sessionId, initialLearner }: { mission: Mission; recordId: string; examId?: string; sessionId: string; initialLearner?: LearnerModel }) {
  const defaults = useMemo(
    () => Object.fromEntries(mission.experiment.params.map((p) => [p.key, p.default])),
    [mission],
  );

  const [mode, setMode] = useState<"discovery" | "exam">("discovery");
  const [stepIdx, setStepIdx] = useState(0);
  const [maxReached, setMaxReached] = useState(0);
  const [learner, setLearner] = useState<LearnerState>(() => toLearnerState(initialLearner));

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


  const log = useCallback(
    (e: Omit<LearningEvent, "missionId" | "at">, evidence?: { correct: boolean; hints?: number }) => {
      const at = Date.now();
      // Optimistic local update; the server applies the same BKT update and stays the source of truth.
      setLearner((s) => {
        let next = recordEvent(s, { ...e, missionId: mission.id, at });
        if (evidence) next = recordEvidence(next, mission.concepts, evidence.correct, evidence.hints ?? 0);
        return next;
      });
      if (e.diagnosis) setSessionErrors((d) => [...d, e.diagnosis!]);
      if (sessionId !== "offline")
        sessionService
          .events(sessionId, [{ ...e, contentId: mission.id, at, evidence: evidence ? { conceptKeys: mission.concepts, correct: evidence.correct, hintsUsed: evidence.hints ?? 0 } : undefined }])
          .catch(() => undefined);
    },
    [mission, sessionId],
  );

  const goTo = (i: number) => {
    setStepIdx(i);
    setMaxReached((m) => Math.max(m, i));
    setFeedback(null);
    setRevealed(false);
    if (STEP_ORDER[i] === "reflect" && !learner.completedMissions.includes(mission.id)) {
      setLearner((s) => ({ ...s, completedMissions: [...s.completedMissions, mission.id] }));
      learnerService.completeMission(recordId).catch(() => undefined);
      if (sessionId !== "offline") sessionService.complete(sessionId).catch(() => undefined);
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
    const spec = mission.experiment.params.find((p) => p.key === k);
    const value = spec ? snapToParam(v, spec) : v;
    setParams((p) => (p[k] === value ? p : { ...p, [k]: value }));
    resetRun();
  };

  // ── checks ──────────────────────────────────────────────────
  const bump = (s: StepId) => {
    const n = (attempts[s] ?? 0) + 1;
    setAttempts((a) => ({ ...a, [s]: n }));
    return n;
  };

  const submitPrediction = async () => {
    if (!choice) return;
    setPredictionLocked(true);
    let correct: boolean;
    let diagnosis: Diagnosis | undefined;
    try {
      const r = await gradingService.predict(recordId, choice);
      correct = r.correct;
      diagnosis = r.diagnosis;
    } catch {
      correct = choice === mission.prediction.correctId;
      const rule: ChoiceRule | undefined = mission.prediction.rules.find((r) => r.choiceId === choice);
      diagnosis = correct || !rule ? undefined : { ruleId: rule.ruleId, errorType: rule.errorType, prompt: rule.prompt };
    }
    log({ step: "predict", kind: "prediction", correct, diagnosis, detail: choice }, { correct });
    setFeedback({
      action: correct
        ? { kind: "advance", message: `توقّع ممتاز! ${mission.prediction.reveal}`, hintLevel: 0, reveal: false }
        : decideNext({ correct, diagnosis, attempts: 1, hintLevel: 0, hints: mission.hints.predict ?? [] }),
      diagnosis,
    });
  };

  const submitEquation = async () => {
    const d = mission.discovery;
    let res: { status: "correct" | "incorrect" | "parse_error"; diagnosis?: Diagnosis };
    try {
      res = await gradingService.checkEquation(recordId, equation, { attempts: (attempts.discover ?? 0) + 1, hintLevel: hintLevel.discover ?? 0 });
    } catch {
      // Offline: same deterministic checker locally.
      res = checkEquation(equation, { variables: Object.keys(d.variables), targets: d.targets, domain: d.domain, wrongRelations: d.wrongRelations, forbiddenSymbols: d.forbiddenSymbols });
    }
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

  const submitNumeric = async () => {
    const a = mission.application;
    let res: { status: "correct" | "incorrect" | "parse_error"; diagnosis?: Diagnosis };
    try {
      res = await gradingService.checkAnswer(recordId, numeric, { attempts: (attempts.apply ?? 0) + 1, hintLevel: hintLevel.apply ?? 0 });
    } catch {
      res = checkNumeric(numeric, a.answer, a.wrongValues);
    }
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
      const data: TutorResponse = await tutorService.ask(req);
      setHintLevel((x) => ({ ...x, [s]: data.hintLevel }));
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
      <header className="sticky top-0 z-30 border-b-2 border-border bg-surface/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-4 py-2.5">
          <div className="hidden sm:block">
            <Logo href="/learn" />
          </div>
          <Button asChild variant="outline" size="icon-sm" className="sm:hidden">
            <Link href="/learn" aria-label="رجوع لمسار التعلم">
              <X />
            </Link>
          </Button>
          <div className="flex-1">
            {mode === "discovery" ? (
              <LessonProgress current={stepIdx} maxReached={maxReached} onJump={goTo} />
            ) : (
              <p className="flex items-center gap-2 font-bold text-ink">
                <ClipboardCheck className="size-5 text-amber-dark" aria-hidden /> وضع الامتحان — {mission.title}
              </p>
            )}
          </div>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "discovery" | "exam")}>
            <TabsList aria-label="الوضع">
              <TabsTrigger value="discovery">
                <FlaskConical /> اكتشاف
              </TabsTrigger>
              <TabsTrigger value="exam">
                <ClipboardCheck /> امتحان
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      {mode === "exam" ? (
        <main className="px-4 py-8">
          <ExamMode
            mission={mission}
            examId={examId}
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
          <section aria-labelledby="step-title" className="rounded-[20px] border-2 border-border bg-card lg:self-start">
              <CardContent className="space-y-4 p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <Badge>
                    <MissionIcon name={mission.icon} />
                    {mission.tagline}
                  </Badge>
                  {mission.enrichment && (
                    <Badge variant="amber">
                      <Sparkles /> إثرائي
                    </Badge>
                  )}
                </div>
                <h1 id="step-title" className="font-display text-[26px] font-extrabold leading-tight text-ink">
                  {stepIdx + 1}. {STEP_LABELS[step]}
                </h1>

                {step === "challenge" && (
                  <div className="space-y-3">
                    <p className="text-[18px] leading-9 text-ink"><MathText>{mission.challenge.story}</MathText></p>
                    <Alert variant="primary">
                      <Target />
                      <AlertDescription className="text-[17px] font-semibold leading-8 text-primary"><MathText>{mission.challenge.goal}</MathText></AlertDescription>
                    </Alert>
                    <p className="text-sm text-ink-3">قبل أي قانون، هنفكر ونجرّب بنفسنا.</p>
                  </div>
                )}

                {step === "predict" && (
                  <div className="space-y-3">
                    <p className="text-[18px] leading-9 text-ink"><MathText>{mission.prediction.question}</MathText></p>
                    <ToggleGroup
                      type="single"
                      value={choice ?? ""}
                      onValueChange={(v) => v && setChoice(v)}
                      disabled={predictionLocked}
                      className="grid-cols-2"
                      aria-label="اختيارات التوقع"
                    >
                      {mission.prediction.options.map((o) => (
                        <ToggleGroupItem
                          key={o.id}
                          value={o.id}
                          className={predictionLocked && o.id === mission.prediction.correctId ? "border-mint bg-mint-soft text-mint-dark data-[state=on]:border-mint data-[state=on]:bg-mint-soft data-[state=on]:text-mint-dark" : ""}
                        >
                          {predictionLocked && o.id === mission.prediction.correctId && <Check />}
                          <MathText>{o.label}</MathText>
                        </ToggleGroupItem>
                      ))}
                    </ToggleGroup>
                    {!predictionLocked && (
                      <Button disabled={!choice} onClick={submitPrediction} className="w-full">
                        ثبّت توقّعي
                      </Button>
                    )}
                  </div>
                )}

                {step === "experiment" && (
                  <div className="space-y-3">
                    <p className="text-[17px] leading-8 text-ink"><MathText>{mission.experiment.instruction}</MathText></p>
                    {runs.length >= 4 && !expSuccess && <p className="text-sm text-ink-3">تقدر تكمّل، بس حاول توصل للهدف الأول.</p>}
                  </div>
                )}

                {step === "discover" && (
                  <div className="space-y-3">
                    <p className="text-[17px] leading-8 text-ink"><MathText>{mission.discovery.prompt}</MathText></p>
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
                      <Button variant="outline" onClick={() => setRevealed(true)} className="w-full">
                        <Eye /> ورّيني الاشتقاق خطوة بخطوة
                      </Button>
                    )}
                  </div>
                )}

                {step === "apply" && (
                  <div className="space-y-4">
                    <p className="rounded-[14px] border-2 border-border bg-muted p-4 text-[18px] leading-9 text-ink"><MathText>{mission.application.problem}</MathText></p>
                    <NumericInput value={numeric} onChange={setNumeric} onSubmit={submitNumeric} placeholder={mission.application.unitHint} disabled={numSolved} />
                    {(numSolved || revealed) && (
                      <div className="rounded-[14px] bg-sim p-3 text-lg">
                        <Tex block>{mission.application.solution}</Tex>
                      </div>
                    )}
                    {!numSolved && !revealed && (attempts.apply ?? 0) >= 4 && (
                      <Button variant="outline" onClick={() => setRevealed(true)} className="w-full">
                        <Eye /> ورّيني الحل
                      </Button>
                    )}
                  </div>
                )}

                {step === "reflect" && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-4 rounded-[16px] border-2 border-border p-4">
                      <MasteryRing value={mastery} size={72} />
                      <div>
                        <p className="font-bold text-ink">الإتقان: {masteryLabel(mastery)}</p>
                        <p className="text-sm text-ink-2">مبني على أدائك المستقل، مش عدد الدروس.</p>
                      </div>
                    </div>
                    <Alert variant="mint">
                      <CircleCheck />
                      <AlertDescription className="text-[17px] leading-8 text-ink"><MathText>{mission.reflection.summary}</MathText></AlertDescription>
                    </Alert>
                    {sessionErrors.length > 0 ? (
                      <Alert variant="amber">
                        <Compass />
                        <AlertTitle>أفكار لسه محتاجة شغل</AlertTitle>
                        <AlertDescription>
                          <ul className="space-y-1 text-sm">
                            {[...new Map(sessionErrors.map((d) => [d.ruleId, d])).values()].slice(0, 4).map((d) => (
                              <li key={d.ruleId}>
                                <b>{ERROR_LABELS[d.errorType]}:</b> <MathText>{d.prompt}</MathText>
                              </li>
                            ))}
                          </ul>
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <Alert variant="mint">
                        <PartyPopper />
                        <AlertDescription>مفيش أخطاء متشخّصة المرة دي — عاش!</AlertDescription>
                      </Alert>
                    )}
                    {mission.reflection.sandbox && (
                      <Button asChild variant="outline" className="w-full">
                        <Link href={`/play/${mission.reflection.sandbox}`}>
                          <Puzzle /> جرّب الفكرة في ملعب التجارب
                        </Link>
                      </Button>
                    )}
                    <div className="flex flex-wrap gap-2">
                      <Button variant="amber" onClick={() => setMode("exam")} className="flex-1">
                        <ClipboardCheck /> جرّب وضع الامتحان
                      </Button>
                      <Button asChild className="flex-1">
                        {mission.reflection.nextMissionId ? (
                          <Link href={`/learn/${mission.reflection.nextMissionId}`}>
                            المهمة الجاية <ArrowLeft />
                          </Link>
                        ) : (
                          <Link href="/learn">مسار التعلم</Link>
                        )}
                      </Button>
                    </div>
                  </div>
                )}

                {feedback && <FeedbackPanel kind={feedback.action.kind} message={feedback.action.message} errorType={feedback.diagnosis?.errorType} />}

                {step !== "reflect" && (
                  <div className="flex gap-2 pt-1">
                    <Button variant="mint" onClick={next} disabled={!canAdvance} className="flex-1">
                      {step === "challenge" ? "يلا نبدأ" : "كمّل"}
                      <ArrowLeft />
                    </Button>
                    {step !== "challenge" && (
                      <Button variant="outline" onClick={() => setTutorOpen(true)} aria-label="اسأل مِخيال">
                        <Bot />
                        <span className="hidden sm:inline">اسأل مِخيال</span>
                      </Button>
                    )}
                  </div>
                )}
              </CardContent>
          </section>

          {/* workspace column */}
          <section className="space-y-4" aria-label="مساحة العمل">
            {showSim ? (
              <>
                <Card className="overflow-hidden" dir="ltr">
                  <Sim params={params} runKey={runKey} onFinish={onRunFinished} setParam={simInteractive ? setParam : undefined} />
                </Card>
                {simInteractive && (
                  <div className="grid gap-4 xl:grid-cols-[1fr_300px]">
                    <div className="space-y-3">
                      <div className="grid gap-3 sm:grid-cols-2">
                        {mission.experiment.params.map((p) => (
                          <VariableSlider key={p.key} param={p} value={params[p.key]} onChange={(v) => setParam(p.key, v)} />
                        ))}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button onClick={run} className="flex-1">
                          <Play /> شغّل التجربة
                        </Button>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setParams(defaults);
                            resetRun();
                          }}
                        >
                          <RotateCcw /> إعادة ضبط
                        </Button>
                      </div>
                      {runKey > 0 && !simRunning && (
                        <Alert variant={outcome.success ? "mint" : "default"} role="status" className="pop-in">
                          {outcome.success ? <CircleCheck /> : <TriangleAlert className="text-amber-dark" />}
                          <AlertDescription className={`font-semibold ${outcome.success ? "text-mint-dark" : "text-ink"}`}><MathText>{outcome.message}</MathText></AlertDescription>
                        </Alert>
                      )}
                    </div>
                    <div className="space-y-3">
                      <Card>
                        <CardContent className="p-4">
                          <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-2">
                            <Gauge className="size-4 text-primary" aria-hidden /> قراءات مباشرة
                          </p>
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
                        </CardContent>
                      </Card>
                      {runs.length > 0 && (
                        <Card>
                          <CardContent className="p-4">
                            <p className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink-2">
                              <History className="size-4 text-primary" aria-hidden /> سجل التجارب
                            </p>
                            <ul className="space-y-1">
                              {runs.map((r, i) => (
                                <li key={i}>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <button
                                        onClick={() => {
                                          setParams(r.params);
                                          resetRun();
                                        }}
                                        className="flex w-full items-center justify-between gap-2 rounded-[10px] px-2 py-1 text-start text-sm outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40"
                                      >
                                        <span className="ltr font-latin text-ink-2">{Object.entries(r.params).map(([k, v]) => `${k}=${v}`).join("  ")}</span>
                                        {r.outcome.success ? (
                                          <Check className="size-4 text-mint-dark" aria-label="نجحت" />
                                        ) : (
                                          <X className="size-4 text-ink-3" aria-label="لم تنجح" />
                                        )}
                                      </button>
                                    </TooltipTrigger>
                                    <TooltipContent>رجّع الإعدادات دي</TooltipContent>
                                  </Tooltip>
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : step === "apply" ? (
              <Card>
                <CardContent className="space-y-3 p-5">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="flex items-center gap-2 font-bold text-ink">
                      <Brain className="size-5 text-primary" aria-hidden /> إطار حل المشكلات
                    </h2>
                    <Badge className="text-xs">{scaffold === "full" ? "إرشاد كامل" : scaffold === "partial" ? "إرشاد جزئي" : "حل مستقل"}</Badge>
                  </div>
                  <p className="text-sm text-ink-3">موقف جديد بنفس الفكرة. المساعدة بتقل كل ما إتقانك يزيد.</p>
                  <ProblemSolverSteps prompts={mission.application.solver} scaffold={scaffold} />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="space-y-4 p-6">
                  <h2 className="font-display text-2xl font-extrabold text-ink">رحلتك في المهمة دي</h2>
                  <ol className="grid gap-2 sm:grid-cols-3">
                    {STEP_ORDER.slice(0, 5).map((s, i) => (
                      <li key={s} className="flex items-center gap-1.5 rounded-[14px] border-2 border-mint bg-mint-soft p-3 text-sm font-semibold text-mint-dark">
                        <Check className="size-4" aria-hidden /> {i + 1}. {STEP_LABELS[s]}
                      </li>
                    ))}
                  </ol>
                  <div className="rounded-[16px] bg-sim p-4 text-center text-2xl">
                    <Tex block>{mission.discovery.latex}</Tex>
                  </div>
                  <p className="text-sm text-ink-3">
                    جرّبت {runs.length} تجربة، وعملت {(attempts.discover ?? 0) + (attempts.apply ?? 0)} محاولة حل.
                  </p>
                </CardContent>
              </Card>
            )}
          </section>
        </main>
      )}

      <TutorPanel open={tutorOpen} onOpenChange={setTutorOpen} messages={messages} busy={tutorBusy} onSend={(t) => askTutor(t)} onHint={() => askTutor()} />
    </div>
  );
}
