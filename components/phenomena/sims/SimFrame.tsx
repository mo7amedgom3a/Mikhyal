"use client";
import { useEffect, useState } from "react";
import { Circle, CircleCheck, Pause, Play, RotateCcw } from "lucide-react";
import type { SimParam } from "@/lib/engine/types";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { cn } from "@/lib/utils";

export interface Observation {
  id: string;
  label: string;
  done: boolean;
}

/** Guided observations stay ticked once the student has produced the state. */
export function useObservations(list: { id: string; label: string; met: boolean }[]): Observation[] {
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const key = list.map((o) => (o.met ? "1" : "0")).join("");
  useEffect(() => {
    setSeen((s) => {
      const next = { ...s };
      let changed = false;
      for (const o of list)
        if (o.met && !next[o.id]) {
          next[o.id] = true;
          changed = true;
        }
      return changed ? next : s;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return list.map((o) => ({ id: o.id, label: o.label, done: !!seen[o.id] }));
}

export function Slider({ param, value, onChange }: { param: SimParam; value: number; onChange: (v: number) => void }) {
  return <VariableSlider param={param} value={value} onChange={onChange} />;
}

export function Choice<T extends string>({ label, value, options, onChange }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="rounded-[14px] border-2 border-border bg-surface p-3">
      <p className="mb-2 text-sm font-semibold text-ink-2">{label}</p>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label={label}>
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={o.value === value}
            data-choice={o.value}
            onClick={() => onChange(o.value)}
            className={cn("rounded-full border-2 px-3 py-1 text-sm font-semibold transition-colors", o.value === value ? "border-primary bg-primary text-white" : "border-line-strong bg-card text-ink-2")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export interface Readout {
  label: string;
  tex: string;
  tone?: "default" | "good" | "bad";
}

export function SimFrame({
  stage,
  controls,
  readouts,
  notice,
  observations,
  howItWorks,
  playing,
  onTogglePlay,
  onReset,
  plot,
}: {
  stage: React.ReactNode;
  controls: React.ReactNode;
  readouts: Readout[];
  notice: string;
  observations: Observation[];
  howItWorks: string[];
  playing?: boolean;
  onTogglePlay?: () => void;
  onReset?: () => void;
  plot?: React.ReactNode;
}) {
  return (
    <section className="space-y-4 rounded-[20px] border-2 border-mint/50 bg-card p-4 sm:p-5" aria-labelledby="sim-title" data-sim>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="sim-title" className="font-display text-2xl font-extrabold text-ink">
          شوف إزاي بتشتغل
        </h2>
        <div className="flex gap-2">
          {onTogglePlay && (
            <Button size="sm" variant="outline" onClick={onTogglePlay} aria-label={playing ? "إيقاف مؤقت" : "تشغيل"} data-play>
              {playing ? <Pause /> : <Play />} {playing ? "إيقاف" : "تشغيل"}
            </Button>
          )}
          {onReset && (
            <Button size="sm" variant="ghost" onClick={onReset} data-reset>
              <RotateCcw /> من الأول
            </Button>
          )}
        </div>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(260px,320px)]">
        <div className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-[16px] border-2 border-border bg-sim" dir="ltr">
            {stage}
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-live="polite" data-readouts>
            {readouts.map((r) => (
              <li
                key={r.label}
                className={cn(
                  "rounded-[12px] border-2 px-3 py-1.5",
                  r.tone === "good" ? "border-mint/50 bg-mint-soft" : r.tone === "bad" ? "border-destructive/30 bg-danger-soft" : "border-border bg-surface",
                )}
              >
                <p className="text-xs text-ink-3">{r.label}</p>
                <p className="overflow-x-auto text-base text-ink" dir="ltr">
                  <Tex>{r.tex}</Tex>
                </p>
              </li>
            ))}
          </ul>
          <p className="rounded-[12px] border-2 border-primary/30 bg-primary-soft px-3 py-2 text-[15px] leading-7 text-ink" data-notice>
            <span className="font-bold">لاحظ: </span>
            <MathText>{notice}</MathText>
          </p>
          {plot && <div className="min-w-0">{plot}</div>}
        </div>
        <div className="min-w-0 space-y-3">
          {controls}
          <div className="rounded-[14px] border-2 border-border bg-surface p-3">
            <p className="mb-2 text-sm font-bold text-ink">جرّب بنفسك</p>
            <ul className="space-y-1.5" data-observations>
              {observations.map((o) => (
                <li key={o.id} className={cn("flex items-start gap-2 text-sm leading-6", o.done ? "text-mint-dark" : "text-ink-2")} data-done={o.done ? "true" : "false"}>
                  {o.done ? <CircleCheck className="mt-0.5 size-4 shrink-0" /> : <Circle className="mt-0.5 size-4 shrink-0 text-ink-3" />}
                  <MathText>{o.label}</MathText>
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-[14px] border-2 border-border bg-surface p-3">
            <p className="mb-2 text-sm font-bold text-ink">إزاي بتحصل؟</p>
            <ol className="list-inside list-decimal space-y-1 text-sm leading-6 text-ink-2">
              {howItWorks.map((h, i) => (
                <li key={i}>
                  <MathText>{h}</MathText>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/** Scientific notation as LaTeX. */
export function sci(x: number, digits = 3): string {
  if (!Number.isFinite(x)) return "\\infty";
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 1e-2 && a < 1e4) return String(+x.toPrecision(digits));
  const e = Math.floor(Math.log10(a));
  return `${+(x / 10 ** e).toPrecision(digits)}\\times10^{${e}}`;
}

export const param = (key: string, label: string, symbol: string, min: number, max: number, step: number, unit: string, def: number): SimParam => ({ key, label, symbol, min, max, step, unit, default: def });
