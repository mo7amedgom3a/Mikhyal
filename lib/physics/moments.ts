/** Moments about a pivot. Positive torque turns the beam toward the right-hand side (clockwise). */
import { G } from "./newton";

/** Net torque (N·m) for a left load (m1 at d1) and a right load (m2 at d2). */
export function netTorque(m1: number, d1: number, m2: number, d2: number): number {
  return G * (m2 * d2 - m1 * d1);
}

/** Where the right-hand load must sit to balance: m1·d1 = m2·d2. */
export function balancePosition(m1: number, d1: number, m2: number): number {
  return (m1 * d1) / m2;
}

/** Effort needed on a lever: F_effort · d_effort = F_load · d_load. */
export function leverEffort(load: number, loadArm: number, effortArm: number): number {
  return (load * loadArm) / effortArm;
}
