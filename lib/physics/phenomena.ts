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

// ───────────────────────────── Helpers for the interactive simulations ─────────────────────────────

/** Approximate visible colour of a wavelength (nm); UV is drawn violet, IR dark red. */
export function wavelengthToRGB(nm: number): string {
  let r = 0, g = 0, b = 0;
  if (nm < 380) [r, g, b] = [0.55, 0, 1];
  else if (nm < 440) [r, g, b] = [(440 - nm) / 60, 0, 1];
  else if (nm < 490) [r, g, b] = [0, (nm - 440) / 50, 1];
  else if (nm < 510) [r, g, b] = [0, 1, (510 - nm) / 20];
  else if (nm < 580) [r, g, b] = [(nm - 510) / 70, 1, 0];
  else if (nm < 645) [r, g, b] = [1, (645 - nm) / 65, 0];
  else [r, g, b] = [nm > 700 ? 0.6 : 1, 0, 0];
  const c = (v: number) => Math.round(255 * Math.min(1, Math.max(0, v)));
  return `rgb(${c(r)}, ${c(g)}, ${c(b)})`;
}

export const WORK_FUNCTIONS_EV = { Cs: 2.1, Na: 2.28, Zn: 4.3 } as const;

/** Photoelectric outcome for light of wavelength λ (nm) on a metal of work function φ (eV). */
export function photoEmission(lambdaNm: number, phiEv: number) {
  const f = CONST.c / (lambdaNm * 1e-9);
  const photonEv = (CONST.h * f) / CONST.e;
  const kEv = photonEv - phiEv;
  return { f, f0: (phiEv * CONST.e) / CONST.h, photonEv, kEv: Math.max(0, kEv), emits: kEv > 0 };
}

export type SlitMode = "both" | "one" | "detector";

/**
 * Relative intensity on the screen at height y (m) for slits of separation d and width a,
 * screen distance D. "detector" (which-path known) and "one" lose the interference term.
 */
export function slitIntensity(y: number, lambda: number, d: number, D: number, mode: SlitMode, a = d / 4): number {
  const theta = Math.atan2(y, D);
  const beta = (Math.PI * a * Math.sin(theta)) / lambda;
  const envelope = beta === 0 ? 1 : (Math.sin(beta) / beta) ** 2;
  if (mode === "one") return envelope;
  if (mode === "detector") return envelope; // sum of two single-slit patterns, overlapping for a ≪ D
  const phi = (Math.PI * d * Math.sin(theta)) / lambda;
  return envelope * Math.cos(phi) ** 2;
}

/** Electron hits sampled one by one from |ψ|² by rejection sampling. */
export function sampleHits(n: number, lambda: number, d: number, D: number, mode: SlitMode, halfHeight: number, rand: () => number): number[] {
  const hits: number[] = [];
  for (let guard = 0; hits.length < n && guard < n * 400; guard++) {
    const y = (rand() * 2 - 1) * halfHeight;
    if (rand() <= slitIntensity(y, lambda, d, D, mode)) hits.push(y);
  }
  return hits;
}

/** Tunnelling attempts: how many of n particles get through a barrier with probability p. */
export function tunnelTrials(n: number, p: number, rand: () => number): number {
  let through = 0;
  for (let i = 0; i < n; i++) if (rand() < p) through++;
  return through;
}

export const WATER = { cIce: 2100, cWater: 4186, cSteam: 2010, Lf: 3.34e5, Lv: 2.26e6 } as const;
export type Phase = "ice" | "melting" | "water" | "boiling" | "steam";

/** Heating curve of mass m starting as ice at T0 (°C): temperature and phase after heat Q (J). */
export function heatingState(m: number, Q: number, T0 = -20): { T: number; phase: Phase; melted: number; boiled: number } {
  const stages: { phase: Phase; q: number }[] = [
    { phase: "ice", q: m * WATER.cIce * (0 - T0) },
    { phase: "melting", q: m * WATER.Lf },
    { phase: "water", q: m * WATER.cWater * 100 },
    { phase: "boiling", q: m * WATER.Lv },
  ];
  let left = Math.max(0, Q);
  for (const s of stages) {
    if (left <= s.q) {
      const f = s.q ? left / s.q : 1;
      if (s.phase === "ice") return { T: T0 + f * -T0, phase: "ice", melted: 0, boiled: 0 };
      if (s.phase === "melting") return { T: 0, phase: "melting", melted: f, boiled: 0 };
      if (s.phase === "water") return { T: 100 * f, phase: "water", melted: 1, boiled: 0 };
      return { T: 100, phase: "boiling", melted: 1, boiled: f };
    }
    left -= s.q;
  }
  return { T: 100 + left / (m * WATER.cSteam), phase: "steam", melted: 1, boiled: 1 };
}

/** Breakpoints (Q, T) of the heating curve, for drawing it. */
export function heatingCurvePoints(m: number, T0 = -20, Tend = 130): [number, number][] {
  const q1 = m * WATER.cIce * -T0;
  const q2 = q1 + m * WATER.Lf;
  const q3 = q2 + m * WATER.cWater * 100;
  const q4 = q3 + m * WATER.Lv;
  return [[0, T0], [q1, 0], [q2, 0], [q3, 100], [q4, 100], [q4 + m * WATER.cSteam * (Tend - 100), Tend]];
}

/**
 * Two bodies (heat capacities C, J/K) exchanging heat through a wall of conductance k (W/K).
 * Returns the temperature history and the total entropy produced, which never decreases.
 */
export function equilibrate(tHot: number, tCold: number, C: number, k: number, dt: number, steps: number) {
  let h = tHot;
  let c = tCold;
  let S = 0;
  const history: { t: number; hot: number; cold: number; S: number }[] = [{ t: 0, hot: h, cold: c, S: 0 }];
  for (let i = 1; i <= steps; i++) {
    const dQ = k * (h - c) * dt;
    S += -dQ / h + dQ / c;
    h -= dQ / C;
    c += dQ / C;
    history.push({ t: i * dt, hot: h, cold: c, S });
  }
  return history;
}

/** Bimetallic strip curvature κ ≈ 3(α₁−α₂)ΔT / (2·thickness) for equal layers (Timoshenko). */
export function bimetalCurvature(alpha1: number, alpha2: number, dT: number, thickness: number): number {
  return (3 * (alpha1 - alpha2) * dT) / (2 * thickness);
}
