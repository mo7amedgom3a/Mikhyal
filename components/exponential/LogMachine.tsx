"use client";
import { useState } from "react";
import { Line, Plot, Point } from "mafs";
import { Choice, useObservations } from "@/components/phenomena/sims/SimFrame";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";
import { Slider } from "@/components/ui/slider";
import { Tex } from "@/components/ui/Tex";
import { logBase, num } from "@/lib/exponential";
import { fmt } from "@/lib/sequences";
import { cn } from "@/lib/utils";
import { SimCard } from "@/components/sequences/SimCard";

type Base = "2" | "3" | "10" | "0.5";
const CHIPS: Record<Base, number[]> = {
  "2": [1 / 8, 1 / 4, 1 / 2, 1, 2, 4, 8, 16, 32, 64],
  "3": [1 / 9, 1 / 3, 1, 3, 9, 27, 81],
  "10": [0.01, 0.1, 1, 10, 100, 1000],
  "0.5": [1 / 4, 1 / 2, 1, 2, 4, 8],
};
const baseTex = (b: Base) => (b === "0.5" ? "\\tfrac12" : b);

/** log_b x answers "b to which power gives x?"; its graph is b^x reflected in y = x. */
export function LogMachine() {
  const [base, setBase] = useState<Base>("2");
  const b = Number(base);
  const chips = CHIPS[base];
  const lo = Math.log(chips[0]);
  const hi = Math.log(chips[chips.length - 1]);
  // The slider moves on a log scale so that 1/8 … 64 are evenly spaced.
  const [s, setS] = useState(Math.log(8));
  const raw = Math.exp(Math.min(hi, Math.max(lo, s)));
  // Snap to a chip so 1/3 is exactly 1/3 and log₃(1/3) is exactly −1.
  const x = chips.find((c) => Math.abs(raw - c) < 2e-3 * c) ?? +raw.toPrecision(4);
  const L = logBase(b, x);
  const whole = Number.isInteger(L);

  const obs = useObservations([
    { id: "l8", label: "احسب $\\log_2 8$: كم مرة نضرب 2 لنحصل على 8؟", met: base === "2" && x === 8 },
    { id: "neg", label: "اختر عددًا بين 0 و 1. لماذا اللوغاريتم سالب؟", met: L < 0 },
    { id: "one", label: "ما قيمة $\\log_b 1$ لأي أساس؟", met: x === 1 },
    { id: "l1000", label: "اللوغاريتم العشري: $\\log 1000$ (الأساس 10).", met: base === "10" && x === 1000 },
    { id: "half", label: "جرّب الأساس $\\tfrac12$: ماذا يحدث لاتجاه المنحنى؟", met: base === "0.5" },
  ]);

  // Ladder of powers b^n spanning the chips.
  const nMin = Math.round(logBase(b, b > 1 ? chips[0] : chips[chips.length - 1]));
  const nMax = Math.round(logBase(b, b > 1 ? chips[chips.length - 1] : chips[0]));
  const powers = Array.from({ length: nMax - nMin + 1 }, (_, i) => nMin + i);
  const W = 560;
  const pos = (v: number) => 30 + ((Math.log(v) - lo) / (hi - lo)) * (W - 60);

  return (
    <SimCard
      id="log"
      title="آلة اللوغاريتم: السؤال المعكوس"
      intro="الدالة الأسية تسأل: $2^3 = ?$ . اللوغاريتم يسأل السؤال المعكوس: 2 أُس كم يساوي 8؟ والجواب $\log_2 8 = 3$. أي أن $\log_b x = y \iff b^y = x$. اختر الأساس والعدد."
      stage={
        <div className="space-y-3 p-3">
          <svg viewBox={`0 0 ${W} 110`} className="block w-full" role="img" aria-label={`log ${base} of ${x} = ${num(L, 3)}`}>
            <line x1={20} x2={W - 20} y1={60} y2={60} stroke="var(--text-secondary)" strokeWidth={2} />
            {powers.map((n) => {
              const v = b ** n;
              return (
                <g key={n}>
                  <line x1={pos(v)} x2={pos(v)} y1={52} y2={68} stroke="var(--text-muted)" strokeWidth={1.5} />
                  <text x={pos(v)} y={86} textAnchor="middle" fontSize={12} fill="var(--text-secondary)" fontFamily="var(--font-latin)">
                    {Number.isInteger(v) ? v : `1/${Math.round(1 / v)}`}
                  </text>
                  <text x={pos(v)} y={104} textAnchor="middle" fontSize={11} fill="var(--brand-primary)" fontFamily="var(--font-latin)">
                    {base === "0.5" ? "½" : base}
                    <tspan dy={-6} fontSize={9}>
                      {n}
                    </tspan>
                  </text>
                </g>
              );
            })}
            <circle cx={pos(x)} cy={60} r={9} fill="var(--brand-insight)" stroke="white" strokeWidth={2} />
            <text x={pos(x)} y={38} textAnchor="middle" fontSize={15} fontWeight={800} fill="var(--brand-insight-dark)" fontFamily="var(--font-latin)">
              {`x = ${num(x, 3)}`}
            </text>
            <text x={pos(x)} y={20} textAnchor="middle" fontSize={13} fill="var(--foreground)">
              {`الأس = ${num(L, 3)}`}
            </text>
          </svg>
          <SimPlot label="الدالة الأسية واللوغاريتمية: كل منهما انعكاس للأخرى حول y = x" x={[-4, 8]} y={[-4, 8]} xStep={1} yStep={1} xLabel="x" yLabel="y" height={320}>
            <Line.ThroughPoints point1={[0, 0]} point2={[1, 1]} color="var(--mafs-fg)" style="dashed" opacity={0.35} />
            <Plot.OfX y={(t) => b ** t} color="var(--mafs-blue)" weight={3} />
            <Plot.OfX y={(t) => logBase(b, t)} color="var(--mafs-orange)" weight={3} domain={[0.0005, 8]} />
            {Number.isFinite(L) && Math.abs(L) <= 8 && x <= 8 && (
              <>
                <Line.Segment point1={[L, x]} point2={[x, L]} color="var(--mafs-violet)" style="dashed" />
                <Point x={L} y={x} color="var(--mafs-blue)" />
                <Point x={x} y={L} color="var(--mafs-orange)" />
              </>
            )}
            <Point x={0} y={1} color="var(--mafs-blue)" opacity={0.5} />
            <Point x={1} y={0} color="var(--mafs-orange)" opacity={0.5} />
          </SimPlot>
        </div>
      }
      readouts={[
        { label: "الصورة اللوغاريتمية", tex: `\\log_{${baseTex(base)}} ${fmt(x)} ${whole ? "=" : "\\approx"} ${num(L, 3)}`, tone: "good" },
        { label: "الصورة الأسية", tex: `${base === "0.5" ? "(\\tfrac12)" : base}^{${num(L, 3)}} ${whole ? "=" : "\\approx"} ${fmt(x)}` },
        { label: "المجال / المدى", tex: "x > 0,\\ y \\in \\mathbb{R}" },
        { label: "خط التقارب الرأسي", tex: "x = 0" },
        { label: "المقطع x", tex: "(1,\\ 0)" },
        { label: b > 1 ? "الدالة متزايدة" : "الدالة متناقصة", tex: `\\log_{${baseTex(base)}} ${base === "0.5" ? "\\tfrac12" : base} = 1` },
      ]}
      below={
        <p className="rounded-[12px] border-2 border-primary/30 bg-primary-soft px-3 py-2 text-[15px] leading-7 text-ink">
          النقطة الزرقاء <Tex>{`(${num(L, 2)},\\ ${num(x, 2)})`}</Tex> على <Tex>{`y = ${baseTex(base)}^x`}</Tex> والبرتقالية <Tex>{`(${num(x, 2)},\\ ${num(L, 2)})`}</Tex> على <Tex>{`y = \\log_{${baseTex(base)}} x`}</Tex>: تبادل <Tex>{"x"}</Tex> و <Tex>{"y"}</Tex>. لذلك المقطع <Tex>{"(0, 1)"}</Tex> يصبح <Tex>{"(1, 0)"}</Tex>، وخط التقارب الأفقي <Tex>{"y = 0"}</Tex> يصبح رأسيًا <Tex>{"x = 0"}</Tex>.
        </p>
      }
      controls={
        <>
          <Choice<Base>
            label="الأساس b"
            value={base}
            onChange={(v) => {
              setBase(v);
              setS(Math.log(v === "10" ? 100 : v === "3" ? 9 : 4));
            }}
            options={[
              { value: "2", label: "2" },
              { value: "3", label: "3" },
              { value: "10", label: "10" },
              { value: "0.5", label: "½" },
            ]}
          />
          <div className="rounded-[14px] border-2 border-border bg-surface p-3">
            <p className="mb-1 text-sm font-semibold text-ink-2">
              العدد <span className="ltr font-latin">x = {num(x, 3)}</span>
            </p>
            <Slider min={lo} max={hi} step={(hi - lo) / 400} value={[s]} onValueChange={([v]) => setS(v)} aria-label="العدد x" />
            <div className="mt-2 flex flex-wrap gap-1.5" dir="ltr">
              {chips.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setS(Math.log(c))}
                  className={cn("rounded-full border-2 px-2.5 py-0.5 text-sm transition-colors", Math.abs(x - c) < 1e-3 * c ? "border-primary bg-primary text-white" : "border-line-strong bg-card text-ink-2 hover:border-primary")}
                >
                  <Tex>{fmt(c)}</Tex>
                </button>
              ))}
            </div>
          </div>
        </>
      }
      observations={obs}
    />
  );
}
