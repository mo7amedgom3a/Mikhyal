"use client";
import { useMemo, useState } from "react";
import { Plot, Point } from "mafs";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useObservations, param } from "@/components/phenomena/sims/SimFrame";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";
import { useAnimationFrame } from "@/components/phenomena/sims/useAnimationFrame";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { Button } from "@/components/ui/button";
import { Tex } from "@/components/ui/Tex";
import { num, sciTex } from "@/lib/exponential";
import { SimCard } from "@/components/sequences/SimCard";

const P = {
  n0: param("n0", "عدد البكتيريا في البداية", "N₀", 1, 20, 1, "", 3),
  T: param("T", "زمن التضاعف", "T", 10, 60, 2, "min", 20),
  t: param("t", "الزمن", "t", 0, 6, 0.05, "h", 0),
};
const MAX_DOTS = 700;
const R = 130;
const GOLDEN = Math.PI * (3 - Math.sqrt(5));
const MILLION = 1e6;

/** Dots fill a petri dish on a sunflower spiral, so each new generation lands between the old ones. */
const DOTS = Array.from({ length: MAX_DOTS }, (_, i) => {
  const r = R * 0.94 * Math.sqrt((i + 0.5) / MAX_DOTS);
  return { x: 150 + r * Math.cos(i * GOLDEN), y: 150 + r * Math.sin(i * GOLDEN), hue: (i * 37) % 3 };
});
const HUES = ["var(--brand-discovery)", "var(--brand-discovery-dark)", "var(--brand-insight)"];

