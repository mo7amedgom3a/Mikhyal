/**
 * Circuit board model: a grid of nodes; parts sit on the edges between adjacent nodes.
 * Edge ids: "h:c,r" joins (c,r)–(c+1,r); "v:c,r" joins (c,r)–(c,r+1).
 */

export type PartType = "wire" | "battery" | "bulb" | "resistor" | "switch";

export interface Part {
  type: PartType;
  /** Label for goals and ✓ badges, e.g. bulb "A". */
  label?: string;
  locked?: boolean;
  /** Switches only. */
  closed?: boolean;
  /** Batteries only: + terminal at the edge's first node instead of the second. */
  flipped?: boolean;
}

export interface CircuitState {
  cols: number;
  rows: number;
  parts: Record<string, Part>;
  /** How many of each part the student may still place (locked parts excluded). */
  inventory: Partial<Record<PartType, number>>;
}

export const EMF = 6; // volts
export const RESISTANCE: Record<"bulb" | "resistor", number> = { bulb: 4, resistor: 8 };

export function edgeNodes(edgeId: string): [string, string] {
  const [kind, rest] = edgeId.split(":");
  const [c, r] = rest.split(",").map(Number);
  return kind === "h" ? [`${c},${r}`, `${c + 1},${r}`] : [`${c},${r}`, `${c},${r + 1}`];
}

export function allEdges(cols: number, rows: number): string[] {
  const out: string[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols - 1; c++) out.push(`h:${c},${r}`);
    if (r < rows - 1) for (let c = 0; c < cols; c++) out.push(`v:${c},${r}`);
  }
  return out;
}

/** Parts of a type the student has placed (locked ones come with the level). */
export function placedCount(state: CircuitState, type: PartType): number {
  return Object.values(state.parts).filter((p) => p.type === type && !p.locked).length;
}

export function remaining(state: CircuitState, type: PartType): number {
  return (state.inventory[type] ?? 0) - placedCount(state, type);
}

export function nextBulbLabel(state: CircuitState): string {
  const used = new Set(Object.values(state.parts).map((p) => p.label));
  for (const l of "PQRSTUVWXYZ") if (!used.has(l)) return l;
  return "?";
}

export function place(state: CircuitState, edge: string, type: PartType): CircuitState {
  if (state.parts[edge] || remaining(state, type) <= 0) return state;
  const part: Part = { type };
  if (type === "switch") part.closed = true;
  if (type === "bulb") part.label = nextBulbLabel(state);
  return { ...state, parts: { ...state.parts, [edge]: part } };
}

export function removePart(state: CircuitState, edge: string): CircuitState {
  const p = state.parts[edge];
  if (!p || p.locked) return state;
  const parts = { ...state.parts };
  delete parts[edge];
  return { ...state, parts };
}

export function toggleSwitch(state: CircuitState, edge: string): CircuitState {
  const p = state.parts[edge];
  if (!p || p.type !== "switch") return state;
  return { ...state, parts: { ...state.parts, [edge]: { ...p, closed: !p.closed } } };
}
