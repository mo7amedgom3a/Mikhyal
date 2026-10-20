"use client";
import { useState } from "react";
import { Line, Plot, Point } from "mafs";
import { useObservations, param } from "@/components/phenomena/sims/SimFrame";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { niceStep, num, solveExp } from "@/lib/exponential";
import { SimCard } from "@/components/sequences/SimCard";

const PRESETS = [
  { id: "hawks", name: "الصقور", eq: "220(1.05)ˣ = 280", a: 220, b: 1.05, target: 280 },
  { id: "car", name: "السيارة", eq: "96000(0.8)ˣ = 20000", a: 96000, b: 0.8, target: 20000 },
  { id: "pop", name: "السكان", eq: "4.6(1.013)ˣ = 9.2", a: 4.6, b: 1.013, target: 9.2 },
  { id: "machine", name: "الطابعة", eq: "30(0.93)ˣ = 15", a: 30, b: 0.93, target: 15 },
];
const B = param("sb", "الأساس", "b", 0.5, 2, 0.01, "", 1.05);

/** Solving a·b^x = c with logarithms, one visible step at a time, checked on the graph. */
export function SolverSim() {
  const [preset, setPreset] = useState(PRESETS[0]);
  const [b, setB] = useState(preset.b);
  const [target, setTarget] = useState(preset.target);
  const [steps, setSteps] = useState(1);
  const { a } = preset;
  const x = solveExp(a, b, target);
  const ratio = target / a;
  const T = param("st", "القيمة المطلوبة", "c", +(a * 0.2).toPrecision(2), +(a * 3).toPrecision(2), +(a / 100).toPrecision(1), "", preset.target);
  const xMax = x !== null ? Math.max(10, Math.ceil(x * 1.4)) : 10;
  const yMax = Math.max(a * b ** xMax, a, target) * 1.1;

  const obs = useObservations([
    { id: "all", label: "اكشف كل خطوات الحل.", met: steps >= 4 },
    { id: "car", label: "حل مسألة السيارة وقارن بقراءة الآلة الحاسبة في الكتاب (حوالي 7 سنوات).", met: preset.id === "car" && steps >= 4 },
    { id: "none", label: "اجعل المعادلة بلا حل. متى يحدث ذلك؟", met: x === null || x < 0 },
  ]);

  const lines = [
    `${num(a)}\\cdot ${num(b, 3)}^{x} = ${num(target)}`,
    `${num(b, 3)}^{x} = \\dfrac{${num(target)}}{${num(a)}} \\approx ${num(ratio, 4)}`,
    `x\\log ${num(b, 3)} = \\log ${num(ratio, 4)}`,
    x === null ? "\\text{—}" : `x = \\dfrac{\\log ${num(ratio, 4)}}{\\log ${num(b, 3)}} \\approx ${num(x, 2)}`,
  ];
  const why = ["المعادلة الأصلية.", "نقسم الطرفين على القيمة الابتدائية $a$ لنعزل القوة.", "نأخذ $\\log$ للطرفين؛ خاصية القوة $\\log b^x = x\\log b$ «تُنزل» $x$ من الأس.", "نقسم على $\\log b$."];

  return (
    <SimCard
      id="solver"
      title="حل المعادلات الأسية باللوغاريتمات"
      intro="متى تصل الكمية إلى قيمة معينة؟ المجهول في الأس، والأداة التي تُخرجه هي اللوغاريتم. اختر مسألة من الدرس واكشف خطوات الحل."
      actions={
        <Button size="sm" onClick={() => setSteps((s) => Math.min(4, s + 1))} disabled={steps >= 4}>
          الخطوة التالية
        </Button>
      }
      stage={
        <div className="space-y-3 p-3">
          <ol className="space-y-2" dir="rtl">
            {lines.slice(0, steps).map((l, i) => (
              <li key={i} className="flex flex-wrap items-center gap-3 rounded-[12px] border-2 border-border bg-surface px-3 py-2">
                <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary-soft font-latin text-sm font-bold text-primary">{i + 1}</span>
                <span className="relative overflow-x-auto text-lg" dir="ltr">
                  <Tex>{l}</Tex>
                </span>
                <span className="text-sm text-ink-2">
                  <MathText>{why[i]}</MathText>
                </span>
              </li>
            ))}
          </ol>
          <SimPlot label="نقطة التقاطع هي الحل" x={[0, xMax]} y={[0, yMax]} xStep={niceStep(xMax, 8)} yStep={niceStep(yMax, 5)} xLabel="x" yLabel="y" height={220}>
            <Line.ThroughPoints point1={[0, target]} point2={[1, target]} color="var(--mafs-red)" style="dashed" />
            <Plot.OfX y={(t) => a * b ** t} color="var(--mafs-blue)" weight={3} domain={[0, xMax]} />
            {x !== null && x >= 0 && steps >= 4 && <Point x={x} y={target} color="var(--mafs-red)" />}
          </SimPlot>
        </div>
      }
      readouts={[
        { label: "الحل", tex: x === null ? "\\text{—}" : `x \\approx ${num(x, 2)}`, tone: steps >= 4 ? "good" : "default" },
        { label: "تحقق بالتعويض", tex: x === null ? "\\text{—}" : `${num(a)}\\cdot${num(b, 3)}^{${num(x, 2)}} \\approx ${num(a * b ** x, 2)}` },
      ]}
      controls={
        <>
          <div className="flex flex-col gap-1.5 rounded-[14px] border-2 border-border bg-surface p-3">
            <p className="text-sm font-semibold text-ink-2">مسائل من الدرس</p>
            {PRESETS.map((p) => (
              <Button
                key={p.id}
                size="sm"
                variant={p.id === preset.id ? "default" : "outline"}
                onClick={() => {
                  setPreset(p);
                  setB(p.b);
                  setTarget(p.target);
                  setSteps(1);
                }}
              >
                {p.name}:{" "}
                <span dir="ltr" className="font-latin">
                  {p.eq}
                </span>
              </Button>
            ))}
          </div>
          <VariableSlider param={B} value={b} onChange={setB} />
          <VariableSlider param={T} value={target} onChange={setTarget} />
        </>
      }
      observations={obs}
    />
  );
}
