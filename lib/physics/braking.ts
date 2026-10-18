/** Uniform deceleration: v² = u² − 2as (a = magnitude of deceleration). */

export function stoppingDistance(u: number, a: number): number {
  return a > 0 ? (u * u) / (2 * a) : Infinity;
}

export function minDeceleration(u: number, d: number): number {
  return (u * u) / (2 * d);
}

export function stoppingTime(u: number, a: number): number {
  return a > 0 ? u / a : Infinity;
}

export function stateAt(t: number, u: number, a: number): { x: number; v: number } {
  const tStop = stoppingTime(u, a);
  const tt = Math.min(t, tStop);
  return { x: u * tt - 0.5 * a * tt * tt, v: Math.max(0, u - a * tt) };
}
