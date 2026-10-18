"use client";
import { Circle, Coordinates, LaTeX, Mafs, MovablePoint, Vector } from "mafs";
import "mafs/core.css";
import { CircleCheck } from "lucide-react";
import { fromPolar, type Vec2 } from "@/lib/physics/vectors";
import { moveForce, type ForceSolution, type ForceState } from "@/lib/sandbox/forces/model";
import type { SandboxApi } from "@/lib/sandbox/useSandbox";

const COLORS = ["var(--brand-primary)", "var(--brand-discovery)", "#c2410c", "#7c3aed"];

/** Head-to-tail force polygon: it closes exactly when the ring is in equilibrium. */
function ForcePolygon({ state, solution }: { state: ForceState; solution: ForceSolution }) {
  const k = 9;
  let p: Vec2 = [0, 0];
  const pts: Vec2[] = [p];
  for (const f of state.forces) {
    const v = fromPolar(f.magnitude, f.angle);
    p = [p[0] + v[0], p[1] + v[1]];
    pts.push(p);
  }
  const xs = pts.map((q) => q[0]);
  const ys = pts.map((q) => q[1]);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2;
  const cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const T = ([x, y]: Vec2) => [110 + (x - cx) * k, 110 - (y - cy) * k];
  return (
    <svg viewBox="0 0 220 220" className="h-auto w-full" role="img" aria-label={solution.equilibrium ? "مضلع القوى مقفول" : "مضلع القوى مفتوح"}>
      <rect width="220" height="220" rx="16" fill="var(--surface-simulation)" />
      {state.forces.map((f, i) => {
        const [x1, y1] = T(pts[i]);
        const [x2, y2] = T(pts[i + 1]);
        return <line key={f.id} x1={x1} y1={y1} x2={x2} y2={y2} stroke={f.locked ? "#172234" : COLORS[i % COLORS.length]} strokeWidth="4" strokeLinecap="round" />;
      })}
      {!solution.equilibrium && (() => {
        const [x1, y1] = T(pts[pts.length - 1]);
        const [x2, y2] = T(pts[0]);
        return <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--danger)" strokeWidth="2.5" strokeDasharray="6 5" />;
      })()}
      <circle cx={T(pts[0])[0]} cy={T(pts[0])[1]} r="5" fill="#172234" />
    </svg>
  );
}

export function ForceBoard({ api }: { api: SandboxApi<ForceState, ForceSolution> }) {
  const { state, solution, commit } = api;
  const ringOffset: Vec2 = solution.equilibrium ? [0, 0] : [Math.max(-1.2, Math.min(1.2, solution.resultant[0] * 0.15)), Math.max(-1.2, Math.min(1.2, solution.resultant[1] * 0.15))];
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_220px]">
      <div dir="ltr" className="mafs-mikhyal overflow-hidden rounded-[20px] border-2 border-border">
        <Mafs height={400} viewBox={{ x: [-11, 11], y: [-11, 11] }} preserveAspectRatio="contain" pan={false} zoom={false}>
          <Coordinates.Polar lines={2} />
          <Circle center={[0, 0]} radius={10} color="#9aa5b8" fillOpacity={0} weight={2} />
          {state.forces.map((f, i) => {
            const tip = fromPolar(f.magnitude, f.angle);
            const color = f.locked ? "#172234" : COLORS[i % COLORS.length];
            return (
              <g key={f.id}>
                <Vector tail={ringOffset} tip={[ringOffset[0] + tip[0], ringOffset[1] + tip[1]]} color={color} weight={4} />
                <LaTeX at={[tip[0] * 1.12 + ringOffset[0], tip[1] * 1.12 + ringOffset[1] + 0.6]} tex={`${f.label.replace("₁", "_1").replace("₂", "_2").replace("₃", "_3")} = ${f.magnitude}`} color={color} />
              </g>
            );
          })}
          {!solution.equilibrium && <Vector tail={ringOffset} tip={[ringOffset[0] + solution.resultant[0], ringOffset[1] + solution.resultant[1]]} color="var(--brand-insight)" weight={3} style="dashed" />}
          <Circle center={ringOffset} radius={0.55} color={solution.equilibrium ? "var(--brand-discovery)" : "var(--foreground)"} fillOpacity={0.9} />
          {state.forces.map((f) =>
            f.locked ? null : (
              <MovablePoint key={`m-${f.id}`} point={fromPolar(f.magnitude, f.angle)} onMove={(p) => commit(moveForce(state, f.id, p), { coalesce: true })} color={COLORS[state.forces.indexOf(f) % COLORS.length]} />
            ),
          )}
        </Mafs>
      </div>
      <div className="space-y-3">
        <div className="rounded-[20px] border-2 border-border bg-surface p-3">
          <p className="mb-2 text-sm font-bold text-ink-2">مضلع القوى</p>
          <ForcePolygon state={state} solution={solution} />
          <p className={`mt-2 flex items-center gap-1.5 text-sm font-semibold ${solution.equilibrium ? "text-mint-dark" : "text-ink-3"}`}>
            {solution.equilibrium ? <CircleCheck className="size-4" aria-hidden /> : null}
            {solution.equilibrium ? "المضلع اتقفل = اتزان" : "الخط الأحمر = المحصلة اللي لسه ناقصة"}
          </p>
        </div>
        <div className="space-y-1.5 rounded-[20px] border-2 border-border bg-surface p-3 text-sm" dir="ltr">
          {state.forces.map((f, i) => (
            <p key={f.id} className="flex justify-between font-latin">
              <b style={{ color: f.locked ? "#172234" : COLORS[i % COLORS.length] }}>{f.label}</b>
              <span className="text-ink-2">
                {f.magnitude.toFixed(1)} N ∠ {f.angle.toFixed(0)}°{f.locked ? " · fixed" : ""}
              </span>
            </p>
          ))}
          <p className="flex justify-between border-t-2 border-border pt-1.5 font-latin font-bold">
            <span>R</span>
            <span className={solution.equilibrium ? "text-mint-dark" : "text-amber-dark"}>{solution.magnitude.toFixed(2)} N</span>
          </p>
        </div>
      </div>
    </div>
  );
}
