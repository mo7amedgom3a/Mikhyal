"use client";
import { useState } from "react";
import { Line, Plot, Point, Text } from "mafs";
import { CONST, unruhTemperature } from "@/lib/physics/phenomena";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { param, sci, SimFrame, Slider, useObservations } from "./SimFrame";
import { SimPlot } from "./SimPlot";
import { useAnimationFrame } from "./useAnimationFrame";

const W = 560;
const H = 260;
const OFFSET = Math.log10(CONST.hbar / (2 * Math.PI * CONST.c * CONST.kB));
const REFS = [
  { label: "الجاذبية", a: 9.8 },
  { label: "رصاصة", a: 1e5 },
  { label: "بروتون في LHC", a: 1e20 },
];

/** Conceptual glow colour: dim red → orange → white as log T rises (a visual mapping, not a spectrum). */
function glow(logT: number) {
  const t = Math.max(0, Math.min(1, (logT + 3) / 6));
  return `rgb(255, ${Math.round(60 + 195 * t)}, ${Math.round(20 + 235 * t * t)})`;
}

export function UnruhSim() {
  const [logA, setLogA] = useState(20);
  const [time, setTime] = useState(0);
  const reduced = usePrefersReducedMotion();
  useAnimationFrame((dt) => setTime((t) => t + dt), !reduced);

  const a = 10 ** logA;
  const T = unruhTemperature(a);
  const logT = Math.log10(T);
  const visible = Math.max(0, Math.min(1, (logT + 4) / 6));
  const nParticles = Math.round(visible * 40);
  const rocketY = 200 - ((time * (0.6 + visible * 2)) % 1) * 160;

  const obs = useObservations([
    { id: "earth", label: "حط العجلة = $g$: الحرارة تقريبًا $10^{-20}\\,\\mathrm{K}$ — مستحيل نحسها", met: logA < 1.2 },
    { id: "lhc", label: "وصّل لعجلة بروتون في المعجّل ($10^{20}$)", met: logA >= 20 },
    { id: "kelvin", label: "لاقي العجلة اللي تخلي $T \\approx 1\\,\\mathrm{K}$", met: Math.abs(logT) < 0.15 },
  ]);

  return (
    <SimFrame
      stage={
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="مقارنة تصورية: راصد ساكن يرى فراغًا فاضيًا وراصد متسارع يرى توهجًا حراريًا">
          <rect width={W / 2 - 4} height={H} fill="#020617" />
          <rect x={W / 2 + 4} width={W / 2 - 4} height={H} fill="#020617" />
          <text x={W / 4} y="22" textAnchor="middle" fontSize="13" fill="#cbd5e1">
            راصد ساكن: فراغ فاضي
          </text>
          <circle cx={W / 4} cy={H / 2 + 10} r="14" fill="#94a3b8" />
          <text x={W / 4} y={H / 2 + 50} textAnchor="middle" fontSize="11" fill="#64748b">
            T = 0
          </text>
          <text x={(3 * W) / 4} y="22" textAnchor="middle" fontSize="13" fill="#cbd5e1">
            راصد متسارع: الفراغ «سخن»
          </text>
          <defs>
            <radialGradient id="unruh-glow">
              <stop offset="0%" stopColor={glow(logT)} stopOpacity={0.15 + 0.7 * visible} />
              <stop offset="100%" stopColor={glow(logT)} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx={(3 * W) / 4} cy={rocketY} r={40 + 70 * visible} fill="url(#unruh-glow)" />
          {Array.from({ length: nParticles }).map((_, i) => {
            const ang = i * 2.39996 + time * (0.5 + (i % 5) * 0.2);
            const r = 30 + ((i * 37) % 70);
            return <circle key={i} cx={(3 * W) / 4 + r * Math.cos(ang)} cy={rocketY + r * Math.sin(ang)} r="2" fill={glow(logT)} opacity={0.8} />;
          })}
          <g transform={`translate(${(3 * W) / 4},${rocketY})`}>
            <path d="M0,-18 L8,6 L-8,6 Z" fill="#e2e8f0" />
            <path d="M-5,6 L0,18 L5,6 Z" fill="#f97316" />
          </g>
          <text x={(3 * W) / 4} y={H - 12} textAnchor="middle" fontSize="11" fill="#64748b">
            تصوّر مفاهيمي — التأثير ماتقاسش مباشرة لسه
          </text>
        </svg>
      }
      controls={<Slider param={param("loga", "العجلة (لوغاريتم: a = 10^x)", "x", 0, 22, 0.5, "", 20)} value={logA} onChange={setLogA} />}
      readouts={[
        { label: "العجلة", tex: `a = ${sci(a)}\\,\\mathrm{m/s^2}` },
        { label: "حرارة أونرو", tex: `T = ${sci(T)}\\,\\mathrm{K}`, tone: logT > -1 ? "good" : "default" },
        { label: "النسبة الثابتة", tex: `\\frac{T}{a} = ${sci(10 ** OFFSET)}\\,\\mathrm{K\\,s^2/m}` },
      ]}
      notice={
        logT < -6
          ? "الحرارة صغيرة جدًا: حتى أقوى صاروخ مايقدرش يحسها. محتاجين عجلات خيالية."
          : "كل ما العجلة تزيد ×10، الحرارة تزيد ×10 (علاقة طردية). عند عجلات قريبة من $10^{20}\\,\\mathrm{m/s^2}$ بس الحرارة بتقرب من كلفن."
      }
      plot={
        <SimPlot label="log T مقابل log a" x={[0, 22]} y={[-21, 3]} xStep={2} yStep={3} xLabel="log₁₀ a (m/s²)" yLabel="log₁₀ T (K)">
          <Plot.OfX y={(x) => x + OFFSET} color="var(--mafs-orange)" />
          <Line.Segment point1={[0, 0]} point2={[22, 0]} color="var(--mafs-red)" style="dashed" opacity={0.5} />
          {REFS.map((r) => (
            <g key={r.label}>
              <Point x={Math.log10(r.a)} y={Math.log10(unruhTemperature(r.a))} color="var(--mafs-blue)" />
              <Text x={Math.log10(r.a)} y={Math.log10(unruhTemperature(r.a)) + 1.6} size={10}>
                {r.label}
              </Text>
            </g>
          ))}
          <Point x={logA} y={logT} color="var(--mafs-red)" />
        </SimPlot>
      }
      observations={obs}
      howItWorks={[
        "في نظرية المجال الكمّي، «الفراغ» مش فاضي: فيه تذبذبات كمّية في كل مكان.",
        "الراصد الساكن بيشوفها فراغ عادي حرارته صفر.",
        "الراصد المتسارع بانتظام عنده «أفق» (زي الثقب الأسود)، فنفس التذبذبات بتظهرله كإشعاع حراري.",
        "الحرارة $T = \\frac{\\hbar a}{2\\pi c k_B}$ — صغيرة جدًا، شبه إشعاع هوكينج. (متقدّم · اختياري)",
      ]}
    />
  );
}
