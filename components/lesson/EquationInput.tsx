"use client";
import { useMemo } from "react";
import { Check, Delete } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
          <Badge key={k}>
            <b className="ltr font-latin text-primary">{k}</b> {label}
          </Badge>
        ))}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex gap-2"
      >
        <Input dir="ltr" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder="v^2 = ..." aria-label="اكتب المعادلة" className="font-latin text-lg" />
        <Button type="submit" disabled={disabled || !value.trim()}>
          <Check />
          تحقّق
        </Button>
      </form>
      <div className="flex flex-wrap gap-1.5" dir="ltr">
        {keys.map((k) => (
          <Button key={k} type="button" variant="outline" size="sm" disabled={disabled} onClick={() => onChange(value + k)} className="min-w-10 px-2 font-latin text-ink-2">
            {k.replace("sqrt(", "√(")}
          </Button>
        ))}
        <Button type="button" variant="outline" size="icon-sm" onClick={() => onChange(value.slice(0, -1))} aria-label="مسح حرف">
          <Delete />
        </Button>
      </div>
      <div className="min-h-14 rounded-[14px] bg-sim px-4 py-3 text-xl" aria-live="polite">
        {tex ? <Tex>{tex}</Tex> : <span className="text-sm text-ink-3">المعاينة هتظهر هنا</span>}
      </div>
    </div>
  );
}
