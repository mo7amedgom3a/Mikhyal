/** Ohm's law and electrical power for a simple series circuit. */

export function current(V: number, R: number): number {
  return V / R;
}

export function power(V: number, R: number): number {
  return (V * V) / R;
}

export function minResistance(V: number, Imax: number): number {
  return V / Imax;
}

export function fuseBlows(V: number, R: number, Imax: number): boolean {
  return current(V, R) > Imax;
}
