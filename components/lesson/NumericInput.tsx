"use client";
import { useMemo } from "react";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tex } from "@/components/ui/Tex";
import { parseQuantity } from "@/lib/engine/evaluator";

/** Shows how a typed quantity was read: 3×10^8 m/s, \frac{400}{60} m/s^2, 2.2 \mu s … */
function quantityTex(raw: string): string | null {
  const q = parseQuantity(raw);
  if (!q) return null;
  const value = Math.abs(q.value) >= 1e5 || (q.value !== 0 && Math.abs(q.value) < 1e-3) ? q.value.toExponential(3).replace(/e([+-]?\d+)/, "\\times 10^{$1}") : String(+q.value.toPrecision(6));
  const unit = q.unit ? `\\,\\mathrm{${q.unit.replace(/\bu(?=[a-zA-Z])/, "\\mu ").replace(/ohm/, "\\Omega")}}` : "";
  return value + unit;
}

export function NumericInput({ value, onChange, onSubmit, placeholder, disabled }: { value: string; onChange: (v: string) => void; onSubmit: () => void; placeholder: string; disabled?: boolean }) {
  const tex = useMemo(() => quantityTex(value), [value]);
  return (
    <div className="space-y-2">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex gap-2"
      >
        <Input dir="ltr" value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} aria-label="الإجابة مع الوحدة" className="font-latin text-lg" />
        <Button type="submit" disabled={disabled || !value.trim()}>
          <Check />
          تحقّق
        </Button>
      </form>
      {value.trim() && (
        <p className="flex min-h-10 items-center gap-2 rounded-[12px] bg-sim px-3 text-sm text-ink-3" aria-live="polite">
          <span className="shrink-0 font-semibold">الجهاز فهمها كده:</span>
          {tex ? <Tex className="text-base text-ink">{tex}</Tex> : <span>اكتب رقم وبعده الوحدة</span>}
        </p>
      )}
      <p className="text-xs text-ink-3">
        تقدر تكتب كسور وأسس ووحدات: <span className="ltr font-latin">3×10^8 m/s</span> · <span className="ltr font-latin">\frac{'{400}{60}'} m/s^2</span> · <span className="ltr font-latin">2.2 μs</span>
      </p>
    </div>
  );
}
