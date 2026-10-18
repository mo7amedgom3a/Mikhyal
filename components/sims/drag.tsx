"use client";
import { useDrag } from "@use-gesture/react";
import type { RefObject } from "react";

/** Convert a pointer position on screen to the SVG's own viewBox coordinates. */
function toSvg(svg: SVGSVGElement, clientX: number, clientY: number): { x: number; y: number } {
  const ctm = svg.getScreenCTM();
  if (!ctm) return { x: clientX, y: clientY };
  const p = new DOMPoint(clientX, clientY).matrixTransform(ctm.inverse());
  return { x: p.x, y: p.y };
}

/** Drag binding for an SVG handle; reports positions in viewBox units. Disabled when onMove is undefined. */
export function useSvgDrag(svgRef: RefObject<SVGSVGElement | null>, onMove?: (x: number, y: number) => void) {
  return useDrag(
    ({ xy: [cx, cy] }) => {
      if (!onMove || !svgRef.current) return;
      const p = toSvg(svgRef.current, cx, cy);
      onMove(p.x, p.y);
    },
    { enabled: !!onMove, pointer: { capture: true }, filterTaps: false },
  );
}

/** A large, touch-friendly drag handle (≥44 px hit area). Sliders remain the accessible alternative. */
export function DragHandle({
  x,
  y,
  bind,
  active,
  color = "var(--brand-primary)",
  label,
}: {
  x: number;
  y: number;
  bind: ReturnType<typeof useSvgDrag>;
  active: boolean;
  color?: string;
  label?: string;
}) {
  return (
    <g {...(active ? bind() : {})} style={{ touchAction: "none", cursor: active ? "grab" : "default" }} aria-hidden data-handle={label}>
      <circle cx={x} cy={y} r="24" fill="transparent" />
      {active && <circle cx={x} cy={y} r="18" fill={color} opacity="0.15" className="motion-safe:animate-pulse" />}
      <circle cx={x} cy={y} r="11" fill="#fff" stroke={color} strokeWidth="4" />
    </g>
  );
}

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  width = 4,
  dashed = false,
  head = 12,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  color: string;
  width?: number;
  dashed?: boolean;
  head?: number;
}) {
  const len = Math.hypot(x2 - x1, y2 - y1);
  if (len < 2) return null;
  const ux = (x2 - x1) / len;
  const uy = (y2 - y1) / len;
  const h = Math.min(head, len * 0.6);
  const bx = x2 - ux * h;
  const by = y2 - uy * h;
  return (
    <g>
      <line x1={x1} y1={y1} x2={bx} y2={by} stroke={color} strokeWidth={width} strokeLinecap="round" strokeDasharray={dashed ? "7 6" : undefined} />
      <polygon points={`${x2},${y2} ${bx - uy * h * 0.55},${by + ux * h * 0.55} ${bx + uy * h * 0.55},${by - ux * h * 0.55}`} fill={color} />
    </g>
  );
}
