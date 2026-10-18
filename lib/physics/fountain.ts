/** Quadratic trajectory y = ax² + bx + c. */

export function evaluate(a: number, b: number, c: number, x: number): number {
  return a * x * x + b * x + c;
}

export function vertex(a: number, b: number, c: number): { x: number; y: number } {
  const x = -b / (2 * a);
  return { x, y: evaluate(a, b, c, x) };
}

/** Real roots sorted ascending; empty when the discriminant is negative. */
export function roots(a: number, b: number, c: number): number[] {
  const d = b * b - 4 * a * c;
  if (d < 0) return [];
  const s = Math.sqrt(d);
  return [(-b - s) / (2 * a), (-b + s) / (2 * a)].sort((p, q) => p - q);
}

/** Where the jet lands (largest positive root) for a downward parabola. */
export function landingX(a: number, b: number, c: number): number | null {
  const r = roots(a, b, c).filter((x) => x > 0);
  return r.length ? Math.max(...r) : null;
}
