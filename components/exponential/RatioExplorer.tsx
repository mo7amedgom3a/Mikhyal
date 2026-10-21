"use client";
import { useState } from "react";
import { Plot } from "mafs";
import { Choice, useObservations } from "@/components/phenomena/sims/SimFrame";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";
import { Tex } from "@/components/ui/Tex";
import { num } from "@/lib/exponential";
import { cn } from "@/lib/utils";
import { SimCard } from "@/components/sequences/SimCard";

type Fn = "linear" | "cubic" | "exp";
const FNS: Record<Fn, { tex: string; f: (x: number) => number; color: string; label: string }> = {
  linear: { tex: "y = 3x", f: (x) => 3 * x, color: "var(--mafs-green)", label: "y = 3x" },
  cubic: { tex: "y = x^3", f: (x) => x ** 3, color: "var(--mafs-orange)", label: "y = x³" },
  exp: { tex: "y = 3^x", f: (x) => 3 ** x, color: "var(--mafs-blue)", label: "y = 3ˣ" },
};
const XS = [1, 2, 3, 4, 5];

/** "استكشف": Maryam's three functions. Which one has a constant difference, which a constant ratio? */
export function RatioExplorer() {
  const [fn, setFn] = useState<Fn>("linear");
  const [seen, setSeen] = useState<Fn[]>(["linear"]);
  const { f, tex } = FNS[fn];
  const ys = XS.map(f);
  const diffs = ys.slice(1).map((y, i) => y - ys[i]);
  const ratios = ys.slice(1).map((y, i) => y / ys[i]);
  const constDiff = diffs.every((d) => Math.abs(d - diffs[0]) < 1e-9);
  const constRatio = ratios.every((r) => Math.abs(r - ratios[0]) < 1e-9);

  const obs = useObservations([
    { id: "all", label: "افتح جدول الدوال الثلاث.", met: seen.length === 3 },
    { id: "diff", label: "أي دالة لها فرق ثابت بين قيم $y$؟", met: seen.includes("linear") && seen.length >= 2 },
    { id: "ratio", label: "أي دالة لها نسبة ثابتة بين قيم $y$؟", met: seen.includes("exp") },
  ]);
  const pick = (v: Fn) => {
    setFn(v);
    setSeen((s) => (s.includes(v) ? s : [...s, v]));
  };

  return (
    <SimCard
      id="ratio"
      title="فرق ثابت أم نسبة ثابتة؟"
      intro="تدرس مريم ثلاث دوال: $y = 3x$ و $y = x^3$ و $y = 3^x$. اختر كل دالة وقارن عمود الفروق بعمود النِّسَب. تذكّر: المتتالية الحسابية لها فرق ثابت…"
      stage={
        <div className="space-y-3 p-3">
          <table className="w-full text-center text-[15px]" dir="ltr">
            <thead>
              <tr className="text-ink-2">
                <th className="py-1">x</th>
                <th>y</th>
                <th className={cn("rounded-t-[10px]", constDiff && "bg-mint-soft text-mint-dark")}>
                  <span dir="rtl">الفرق</span> <Tex>{"y_2 - y_1"}</Tex>
                </th>
                <th className={cn("rounded-t-[10px]", constRatio && "bg-mint-soft text-mint-dark")}>
                  <span dir="rtl">النسبة</span> <Tex>{"y_2 / y_1"}</Tex>
                </th>
              </tr>
            </thead>
            <tbody>
              {XS.map((x, i) => (
                <tr key={x} className="border-t border-border">
                  <td className="py-1.5 font-latin">{x}</td>
                  <td className="font-latin font-bold">{num(ys[i])}</td>
                  <td className={cn(constDiff && "bg-mint-soft font-bold text-mint-dark")}>{i > 0 ? <Tex>{`${num(ys[i])} - ${num(ys[i - 1])} = ${num(diffs[i - 1])}`}</Tex> : "—"}</td>
                  <td className={cn(constRatio && "bg-mint-soft font-bold text-mint-dark")}>{i > 0 ? <Tex>{`\\tfrac{${num(ys[i])}}{${num(ys[i - 1])}} ${Number.isInteger(ratios[i - 1]) ? "=" : "\\approx"} ${num(ratios[i - 1], 2)}`}</Tex> : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <SimPlot label="الدوال الثلاث" x={[0, 5.3]} y={[0, 130]} xStep={1} yStep={20} xLabel="x" yLabel="y" height={220}>
            {(Object.keys(FNS) as Fn[]).map((k) => (
              <Plot.OfX key={k} y={FNS[k].f} color={FNS[k].color} weight={k === fn ? 4 : 2} opacity={k === fn ? 1 : 0.3} domain={[0, 5.3]} />
            ))}
          </SimPlot>
        </div>
      }
      readouts={[
        { label: "الدالة", tex },
        { label: "الفرق ثابت؟", tex: constDiff ? `\\checkmark\\ d = ${num(diffs[0])}` : "\\times", tone: constDiff ? "good" : "default" },
        { label: "النسبة ثابتة؟", tex: constRatio ? `\\checkmark\\ b = ${num(ratios[0])}` : "\\times", tone: constRatio ? "good" : "default" },
      ]}
      controls={
        <>
          <Choice<Fn>
            label="اختر الدالة"
            value={fn}
            onChange={pick}
            options={[
              { value: "linear", label: "y = 3x" },
              { value: "cubic", label: "y = x³" },
              { value: "exp", label: "y = 3ˣ" },
            ]}
          />
          <div className="rounded-[14px] border-2 border-primary/30 bg-primary-soft p-3 text-sm leading-7 text-ink">
            {fn === "linear" && <>نضيف 3 كل مرة: فرق ثابت ⇐ خطية (مثل المتتالية الحسابية).</>}
            {fn === "cubic" && <>لا الفرق ثابت ولا النسبة: دالة قوة، المتغير في الأساس.</>}
            {fn === "exp" && <>نضرب في 3 كل مرة: نسبة ثابتة ⇐ دالة أسية، المتغير في الأس!</>}
          </div>
        </>
      }
      observations={obs}
    />
  );
}
