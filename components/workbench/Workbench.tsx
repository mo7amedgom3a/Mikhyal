"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CircleCheck, Circle, Clapperboard, Lightbulb, ListChecks, Network, Server, Target, Laptop, RotateCcw } from "lucide-react";
import type { TutorRequest, TutorResponse } from "@/lib/engine/tutor";
import type { AuthoredStep, SolutionStep, StepValidation, WorkbenchProblem } from "@/lib/workbench/types";
import { HINT_TIERS } from "@/lib/workbench/types";
import { tutorService, workbenchService } from "@/lib/api/services";
import { checklistStatus, makeStep, stepId, uuid } from "@/lib/workbench/steps";
import { nextNode, pathStatus, reachedFromValidations, validateSequence } from "@/lib/workbench/validate";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { cn } from "@/lib/utils";
import { GraphLegend, SolutionGraphView } from "./SolutionGraphView";
import { SolutionExplorer } from "./SolutionExplorer";
import { StepCard, TIER_LABEL, type StepEntry } from "./StepCard";
import { StepEditor, type StepDraft } from "./StepEditor";

const fmtKnown = (v: number) => (Math.abs(v) >= 1e5 || (v !== 0 && Math.abs(v) < 1e-3) ? v.toExponential(3).replace(/e([+-]?\d+)/, "\\times10^{$1}") : String(+v.toPrecision(4)));

