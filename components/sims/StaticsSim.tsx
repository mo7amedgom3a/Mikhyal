"use client";
import { useRef } from "react";
import { symmetricTension } from "@/lib/physics/statics";
import { deg2rad, rad2deg } from "@/lib/physics/trig";
import { useSimClock, type SimProps } from "./useSimClock";
import { Arrow, DragHandle, useSvgDrag } from "./drag";

const CEIL = 34;
const CX = 330;
const CABLE = 230; // px, fixed cable length
export const SIGN_W = 400;
export const T_MAX = 400;

function tensionColor(ratio: number) {
  if (ratio > 1) return "var(--danger)";
  if (ratio > 0.85) return "var(--brand-insight-dark)";
  return "var(--brand-discovery)";
}

export function StaticsSim({ params, runKey, onFinish, setParam }: SimProps) {
  const { theta } = params;
  const svg = useRef<SVGSVGElement>(null);
  const th = deg2rad(theta);
  const T = symmetricTension(SIGN_W, theta);
  const ratio = T / T_MAX;
  const half = CABLE * Math.cos(th);
  const drop = CABLE * Math.sin(th);
  const snaps = ratio > 1;
  const { t } = useSimClock(runKey, 1.4, 1, onFinish);
  const fall = runKey > 0 && snaps ? Math.max(0, t - 0.35) : 0;
  const knotX = CX + (fall > 0 ? fall * 60 : 0);
  const knotY = CEIL + drop + (fall > 0 ? 0.5 * 9.8 * fall * fall * 90 : 0);

  const drag = useSvgDrag(svg, setParam ? (x) => {
    const h = Math.min(CABLE * 0.985, Math.max(CABLE * 0.17, Math.abs(x - CX)));
    setParam("theta", rad2deg(Math.acos(h / CABLE)));
  } : undefined);

  // Triangle of forces (head to tail), scaled to fit the inset.
  const wLen = 70;
  const tLen = (wLen / 2) / Math.sin(th);
  const k = Math.min(1, 105 / tLen);
  const P0 = { x: 650, y: 90 };
  const P1 = { x: P0.x, y: P0.y + wLen * k };
  const P2 = { x: P1.x - tLen * k * Math.cos(th), y: P1.y - tLen * k * Math.sin(th) };

  return (
    <svg ref={svg} viewBox="0 0 800 330" className="block h-auto w-full touch-none select-none" role="img" aria-label={`لافتة وزنها 400 نيوتن على كابلين بزاوية ${theta} درجة، الشد ${T.toFixed(0)} نيوتن`}>
      <rect width="800" height="330" fill="var(--surface-simulation)" />
      {/* ceiling / shop front */}
      <rect x="40" y="0" width="580" height={CEIL} fill="#cfd6e4" />
      {Array.from({ length: 15 }, (_, i) => (
        <line key={i} x1={50 + i * 38} y1={CEIL} x2={64 + i * 38} y2={CEIL - 14} stroke="#9aa5b8" strokeWidth="2" />
      ))}
      {/* cables */}
      <line x1={CX - half} y1={CEIL} x2={knotX} y2={knotY} stroke={tensionColor(ratio)} strokeWidth="4" />
      {!(fall > 0) && <line x1={CX + half} y1={CEIL} x2={knotX} y2={knotY} stroke={tensionColor(ratio)} strokeWidth="4" />}
      {fall > 0 && <line x1={CX + half} y1={CEIL} x2={CX + half - 20} y2={CEIL + 40} stroke="var(--danger)" strokeWidth="4" />}
      {/* sign */}
      <g transform={`translate(${knotX}, ${knotY}) rotate(${fall * 40})`}>
        <line x1="0" y1="0" x2="0" y2="14" stroke="#6b7a99" strokeWidth="3" />
        <rect x="-70" y="14" width="140" height="44" rx="8" fill="var(--brand-primary)" stroke="var(--brand-primary-edge)" strokeWidth="3" />
        <text x="0" y="43" textAnchor="middle" fontSize="16" fontWeight="700" fill="#fff">مِخيال</text>
      </g>
      <Arrow x1={knotX} y1={knotY + 62} x2={knotX} y2={knotY + 100} color="var(--foreground)" width={3} />
      <text x={knotX + 8} y={knotY + 98} fontSize="13" fontFamily="var(--font-latin)" fontWeight="700" fill="var(--foreground)">W = {SIGN_W} N</text>
      {/* angle marker */}
      <path d={`M${CX - half + 50} ${CEIL} A50 50 0 0 1 ${CX - half + 50 * Math.cos(th)} ${CEIL + 50 * Math.sin(th)}`} fill="none" stroke="var(--brand-primary)" strokeWidth="3" />
      <text x={CX - half + 30} y={CEIL - 10} fontSize="15" fontFamily="var(--font-latin)" fontWeight="700" fill="var(--brand-primary)">θ = {theta}°</text>
      {/* tension gauges */}
      {[CX - half, CX + half].map((ax, i) => (
        <g key={i} fontFamily="var(--font-latin)" fontSize="13" fontWeight="700">
          <text x={(ax + CX) / 2 + (i ? 14 : -14)} y={CEIL + drop / 2 + 22} textAnchor={i ? "start" : "end"} fill={tensionColor(ratio)}>
            T = {T.toFixed(0)} N
          </text>
        </g>
      ))}
      <DragHandle x={CX - half} y={CEIL} bind={drag} active={!!setParam} label="anchor-left" />
      <DragHandle x={CX + half} y={CEIL} bind={drag} active={!!setParam} label="anchor-right" />
      {/* triangle of forces inset */}
      <g>
        <rect x="560" y="40" width="220" height="250" rx="14" fill="#fff" stroke="var(--border)" strokeWidth="2" />
        <text x="670" y="66" textAnchor="middle" fontSize="13" fontWeight="700" fill="var(--text-secondary)">مثلث القوى (مقفول = اتزان)</text>
        <Arrow x1={P0.x} y1={P0.y} x2={P1.x} y2={P1.y} color="var(--foreground)" width={3} />
        <Arrow x1={P1.x} y1={P1.y} x2={P2.x} y2={P2.y} color={tensionColor(ratio)} width={3} />
        <Arrow x1={P2.x} y1={P2.y} x2={P0.x} y2={P0.y} color={tensionColor(ratio)} width={3} />
        <text x={P0.x + 8} y={(P0.y + P1.y) / 2} fontSize="12" fontFamily="var(--font-latin)" fill="var(--foreground)">W</text>
        <text x={(P1.x + P2.x) / 2 - 18} y={(P1.y + P2.y) / 2 + 14} fontSize="12" fontFamily="var(--font-latin)" fill="var(--text-secondary)">T₁</text>
        <text x={(P2.x + P0.x) / 2 - 18} y={(P2.y + P0.y) / 2 - 4} fontSize="12" fontFamily="var(--font-latin)" fill="var(--text-secondary)">T₂</text>
        <text x="670" y="276" textAnchor="middle" fontSize="12" fontFamily="var(--font-latin)" fill="var(--text-muted)">T_max = {T_MAX} N</text>
      </g>
      {setParam && <text x="50" y="318" fontSize="13" fill="var(--text-secondary)">اسحب نقط تعليق الكابلات — الزاوية بتتغير والشد معاها</text>}
    </svg>
  );
}
