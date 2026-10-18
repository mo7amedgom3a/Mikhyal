/** Force table: forces act on a ring at the origin; equilibrium when the resultant vanishes. */
import { add, direction, fromPolar, magnitude, type Vec2 } from "@/lib/physics/vectors";

export interface Force {
  id: string;
  label: string;
  magnitude: number; // N
  angle: number; // degrees, counter-clockwise from +x
  locked?: boolean;
  max?: number;
  /** If set, only the magnitude may change: the force stays on this direction (a cable). */
  fixedAngle?: boolean;
}

export interface ForceState {
  forces: Force[];
}

export interface ForceSolution {
  resultant: Vec2;
  magnitude: number;
  direction: number;
  equilibrium: boolean;
}

export const EQUILIBRIUM_TOL = 0.15;

export function solveForces(state: ForceState): ForceSolution {
  const R = state.forces.reduce<Vec2>((acc, f) => add(acc, fromPolar(f.magnitude, f.angle)), [0, 0]);
  const m = magnitude(R);
  return { resultant: R, magnitude: m, direction: direction(R), equilibrium: m < EQUILIBRIUM_TOL };
}

const snap = (v: number, step: number) => Math.round(v / step) * step;
/** Half-newton steps are easy to hit by hand on a phone; angles snap to whole degrees. */
const MAG_STEP = 0.5;

/** Move a force's tip to a dragged point, honouring its constraints and snapping. */
export function moveForce(state: ForceState, id: string, [x, y]: Vec2): ForceState {
  return {
    forces: state.forces.map((f) => {
      if (f.id !== id || f.locked) return f;
      const max = f.max ?? 10;
      if (f.fixedAngle) {
        const u = fromPolar(1, f.angle);
        const along = Math.max(0, x * u[0] + y * u[1]);
        return { ...f, magnitude: Number(Math.min(max, snap(along, MAG_STEP)).toFixed(1)) };
      }
      const mag = Math.min(max, Math.max(MAG_STEP, snap(Math.hypot(x, y), MAG_STEP)));
      const ang = ((snap((Math.atan2(y, x) * 180) / Math.PI, 1) % 360) + 360) % 360;
      return { ...f, magnitude: Number(mag.toFixed(1)), angle: ang };
    }),
  };
}
