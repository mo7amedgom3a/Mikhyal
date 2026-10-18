"use client";
import { useRef } from "react";
import { deg2rad, rad2deg } from "@/lib/physics/trig";
import { useSimClock, type SimProps } from "./useSimClock";
import { DragHandle, useSvgDrag } from "./drag";

const GROUND = 330;
const TOWER_X = 720;
const TOWER_H = 187; // Cairo Tower, metres
const S = 1.55; // px per metre — one scale for both axes so angles are true
const AIM_R = 150;

export function ElevationSim({ params, runKey, onFinish, setParam }: SimProps) {
  const { d, theta } = params;
  const svg = useRef<SVGSVGElement>(null);
  const ox = TOWER_X - d * S;
  const th = deg2rad(theta);
  const sightAtTower = d * Math.tan(th); // metres
  const hit = Math.abs(sightAtTower - TOWER_H) <= 3;
  const { t } = useSimClock(runKey, 1.2, 1, onFinish);
  const beam = runKey > 0 ? Math.min(1, t / 1) : 0;

  const aimX = ox + AIM_R * Math.cos(th);
  const aimY = GROUND - AIM_R * Math.sin(th);
  const farX = 790;
  const farY = GROUND - (farX - ox) * Math.tan(th);
  const crossY = GROUND - sightAtTower * S;

  const dragObserver = useSvgDrag(svg, setParam ? (x) => setParam("d", (TOWER_X - x) / S) : undefined);
  const dragAim = useSvgDrag(svg, setParam ? (x, y) => setParam("theta", rad2deg(Math.atan2(GROUND - y, x - ox))) : undefined);

  return (
    <svg ref={svg} viewBox="0 0 800 360" className="block h-auto w-full touch-none select-none" role="img" aria-label={`راصد على بعد ${d} متر من برج القاهرة وزاوية الارتفاع ${theta} درجة`}>
      <defs>
        <linearGradient id="elev-sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#e9edff" />
          <stop offset="1" stopColor="#f8faf9" />
        </linearGradient>
      </defs>
      <rect width="800" height="360" fill="url(#elev-sky)" />
      <rect y={GROUND} width="800" height="30" fill="#d9dee9" />
      {/* distance ruler */}
      {[0, 100, 200, 300, 400].map((m) => (
        <g key={m} fontFamily="var(--font-latin)" fontSize="11" fill="var(--text-muted)">
          <line x1={TOWER_X - m * S} y1={GROUND} x2={TOWER_X - m * S} y2={GROUND + 8} stroke="var(--text-muted)" />
          <text x={TOWER_X - m * S} y={GROUND + 22} textAnchor="middle">{m}m</text>
        </g>
      ))}
      {/* Cairo Tower silhouette (lattice shaft + lotus top) */}
      <g>
        <path d={`M${TOWER_X - 9} ${GROUND} L${TOWER_X - 6} ${GROUND - TOWER_H * S + 30} L${TOWER_X + 6} ${GROUND - TOWER_H * S + 30} L${TOWER_X + 9} ${GROUND} Z`} fill="#6b7a99" />
        <path d={`M${TOWER_X - 16} ${GROUND - TOWER_H * S + 34} Q${TOWER_X} ${GROUND - TOWER_H * S + 10} ${TOWER_X + 16} ${GROUND - TOWER_H * S + 34} Z`} fill="#56637f" />
        <rect x={TOWER_X - 3} y={GROUND - TOWER_H * S} width="6" height="12" fill="#56637f" />
        <circle cx={TOWER_X} cy={GROUND - TOWER_H * S} r="5" fill={hit ? "var(--brand-discovery)" : "var(--brand-insight)"} />
        <text x={TOWER_X + 14} y={GROUND - TOWER_H * S + 4} fontSize="13" fill="var(--text-secondary)">برج القاهرة</text>
      </g>
      {/* right triangle when aimed */}
      <polygon points={`${ox},${GROUND} ${TOWER_X},${GROUND} ${TOWER_X},${Math.max(crossY, 0)}`} fill={hit ? "rgba(18,168,137,0.12)" : "rgba(81,70,232,0.06)"} />
      <line x1={TOWER_X} y1={GROUND} x2={TOWER_X} y2={Math.max(crossY, 0)} stroke="var(--brand-primary)" strokeDasharray="6 5" strokeWidth="2" />
      <text x={(ox + TOWER_X) / 2} y={GROUND - 8} textAnchor="middle" fontSize="14" fontFamily="var(--font-latin)" fontWeight="700" fill="var(--brand-primary)">d = {d} m</text>
      {/* line of sight */}
      <line x1={ox} y1={GROUND} x2={farX} y2={farY} stroke={hit ? "var(--brand-discovery)" : "var(--brand-insight-dark)"} strokeWidth="2.5" strokeDasharray="10 7" />
      {beam > 0 && <line x1={ox} y1={GROUND} x2={ox + (TOWER_X - ox) * beam} y2={GROUND - (TOWER_X - ox) * beam * Math.tan(th)} stroke={hit ? "var(--brand-discovery)" : "var(--danger)"} strokeWidth="5" strokeLinecap="round" />}
      {/* protractor */}
      <path d={`M${ox + 60} ${GROUND} A60 60 0 0 0 ${ox + 60 * Math.cos(th)} ${GROUND - 60 * Math.sin(th)}`} fill="none" stroke="var(--brand-primary)" strokeWidth="3" />
      <text x={ox + 72 * Math.cos(th / 2)} y={GROUND - 72 * Math.sin(th / 2) + 5} fontSize="16" fontFamily="var(--font-latin)" fontWeight="700" fill="var(--brand-primary)">θ = {theta}°</text>
      {/* observer */}
      <g>
        <circle cx={ox} cy={GROUND - 34} r="8" fill="var(--foreground)" />
        <line x1={ox} y1={GROUND - 26} x2={ox} y2={GROUND - 6} stroke="var(--foreground)" strokeWidth="4" strokeLinecap="round" />
      </g>
      <DragHandle x={ox} y={GROUND} bind={dragObserver} active={!!setParam} label="observer" />
      <DragHandle x={aimX} y={aimY} bind={dragAim} active={!!setParam} color="var(--brand-insight-dark)" label="aim" />
      {setParam && (
        <text x="20" y="28" fontSize="13" fill="var(--text-secondary)">اسحب الراصد يمين وشمال، واسحب خط النظر لحد ما يلمس القمة</text>
      )}
    </svg>
  );
}
