"use client";
import { gamma } from "@/lib/physics/relativity";
import { useSimClock, type SimProps } from "./useSimClock";

function Clock({ cx, cy, years, label, color }: { cx: number; cy: number; years: number; label: string; color: string }) {
  const angle = (years % 1) * 2 * Math.PI;
  return (
    <g transform={`translate(${cx},${cy})`}>
      <circle r="46" fill="#fff" stroke={color} strokeWidth="5" />
      {Array.from({ length: 12 }, (_, i) => (
        <line key={i} x1={40 * Math.sin((i * Math.PI) / 6)} y1={-40 * Math.cos((i * Math.PI) / 6)} x2={34 * Math.sin((i * Math.PI) / 6)} y2={-34 * Math.cos((i * Math.PI) / 6)} stroke="#9aa5b8" strokeWidth="2" />
      ))}
      <line x1="0" y1="0" x2={34 * Math.sin(angle)} y2={-34 * Math.cos(angle)} stroke={color} strokeWidth="4" strokeLinecap="round" />
      <circle r="4" fill={color} />
      <text y="72" textAnchor="middle" fontSize="15" fontWeight="700" fill="#e6e9ff">{label}</text>
      <text y="94" textAnchor="middle" fontSize="15" fontFamily="var(--font-latin)" fill={color} fontWeight="700">
        {years.toFixed(2)} yr
      </text>
    </g>
  );
}

const STARS = Array.from({ length: 40 }, (_, i) => ({ x: (i * 197) % 420, y: 20 + ((i * 83) % 150), r: 1 + (i % 3) }));

export function RelativitySim({ params, runKey, onFinish }: SimProps) {
  const { beta, t0 } = params;
  const g = gamma(beta);
  const earthTotal = g * t0;
  const { t } = useSimClock(runKey, earthTotal, Math.max(0.5, earthTotal / 4), onFinish);
  const earth = t;
  const ship = t / g;

  // γ(β) plot
  const plotX = (b: number) => 470 + b * 300;
  const plotY = (gg: number) => 200 - Math.min(gg - 1, 6) * 28;
  const curve = Array.from({ length: 100 }, (_, i) => {
    const b = (i / 100) * 0.99;
    return `${plotX(b)},${plotY(gamma(b))}`;
  }).join(" ");

  return (
    <svg viewBox="0 0 800 260" className="block h-auto w-full" role="img" aria-label={`سفينة بسرعة ${beta} من سرعة الضوء`}>
      <rect width="440" height="260" fill="#141a33" />
      <rect x="440" width="360" height="260" fill="var(--surface-simulation)" />
      {STARS.map((s, i) => {
        const x = (((s.x - t * beta * 260) % 440) + 440) % 440;
        return <rect key={i} x={x} y={s.y} width={2 + beta * 22} height={s.r} rx="1" fill="#fff" opacity="0.7" />;
      })}
      <g transform="translate(160,40)">
        <path d="M0 14 L60 14 L80 22 L60 30 L0 30 L-10 22 Z" fill="#dfe3ff" stroke="var(--brand-primary)" strokeWidth="2" />
        <path d="M-10 22 L-30 16 L-26 22 L-30 28 Z" fill="var(--brand-insight)" opacity={0.4 + beta * 0.6} />
        <circle cx="50" cy="22" r="4" fill="var(--brand-primary)" />
      </g>
      <Clock cx={110} cy={150} years={ship} label="ساعة السفينة" color="var(--brand-insight)" />
      <Clock cx={320} cy={150} years={earth} label="ساعة الأرض" color="var(--brand-discovery)" />
      {/* gamma plot */}
      <g fontFamily="var(--font-latin)" fontSize="12" fill="var(--text-secondary)">
        <line x1="470" y1="200" x2="780" y2="200" stroke="#9aa5b8" />
        <line x1="470" y1="30" x2="470" y2="200" stroke="#9aa5b8" />
        <text x="775" y="218" textAnchor="end">β = v/c</text>
        <text x="476" y="28">γ</text>
        {[1, 2, 3, 4, 5].map((gg) => (
          <text key={gg} x="462" y={plotY(gg) + 4} textAnchor="end">{gg}</text>
        ))}
        {[0, 0.5, 1].map((b) => (
          <text key={b} x={plotX(b)} y="216" textAnchor="middle">{b}</text>
        ))}
        <line x1="470" y1={plotY(2)} x2="780" y2={plotY(2)} stroke="var(--brand-discovery)" strokeDasharray="5 4" />
        <polyline points={curve} fill="none" stroke="var(--brand-primary)" strokeWidth="3" />
        <circle cx={plotX(beta)} cy={plotY(g)} r="7" fill="var(--brand-insight)" stroke="#172234" strokeWidth="2" />
        <text x="620" y="245" textAnchor="middle" fontSize="15" fontWeight="700" fill="var(--foreground)">
          γ = {g.toFixed(3)}
        </text>
      </g>
    </svg>
  );
}
