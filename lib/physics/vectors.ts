/** Forces as 2D vectors; angles in degrees. */
import { deg2rad, rad2deg } from "./trig";

export type Vec2 = [number, number];

export function fromPolar(magnitude: number, angleDeg: number): Vec2 {
  const a = deg2rad(angleDeg);
  return [magnitude * Math.cos(a), magnitude * Math.sin(a)];
}

export function add(a: Vec2, b: Vec2): Vec2 {
  return [a[0] + b[0], a[1] + b[1]];
}

export function magnitude(v: Vec2): number {
  return Math.hypot(v[0], v[1]);
}

export function direction(v: Vec2): number {
  return rad2deg(Math.atan2(v[1], v[0]));
}

/** Law of cosines with θ the angle *between* the two forces. */
export function resultant(F1: number, F2: number, thetaDeg: number): number {
  const c = Math.cos(deg2rad(thetaDeg));
  return Math.sqrt(Math.max(0, F1 * F1 + F2 * F2 + 2 * F1 * F2 * c));
}
