/** A block on a rough incline; one friction coefficient for starting and sliding. */
import { G } from "./newton";
import { deg2rad, rad2deg } from "./trig";

export function weightComponents(m: number, thetaDeg: number): { along: number; normal: number } {
  const t = deg2rad(thetaDeg);
  return { along: m * G * Math.sin(t), normal: m * G * Math.cos(t) };
}

export function maxStaticFriction(mu: number, normal: number): number {
  return mu * normal;
}

/** The block slips once the slope's pull beats maximum friction: tanθ > μ (mass cancels). */
export function slides(thetaDeg: number, mu: number): boolean {
  return Math.tan(deg2rad(thetaDeg)) > mu + 1e-12;
}

/** Angle of friction: the steepest slope a block can rest on. */
export function frictionAngle(mu: number): number {
  return rad2deg(Math.atan(mu));
}

/** Acceleration down the slope once sliding (0 when at rest). */
export function slideAcceleration(thetaDeg: number, mu: number): number {
  const t = deg2rad(thetaDeg);
  return Math.max(0, G * (Math.sin(t) - mu * Math.cos(t)));
}
