"use client";
import { useState } from "react";
import type { AtomModelRecord } from "@/lib/domain";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { useAnimationFrame } from "@/components/phenomena/sims/useAnimationFrame";
import { rng } from "@/lib/workbench/algebra";

const CX = 150;
const CY = 140;

const electron = (x: number, y: number, key: string | number) => (
  <g key={key}>
    <circle cx={x} cy={y} r="6.5" fill="#5146e8" />
    <text x={x} y={y + 3.5} textAnchor="middle" fontSize="10" fill="#fff" fontWeight="bold">
      −
    </text>
  </g>
);

const nucleus = (withNeutrons: boolean, r = 9) => {
  const n = withNeutrons ? 8 : 5;
  return Array.from({ length: n }).map((_, i) => {
    const a = i * 2.39996;
    const rr = r * Math.sqrt((i + 0.5) / n);
    const neutral = withNeutrons && i % 2 === 1;
    return <circle key={i} cx={CX + rr * Math.cos(a)} cy={CY + rr * Math.sin(a)} r="4" fill={neutral ? "#94a3b8" : "#ef4444"} stroke="#fff" strokeWidth="0.8" />;
  });
};

// Fixed sample of cloud points (seeded, so server and client agree).
const CLOUD = (() => {
  const r = rng(7);
  return Array.from({ length: 420 }, () => {
    // Radial density ~ r² e^{-2r} (1s-like), sampled by rejection.
    let d = 0;
    for (;;) {
      d = r() * 6;
      if (r() < (d * d * Math.exp(-2 * d)) / 0.14) break;
    }
    const a = r() * Math.PI * 2;
    return [Math.cos(a) * d * 26, Math.sin(a) * d * 26] as const;
  });
})();

/** Draws the selected historical atom model from data, with its idea, evidence and flaw. */
export function ModelGalleryScene({ models = [], model }: { models?: AtomModelRecord[]; model?: string }) {
  const [t, setT] = useState(0);
  const reduced = usePrefersReducedMotion();
  useAnimationFrame((dt) => setT((x) => x + dt), !reduced);
  const m = models.find((x) => x.key === model) ?? models[0];
  if (!m) return null;

  let art: React.ReactNode;
  switch (m.style) {
    case "solid":
      art = (
        <>
          <defs>
            <radialGradient id="ball" cx="35%" cy="35%" r="70%">
              <stop offset="0%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor={m.key === "democritus" ? "#a8a29e" : "#475569"} />
            </radialGradient>
          </defs>
          <circle cx={CX} cy={CY} r="80" fill="url(#ball)" />
          <text x={CX} y={CY + 115} textAnchor="middle" fontSize="12" fill="#475569">
            {m.key === "democritus" ? "قطعة مصمتة مش بتتقسم" : "كرة صلبة مصمتة"}
          </text>
        </>
      );
      break;
    case "pudding":
      art = (
        <>
          <circle cx={CX} cy={CY} r="95" fill="#fca5a5" fillOpacity="0.6" stroke="#dc2626" strokeOpacity="0.4" />
          <text x={CX} y={CY - 100} textAnchor="middle" fontSize="12" fill="#7f1d1d">
            + شحنة موجبة منتشرة +
          </text>
          {Array.from({ length: 10 }).map((_, i) => {
            const a = i * 2.39996;
            const r = 20 + ((i * 53) % 65);
            return electron(CX + r * Math.cos(a), CY + r * Math.sin(a), i);
          })}
        </>
      );
      break;
    case "nuclear":
      art = (
        <>
          <circle cx={CX} cy={CY} r="100" fill="none" stroke="#cbd5e1" strokeDasharray="2 6" />
          {nucleus(false)}
          {Array.from({ length: 6 }).map((_, i) => {
            const a = i * 1.9 + t * 0.6;
            const r = 55 + ((i * 31) % 40);
            return electron(CX + r * Math.cos(a), CY + r * Math.sin(a * 1.3), i);
          })}
          <text x={CX} y={CY + 125} textAnchor="middle" fontSize="12" fill="#475569">
            نواة صغيرة جدًا + فراغ كبير
          </text>
        </>
      );
      break;
    case "orbits":
      art = (
        <>
          {[40, 70, 100].map((r, si) => (
            <g key={r}>
              <circle cx={CX} cy={CY} r={r} fill="none" stroke="#94a3b8" />
              {electron(CX + r * Math.cos(t * (1.4 / (si + 1)) + si), CY + r * Math.sin(t * (1.4 / (si + 1)) + si), si)}
            </g>
          ))}
          {nucleus(false)}
        </>
      );
      break;
    case "neutrons":
    case "cloud":
      art = (
        <>
          {CLOUD.map(([x, y], i) => {
            const wob = reduced ? 0 : Math.sin(t * 2 + i) * 1.2;
            return <circle key={i} cx={CX + x + wob} cy={CY + y} r="1.8" fill="#5146e8" fillOpacity="0.45" />;
          })}
          {nucleus(m.style === "neutrons" || m.year >= 1932, 11)}
          <text x={CX} y={CY + 125} textAnchor="middle" fontSize="12" fill="#475569">
            {m.style === "cloud" ? "سحابة احتمال حوالين النواة" : "نواة: بروتونات + نيوترونات"}
          </text>
        </>
      );
      break;
  }

  return (
    <div className="grid items-center gap-2 sm:grid-cols-[300px_1fr]" data-model={m.key}>
      <svg viewBox="0 0 300 280" className="mx-auto block h-auto w-full max-w-[300px]" role="img" aria-label={`نموذج ${m.scientist}: ${m.title}`}>
        {art}
      </svg>
      <div dir="rtl" className="space-y-2 p-3 text-start">
        <p className="text-sm font-bold text-primary">
          {m.scientist} · <span className="ltr font-latin">{m.yearLabel}</span>
        </p>
        <p className="font-display text-xl font-extrabold text-ink">{m.title}</p>
        <p className="text-[15px] leading-7 text-ink-2">{m.idea}</p>
        <p className="text-sm leading-6 text-ink-2">
          <span className="font-bold text-mint-dark">الدليل: </span>
          {m.evidence}
        </p>
        <p className="text-sm leading-6 text-ink-2">
          <span className="font-bold text-destructive">{m.style === "cloud" || m.style === "neutrons" ? "النهارده: " : "إيه اللي كان ناقص: "}</span>
          {m.flaw}
        </p>
      </div>
    </div>
  );
}
