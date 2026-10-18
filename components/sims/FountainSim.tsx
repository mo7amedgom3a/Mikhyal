"use client";
import { evaluate, landingX, vertex } from "@/lib/physics/fountain";
import { useSimClock, type SimProps } from "./useSimClock";

const OX = 60;
const OY = 230;
const SX = 110; // px per m (x)
const SY = 45; // px per m (y)

export function FountainSim({ params, runKey, onFinish }: SimProps) {
  const { a, b, c } = params;
  const land = landingX(a, b, c) ?? 6.5;
  const end = Math.min(land, 6.5);
  const v = vertex(a, b, c);
  const { t, running } = useSimClock(runKey, 3, 1, onFinish);
  const px = (x: number) => OX + x * SX;
  const py = (y: number) => OY - y * SY;
  const pts = Array.from({ length: 80 }, (_, i) => {
    const x = (i / 79) * end;
    return `${px(x)},${py(Math.max(evaluate(a, b, c, x), -0.2))}`;
  }).join(" ");
  const drops = running
    ? Array.from({ length: 10 }, (_, i) => {
        const f = ((t * 0.9 + i / 10) % 1) * end;
        return [px(f), py(evaluate(a, b, c, f))];
      })
    : [];
  const hit = landingX(a, b, c) !== null && Math.abs(land - 4) <= 0.2;

  return (
    <svg viewBox="0 0 800 270" className="block h-auto w-full" role="img" aria-label={`مسار نافورة y = ${a}x² + ${b}x + ${c}`}>
      <rect width="800" height="270" fill="var(--surface-simulation)" />
      {/* grid */}
      <g stroke="#dfe3f0" strokeWidth="1">
        {Array.from({ length: 7 }, (_, i) => <line key={`x${i}`} x1={px(i)} y1={py(4.5)} x2={px(i)} y2={OY} />)}
        {Array.from({ length: 5 }, (_, i) => <line key={`y${i}`} x1={OX} y1={py(i)} x2={px(6.5)} y2={py(i)} />)}
      </g>
      <g fontFamily="var(--font-latin)" fontSize="12" fill="var(--text-muted)">
        {Array.from({ length: 7 }, (_, i) => <text key={i} x={px(i)} y={OY + 16} textAnchor="middle">{i}</text>)}
        {Array.from({ length: 5 }, (_, i) => <text key={i} x={OX - 8} y={py(i) + 4} textAnchor="end">{i}</text>)}
      </g>
      <line x1={OX} y1={OY} x2={px(6.5)} y2={OY} stroke="#172234" strokeWidth="2" />
      {/* target height & pool */}
      <line x1={OX} y1={py(2)} x2={px(6.5)} y2={py(2)} stroke="var(--brand-insight-dark)" strokeDasharray="6 5" strokeWidth="2" />
      <text x={px(6.4)} y={py(2) - 6} textAnchor="end" fontSize="12" fill="var(--brand-insight-dark)">h = 2 m</text>
      <rect x={px(3.8)} y={OY - 2} width={0.4 * SX} height="18" rx="4" fill={hit ? "var(--brand-discovery)" : "#7cc6f2"} stroke="#172234" strokeWidth="2" />
      <text x={px(4)} y={OY + 34} textAnchor="middle" fontSize="12" fill="var(--text-secondary)">الحوض</text>
      {/* nozzle */}
      <rect x={OX - 8} y={py(c)} width="16" height={c * SY + 4} fill="#9aa5b8" />
      {/* parabola */}
      <polyline points={pts} fill="none" stroke="#2f9be0" strokeWidth={running ? 5 : 3} strokeDasharray={running ? "0" : "8 6"} opacity={running ? 0.9 : 0.7} />
      {drops.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="5" fill="#2f9be0" />)}
      {/* vertex & root */}
      {v.x > 0 && v.x < 6.5 && (
        <g>
          <circle cx={px(v.x)} cy={py(v.y)} r="6" fill="var(--brand-primary)" />
          <text x={px(v.x)} y={py(v.y) - 12} textAnchor="middle" fontSize="12" fontFamily="var(--font-latin)" fill="var(--brand-primary)" fontWeight="700">
            ({v.x.toFixed(2)}, {v.y.toFixed(2)})
          </text>
        </g>
      )}
      {landingX(a, b, c) !== null && land < 6.5 && <circle cx={px(land)} cy={OY} r="6" fill="var(--brand-insight)" stroke="#172234" strokeWidth="2" />}
      <text x="780" y="28" textAnchor="end" fontSize="16" fontFamily="var(--font-latin)" fontWeight="700" fill="var(--foreground)" direction="ltr">
        y = {a.toFixed(2)}x² + {b.toFixed(1)}x + {c.toFixed(1)}
      </text>
    </svg>
  );
}
