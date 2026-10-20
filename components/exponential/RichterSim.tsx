"use client";
import { useState } from "react";
import { useObservations, param, Choice } from "@/components/phenomena/sims/SimFrame";
import { useAnimationFrame } from "@/components/phenomena/sims/useAnimationFrame";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { Button } from "@/components/ui/button";
import { num, quakeAmplitudeRatio, quakeEnergyRatio, sciTex } from "@/lib/exponential";
import { SimCard } from "@/components/sequences/SimCard";
import { useInView } from "./useInView";

const P = {
  m1: param("m1", "قوة الزلزال الأول", "M₁", 1, 9.5, 0.1, "", 5),
  m2: param("m2", "قوة الزلزال الثاني", "M₂", 1, 9.5, 0.1, "", 7),
};
const PRESETS = [
  { label: "خفيف 3", m: 3 },
  { label: "متوسط 5", m: 5 },
  { label: "قوي 7", m: 7 },
  { label: "عظيم 9", m: 9 },
];
const W = 560;
const H = 90;

/** A seismograph trace whose height is proportional to the real wave amplitude 10^M. */
function Trace({ amp, phase, color, label }: { amp: number; phase: number; color: string; label: string }) {
  const pts: string[] = [];
  for (let i = 0; i <= 280; i++) {
    const x = (i / 280) * W;
    const env = Math.exp(-(((i - 150) / 70) ** 2));
    const y = H / 2 - amp * (H / 2 - 6) * env * Math.sin(i * 0.55 + phase) * (0.75 + 0.25 * Math.sin(i * 0.13 + phase * 0.7));
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
  }
  return (
    <g>
      <rect width={W} height={H} fill="#fffdf6" stroke="var(--border)" />
      <line x1={0} x2={W} y1={H / 2} y2={H / 2} stroke="#e7dcc0" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.6} />
      <text x={8} y={16} fontSize={13} fontWeight={700} fill={color} fontFamily="var(--font-latin)">
        {label}
      </text>
    </g>
  );
}

/** Richter scale: M = log(A/A₀). One step up is 10× the amplitude and ≈ 31.6× the energy. */
export function RichterSim() {
  const [m1, setM1] = useState(P.m1.default);
  const [m2, setM2] = useState(P.m2.default);
  const [scale, setScale] = useState<"linear" | "log">("linear");
  const [phase, setPhase] = useState(0);
  const [stageRef, visible] = useInView<HTMLDivElement>();
  useAnimationFrame((dt) => setPhase((p) => p + dt * 6), visible);

  const big = Math.max(m1, m2);
  const a1 = 10 ** (m1 - big);
  const a2 = 10 ** (m2 - big);
  const dm = +(m2 - m1).toFixed(1);
  const ampRatio = quakeAmplitudeRatio(m1, m2);
  const energyRatio = quakeEnergyRatio(m1, m2);

  const obs = useObservations([
    { id: "one", label: "اجعل الفرق درجة واحدة. كم مرة تكبر السعة؟", met: Math.abs(Math.abs(dm) - 1) < 1e-9 },
    { id: "two", label: "قارن زلزالًا قوته 7 بآخر قوته 5.", met: (m1 === 5 && m2 === 7) || (m1 === 7 && m2 === 5) },
    { id: "nine", label: "قارن 9 بـ 5: هل يظهر الزلزال الصغير على الرسم أصلًا؟", met: Math.abs(dm) >= 4 },
    { id: "log", label: "بدّل الأعمدة إلى المقياس اللوغاريتمي.", met: scale === "log" },
  ]);

  const e1 = 10 ** (1.5 * (m1 - big));
  const e2 = 10 ** (1.5 * (m2 - big));
  const barH = (e: number, m: number) => (scale === "linear" ? e * 120 : (m / 10) * 120);

  return (
    <SimCard
      id="richter"
      title="مقياس ريختر للزلازل: لماذا نحتاج اللوغاريتم؟"
      intro="سعة موجات الزلزال تتراوح بين أرقام صغيرة جدًا وكبيرة جدًا، لذلك نقيسها لوغاريتميًا: $M = \log\dfrac{A}{A_0}$. زيادة درجة واحدة تعني سعة أكبر $10$ مرات وطاقة أكبر نحو $31.6$ مرة. الرسمان أدناه بالمقياس الحقيقي نفسه."
      stage={
        <div ref={stageRef} className="grid gap-3 p-3 md:grid-cols-[1fr_170px]">
          <svg viewBox={`0 0 ${W} ${H * 2 + 10}`} className="block w-full" role="img" aria-label="رسم الزلازل">
            <Trace amp={a1} phase={phase} color="var(--brand-discovery-dark)" label={`M = ${m1.toFixed(1)}`} />
            <g transform={`translate(0 ${H + 10})`}>
              <Trace amp={a2} phase={phase + 1.3} color="var(--danger)" label={`M = ${m2.toFixed(1)}`} />
            </g>
          </svg>
          <div className="flex flex-col items-center gap-1" dir="rtl">
            <p className="text-xs font-semibold text-ink-3">الطاقة المحرَّرة</p>
            <svg viewBox="0 0 150 150" className="h-36 w-36">
              <line x1={10} x2={140} y1={135} y2={135} stroke="var(--text-muted)" />
              <rect x={30} y={135 - barH(e1, m1)} width={36} height={Math.max(0.6, barH(e1, m1))} fill="var(--brand-discovery)" rx={3} />
              <rect x={84} y={135 - barH(e2, m2)} width={36} height={Math.max(0.6, barH(e2, m2))} fill="var(--danger)" rx={3} />
              <text x={48} y={148} textAnchor="middle" fontSize={11} fontFamily="var(--font-latin)">
                {m1.toFixed(1)}
              </text>
              <text x={102} y={148} textAnchor="middle" fontSize={11} fontFamily="var(--font-latin)">
                {m2.toFixed(1)}
              </text>
            </svg>
            <p className="text-center text-xs text-ink-3">{scale === "linear" ? "مقياس خطي: الصغير يختفي" : "مقياس لوغاريتمي: ارتفاع العمود = M"}</p>
          </div>
        </div>
      }
      readouts={[
        { label: "فرق القوة", tex: `\\Delta M = ${num(dm, 1)}` },
        { label: "نسبة السعة", tex: `10^{${num(dm, 1)}} \\approx ${sciTex(ampRatio)}`, tone: "good" },
        { label: "نسبة الطاقة", tex: `10^{1.5 \\times ${num(dm, 1)}} \\approx ${sciTex(energyRatio)}` },
        { label: "الصيغة", tex: "M = \\log A - \\log A_0" },
      ]}
      controls={
        <>
          <VariableSlider param={P.m1} value={m1} onChange={setM1} />
          <VariableSlider param={P.m2} value={m2} onChange={setM2} />
          <div className="flex flex-wrap gap-1.5 rounded-[14px] border-2 border-border bg-surface p-3">
            <p className="w-full text-sm font-semibold text-ink-2">اجعل الزلزال الثاني:</p>
            {PRESETS.map((p) => (
              <Button key={p.m} size="sm" variant="outline" onClick={() => setM2(p.m)}>
                {p.label}
              </Button>
            ))}
          </div>
          <Choice
            label="مقياس أعمدة الطاقة"
            value={scale}
            onChange={setScale}
            options={[
              { value: "linear", label: "خطي" },
              { value: "log", label: "لوغاريتمي" },
            ]}
          />
        </>
      }
      observations={obs}
    />
  );
}
