/** Newton's second law with optional kinetic friction: a = (F − μmg) / m. */

export const G = 9.8;

export function netForce(F: number, m: number, mu = 0): number {
  return Math.max(0, F - mu * m * G);
}

export function acceleration(F: number, m: number, mu = 0): number {
  return netForce(F, m, mu) / m;
}

export function distanceAt(t: number, a: number): number {
  return 0.5 * a * t * t;
}
