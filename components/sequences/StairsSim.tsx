"use client";
import { useRef, useState } from "react";
import { Pause, Play, RotateCcw, StepForward } from "lucide-react";
import { useObservations, Choice, param } from "@/components/phenomena/sims/SimFrame";
import { useAnimationFrame } from "@/components/phenomena/sims/useAnimationFrame";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { Button } from "@/components/ui/button";
import { Tex } from "@/components/ui/Tex";
import { explicitTerm, fmt, recursiveTerms, signed } from "@/lib/sequences";
import { SimCard } from "./SimCard";

const P = {
  a1: param("a1", "الحد الأول", "a₁", -10, 10, 1, "", 3),
  d: param("d", "الأساس (الفرق الثابت)", "d", -5, 5, 0.5, "", 2),
  count: param("count", "عدد الحدود", "N", 4, 12, 1, "", 8),
};

const W = 640;
const H = 300;
const PAD = { l: 44, r: 16, t: 34, b: 46 };
const num = (v: number) => String(+v.toFixed(2));

type View = "stairs" | "line";

/** Build the sequence one recursive step at a time: each new term is the previous one plus d. */
export function StairsSim() {
  const [a1, setA1] = useState(P.a1.default);
  const [d, setD] = useState(P.d.default);
  const [count, setCount] = useState(P.count.default);
  const [shown, setShown] = useState(1);
  const [view, setView] = useState<View>("stairs");
  const [playing, setPlaying] = useState(false);
  const clock = useRef(0);

  const terms = recursiveTerms(a1, d, count);
  const k = Math.min(shown, count);
  const next = () => setShown((s) => Math.min(count, s + 1));
  const togglePlay = () => {
    if (k >= count) {
      setShown(1);
      setPlaying(true);
    } else setPlaying((p) => !p);
  };

  useAnimationFrame((dt) => {
    clock.current += dt;
    if (clock.current < 0.75) return;
    clock.current = 0;
    if (k >= count) setPlaying(false);
    else next();
  }, playing);

  const obs = useObservations([
    { id: "eight", label: "اكشف الحدود حتى $a_8$ خطوة بخطوة.", met: k >= 8 },
    { id: "down", label: "اجعل المتتالية متناقصة (كل حد أصغر من الذي قبله).", met: d < 0 && k >= 3 },
    { id: "flat", label: "اجعل كل الحدود متساوية. ما قيمة $d$؟", met: d === 0 && k >= 3 },
    { id: "zero", label: "اصنع متتالية حدها الخامس $a_5 = 0$.", met: k >= 5 && terms[4] === 0 },
    { id: "half", label: "جرّب أساسًا كسريًا مثل $d = 1.5$.", met: !Number.isInteger(d) && k >= 3 },
  ]);

  const lo = Math.min(0, ...terms);
  const hi = Math.max(0, ...terms);
  const span = hi - lo || 1;

  const now = terms[k - 1];
  const step =
    k === 1
      ? `a_1 = ${fmt(a1)}`
      : `a_{${k}} = a_{${k - 1}} ${d < 0 ? "-" : "+"} ${fmt(Math.abs(d))} = ${fmt(terms[k - 2])} ${d < 0 ? "-" : "+"} ${fmt(Math.abs(d))} = ${fmt(now)}`;

  return (
    <SimCard
      id="stairs"
      title="سلّم المتتالية: ابنِ الحدود بالصيغة الارتدادية"
      intro="كل حد جديد = الحد الذي قبله + $d$. اضغط «الحد التالي» وشاهد القفزة نفسها تتكرر، ثم غيّر $a_1$ و $d$."
      actions={
        <>
          <Button size="sm" onClick={next} disabled={k >= count} data-next>
            <StepForward className="-scale-x-100" /> الحد التالي
          </Button>
          <Button size="sm" variant="outline" onClick={togglePlay} aria-label={playing ? "إيقاف" : "تشغيل تلقائي"}>
            {playing ? <Pause /> : <Play />} {playing ? "إيقاف" : "تشغيل"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShown(1);
              setPlaying(false);
            }}
          >
            <RotateCcw /> من الأول
          </Button>
        </>
      }
      stage={
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label={`الحدود: ${terms.slice(0, k).map(num).join(", ")}`}>
          {view === "stairs" ? <Stairs terms={terms} k={k} d={d} lo={lo} span={span} /> : <NumberLine terms={terms} k={k} d={d} lo={lo} span={span} />}
        </svg>
      }
      readouts={[
        { label: "الحد الأول", tex: `a_1 = ${fmt(a1)}` },
        { label: "الأساس", tex: `d = ${fmt(d)}` },
        { label: "آخر خطوة (ارتدادية)", tex: step, tone: "good" },
        { label: "تحقق بالحد العام", tex: `a_1 + (${k}-1)d = ${fmt(explicitTerm(a1, d, k))}` },
        { label: `نوع المتتالية: ${d > 0 ? "متزايدة" : d < 0 ? "متناقصة" : "ثابتة"}`, tex: d > 0 ? "d > 0\\ \\nearrow" : d < 0 ? "d < 0\\ \\searrow" : "d = 0\\ \\rightarrow" },
        { label: "الحدود حتى الآن", tex: terms.slice(0, k).map(fmt).join(",\\ ") + (k < count ? ",\\ \\dots" : "") },
      ]}
      below={
        <div className="relative overflow-x-auto rounded-[14px] border-2 border-primary/30 bg-primary-soft px-4 py-3 text-center text-xl" dir="ltr">
          <Tex>{`\\begin{cases} a_1 = ${fmt(a1)} \\\\ a_n = a_{n-1} ${d === 0 ? "+ 0" : signed(d)}, \\quad n \\ge 2 \\end{cases}`}</Tex>
        </div>
      }
      controls={
        <>
          <VariableSlider param={P.a1} value={a1} onChange={setA1} />
          <VariableSlider param={P.d} value={d} onChange={setD} />
          <VariableSlider param={P.count} value={count} onChange={setCount} />
          <Choice<View>
            label="طريقة العرض"
            value={view}
            onChange={setView}
            options={[
              { value: "stairs", label: "أعمدة (سلّم)" },
              { value: "line", label: "خط الأعداد" },
            ]}
          />
        </>
      }
      observations={obs}
    />
  );
}

