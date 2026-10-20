/**
 * Arithmetic sequences (المتتاليات الحسابية): recursive and explicit forms.
 * Pure functions shared by the lesson simulations, the practice checker and the tests.
 */

/** Rounds away floating-point noise so 0.1 + 0.2 shows as 0.3. */
export const clean = (x: number) => +x.toFixed(10);

/** a_1, a_2, …, a_count from the recursive rule a_n = a_{n-1} + d. */
export function recursiveTerms(a1: number, d: number, count: number): number[] {
  const out: number[] = [];
  let a = a1;
  for (let n = 1; n <= count; n++) {
    out.push(clean(a));
    a += d;
  }
  return out;
}

/** a_n = a_1 + (n − 1)d, straight to the term without the ones before it. */
export function explicitTerm(a1: number, d: number, n: number): number {
  return clean(a1 + (n - 1) * d);
}

/** The explicit formula simplified to a_n = d·n + (a_1 − d), e.g. a_1 = 9, d = 6 → 6n + 3. */
export function explicitCoefficients(a1: number, d: number): { slope: number; intercept: number } {
  return { slope: clean(d), intercept: clean(a1 - d) };
}

/** Differences a_n − a_{n-1} between neighbours. */
export function differences(terms: number[]): number[] {
  return terms.slice(1).map((t, i) => clean(t - terms[i]));
}

export type ArithmeticVerdict =
  | { status: "too-short" }
  | { status: "arithmetic"; a1: number; d: number }
  | { status: "not-arithmetic"; diffs: number[]; breakAt: number };

/** Is a typed list arithmetic? breakAt is the 1-based index n whose difference a_n − a_{n-1} first disagrees. */
export function classify(terms: number[]): ArithmeticVerdict {
  if (terms.length < 3) return { status: "too-short" };
  const diffs = differences(terms);
  const i = diffs.findIndex((x) => Math.abs(x - diffs[0]) > 1e-9);
  if (i === -1) return { status: "arithmetic", a1: terms[0], d: diffs[0] };
  return { status: "not-arithmetic", diffs, breakAt: i + 2 };
}

/** Parses "3, 5, 7" / "3 5 7" / "1/3، 1/12" / Arabic-Indic digits into numbers; null if any item is not a number. */
export function parseList(raw: string): number[] | null {
  const ascii = raw.replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660)).replace(/[٫]/g, ".");
  const items = ascii
    .split(/[\s,،؛;]+/)
    .map((s) => s.trim())
    .filter((s) => s && s !== "..." && s !== "…");
  if (!items.length) return null;
  const out: number[] = [];
  for (const s of items) {
    const v = parseNumber(s);
    if (v === null) return null;
    out.push(v);
  }
  return out;
}

/** A single number, optionally a fraction like -1/4. */
export function parseNumber(raw: string): number | null {
  const s = raw
    .trim()
    .replace(/[٠-٩]/g, (c) => String(c.charCodeAt(0) - 0x0660))
    .replace(/[٫]/g, ".")
    .replace(/[−–]/g, "-");
  if (!s) return null;
  const frac = s.match(/^([+-]?\d+(?:\.\d+)?)\s*\/\s*(\d+(?:\.\d+)?)$/);
  if (frac) {
    const den = Number(frac[2]);
    return den === 0 ? null : Number(frac[1]) / den;
  }
  return /^[+-]?(\d+(\.\d*)?|\.\d+)$/.test(s) ? Number(s) : null;
}

/** Which term number holds the value, if any: solves a_1 + (n − 1)d = value for a whole n ≥ 1. */
export function termIndexOf(a1: number, d: number, value: number): number | null {
  if (d === 0) return value === a1 ? 1 : null;
  const n = (value - a1) / d + 1;
  return Math.abs(n - Math.round(n)) < 1e-9 && Math.round(n) >= 1 ? Math.round(n) : null;
}

/** LaTeX for a signed coefficient term: "+ 6", "- 2", "" for zero. */
export function signed(x: number): string {
  const v = clean(x);
  if (v === 0) return "";
  return v > 0 ? `+ ${fmt(v)}` : `- ${fmt(-v)}`;
}

/** Short display of a number: short decimals stay decimal (1.5), repeating ones become fractions (1/3, 1/192). */
export function fmt(x: number): string {
  const v = clean(x);
  if (Number.isInteger(v) || Math.abs(v * 1000 - Math.round(v * 1000)) < 1e-7) return String(v);
  for (let den = 2; den <= 1000; den++) {
    const num = v * den;
    if (Math.abs(num - Math.round(num)) < 1e-7) return `${v < 0 ? "-" : ""}\\tfrac{${Math.abs(Math.round(num))}}{${den}}`;
  }
  return String(+v.toFixed(3));
}

/** Explicit formula in simplified LaTeX: 6n + 3, -2n, n - 1 … */
export function explicitTex(a1: number, d: number): string {
  const { slope, intercept } = explicitCoefficients(a1, d);
  if (slope === 0) return fmt(intercept);
  const lead = slope === 1 ? "n" : slope === -1 ? "-n" : `${fmt(slope)}n`;
  return `${lead} ${signed(intercept)}`.trim();
}
