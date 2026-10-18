"use client";
import type { SimParam } from "@/lib/engine/types";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";

export function VariableSlider({ param, value, onChange, disabled }: { param: SimParam; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const decimals = param.step < 0.01 ? 3 : param.step < 0.1 ? 2 : param.step < 1 ? 1 : 0;
  const text = `${value.toFixed(decimals)} ${param.unit}`.trim();
  const labelId = `slider-label-${param.key}`;
  return (
    <div className="rounded-[14px] border-2 border-border bg-surface p-3">
      <div className="mb-1 flex items-center justify-between gap-2">
        <span id={labelId} className="text-sm font-semibold text-ink-2">
          {param.label} <span className="ltr font-latin text-ink-3">({param.symbol})</span>
        </span>
        <Badge variant="default" className="ltr font-latin">
          {text}
        </Badge>
      </div>
      <Slider
        id={`slider-${param.key}`}
        aria-labelledby={labelId}
        min={param.min}
        max={param.max}
        step={param.step}
        value={[value]}
        disabled={disabled}
        onValueChange={([v]) => onChange(v)}
        aria-valuetext={text}
      />
    </div>
  );
}
