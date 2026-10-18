/**
 * Deterministic circuit solver: wires and closed switches merge nodes (union-find), then
 * Modified Nodal Analysis with ideal batteries, solved by Gaussian elimination.
 */
import { EMF, RESISTANCE, edgeNodes, type CircuitState } from "./model";

export interface PartReading {
  current: number; // A, positive from the edge's first node to its second
  voltage: number; // V across the part (first − second)
  power: number; // W
  brightness: number; // bulbs: P / P(single bulb across the battery), 0..1+
  lit: boolean;
}

export interface CircuitSolution {
  readings: Record<string, PartReading>;
  shortCircuit: boolean;
  batteryCurrent: number;
  /** Union-find root of every node, so the board can show which wires carry current. */
  netOf: Record<string, string>;
}

const LIT = 0.01;
const P_REF = (EMF * EMF) / RESISTANCE.bulb;
const GMIN = 1e-9;

function find(parent: Record<string, string>, x: string): string {
  while (parent[x] !== x) {
    parent[x] = parent[parent[x]];
    x = parent[x];
  }
  return x;
}

/** Gaussian elimination with partial pivoting; A is modified in place. */
export function solveLinear(A: number[][], b: number[]): number[] {
  const n = b.length;
  for (let col = 0; col < n; col++) {
    let piv = col;
    for (let r = col + 1; r < n; r++) if (Math.abs(A[r][col]) > Math.abs(A[piv][col])) piv = r;
    if (Math.abs(A[piv][col]) < 1e-14) continue;
    [A[col], A[piv]] = [A[piv], A[col]];
    [b[col], b[piv]] = [b[piv], b[col]];
    for (let r = col + 1; r < n; r++) {
      const f = A[r][col] / A[col][col];
      if (!f) continue;
      for (let k = col; k < n; k++) A[r][k] -= f * A[col][k];
      b[r] -= f * b[col];
    }
  }
  const x = new Array(n).fill(0);
  for (let r = n - 1; r >= 0; r--) {
    if (Math.abs(A[r][r]) < 1e-14) continue;
    let s = b[r];
    for (let k = r + 1; k < n; k++) s -= A[r][k] * x[k];
    x[r] = s / A[r][r];
  }
  return x;
}

