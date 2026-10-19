"use client";
import { useEffect, useRef, useState } from "react";
import { Plot, Point } from "mafs";
import { entropyOfHeatFlow, equilibrate } from "@/lib/physics/phenomena";
import { rng } from "@/lib/workbench/algebra";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { Button } from "@/components/ui/button";
import { param, SimFrame, Slider, useObservations } from "./SimFrame";
import { SimPlot } from "./SimPlot";
import { useAnimationFrame } from "./useAnimationFrame";

const W = 560;
const H = 280;
const N = 60;
const R = 6;
const C = 50; // J/K per side (model)
const K = 8; // W/K through the gap (model)
const DT = 0.25;
const STEPS = 240;

interface Mol {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

function speedColor(v: number) {
  const t = Math.max(0, Math.min(1, (v - 40) / 160));
  return `rgb(${Math.round(60 + 195 * t)}, ${Math.round(110 - 40 * t)}, ${Math.round(235 - 190 * t)})`;
}

export function EntropySim() {
  const [tHot, setTHot] = useState(400);
  const [tCold, setTCold] = useState(300);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState(0);
  const [rewinding, setRewinding] = useState(false);
  const [rewound, setRewound] = useState(false);
  const [, setFrame] = useState(0);
  const reduced = usePrefersReducedMotion();
  const mols = useRef<Mol[]>([]);
  const film = useRef<Float32Array[]>([]);
  const canvas = useRef<HTMLCanvasElement>(null);

  const reset = () => {
    const rand = rng(21);
    mols.current = Array.from({ length: N }, (_, i) => {
      const hot = i < N / 2;
      const sp = (hot ? Math.sqrt(tHot) : Math.sqrt(tCold)) * 7;
      const a = rand() * Math.PI * 2;
      return { x: hot ? 20 + rand() * (W / 2 - 40) : W / 2 + 20 + rand() * (W / 2 - 40), y: 20 + rand() * (H - 40), vx: sp * Math.cos(a), vy: sp * Math.sin(a) };
    });
    film.current = [];
    setOpen(false);
    setStep(0);
    setRewinding(false);
  };
  useEffect(reset, [tHot, tCold]);

  const history = equilibrate(tHot, tCold, C, K, DT, STEPS);
  const now = history[Math.min(step, STEPS)];

  const draw = (snap?: Float32Array) => {
    const c = canvas.current;
    const ctx = c?.getContext("2d");
    if (!c || !ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, W, H);
    if (!open) {
      ctx.fillStyle = "#334155";
      ctx.fillRect(W / 2 - 3, 0, 6, H);
    }
    for (let i = 0; i < N; i++) {
      const m = mols.current[i];
      const x = snap ? snap[i * 3] : m.x;
      const y = snap ? snap[i * 3 + 1] : m.y;
      const v = snap ? snap[i * 3 + 2] : Math.hypot(m.vx, m.vy);
      ctx.beginPath();
      ctx.arc(x, y, R, 0, Math.PI * 2);
      ctx.fillStyle = speedColor(v);
      ctx.fill();
    }
    if (rewinding) {
      ctx.fillStyle = "rgba(15,23,42,0.75)";
      ctx.font = "bold 15px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("◀◀ الفيلم بيترجع لورا", W / 2, 24);
    }
  };

  useAnimationFrame(
    (dt) => {
      if (rewinding) {
        const snap = film.current.pop();
        if (!snap) {
          setRewinding(false);
          setRewound(true);
          return;
        }
        draw(snap);
        setStep((s) => Math.max(0, s - 1));
        return;
      }
      const ms = mols.current;
      for (const m of ms) {
        m.x += m.vx * dt;
        m.y += m.vy * dt;
        const left = !open && m.x < W / 2 ? 0 : !open ? W / 2 + 3 : 0;
        const right = !open && m.x < W / 2 ? W / 2 - 3 : W;
        if (m.x < left + R) {
          m.x = left + R;
          m.vx = Math.abs(m.vx);
        }
        if (m.x > right - R) {
          m.x = right - R;
          m.vx = -Math.abs(m.vx);
        }
        if (m.y < R) {
          m.y = R;
          m.vy = Math.abs(m.vy);
        }
        if (m.y > H - R) {
          m.y = H - R;
          m.vy = -Math.abs(m.vy);
        }
      }
      // Elastic collisions between equal masses: swap the velocity components along the line of centres.
      for (let i = 0; i < N; i++)
        for (let j = i + 1; j < N; j++) {
          const a = ms[i];
          const b = ms[j];
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const d2 = dx * dx + dy * dy;
          if (d2 > 4 * R * R || d2 === 0) continue;
          const d = Math.sqrt(d2);
          const nx = dx / d;
          const ny = dy / d;
          const rel = (a.vx - b.vx) * nx + (a.vy - b.vy) * ny;
          if (rel <= 0) continue;
          a.vx -= rel * nx;
          a.vy -= rel * ny;
          b.vx += rel * nx;
          b.vy += rel * ny;
        }
      if (open) {
        const snap = new Float32Array(N * 3);
        ms.forEach((m, i) => {
          snap[i * 3] = m.x;
          snap[i * 3 + 1] = m.y;
          snap[i * 3 + 2] = Math.hypot(m.vx, m.vy);
        });
        film.current.push(snap);
        if (film.current.length > 900) film.current.shift();
        setStep((s) => Math.min(STEPS, s + 1));
      }
      draw();
      setFrame((f) => f + 1);
    },
    !reduced,
  );
  useEffect(() => {
    if (reduced) draw();
  });

  // Measured "temperatures" of each half from the molecules' kinetic energy (relative units).
  const halves = [0, 1].map((side) => {
    const list = mols.current.filter((m) => (side === 0 ? m.x < W / 2 : m.x >= W / 2));
    return list.length ? list.reduce((s, m) => s + m.vx * m.vx + m.vy * m.vy, 0) / list.length : 0;
  });

  const obs = useObservations([
    { id: "open", label: "شيل الحاجز وسيب الجزيئات تختلط", met: open && step > 60 },
    { id: "equal", label: "استنى لحد ما الناحيتين يبقوا نفس الحرارة", met: now.hot - now.cold < 5 },
    { id: "rewind", label: "رجّع الفيلم لورا: عمرك شفت ده بيحصل لوحده؟", met: rewound },
  ]);

  return (
    <SimFrame
      onReset={reset}
      stage={<canvas ref={canvas} width={W} height={H} className="block h-auto w-full" role="img" aria-label="صندوق فيه جزيئات سخنة وباردة بتختلط" />}
      controls={
        <>
          <Slider param={param("th", "حرارة الناحية السخنة", "T_h", 320, 600, 10, "K", 400)} value={tHot} onChange={setTHot} />
          <Slider param={param("tc", "حرارة الناحية الباردة", "T_c", 200, 310, 10, "K", 300)} value={tCold} onChange={setTCold} />
          <div className="flex flex-wrap gap-2">
            <Button size="sm" onClick={() => setOpen(true)} disabled={open} data-open-wall>
              شيل الحاجز
            </Button>
            <Button size="sm" variant="outline" onClick={() => setRewinding(true)} disabled={!open || rewinding || film.current.length < 20} data-rewind>
              ◀◀ رجّع الفيلم
            </Button>
          </div>
        </>
      }
      readouts={[
        { label: "الناحية السخنة (نموذج)", tex: `T_h = ${now.hot.toFixed(0)}\\,\\mathrm{K}` },
        { label: "الناحية الباردة (نموذج)", tex: `T_c = ${now.cold.toFixed(0)}\\,\\mathrm{K}` },
        { label: "الإنتروبيا الكلية", tex: `\\Delta S = +${now.S.toFixed(2)}\\,\\mathrm{J/K}`, tone: now.S > 0 ? "good" : "default" },
        { label: "طاقة الجزيئات (شمال : يمين)", tex: `${(halves[0] / Math.max(1, halves[1])).toFixed(2)} : 1` },
        { label: "لأول 1000 J", tex: `\\Delta S = ${entropyOfHeatFlow(1000, tHot, tCold).toFixed(3)}\\,\\mathrm{J/K}` },
      ]}
      notice={
        rewinding
          ? "الفيلم بالعكس: الجزيئات «بتفصل نفسها» لسخنة وباردة. قوانين التصادم مابتمنعش ده — بس احتماله تقريبًا صفر. ده القانون التاني."
          : open
            ? "التصادمات بتوزّع الطاقة: السريعة (أحمر) بتبطّأ والبطيئة (أزرق) بتسرع. الحرارة بتنتقل من السخن للبارد، و$\\Delta S$ دايمًا بيزيد."
            : "الجزيئات الحمرا سريعة (سخنة) والزرقا بطيئة (باردة). شيل الحاجز وشوف هيحصل إيه."
      }
      plot={
        <SimPlot label="الإنتروبيا الكلية مع الزمن" x={[0, STEPS * DT]} y={[0, Math.max(0.02, history[STEPS].S * 1.15)]} xStep={10} yStep={Math.max(0.01, +(history[STEPS].S / 4).toPrecision(1))} xLabel="t (s)" yLabel="ΔS (J/K)">
          <Plot.OfX y={(t) => history[Math.min(STEPS, Math.max(0, Math.round(t / DT)))].S} color="var(--mafs-green)" />
          <Point x={step * DT} y={now.S} color="var(--mafs-red)" />
        </SimPlot>
      }
      observations={obs}
      howItWorks={[
        "الحرارة = حركة عشوائية للجزيئات؛ السخن جزيئاته أسرع في المتوسط.",
        "في كل تصادم الطاقة بتتوزع، فالسريع غالبًا بيبطّأ والبطيء بيسرع.",
        "الحالات «المخلوطة» أكتر بكتير جدًا من «المتفصلة»، فالنظام بيروح ليها: الإنتروبيا بتزيد.",
        "كل جول بيخرج من السخن بيقلّل $S$ بـ $\\frac{1}{T_h}$ ويزوّدها في البارد بـ $\\frac{1}{T_c}$ أكبر ← $\\Delta S > 0$.",
      ]}
    />
  );
}
