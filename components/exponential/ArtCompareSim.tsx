"use client";
import { useState } from "react";
import { Line, Plot, Point } from "mafs";
import { useObservations, param } from "@/components/phenomena/sims/SimFrame";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { avgRate, num, solveExp } from "@/lib/exponential";
import { SimCard } from "@/components/sequences/SimCard";

/** Example 5: the painting's graph passes (0, 40) and (5, 64.4), i.e. 40(1.1)^x; the sculpture is 50(1.075)^x. */
const painting = (x: number) => 40 * 1.1 ** x;
const sculpture = (x: number) => 50 * 1.075 ** x;
/** 40·1.1^x = 50·1.075^x ⇔ (1.1/1.075)^x = 1.25. */
const CROSS = solveExp(1, 1.1 / 1.075, 50 / 40) ?? 0;

const P = {
  x1: param("x1", "بداية الفترة", "x₁", 0, 19, 1, "سنة", 0),
  x2: param("x2", "نهاية الفترة", "x₂", 1, 20, 1, "سنة", 5),
};

function Frame({ title, value, rate, color, art }: { title: string; value: number; rate: number; color: string; art: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-1 rounded-[14px] border-2 border-border bg-surface p-2" dir="rtl">
      <svg viewBox="0 0 120 90" className="h-24 w-32">
        {art}
      </svg>
      <p className="text-sm font-bold text-ink">{title}</p>
      <p className="font-latin text-lg font-extrabold" style={{ color }}>
        QR {Math.round(value * 1000).toLocaleString("en")}
      </p>
      <p className="text-xs text-ink-3">
        متوسط التغير: <span className="font-latin font-bold text-ink">{Math.round(rate * 1000).toLocaleString("en")}</span> ريال/سنة
      </p>
    </div>
  );
}

export function ArtCompareSim() {
  const [x1, setX1] = useState(P.x1.default);
  const [x2, setX2] = useState(P.x2.default);
  const a = Math.min(x1, x2 - 1);
  const b = Math.max(x2, a + 1);
  const rp = avgRate(painting, a, b);
  const rs = avgRate(sculpture, a, b);
  const winner = rp > rs ? "اللوحة" : "المنحوتة";

  const obs = useObservations([
    { id: "book", label: "الفترة $[0, 5]$: تحقق من $4.88$ و $4.356$ كما في الكتاب.", met: a === 0 && b === 5 },
    { id: "later", label: "اختر فترة بعد السنة 10. أيهما أغلى الآن؟", met: a >= 10 },
    { id: "cross", label: "ضع نهاية الفترة عند السنة التي تتجاوز فيها اللوحة المنحوتة.", met: b === Math.ceil(CROSS) },
  ]);

  return (
    <SimCard
      id="art"
      title="لوحة أم منحوتة؟ مقارنة دالتين أسيتين (المثال 5)"
      intro="اشترى متحف لوحة ومنحوتة في السنة نفسها. قيمة المنحوتة بآلاف الريالات $f(x) = 50(1.075)^x$، ومنحنى اللوحة يمر بـ $(0, 40)$ و $(5, 64.4)$ أي $40(1.1)^x$. حرّك الفترة وقارن متوسط معدل التغير $\dfrac{f(x_2) - f(x_1)}{x_2 - x_1}$ (ميل القاطع)."
      stage={
        <div className="space-y-2 p-3">
          <div className="grid grid-cols-2 gap-2">
            <Frame
              title="اللوحة"
              value={painting(b)}
              rate={rp}
              color="var(--brand-discovery-dark)"
              art={
                <>
                  <rect x={8} y={6} width={104} height={78} rx={4} fill="#c9a24a" />
                  <rect x={16} y={14} width={88} height={62} fill="#fff8e6" />
                  <path d="M 22 66 Q 45 30 60 50 T 98 38" stroke="var(--brand-discovery)" strokeWidth={4} fill="none" />
                  <circle cx={84} cy={28} r={7} fill="var(--brand-insight)" />
                </>
              }
            />
            <Frame
              title="المنحوتة"
              value={sculpture(b)}
              rate={rs}
              color="var(--brand-primary)"
              art={
                <>
                  <rect x={36} y={70} width={48} height={16} rx={2} fill="#8a6a45" />
                  <path d="M 60 70 C 30 55 70 40 52 22 C 70 30 88 45 60 70" fill="var(--brand-primary)" opacity={0.85} />
                  <path d="M 62 70 C 80 52 58 40 74 18" stroke="#f08a3c" strokeWidth={6} fill="none" strokeLinecap="round" />
                </>
              }
            />
          </div>
          <SimPlot label="القيمة (بآلاف الريالات)" x={[0, 20.5]} y={[0, 300]} xStep={2} yStep={50} xLabel="x (سنوات)" yLabel="f(x)" height={240}>
            <Plot.OfX y={painting} color="var(--mafs-green)" weight={3} domain={[0, 20.5]} />
            <Plot.OfX y={sculpture} color="var(--mafs-blue)" weight={3} domain={[0, 20.5]} />
            <Line.Segment point1={[a, painting(a)]} point2={[b, painting(b)]} color="var(--mafs-green)" style="dashed" />
            <Line.Segment point1={[a, sculpture(a)]} point2={[b, sculpture(b)]} color="var(--mafs-blue)" style="dashed" />
            {[a, b].map((x) => (
              <g key={x}>
                <Point x={x} y={painting(x)} color="var(--mafs-green)" />
                <Point x={x} y={sculpture(x)} color="var(--mafs-blue)" />
              </g>
            ))}
            <Point x={CROSS} y={painting(CROSS)} color="var(--mafs-red)" />
          </SimPlot>
        </div>
      }
      readouts={[
        { label: "اللوحة: متوسط التغير", tex: `\\tfrac{${num(painting(b), 2)} - ${num(painting(a), 2)}}{${b} - ${a}} \\approx ${num(rp, 3)}` },
        { label: "المنحوتة: متوسط التغير", tex: `\\tfrac{${num(sculpture(b), 2)} - ${num(sculpture(a), 2)}}{${b} - ${a}} \\approx ${num(rs, 3)}` },
        { label: `أسرع تزايدًا في الفترة: ${winner}`, tex: `${num(Math.max(rp, rs), 3)} > ${num(Math.min(rp, rs), 3)}`, tone: "good" },
        { label: "تتجاوز اللوحةُ المنحوتةَ عند", tex: `x = \\dfrac{\\log 1.25}{\\log(1.1/1.075)} \\approx ${num(CROSS, 2)}` },
      ]}
      below={
        <p className="rounded-[12px] border-2 border-primary/30 bg-primary-soft px-3 py-2 text-[15px] leading-7 text-ink">
          في الفترة المختارة تتزايد قيمة <b>{winner}</b> بمعدل أسرع. معامل نمو اللوحة <span className="font-latin">1.1</span> أكبر من <span className="font-latin">1.075</span>، لذلك ستتجاوز قيمتها المنحوتة يومًا ما رغم أنها بدأت أرخص (النقطة الحمراء). هذا جواب «حاول أن تحل 5».
        </p>
      }
      controls={
        <>
          <VariableSlider param={P.x1} value={x1} onChange={setX1} />
          <VariableSlider param={P.x2} value={x2} onChange={setX2} />
        </>
      }
      observations={obs}
    />
  );
}
