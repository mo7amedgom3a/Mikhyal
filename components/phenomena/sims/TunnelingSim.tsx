"use client";
import { useRef, useState } from "react";
import { Plot, Point, Polygon, Text } from "mafs";
import { CONST, tunnelProbability, tunnelTrials } from "@/lib/physics/phenomena";
import { rng } from "@/lib/workbench/algebra";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { param, sci, SimFrame, Slider, useObservations } from "./SimFrame";
import { SimPlot } from "./SimPlot";
import { useAnimationFrame } from "./useAnimationFrame";

/** Wave numbers in nm⁻¹ for an electron. */
const kOf = (eV: number) => Math.sqrt(2 * CONST.me * eV * CONST.e) / CONST.hbar / 1e9;

interface Ball {
  x: number;
  dir: 1 | -1;
  fate: boolean;
}

export function TunnelingSim() {
  const [E, setE] = useState(1);
  const [U, setU] = useState(5);
  const [L, setL] = useState(0.2);
  const [playing, setPlaying] = useState(true);
  const [time, setTime] = useState(0);
  const [stats, setStats] = useState({ n: 0, through: 0 });
  const [prevT, setPrevT] = useState<number | null>(null);
  const reduced = usePrefersReducedMotion();
  const balls = useRef<Ball[]>([]);
  const rand = useRef(rng(31));
  const spawn = useRef(0);

  const below = E < U;
  const T = below ? tunnelProbability(E, U, L * 1e-9) : 1;
  const k = kOf(E);
  const kappa = below ? kOf(U - E) : 0;
  const A = 0.7; // drawn amplitude (eV units)

  const resetStats = () => {
    setStats({ n: 0, through: 0 });
    balls.current = [];
  };
  const change = (f: (v: number) => void) => (v: number) => {
    setPrevT(T);
    f(v);
    resetStats();
  };

  useAnimationFrame(
    (dt) => {
      setTime((t) => t + dt);
      // Statistics: many attempts per frame converge on T.
      const attempts = 4000;
      setStats((s) => ({ n: s.n + attempts, through: s.through + tunnelTrials(attempts, T, rand.current) }));
      // A few visible particles, each with a fate drawn from the same probability.
      spawn.current += dt * 2.5;
      if (spawn.current >= 1) {
        spawn.current = 0;
        balls.current.push({ x: -1.5, dir: 1, fate: rand.current() < T });
      }
      balls.current = balls.current.filter((b) => {
        b.x += b.dir * dt * 1.4;
        if (b.dir === 1 && b.x >= 0 && b.x < 0.05 && !b.fate) b.dir = -1;
        return b.x > -1.6 && b.x < 2.6;
      });
    },
    playing && !reduced,
  );

  const psi = (x: number) => {
    const w = Math.cos(time * 4);
    if (x < 0) return E + A * Math.cos(k * x * 1) * w;
    if (x <= L) return E + A * (below ? Math.exp(-kappa * x) : Math.cos(k * x)) * w;
    const amp = below ? Math.exp(-kappa * L) : 1;
    return E + A * amp * Math.cos(k * (x - L)) * w;
  };

  const ratio = stats.n ? stats.through / stats.n : 0;
  const obs = useObservations([
    { id: "through", label: "إلكترون طاقته أقل من الحاجز وعدّى!", met: below && stats.through > 0 },
    { id: "double", label: "ضاعف عرض الحاجز: الاحتمال بيتربّع تقريبًا", met: prevT !== null && below && prevT < 0.5 && Math.abs(Math.log(T) / Math.log(prevT) - 2) < 0.35 },
    { id: "over", label: "خلّي $E > U$: الجسيم بيعدّي كلاسيكيًا", met: !below },
  ]);

  return (
    <SimFrame
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onReset={() => {
        setE(1);
        setU(5);
        setL(0.2);
        setPrevT(null);
        resetStats();
      }}
      stage={
        <div className="p-2">
          <SimPlot label="الحاجز ودالة الموجة" x={[-1.5, 2.5]} y={[-0.5, Math.max(U, E) + 1.5]} xStep={0.5} yStep={1} height={280} xLabel="x (nm)" yLabel="الطاقة (eV)">
            <Polygon points={[[0, 0], [L, 0], [L, U], [0, U]]} color="var(--mafs-violet)" fillOpacity={0.25} />
            <Text x={L / 2} y={U + 0.35} size={12} color="var(--mafs-violet)">
              U
            </Text>
            <Plot.OfX y={() => E} color="var(--mafs-orange)" style="dashed" opacity={0.7} />
            <Plot.OfX y={psi} color="var(--mafs-blue)" weight={2.5} />
            {balls.current.map((b, i) => (
              <Point key={i} x={b.x} y={E} color={b.x > L ? "var(--mafs-green)" : b.dir === -1 ? "var(--mafs-red)" : "var(--mafs-orange)"} />
            ))}
          </SimPlot>
        </div>
      }
      controls={
        <>
          <Slider param={param("E", "طاقة الإلكترون", "E", 0.2, 8, 0.1, "eV", 1)} value={E} onChange={change(setE)} />
          <Slider param={param("U", "ارتفاع الحاجز", "U", 1, 10, 0.5, "eV", 5)} value={U} onChange={change(setU)} />
          <Slider param={param("L", "عرض الحاجز", "L", 0.05, 1, 0.05, "nm", 0.2)} value={L} onChange={change(setL)} />
        </>
      }
      readouts={[
        { label: "احتمال النفق (النظرية)", tex: below ? `T \\approx e^{-2\\kappa L} = ${sci(T)}` : "T \\approx 1", tone: "good" },
        { label: "ثابت الاضمحلال", tex: below ? `\\kappa = ${kappa.toFixed(2)}\\,\\mathrm{nm^{-1}}` : "\\text{—}" },
        { label: "التجربة (عدّوا / حاولوا)", tex: `${sci(ratio)}\\;(${stats.through}/${stats.n})` },
      ]}
      notice={
        below
          ? `الموجة مابتقفش عند الحاجز: بتضمحل جواه زي $e^{-\\kappa x}$، والجزء اللي بيوصل للناحية التانية سعته $\\sqrt{T}$. الكور الخضرا بتعدّي رغم إن $E < U$ (لو $T$ صغير جدًا هتستنى كتير — بص على العدّاد).`
          : "طاقة الإلكترون أكبر من الحاجز، فبيعدّي عادي من غير نفق."
      }
      observations={obs}
      howItWorks={[
        "الإلكترون موصوف بدالة موجية، ومربعها هو احتمال وجوده.",
        "جوه الحاجز (لو $E < U$) الموجة مابتتذبذبش، بتضمحل أُسّيًا بمعدل $\\kappa = \\frac{\\sqrt{2m(U-E)}}{\\hbar}$.",
        "لو الحاجز رفيع، فاضل جزء من الموجة على الناحية التانية ← احتمال عبور $T \\approx e^{-2\\kappa L}$.",
        "عشان كده الاحتمال حساس جدًا للعرض: ده سر ميكروسكوب المسح النفقي وتحلل ألفا.",
      ]}
    />
  );
}
