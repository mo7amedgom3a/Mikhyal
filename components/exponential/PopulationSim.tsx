"use client";
import { useState } from "react";
import { Plot, Point } from "mafs";
import { useObservations, param } from "@/components/phenomena/sims/SimFrame";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { doublingTime, model, niceStep, num } from "@/lib/exponential";
import { SimCard } from "@/components/sequences/SimCard";

const P = {
  p0: param("p0", "عدد السكان عام 2010", "a", 1, 10, 0.1, "مليون", 4.6),
  r: param("pr", "معدل التغير السنوي", "r", -3, 5, 0.1, "%", 1.3),
  year: param("year", "السنة", "t", 2010, 2070, 1, "", 2010),
};
const UNITS = [0.05, 0.1, 0.25, 0.5, 1, 2, 5];
const MAX_ICONS = 160;

function Person({ x, y, s, fill }: { x: number; y: number; s: number; fill: string }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${s})`} fill={fill}>
      <circle cx={0} cy={-7} r={3.2} />
      <path d="M -4.2 -2.5 Q 0 -4.5 4.2 -2.5 L 3.4 7 L -3.4 7 Z" />
    </g>
  );
}

/** Example 3: P = 4.6(1.013)^t. Each year multiplies by the same factor; the people grid shows the repeated multiplication. */
export function PopulationSim() {
  const [p0, setP0] = useState(P.p0.default);
  const [r, setR] = useState(P.r.default);
  const [year, setYear] = useState(P.year.default);
  const t = year - 2010;
  const rate = r / 100;
  const b = 1 + rate;
  const pop = model(p0, rate, t);
  const linear = p0 * (1 + rate * t);
  const unit = UNITS.find((u) => model(p0, Math.max(0, rate), 60) / u <= MAX_ICONS) ?? 5;
  const icons = Math.round(pop / unit);
  const base = Math.round(p0 / unit);
  const cols = 20;
  const yMax = Math.max(p0, model(p0, rate, 60)) * 1.1;

  const obs = useObservations([
    { id: "2040", label: "أوجد عدد السكان عام 2040 كما في المثال 3B.", met: year === 2040 && p0 === 4.6 && r === 1.3 },
    { id: "double", label: "أوجد السنة التي يتضاعف فيها عدد السكان.", met: rate > 0 && pop >= 2 * p0 },
    { id: "decay", label: "اجعل المعدل سالبًا (مدينة يتناقص سكانها كما في التمرين 12).", met: r < 0 && t > 5 },
    { id: "linear", label: "قارن بالنمو الخطي (الخط المتقطع) بعد 50 سنة.", met: t >= 50 && rate > 0 },
  ]);

  const chain = Array.from({ length: Math.min(t, 3) + 1 }, (_, i) => (i === 0 ? `${num(p0, 2)}` : `${num(p0, 2)}(${num(b, 4)})^{${i}}`));

  return (
    <SimCard
      id="population"
      title="نمو سكان مدينة (المثال 3)"
      intro="بلغ عدد سكان مدينة 4.6 مليون نسمة عام 2010، ويتزايد بمعدل $1.3\%$ سنويًا. كل سنة نضرب العدد السابق في $1.013$، فبعد $t$ سنة: $P = 4.6(1.013)^t$."
      stage={
        <div className="grid gap-2 p-3 md:grid-cols-2">
          <div>
            <svg viewBox={`0 0 ${cols * 15 + 10} ${Math.ceil(MAX_ICONS / cols) * 19 + 10}`} className="block w-full" role="img" aria-label={`${num(pop, 2)} مليون نسمة`}>
              {Array.from({ length: Math.min(icons, MAX_ICONS) }, (_, i) => (
                <Person key={i} x={12 + (i % cols) * 15} y={14 + Math.floor(i / cols) * 19} s={1} fill={i < base ? "var(--brand-primary)" : "var(--brand-discovery)"} />
              ))}
            </svg>
            <p className="text-center text-xs text-ink-3" dir="rtl">
              كل شخص = {unit} مليون · <span className="text-primary">■</span> سكان 2010 · <span className="text-mint-dark">■</span> الزيادة
            </p>
          </div>
          <SimPlot label="عدد السكان (بالملايين)" x={[0, 61]} y={[0, yMax]} xStep={10} yStep={niceStep(yMax, 5)} xLabel="t (2010 + t)" yLabel="P" height={230}>
            <Plot.OfX y={(x) => p0 * (1 + rate * x)} color="var(--mafs-fg)" style="dashed" opacity={0.4} domain={[0, 60]} />
            <Plot.OfX y={(x) => model(p0, rate, x)} color="var(--mafs-blue)" weight={3} domain={[0, 60]} />
            <Point x={t} y={pop} color="var(--mafs-orange)" />
          </SimPlot>
        </div>
      }
      readouts={[
        { label: `عدد السكان عام ${year}`, tex: `P(${t}) = ${num(p0, 2)}(${num(b, 4)})^{${t}} \\approx ${num(pop, 2)}`, tone: "good" },
        { label: "لو كان النمو خطيًا", tex: `${num(p0, 2)} + ${num(p0 * rate, 3)}\\times${t} \\approx ${num(linear, 2)}` },
        { label: rate >= 0 ? "معامل النمو" : "معامل الاضمحلال", tex: `b = 1 ${rate >= 0 ? "+" : "-"} ${num(Math.abs(rate), 4)} = ${num(b, 4)}` },
        { label: rate >= 0 ? "يتضاعف كل" : "ينتصف كل", tex: rate === 0 ? "\\text{—}" : `\\dfrac{\\log 2}{|\\log ${num(b, 4)}|} \\approx ${num(doublingTime(b), 1)}\\ \\text{yr}` },
        { label: "الزيادة هذا العام", tex: `${t === 0 ? "0" : num(pop - model(p0, rate, t - 1), 3)}` },
        { label: "الضرب المتكرر", tex: chain.join(",\\ ") + (t > 3 ? ",\\ \\dots" : "") },
      ]}
      controls={
        <>
          <VariableSlider param={P.year} value={year} onChange={setYear} />
          <VariableSlider param={P.p0} value={p0} onChange={setP0} />
          <VariableSlider param={P.r} value={r} onChange={setR} />
        </>
      }
      observations={obs}
    />
  );
}
