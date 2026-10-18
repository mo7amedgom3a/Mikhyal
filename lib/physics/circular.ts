/** Uniform circular motion on a flat curve held by friction. */
import { G } from "./newton";

export function centripetalAcceleration(v: number, r: number): number {
  return (v * v) / r;
}

/** Friction provides the centripetal force: μmg = mv²/r → v_max = √(μgr). */
export function maxSafeSpeed(mu: number, r: number): number {
  return Math.sqrt(mu * G * r);
}

export function isSafe(v: number, r: number, mu: number): boolean {
  return v <= maxSafeSpeed(mu, r);
}
