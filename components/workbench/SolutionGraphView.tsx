"use client";
import { useMemo } from "react";
import { layoutGraph } from "@/lib/workbench/graph";
import type { GraphNodeType, SolutionGraph } from "@/lib/workbench/types";
import { cn } from "@/lib/utils";

const NODE_W = 160;
const NODE_H = 54;

export const NODE_TYPE_META: Record<GraphNodeType, { label: string; fill: string; stroke: string }> = {
  known_quantity: { label: "كمية معلومة", fill: "#f1f5f9", stroke: "#94a3b8" },
  constraint: { label: "قيد / افتراض", fill: "#fff7e6", stroke: "#d89a1e" },
  principle: { label: "مبدأ فيزيائي", fill: "#eef0ff", stroke: "#5146e8" },
  equation_application: { label: "تطبيق معادلة", fill: "#eef0ff", stroke: "#5146e8" },
  transformation: { label: "تحويل جبري", fill: "#f4efff", stroke: "#7c5ce8" },
  intermediate_goal: { label: "هدف وسيط", fill: "#e8f7f3", stroke: "#12a889" },
  intermediate_value: { label: "قيمة وسيطة", fill: "#e8f7f3", stroke: "#12a889" },
  subgoal: { label: "هدف فرعي مكتمل", fill: "#e8f7f3", stroke: "#12a889" },
  goal: { label: "الهدف", fill: "#fff4d6", stroke: "#f4b544" },
};

export interface GraphHighlight {
  reached?: Set<string>;
  /** Node where a student's reasoning broke (red ring). */
  divergedAt?: string;
  /** Path index to emphasise. */
  activePath?: number;
  /** Extra student-discovered nodes appended to the drawing. */
  extra?: { id: string; label: string; after?: string }[];
  selected?: string;
  onSelect?: (id: string) => void;
}

