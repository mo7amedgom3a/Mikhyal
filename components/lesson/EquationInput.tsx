"use client";
import { useMemo } from "react";
import { parse } from "mathjs";
import { Tex } from "@/components/ui/Tex";
import { normalizeExpression } from "@/lib/engine/evaluator";

function toTex(raw: string, vars: string[]): string | null {
  if (!raw.trim()) return null;
  try {
    return normalizeExpression(raw, vars)
      .split("=")
      .map((side) => parse(side).toTex({ parenthesis: "auto", implicit: "hide" }))
      .join(" = ");
  } catch {
    return null;
  }
}

export function EquationInput({
  value,
  onChange,
  onSubmit,
  variables,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  variables: Record<string, string>;
  disabled?: boolean;
}) {
  const vars = Object.keys(variables);
  const tex = useMemo(() => toTex(value, Object.keys(variables)), [value, variables]);
  const keys = ["^2", "/", "*", "(", ")", "=", "sqrt(", ...vars];
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 text-sm">
        {Object.entries(variables).map(([k, label]) => (
          <span key={k} className="chip">
            <b className="ltr font-latin text-primary">{k}</b> {label}
          </span>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex gap-2"
      >
        <input
          dir="ltr"
          value={value}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          placeholder="v^2 = ..."
          aria-label="اكتب المعادلة"
          className="min-h-12 flex-1 rounded-[14px] border-2 border-line-strong bg-surface px-4 font-latin text-lg text-ink placeholder:text-ink-3 focus:border-primary"
        />
        <button type="submit" disabled={disabled || !value.trim()} className="btn btn-primary">
          تحقّق
        </button>
      </form>
      <div className="flex flex-wrap gap-1.5" dir="ltr">
        {keys.map((k) => (
          <button
            key={k}
            type="button"
            disabled={disabled}
            onClick={() => onChange(value + k)}
            className="min-h-10 min-w-10 rounded-[10px] border-2 border-line bg-surface px-2 font-latin text-sm font-bold text-ink-2 hover:border-primary hover:text-primary"
          >
            {k.replace("sqrt(", "√(")}
          </button>
        ))}
        <button type="button" onClick={() => onChange(value.slice(0, -1))} className="min-h-10 min-w-10 rounded-[10px] border-2 border-line bg-surface px-2 text-sm font-bold text-ink-2" aria-label="مسح حرف">
          ⌫
        </button>
      </div>
      <div className="min-h-14 rounded-[14px] bg-sim px-4 py-3 text-xl" aria-live="polite">
        {tex ? <Tex>{tex}</Tex> : <span className="text-sm text-ink-3">المعاينة هتظهر هنا</span>}
      </div>
    </div>
  );
}
