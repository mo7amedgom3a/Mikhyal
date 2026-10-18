"use client";
import { useRef } from "react";
import { netTorque } from "@/lib/physics/moments";
import { useSimClock, type SimProps } from "./useSimClock";
import { Arrow, DragHandle, useSvgDrag } from "./drag";

const PX = 400;
const PY = 232;
const S = 120; // px per metre
const HALF = 2.6; // m

function Person({ x, y, m, color }: { x: number; y: number; m: number; color: string }) {
  const h = 26 + m * 0.55;
  const w = 16 + m * 0.22;
  return (
    <g>
      <circle cx={x} cy={y - h - 13} r="12" fill={color} />
      <rect x={x - w / 2} y={y - h} width={w} height={h} rx={w / 2.5} fill={color} />
      <text x={x} y={y - h / 2 + 4} textAnchor="middle" fontSize="12" fontWeight="700" fontFamily="var(--font-latin)" fill="#fff">{m}</text>
    </g>
  );
}

export function MomentsSim({ params, runKey, onFinish, setParam }: SimProps) {
  const { m1, d1, m2, d2 } = params;
  const svg = useRef<SVGSVGElement>(null);
  const tau = netTorque(m1, d1, m2, d2);
  const target = Math.max(-14, Math.min(14, tau / 40)); // degrees; clockwise when the right side wins
  const { t } = useSimClock(runKey, 1.2, 1, onFinish);
  const ease = runKey > 0 ? 1 - Math.pow(1 - Math.min(1, t / 1.2), 3) : 0;
  const tilt = target * ease;
  const r = (tilt * Math.PI) / 180;
  const along = (s: number) => ({ x: PX + s * S * Math.cos(r), y: PY + s * S * Math.sin(r) });
  const left = along(-d1);
  const right = along(d2);
  const ends = [along(-HALF), along(HALF)];

  const dragLeft = useSvgDrag(svg, setParam ? (x) => setParam("d1", (PX - x) / S) : undefined);
  const dragRight = useSvgDrag(svg, setParam ? (x) => setParam("d2", (x - PX) / S) : undefined);
  const L = m1 * d1;
  const Rm = m2 * d2;
  const scale = 1.1;

  return (
    <svg ref={svg} viewBox="0 0 800 330" className="block h-auto w-full touch-none select-none" role="img" aria-label={`أرجوحة: ${m1} كجم على بعد ${d1} م و ${m2} كجم على بعد ${d2} م`}>
      <rect width="800" height="330" fill="var(--surface-simulation)" />
      <rect y="290" width="800" height="40" fill="#d9dee9" />
      {/* ruler */}
      {[-2, -1, 0, 1, 2].map((m) => (
        <g key={m} fontFamily="var(--font-latin)" fontSize="11" fill="var(--text-muted)">
          <line x1={PX + m * S} y1={300} x2={PX + m * S} y2={308} stroke="var(--text-muted)" />
          <text x={PX + m * S} y={322} textAnchor="middle">{Math.abs(m)}m</text>
        </g>
      ))}
      {/* pivot */}
      <polygon points={`${PX},${PY + 6} ${PX - 34},290 ${PX + 34},290`} fill="#6b7a99" />
      {/* beam */}
      <line x1={ends[0].x} y1={ends[0].y} x2={ends[1].x} y2={ends[1].y} stroke="var(--brand-insight-dark)" strokeWidth="12" strokeLinecap="round" />
      <circle cx={PX} cy={PY} r="6" fill="var(--foreground)" />
      <Person x={left.x} y={left.y - 6} m={m1} color="var(--brand-discovery)" />
      <Person x={right.x} y={right.y - 6} m={m2} color="var(--brand-primary)" />
      {/* distance labels */}
      <g fontFamily="var(--font-latin)" fontSize="13" fontWeight="700">
        <text x={(PX + left.x) / 2} y={PY + 30} textAnchor="middle" fill="var(--brand-discovery-dark)">d₁ = {d1} m</text>
        <text x={(PX + right.x) / 2} y={PY + 30} textAnchor="middle" fill="var(--brand-primary)">d₂ = {d2} m</text>
      </g>
      <DragHandle x={left.x} y={left.y} bind={dragLeft} active={!!setParam} color="var(--brand-discovery)" label="left" />
      <DragHandle x={right.x} y={right.y} bind={dragRight} active={!!setParam} label="right" />
      {/* torque bars */}
      <g fontFamily="var(--font-latin)" fontSize="12">
        <text x="20" y="26" fill="var(--text-secondary)" fontWeight="700">عزم كل جهة (kg·m)</text>
        <rect x="20" y="36" width={Math.min(260, L * scale)} height="14" rx="7" fill="var(--brand-discovery)" />
        <text x={28 + Math.min(260, L * scale)} y="48" fill="var(--brand-discovery-dark)">m₁d₁ = {L.toFixed(0)}</text>
        <rect x="20" y="58" width={Math.min(260, Rm * scale)} height="14" rx="7" fill="var(--brand-primary)" />
        <text x={28 + Math.min(260, Rm * scale)} y="70" fill="var(--brand-primary)">m₂d₂ = {Rm.toFixed(0)}</text>
      </g>
      {runKey > 0 && Math.abs(target) > 0.2 && (
        <Arrow x1={PX + (target > 0 ? 60 : -60)} y1={PY - 70} x2={PX + (target > 0 ? 110 : -110)} y2={PY - 50} color="var(--danger)" width={3} />
      )}
      {setParam && <text x="780" y="26" textAnchor="end" fontSize="13" fill="var(--text-secondary)">اسحب كل شخص على العارضة</text>}
    </svg>
  );
}