export function solveCircuit(state: CircuitState): CircuitSolution {
  const parent: Record<string, string> = {};
  for (let c = 0; c < state.cols; c++) for (let r = 0; r < state.rows; r++) parent[`${c},${r}`] = `${c},${r}`;
  const entries = Object.entries(state.parts);
  for (const [edge, p] of entries) {
    if (p.type === "wire" || (p.type === "switch" && p.closed)) {
      const [a, b] = edgeNodes(edge);
      const ra = find(parent, a);
      const rb = find(parent, b);
      if (ra !== rb) parent[ra] = rb;
    }
  }
  const netOf: Record<string, string> = {};
  for (const n of Object.keys(parent)) netOf[n] = find(parent, n);

  const batteries = entries.filter(([, p]) => p.type === "battery");
  const readings: Record<string, PartReading> = {};
  const blank = (): PartReading => ({ current: 0, voltage: 0, power: 0, brightness: 0, lit: false });
  for (const [edge] of entries) readings[edge] = blank();

  // A battery whose terminals are joined by wire alone is short-circuited.
  const shortCircuit = batteries.some(([edge]) => {
    const [a, b] = edgeNodes(edge);
    return netOf[a] === netOf[b];
  });
  if (shortCircuit || batteries.length === 0) {
    return { readings, shortCircuit, batteryCurrent: shortCircuit ? Infinity : 0, netOf };
  }

  // Unknowns: one voltage per net (except ground) + one current per battery.
  const ground = netOf[edgeNodes(batteries[0][0])[batteries[0][1].flipped ? 1 : 0]];
  const nets = [...new Set(Object.values(netOf))].filter((n) => n !== ground);
  const idx = new Map(nets.map((n, i) => [n, i]));
  const N = nets.length + batteries.length;
  const A = Array.from({ length: N }, () => new Array(N).fill(0));
  const z = new Array(N).fill(0);
  nets.forEach((_, i) => (A[i][i] += GMIN)); // keeps floating islands solvable

  const stamp = (a: string, b: string, g: number) => {
    const ia = idx.get(netOf[a]);
    const ib = idx.get(netOf[b]);
    if (ia !== undefined) A[ia][ia] += g;
    if (ib !== undefined) A[ib][ib] += g;
    if (ia !== undefined && ib !== undefined) {
      A[ia][ib] -= g;
      A[ib][ia] -= g;
    }
  };
  for (const [edge, p] of entries) {
    if (p.type === "bulb" || p.type === "resistor") {
      const [a, b] = edgeNodes(edge);
      stamp(a, b, 1 / RESISTANCE[p.type]);
    }
  }
  batteries.forEach(([edge, p], k) => {
    const [n1, n2] = edgeNodes(edge);
    const [neg, pos] = p.flipped ? [n2, n1] : [n1, n2];
    const row = nets.length + k;
    const ip = idx.get(netOf[pos]);
    const ineg = idx.get(netOf[neg]);
    // Battery current j flows out of + into the external circuit.
    if (ip !== undefined) {
      A[ip][row] -= 1;
      A[row][ip] += 1;
    }
    if (ineg !== undefined) {
      A[ineg][row] += 1;
      A[row][ineg] -= 1;
    }
    z[row] = EMF;
  });

  const x = solveLinear(A, z);
  const V = (node: string) => {
    const i = idx.get(netOf[node]);
    return i === undefined ? 0 : x[i];
  };
  for (const [edge, p] of entries) {
    const [a, b] = edgeNodes(edge);
    const dv = V(a) - V(b);
    if (p.type === "bulb" || p.type === "resistor") {
      const I = dv / RESISTANCE[p.type];
      const P = I * dv;
      const brightness = p.type === "bulb" ? P / P_REF : 0;
      readings[edge] = { current: I, voltage: dv, power: P, brightness, lit: p.type === "bulb" && brightness > LIT };
    }
  }
  batteries.forEach(([edge, p], k) => {
    const j = x[nets.length + k];
    readings[edge] = { current: p.flipped ? -j : j, voltage: EMF, power: EMF * j, brightness: 0, lit: false };
  });
  wireCurrents(state, readings);
  return { readings, shortCircuit, batteryCurrent: Math.abs(x[nets.length] ?? 0), netOf };
}

/**
 * Currents in wires and closed switches. Each node's element currents must be carried by the
 * wires; solving a Laplacian over the wire graph splits them (evenly around wire-only loops).
 */
function wireCurrents(state: CircuitState, readings: Record<string, PartReading>) {
  const entries = Object.entries(state.parts);
  const conductors = entries.filter(([, p]) => p.type === "wire" || (p.type === "switch" && p.closed));
  if (!conductors.length) return;
  const nodes = [...new Set(conductors.flatMap(([e]) => edgeNodes(e)))];
  const idx = new Map(nodes.map((n, i) => [n, i]));
  const n = nodes.length;
  const L = Array.from({ length: n }, () => new Array(n).fill(0));
  const s = new Array(n).fill(0);
  nodes.forEach((_, i) => (L[i][i] += 1e-6));
  for (const [e] of conductors) {
    const [a, b] = edgeNodes(e).map((k) => idx.get(k)!);
    L[a][a] += 1;
    L[b][b] += 1;
    L[a][b] -= 1;
    L[b][a] -= 1;
  }
  for (const [e, p] of entries) {
    if (p.type === "wire" || p.type === "switch") continue;
    const I = readings[e]?.current ?? 0;
    const [a, b] = edgeNodes(e);
    // The element carries I out of a and into b; the wires at a must supply it, the wires at b take it away.
    if (idx.has(a)) s[idx.get(a)!] -= I;
    if (idx.has(b)) s[idx.get(b)!] += I;
  }
  const phi = solveLinear(L, s);
  for (const [e] of conductors) {
    const [a, b] = edgeNodes(e).map((k) => idx.get(k)!);
    readings[e] = { current: phi[a] - phi[b], voltage: 0, power: 0, brightness: 0, lit: false };
  }
}

export function bulbByLabel(state: CircuitState, label: string): string | undefined {
  return Object.entries(state.parts).find(([, p]) => p.label === label)?.[0];
}
