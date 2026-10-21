/**
 * Atomic physics engine: Bohr model and Rutherford (Coulomb) scattering.
 * Units chosen for the scale of the problem: energies in MeV/eV, lengths in fm/Å.
 */

/** e²/(4πε₀) = 1.44 MeV·fm. */
export const KE2_MEV_FM = 1.44;
export const RYDBERG_EV = 13.6;
export const BOHR_RADIUS_A = 0.529;
/** hc = 1240 eV·nm. */
export const HC_EV_NM = 1240;

/** Energy of level n in a hydrogen-like atom: Eₙ = −13.6 Z²/n² eV. */
export function bohrEnergy(Z: number, n: number): number {
  return (-RYDBERG_EV * Z * Z) / (n * n);
}

/** Orbit radius rₙ = 0.529 n²/Z Å. */
export function bohrRadius(Z: number, n: number): number {
  return (BOHR_RADIUS_A * n * n) / Z;
}

/** Photon wavelength (nm) for a transition n_hi → n_lo. */
export function transitionWavelength(Z: number, nHi: number, nLo: number): number {
  const dE = bohrEnergy(Z, nHi) - bohrEnergy(Z, nLo);
  return HC_EV_NM / dE;
}

/** Distance of closest approach for a head-on α (charge 2e) of kinetic energy K: d = k·2Ze²/K (fm). */
export function closestApproach(Z: number, kMeV: number): number {
  return (KE2_MEV_FM * 2 * Z) / kMeV;
}

/** Rutherford deflection angle (rad) for impact parameter b (fm): tan(θ/2) = d/(2b). */
export function rutherfordAngle(bFm: number, Z: number, kMeV: number): number {
  const d = closestApproach(Z, kMeV);
  return 2 * Math.atan(d / (2 * Math.max(bFm, 1e-9)));
}

/** Impact parameter that gives angle θ: b = (d/2)·cot(θ/2). */
export function impactForAngle(thetaRad: number, Z: number, kMeV: number): number {
  return (closestApproach(Z, kMeV) / 2) / Math.tan(thetaRad / 2);
}

/** Relative Rutherford cross-section per unit solid angle ∝ 1/sin⁴(θ/2). */
export function rutherfordRelative(thetaRad: number): number {
  return 1 / Math.sin(thetaRad / 2) ** 4;
}

/** Fraction of particles scattered beyond θ when impact parameters are spread over a disk of radius bMax. */
export function fractionBeyond(thetaRad: number, Z: number, kMeV: number, bMaxFm: number): number {
  const b = impactForAngle(thetaRad, Z, kMeV);
  return Math.min(1, (b / bMaxFm) ** 2);
}

export type AtomModel = "rutherford" | "thomson";

/**
 * Sample scattering angles (degrees).
 * Rutherford: point nucleus, angle from the impact parameter (uniform over the beam disk).
 * Thomson ("plum pudding"): spread-out charge gives only tiny random deflections.
 */
export function sampleAngles(n: number, Z: number, kMeV: number, model: AtomModel, rand: () => number, bMaxFm = 2000): number[] {
  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    if (model === "thomson") {
      // Gaussian-ish small-angle deflection (~1°), via sum of uniforms.
      const g = (rand() + rand() + rand() - 1.5) * 1.4;
      out.push(Math.abs(g));
    } else {
      const b = bMaxFm * Math.sqrt(rand());
      out.push((rutherfordAngle(b, Z, kMeV) * 180) / Math.PI);
    }
  }
  return out;
}

/**
 * Integrate an α trajectory in the Coulomb field of a fixed nucleus (scene units, nucleus at origin).
 * Unit speed and mass, so the head-on closest approach d means k = d/2 (force k/r²).
 */
export function trajectory(b: number, d: number, x0 = -300, steps = 1400, dt = 0.6): [number, number][] {
  let x = x0;
  let y = b;
  let vx = 1;
  let vy = 0;
  const pts: [number, number][] = [[x, y]];
  for (let i = 0; i < steps; i++) {
    const r2 = x * x + y * y;
    const r = Math.sqrt(r2);
    const a = d / 2 / Math.max(r2, 1);
    vx += (a * x) / r * dt;
    vy += (a * y) / r * dt;
    x += vx * dt;
    y += vy * dt;
    if (i % 6 === 0) pts.push([x, y]);
    if (Math.abs(x) > 340 || Math.abs(y) > 340) break;
  }
  return pts;
}

/** Electron shells by the 2n² rule, filled in order up to Z (simple Bohr–Bury picture for Z ≤ 20). */
export function shellsFor(Z: number): number[] {
  const caps = [2, 8, 8, 18];
  const shells: number[] = [];
  let left = Z;
  for (const c of caps) {
    if (left <= 0) break;
    shells.push(Math.min(c, left));
    left -= c;
  }
  return shells;
}