/** Layered drawing of a solution graph. Mathematical flow runs left → right, so the SVG is LTR. */
export function SolutionGraphView({ graph, highlight = {}, className, compact }: { graph: SolutionGraph; highlight?: GraphHighlight; className?: string; compact?: boolean }) {
  const extended = useMemo<SolutionGraph>(() => {
    if (!highlight.extra?.length) return graph;
    const goal = graph.nodes.find((n) => n.type === "goal")?.id;
    return {
      ...graph,
      nodes: [...graph.nodes, ...highlight.extra.map((e) => ({ id: e.id, type: "equation_application" as const, label_ar: e.label }))],
      edges: [
        ...graph.edges,
        ...highlight.extra.flatMap((e) => [
          ...(e.after ? [{ from: e.after, to: e.id, type: "dependency" as const }] : []),
          ...(goal ? [{ from: e.id, to: goal, type: "substitution" as const }] : []),
        ]),
      ],
    };
  }, [graph, highlight.extra]);

  const { nodes } = useMemo(() => layoutGraph(extended, compact ? { colW: 176, rowH: 70 } : { colW: 196, rowH: 78 }), [extended, compact]);
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const reached = highlight.reached ?? new Set<string>();
  const extraIds = new Set(highlight.extra?.map((e) => e.id));
  const activeNodes = new Set(highlight.activePath !== undefined ? graph.paths[highlight.activePath] ?? [] : []);
  const pad = 12;
  const vbW = Math.max(...nodes.map((n) => n.x)) + NODE_W + pad * 2;
  const vbH = Math.max(...nodes.map((n) => n.y)) + NODE_H + pad * 2 + 30;

  return (
    <div className={cn("overflow-x-auto rounded-[16px] border-2 border-border bg-sim", className)} dir="ltr">
      <svg viewBox={`0 0 ${vbW} ${vbH}`} width={vbW} height={vbH} role="img" aria-label="جراف الحل: العقد والوصلات" className="block max-w-none">
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#94a3b8" />
          </marker>
          <marker id="arrow-on" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
            <path d="M0,0 L10,5 L0,10 z" fill="#12a889" />
          </marker>
        </defs>
        <g transform={`translate(${pad},${pad})`}>
          {extended.edges.map((e, i) => {
            const a = pos.get(e.from);
            const b = pos.get(e.to);
            if (!a || !b) return null;
            const on = reached.has(e.from) && reached.has(e.to);
            const x1 = a.x + NODE_W;
            const y1 = a.y + NODE_H / 2;
            const x2 = b.x;
            const y2 = b.y + NODE_H / 2;
            const back = x2 <= x1;
            const d = back ? `M${a.x + NODE_W / 2},${a.y + NODE_H} C${a.x + NODE_W / 2},${a.y + NODE_H + 40} ${b.x + NODE_W / 2},${b.y + NODE_H + 40} ${b.x + NODE_W / 2},${b.y + NODE_H}` : `M${x1},${y1} C${x1 + 40},${y1} ${x2 - 40},${y2} ${x2},${y2}`;
            return (
              <path
                key={i}
                d={d}
                fill="none"
                stroke={e.type === "alternative" ? "#c4b5fd" : on ? "#12a889" : "#cbd5e1"}
                strokeWidth={on ? 2.5 : 1.6}
                strokeDasharray={e.type === "alternative" ? "6 5" : e.type === "substitution" ? "2 4" : undefined}
                markerEnd={e.type === "alternative" ? undefined : on ? "url(#arrow-on)" : "url(#arrow)"}
                data-edge={e.type}
              />
            );
          })}
          {nodes.map((n) => {
            const meta = NODE_TYPE_META[n.type];
            const isReached = reached.has(n.id);
            const isExtra = extraIds.has(n.id);
            const dim = highlight.activePath !== undefined && !activeNodes.has(n.id) && n.type !== "known_quantity" && n.type !== "constraint" && !isExtra && !isReached;
            const diverged = highlight.divergedAt === n.id;
            return (
              <g
                key={n.id}
                transform={`translate(${n.x},${n.y})`}
                opacity={dim ? 0.38 : 1}
                data-node={n.id}
                data-reached={isReached ? "true" : undefined}
                onClick={highlight.onSelect ? () => highlight.onSelect!(n.id) : undefined}
                className={highlight.onSelect ? "cursor-pointer" : undefined}
              >
                <title>{`${meta.label}: ${n.label_ar}${n.formula ? ` — ${n.formula}` : ""}`}</title>
                <rect
                  width={NODE_W}
                  height={NODE_H}
                  rx={n.type === "goal" ? 27 : 12}
                  fill={isExtra ? "#fff4d6" : isReached ? "#d6f5ec" : meta.fill}
                  stroke={diverged ? "#e5484d" : highlight.selected === n.id ? "#111827" : isExtra ? "#f4b544" : isReached ? "#12a889" : meta.stroke}
                  strokeWidth={diverged || highlight.selected === n.id ? 3.5 : isReached ? 2.5 : 1.6}
                  strokeDasharray={isExtra ? "5 3" : undefined}
                />
                <text x={NODE_W / 2} y={20} textAnchor="middle" fontSize={10.5} fill="#64748b" fontFamily="var(--font-arabic)">
                  {isExtra ? "مسار جديد ✦" : meta.label}
                  {isReached ? " ✓" : ""}
                </text>
                <text x={NODE_W / 2} y={39} textAnchor="middle" fontSize={13} fontWeight={700} fill="#111827" fontFamily="var(--font-latin), var(--font-arabic)">
                  {n.label_ar.length > 22 ? n.label_ar.slice(0, 21) + "…" : n.label_ar}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
}

export function GraphLegend() {
  const types: GraphNodeType[] = ["known_quantity", "constraint", "equation_application", "transformation", "intermediate_value", "goal"];
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-1.5 text-xs text-ink-2">
      {types.map((t) => (
        <li key={t} className="flex items-center gap-1.5">
          <span className="inline-block size-3 rounded-[4px] border-2" style={{ background: NODE_TYPE_META[t].fill, borderColor: NODE_TYPE_META[t].stroke }} />
          {NODE_TYPE_META[t].label}
        </li>
      ))}
      <li className="flex items-center gap-1.5">
        <span className="inline-block h-0 w-5 border-t-2 border-dashed border-violet-300" /> طريق بديل
      </li>
      <li className="flex items-center gap-1.5">
        <span className="inline-block size-3 rounded-[4px] border-2 border-mint bg-mint-soft" /> وصلت لها
      </li>
    </ul>
  );
}
