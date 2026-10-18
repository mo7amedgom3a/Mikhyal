/** Angles of elevation and right-triangle trigonometry. Angles in degrees at the API edge. */

export const deg2rad = (d: number) => (d * Math.PI) / 180;
export const rad2deg = (r: number) => (r * 180) / Math.PI;

/** Height of the line of sight above the observer's eye after a horizontal distance d. */
export function heightFromAngle(d: number, thetaDeg: number): number {
  return d * Math.tan(deg2rad(thetaDeg));
}

/** Angle of elevation needed to see the top of an object of height h from distance d. */
export function angleToTop(h: number, d: number): number {
  return rad2deg(Math.atan2(h, d));
}