export function Workbench({ problem }: { problem: WorkbenchProblem }) {
  const [entries, setEntries] = useState<StepEntry[]>([]);
  const [busy, setBusy] = useState(false);
  const [source, setSource] = useState<"server" | "local" | null>(null);
  const [retrying, setRetrying] = useState<string | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [explorerPath, setExplorerPath] = useState<number | undefined>(undefined);
  const [idle, setIdle] = useState(false);
  const [demoRunning, setDemoRunning] = useState(false);
  const entriesRef = useRef(entries);
  entriesRef.current = entries;

  const validations = entries.map((e) => e.validation).filter(Boolean) as StepValidation[];
  const reached = useMemo(() => reachedFromValidations(problem, validations), [problem, validations]);
  const goalReached = validations.some((v) => v.goalReached);
  const failures = validations.filter((v) => v.action !== "accept").length + entries.reduce((n, e) => n + e.attempts.filter((a) => a.validation.action !== "accept").length, 0);
  const checklist = checklistStatus(problem, entries.map((e) => e.step), entries.map((e) => e.validation!).filter(Boolean));
  const status = pathStatus(problem, reached);
  const activePath = explorerPath ?? status.filter((p) => p.consistent && p.done > 0).sort((a, b) => b.done / b.total - a.done / a.total)[0]?.index;
  const contextNode = nextNode(problem, reached);

  // A student who hasn't submitted for a minute (and isn't done) gets a gentle nudge on the hint button.
  useEffect(() => {
    setIdle(false);
    if (goalReached) return;
    const t = setTimeout(() => setIdle(true), 60_000);
    return () => clearTimeout(t);
  }, [entries.length, goalReached]);

  const validate = useCallback(
    async (list: StepEntry[]) => {
      setBusy(true);
      const steps = list.map((e) => e.step);
      const prior = Object.fromEntries(list.map((e) => [e.step.step_id, e.attempts.filter((a) => a.validation.action !== "accept").length]));
      let result: StepValidation[];
      try {
        result = (await workbenchService.validate(problem.id, steps, { prior_failed_attempts: prior })).validations;
        setSource("server");
      } catch {
        result = validateSequence(problem, steps, { priorFailedAttempts: prior });
        setSource("local");
      }
      const next = list.map((e, i) => ({ ...e, validation: result[i] }));
      setEntries(next);
      setBusy(false);
      return next;
    },
    [problem],
  );

  const toStep = (draft: StepDraft, id: string): SolutionStep =>
    makeStep(problem, { step_id: id, latex: draft.latex, operation: draft.operation, target: draft.target, unit: draft.unit, explanation: draft.explanation, inputs: draft.inputs }, { attempt_id: `attempt_${uuid().slice(0, 8)}`, client_step_id: uuid() });

  const submit = async (draft: StepDraft) => {
    const current = entriesRef.current;
    if (retrying) {
      const list = current.map((e) =>
        e.step.step_id === retrying ? { step: toStep(draft, retrying), attempts: e.validation ? [...e.attempts, { step: e.step, validation: e.validation }] : e.attempts } : e,
      );
      setRetrying(null);
      await validate(list);
    } else {
      await validate([...current, { step: toStep(draft, stepId(current.length + 1)), attempts: [] }]);
    }
  };

  const interpret = async (index: number) => {
    const e = entriesRef.current[index];
    if (!e.validation) return;
    setEntries((list) => list.map((x, i) => (i === index ? { ...x, interpretation: { text: "", source: "rules", busy: true } } : x)));
    const req: TutorRequest = {
      workbenchId: problem.id,
      step: "workbench",
      message: e.step.student_explanation || e.step.expression_latex,
      hintLevel: Math.min(failures, 3),
      context: `step ${e.step.step_id} (${e.step.operation}): ${e.step.expression_latex} | verdicts: math=${e.validation.mathematical.code}, phys=${e.validation.physical.code}, ped=${e.validation.pedagogical.code} | trace: ${e.validation.trace.map((t) => `${t.layer}:${t.output}`).join(" ; ")}`,
    };
    let reply: TutorResponse;
    try {
      reply = await tutorService.ask(req);
    } catch {
      reply = { reply: problem.hints.strategic, hintLevel: 1, source: "rules" };
    }
    setEntries((list) => list.map((x, i) => (i === index ? { ...x, interpretation: { text: reply.reply, source: reply.source } } : x)));
  };

  const reset = () => {
    setEntries([]);
    setRetrying(null);
    setHintLevel(0);
    setSource(null);
  };

  const runDemo = async () => {
    const demo = problem.demo ?? { steps: problem.paths[0].steps, fixIndex: -1, fix: problem.paths[0].steps[0] };
    reset();
    setDemoRunning(true);
    const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
    const draftOf = (s: AuthoredStep, i: number): StepDraft => ({
      latex: s.latex,
      operation: s.operation,
      target: s.target,
      unit: s.unit ?? "",
      explanation: s.explanation,
      inputs: (s.inputs ?? (i > 0 ? [i - 1] : [])).map((k) => stepId(k + 1)),
    });
    let list: StepEntry[] = [];
    for (let i = 0; i < demo.steps.length; i++) {
      list = [...list, { step: toStep(draftOf(demo.steps[i], i), stepId(i + 1)), attempts: [] }];
      list = await validate(list);
      await wait(700);
    }
    if (demo.fixIndex >= 0) {
      await wait(900);
      const id = stepId(demo.fixIndex + 1);
      list = list.slice(0, demo.fixIndex + 1).map((e) => (e.step.step_id === id ? { step: toStep(draftOf(demo.fix, demo.fixIndex), id), attempts: e.validation ? [...e.attempts, { step: e.step, validation: e.validation }] : e.attempts } : e));
      list = await validate(list);
      for (const [k, s] of (demo.after ?? []).entries()) {
        await wait(700);
        const i = demo.fixIndex + 1 + k;
        list = [...list, { step: toStep(draftOf(s, i), stepId(i + 1)), attempts: [] }];
        list = await validate(list);
      }
    }
    setDemoRunning(false);
  };

  const retryEntry = retrying ? entries.find((e) => e.step.step_id === retrying) : undefined;
  const retryDraft: StepDraft | undefined = retryEntry
    ? { latex: retryEntry.step.expression_latex, operation: retryEntry.step.operation, target: retryEntry.step.target_variable, unit: retryEntry.step.unit, explanation: retryEntry.step.student_explanation, inputs: retryEntry.step.inputs }
    : undefined;

  const unanticipatedNodes = entries.flatMap((e) =>
    e.validation?.unanticipated ? [{ id: `student_${e.step.step_id}`, label: e.validation.trace[0]?.output.slice(0, 22) ?? "step", after: undefined }] : [],
  );
  const hintPulse = !goalReached && hintLevel < 4 && (failures >= 2 || idle);
  const tierText = (i: number) => contextNode?.hints?.[HINT_TIERS[i]] ?? problem.hints[HINT_TIERS[i]];

  return (
    <main className="mx-auto max-w-[1280px] space-y-5 px-4 py-6">
      <section className="rounded-[22px] border-2 border-border bg-card p-5 sm:p-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="default">المختبر الرياضي</Badge>
          <Badge variant="outline">بيقيّم طريقة تفكيرك، مش الإجابة بس</Badge>
          {source && (
            <Badge variant={source === "server" ? "mint" : "amber"}>
              {source === "server" ? <Server /> : <Laptop />} {source === "server" ? "اتحقق على الخادم" : "اتحقق محليًا"}
            </Badge>
          )}
        </div>
        <h1 className="mt-3 font-display text-3xl font-extrabold text-ink">{problem.title}</h1>
        <p className="mt-2 text-[17px] leading-8 text-ink">
          <MathText>{problem.scenario}</MathText>
        </p>
        <p className="mt-1 flex items-center gap-2 text-[17px] font-bold text-primary">
          <Target className="size-5 shrink-0" /> <MathText>{problem.ask}</MathText>
        </p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={runDemo} disabled={demoRunning || busy} data-demo>
            <Clapperboard /> شوف عرض توضيحي
          </Button>
          <Button variant="ghost" size="sm" onClick={reset} disabled={demoRunning || !entries.length}>
            <RotateCcw /> ابدأ من الأول
          </Button>
        </div>
      </section>

      <div className="grid gap-5 lg:grid-cols-[minmax(300px,380px)_1fr]">
        <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
          <section className="rounded-[20px] border-2 border-border bg-card p-4">
            <h2 className="mb-2 font-bold text-ink">المعطيات</h2>
            <ul className="flex flex-wrap gap-1.5" dir="ltr">
              {Object.entries(problem.knowns).map(([k, v]) => (
                <li key={k} className="rounded-full border-2 border-border bg-sim px-2.5 py-0.5 text-sm">
                  <Tex>{`${problem.symbols[k].tex} = ${fmtKnown(v)}${problem.symbols[k].unit ? `\\,\\mathrm{${problem.symbols[k].unit.replace(/ /g, "\\,")}}` : ""}`}</Tex>
                </li>
              ))}
            </ul>
            <h3 className="mb-1 mt-3 text-sm font-bold text-ink-2">الافتراضات</h3>
            <ul className="space-y-1 text-sm text-ink-2">
              {problem.assumptions.map((a) => (
                <li key={a.id}>
                  • <MathText>{a.label_ar}</MathText>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[20px] border-2 border-border bg-card p-4" aria-labelledby="checklist-title">
            <h2 id="checklist-title" className="mb-2 flex items-center gap-2 font-bold text-ink">
              <ListChecks className="size-5 text-primary" /> قائمة الإكمال
            </h2>
            <ul className="space-y-1.5" data-checklist>
              {problem.checklist.map((c) => (
                <li key={c.id} className={cn("flex items-start gap-2 text-[15px]", checklist[c.id] ? "text-mint-dark" : "text-ink-2")} data-done={checklist[c.id] ? "true" : "false"}>
                  {checklist[c.id] ? <CircleCheck className="mt-0.5 size-5 shrink-0" /> : <Circle className="mt-0.5 size-5 shrink-0 text-ink-3" />}
                  <span>
                    {c.label_ar} <span className="text-xs text-ink-3">· {c.label_en}</span>
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="rounded-[20px] border-2 border-border bg-card p-4" aria-labelledby="hints-title">
            <div className="mb-2 flex items-center justify-between gap-2">
              <h2 id="hints-title" className="flex items-center gap-2 font-bold text-ink">
                <Lightbulb className="size-5 text-amber-dark" /> تلميحات متدرّجة
              </h2>
              <Button size="sm" variant="amber" onClick={() => setHintLevel((h) => Math.min(4, h + 1))} disabled={hintLevel >= 4} className={cn(hintPulse && "animate-pulse")} data-hint-button>
                {hintLevel ? "تلميح أوضح" : "محتاج تلميح"}
              </Button>
            </div>
            {hintPulse && hintLevel === 0 && <p className="mb-2 text-sm text-amber-dark">شكلك واقف شوية — التلميح الأول مابيحرقش الحل.</p>}
            <ol className="space-y-2">
              {HINT_TIERS.slice(0, hintLevel).map((t, i) => (
                <li key={t} className="pop-in rounded-[12px] border-2 border-amber bg-amber-soft p-2.5 text-sm leading-7 text-ink">
                  <span className="font-bold">
                    {i + 1}. {TIER_LABEL[t]}:{" "}
                  </span>
                  <MathText>{tierText(i)}</MathText>
                </li>
              ))}
            </ol>
            {hintLevel === 0 && <p className="text-sm text-ink-3">مفاهيمي ← استراتيجي ← إجرائي ← تحقق. كل مستوى أوضح من اللي قبله، ومافيش واحد بيدّيك الإجابة.</p>}
          </section>
        </aside>

        <div className="min-w-0 space-y-4">
          {entries.length === 0 && (
            <p className="rounded-[18px] border-2 border-dashed border-line-strong bg-surface p-4 text-[15px] leading-7 text-ink-2">
              اكتب حلك خطوة خطوة. كل خطوة بتتقيّم على 3 حاجات منفصلة: <b>رياضيًا</b> (التحويل صح؟)، <b>فيزيائيًا</b> (القانون والإشارات والوحدات مناسبة؟)، و<b>تربويًا</b> (بتقرّبك من الهدف؟). أي طريق صحيح مقبول — حتى لو مش اللي في الكتاب.
            </p>
          )}
          <ol className="space-y-3" aria-label="خطواتك">
            {entries.map((e, i) => (
              <StepCard key={e.step.step_id} problem={problem} index={i} entry={e} onRetry={() => setRetrying(e.step.step_id)} onInterpret={() => interpret(i)} />
            ))}
          </ol>
          {goalReached && (
            <div className="pop-in rounded-[18px] border-2 border-mint bg-mint-soft p-4 text-ink" role="status">
              <p className="font-display text-xl font-extrabold text-mint-dark">وصلت للمطلوب 🎯</p>
              <p className="text-sm">
                {Object.values(checklist).every(Boolean) ? "وكمان خلّصت كل قائمة الإكمال." : "بص على قائمة الإكمال: لسه فيه حاجة ناقصة (زي التحقق من النتيجة)."}
                {validations.some((v) => v.unanticipated) ? " وحليتها بطريقة جديدة اتسجّلت للمدرّس ✦" : ""}
              </p>
            </div>
          )}
          <StepEditor
            problem={problem}
            previous={entries.map((e) => ({ step_id: e.step.step_id, label: (e.validation?.trace[0]?.output ?? e.step.expression_latex).slice(0, 26) }))}
            initial={retryDraft}
            retrying={retrying ?? undefined}
            onSubmit={submit}
            onCancelRetry={() => setRetrying(null)}
            disabled={busy || demoRunning}
          />
        </div>
      </div>

      <section className="space-y-3 rounded-[20px] border-2 border-border bg-card p-4 sm:p-5" aria-labelledby="graph-title">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 id="graph-title" className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
            <Network className="size-5 text-primary" /> جراف الحل
          </h2>
          <p className="text-sm text-ink-2">
            {status.map((p) => `مسار ${p.index + 1}: ${p.done}/${p.total}`).join(" · ")}
            {unanticipatedNodes.length ? " · + مسار جديد" : ""}
          </p>
        </div>
        <p className="text-sm text-ink-2">الجراف بيمثل الطرق المعروفة اللي كتبها المدرّس — مش قائمة بكل الحلول المسموحة. لو مشيت بطريقة صحيحة مش موجودة، هتتضاف كعقدة جديدة.</p>
        <SolutionGraphView graph={problem.graph} highlight={{ reached, activePath, extra: unanticipatedNodes }} />
        <GraphLegend />
      </section>

      <SolutionExplorer problem={problem} onPathChange={setExplorerPath} />
    </main>
  );
}
