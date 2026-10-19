/**
 * Numerical-symbolic checks on relations: sampling points that satisfy a relation, root sets,
 * implication in both directions (equivalence / lost solutions / extraneous solutions),
 * identity detection and dimensional analysis.
 *
 * Production would pair this with a CAS (SymPy) over the same restricted language; independent
 * substitution checks like these stay useful there as a second opinion.
 */
import type { MathNode, Unit } from "mathjs";
import { math } from "./mathjson";

export type Scope = Record<string, number>;

export interface Relation {
  key: string;
  vars: string[];
  lhs: (s: Scope) => number;
  rhs: (s: Scope) => number;
}

export interface EvalOptions {
  /** Trig functions take and return degrees. */
  degrees?: boolean;
}

const D2R = Math.PI / 180;
function degreeScope(): Record<string, (x: number) => number> {
  return {
    sin: (x) => Math.sin(x * D2R),
    cos: (x) => Math.cos(x * D2R),
    tan: (x) => Math.tan(x * D2R),
    asin: (x) => Math.asin(x) / D2R,
    acos: (x) => Math.acos(x) / D2R,
    atan: (x) => Math.atan(x) / D2R,
  };
}

export function compileExpr(node: MathNode, opts: EvalOptions = {}): (s: Scope) => number {
  const code = node.compile();
  const extra = opts.degrees ? degreeScope() : {};
  return (s) => {
    try {
      const v = code.evaluate({ ...extra, ...s });
      return typeof v === "number" ? v : NaN;
    } catch {
      return NaN;
    }
  };
}

export function makeRelation(lhs: MathNode, rhs: MathNode, vars: string[], opts: EvalOptions = {}): Relation {
  return { key: `${lhs.toString()}=${rhs.toString()}`, vars, lhs: compileExpr(lhs, opts), rhs: compileExpr(rhs, opts) };
}

/** Deterministic PRNG so every check is reproducible. */
export function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 2 ** 32;
  };
}

const GRID = 240;

/** All roots of f on [lo, hi]: grid sign changes refined by bisection, plus exact grid zeros. */
export function rootsIn(f: (x: number) => number, lo: number, hi: number, grid = GRID): number[] {
  const roots: number[] = [];
  const width = hi - lo;
  const xs: number[] = [];
  for (let i = 0; i <= grid; i++) xs.push(lo + (width * i) / grid);
  // Integers inside the range are probed too: domain edges like x = 1 or x = 0 live there.
  if (width <= 400) for (let k = Math.ceil(lo); k <= hi; k++) xs.push(k);
  xs.sort((a, b) => a - b);
  let prevX = xs[0];
  let prevF = f(prevX);
  const push = (r: number) => {
    if (!roots.some((q) => Math.abs(q - r) <= 1e-7 * Math.max(1, Math.abs(width)))) roots.push(r);
  };
  if (prevF === 0) push(prevX);
  for (let i = 1; i < xs.length; i++) {
    const x = xs[i];
    const fx = f(x);
    if (fx === 0) push(x);
    else if (Number.isFinite(prevF) && Number.isFinite(fx) && prevF !== 0 && Math.sign(fx) !== Math.sign(prevF)) {
      let a = prevX;
      let b = x;
      let fa = prevF;
      for (let k = 0; k < 80; k++) {
        const m = (a + b) / 2;
        const fm = f(m);
        if (!Number.isFinite(fm)) break;
        if (fm === 0) {
          a = b = m;
          break;
        }
        if (Math.sign(fm) === Math.sign(fa)) {
          a = m;
          fa = fm;
        } else b = m;
      }
      const r = (a + b) / 2;
      // A jump across a pole (1/x) changes sign without a root.
      const fr = f(r);
      const mag = Math.max(Math.abs(prevF), Math.abs(fx));
      if (Number.isFinite(fr) && Math.abs(fr) <= 1e-6 * mag + 1e-300) push(r);
    }
    prevX = x;
    prevF = fx;
  }
  return roots;
}

export type Domains = Record<string, [number, number]>;

const pointCache = new Map<string, Scope[]>();

