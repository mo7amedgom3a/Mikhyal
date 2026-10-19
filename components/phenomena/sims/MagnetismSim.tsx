"use client";
import { useRef, useState } from "react";
import { compassDeflectionDeg, wireField } from "@/lib/physics/phenomena";
import { DragHandle, useSvgDrag } from "@/components/sims/drag";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { param, sci, SimFrame, Slider, useObservations } from "./SimFrame";
import { useAnimationFrame } from "./useAnimationFrame";

const W = 560;
const H = 360;
const CX = 280;
const CY = 180;
/** 100 px on screen = 5 cm. */
const M_PER_PX = 0.0005;
const B_EARTH = 4e-5;

export function MagnetismSim() {
  const [I, setI] = useState(10);
  const [pos, setPos] = useState({ x: CX + 100, y: CY });
  const [phase, setPhase] = useState(0);
  const [playing, setPlaying] = useState(true);
  const reduced = usePrefersReducedMotion();
  const svg = useRef<SVGSVGElement>(null);
  const bind = useSvgDrag(svg, (x, y) => {
    const dx = x - CX;
    const dy = y - CY;
    const r = Math.max(40, Math.min(160, Math.hypot(dx, dy)));
    const a = Math.atan2(dy, dx);
    setPos({ x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) });
  });
  useAnimationFrame((dt) => setPhase((p) => (p + dt * I * 4) % 1000), playing && !reduced && I !== 0);

  const rPx = Math.hypot(pos.x - CX, pos.y - CY);
  const r = rPx * M_PER_PX;
  const B = wireField(Math.abs(I), r);
  // Current out of the page: the field circulates counter-clockwise as seen from above (SVG y points down).
  const tx = ((pos.y - CY) / rPx) * Math.sign(I);
  const ty = (-(pos.x - CX) / rPx) * Math.sign(I);
  const bx = B * tx;
  const by = B * ty - B_EARTH; // Earth's field points to geographic north = up
  const needle = Math.atan2(by, bx);
  const deflection = I === 0 ? 0 : compassDeflectionDeg(B);

  const obs = useObservations([
    { id: "strong", label: "خلّي التيار $20\\,\\mathrm{A}$ وشوف الإبرة بتلف أكتر", met: Math.abs(I) >= 19.5 },
    { id: "far", label: "ابعد البوصلة لـ $8\\,\\mathrm{cm}$: المجال بيقل", met: r >= 0.075 },
    { id: "reverse", label: "اعكس اتجاه التيار: الدواير والإبرة بيعكسوا", met: I < 0 },
  ]);

  const rings = [36, 62, 92, 126, 164];
  return (
    <SimFrame
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onReset={() => {
        setI(10);
        setPos({ x: CX + 100, y: CY });
      }}
      stage={
        <svg ref={svg} viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="منظر علوي لسلك فيه تيار وحواليه دواير مجال مغناطيسي وبوصلة">
          <text x="16" y="26" fontSize="13" fill="#64748b">
            N ↑ (مجال الأرض)
          </text>
          {rings.map((rr) => {
            const strength = Math.min(1, (Math.abs(I) / 20) * (60 / rr));
            const circ = 2 * Math.PI * rr;
            return (
              <circle
                key={rr}
                cx={CX}
                cy={CY}
                r={rr}
                fill="none"
                stroke="#5146e8"
                strokeOpacity={0.12 + 0.75 * strength}
                strokeWidth={1.5 + 2 * strength}
                strokeDasharray={`${circ / 18} ${circ / 18}`}
                strokeDashoffset={(I >= 0 ? 1 : -1) * phase * (60 / rr) * 3}
              />
            );
          })}
          {I !== 0 &&
            rings.slice(0, 3).map((rr) => {
              // Arrowhead on each ring showing the circulation (right-hand rule).
              const a = -Math.PI / 4;
              const x = CX + rr * Math.cos(a);
              const y = CY + rr * Math.sin(a);
              const dir = Math.sign(I);
              const ux = Math.sin(a) * dir;
              const uy = -Math.cos(a) * dir;
              return <polygon key={rr} points={`${x + ux * 9},${y + uy * 9} ${x - uy * 6},${y + ux * 6} ${x + uy * 6},${y - ux * 6}`} fill="#5146e8" />;
            })}
          <circle cx={CX} cy={CY} r="16" fill="#f4b544" stroke="#b7790a" strokeWidth="3" />
          {I > 0 && <circle cx={CX} cy={CY} r="4" fill="#111827" />}
          {I < 0 && <path d={`M${CX - 7},${CY - 7} L${CX + 7},${CY + 7} M${CX + 7},${CY - 7} L${CX - 7},${CY + 7}`} stroke="#111827" strokeWidth="3" />}
          <text x="16" y="46" fontSize="13" fill="#64748b">
            {I > 0 ? "التيار طالع من الصفحة ⊙" : I < 0 ? "التيار داخل في الصفحة ⊗" : "مافيش تيار"}
          </text>
          <line x1={CX} y1={CY} x2={pos.x} y2={pos.y} stroke="#94a3b8" strokeDasharray="4 4" />
          <text x={(CX + pos.x) / 2} y={(CY + pos.y) / 2 + 18} fontSize="12" fill="#475569" textAnchor="middle" paintOrder="stroke" stroke="#f4f6fb" strokeWidth="4">
            r = {(r * 100).toFixed(1)} cm
          </text>
          <g transform={`translate(${pos.x},${pos.y})`}>
            <circle r="30" fill="#fff" stroke="#334155" strokeWidth="2" />
            <g transform={`rotate(${(needle * 180) / Math.PI})`} style={{ transition: reduced ? undefined : "transform 0.35s ease-out" }}>
              <polygon points="26,0 0,-6 0,6" fill="#e5484d" />
              <polygon points="-26,0 0,-6 0,6" fill="#94a3b8" />
            </g>
          </g>
          <DragHandle x={pos.x} y={pos.y + 44} bind={bind} active label="compass" />
        </svg>
      }
      controls={<Slider param={param("I", "التيار", "I", -20, 20, 1, "A", 10)} value={I} onChange={setI} />}
      readouts={[
        { label: "مجال السلك", tex: `B = ${sci(B * 1e6)}\\,\\mu\\mathrm{T}` },
        { label: "مجال الأرض", tex: "B_E = 40\\,\\mu\\mathrm{T}" },
        { label: "انحراف الإبرة", tex: `${deflection.toFixed(0)}^\\circ`, tone: deflection > 30 ? "good" : "default" },
      ]}
      notice={
        I === 0
          ? "من غير تيار الإبرة بتشاور على الشمال (مجال الأرض بس)."
          : `الإبرة بتشاور على اتجاه المحصلة بين مجال الأرض ومجال السلك. لما $B_{سلك} = B_E$ الانحراف $45^\\circ$ — ده حصل عند $r \\approx ${((wireField(Math.abs(I), 1) / B_EARTH) * 100).toFixed(1)}\\,\\mathrm{cm}$.`
      }
      observations={obs}
      howItWorks={[
        "الشحنات المتحركة في السلك بتعمل مجال مغناطيسي على شكل دواير حوالين السلك.",
        "الاتجاه بقاعدة اليد اليمنى: الإبهام مع التيار، والصوابع بتلف مع المجال.",
        "الشدة $B = \\frac{\\mu_0 I}{2\\pi r}$: تضاعف التيار ← تضاعف المجال، تضاعف البعد ← نص المجال.",
        "البوصلة بتتأثر بمجال الأرض ومجال السلك مع بعض، فبتلف لاتجاه المحصلة.",
      ]}
    />
  );
}
