"use client";
import { useEffect, useRef, useState } from "react";
import { Line, Plot, Point, Text } from "mafs";
import { heatingCurvePoints, heatingState, WATER, type Phase } from "@/lib/physics/phenomena";
import { rng } from "@/lib/workbench/algebra";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { param, SimFrame, Slider, useObservations } from "./SimFrame";
import { SimPlot } from "./SimPlot";
import { useAnimationFrame } from "./useAnimationFrame";

const M = 0.5;
const N = 48;
const W = 560;
const H = 300;
const BEAKER = { x: 150, y: 60, w: 200, h: 200 };
/** Simulation runs this many times faster than real heating. */
const SPEED = 30;

const PHASE_LABEL: Record<Phase, string> = { ice: "تلج بيسخن", melting: "انصهار (الحرارة ثابتة!)", water: "مية بتسخن", boiling: "غليان (الحرارة ثابتة!)", steam: "بخار بيسخن" };

interface Mol {
  hx: number;
  hy: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function PhaseSim() {
  const [P, setP] = useState(2000);
  const [Q, setQ] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [, setFrame] = useState(0);
  const reduced = usePrefersReducedMotion();
  const mols = useRef<Mol[]>([]);
  const curve = heatingCurvePoints(M);
  const qMax = curve[curve.length - 1][0];

  useEffect(() => {
    const rand = rng(9);
    mols.current = Array.from({ length: N }, (_, i) => {
      const c = i % 8;
      const r = Math.floor(i / 8);
      const hx = BEAKER.x + 30 + c * 20;
      const hy = BEAKER.y + BEAKER.h - 20 - r * 18;
      return { hx, hy, x: hx, y: hy, vx: rand() - 0.5, vy: rand() - 0.5 };
    });
  }, []);

  const s = heatingState(M, Q);
  useAnimationFrame(
    (dt) => {
      setQ((q) => {
        const next = Math.min(qMax, q + P * dt * SPEED);
        if (next >= qMax) setPlaying(false);
        return next;
      });
      const st = heatingState(M, Q);
      const speed = 20 + Math.sqrt(st.T + 273) * 4;
      mols.current.forEach((m, i) => {
        const frac = i / N;
        const gas = frac < st.boiled;
        const bound = !gas && frac >= st.melted;
        if (bound) {
          const amp = 1 + (st.T + 20) / 8;
          m.x = m.hx + amp * Math.sin(performance.now() / 70 + i);
          m.y = m.hy + amp * Math.cos(performance.now() / 60 + i * 1.3);
          return;
        }
        const v = gas ? speed * 3 : speed;
        m.vx += (Math.random() - 0.5) * 2;
        m.vy += (Math.random() - 0.5) * 2;
        const norm = Math.hypot(m.vx, m.vy) || 1;
        m.x += (m.vx / norm) * v * dt;
        m.y += (m.vy / norm) * v * dt;
        const top = gas ? 10 : BEAKER.y + BEAKER.h * 0.35;
        if (m.x < BEAKER.x + 8 || m.x > BEAKER.x + BEAKER.w - 8) m.vx *= -1;
        if (m.y < top || m.y > BEAKER.y + BEAKER.h - 8) m.vy *= -1;
        m.x = Math.min(BEAKER.x + BEAKER.w - 8, Math.max(BEAKER.x + 8, m.x));
        m.y = Math.min(BEAKER.y + BEAKER.h - 8, Math.max(top, m.y));
      });
      setFrame((f) => f + 1);
    },
    playing && !reduced,
  );

  const obs = useObservations([
    { id: "melt", label: "وقف وهو بيسيح: الحرارة داخلة والترمومتر واقف عند $0^\\circ$", met: s.phase === "melting" && s.melted > 0.2 },
    { id: "boil", label: "وصل للغليان: هضبة تانية عند $100^\\circ$ أطول بكتير", met: s.phase === "boiling" && s.boiled > 0.2 },
    { id: "steam", label: "حوّل كله لبخار", met: s.phase === "steam" },
  ]);

  const xk = (q: number) => q / 1000;
  const interp = (x: number) => {
    const q = x * 1000;
    for (let i = 1; i < curve.length; i++) {
      const [q0, t0] = curve[i - 1];
      const [q1, t1] = curve[i];
      if (q <= q1) return q1 === q0 ? t1 : t0 + ((t1 - t0) * (q - q0)) / (q1 - q0);
    }
    return curve[curve.length - 1][1];
  };
  const thermoH = 160;
  const thermoFill = ((s.T + 20) / 150) * thermoH;

  return (
    <SimFrame
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onReset={() => {
        setPlaying(false);
        setQ(0);
      }}
      stage={
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="كاس فيه تلج بيتسخن، والجزيئات بتتحول من شبكة لسائل لبخار">
          <rect x={BEAKER.x} y={BEAKER.y} width={BEAKER.w} height={BEAKER.h} fill="#eef6ff" stroke="#475569" strokeWidth="3" rx="6" />
          {mols.current.map((m, i) => {
            const frac = i / N;
            const gas = frac < s.boiled;
            const bound = !gas && frac >= s.melted;
            return <circle key={i} cx={m.x} cy={m.y} r={gas ? 4 : 6} fill={bound ? "#7dd3fc" : gas ? "#cbd5e1" : "#3b82f6"} stroke={bound ? "#0369a1" : "none"} />;
          })}
          {/* Heater */}
          <rect x={BEAKER.x - 10} y={BEAKER.y + BEAKER.h + 8} width={BEAKER.w + 20} height="14" rx="4" fill={playing ? "#e5484d" : "#94a3b8"} />
          <text x={BEAKER.x + BEAKER.w / 2} y={BEAKER.y + BEAKER.h + 36} textAnchor="middle" fontSize="12" fill="#475569">
            سخّان {P} W
          </text>
          {/* Thermometer */}
          <g transform="translate(440,60)">
            <rect x="0" y="0" width="22" height={thermoH} rx="11" fill="#fff" stroke="#475569" strokeWidth="2" />
            <rect x="5" y={thermoH - thermoFill} width="12" height={Math.max(0, thermoFill)} rx="6" fill="#e5484d" />
            <circle cx="11" cy={thermoH + 12} r="16" fill="#e5484d" stroke="#475569" strokeWidth="2" />
            {[0, 100].map((t) => (
              <g key={t}>
                <line x1="22" x2="34" y1={thermoH - ((t + 20) / 150) * thermoH} y2={thermoH - ((t + 20) / 150) * thermoH} stroke="#475569" />
                <text x="38" y={thermoH - ((t + 20) / 150) * thermoH + 4} fontSize="11" fill="#475569">
                  {t}°
                </text>
              </g>
            ))}
          </g>
          <text x="20" y="30" fontSize="14" fontWeight="bold" fill="#334155">
            {PHASE_LABEL[s.phase]}
          </text>
        </svg>
      }
      controls={
        <>
          <Slider param={param("P", "قدرة السخّان", "P", 500, 3000, 100, "W", 2000)} value={P} onChange={setP} />
          <Slider param={param("Q", "الحرارة اللي دخلت", "Q", 0, Math.round(qMax / 1000), 1, "kJ", 0)} value={Math.round(Q / 1000)} onChange={(v) => setQ(v * 1000)} />
        </>
      }
      readouts={[
        { label: "درجة الحرارة", tex: `T = ${s.T.toFixed(1)}^\\circ\\mathrm{C}` },
        { label: "الحرارة اللي دخلت", tex: `Q = ${(Q / 1000).toFixed(0)}\\,\\mathrm{kJ}` },
        { label: "اللي ساح / اتبخر", tex: `${Math.round(s.melted * 100)}\\% \\;/\\; ${Math.round(s.boiled * 100)}\\%`, tone: s.phase === "melting" || s.phase === "boiling" ? "good" : "default" },
      ]}
      notice={
        s.phase === "melting"
          ? `الحرارة بتدخل بس $T$ ثابتة: الطاقة بتروح في كسر الروابط بين جزيئات التلج. محتاجين $mL_f = ${(M * WATER.Lf) / 1000}\\,\\mathrm{kJ}$.`
          : s.phase === "boiling"
            ? `الهضبة دي أطول ~7 مرات: $mL_v = ${(M * WATER.Lv) / 1000}\\,\\mathrm{kJ}$ عشان نفصل الجزيئات تمامًا عن بعض.`
            : "لما الحالة ثابتة، الحرارة بترفع درجة الحرارة: $Q = mc\\Delta T$. شغّل السخّان وراقب المنحنى."
      }
      plot={
        <SimPlot label="منحنى التسخين" x={[0, xk(qMax)]} y={[-30, 140]} xStep={250} yStep={20} xLabel="Q (kJ)" yLabel="T (°C)">
          <Plot.OfX y={interp} color="var(--mafs-blue)" />
          <Line.Segment point1={[xk(curve[1][0]), -5]} point2={[xk(curve[2][0]), -5]} color="var(--mafs-orange)" />
          <Text x={(xk(curve[1][0]) + xk(curve[2][0])) / 2} y={-14} size={11} color="var(--mafs-orange)">
            mL_f
          </Text>
          <Line.Segment point1={[xk(curve[3][0]), 112]} point2={[xk(curve[4][0]), 112]} color="var(--mafs-orange)" />
          <Text x={(xk(curve[3][0]) + xk(curve[4][0])) / 2} y={122} size={11} color="var(--mafs-orange)">
            mL_v
          </Text>
          <Point x={xk(Q)} y={s.T} color="var(--mafs-red)" />
        </SimPlot>
      }
      observations={obs}
      howItWorks={[
        "في التلج الجزيئات مربوطة في شبكة وبتهتز مكانها؛ الحرارة بتزوّد الاهتزاز فـ $T$ تزيد.",
        "عند $0^\\circ$ الطاقة الداخلة بتكسر روابط الشبكة بدل ما تسرّع الجزيئات ← $T$ ثابتة (هضبة).",
        "السائل بيسخن لحد $100^\\circ$، وبعدين الطاقة بتفصل الجزيئات تمامًا (غليان) ← هضبة أطول.",
        "الحرارة الكامنة: $Q = mL$ من غير $\\Delta T$.",
      ]}
    />
  );
}
