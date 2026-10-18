"use client";
import { Wind } from "lucide-react";
import { centripetalAcceleration, maxSafeSpeed } from "@/lib/physics/circular";
import { useSimClock, type SimProps } from "./useSimClock";

const CX = 400;
const CY = 330;

export function CircularRoadSim({ params, runKey, onFinish }: SimProps) {
  const { v, r, mu } = params;
  const vmax = maxSafeSpeed(mu, r);
  const safe = v <= vmax;
  const ac = centripetalAcceleration(v, r);
  const R = 90 + ((r - 20) / 130) * 190; // pixels
  const arcLen = Math.PI * r; // physical half-circle
  // Unsafe cars lose grip a third of the way around and slide off tangentially.
  const skidAt = Math.PI / 3;
  const tTotal = arcLen / v;
  const tSkid = (skidAt * r) / v;
  const duration = safe ? tTotal : tSkid + 1.2;
  const { t } = useSimClock(runKey, duration, Math.max(1, duration / 3), onFinish);

  let px: number, py: number, heading: number;
  let skidding = false;
  if (safe || t < tSkid) {
    const theta = Math.PI - (v * t) / r; // from left (π) over the top to right (0)
    px = CX + R * Math.cos(theta);
    py = CY - R * Math.sin(theta);
    heading = theta - Math.PI / 2;
  } else {
    skidding = true;
    const theta = Math.PI - skidAt;
    const ex = CX + R * Math.cos(theta);
    const ey = CY - R * Math.sin(theta);
    heading = theta - Math.PI / 2;
    const d = (t - tSkid) * v * (R / r);
    px = ex + Math.cos(heading) * d;
    py = ey - Math.sin(heading) * d;
  }
  const tx = Math.cos(heading);
  const ty = -Math.sin(heading);
  const toC = { x: CX - px, y: CY - py };
  const len = Math.hypot(toC.x, toC.y) || 1;
  const aLen = Math.min(140, 12 + ac * 6);
  const vLen = 20 + v * 3;
  const deg = (-heading * 180) / Math.PI;

  return (
    <svg viewBox="0 0 800 360" className="block h-auto w-full" role="img" aria-label={`عربية بسرعة ${v} م/ث على منحنى نصف قطره ${r} م`}>
      <defs>
        <marker id="arrV" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--brand-discovery)" />
        </marker>
        <marker id="arrA" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="5" markerHeight="5" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="var(--brand-primary)" />
        </marker>
      </defs>
      <rect width="800" height="360" fill="#e3f1e6" />
      <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} stroke="#3b4558" strokeWidth="44" fill="none" />
      <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} stroke="#fff" strokeWidth="2" strokeDasharray="14 12" fill="none" opacity="0.7" />
      <circle cx={CX} cy={CY} r="5" fill="var(--text-muted)" />
      <line x1={CX} y1={CY} x2={CX + R * Math.cos(Math.PI * 0.25)} y2={CY - R * Math.sin(Math.PI * 0.25)} stroke="var(--text-muted)" strokeDasharray="4 4" />
      <text x={CX + 10 + (R / 2) * Math.cos(Math.PI * 0.25)} y={CY - (R / 2) * Math.sin(Math.PI * 0.25)} fontSize="14" fill="var(--text-secondary)" fontFamily="var(--font-latin)">
        r = {r} m
      </text>
      {/* vectors */}
      <line x1={px} y1={py} x2={px + tx * vLen} y2={py + ty * vLen} stroke="var(--brand-discovery)" strokeWidth="4" markerEnd="url(#arrV)" />
      {!skidding && (
        <line x1={px} y1={py} x2={px + (toC.x / len) * aLen} y2={py + (toC.y / len) * aLen} stroke="var(--brand-primary)" strokeWidth="4" markerEnd="url(#arrA)" />
      )}
      <g transform={`translate(${px}, ${py}) rotate(${deg})`}>
        <rect x="-16" y="-9" width="32" height="18" rx="6" fill={skidding ? "var(--danger)" : "var(--brand-insight)"} stroke="#172234" strokeWidth="2" />
        <rect x="4" y="-6" width="7" height="12" rx="2" fill="#dfe3ff" />
      </g>
      {skidding && (
        <Wind x={px + 10} y={py - 40} width={28} height={28} color="var(--text-secondary)" strokeWidth={2.5} aria-label="انزلاق" />
      )}
      <g fontFamily="var(--font-latin)" fontSize="14">
        <rect x="14" y="14" width="210" height="76" rx="12" fill="#fff" stroke="var(--border)" strokeWidth="2" />
        <text x="26" y="38" fill="var(--brand-discovery-dark)" fontWeight="700">v = {v} m/s</text>
        <text x="26" y="58" fill="var(--brand-primary)" fontWeight="700">a = v²/r = {ac.toFixed(2)} m/s²</text>
        <text x="26" y="78" fill="var(--text-secondary)">μg = {(mu * 9.8).toFixed(2)} m/s²</text>
      </g>
    </svg>
  );
}
