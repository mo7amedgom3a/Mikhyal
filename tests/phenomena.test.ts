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
