"use client";
import { useState } from "react";
import { Line, Plot, Point } from "mafs";
import { useObservations, param } from "@/components/phenomena/sims/SimFrame";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { Tex } from "@/components/ui/Tex";
import { niceStep, num, solveExp } from "@/lib/exponential";
import { SimCard } from "@/components/sequences/SimCard";

const P = {
  price: param("price", "سعر الشراء", "a", 40000, 200000, 1000, "QR", 96000),
  r: param("dep", "معدل الاضمحلال السنوي", "r", 5, 50, 1, "%", 20),
  years: param("age", "عمر السيارة", "x", 0, 15, 0.1, "سنة", 0),
  target: param("target", "القيمة المستهدفة", "y", 5000, 100000, 1000, "QR", 20000),
};

/** Example 4: y = 96 000·0.8^x. The car loses the same percentage every year, so the losses shrink. */
export function CarSim() {
  const [price, setPrice] = useState(P.price.default);
  const [r, setR] = useState(P.r.default);
  const [x, setX] = useState(P.years.default);
  const [target, setTarget] = useState(P.target.default);
  const b = 1 - r / 100;
  const value = price * b ** x;
  const hit = target < price ? solveExp(price, b, target) : null;
  const age = Math.min(1, x / 12);
  const lostFirst = price - price * b;
  const lostThis = x >= 1 ? price * b ** (Math.floor(x) - 1) - price * b ** Math.floor(x) : lostFirst;

  const obs = useObservations([
    { id: "seven", label: "أوجد متى تبلغ القيمة QR 20 000 (المثال 4C).", met: price === 96000 && r === 20 && target === 20000 && hit !== null && Math.abs(x - hit) < 0.15 },
    { id: "half", label: "اضبط المعدل بحيث تنخفض القيمة للنصف كل سنة.", met: r === 50 },
    { id: "shrink", label: "لاحظ: هل تخسر السيارة المبلغ نفسه كل سنة؟ قارن السنة 1 بالسنة 10.", met: x >= 10 },
    { id: "zero", label: "هل تصل القيمة إلى صفر؟ ابحث عن خط التقارب.", met: x >= 15 },
  ]);

  return (
    <SimCard
      id="car"
      title="قيمة السيارة مع الزمن (المثال 4)"
      intro="اشترى خالد سيارة بمبلغ QR 96 000، وتفقد $20\%$ من قيمتها كل سنة، أي يبقى $80\%$: $y = 96\,000 \cdot 0.8^x$. حرّك عمر السيارة، ثم اختر قيمة مستهدفة واعرف متى تصلها السيارة."
      stage={
        <div className="space-y-2 p-3">
          <svg viewBox="0 0 520 170" className="block w-full" role="img" aria-label={`قيمة السيارة ${Math.round(value)} ريال`}>
            <defs>
              <linearGradient id="car-paint" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0" stopColor={`hsl(245 ${78 - age * 70}% ${60 + age * 8}%)`} />
                <stop offset="1" stopColor={`hsl(245 ${70 - age * 62}% ${42 + age * 10}%)`} />
              </linearGradient>
            </defs>
            <line x1={0} x2={520} y1={150} y2={150} stroke="var(--border-strong)" strokeWidth={3} />
            <g transform="translate(40 30)">
              <path d="M 20 95 L 30 60 Q 40 40 70 38 L 170 34 Q 200 34 220 55 L 245 70 Q 290 74 300 90 L 302 108 L 20 108 Z" fill="url(#car-paint)" stroke="#2b2f55" strokeWidth={2.5} />
              <path d="M 75 45 L 165 42 Q 190 43 205 60 L 75 62 Z" fill="#cfe3ff" opacity={0.85} />
              <line x1={135} x2={135} y1={44} y2={62} stroke="#2b2f55" strokeWidth={2} />
              {age > 0.3 && <path d="M 230 80 l 12 5 m -40 8 l 9 -6 m -130 4 l 10 3" stroke="#7a5230" strokeWidth={2.5} opacity={age} />}
              {[80, 240].map((cx) => (
                <g key={cx}>
                  <circle cx={cx} cy={110} r={22} fill="#20243f" />
                  <circle cx={cx} cy={110} r={9} fill="#9aa3c7" />
                </g>
              ))}
            </g>
            <g transform="translate(372 18)">
              <rect width={136} height={64} rx={10} fill="var(--brand-insight-soft)" stroke="var(--brand-insight)" strokeWidth={2.5} />
              <text x={68} y={26} textAnchor="middle" fontSize={13} fill="var(--text-secondary)">
                {`بعد ${num(x, 1)} سنة`}
              </text>
              <text x={68} y={51} textAnchor="middle" fontSize={20} fontWeight={800} fill="var(--foreground)" fontFamily="var(--font-latin)">
                {`QR ${Math.round(value).toLocaleString("en")}`}
              </text>
            </g>
            <rect x={372} y={96} width={136} height={12} rx={6} fill="var(--surface-muted)" />
            <rect x={372} y={96} width={(136 * value) / price} height={12} rx={6} fill="var(--brand-primary)" />
          </svg>
          <SimPlot label="قيمة السيارة (QR)" x={[0, 15.5]} y={[0, price * 1.08]} xStep={1} yStep={niceStep(price, 4)} xLabel="x (سنوات)" yLabel="y" height={230} yFormat={(v) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))}>
            <Line.ThroughPoints point1={[0, target]} point2={[15, target]} color="var(--mafs-red)" style="dashed" opacity={0.7} />
            <Plot.OfX y={(t) => price * b ** t} color="var(--mafs-orange)" weight={3} domain={[0, 15.5]} />
            {hit !== null && hit <= 15.5 && <Point x={hit} y={target} color="var(--mafs-red)" />}
            <Point x={x} y={value} color="var(--mafs-blue)" />
          </SimPlot>
        </div>
      }
      readouts={[
        { label: "النموذج", tex: `y = ${num(price)}\\cdot ${num(b, 2)}^{x}` },
        { label: "القيمة الآن", tex: `y(${num(x, 1)}) \\approx ${num(Math.round(value))}` },
        { label: "معامل / معدل الاضمحلال", tex: `b = ${num(b, 2)},\\ r = ${r}\\%` },
        { label: "خسارة السنة الأولى", tex: `${num(Math.round(lostFirst))}` },
        { label: `خسارة السنة ${Math.max(1, Math.floor(x))}`, tex: `${num(Math.round(lostThis))}` },
        {
          label: "تصل للقيمة المستهدفة بعد",
          tex: hit === null ? "\\text{—}" : `x = \\tfrac{\\log(${num(target / price, 4)})}{\\log ${num(b, 2)}} \\approx ${num(hit, 2)}`,
          tone: "good",
        },
      ]}
      below={
        <p className="rounded-[12px] border-2 border-primary/30 bg-primary-soft px-3 py-2 text-[15px] leading-7 text-ink">
          لإيجاد <Tex>{"x"}</Tex> عندما <Tex>{`y = ${num(target)}`}</Tex> نحتاج أن «نُنزل» <Tex>{"x"}</Tex> من الأس، وهذا عمل <b>اللوغاريتم</b> (القسم الثاني من الدرس). تحقق: <Tex>{hit === null ? "" : `${num(price)}\\cdot${num(b, 2)}^{${num(hit, 2)}} \\approx ${num(Math.round(price * b ** hit))}`}</Tex>
        </p>
      }
      controls={
        <>
          <VariableSlider param={P.years} value={x} onChange={setX} />
          <VariableSlider param={P.target} value={target} onChange={setTarget} />
          <VariableSlider param={P.price} value={price} onChange={setPrice} />
          <VariableSlider param={P.r} value={r} onChange={setR} />
        </>
      }
      observations={obs}
    />
  );
}
