"use client";
import { Circle, CircleCheck } from "lucide-react";
import type { Observation } from "@/components/phenomena/sims/SimFrame";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { cn } from "@/lib/utils";
import { useLessonTracker } from "./tracker";

export interface Readout {
  label: string;
  tex: string;
  tone?: "default" | "good";
}

/** Layout shared by the lesson simulations: stage, live readouts, controls and guided challenges. */
export function SimCard({
  id,
  title,
  intro,
  stage,
  controls,
  readouts,
  observations,
  actions,
  below,
}: {
  id: string;
  title: string;
  intro: string;
  stage: React.ReactNode;
  controls: React.ReactNode;
  readouts: Readout[];
  observations: Observation[];
  actions?: React.ReactNode;
  below?: React.ReactNode;
}) {
  const { markSim } = useLessonTracker();
  return (
    <section
      className="space-y-4 rounded-[20px] border-2 border-mint/50 bg-card p-4 sm:p-5"
      aria-label={title}
      data-sim={id}
      onPointerDownCapture={() => markSim(id)}
      onKeyDownCapture={() => markSim(id)}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="space-y-1">
          <h3 className="font-display text-2xl font-extrabold text-ink">{title}</h3>
          <p className="max-w-2xl text-[15px] leading-7 text-ink-2">
            <MathText>{intro}</MathText>
          </p>
        </div>
        {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(260px,320px)]">
        <div className="min-w-0 space-y-3">
          <div className="overflow-hidden rounded-[16px] border-2 border-border bg-sim" dir="ltr">
            {stage}
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3" aria-live="polite">
            {readouts.map((r) => (
              <li key={r.label} className={cn("rounded-[12px] border-2 px-3 py-1.5", r.tone === "good" ? "border-mint/50 bg-mint-soft" : "border-border bg-surface")}>
                <p className="text-xs text-ink-3">{r.label}</p>
                <p className="relative overflow-x-auto text-base text-ink" dir="ltr">
                  <Tex>{r.tex}</Tex>
                </p>
              </li>
            ))}
          </ul>
          {below}
        </div>
        <div className="min-w-0 space-y-3">
          {controls}
          <div className="rounded-[14px] border-2 border-border bg-surface p-3">
            <p className="mb-2 text-sm font-bold text-ink">تحديات صغيرة</p>
            <ul className="space-y-1.5">
              {observations.map((o) => (
                <li key={o.id} className={cn("flex items-start gap-2 text-sm leading-6", o.done ? "text-mint-dark" : "text-ink-2")} data-done={o.done ? "true" : "false"}>
                  {o.done ? <CircleCheck className="mt-0.5 size-4 shrink-0" /> : <Circle className="mt-0.5 size-4 shrink-0 text-ink-3" />}
                  <MathText>{o.label}</MathText>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
