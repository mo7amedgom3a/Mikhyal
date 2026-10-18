"use client";
import { acceleration, distanceAt } from "@/lib/physics/newton";
import { useSimClock, type SimProps } from "./useSimClock";

const X0 = 50;
const PX_PER_M = 56;
const DURATION = 4;

export function NewtonSim({ params, runKey, onFinish }: SimProps) {
  const { F, m } = params;
  const a = acceleration(F, m);
  const { t } = useSimClock(runKey, DURATION, 1, onFinish);
  const x = distanceAt(t, a);
  const shown = Math.min(x, 12.5);
  const boxH = 30 + (m / 4000) * 50;
  const boxW = 60 + (m / 4000) * 40;
  const left = X0 + shown * PX_PER_M;
  const arrow = 30 + (F / 3000) * 90;
  const marks: number[] = [];
  for (let k = 0.5; k <= t + 1e-9; k += 0.5) marks.push(distanceAt(k, a));

  return (
    <svg viewBox="0 0 800 230" className="block h-auto w-full" role="img" aria-label={`قوة ${F} نيوتن تشد كتلة ${m} كجم`}>
      <rect width="800" height="230" fill="var(--surface-simulation)" />
      <rect x="0" y="170" width="800" height="60" fill="#d9dee9" />
      <line x1="0" y1="170" x2="800" y2="170" stroke="#9aa5b8" strokeWidth="2" />
      {/* finish line at 10 m */}
      <g>
        <line x1={X0 + 10 * PX_PER_M} y1="60" x2={X0 + 10 * PX_PER_M} y2="170" stroke="var(--brand-discovery)" strokeWidth="3" strokeDasharray="8 6" />
        <text x={X0 + 10 * PX_PER_M} y="52" textAnchor="middle" fontSize="13" fill="var(--brand-discovery-dark)" fontFamily="var(--font-latin)" fontWeight="700">
          10 m
        </text>
      </g>
      {marks.map((mx, i) => (
        <circle key={i} cx={X0 + Math.min(mx, 12.5) * PX_PER_M} cy="185" r="4" fill="var(--brand-insight)" />
      ))}
      {/* truck body sized by mass */}
      <g transform={`translate(${left}, ${170 - boxH - 14})`}>
        <rect width={boxW} height={boxH} rx="6" fill="var(--brand-insight)" stroke="var(--brand-insight-dark)" strokeWidth="2" />
        <text x={boxW / 2} y={boxH / 2 + 5} textAnchor="middle" fontSize="13" fontWeight="700" fill="#172234" fontFamily="var(--font-latin)">
          {m} kg
        </text>
        <rect x={boxW} y={boxH - 26} width="26" height="26" rx="5" fill="var(--brand-primary)" />
        <circle cx="14" cy={boxH + 7} r="8" fill="#172234" />
        <circle cx={boxW + 8} cy={boxH + 7} r="8" fill="#172234" />
        {/* force arrow */}
        <line x1={boxW + 30} y1={boxH - 14} x2={boxW + 30 + arrow} y2={boxH - 14} stroke="var(--brand-primary)" strokeWidth="5" />
        <polygon points={`${boxW + 30 + arrow},${boxH - 22} ${boxW + 44 + arrow},${boxH - 14} ${boxW + 30 + arrow},${boxH - 6}`} fill="var(--brand-primary)" />
        <text x={boxW + 34 + arrow / 2} y={boxH - 24} textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--brand-primary)" fontFamily="var(--font-latin)">
          F = {F} N
        </text>
      </g>
      <g fontFamily="var(--font-latin)" fontSize="15" fill="var(--foreground)">
        <text x="20" y="30" fontWeight="700">t = {t.toFixed(2)} s</text>
        <text x="20" y="52">a = {a.toFixed(2)} m/s²</text>
        <text x="20" y="74">x = {x.toFixed(1)} m</text>
      </g>
    </svg>
  );
}
