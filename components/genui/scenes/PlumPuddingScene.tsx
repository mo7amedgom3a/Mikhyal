"use client";
import { useState } from "react";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { useAnimationFrame } from "@/components/phenomena/sims/useAnimationFrame";

/** Thomson's model: diffuse positive sphere with embedded electrons; α particles pass almost straight. */
export function PlumPuddingScene({ electrons = 10, caption }: { electrons?: number; caption?: string }) {
  const [t, setT] = useState(0);
  const reduced = usePrefersReducedMotion();
  useAnimationFrame((dt) => setT((x) => x + dt), !reduced);
  const n = Math.max(1, Math.min(30, Number(electrons)));
  return (
    <figure className="space-y-1">
      <svg viewBox="0 0 560 260" className="block h-auto w-full" role="img" aria-label="نموذج طومسون: كرة موجبة فيها إلكترونات، وجسيمات ألفا بتعدّي بانحراف بسيط">
        <defs>
          <radialGradient id="pud" cx="45%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#fecaca" />
            <stop offset="100%" stopColor="#f87171" stopOpacity="0.55" />
          </radialGradient>
        </defs>
        <circle cx="280" cy="130" r="100" fill="url(#pud)" stroke="#dc2626" strokeOpacity="0.4" />
        <text x="280" y="44" textAnchor="middle" fontSize="13" fill="#7f1d1d">+ + + شحنة موجبة منتشرة + + +</text>
        {Array.from({ length: n }).map((_, i) => {
          const a = i * 2.39996;
          const r = 22 + ((i * 53) % 68);
          return (
            <g key={i}>
              <circle cx={280 + r * Math.cos(a)} cy={130 + r * Math.sin(a)} r="7" fill="#5146e8" />
              <text x={280 + r * Math.cos(a)} y={130 + r * Math.sin(a) + 3.5} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">−</text>
            </g>
          );
        })}
        {[60, 100, 130, 160, 200].map((y, i) => {
          const x = ((t * 140 + i * 110) % 640) - 40;
          const bend = Math.sin(i * 1.7) * 1.2 * Math.max(0, Math.min(1, (x - 180) / 200));
          return <circle key={y} cx={x} cy={y + bend * 6} r="5" fill="#f59e0b" stroke="#92400e" />;
        })}
      </svg>
      {caption && <figcaption className="text-center text-sm text-ink-3">{String(caption)}</figcaption>}
    </figure>
  );
}
