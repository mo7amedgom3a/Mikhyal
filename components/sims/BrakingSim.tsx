"use client";
import { stateAt, stoppingTime } from "@/lib/physics/braking";
import { useSimClock, type SimProps } from "./useSimClock";

const OBSTACLE = 30;
const X0 = 40;
const PX_PER_M = 18;
const CAR_W = 64;

export function BrakingSim({ params, runKey, onFinish }: SimProps) {
  const { u, a } = params;
  const tStop = stoppingTime(u, a);
  const sStop = (u * u) / (2 * a);
  // Time when the car's front reaches the obstacle (if it does).
  const tHit = sStop > OBSTACLE ? (u - Math.sqrt(u * u - 2 * a * OBSTACLE)) / a : Infinity;
  const tEnd = Math.min(tStop, tHit);
  const scale = Math.max(1, tEnd / 3.5);
  const { t } = useSimClock(runKey, tEnd, scale, onFinish);
  const { x, v } = stateAt(t, u, a);
  const crashed = runKey > 0 && t >= tHit - 1e-9;

  const marks: number[] = [];
  for (let k = 0.25; k <= t + 1e-9; k += 0.25) marks.push(stateAt(k, u, a).x);

  const front = X0 + x * PX_PER_M;
  return (
    <svg viewBox="0 0 800 230" className="block h-auto w-full" role="img" aria-label={`عربية بسرعة ${u} م/ث تفرمل بتباطؤ ${a} م/ث²`}>
      <rect x="0" y="0" width="800" height="230" fill="var(--surface-simulation)" />
      {/* sky decoration */}
      <circle cx="720" cy="40" r="18" fill="var(--brand-insight)" opacity="0.6" />
      {/* road */}
      <rect x="0" y="150" width="800" height="50" fill="#3b4558" />
      <line x1="0" y1="175" x2="800" y2="175" stroke="#fff" strokeWidth="3" strokeDasharray="22 18" opacity="0.6" />
      {/* distance ruler */}
      {Array.from({ length: 9 }, (_, i) => i * 5).map((m) => (
        <g key={m}>
          <line x1={X0 + m * PX_PER_M} y1="200" x2={X0 + m * PX_PER_M} y2="210" stroke="var(--text-muted)" strokeWidth="2" />
          <text x={X0 + m * PX_PER_M} y="225" fontSize="12" textAnchor="middle" fill="var(--text-muted)" fontFamily="var(--font-latin)">
            {m}m
          </text>
        </g>
      ))}
      {/* trail marks every 0.25 s: spacing shrinks as speed drops */}
      {marks.map((mx, i) => (
        <circle key={i} cx={X0 + mx * PX_PER_M} cy="192" r="4" fill="var(--brand-insight)" />
      ))}
      {/* obstacle */}
      <g transform={`translate(${X0 + OBSTACLE * PX_PER_M}, 108)`}>
        <rect x="0" y="0" width="16" height="44" rx="3" fill="var(--danger)" />
        <rect x="0" y="8" width="16" height="7" fill="#fff" />
        <rect x="0" y="26" width="16" height="7" fill="#fff" />
      </g>
      {/* car: front bumper at `front` */}
      <g transform={`translate(${front - CAR_W}, 118)`}>
        <rect x="0" y="10" width={CAR_W} height="22" rx="8" fill="var(--brand-primary)" stroke="var(--brand-primary-edge)" strokeWidth="2" />
        <path d="M12 10 L20 0 H44 L54 10 Z" fill="var(--brand-primary-hover)" />
        <rect x="24" y="2" width="12" height="7" rx="2" fill="#dfe3ff" />
        <circle cx="16" cy="33" r="7" fill="#172234" />
        <circle cx="48" cy="33" r="7" fill="#172234" />
        <circle cx={CAR_W - 3} cy="18" r="3" fill="var(--brand-insight)" />
      </g>
      {/* velocity arrow */}
      {v > 0.05 && (
        <g>
          <line x1={front + 4} y1="100" x2={front + 4 + v * 3} y2="100" stroke="var(--brand-discovery)" strokeWidth="4" />
          <polygon points={`${front + 4 + v * 3},94 ${front + 14 + v * 3},100 ${front + 4 + v * 3},106`} fill="var(--brand-discovery)" />
        </g>
      )}
      {crashed && (
        <text x={front + 8} y="95" fontSize="28">
          💥
        </text>
      )}
      <g fontFamily="var(--font-latin)" fontSize="15" fill="var(--foreground)">
        <text x="20" y="32" fontWeight="700">t = {t.toFixed(2)} s</text>
        <text x="20" y="54">v = {v.toFixed(1)} m/s</text>
        <text x="20" y="76">x = {x.toFixed(1)} m</text>
      </g>
    </svg>
  );
}
