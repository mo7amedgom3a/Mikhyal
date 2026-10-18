import { describe, expect, it } from "vitest";
import { minDeceleration, stateAt, stoppingDistance } from "@/lib/physics/braking";
import { acceleration } from "@/lib/physics/newton";
import { centripetalAcceleration, maxSafeSpeed } from "@/lib/physics/circular";
import { current, minResistance } from "@/lib/physics/ohm";
import { betaForGamma, gamma } from "@/lib/physics/relativity";
import { landingX, roots, vertex } from "@/lib/physics/fountain";

describe("physics models", () => {
  it("braking: 20 m/s, 30 m → 6.67 m/s²", () => {
    expect(minDeceleration(20, 30)).toBeCloseTo(6.667, 2);
    expect(stoppingDistance(20, 400 / 60)).toBeCloseTo(30, 6);
    expect(stateAt(100, 20, 5)).toEqual({ x: 40, v: 0 });
  });
  it("newton: 3000 N / 2400 kg = 1.25 m/s²", () => {
    expect(acceleration(3000, 2400)).toBeCloseTo(1.25);
    expect(acceleration(100, 10, 2)).toBe(0);
  });
  it("circular: v_max on r=50, μ=0.5", () => {
    expect(maxSafeSpeed(0.5, 50)).toBeCloseTo(15.65, 2);
    expect(centripetalAcceleration(12, 8)).toBe(18);
  });
  it("ohm", () => {
    expect(current(12, 4)).toBe(3);
    expect(minResistance(12, 2)).toBe(6);
  });
  it("relativity", () => {
    expect(gamma(0.6)).toBeCloseTo(1.25);
    expect(betaForGamma(2)).toBeCloseTo(0.866, 3);
    expect(2.2 * gamma(0.98)).toBeCloseTo(11.06, 1);
  });
  it("fountain: a=-0.5, b=2 lands at 4 with peak 2", () => {
    expect(landingX(-0.5, 2, 0)).toBeCloseTo(4);
    expect(vertex(-0.5, 2, 0)).toEqual({ x: 2, y: 2 });
    expect(roots(1, 2, 5)).toEqual([]);
  });
});
