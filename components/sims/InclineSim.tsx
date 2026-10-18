"use client";
import { useRef } from "react";
import { slideAcceleration, slides, weightComponents, maxStaticFriction } from "@/lib/physics/incline";
import { deg2rad, rad2deg } from "@/lib/physics/trig";
import { useSimClock, type SimProps } from "./useSimClock";
import { Arrow, DragHandle, useSvgDrag } from "./drag";

const BX = 110;
const BY = 292;
const LEN = 390; // px along the slope
const PX_PER_M = 80;

export function InclineSim({ params, runKey, onFinish, setParam }: SimProps) {
  const { theta, mu, m } = params;
  const svg = useRef<SVGSVGElement>(null);
  const th = deg2rad(theta);
  const top = { x: BX + LEN * Math.cos(th), y: BY - LEN * Math.sin(th) };
  const slipping = slides(theta, mu);
  const a = slideAcceleration(theta, mu);
  const startS = LEN * 0.72; // box position along the slope, px from the bottom
  const tSlide = slipping ? Math.sqrt((2 * (startS - 30) / PX_PER_M) / Math.max(a, 1e-6)) : 1;
  const duration = Math.min(Math.max(tSlide, 0.6), 4);
  const { t } = useSimClock(runKey, duration, 1, onFinish);
  const moved = runKey > 0 && slipping ? Math.min(startS - 30, 0.5 * a * t * t * PX_PER_M) : 0;
  const s = startS - moved;
  const cx = BX + s * Math.cos(th);
  const cy = BY - s * Math.sin(th);
  // unit vectors: down the slope, and out of the surface
  const down = { x: -Math.cos(th), y: Math.sin(th) };
  const out = { x: -Math.sin(th), y: -Math.cos(th) };
  const box = 46;
  const center = { x: cx + out.x * (box / 2), y: cy + out.y * (box / 2) };

  const { along, normal } = weightComponents(m, theta);
  const fMax = maxStaticFriction(mu, normal);
  const friction = slipping ? fMax : along;
  const k = 70 / (m * 9.8); // weight arrow is always 70 px; others scale with it

  const drag = useSvgDrag(svg, setParam ? (x, y) => setParam("theta", rad2deg(Math.atan2(BY - y, x - BX))) : undefined);

  return (
    <svg ref={svg} viewBox="0 0 800 330" className="block h-auto w-full touch-none select-none" role="img" aria-label={`صندوق على منحدر بزاوية ${theta} درجة ومعامل احتكاك ${mu}`}>
      <rect width="800" height="330" fill="var(--surface-simulation)" />
      <rect y={BY} width="800" height="40" fill="#d9dee9" />
      {/* ramp */}
      <polygon points={`${BX},${BY} ${top.x},${BY} ${top.x},${top.y}`} fill="#cfd6e4" stroke="#9aa5b8" strokeWidth="2" />
      <path d={`M${BX + 70} ${BY} A70 70 0 0 0 ${BX + 70 * Math.cos(th)} ${BY - 70 * Math.sin(th)}`} fill="none" stroke="var(--brand-primary)" strokeWidth="3" />
      <text x={BX + 80} y={BY - 12} fontSize="15" fontFamily="var(--font-latin)" fontWeight="700" fill="var(--brand-primary)">θ = {theta}°</text>
      {/* box */}
      <g transform={`translate(${center.x}, ${center.y}) rotate(${-theta})`}>
        <rect x={-box / 2} y={-box / 2} width={box} height={box} rx="6" fill={slipping && runKey > 0 ? "var(--danger)" : "var(--brand-insight)"} stroke="#172234" strokeWidth="2" />
        <text x="0" y="5" textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="var(--font-latin)" fill="#172234">{m} kg</text>
      </g>
      {/* free-body diagram */}
      <Arrow x1={center.x} y1={center.y} x2={center.x} y2={center.y + 70} color="var(--foreground)" width={3} />
      <Arrow x1={center.x} y1={center.y} x2={center.x + down.x * along * k} y2={center.y + down.y * along * k} color="var(--text-secondary)" width={2.5} dashed />
      <Arrow x1={center.x} y1={center.y} x2={center.x - out.x * normal * k} y2={center.y - out.y * normal * k} color="var(--text-secondary)" width={2.5} dashed />
      <Arrow x1={center.x} y1={center.y} x2={center.x + out.x * normal * k} y2={center.y + out.y * normal * k} color="var(--brand-discovery)" width={3} />
      <Arrow x1={center.x} y1={center.y} x2={center.x - down.x * friction * k} y2={center.y - down.y * friction * k} color="var(--brand-insight-dark)" width={3} />
      <g fontFamily="var(--font-latin)" fontSize="12" fontWeight="700">
        <text x={center.x + 6} y={center.y + 84} fill="var(--foreground)">W = mg</text>
        <text x={center.x + down.x * along * k - 6} y={center.y + down.y * along * k + 4} textAnchor="end" fill="var(--text-secondary)">mg sinθ</text>
        <text x={center.x + out.x * normal * k - 8} y={center.y + out.y * normal * k - 8} fill="var(--brand-discovery-dark)">N</text>
        <text x={center.x - down.x * friction * k + 8} y={center.y - down.y * friction * k - 6} fill="var(--brand-insight-dark)">f</text>
      </g>
      {/* legend */}
      <g fontSize="12" fontFamily="var(--font-latin)">
        <rect x="560" y="24" width="220" height="92" rx="12" fill="#fff" stroke="var(--border)" strokeWidth="2" />
        <text x="575" y="46" fill="var(--text-secondary)">mg sinθ = {along.toFixed(1)} N</text>
        <text x="575" y="66" fill="var(--brand-insight-dark)">f max = μN = {fMax.toFixed(1)} N</text>
        <text x="575" y="86" fill="var(--brand-discovery-dark)">N = mg cosθ = {normal.toFixed(1)} N</text>
        <text x="575" y="106" fill={slipping ? "var(--danger)" : "var(--brand-discovery-dark)"} fontWeight="700">{slipping ? "slides ↓" : "at rest"}</text>
      </g>
      <DragHandle x={top.x} y={top.y} bind={drag} active={!!setParam} label="ramp" />
      {setParam && <text x="20" y="26" fontSize="13" fill="var(--text-secondary)">اسحب قمة المنحدر لتغيير الميل</text>}
    </svg>
  );
}
