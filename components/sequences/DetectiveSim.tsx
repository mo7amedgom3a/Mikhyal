"use client";
import { useState } from "react";
import { useObservations } from "@/components/phenomena/sims/SimFrame";
import { Input } from "@/components/ui/input";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { classify, clean, differences, explicitTex, fmt, parseList, recursiveTerms, signed } from "@/lib/sequences";
import { cn } from "@/lib/utils";
import { useLessonTracker } from "./tracker";

const PRESETS = [
  { label: "3, 5, 7, 9, 11", value: "3, 5, 7, 9, 11" },
  { label: "20, 17, 14, 11", value: "20, 17, 14, 11" },
  { label: "1/3, 1/12, 1/48, 1/192", value: "1/3, 1/12, 1/48, 1/192" },
  { label: "2, 4, 8, 16", value: "2, 4, 8, 16" },
  { label: "5, 5, 5, 5", value: "5, 5, 5, 5" },
];

/** Type any list; the detective checks whether the difference between neighbours is constant. */
export function DetectiveSim() {
  const { markSim } = useLessonTracker();
  const [raw, setRaw] = useState(PRESETS[0].value);
  const [tried, setTried] = useState<string[]>([]);
  const terms = parseList(raw);
  const verdict = terms ? classify(terms) : null;
  const diffs = terms ? differences(terms) : [];
  const ratios = terms && terms.every((t) => t !== 0) ? terms.slice(1).map((t, i) => clean(t / terms[i])) : [];
  const geometric = ratios.length >= 2 && ratios.every((r) => Math.abs(r - ratios[0]) < 1e-9) && ratios[0] !== 1;

  const update = (v: string) => {
    setRaw(v);
    markSim("detective");
    const t = parseList(v);
    const c = t ? classify(t) : null;
    if (c && c.status !== "too-short") setTried((s) => [...s, c.status === "arithmetic" ? (c.d < 0 ? "dec" : c.d === 0 ? "const" : "arith") : "not"]);
  };

  const obs = useObservations([
    { id: "arith", label: "اكتب متتالية حسابية من عندك.", met: tried.includes("arith") },
    { id: "dec", label: "جرّب متتالية حسابية متناقصة.", met: tried.includes("dec") },
    { id: "not", label: "اكتب متتالية ليست حسابية واكتشف أين ينكسر الفرق.", met: tried.includes("not") },
    { id: "const", label: "هل المتتالية الثابتة حسابية؟ جرّبها.", met: tried.includes("const") },
  ]);

  return (
    <section className="space-y-4 rounded-[20px] border-2 border-mint/50 bg-card p-4 sm:p-5" aria-label="محقق المتتاليات" data-sim="detective">
      <div className="space-y-1">
        <h3 className="font-display text-2xl font-extrabold text-ink">محقق المتتاليات: هل هي حسابية؟</h3>
        <p className="max-w-2xl text-[15px] leading-7 text-ink-2">
          <MathText>{"اكتب حدودًا مفصولة بفواصل (يمكن كتابة كسور مثل 1/3). المحقق يحسب $a_n - a_{n-1}$ بين كل حدين متتاليين: إذا كان الفرق ثابتًا فهي حسابية."}</MathText>
        </p>
      </div>
      <div className="grid gap-4 lg:grid-cols-[1fr_minmax(260px,320px)]">
        <div className="min-w-0 space-y-3">
          <Input dir="ltr" value={raw} onChange={(e) => update(e.target.value)} aria-label="حدود المتتالية" className="font-latin text-lg" placeholder="3, 5, 7, 9" onFocus={() => markSim("detective")} />
          <div className="flex flex-wrap gap-1.5">
            {PRESETS.map((p) => (
              <button key={p.value} type="button" onClick={() => update(p.value)} className={cn("rounded-full border-2 px-3 py-1 font-latin text-sm transition-colors", raw === p.value ? "border-primary bg-primary text-white" : "border-line-strong bg-card text-ink-2 hover:border-primary")} dir="ltr">
                {p.label}
              </button>
            ))}
          </div>

          <div className="relative overflow-x-auto rounded-[16px] border-2 border-border bg-sim p-4" dir="ltr">
            {!terms ? (
              <p className="text-center text-ink-3" dir="rtl">
                اكتب أرقامًا فقط مفصولة بفواصل.
              </p>
            ) : (
              <div className="flex min-w-max items-start gap-1">
                {terms.map((t, i) => (
                  <div key={i} className="flex items-start gap-1">
                    {i > 0 && (
                      <div className="flex flex-col items-center pt-1">
                        <span
                          className={cn(
                            "rounded-full border-2 px-2 py-0.5 text-sm font-bold",
                            verdict?.status === "not-arithmetic" && i + 1 === verdict.breakAt ? "border-destructive/40 bg-danger-soft text-destructive" : "border-amber bg-amber-soft text-amber-dark",
                          )}
                        >
                          <Tex>{diffs[i - 1] >= 0 ? `+${fmt(diffs[i - 1])}` : fmt(diffs[i - 1])}</Tex>
                        </span>
                        <span className="text-ink-3">⟶</span>
                      </div>
                    )}
                    <div className="flex flex-col items-center rounded-[12px] border-2 border-border bg-surface px-3 py-2">
                      <span className="text-xl text-ink">
                        <Tex>{fmt(t)}</Tex>
                      </span>
                      <span className="text-xs text-ink-3">
                        <Tex>{`a_{${i + 1}}`}</Tex>
                      </span>
                    </div>
                  </div>
                ))}
                {verdict?.status === "arithmetic" &&
                  recursiveTerms(terms[terms.length - 1], verdict.d, 4)
                    .slice(1)
                    .map((t, j) => (
                      <div key={`g${j}`} className="flex items-start gap-1 opacity-60">
                        <div className="flex flex-col items-center pt-1">
                          <span className="rounded-full border-2 border-dashed border-amber px-2 py-0.5 text-sm text-amber-dark">
                            <Tex>{verdict.d >= 0 ? `+${fmt(verdict.d)}` : fmt(verdict.d)}</Tex>
                          </span>
                          <span className="text-ink-3">⟶</span>
                        </div>
                        <div className="flex flex-col items-center rounded-[12px] border-2 border-dashed border-primary/40 px-3 py-2">
                          <span className="text-xl text-primary">
                            <Tex>{fmt(t)}</Tex>
                          </span>
                          <span className="text-xs text-ink-3">
                            <Tex>{`a_{${terms.length + j + 1}}`}</Tex>
                          </span>
                        </div>
                      </div>
                    ))}
              </div>
            )}
          </div>

          {verdict && <Verdict verdict={verdict} geometric={geometric} ratio={ratios[0]} />}
        </div>
        <div className="min-w-0 rounded-[14px] border-2 border-border bg-surface p-3 self-start">
          <p className="mb-2 text-sm font-bold text-ink">تحديات صغيرة</p>
          <ul className="space-y-1.5">
            {obs.map((o) => (
              <li key={o.id} className={cn("flex items-start gap-2 text-sm leading-6", o.done ? "text-mint-dark" : "text-ink-2")}>
                <span aria-hidden>{o.done ? "✓" : "○"}</span>
                <MathText>{o.label}</MathText>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Verdict({ verdict, geometric, ratio }: { verdict: ReturnType<typeof classify>; geometric: boolean; ratio?: number }) {
  if (verdict.status === "too-short") return <p className="rounded-[12px] border-2 border-border bg-surface px-3 py-2 text-ink-2">اكتب ثلاثة حدود على الأقل حتى نحكم.</p>;
  if (verdict.status === "arithmetic")
    return (
      <div className="space-y-2 rounded-[14px] border-2 border-mint/50 bg-mint-soft px-4 py-3">
        <p className="font-bold text-mint-dark">
          <MathText>{`✓ متتالية حسابية: الفرق ثابت $d = ${fmt(verdict.d)}$${verdict.d === 0 ? " (متتالية ثابتة)" : ""}.`}</MathText>
        </p>
        <div className="flex flex-wrap gap-x-6 gap-y-1 text-ink" dir="ltr">
          <span>
            <Tex>{`a_1 = ${fmt(verdict.a1)},\\quad a_n = a_{n-1} ${verdict.d === 0 ? "+ 0" : signed(verdict.d)}`}</Tex>
          </span>
          <span>
            <Tex>{`a_n = ${explicitTex(verdict.a1, verdict.d)}`}</Tex>
          </span>
        </div>
        <p className="text-sm text-ink-2">الحدود الباهتة هي توقّع المحقق للحدود التالية بالصيغة الارتدادية.</p>
      </div>
    );
  return (
    <div className="space-y-1 rounded-[14px] border-2 border-destructive/30 bg-danger-soft px-4 py-3">
      <p className="font-bold text-destructive">
        <MathText>{`✗ ليست حسابية: الفرق يتغير عند $a_{${verdict.breakAt}} - a_{${verdict.breakAt - 1}}$.`}</MathText>
      </p>
      {geometric && ratio !== undefined && (
        <p className="text-sm text-ink-2">
          <MathText>{`لكن انتبه: النسبة بين كل حد والذي قبله ثابتة $= ${fmt(ratio)}$، أي أن صيغتها الارتدادية $a_n = ${fmt(ratio)}\\,a_{n-1}$ (ضرب وليس جمع). هذه متتالية هندسية.`}</MathText>
        </p>
      )}
    </div>
  );
}
