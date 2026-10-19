"use client";
import Link from "next/link";
import { Braces, FlaskConical, History, Layers, Loader2, MessagesSquare, RotateCcw, Sparkles } from "lucide-react";
import type { SolutionStep, StepValidation, WorkbenchProblem } from "@/lib/workbench/types";
import { chainTex } from "@/lib/workbench/steps";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { cn } from "@/lib/utils";
import { ACTION_META, ActionChip, LAYER_META, StatusIcon, STATUS_STYLE, VerdictPill } from "./Verdicts";

export const OPERATION_LABEL: Record<SolutionStep["operation"], string> = {
  select_principle: "اختيار قانون",
  isolate_variable: "عزل متغير",
  substitute: "تعويض",
  compute: "حساب / تحويل وحدة",
  simplify: "تبسيط",
  solve_equation: "حل معادلة",
  verify: "تحقق",
};

export function PipelineTrace({ validation }: { validation: StepValidation }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] text-sm">
        <thead>
          <tr className="text-ink-3">
            <th className="p-1.5 text-start font-semibold">الطبقة</th>
            <th className="p-1.5 text-start font-semibold">الأداة (إنتاج)</th>
            <th className="p-1.5 text-start font-semibold">المخرج</th>
          </tr>
        </thead>
        <tbody>
          {validation.trace.map((t, i) => (
            <tr key={i} className="border-t border-border align-top">
              <td className="p-1.5">
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[t.status])}>
                  <StatusIcon status={t.status} className="size-3.5" />
                  {LAYER_META[t.layer].layer}
                </span>
              </td>
              <td className="p-1.5 text-ink-2">{LAYER_META[t.layer].production}</td>
              <td className="p-1.5">
                <code dir="ltr" className="block break-all font-latin text-xs text-ink">
                  {t.output}
                </code>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export interface StepEntry {
  step: SolutionStep;
  validation?: StepValidation;
  /** Earlier attempts of this step, oldest first. */
  attempts: { step: SolutionStep; validation: StepValidation }[];
  interpretation?: { text: string; source: "rules" | "llm"; busy?: boolean };
}

export function StepCard({
  problem,
  index,
  entry,
  onRetry,
  onInterpret,
  hint,
}: {
  problem: WorkbenchProblem;
  index: number;
  entry: StepEntry;
  onRetry: () => void;
  onInterpret: () => void;
  hint?: string;
}) {
  const v = entry.validation;
  const tex = chainTex(problem, entry.step.expression_latex);
  const wire = v ? { ...entry.step, expression_ast: v.expression_ast } : entry.step;
  return (
    <li className={cn("pop-in rounded-[18px] border-2 bg-card p-4", v?.action === "accept" ? "border-mint/50" : v ? "border-amber" : "border-border")} data-step={entry.step.step_id} data-action={v?.action}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="grid size-8 place-items-center rounded-full bg-primary-soft font-latin text-sm font-bold text-primary">{index + 1}</span>
        <span className="text-sm font-semibold text-ink-3">{OPERATION_LABEL[entry.step.operation]}</span>
        {entry.step.inputs.length > 0 && <span className="text-xs text-ink-3">← من {entry.step.inputs.map((i) => Number(i.replace("step_", ""))).join("، ")}</span>}
        {entry.attempts.length > 0 && (
          <span className="inline-flex items-center gap-1 text-xs text-ink-3">
            <History className="size-3.5" /> المحاولة {entry.attempts.length + 1}
          </span>
        )}
        <span className="flex-1" />
        {v ? <ActionChip action={v.action} /> : <Loader2 className="size-4 animate-spin text-ink-3" aria-label="بيتحقق" />}
      </div>

      <div className="mt-3 overflow-x-auto rounded-[12px] bg-sim px-3 py-2 text-lg" dir="ltr">
        {tex ? <Tex>{tex}</Tex> : <code className="font-latin">{entry.step.expression_latex}</code>}
        {entry.step.unit && !/\\mathrm/.test(tex ?? "") && <Tex>{`\\;[\\mathrm{${entry.step.unit.replace(/\^(\d)/g, "^$1")}}]`}</Tex>}
      </div>
      {entry.step.student_explanation && <p className="mt-2 text-sm text-ink-2">«{entry.step.student_explanation}»</p>}

      {v && (
        <>
          <div className="mt-3 flex flex-wrap gap-1.5">
            <VerdictPill property="mathematical" verdict={v.mathematical} />
            <VerdictPill property="physical" verdict={v.physical} />
            <VerdictPill property="pedagogical" verdict={v.pedagogical} />
            {v.unanticipated && (
              <span className="inline-flex items-center gap-1 rounded-full border-2 border-amber bg-amber-soft px-2.5 py-0.5 text-sm font-semibold text-amber-dark">
                <Sparkles className="size-4" /> مسار غير متوقع وصحيح
              </span>
            )}
          </div>
          <p className="mt-3 text-[15px] leading-7 text-ink" aria-live="polite">
            <MathText>{v.feedback_ar}</MathText>
          </p>
          {v.hint && (
            <p className="mt-2 rounded-[12px] border-2 border-amber bg-amber-soft px-3 py-2 text-sm leading-7 text-ink">
              <span className="font-bold">تلميح ({TIER_LABEL[v.hint.tier]}): </span>
              <MathText>{hint ?? v.hint.text}</MathText>
            </p>
          )}
          {entry.interpretation && (
            <p className="mt-2 rounded-[12px] border-2 border-primary/30 bg-primary-soft px-3 py-2 text-sm leading-7 text-ink">
              <span className="font-bold">مِخيال فهم كده{entry.interpretation.source === "llm" ? " (Claude)" : ""}: </span>
              {entry.interpretation.busy ? "…" : <MathText>{entry.interpretation.text}</MathText>}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            {v.action !== "accept" && (
              <Button size="sm" variant="outline" onClick={onRetry} data-retry={entry.step.step_id}>
                <RotateCcw /> أعد الخطوة دي
              </Button>
            )}
            {v.action === "experiment" && problem.experimentHref && (
              <Button asChild size="sm">
                <Link href={problem.experimentHref}>
                  <FlaskConical /> جرّبها في المحاكاة
                </Link>
              </Button>
            )}
            {v.action === "ai_interpret" && !entry.interpretation && (
              <Button size="sm" onClick={onInterpret}>
                <MessagesSquare /> {ACTION_META.ai_interpret.label}
              </Button>
            )}
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            <details className="rounded-[12px] border-2 border-border bg-surface p-2 open:col-span-full">
              <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink-2">
                <Layers className="size-4" /> مسار التحقق (8 طبقات)
              </summary>
              <div className="mt-2">
                <PipelineTrace validation={v} />
              </div>
            </details>
            <details className="rounded-[12px] border-2 border-border bg-surface p-2 open:col-span-full">
              <summary className="flex cursor-pointer items-center gap-1.5 text-sm font-semibold text-ink-2">
                <Braces className="size-4" /> الخطوة كـ JSON
              </summary>
              <pre dir="ltr" className="mt-2 max-h-72 overflow-auto rounded-[10px] bg-ink p-3 text-start font-latin text-xs leading-5 text-white">
                {JSON.stringify(wire, null, 2)}
              </pre>
            </details>
          </div>
          {entry.attempts.length > 0 && (
            <details className="mt-2 text-sm">
              <summary className="cursor-pointer text-ink-3">المحاولات السابقة ({entry.attempts.length})</summary>
              <ul className="mt-1 space-y-1">
                {entry.attempts.map((a) => (
                  <li key={a.step.attempt_id} className="flex flex-wrap items-center gap-2 rounded-[10px] bg-muted px-2 py-1">
                    <code dir="ltr" className="font-latin text-xs">
                      {a.step.expression_latex}
                    </code>
                    <ActionChip action={a.validation.action} />
                    <code dir="ltr" className="text-[11px] text-ink-3">
                      {a.step.client_step_id.slice(0, 8)}
                    </code>
                  </li>
                ))}
              </ul>
            </details>
          )}
        </>
      )}
    </li>
  );
}

export const TIER_LABEL = { conceptual: "مفاهيمي", strategic: "استراتيجي", procedural: "إجرائي", verification: "تحقق" } as const;
