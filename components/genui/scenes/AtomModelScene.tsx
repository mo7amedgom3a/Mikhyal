"use client";
import { useState } from "react";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { useAnimationFrame } from "@/components/phenomena/sims/useAnimationFrame";

/** Bohr-style atom drawn from data: Z protons, N neutrons, electrons per shell. Not to scale. */
export function AtomModelScene({ Z = 6, N = 6, shells = [2, 4], symbol = "C", notToScale = true }: { Z?: number; N?: number; shells?: number[]; symbol?: string; notToScale?: boolean }) {
  const [t, setT] = useState(0);
  const reduced = usePrefersReducedMotion();
  useAnimationFrame((dt) => setT((x) => x + dt), !reduced);
  const protons = Math.max(0, Math.min(40, Number(Z)));
  const neutrons = Math.max(0, Math.min(40, Number(N)));
  const nucleons = [...Array(protons).fill("p"), ...Array(neutrons).fill("n")].sort((a, b) => (a === b ? 0 : (protons + neutrons) % 2 ? -1 : 1));
  // Sunflower packing of nucleons.
  const R = 4.2 + Math.sqrt(nucleons.length) * 3.4;
  const cx = 220;
  const cy = 170;
  const list = Array.isArray(shells) ? shells : [];
  return (
    <svg viewBox="0 0 560 340" className="block h-auto w-full" role="img" aria-label={`ذرة ${symbol}: ${protons} بروتون و${neutrons} نيوترون و${protons} إلكترون`}>
      {list.map((count, si) => {
        const r = 46 + si * 38;
        return (
          <g key={si}>
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="#94a3b8" strokeDasharray="3 5" />
            <text x={cx + r + 4} y={cy - 4} fontSize="11" fill="#64748b">n={si + 1}</text>
            {Array.from({ length: count }).map((_, k) => {
              const a = (k / count) * Math.PI * 2 + t * (1.2 / (si + 1));
              return (
                <g key={k}>
                  <circle cx={cx + r * Math.cos(a)} cy={cy + r * Math.sin(a)} r="7" fill="#5146e8" />
                  <text x={cx + r * Math.cos(a)} y={cy + r * Math.sin(a) + 3.5} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">−</text>
                </g>
              );
            })}
          </g>
        );
      })}
      {nucleons.map((kind, i) => {
        const rr = R * Math.sqrt((i + 0.5) / nucleons.length) * 0.9;
        const a = i * 2.39996;
        return <circle key={i} cx={cx + rr * Math.cos(a)} cy={cy + rr * Math.sin(a)} r="5" fill={kind === "p" ? "#e5484d" : "#94a3b8"} stroke="#fff" strokeWidth="1" />;
      })}
      <g transform="translate(430,60)">
        <text fontSize="40" fontWeight="bold" fill="#111827" fontFamily="var(--font-latin)">{String(symbol)}</text>
        <text x="0" y="26" fontSize="12" fill="#475569">Z = {protons} · N = {neutrons}</text>
        <text x="0" y="44" fontSize="12" fill="#475569">A = {protons + neutrons}</text>
        <circle cx="6" cy="70" r="5" fill="#e5484d" />
        <text x="16" y="74" fontSize="12" fill="#475569">بروتون</text>
        <circle cx="6" cy="90" r="5" fill="#94a3b8" />
        <text x="16" y="94" fontSize="12" fill="#475569">نيوترون</text>
        <circle cx="6" cy="110" r="5" fill="#5146e8" />
        <text x="16" y="114" fontSize="12" fill="#475569">إلكترون</text>
      </g>
      {notToScale && <text x="20" y="325" fontSize="11" fill="#94a3b8">⚠ مش بالمقياس: لو النواة بالحجم ده، الذرة كانت هتبقى عرضها كيلومترات.</text>}
    </svg>
  );
}