/** Bacteria multiply by binary fission: the count doubles every T minutes, N(t) = N₀·2^(t/T). */
export function BacteriaSim() {
  const [n0, setN0] = useState(P.n0.default);
  const [T, setT] = useState(P.T.default);
  const [t, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [logScale, setLogScale] = useState(false);

  const N = (h: number) => n0 * 2 ** ((h * 60) / T);
  const now = N(t);
  const perHour = 2 ** (60 / T);
  const dotValue = Math.max(1, Math.ceil(now / MAX_DOTS));
  const dots = Math.min(MAX_DOTS, Math.round(now / dotValue));
  const toMillion = (T / 60) * Math.log2(MILLION / n0);

  useAnimationFrame((dt) => {
    const next = Math.min(P.t.max, t + dt * 0.4);
    setTime(next);
    if (next >= P.t.max) setPlaying(false);
  }, playing);

  const obs = useObservations([
    { id: "million", label: "شغّل الزمن حتى يتجاوز العدد مليون خلية.", met: now >= MILLION },
    { id: "book", label: "جرّب زمن تضاعف بين 12 و 24 دقيقة كما في الكتاب.", met: T >= 12 && T <= 24 && t > 1 },
    { id: "log", label: "بدّل الرسم إلى المقياس اللوغاريتمي. ماذا يصبح شكل المنحنى؟", met: logScale },
    { id: "double", label: "ضاعف العدد الابتدائي. هل يتغير زمن الوصول للمليون كثيرًا؟", met: n0 >= 6 && t > 0.5 },
  ]);

  const yMax = useMemo(() => N(P.t.max), [n0, T]); // eslint-disable-line react-hooks/exhaustive-deps
  const logMax = Math.ceil(Math.log10(yMax));

  return (
    <SimCard
      id="bacteria"
      title="تكاثر البكتيريا في طبق بتري"
      intro="تتكاثر البكتيريا بالانشطار الثنائي: كل خلية تصبح خليتين، فيتضاعف العدد كل فترة ثابتة $T$. لذلك $N(t) = N_0 \cdot 2^{t/T}$. شغّل الزمن وراقب كيف ينفجر العدد."
      actions={
        <>
          <Button size="sm" onClick={() => (t >= P.t.max ? (setTime(0), setPlaying(true)) : setPlaying((p) => !p))}>
            {playing ? <Pause /> : <Play />} {playing ? "إيقاف" : "شغّل الزمن"}
          </Button>
          <Button size="sm" variant="ghost" onClick={() => (setTime(0), setPlaying(false))}>
            <RotateCcw /> من البداية
          </Button>
        </>
      }
      stage={
        <div className="grid items-center gap-2 p-3 sm:grid-cols-[300px_1fr]">
          <svg viewBox="0 0 300 300" className="mx-auto block w-full max-w-[300px]" role="img" aria-label={`طبق بتري فيه حوالي ${Math.round(now)} خلية`}>
            <circle cx={150} cy={150} r={R + 10} fill="#eaf4ff" stroke="#9fb7d8" strokeWidth={6} />
            <circle cx={150} cy={150} r={R} fill="#f7fbff" stroke="#c8d8ee" strokeWidth={2} />
            {DOTS.slice(0, dots).map((d, i) => (
              <ellipse key={i} cx={d.x} cy={d.y} rx={dotValue > 1 ? 4.5 : 6} ry={dotValue > 1 ? 3 : 4} fill={HUES[d.hue]} opacity={0.85} transform={`rotate(${(i * 47) % 180} ${d.x} ${d.y})`} />
            ))}
            <text x={150} y={292} textAnchor="middle" fontSize={13} fill="var(--text-secondary)">
              {dotValue > 1 ? `كل نقطة ≈ ${dotValue.toLocaleString("en")} خلية` : "كل نقطة = خلية واحدة"}
            </text>
          </svg>
          <SimPlot
            label={logScale ? "مقياس لوغاريتمي: log N" : "عدد الخلايا N"}
            x={[0, 6.2]}
            y={logScale ? [0, logMax + 0.5] : [0, yMax * 1.05]}
            xStep={1}
            yStep={logScale ? 1 : yMax / 5}
            xLabel="t (h)"
            yLabel={logScale ? "N (10ⁿ)" : "N"}
            yFormat={logScale ? (v) => `10^${v}` : (v) => (v >= 1e6 ? `${+(v / 1e6).toPrecision(2)}M` : v >= 1e3 ? `${+(v / 1e3).toPrecision(2)}k` : String(+v.toPrecision(2)))}
            height={260}
          >
            <Plot.OfX y={(h) => (logScale ? Math.log10(N(h)) : N(h))} color="var(--mafs-green)" domain={[0, 6]} />
            <Point x={t} y={logScale ? Math.log10(now) : now} color="var(--mafs-blue)" />
          </SimPlot>
        </div>
      }
      readouts={[
        { label: "النموذج", tex: `N = ${n0}\\cdot 2^{t/${num(T / 60, 2)}}` },
        { label: "العدد الآن", tex: `N \\approx ${sciTex(Math.round(now))}`, tone: now >= MILLION ? "good" : "default" },
        { label: "عدد مرات التضاعف", tex: `${num((t * 60) / T, 1)}` },
        { label: "معامل النمو في الساعة", tex: `b = 2^{60/${T}} \\approx ${num(perHour, 2)}` },
        { label: "يصل للمليون بعد", tex: `t = ${num(T / 60, 2)}\\log_2\\tfrac{10^6}{${n0}} \\approx ${num(toMillion, 2)}\\,\\text{h}` },
        { label: "الزمن", tex: `t = ${num(t, 2)}\\,\\text{h}` },
      ]}
      below={
        logScale ? (
          <p className="rounded-[12px] border-2 border-mint/50 bg-mint-soft px-3 py-2 text-[15px] leading-7 text-ink">
            على المقياس اللوغاريتمي يصبح المنحنى <b>خطًا مستقيمًا</b>: <Tex>{`\\log N = \\log ${n0} + \\tfrac{t}{T}\\log 2`}</Tex>. اللوغاريتم «يُقوّم» النمو الأسي، لذلك يستعمله العلماء لرسم أعداد البكتيريا.
          </p>
        ) : (
          <p className="rounded-[12px] border-2 border-primary/30 bg-primary-soft px-3 py-2 text-[15px] leading-7 text-ink">
            في البداية يبدو النمو بطيئًا، ثم ينفجر: في آخر فترة تضاعف وحدها يُضاف عدد يساوي كل ما تراكم قبلها!
          </p>
        )
      }
      controls={
        <>
          <VariableSlider param={P.n0} value={n0} onChange={setN0} />
          <VariableSlider param={P.T} value={T} onChange={setT} />
          <VariableSlider param={P.t} value={t} onChange={(v) => (setTime(v), setPlaying(false))} />
          <label className="flex items-center gap-2 rounded-[14px] border-2 border-border bg-surface p-3 text-sm font-semibold text-ink-2">
            <input type="checkbox" checked={logScale} onChange={(e) => setLogScale(e.target.checked)} className="size-4 accent-[var(--brand-primary)]" />
            مقياس لوغاريتمي للمحور الرأسي
          </label>
        </>
      }
      observations={obs}
    />
  );
}
