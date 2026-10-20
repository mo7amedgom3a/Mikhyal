"use client";
import { useState } from "react";
import { Choice, useObservations, param } from "@/components/phenomena/sims/SimFrame";
import { useAnimationFrame } from "@/components/phenomena/sims/useAnimationFrame";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { decibels, intensityOf, num, sciTex } from "@/lib/exponential";
import { cn } from "@/lib/utils";
import { SimCard } from "@/components/sequences/SimCard";
import { useInView } from "./useInView";

const SOURCES = [
  { db: 20, label: "حفيف أوراق" },
  { db: 30, label: "همس" },
  { db: 60, label: "محادثة" },
  { db: 85, label: "زحام مروري" },
  { db: 110, label: "حفل موسيقي" },
  { db: 120, label: "حد الألم" },
  { db: 140, label: "محرك طائرة" },
];
const L = param("db", "مستوى الصوت لمصدر واحد", "L", 0, 140, 1, "dB", 60);

/** Decibels: L = 10·log(I/I₀). Adding 10 dB multiplies the intensity by 10; doubling the sources adds only ≈ 3 dB. */
export function DecibelSim() {
  const [db, setDb] = useState(L.default);
  const [count, setCount] = useState<"1" | "2" | "10">("1");
  const [phase, setPhase] = useState(0);
  const [stageRef, visible] = useInView<HTMLDivElement>();
  useAnimationFrame((dt) => setPhase((p) => (p + dt * 0.8) % 1), visible);
  const n = Number(count);
  const I = intensityOf(db) * n;
  const total = decibels(I);
  const vsWhisper = I / intensityOf(30);
  const danger = total >= 85;

  const obs = useObservations([
    { id: "ten", label: "ارفع المستوى 10 ديسيبل. كم مرة تضاعفت الشدة؟", met: db >= 70 },
    { id: "two", label: "شغّل مصدرين متماثلين: هل يتضاعف عدد الديسيبل؟", met: n === 2 },
    { id: "pain", label: "صل إلى حد الألم 120 dB.", met: total >= 120 },
    { id: "talk", label: "قارن المحادثة (60) بالحفل (110): الفرق 50 dB يعني شدة أكبر $10^5$ مرة!", met: db === 110 },
  ]);

  return (
    <SimCard
      id="decibel"
      title="شدة الصوت بالديسيبل"
      intro="الأذن تسمع شدات صوت من $10^{-12}$ إلى أكثر من $1\ \text{W/m}^2$، لذلك نستعمل مقياسًا لوغاريتميًا: $L = 10\log\dfrac{I}{I_0}$ حيث $I_0 = 10^{-12}$. كل زيادة 10 dB تعني شدة أكبر 10 مرات."
      stage={
        <div ref={stageRef} className="space-y-3 p-3">
          <svg viewBox="0 0 560 170" className="block w-full" role="img" aria-label={`${num(total, 1)} ديسيبل`}>
            {Array.from({ length: n === 10 ? 4 : n }, (_, k) => (
              <g key={k} transform={`translate(${30 + k * 22} ${40 + k * 8})`}>
                <rect width={44} height={70} rx={8} fill="#2b2f55" />
                <circle cx={22} cy={22} r={10} fill="#9aa3c7" />
                <circle cx={22} cy={50} r={14} fill="#9aa3c7" />
              </g>
            ))}
            {n === 10 && (
              <text x={60} y={160} fontSize={12} fill="var(--text-secondary)" fontFamily="var(--font-latin)">
                ×10
              </text>
            )}
            {Array.from({ length: 6 }, (_, i) => {
              const r = ((i + phase) / 6) * 380;
              return <circle key={i} cx={110} cy={85} r={30 + r} fill="none" stroke={danger ? "var(--danger)" : "var(--brand-primary)"} strokeWidth={1 + (total / 140) * 5} opacity={(1 - (i + phase) / 6) * Math.min(1, total / 70)} />;
            })}
            <g transform="translate(330 20)">
              <rect width={220} height={130} rx={12} fill="var(--surface)" stroke="var(--border)" strokeWidth={2} />
              <text x={110} y={48} textAnchor="middle" fontSize={34} fontWeight={800} fill={danger ? "var(--danger)" : "var(--foreground)"} fontFamily="var(--font-latin)">
                {`${num(total, 1)} dB`}
              </text>
              <rect x={16} y={70} width={188} height={14} rx={7} fill="var(--surface-muted)" />
              <rect x={16} y={70} width={(188 * Math.min(140, Math.max(0, total))) / 140} height={14} rx={7} fill={danger ? "var(--danger)" : "var(--brand-discovery)"} />
              <text x={110} y={110} textAnchor="middle" fontSize={13} fill="var(--text-secondary)" fontFamily="var(--font-latin)">
                {`I ≈ ${I.toExponential(1).replace(/e([+-]\d+)/, " × 10^$1").replace("^+", "^")} W/m²`}
              </text>
            </g>
          </svg>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="أمثلة">
            {SOURCES.map((s) => (
              <button key={s.db} type="button" onClick={() => setDb(s.db)} className={cn("rounded-full border-2 px-3 py-1 text-sm transition-colors", db === s.db ? "border-primary bg-primary text-white" : "border-line-strong bg-card text-ink-2 hover:border-primary")}>
                {s.label} <span className="font-latin">{s.db}</span>
              </button>
            ))}
          </div>
        </div>
      }
      readouts={[
        { label: "شدة مصدر واحد", tex: `I = 10^{${num(db / 10 - 12, 1)}}\\ \\text{W/m}^2` },
        { label: "المستوى الكلي", tex: `10\\log\\dfrac{${n}\\times I}{I_0} \\approx ${num(total, 1)}\\ \\text{dB}`, tone: "good" },
        { label: "أشد من الهمس بـ", tex: `${sciTex(vsWhisper)}\\ \\times` },
        { label: n > 1 ? "الزيادة بسبب المصادر" : "زيادة 10 dB تعني", tex: n > 1 ? `10\\log ${n} \\approx +${num(10 * Math.log10(n), 1)}\\ \\text{dB}` : "I \\times 10" },
      ]}
      below={
        danger ? (
          <p className="rounded-[12px] border-2 border-destructive/30 bg-danger-soft px-3 py-2 text-[15px] leading-7 text-ink">التعرض الطويل لأصوات فوق 85 dB قد يضر السمع. لاحظ كيف أن الأرقام «الصغيرة» على المقياس اللوغاريتمي تخفي شدات هائلة.</p>
        ) : undefined
      }
      controls={
        <>
          <VariableSlider param={L} value={db} onChange={setDb} />
          <Choice
            label="عدد المصادر المتماثلة"
            value={count}
            onChange={setCount}
            options={[
              { value: "1", label: "1" },
              { value: "2", label: "2" },
              { value: "10", label: "10" },
            ]}
          />
        </>
      }
      observations={obs}
    />
  );
}