/** Points satisfying `rel`: random values for all but one variable, then every root of the last. */
export function pointsOn(rel: Relation, vars: string[], domains: Domains, want = 16): Scope[] {
  const cacheKey = `${rel.key}|${vars.join(",")}|${vars.map((v) => domains[v]?.join(":")).join(";")}`;
  const hit = pointCache.get(cacheKey);
  if (hit) return hit;
  const rand = rng(7);
  const out: Scope[] = [];
  const solvable = (rel.vars.length ? rel.vars : vars).filter((v) => domains[v][0] !== domains[v][1]);
  if (!solvable.length) return out;
  // Small integers first (0, 1, −1, 2, …) so removable singularities like x = 1 in (x²−1)/(x−1) get probed.
  const ints: Record<string, number[]> = {};
  const cursor: Record<string, number> = {};
  for (const v of vars) {
    const [lo, hi] = domains[v];
    const list: number[] = [];
    for (let k = Math.ceil(lo); k <= Math.floor(hi) && list.length < 60; k++) list.push(k);
    ints[v] = list.sort((a, b) => Math.abs(a) - Math.abs(b));
    cursor[v] = 0;
  }
  for (let attempt = 0; attempt < 60 && out.length < want; attempt++) {
    const solveVar = solvable[attempt % solvable.length];
    const base: Scope = {};
    for (const v of vars) {
      if (v === solveVar) continue;
      const [lo, hi] = domains[v];
      if (lo === hi) base[v] = lo;
      else if (ints[v].length && rand() < 0.5) base[v] = ints[v][cursor[v]++ % ints[v].length];
      else base[v] = lo + (hi - lo) * rand();
    }
    const [lo, hi] = domains[solveVar];
    const g = (x: number) => {
      const s = { ...base, [solveVar]: x };
      return rel.lhs(s) - rel.rhs(s);
    };
    for (const r of rootsIn(g, lo, hi)) out.push({ ...base, [solveVar]: r });
  }
  if (pointCache.size > 500) pointCache.clear();
  pointCache.set(cacheKey, out);
  return out;
}

/** Typical magnitude of a relation's sides, used as an absolute tolerance near zero. */
function typicalMagnitude(rel: Relation, vars: string[], domains: Domains): number {
  const rand = rng(3);
  const mags: number[] = [];
  for (let i = 0; i < 12; i++) {
    const s: Scope = {};
    for (const v of vars) {
      const [lo, hi] = domains[v];
      s[v] = lo + (hi - lo) * rand();
    }
    const l = Math.abs(rel.lhs(s));
    const r = Math.abs(rel.rhs(s));
    if (Number.isFinite(l)) mags.push(l);
    if (Number.isFinite(r)) mags.push(r);
  }
  mags.sort((a, b) => a - b);
  return mags.length ? mags[Math.floor(mags.length / 2)] : 1;
}

export type HoldResult = "holds" | "false" | "undefined";

export function holdsAt(rel: Relation, s: Scope, absTol: number): HoldResult {
  const l = rel.lhs(s);
  const r = rel.rhs(s);
  if (!Number.isFinite(l) || !Number.isFinite(r)) return "undefined";
  const diff = Math.abs(l - r);
  return diff <= 1e-7 * Math.max(Math.abs(l), Math.abs(r)) || diff <= absTol ? "holds" : "false";
}

export interface Implication {
  implied: boolean;
  /** Point on the premise where the conclusion fails or is undefined. */
  counterexample?: Scope;
  undefinedThere?: boolean;
  inconclusive?: boolean;
}

/** Does every sampled point of A satisfy B? */
export function implies(a: Relation, b: Relation, domains: Domains): Implication {
  const vars = [...new Set([...a.vars, ...b.vars])];
  const pts = pointsOn(a, vars, domains);
  if (pts.length < 2) return { implied: false, inconclusive: true };
  const tol = 1e-9 * typicalMagnitude(b, vars, domains);
  for (const p of pts) {
    const h = holdsAt(b, p, tol);
    if (h !== "holds") return { implied: false, counterexample: p, undefinedThere: h === "undefined" };
  }
  return { implied: true };
}

export type Comparison =
  | { kind: "equivalent" }
  | { kind: "lost_solutions"; counterexample: Scope }
  | { kind: "extraneous_solutions"; counterexample: Scope; domainChanged: boolean }
  | { kind: "not_equivalent"; counterexample?: Scope }
  | { kind: "inconclusive" };

