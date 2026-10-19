"use client";
import { useCallback, useEffect, useState } from "react";
import type { SolutionStep, WorkbenchProblem } from "@/lib/workbench/types";
import { chainTex } from "@/lib/workbench/steps";
import { EquationInput } from "@/components/lesson/EquationInput";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { OPERATION_LABEL } from "./StepCard";

export interface StepDraft {
  latex: string;
  operation: SolutionStep["operation"];
  target: string;
  unit: string;
  explanation: string;
  inputs: string[];
}

const selectCls = "h-11 w-full rounded-[12px] border-2 border-line-strong bg-surface px-3 text-[15px] text-ink outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50";

export function StepEditor({
  problem,
  previous,
  initial,
  retrying,
  onSubmit,
  onCancelRetry,
  disabled,
}: {
  problem: WorkbenchProblem;
  /** Earlier steps available as inputs. */
  previous: { step_id: string; label: string }[];
  initial?: StepDraft;
  retrying?: string;
  onSubmit: (draft: StepDraft) => void;
  onCancelRetry?: () => void;
  disabled?: boolean;
}) {
  const fresh = useCallback(
    (): StepDraft => ({ latex: "", operation: previous.length ? "substitute" : "select_principle", target: problem.goal, unit: "", explanation: "", inputs: previous.length ? [previous[previous.length - 1].step_id] : [] }),
    [previous, problem.goal],
  );
  const [draft, setDraft] = useState<StepDraft>(initial ?? fresh());
  useEffect(() => {
    if (initial) setDraft(initial);
  }, [initial]);
  // A new step builds on the latest one by default.
  const lastId = previous.at(-1)?.step_id;
  useEffect(() => {
    if (!retrying) setDraft((d) => ({ ...d, inputs: lastId ? [lastId] : [] }));
  }, [lastId, retrying]);

  const variables = Object.fromEntries(Object.entries(problem.symbols).map(([k, s]) => [k, s.label_ar]));
  const symbolTex = Object.fromEntries(Object.entries(problem.symbols).map(([k, s]) => [k, s.tex]));
  const preview = useCallback((raw: string) => chainTex(problem, raw), [problem]);
  const set = <K extends keyof StepDraft>(k: K, v: StepDraft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const submit = () => {
    if (!draft.latex.trim() || disabled) return;
    onSubmit(draft);
    setDraft(fresh());
  };

  return (
    <div className={cn("space-y-4 rounded-[20px] border-2 bg-card p-4 sm:p-5", retrying ? "border-amber" : "border-primary/40")} data-editor>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-display text-xl font-extrabold text-ink">{retrying ? `إعادة الخطوة ${Number(retrying.replace("step_", ""))}` : "الخطوة الجاية"}</h2>
        {retrying && (
          <Button size="sm" variant="ghost" onClick={onCancelRetry}>
            إلغاء الإعادة
          </Button>
        )}
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="wb-op">نوع الخطوة</Label>
          <select id="wb-op" className={selectCls} value={draft.operation} onChange={(e) => set("operation", e.target.value as StepDraft["operation"])}>
            {Object.entries(OPERATION_LABEL).map(([k, l]) => (
              <option key={k} value={k}>
                {l}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wb-target">الكمية المستهدفة</Label>
          <select id="wb-target" className={selectCls} value={draft.target} onChange={(e) => set("target", e.target.value)}>
            {Object.entries(problem.symbols).map(([k, s]) => (
              <option key={k} value={k}>
                {s.label_ar}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="wb-unit">الوحدة (للأرقام)</Label>
          <Input id="wb-unit" dir="ltr" className="h-11 font-latin" placeholder={problem.symbols[draft.target]?.unit || "—"} value={draft.unit} onChange={(e) => set("unit", e.target.value)} />
        </div>
      </div>
      {previous.length > 0 && (
        <fieldset className="space-y-1.5">
          <legend className="text-sm font-semibold text-ink-2">مبنية على خطوة…</legend>
          <div className="flex flex-wrap gap-1.5">
            {previous.map((p, i) => {
              const on = draft.inputs.includes(p.step_id);
              return (
                <button
                  key={p.step_id}
                  type="button"
                  aria-pressed={on}
                  onClick={() => set("inputs", on ? draft.inputs.filter((x) => x !== p.step_id) : [...draft.inputs, p.step_id])}
                  className={cn("rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors", on ? "border-primary bg-primary text-white" : "border-line-strong bg-surface text-ink-2")}
                >
                  {i + 1}: <span dir="ltr" className="font-latin">{p.label}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
      )}
      <div className="space-y-1.5">
        <Label htmlFor="wb-why">اشرح خطوتك بكلامك (اختياري، بيساعد مِخيال يفهمك)</Label>
        <Textarea id="wb-why" rows={2} value={draft.explanation} onChange={(e) => set("explanation", e.target.value)} placeholder="مثلًا: عزلت المسافة" />
      </div>
      <EquationInput value={draft.latex} onChange={(v) => set("latex", v)} onSubmit={submit} variables={variables} symbolTex={symbolTex} preview={preview} disabled={disabled} submitLabel="قدّم الخطوة" />
    </div>
  );
}