interface StageProps {
  terms: number[];
  k: number;
  d: number;
  lo: number;
  span: number;
}

function Stairs({ terms, k, d, lo, span }: StageProps) {
  const n = terms.length;
  const slot = (W - PAD.l - PAD.r) / n;
  const bw = Math.min(40, slot * 0.6);
  const y = (v: number) => PAD.t + (1 - (v - lo) / span) * (H - PAD.t - PAD.b);
  const cx = (i: number) => PAD.l + slot * (i + 0.5);
  const y0 = y(0);
  return (
    <g fontFamily="var(--font-latin)">
      <line x1={PAD.l - 8} x2={W - PAD.r} y1={y0} y2={y0} stroke="var(--text-muted)" strokeWidth={1.5} />
      <text x={PAD.l - 12} y={y0 + 4} textAnchor="end" fontSize={12} fill="var(--text-muted)">
        0
      </text>
      {terms.map((t, i) => {
        const on = i < k;
        const top = Math.min(y(t), y0);
        const h = Math.max(2, Math.abs(y(t) - y0));
        const current = i === k - 1;
        return (
          <g key={i} style={{ transition: "opacity 300ms" }}>
            <rect
              x={cx(i) - bw / 2}
              y={top}
              width={bw}
              height={h}
              rx={5}
              fill={on ? (current ? "var(--brand-primary)" : "var(--brand-discovery)") : "none"}
              fillOpacity={on ? (current ? 1 : 0.75) : 0}
              stroke={on ? "none" : "var(--border-strong)"}
              strokeDasharray="5 4"
              strokeWidth={2}
            />
            <text x={cx(i)} y={H - 26} textAnchor="middle" fontSize={13} fill="var(--text-secondary)">
              a{i + 1}
            </text>
            <text x={cx(i)} y={t >= 0 ? top - 6 : top + h + 15} textAnchor="middle" fontSize={14} fontWeight={700} fill={on ? "var(--foreground)" : "var(--text-muted)"}>
              {on ? num(t) : "?"}
            </text>
            {on && i > 0 && (
              <g>
                <path
                  d={`M ${cx(i - 1) + bw / 2} ${y(terms[i - 1])} Q ${(cx(i - 1) + cx(i)) / 2} ${Math.min(y(terms[i - 1]), y(t)) - 22} ${cx(i) - bw / 2} ${y(t)}`}
                  fill="none"
                  stroke={current ? "var(--brand-insight-dark)" : "var(--brand-insight)"}
                  strokeWidth={current ? 2.5 : 1.5}
                  markerEnd="url(#seq-arrow)"
                />
                {(current || n <= 8) && (
                  <text x={(cx(i - 1) + cx(i)) / 2} y={Math.min(y(terms[i - 1]), y(t)) - 24} textAnchor="middle" fontSize={12} fontWeight={700} fill="var(--brand-insight-dark)">
                    {d < 0 ? "−" : "+"}
                    {num(Math.abs(d))}
                  </text>
                )}
              </g>
            )}
          </g>
        );
      })}
      <text x={W / 2} y={H - 6} textAnchor="middle" fontSize={12} fill="var(--text-muted)">
        n →
      </text>
      <ArrowDef />
    </g>
  );
}

