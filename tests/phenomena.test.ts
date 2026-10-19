import { describe, expect, it } from "vitest";
import { checkNumeric } from "@/lib/engine/evaluator";
import { CATEGORY_LABEL, PHENOMENA } from "@/lib/phenomena";
import * as P from "@/lib/physics/phenomena";
import { getWorkbenchProblem } from "@/lib/workbench/problems";

describe("phenomena physics", () => {
  it("matches textbook values", () => {
    expect(P.wireField(10, 0.05)).toBeCloseTo(4e-5, 10);
    expect(P.compassDeflectionDeg(4e-5)).toBeCloseTo(45, 6);
    expect(P.photoKmax(400e-9, 2.28 * P.CONST.e) / P.CONST.e).toBeCloseTo(0.82, 2);
    expect(P.expansion(1.2e-5, 12, 40)).toBeCloseTo(5.76e-3, 8);
    expect(P.iceToWaterHeat(0.5, -10, 20).total).toBeCloseTo(219360, 0);
    expect(P.entropyOfHeatFlow(1000, 400, 300)).toBeGreaterThan(0);
    expect(P.electronWavelength(100) * 1e9).toBeCloseTo(0.1226, 3);
    expect(P.unruhTemperature(1e20)).toBeCloseTo(0.4055, 3);
    const t = P.tunnelProbability(1, 5, 0.5e-9);
    expect(t).toBeGreaterThan(1e-5);
    expect(t).toBeLessThan(1e-4);
    // Doubling the barrier width roughly squares the probability.
    expect(P.tunnelProbability(1, 5, 1e-9)).toBeCloseTo(t * t, 12);
  });
});

describe("phenomena modules", () => {
  it("covers the nine required phenomena in three categories", () => {
    expect(PHENOMENA.map((p) => p.id)).toEqual(["magnetism", "hall-effect", "photoelectric", "thermal-expansion", "phase-transitions", "entropy", "wave-particle", "tunneling", "unruh"]);
    for (const c of Object.keys(CATEGORY_LABEL)) expect(PHENOMENA.filter((p) => p.category === c)).toHaveLength(3);
    expect(PHENOMENA.find((p) => p.id === "unruh")?.advanced).toBe(true);
  });

  it.each(PHENOMENA.map((p) => [p.id, p] as const))("%s is complete and its mission grades", (_id, p) => {
    expect(p.description.length).toBeGreaterThan(40);
    expect(p.famous.text.length).toBeGreaterThan(40);
    expect(p.equation.latex).toBeTruthy();
    expect(p.workbench.chain.length).toBeGreaterThanOrEqual(2);
    expect(Object.values(p.hints).every((h) => h.length > 10)).toBe(true);
    const { value, unit } = p.mission.answer;
    expect(checkNumeric(`${value} ${unit}`.trim(), p.mission.answer).status).toBe("correct");
    for (const w of p.mission.wrongValues) {
      const r = checkNumeric(`${w.value} ${unit}`.trim(), p.mission.answer, p.mission.wrongValues);
      expect(r.status).toBe("incorrect");
    }
    if (p.workbenchProblemId) expect(getWorkbenchProblem(p.workbenchProblemId)).toBeDefined();
  });

  it("accepts answers in other units", () => {
    const photo = PHENOMENA.find((p) => p.id === "photoelectric")!;
    expect(checkNumeric("1.31e-19 J", photo.mission.answer).status).toBe("correct");
    const mag = PHENOMENA.find((p) => p.id === "magnetism")!;
    expect(checkNumeric("40 μT", mag.mission.answer).status).toBe("correct");
    const exp = PHENOMENA.find((p) => p.id === "thermal-expansion")!;
    expect(checkNumeric("5.76 mm", exp.mission.answer).status).toBe("correct");
  });
});

describe("simulation physics", () => {
  const rand = () => {
    let x = 12345;
    return () => {
      x = (x * 1664525 + 1013904223) >>> 0;
      return x / 2 ** 32;
    };
  };

  it("photoelectric: no emission below threshold whatever the colour intensity", () => {
    expect(P.photoEmission(650, P.WORK_FUNCTIONS_EV.Na).emits).toBe(false);
    const uv = P.photoEmission(400, P.WORK_FUNCTIONS_EV.Na);
    expect(uv.emits).toBe(true);
    expect(uv.kEv).toBeCloseTo(0.82, 2);
    expect(P.photoEmission(400, P.WORK_FUNCTIONS_EV.Zn).emits).toBe(false);
  });

  it("double slit: hits cluster at bright fringes spaced λD/d; one slit has no fringes", () => {
    const lambda = P.electronWavelength(100);
    const d = 1e-6;
    const spacing = P.fringeSpacing(lambda, 1, d);
    expect(P.slitIntensity(0, lambda, d, 1, "both")).toBeCloseTo(1, 6);
    expect(P.slitIntensity(spacing / 2, lambda, d, 1, "both")).toBeLessThan(0.01);
    expect(P.slitIntensity(spacing, lambda, d, 1, "both")).toBeGreaterThan(0.7);
    expect(P.slitIntensity(spacing / 2, lambda, d, 1, "one")).toBeGreaterThan(0.9);
    const hits = P.sampleHits(3000, lambda, d, 1, "both", 0.5e-3, rand());
    expect(hits).toHaveLength(3000);
    const nearDark = hits.filter((y) => Math.abs(Math.abs(y) - spacing / 2) < spacing * 0.05).length;
    const nearBright = hits.filter((y) => Math.abs(y) < spacing * 0.05).length;
    expect(nearBright).toBeGreaterThan(nearDark * 5);
  });

  it("tunnelling Monte Carlo converges to T", () => {
    const T = P.tunnelProbability(1, 5, 0.2e-9);
    const n = 200000;
    expect(P.tunnelTrials(n, T, rand()) / n).toBeCloseTo(T, 2);
  });

  it("heating curve has flat plateaus at 0 °C and 100 °C", () => {
    const m = 0.5;
    const pts = P.heatingCurvePoints(m);
    expect(pts[1][1]).toBe(0);
    expect(pts[2][1]).toBe(0);
    expect(pts[4][0] - pts[3][0]).toBeCloseTo(m * P.WATER.Lv, 6);
    expect(P.heatingState(m, (pts[1][0] + pts[2][0]) / 2)).toMatchObject({ T: 0, phase: "melting" });
    expect(P.heatingState(m, (pts[3][0] + pts[4][0]) / 2)).toMatchObject({ T: 100, phase: "boiling" });
    expect(P.heatingState(m, pts[5][0]).phase).toBe("steam");
  });

  it("heat flow: temperatures converge and total entropy never decreases", () => {
    const h = P.equilibrate(400, 300, 50, 8, 0.25, 400);
    for (let i = 1; i < h.length; i++) expect(h[i].S).toBeGreaterThanOrEqual(h[i - 1].S - 1e-12);
    const last = h[h.length - 1];
    expect(last.hot - last.cold).toBeLessThan(1);
    expect(last.hot + last.cold).toBeCloseTo(700, 6);
  });

  it("bimetal bends toward the low-expansion side when heated, the other way when cooled", () => {
    expect(P.bimetalCurvature(19e-6, 12e-6, 40, 1e-3)).toBeGreaterThan(0);
    expect(P.bimetalCurvature(19e-6, 12e-6, -20, 1e-3)).toBeLessThan(0);
  });

  it("maps wavelengths to plausible colours", () => {
    expect(P.wavelengthToRGB(650)).toBe("rgb(255, 0, 0)");
    expect(P.wavelengthToRGB(530)).toMatch(/^rgb\(\d+, 255, 0\)$/);
  });
});
