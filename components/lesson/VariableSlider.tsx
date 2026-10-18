"use client";
import type { SimParam } from "@/lib/engine/types";

export function VariableSlider({ param, value, onChange, disabled }: { param: SimParam; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const fill = ((value - param.min) / (param.max - param.min)) * 100;
  const decimals = param.step < 0.01 ? 3 : param.step < 0.1 ? 2 : param.step < 1 ? 1 : 0;
  const id = `slider-${param.key}`;
  return (
    <div className="rounded-[14px] border-2 border-line bg-surface p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-semibold text-ink-2">
          {param.label} <span className="ltr font-latin text-ink-3">({param.symbol})</span>
        </label>
        <span className="ltr shrink-0 whitespace-nowrap rounded-lg bg-primary-soft px-2 py-0.5 font-latin text-sm font-bold text-primary">
          {value.toFixed(decimals)} {param.unit}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        min={param.min}
        max={param.max}
        step={param.step}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        style={{ ["--fill" as string]: `${fill}%` }}
        aria-valuetext={`${value.toFixed(decimals)} ${param.unit}`}
      />
    </div>
  );
}
