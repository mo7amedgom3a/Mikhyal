import { describe, expect, it } from "vitest";
import { moveForce, solveForces, type ForceState } from "@/lib/sandbox/forces/model";
import { forcesSandbox } from "@/lib/sandbox/forces/levels";
import { fromPolar } from "@/lib/physics/vectors";

const SOLUTIONS: Record<string, Record<string, [number, number]>> = {
  "one-force": { "F₂": [5, 180] },
  "right-angle": { "F₃": [5, 233] },
  "three-equal": { "F₂": [6, 210], "F₃": [6, 330] },
  lami: { "T₁": [10, 150], "T₂": [10, 30] },
  limited: { "F₂": [5, 173], "F₃": [5, 247] },
};

describe("force table", () => {
  it("equilibrium of three equal forces at 120°", () => {
    const s: ForceState = { forces: [0, 120, 240].map((a, i) => ({ id: `${i}`, label: `${i}`, magnitude: 6, angle: a })) };
    expect(solveForces(s).equilibrium).toBe(true);
  });
  it("moving a fixed-direction force only changes its magnitude", () => {
    const s: ForceState = { forces: [{ id: "T", label: "T", magnitude: 4, angle: 30, fixedAngle: true, max: 15 }] };
    const t = moveForce(s, "T", fromPolar(10, 80));
    expect(t.forces[0].angle).toBe(30);
    // 10·cos50° ≈ 6.43 snaps to the nearest half newton
    expect(t.forces[0].magnitude).toBe(6.5);
  });
  it("respects max magnitude and locks", () => {
    const s: ForceState = { forces: [{ id: "a", label: "a", magnitude: 3, angle: 0, max: 5 }, { id: "b", label: "b", magnitude: 2, angle: 0, locked: true }] };
    const t = moveForce(moveForce(s, "a", [20, 0]), "b", [9, 9]);
    expect(t.forces[0].magnitude).toBe(5);
    expect(t.forces[1]).toEqual(s.forces[1]);
  });
  for (const level of forcesSandbox.levels) {
    it(`${level.id}: unsolved at start, solvable within constraints`, () => {
      expect(level.goals.every((g) => g.check(level.initial, solveForces(level.initial)))).toBe(false);
      let s = level.initial;
      for (const [id, [m, a]] of Object.entries(SOLUTIONS[level.id])) s = moveForce(s, id, fromPolar(m, a));
      const sol = solveForces(s);
      for (const g of level.goals) expect(g.check(s, sol), `${level.id}/${g.id} R=${sol.magnitude}`).toBe(true);
    });
  }
});
