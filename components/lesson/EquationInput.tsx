"use client";
import { useCallback, useMemo, useRef, useState } from "react";
import { parse, type MathNode } from "mathjs";
import { Check, Delete, Keyboard, SquareFunction, Type } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tex } from "@/components/ui/Tex";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { normalizeExpression } from "@/lib/engine/evaluator";
import { MathField, type MathFieldHandle } from "./MathField";

/** A palette key: how it looks (LaTeX), what the visual editor inserts, and what text mode appends. */
interface Key {
  show: string;
  latex: string;
  text: string;
  label: string;
}

const STRUCTURE: Key[] = [
  { show: "\\frac{a}{b}", latex: "\\frac{#@}{#?}", text: "\\frac{}{}", label: "كسر" },
  { show: "\\sqrt{x}", latex: "\\sqrt{#0}", text: "\\sqrt{}", label: "جذر تربيعي" },
  { show: "\\sqrt[n]{x}", latex: "\\sqrt[#?]{#0}", text: "\\sqrt[]{}", label: "جذر نوني" },
  { show: "x^2", latex: "#@^{2}", text: "^2", label: "تربيع" },
  { show: "x^n", latex: "#@^{#?}", text: "^{}", label: "أُس" },
  { show: "x_n", latex: "#@_{#?}", text: "_{}", label: "دليل سفلي" },
  { show: "(\\,)", latex: "\\left(#0\\right)", text: "()", label: "أقواس" },
  { show: "|x|", latex: "\\left|#0\\right|", text: "\\left|\\right|", label: "قيمة مطلقة" },
];

const OPERATORS: Key[] = [
  { show: "=", latex: "=", text: "=", label: "يساوي" },
  { show: "+", latex: "+", text: "+", label: "زائد" },
  { show: "-", latex: "-", text: "-", label: "ناقص" },
  { show: "\\times", latex: "\\times", text: "\\times ", label: "ضرب" },
  { show: "\\cdot", latex: "\\cdot", text: "\\cdot ", label: "ضرب (نقطة)" },
  { show: "\\div", latex: "\\div", text: "\\div ", label: "قسمة" },
  { show: "^{\\circ}", latex: "^{\\circ}", text: "^\\circ", label: "درجة" },
];

const GREEK: Key[] = ["alpha", "beta", "gamma", "theta", "lambda", "mu", "rho", "omega", "pi", "Delta"].map((g) => ({
  show: `\\${g}`,
  latex: `\\${g}`,
  text: `\\${g} `,
  label: g,
}));

const FUNCTIONS: Key[] = ["sin", "cos", "tan", "log", "ln"].map((f) => ({
  show: `\\${f}`,
  latex: `\\${f}\\left(#0\\right)`,
  text: `\\${f}()`,
  label: f,
}));

/** Show t0 / vmax with subscripts in the preview, the way students wrote them. */
function subscriptSymbols(node: MathNode): string | undefined {
  if (node.type !== "SymbolNode") return undefined;
  const m = (node as unknown as { name: string }).name.match(/^([A-Za-z\u0370-\u03FF])(\d+|max|min)$/);
  return m ? `${m[1]}_{${m[2]}}` : undefined;
}

function toTex(raw: string, vars: string[]): string | null {
  if (!raw.trim()) return null;
  try {
    return normalizeExpression(raw, vars)
      .split("=")
      .map((side) => parse(side).toTex({ parenthesis: "auto", implicit: "hide", handler: subscriptSymbols }))
      .join(" = ");
  } catch {
    return null;
  }
}

/** Variables like t0 / vmax are shown and inserted with proper subscripts. */
function varLatex(v: string): string {
  const m = v.match(/^([A-Za-zͰ-Ͽ])(.+)$/);
  return m ? `${m[1]}_{${m[2]}}` : v;
}

