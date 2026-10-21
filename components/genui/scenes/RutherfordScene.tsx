"use client";
import { useEffect, useRef, useState } from "react";
import { closestApproach, trajectory, type AtomModel } from "@/lib/physics/atomic";
import { rng } from "@/lib/workbench/algebra";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { useAnimationFrame } from "@/components/phenomena/sims/useAnimationFrame";

const W = 560;
const H = 340;
const CX = 300;
const CY = 170;
/** The beam is ±BEAM px wide around the nucleus; bMaxFm maps onto it. */
const BEAM = 150;
const BINS = 18;

interface Flight {
  pts: [number, number][];
  t: number;
  angle: number;
}

/**
 * α particles fired at one nucleus of the foil. Rutherford model: trajectories integrated in the
 * Coulomb field of a point nucleus (same scale as the beam). Thomson model: tiny random deflections.
 * Angles are binned into a live histogram.
 */
export function RutherfordScene({ Z = 79, energyMeV = 5, model = "rutherford", rate = 120, bMaxFm = 2000 }: { Z?: number; energyMeV?: number; model?: AtomModel | string; rate?: number; bMaxFm?: number }) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const flights = useRef<Flight[]>([]);
  const counts = useRef<number[]>(new Array(BINS).fill(0));
  const total = useRef(0);
  const acc = useRef(0);
  const rand = useRef(rng(19));
  const [, setTick] = useState(0);
  const reduced = usePrefersReducedMotion();

  const z = Number(Z);
  const k = Math.max(0.1, Number(energyMeV));
  const mdl = model === "thomson" ? "thomson" : "rutherford";
  // Closest approach in px: d (fm) scaled like the beam. Real d ≈ 45 fm vs 2000 fm beam is tiny,
  // so large deflections are rare — exactly as in the real experiment.
  const dPx = (closestApproach(z, k) / Number(bMaxFm)) * BEAM;

  useEffect(() => {
    flights.current = [];
    counts.current = new Array(BINS).fill(0);
    total.current = 0;
  }, [z, k, mdl]);

  const spawn = () => {
    const b = (rand.current() * 2 - 1) * BEAM;
    let pts: [number, number][];
    if (mdl === "rutherford") {
      pts = trajectory(b, dPx, -300).map(([x, y]) => [CX + x, CY - y]);
    } else {
      const defl = ((rand.current() + rand.current() + rand.current() - 1.5) * 1.4 * Math.PI) / 180;
      pts = [];
      for (let x = -300; x <= 300; x += 10) pts.push([CX + x, CY - (b + (x > 0 ? x * Math.tan(defl) : 0))]);
    }
    const [x1, y1] = pts[pts.length - 2];
    const [x2, y2] = pts[pts.length - 1];
    const angle = Math.abs((Math.atan2(-(y2 - y1), x2 - x1) * 180) / Math.PI);
    return { pts, t: 0, angle };
  };

  const draw = () => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, W, H);
    // Source & beam
    ctx.fillStyle = "#334155";
    ctx.fillRect(4, CY - BEAM - 4, 18, 2 * BEAM + 8);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("مصدر ألفا", 26, 16);
    // Detector ring
    ctx.strokeStyle = "rgba(148,163,184,0.35)";
    ctx.setLineDash([3, 5]);
    ctx.beginPath();
    ctx.arc(CX, CY, 150, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    // Histogram drawn around the ring: bar length ∝ log(count)
    const max = Math.max(1, ...counts.current);
    for (let i = 0; i < BINS; i++) {
      const c = counts.current[i];
      if (!c) continue;
      const a0 = (i * 10 * Math.PI) / 180;
      const len = 8 + (Math.log10(1 + c) / Math.log10(1 + max)) * 28;
      for (const sgn of [1, -1]) {
        ctx.strokeStyle = i >= 9 ? "#f87171" : "#38bdf8";
        ctx.lineWidth = 7;
        ctx.beginPath();
        ctx.moveTo(CX + 152 * Math.cos(sgn * a0 + 0.087 * sgn), CY - 152 * Math.sin(sgn * a0 + 0.087 * sgn));
        ctx.lineTo(CX + (152 + len) * Math.cos(sgn * a0 + 0.087 * sgn), CY - (152 + len) * Math.sin(sgn * a0 + 0.087 * sgn));
        ctx.stroke();
      }
    }
    // Atom: either a point nucleus or a diffuse sphere
    if (mdl === "rutherford") {
      const g = ctx.createRadialGradient(CX, CY, 0, CX, CY, 10);
      g.addColorStop(0, "#fde68a");
      g.addColorStop(1, "rgba(245,158,11,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(CX, CY, 10, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#f59e0b";
      ctx.beginPath();
      ctx.arc(CX, CY, 3, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = "rgba(248,113,113,0.25)";
      ctx.beginPath();
      ctx.arc(CX, CY, 120, 0, Math.PI * 2);
      ctx.fill();
    }
    // Particles with short trails
    for (const f of flights.current) {
      const idx = Math.min(f.pts.length - 1, Math.floor(f.t * f.pts.length));
      const from = Math.max(0, idx - 8);
      ctx.strokeStyle = f.angle > 90 ? "rgba(248,113,113,0.9)" : f.angle > 10 ? "rgba(253,224,71,0.85)" : "rgba(125,211,252,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      for (let i = from; i <= idx; i++) (i === from ? ctx.moveTo : ctx.lineTo).call(ctx, f.pts[i][0], f.pts[i][1]);
      ctx.stroke();
    }
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "12px sans-serif";
    ctx.textAlign = "right";
    const big = counts.current.slice(9).reduce((a, b) => a + b, 0);
    const mid = counts.current.slice(1).reduce((a, b) => a + b, 0);
    ctx.fillText(`عدد الجسيمات: ${total.current}`, W - 10, 18);
    ctx.fillText(`انحراف > 10°: ${mid}`, W - 10, 36);
    ctx.fillStyle = "#fca5a5";
    ctx.fillText(`ارتداد > 90°: ${big}`, W - 10, 54);
  };

  useAnimationFrame(
    (dt) => {
      acc.current += dt * Number(rate);
      while (acc.current >= 1 && flights.current.length < 160) {
        acc.current -= 1;
        flights.current.push(spawn());
      }
      flights.current = flights.current.filter((f) => {
        f.t += dt * 0.9;
        if (f.t >= 1) {
          counts.current[Math.min(BINS - 1, Math.floor(f.angle / 10))]++;
          total.current++;
          return false;
        }
        return true;
      });
      draw();
      setTick((x) => (x + 1) % 1e6);
    },
    !reduced,
  );

  useEffect(() => {
    if (!reduced) return;
    // Static view: sample many particles at once.
    for (let i = 0; i < 600; i++) {
      const f = spawn();
      counts.current[Math.min(BINS - 1, Math.floor(f.angle / 10))]++;
      total.current++;
      if (i < 40) flights.current.push({ ...f, t: 1 });
    }
    draw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reduced, z, k, mdl]);

  return <canvas ref={canvas} width={W} height={H} className="block h-auto w-full rounded-[12px]" role="img" aria-label="جسيمات ألفا بتتشتت حوالين نواة؛ اللون الأحمر للي ارتدت بأكتر من 90 درجة" data-scene="rutherford" />;
}