/** Compare a step (B) with what it was derived from (A). */
export function compareRelations(a: Relation, b: Relation, domains: Domains): Comparison {
  const ab = implies(a, b, domains);
  const ba = implies(b, a, domains);
  if (ab.inconclusive || ba.inconclusive) {
    if (ab.inconclusive && ba.inconclusive) return { kind: "inconclusive" };
  }
  if (ab.implied && ba.implied) return { kind: "equivalent" };
  if (ba.implied && !ab.implied && !ab.inconclusive) return { kind: "lost_solutions", counterexample: ab.counterexample! };
  if (ab.implied && !ba.implied && !ba.inconclusive) {
    return { kind: "extraneous_solutions", counterexample: ba.counterexample!, domainChanged: !!ba.undefinedThere };
  }
  return { kind: "not_equivalent", counterexample: ab.counterexample ?? ba.counterexample };
}

/** True when a relation holds everywhere (e.g. s = s): it carries no information. */
export function isIdentity(rel: Relation, domains: Domains): boolean {
  const rand = rng(11);
  const tol = 1e-9 * typicalMagnitude(rel, rel.vars, domains);
  let tested = 0;
  for (let i = 0; i < 12; i++) {
    const s: Scope = {};
    for (const v of rel.vars) {
      const [lo, hi] = domains[v];
      s[v] = lo + (hi - lo) * rand();
    }
    const h = holdsAt(rel, s, tol);
    if (h === "undefined") continue;
    if (h === "false") return false;
    tested++;
  }
  return tested > 0;
}

/** Points of the physical model: free parameters at random, derived quantities computed. */
export function modelPoints(model: { free: Domains; derived: Record<string, string> }, extra: Scope = {}, n = 8): Scope[] {
  const rand = rng(5);
  const derived = Object.entries(model.derived).map(([k, expr]) => [k, math.parse(expr).compile()] as const);
  const pts: Scope[] = [];
  for (let i = 0; i < n * 3 && pts.length < n; i++) {
    const s: Scope = { ...extra };
    for (const [k, [lo, hi]] of Object.entries(model.free)) s[k] = lo + (hi - lo) * rand();
    let ok = true;
    for (const [k, code] of derived) {
      const v = code.evaluate({ ...s });
      if (typeof v !== "number" || !Number.isFinite(v)) ok = false;
      s[k] = v as number;
    }
    if (ok) pts.push(s);
  }
  return pts;
}

// ───────────────────────────── Dimensions ─────────────────────────────

export type DimResult = { ok: true; lhs: string; rhs: string } | { ok: false; lhs?: string; rhs?: string; reason: string };

function unitOf(v: unknown): Unit | null {
  return v && typeof v === "object" && "equalBase" in (v as object) ? (v as Unit) : null;
}

function describeUnit(v: unknown): string {
  const u = unitOf(v);
  if (!u) return "1";
  const s = u.toString().replace(/^[-\d.e+]+\s*/, "");
  return s || "1";
}

/** Substitute each symbol by 1 of its unit and compare the dimensions of both sides. */
export function checkDimensions(lhs: MathNode, rhs: MathNode, units: Record<string, string>): DimResult {
  const scope: Record<string, unknown> = {};
  for (const [k, u] of Object.entries(units)) scope[k] = u ? math.unit(1, u) : 1;
  let l: unknown;
  let r: unknown;
  try {
    l = lhs.compile().evaluate({ ...scope });
  } catch (e) {
    return { ok: false, reason: e instanceof Error ? e.message : "lhs" };
  }
  try {
    r = rhs.compile().evaluate({ ...scope });
  } catch (e) {
    return { ok: false, lhs: describeUnit(l), reason: e instanceof Error ? e.message : "rhs" };
  }
  const lu = unitOf(l);
  const ru = unitOf(r);
  const same = lu && ru ? lu.equalBase(ru) : !lu && !ru;
  return same ? { ok: true, lhs: describeUnit(l), rhs: describeUnit(r) } : { ok: false, lhs: describeUnit(l), rhs: describeUnit(r), reason: "mismatch" };
}

/** Convert a value written in `unit` to the SI unit of a symbol; null when dimensions differ. */
export function toSI(value: number, unit: string, siUnit: string): number | null {
  if (!siUnit) return unit ? null : value;
  if (!unit) return null;
  try {
    return math.unit(value, unit).toNumber(siUnit);
  } catch {
    return null;
  }
}
