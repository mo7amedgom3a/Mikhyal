"use client";
import { Coordinates, LaTeX, Mafs, MovablePoint, Polygon, Vector } from "mafs";
import "mafs/core.css";
import { add, direction, fromPolar, magnitude, type Vec2 } from "@/lib/physics/vectors";
import { rad2deg } from "@/lib/physics/trig";
import { useSimClock, type SimProps } from "./useSimClock";

const MAX_F = 6;

/** Keep a dragged tip inside the tugboat's limits: magnitude ≤ 6 kN, on its own side of the canal. */
function clampTip([x, y]: Vec2, side: 1 | -1): Vec2 {
  const ang = Math.min(80, Math.max(0, rad2deg(Math.atan2(side * y, Math.max(x, 0.01)))));
  const mag = Math.min(MAX_F, Math.max(0.5, Math.hypot(x, y)));
  const [px, py] = fromPolar(mag, ang);
  return [px, side * py];
}

export function VectorsSim({ params, runKey, onFinish, setParam }: SimProps) {
  const { F1, a1, F2, a2 } = params;
  const tip1 = fromPolar(F1, a1);
  const tip2: Vec2 = [fromPolar(F2, a2)[0], -fromPolar(F2, a2)[1]];
  const R = add(tip1, tip2);
  const Rmag = magnitude(R);
  const { t } = useSimClock(runKey, 2, 1, onFinish);
  const travel = runKey > 0 ? Math.min(1, t / 2) : 0;
  // On Run the ship drifts along the resultant: sideways if the forces don't cancel across the canal.
  const ship: Vec2 = [R[0] * travel * 0.9, R[1] * travel * 0.9];
  const hull = (c: Vec2): Vec2[] => [
    [c[0] - 0.9, c[1] - 0.35],
    [c[0] + 0.6, c[1] - 0.35],
    [c[0] + 1.1, c[1]],
    [c[0] + 0.6, c[1] + 0.35],
    [c[0] - 0.9, c[1] + 0.35],
  ];

  const move = (key: "1" | "2") => (p: Vec2) => {
    if (!setParam) return;
    const c = clampTip(p, key === "1" ? 1 : -1);
    const ang = Math.abs(rad2deg(Math.atan2(c[1], c[0])));
    setParam(`F${key}`, Math.hypot(c[0], c[1]));
    setParam(`a${key}`, ang);
  };

  return (
    <div
      dir="ltr"
      className="mafs-mikhyal"
      role="img"
      aria-label={`قوتان ${F1} و ${F2} كيلو نيوتن، المحصلة ${Rmag.toFixed(1)} كيلو نيوتن`}
    >
      <Mafs height={320} viewBox={{ x: [-1.5, 12], y: [-6, 6] }} preserveAspectRatio="contain" pan={false} zoom={false}>
        <Coordinates.Cartesian subdivisions={false} xAxis={{ lines: 1, labels: (n) => (n % 2 === 0 ? String(n) : "") }} yAxis={{ lines: 1, labels: () => "" }} />
        {/* canal banks */}
        <Polygon points={[[-30, 5.2], [40, 5.2], [40, 9], [-30, 9]]} color="#9aa5b8" fillOpacity={0.35} weight={0} />
        <Polygon points={[[-30, -5.2], [40, -5.2], [40, -9], [-30, -9]]} color="#9aa5b8" fillOpacity={0.35} weight={0} />
        {/* parallelogram */}
        <Polygon points={[[0, 0], tip1, R, tip2]} color="var(--brand-primary)" fillOpacity={0.06} weight={1.5} strokeStyle="dashed" />
        <Vector tip={tip1} color="var(--brand-primary)" weight={4} />
        <Vector tip={tip2} color="var(--brand-discovery)" weight={4} />
        <Vector tip={R} color="var(--brand-insight)" weight={5} />
        <LaTeX at={[tip1[0] + 0.3, tip1[1] + 0.5]} tex={`\\vec F_1 = ${F1}`} color="var(--brand-primary)" />
        <LaTeX at={[tip2[0] + 0.3, tip2[1] - 0.5]} tex={`\\vec F_2 = ${F2}`} color="var(--brand-discovery-dark)" />
        <LaTeX at={[R[0] + 1.3, R[1] + 0.9]} tex={`\\vec R = ${Rmag.toFixed(2)}`} color="var(--brand-insight-dark)" />
        <LaTeX at={[-3.2, 1.1]} tex={`\\theta = ${(a1 + a2).toFixed(0)}^\\circ`} color="var(--foreground)" />
        <Polygon points={hull(ship)} color="var(--foreground)" fillOpacity={0.85} weight={1} />
        {setParam && <MovablePoint point={tip1} onMove={move("1")} color="var(--brand-primary)" />}
        {setParam && <MovablePoint point={tip2} onMove={move("2")} color="var(--brand-discovery)" />}
      </Mafs>
      <p className="px-3 pb-2 pt-1 text-end text-xs text-ink-3" dir="rtl">
        {setParam ? "اسحب رأس كل قوة. الخط المتقطع هو متوازي الأضلاع، والسهم الأصفر هو المحصلة." : "المحصلة"} · اتجاه المحصلة {direction(R).toFixed(1)}° عن محور القناة
      </p>
    </div>
  );
}
