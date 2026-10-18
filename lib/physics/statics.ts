/** Equilibrium of a weight hung from two symmetric cables, each at θ above the horizontal. */
import { deg2rad } from "./trig";

/** Vertical balance 2T·sinθ = W. */
export function symmetricTension(W: number, thetaDeg: number): number {
  return W / (2 * Math.sin(deg2rad(thetaDeg)));
}

/** Smallest cable angle that keeps the tension within the cable rating. */
export function minSafeAngle(W: number, Tmax: number): number {
  return (Math.asin(Math.min(1, W / (2 * Tmax))) * 180) / Math.PI;
}
