/** Solution-graph integrity checks (used by the authoring tool) and a layered layout for drawing. */
import { parseRelation, StepParseError } from "./mathjson";
import type { GraphNode, SolutionGraph } from "./types";

export interface GraphIssue {
  level: "error" | "warning";
  code: "cycle" | "unknown_node" | "unproduced_requirement" | "path_not_to_goal" | "path_order" | "formula" | "no_goal" | "duplicate_id" | "orphan";
  message_ar: string;
  nodes: string[];
}

/** Edges that express flow (alternative edges only say "or"). */
const flowEdges = (g: SolutionGraph) => g.edges.filter((e) => e.type !== "alternative");

export function findCycle(g: SolutionGraph): string[] | null {
  const adj = new Map<string, string[]>();
  for (const e of flowEdges(g)) adj.set(e.from, [...(adj.get(e.from) ?? []), e.to]);
  const state = new Map<string, 0 | 1 | 2>();
  const stack: string[] = [];
  const visit = (n: string): string[] | null => {
    state.set(n, 1);
    stack.push(n);
    for (const m of adj.get(n) ?? []) {
      if (state.get(m) === 1) return [...stack.slice(stack.indexOf(m)), m];
      if (!state.get(m)) {
        const c = visit(m);
        if (c) return c;
      }
    }
    stack.pop();
    state.set(n, 2);
    return null;
  };
  for (const n of g.nodes) if (!state.get(n.id)) {
    const c = visit(n.id);
    if (c) return c;
  }
  return null;
}

/** Quantities a node makes available: its `produces`, or its formula's solved side. */
function producedBy(n: GraphNode): string[] {
  return n.produces ?? [];
}

export function validateGraph(g: SolutionGraph, symbols: string[]): GraphIssue[] {
  const issues: GraphIssue[] = [];
  const ids = new Set<string>();
  for (const n of g.nodes) {
    if (ids.has(n.id)) issues.push({ level: "error", code: "duplicate_id", message_ar: `المعرّف «${n.id}» متكرر.`, nodes: [n.id] });
    ids.add(n.id);
  }
  for (const e of g.edges)
    for (const end of [e.from, e.to])
      if (!ids.has(end)) issues.push({ level: "error", code: "unknown_node", message_ar: `وصلة لعقدة مش موجودة: «${end}».`, nodes: [end] });

  const goal = g.nodes.find((n) => n.type === "goal");
  if (!goal) issues.push({ level: "error", code: "no_goal", message_ar: "الجراف مافيهوش عقدة هدف (goal).", nodes: [] });

  const cycle = findCycle(g);
  if (cycle) issues.push({ level: "error", code: "cycle", message_ar: `فيه دايرة في الاعتماديات: ${cycle.join(" → ")}. الاشتقاق لازم يمشي في اتجاه واحد.`, nodes: cycle });

  for (const n of g.nodes) {
    if (!n.formula) continue;
    try {
      parseRelation(n.formula, symbols);
    } catch (e) {
      const why = e instanceof StepParseError ? `${e.code}: ${e.detail}` : String(e);
      issues.push({ level: "error", code: "formula", message_ar: `صيغة العقدة «${n.id}» مش مقروءة (${why}).`, nodes: [n.id] });
    }
  }

  const knownQty = new Set(g.nodes.filter((n) => n.type === "known_quantity").flatMap(producedBy));
  const allProduced = new Set(g.nodes.flatMap(producedBy));
  for (const n of g.nodes)
    for (const q of n.requires ?? [])
      if (!allProduced.has(q)) issues.push({ level: "error", code: "unproduced_requirement", message_ar: `العقدة «${n.id}» محتاجة «${q}» ومافيش عقدة بتنتجها.`, nodes: [n.id] });

  g.paths.forEach((path, i) => {
    const last = path[path.length - 1];
    if (goal && last !== goal.id) issues.push({ level: "error", code: "path_not_to_goal", message_ar: `المسار ${i + 1} مابيوصلش للهدف.`, nodes: path });
    const have = new Set(knownQty);
    for (const id of path) {
      const n = g.nodes.find((x) => x.id === id);
      if (!n) continue;
      const missing = (n.requires ?? []).filter((q) => !have.has(q));
      if (missing.length) issues.push({ level: "warning", code: "path_order", message_ar: `في المسار ${i + 1}: «${id}» محتاجة ${missing.join("، ")} قبلها.`, nodes: [id] });
      producedBy(n).forEach((q) => have.add(q));
    }
  });

  const onPath = new Set(g.paths.flat());
  for (const n of g.nodes)
    if (n.type !== "known_quantity" && n.type !== "constraint" && !onPath.has(n.id))
      issues.push({ level: "warning", code: "orphan", message_ar: `العقدة «${n.id}» مش على أي مسار مكتوب (مسموح، بس اتأكد).`, nodes: [n.id] });
  return issues;
}

/** Nodes needing two or more quantities — the interesting joins of a derivation. */
export function multiDependencyNodes(g: SolutionGraph): string[] {
  return g.nodes.filter((n) => (n.requires?.length ?? 0) >= 2).map((n) => n.id);
}

export interface LaidOutNode extends GraphNode {
  x: number;
  y: number;
  layer: number;
}

/** Longest-path layering over flow edges (cycle-safe), then even spacing within each layer. */
export function layoutGraph(g: SolutionGraph, opts = { colW: 190, rowH: 84 }) {
  const layer = new Map<string, number>(g.nodes.map((n) => [n.id, 0]));
  const edges = flowEdges(g).filter((e) => layer.has(e.from) && layer.has(e.to));
  for (let iter = 0; iter < g.nodes.length; iter++) {
    let changed = false;
    for (const e of edges) {
      const want = layer.get(e.from)! + 1;
      if (want > layer.get(e.to)! && want < g.nodes.length) {
        layer.set(e.to, want);
        changed = true;
      }
    }
    if (!changed) break;
  }
  const byLayer = new Map<number, GraphNode[]>();
  for (const n of g.nodes) byLayer.set(layer.get(n.id)!, [...(byLayer.get(layer.get(n.id)!) ?? []), n]);
  const maxRows = Math.max(...[...byLayer.values()].map((l) => l.length));
  const nodes: LaidOutNode[] = [];
  for (const [l, list] of byLayer) {
    const offset = ((maxRows - list.length) * opts.rowH) / 2;
    list.forEach((n, i) => nodes.push({ ...n, layer: l, x: l * opts.colW, y: offset + i * opts.rowH }));
  }
  const layers = Math.max(...nodes.map((n) => n.layer)) + 1;
  return { nodes, width: layers * opts.colW, height: maxRows * opts.rowH };
}
