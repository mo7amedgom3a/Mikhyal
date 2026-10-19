/** Pure models behind the phenomena modules (SI units throughout). */

export const CONST = {
  h: 6.62607015e-34,
  hbar: 1.054571817e-34,
  c: 2.99792458e8,
  e: 1.602176634e-19,
  me: 9.1093837015e-31,
  mu0: 4 * Math.PI * 1e-7,
  kB: 1.380649e-23,
} as const;

/** Field of a long straight wire at distance r: B = μ₀I / 2πr. */
export function wireField(current: number, r: number): number {
  return (CONST.mu0 * current) / (2 * Math.PI * r);
}

/** Compass deflection when a wire field B is perpendicular to Earth's horizontal field. */
export function compassDeflectionDeg(b: number, earthHorizontal = 4e-5): number {
  return (Math.atan2(b, earthHorizontal) * 180) / Math.PI;
}

/** Hall voltage across a strip of thickness t: V_H = IB / (n q t). */
export function hallVoltage(current: number, b: number, n: number, t: number, q = CONST.e): number {
  return (current * b) / (n * q * t);
}

/** Photoelectric effect: K_max = hc/λ − φ (J). Negative means no emission. */
export function photoKmax(lambda: number, workFunctionJ: number): number {
  return (CONST.h * CONST.c) / lambda - workFunctionJ;
}

export function thresholdFrequency(workFunctionJ: number): number {
  return workFunctionJ / CONST.h;
}

/** Linear thermal expansion: ΔL = α L₀ ΔT. */
export function expansion(alpha: number, l0: number, dT: number): number {
  return alpha * l0 * dT;
}

/** Latent heat: Q = m L. */
export function latentHeat(mass: number, latent: number): number {
  return mass * latent;
}

/** Heat needed to take ice at T_ice (<0 °C) to water at T_water (>0 °C). */
export function iceToWaterHeat(mass: number, tIce: number, tWater: number) {
  const cIce = 2100;
  const cWater = 4186;
  const lf = 3.34e5;
  const warmIce = mass * cIce * (0 - tIce);
  const melt = mass * lf;
  const warmWater = mass * cWater * tWater;
  return { warmIce, melt, warmWater, total: warmIce + melt + warmWater };
}

/** Total entropy change when heat Q flows from a hot reservoir to a cold one. */
export function entropyOfHeatFlow(q: number, tHot: number, tCold: number): number {
  return -q / tHot + q / tCold;
}

/** de Broglie wavelength of an electron accelerated through V volts (non-relativistic). */
export function electronWavelength(volts: number): number {
  return CONST.h / Math.sqrt(2 * CONST.me * CONST.e * volts);
}

/** Double-slit fringe spacing: Δy = λD / d. */
export function fringeSpacing(lambda: number, screen: number, slit: number): number {
  return (lambda * screen) / slit;
}

/** Rectangular-barrier tunnelling estimate: T ≈ e^(−2κL), κ = √(2m(U−E))/ħ. */
export function tunnelProbability(energyEv: number, barrierEv: number, widthM: number, mass = CONST.me): number {
  const kappa = Math.sqrt(2 * mass * (barrierEv - energyEv) * CONST.e) / CONST.hbar;
  return Math.exp(-2 * kappa * widthM);
}

/** Unruh temperature for proper acceleration a: T = ħa / (2π c k_B). */
export function unruhTemperature(a: number): number {
  return (CONST.hbar * a) / (2 * Math.PI * CONST.c * CONST.kB);
}
