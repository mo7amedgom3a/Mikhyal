/**
 * Exponential and logarithmic functions (الدوال الأسية واللوغاريتمية), lesson 1-1 onward.
 * Pure functions shared by the simulations, the practice checker and the tests.
 */

/** y = a·b^(x − h) + k, the parent b^x after the textbook's transformations. */
export interface ExpParams {
  a: number;
  b: number;
  h: number;
  k: number;
}

export const expAt = ({ a, b, h, k }: ExpParams, x: number) => a * b ** (x - h) + k;

export type ExpKind = "growth" | "decay" | "constant";

/** Growth when the curve rises left to right; a reflection (a < 0) flips it. */
export function kindOf({ a, b }: ExpParams): ExpKind {
  if (a === 0 || b === 1) return "constant";
  return (b > 1) === (a > 0) ? "growth" : "decay";
}

/** Key features as in the textbook summary (ملخص المفهوم: خصائص الدوال الأسية). */
export function features(p: ExpParams) {
  const { a, b, k } = p;
  const rising = b > 1;
  return {
    /** All real numbers. */
    domain: "\\mathbb{R}",
    range: a > 0 ? `\\{y : y > ${num(k)}\\}` : `\\{y : y < ${num(k)}\\}`,
    yIntercept: expAt(p, 0),
    asymptote: k,
    /** Limit of y as x → +∞ and x → −∞ (Infinity, -Infinity or the asymptote k). */
    right: rising ? (a > 0 ? Infinity : -Infinity) : k,
    left: rising ? k : a > 0 ? Infinity : -Infinity,
  };
}

/** b = 1 + r for growth, b = 1 − r for decay; r is the rate per period (0.013 = 1.3%). */
export const rateOf = (b: number) => Math.abs(b - 1);

/** A(t) = a(1 ± r)^t. */
export const model = (a: number, r: number, t: number, growth = true) => a * (growth ? 1 + r : 1 - r) ** t;

/** log_b x, or NaN outside the domain (x ≤ 0, b ≤ 0, b = 1). */
export function logBase(b: number, x: number): number {
  if (x <= 0 || b <= 0 || b === 1) return NaN;
  const v = Math.log(x) / Math.log(b);
  const r = Math.round(v);
  return Math.abs(v - r) < 1e-12 ? r : v;
}

/** Solves a·b^x = target with logarithms: x = log(target / a) / log b. Null when there is no solution. */
export function solveExp(a: number, b: number, target: number): number | null {
  const ratio = target / a;
  if (!(ratio > 0) || b <= 0 || b === 1) return null;
  return Math.log(ratio) / Math.log(b);
}

/** Periods for the quantity to double (growth) or halve (decay). */
export const doublingTime = (b: number) => Math.log(2) / Math.abs(Math.log(b));

/** Average rate of change (y2 − y1)/(x2 − x1). */
export const avgRate = (f: (x: number) => number, x1: number, x2: number) => (f(x2) - f(x1)) / (x2 - x1);

/** Richter scale: each whole step is 10× the wave amplitude and about 31.6× the energy. */
export const quakeAmplitudeRatio = (m1: number, m2: number) => 10 ** (m2 - m1);
export const quakeEnergyRatio = (m1: number, m2: number) => 10 ** (1.5 * (m2 - m1));

/** Sound level L = 10·log(I / I₀) with I₀ = 10⁻¹² W/m². */
export const I0 = 1e-12;
export const decibels = (intensity: number) => 10 * Math.log10(intensity / I0);
export const intensityOf = (dB: number) => I0 * 10 ** (dB / 10);

/** Short number for LaTeX: up to `digits` decimals, thousands grouped with thin spaces (96\,000). */
export function num(x: number, digits = 3): string {
  if (!Number.isFinite(x)) return x > 0 ? "\\infty" : "-\\infty";
  const v = Math.abs(x) >= 1000 ? Math.round(x) : +x.toFixed(digits);
  const [int, dec] = String(Math.abs(v)).split(".");
  const grouped = int.length > 4 ? int.replace(/\B(?=(\d{3})+(?!\d))/g, "\\,") : int;
  return `${v < 0 ? "-" : ""}${grouped}${dec ? "." + dec : ""}`;
}

/** Scientific notation for very large/small ratios. */
export function sciTex(x: number): string {
  if (x === 0) return "0";
  const a = Math.abs(x);
  if (a >= 0.01 && a < 1e6) return num(x);
  const e = Math.floor(Math.log10(a));
  return `${+(x / 10 ** e).toPrecision(3)}\\times10^{${e}}`;
}

/** A round axis step giving about `lines` grid lines over `span`. */
export function niceStep(span: number, lines = 6): number {
  const raw = Math.abs(span) / lines || 1;
  const e = 10 ** Math.floor(Math.log10(raw));
  for (const m of [1, 2, 5, 10]) if (raw <= m * e) return m * e;
  return 10 * e;
}