function NumberLine({ terms, k, d, lo, span }: StageProps) {
  const hi = lo + span;
  const pad = span * 0.06;
  const x = (v: number) => PAD.l + ((v - (lo - pad)) / (span + 2 * pad)) * (W - PAD.l - PAD.r);
  const base = 190;
  const tickStep = niceStep(span);
  const ticks: number[] = [];
  for (let v = Math.ceil((lo - pad) / tickStep) * tickStep; v <= hi + pad; v += tickStep) ticks.push(+v.toFixed(6));
  return (
    <g fontFamily="var(--font-latin)">
      <line x1={PAD.l - 10} x2={W - PAD.r + 4} y1={base} y2={base} stroke="var(--text-secondary)" strokeWidth={2} />
      {ticks.map((t) => (
        <g key={t}>
          <line x1={x(t)} x2={x(t)} y1={base - 5} y2={base + 5} stroke="var(--text-muted)" />
          <text x={x(t)} y={base + 22} textAnchor="middle" fontSize={12} fill="var(--text-muted)">
            {num(t)}
          </text>
        </g>
      ))}
      {terms.slice(0, k).map((t, i) => {
        const current = i === k - 1;
        const prev = terms[i - 1];
        const lift = 30 + Math.min(70, Math.abs(x(t) - x(prev ?? t)) * 0.35);
        return (
          <g key={i}>
            {i > 0 && prev !== t && (
              <>
                <path
                  d={`M ${x(prev)} ${base - 8} Q ${(x(prev) + x(t)) / 2} ${base - lift - 8} ${x(t)} ${base - 8}`}
                  fill="none"
                  stroke={current ? "var(--brand-insight-dark)" : "var(--brand-insight)"}
                  strokeWidth={current ? 2.5 : 1.5}
                  markerEnd="url(#seq-arrow)"
                />
                {current && (
                  <text x={(x(prev) + x(t)) / 2} y={base - lift / 2 - 18} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--brand-insight-dark)">
                    {d < 0 ? "−" : "+"}
                    {num(Math.abs(d))}
                  </text>
                )}
              </>
            )}
            <circle cx={x(t)} cy={base} r={current ? 9 : 7} fill={current ? "var(--brand-primary)" : "var(--brand-discovery)"} stroke="white" strokeWidth={2} />
            <text x={x(t)} y={base + 42 + (i % 2) * 16} textAnchor="middle" fontSize={12} fontWeight={current ? 700 : 400} fill={current ? "var(--brand-primary)" : "var(--text-secondary)"}>
              a{i + 1}
            </text>
          </g>
        );
      })}
      {d === 0 && k > 1 && (
        <text x={x(terms[0])} y={base - 24} textAnchor="middle" fontSize={13} fontWeight={700} fill="var(--brand-insight-dark)">
          d = 0: كل الحدود في نفس المكان
        </text>
      )}
      <ArrowDef />
    </g>
  );
}

function ArrowDef() {
  return (
    <defs>
      <marker id="seq-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
        <path d="M 0 0 L 10 5 L 0 10 z" fill="var(--brand-insight-dark)" />
      </marker>
    </defs>
  );
}

function niceStep(span: number): number {
  const raw = span / 8;
  const e = 10 ** Math.floor(Math.log10(raw || 1));
  for (const m of [1, 2, 5, 10]) if (raw <= m * e) return m * e;
  return 10 * e;
}
