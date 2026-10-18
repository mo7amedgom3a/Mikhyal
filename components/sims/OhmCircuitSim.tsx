"use client";
import { useEffect, useState } from "react";
import { current, power } from "@/lib/physics/ohm";
import { useSimClock, usePrefersReducedMotion, type SimProps } from "./useSimClock";

const FUSE_MAX = 2;
// Rectangle circuit path (clockwise from the battery).
const PATH = [
  [120, 200],
  [120, 60],
  [680, 60],
  [680, 200],
  [120, 200],
] as const;
const SEGS = PATH.slice(1).map((p, i) => Math.hypot(p[0] - PATH[i][0], p[1] - PATH[i][1]));
const TOTAL = SEGS.reduce((s, l) => s + l, 0);

function pointAt(d: number): [number, number] {
  let rest = ((d % TOTAL) + TOTAL) % TOTAL;
  for (let i = 0; i < SEGS.length; i++) {
    if (rest <= SEGS[i]) {
      const f = rest / SEGS[i];
      return [PATH[i][0] + (PATH[i + 1][0] - PATH[i][0]) * f, PATH[i][1] + (PATH[i + 1][1] - PATH[i][1]) * f];
    }
    rest -= SEGS[i];
  }
  return [PATH[0][0], PATH[0][1]];
}

export function OhmCircuitSim({ params, runKey, onFinish }: SimProps) {
  const { V, R } = params;
  const I = current(V, R);
  const P = power(V, R);
  const blows = I > FUSE_MAX;
  const { t } = useSimClock(runKey, 1.5, 1, onFinish);
  const closed = runKey > 0;
  const blown = closed && blows && t >= 0.6;
  const reduced = usePrefersReducedMotion();
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    if (!closed || blown || reduced) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      setPhase((p) => p + ((now - last) / 1000) * I * 60);
      last = now;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [closed, blown, I, reduced]);

  const lit = closed && !blown;
  const glow = lit ? Math.min(1, P / 24) : 0;
  const dots = Array.from({ length: 18 }, (_, i) => pointAt(phase + (i * TOTAL) / 18));

  return (
    <svg viewBox="0 0 800 260" className="block h-auto w-full" role="img" aria-label={`دايرة كهربية: جهد ${V} فولت ومقاومة ${R} أوم`}>
      <rect width="800" height="260" fill="var(--surface-simulation)" />
      <polyline points={PATH.map((p) => p.join(",")).join(" ")} fill="none" stroke="#172234" strokeWidth="4" strokeLinejoin="round" />
      {/* battery (left) */}
      <g transform="translate(120,130)">
        <rect x="-26" y="-34" width="52" height="68" fill="var(--surface-simulation)" />
        <line x1="-22" y1="-10" x2="22" y2="-10" stroke="#172234" strokeWidth="5" />
        <line x1="-12" y1="6" x2="12" y2="6" stroke="#172234" strokeWidth="5" />
        <text x="-36" y="4" textAnchor="end" fontSize="15" fontWeight="700" fontFamily="var(--font-latin)" fill="var(--foreground)">
          {V} V
        </text>
      </g>
      {/* resistor (top) */}
      <g transform="translate(300,60)">
        <rect x="-50" y="-14" width="100" height="28" fill="var(--surface-simulation)" />
        <polyline points="-50,0 -40,-12 -25,12 -10,-12 5,12 20,-12 35,12 45,0 50,0" fill="none" stroke="var(--brand-primary)" strokeWidth="4" />
        <text y="-22" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="var(--font-latin)" fill="var(--brand-primary)">
          R = {R} Ω
        </text>
      </g>
      {/* ammeter (top right) */}
      <g transform="translate(520,60)">
        <circle r="22" fill="#fff" stroke="#172234" strokeWidth="3" />
        <text y="6" textAnchor="middle" fontSize="16" fontWeight="700" fontFamily="var(--font-latin)">A</text>
        <text y="-30" textAnchor="middle" fontSize="15" fontWeight="700" fontFamily="var(--font-latin)" fill="var(--foreground)">
          {lit ? I.toFixed(2) : "0.00"} A
        </text>
      </g>
      {/* lamp (right) */}
      <g transform="translate(680,130)">
        <circle r={30 + glow * 40} fill="var(--brand-insight)" opacity={glow * 0.35} />
        <circle r="24" style={{ fill: lit ? `color-mix(in srgb, var(--brand-insight) ${30 + glow * 70}%, #fff)` : "#fff" }} stroke="#172234" strokeWidth="3" />
        <path d="M-12 -12 L12 12 M12 -12 L-12 12" stroke="#172234" strokeWidth="3" />
      </g>
      {/* fuse (bottom) */}
      <g transform="translate(400,200)">
        <rect x="-36" y="-12" width="72" height="24" rx="6" fill="#fff" stroke="#172234" strokeWidth="3" />
        {blown ? (
          <>
            <path d="M-30 0 Q-14 -10 -6 2" stroke="var(--danger)" strokeWidth="3" fill="none" />
            <path d="M30 0 Q14 10 6 -2" stroke="var(--danger)" strokeWidth="3" fill="none" />
            <text x="0" y="-20" textAnchor="middle" fontSize="22">⚡</text>
          </>
        ) : (
          <path d="M-30 0 Q-15 -8 0 0 T30 0" stroke="#172234" strokeWidth="3" fill="none" />
        )}
        <text y="38" textAnchor="middle" fontSize="13" fontFamily="var(--font-latin)" fill="var(--text-secondary)">
          fuse 2 A
        </text>
      </g>
      {lit && dots.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="4" fill="var(--brand-discovery)" />)}
      {!closed && (
        <text x="400" y="140" textAnchor="middle" fontSize="16" fill="var(--text-muted)">
          المفتاح مفتوح — اضغط «شغّل» لقفل الدايرة
        </text>
      )}
    </svg>
  );
}
