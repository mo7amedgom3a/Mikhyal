"use client";
import { useState } from "react";
import { Line, Plot, Point } from "mafs";
import { useObservations, param } from "@/components/phenomena/sims/SimFrame";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { Button } from "@/components/ui/button";
import { Tex } from "@/components/ui/Tex";
import { expAt, features, kindOf, num, type ExpParams } from "@/lib/exponential";
import { SimCard } from "@/components/sequences/SimCard";

const P = {
  a: param("ea", "القيمة الابتدائية / التمدد", "a", -5, 5, 0.5, "", 1),
  b: param("eb", "الأساس", "b", 0.1, 4, 0.05, "", 2),
  h: param("eh", "إزاحة أفقية", "h", -4, 4, 1, "", 0),
  k: param("ek", "إزاحة رأسية", "k", -5, 5, 1, "", 0),
};

const PRESETS: { label: string; p: ExpParams }[] = [
  { label: "f(x) = 2ˣ", p: { a: 1, b: 2, h: 0, k: 0 } },
  { label: "g(x) = 5(½)ˣ", p: { a: 5, b: 0.5, h: 0, k: 0 } },
  { label: "g(x) = −3ˣ", p: { a: -1, b: 3, h: 0, k: 0 } },
  { label: "h(x) = 3ˣ − 4", p: { a: 1, b: 3, h: 0, k: -4 } },
  { label: "g(x) = 4(0.5)ˣ⁻³", p: { a: 4, b: 0.5, h: 3, k: 0 } },
];

const lim = (v: number) => (v === Infinity ? "\\infty" : v === -Infinity ? "-\\infty" : num(v));

function equationTex({ a, b, h, k }: ExpParams): string {
  const coef = a === 1 ? "" : a === -1 ? "-" : `${num(a)}\\cdot`;
  const exp = h === 0 ? "x" : `x ${h > 0 ? "-" : "+"} ${num(Math.abs(h))}`;
  const shift = k === 0 ? "" : ` ${k > 0 ? "+" : "-"} ${num(Math.abs(k))}`;
  const base = Number.isInteger(b) ? num(b) : `(${num(b)})`;
  return `y = ${coef}${base}^{${exp}}${shift}`;
}

/** Key features lab: drag a, b, h, k and watch domain, range, intercept, asymptote and end behaviour update. */
export function FeaturesLab() {
  const [p, setP] = useState<ExpParams>(PRESETS[0].p);
  const set = (key: keyof ExpParams) => (v: number) => setP((s) => ({ ...s, [key]: key === "a" && v === 0 ? 0.5 : v }));
  const flat = p.b === 1;
  const f = features(p);
  const kind = kindOf(p);
  const parent: ExpParams = { a: 1, b: p.b, h: 0, k: 0 };

  const obs = useObservations([
    { id: "decay", label: "اجعل الدالة اضمحلالًا: اختر $0 < b < 1$.", met: p.b < 1 && p.a > 0 },
    { id: "reflect", label: "اعكس المنحنى حول المحور $x$ مثل $g(x) = -3^x$.", met: p.a < 0 },
    { id: "down", label: "أزِح خط التقارب إلى $y = -4$ مثل $h(x) = 3^x - 4$.", met: p.k === -4 },
    { id: "five", label: "اجعل المقطع $y$ يساوي 5.", met: Math.abs(f.yIntercept - 5) < 1e-9 },
    { id: "one", label: "ماذا يحدث عندما $b = 1$؟", met: flat },
  ]);

  return (
    <SimCard
      id="features"
      title="مختبر الخصائص الأساسية"
      intro="الدالة الأسية $y = a \cdot b^{x}$ حيث $a \ne 0$ و $b > 0$ و $b \ne 1$. حرّك المعاملات (أو اختر دالة من الكتاب) وراقب المجال والمدى والمقطع وخط التقارب والسلوك الطرفي."
      stage={
        <SimPlot label="المنحنى الأصلي (باهت) والمنحنى بعد التحويل" x={[-6, 6]} y={[-8, 10]} xStep={2} yStep={2} xLabel="x" yLabel="y" height={320}>
          <Plot.OfX y={(x) => expAt(parent, x)} color="var(--mafs-fg)" opacity={0.2} />
          <Line.ThroughPoints point1={[-6, f.asymptote]} point2={[6, f.asymptote]} color="var(--mafs-red)" style="dashed" opacity={0.7} />
          <Plot.OfX y={(x) => expAt(p, x)} color={kind === "decay" ? "var(--mafs-orange)" : "var(--mafs-blue)"} weight={4} />
          <Point x={0} y={f.yIntercept} color="var(--mafs-green)" />
        </SimPlot>
      }
      readouts={[
        { label: "المعادلة", tex: equationTex(p) },
        { label: flat ? "تنبيه" : kind === "growth" ? "النوع: نمو أسي" : "النوع: اضمحلال أسي", tex: flat ? `b = 1 \\Rightarrow y = ${num(p.a + p.k)}` : kind === "growth" ? "\\nearrow" : "\\searrow", tone: flat ? "default" : "good" },
        { label: "المجال", tex: f.domain },
        { label: "المدى", tex: flat ? `\\{${num(p.a + p.k)}\\}` : f.range },
        { label: "المقطع y", tex: `(0,\\ ${num(f.yIntercept)})` },
        { label: "خط التقارب", tex: `y = ${num(f.asymptote)}` },
        { label: "عندما x → ∞", tex: `y \\to ${lim(f.right)}` },
        { label: "عندما x → −∞", tex: `y \\to ${lim(f.left)}` },
      ]}
      below={
        flat ? (
          <p className="rounded-[12px] border-2 border-amber bg-amber-soft px-3 py-2 text-[15px] text-ink">
            عندما <Tex>{"b = 1"}</Tex> يصبح <Tex>{"1^x = 1"}</Tex> لكل <Tex>{"x"}</Tex>، فالمنحنى خط أفقي وليس دالة أسية. لهذا يشترط التعريف <Tex>{"b \\ne 1"}</Tex>.
          </p>
        ) : (
          <p className="rounded-[12px] border-2 border-primary/30 bg-primary-soft px-3 py-2 text-[15px] leading-7 text-ink">
            الخط الأحمر المتقطع هو خط التقارب: المنحنى يقترب منه بلا نهاية لكنه لا يلمسه، لأن <Tex>{`${num(p.b)}^x`}</Tex> لا يساوي صفرًا أبدًا.
          </p>
        )
      }
      controls={
        <>
          <div className="flex flex-wrap gap-1.5 rounded-[14px] border-2 border-border bg-surface p-3">
            <p className="w-full text-sm font-semibold text-ink-2">دوال من الكتاب</p>
            {PRESETS.map((pr) => (
              <Button key={pr.label} size="sm" variant="outline" className="font-latin" onClick={() => setP(pr.p)} dir="ltr">
                {pr.label}
              </Button>
            ))}
          </div>
          <VariableSlider param={P.a} value={p.a} onChange={set("a")} />
          <VariableSlider param={P.b} value={p.b} onChange={set("b")} />
          <VariableSlider param={P.h} value={p.h} onChange={set("h")} />
          <VariableSlider param={P.k} value={p.k} onChange={set("k")} />
        </>
      }
      observations={obs}
    />
  );
}