export function EquationInput({
  value,
  onChange,
  onSubmit,
  variables,
  disabled,
  symbolTex,
  preview,
  submitLabel = "تحقّق",
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  variables: Record<string, string>;
  disabled?: boolean;
  /** LaTeX for each variable key (e.g. dL → \Delta L) when the default subscript rule doesn't fit. */
  symbolTex?: Record<string, string>;
  /** Custom "how the machine read it" renderer. */
  preview?: (raw: string) => string | null;
  submitLabel?: string;
}) {
  const [mode, setMode] = useState<"visual" | "text">("visual");
  const field = useRef<MathFieldHandle>(null);
  const textInput = useRef<HTMLInputElement>(null);
  const tex = useMemo(() => (preview ? preview(value) : toTex(value, Object.keys(variables))), [value, variables, preview]);
  const fallbackToText = useCallback(() => setMode("text"), []);

  const varKeys: Key[] = Object.entries(variables).map(([k, label]) => {
    const t = symbolTex?.[k] ?? varLatex(k);
    return { show: t, latex: t, text: symbolTex?.[k] ? `${t} ` : t, label };
  });

  const press = (k: Key) => {
    if (mode === "visual") {
      field.current?.insert(k.latex);
    } else {
      onChange(value + k.text);
      textInput.current?.focus();
    }
  };

  const keyRow = (keys: Key[], title: string) => (
    <div className="flex flex-wrap items-center gap-1.5" dir="ltr" role="group" aria-label={title}>
      {keys.map((k) => (
        <Tooltip key={k.show}>
          <TooltipTrigger asChild>
            <Button type="button" variant="outline" size="sm" disabled={disabled} onClick={() => press(k)} aria-label={k.label} className="min-w-11 px-2 text-ink">
              <Tex>{k.show}</Tex>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{k.label}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Tabs value={mode} onValueChange={(v) => setMode(v as "visual" | "text")}>
          <TabsList aria-label="طريقة كتابة المعادلة">
            <TabsTrigger value="visual">
              <SquareFunction /> محرر المعادلات
            </TabsTrigger>
            <TabsTrigger value="text">
              <Type /> LaTeX / نص
            </TabsTrigger>
          </TabsList>
        </Tabs>
        {mode === "visual" && (
          <Button type="button" variant="ghost" size="sm" onClick={() => field.current?.toggleKeyboard()}>
            <Keyboard className="size-4" /> لوحة الرموز الكاملة
          </Button>
        )}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit();
        }}
        className="flex items-start gap-2"
      >
        <div className="min-w-0 flex-1">
          {mode === "visual" ? (
            <MathField ref={field} value={value} onChange={onChange} onSubmit={onSubmit} ariaLabel="اكتب المعادلة" onUnavailable={fallbackToText} />
          ) : (
            <Input
              ref={textInput}
              dir="ltr"
              value={value}
              disabled={disabled}
              onChange={(e) => onChange(e.target.value)}
              placeholder="v^2 = u^2 - 2as   أو   \frac{u^2-v^2}{2a}"
              aria-label="اكتب المعادلة"
              className="min-h-14 font-latin text-lg"
            />
          )}
        </div>
        <Button type="submit" disabled={disabled || !value.trim()} className="min-h-14">
          <Check />
          {submitLabel}
        </Button>
      </form>

      <div className="space-y-2 rounded-[14px] border-2 border-border bg-muted/60 p-2.5">
        <div className="flex flex-wrap gap-1.5">
          {varKeys.map((k) => (
            <Badge key={k.show} asChild variant="default" className="cursor-pointer">
              <button type="button" disabled={disabled} onClick={() => press(k)} aria-label={`${k.label}`}>
                <Tex>{k.show}</Tex>
                <span className="font-normal">{k.label}</span>
              </button>
            </Badge>
          ))}
        </div>
        {keyRow(STRUCTURE, "بُنى رياضية")}
        {keyRow(OPERATORS, "عمليات")}
        {keyRow([...GREEK, ...FUNCTIONS], "رموز يونانية ودوال")}
        {mode === "text" && (
          <div className="flex justify-end">
            <Button type="button" variant="outline" size="icon-sm" onClick={() => onChange(value.slice(0, -1))} aria-label="مسح حرف">
              <Delete />
            </Button>
          </div>
        )}
      </div>

      <div className="flex min-h-12 items-center gap-3 rounded-[14px] bg-sim px-4 py-2" aria-live="polite">
        <span className="shrink-0 text-xs font-semibold text-ink-3">الجهاز فهمها كده:</span>
        {tex ? <Tex className="text-lg">{tex}</Tex> : <span className="text-sm text-ink-3">المعاينة هتظهر هنا</span>}
      </div>
    </div>
  );
}
