import { describe, expect, it } from "vitest";
import { EMF, RESISTANCE, place, type CircuitState, type Part } from "@/lib/sandbox/circuit/model";
import { solveCircuit } from "@/lib/sandbox/circuit/solver";
import { circuitSandbox } from "@/lib/sandbox/circuit/levels";

const W: Part = { type: "wire" };
const loop = (extra: Record<string, Part>): CircuitState => ({ cols: 3, rows: 3, parts: extra, inventory: {} });

describe("circuit solver", () => {
  const single = loop({ "h:0,0": { type: "battery" }, "h:0,2": { type: "bulb", label: "A" }, "v:0,0": W, "v:0,1": W, "v:1,0": W, "v:1,1": W });
  it("single bulb: I = V/R, full brightness", () => {
    const s = solveCircuit(single);
    expect(Math.abs(s.readings["h:0,2"].current)).toBeCloseTo(EMF / RESISTANCE.bulb);
    expect(s.readings["h:0,2"].brightness).toBeCloseTo(1);
    expect(s.batteryCurrent).toBeCloseTo(1.5);
  });
  it("wire currents carry the loop current", () => {
    const s = solveCircuit(single);
    for (const e of ["v:0,0", "v:0,1", "v:1,0", "v:1,1"]) expect(Math.abs(s.readings[e].current)).toBeCloseTo(1.5, 5);
  });
  it("reversed battery: same brightness", () => {
    const s = solveCircuit({ ...single, parts: { ...single.parts, "h:0,0": { type: "battery", flipped: true } } });
    expect(s.readings["h:0,2"].brightness).toBeCloseTo(1);
  });
  it("series: each bulb gets a quarter of the power", () => {
    const s = solveCircuit({ cols: 4, rows: 3, inventory: {}, parts: { "h:0,0": { type: "battery" }, "h:1,0": W, "h:2,0": W, "v:3,0": W, "v:3,1": W, "v:0,0": W, "v:0,1": W, "h:0,2": { type: "bulb" }, "h:1,2": { type: "bulb" }, "h:2,2": W } });
    expect(s.readings["h:0,2"].brightness).toBeCloseTo(0.25);
    expect(s.readings["h:1,2"].brightness).toBeCloseTo(0.25);
  });
  it("parallel: each bulb as bright as one alone, battery current doubles", () => {
    const s = solveCircuit({ cols: 3, rows: 3, inventory: {}, parts: { "v:0,0": { type: "battery" }, "v:0,1": W, "h:0,0": W, "h:1,0": W, "h:0,2": W, "h:1,2": W, "v:1,0": { type: "bulb" }, "v:1,1": W, "v:2,0": { type: "bulb" }, "v:2,1": W } });
    expect(s.readings["v:1,0"].brightness).toBeCloseTo(1);
    expect(s.readings["v:2,0"].brightness).toBeCloseTo(1);
    expect(s.batteryCurrent).toBeCloseTo(3);
  });
  it("detects a short circuit", () => {
    const s = solveCircuit({ ...single, parts: { ...single.parts, "h:1,0": W, "h:1,1": W, "h:0,1": W } });
    expect(s.shortCircuit).toBe(true);
  });
  it("open switch: no current", () => {
    const s = solveCircuit({ ...single, parts: { ...single.parts, "v:0,1": { type: "switch", closed: false } } });
    expect(s.readings["h:0,2"].lit).toBe(false);
    expect(s.batteryCurrent).toBeCloseTo(0, 6);
  });
  it("place respects the inventory", () => {
    const s0: CircuitState = { cols: 3, rows: 3, parts: {}, inventory: { wire: 1 } };
    const s1 = place(s0, "h:0,0", "wire");
    expect(place(s1, "h:1,0", "wire")).toBe(s1);
  });
});

/** A known solution per level: parts the student places. */
const SOLUTIONS: Record<string, [string, Part][]> = {
  "close-loop": [["v:0,0", W], ["v:0,1", W]],
  series: [["h:0,2", { type: "bulb", label: "P" }], ["h:1,2", { type: "bulb", label: "Q" }], ["h:2,2", W]],
  parallel: [["v:1,0", { type: "bulb", label: "P" }], ["v:1,1", W], ["v:2,0", { type: "bulb", label: "Q" }], ["v:2,1", W]],
  "choose-branches": [["v:1,1", W], ["v:2,1", W]],
  switch: [["v:1,1", W], ["v:2,1", { type: "switch", closed: true }]],
  bypass: [["v:2,1", W]],
  "free-build": [["h:0,1", W], ["h:1,1", W], ["h:2,1", W], ["h:0,2", W], ["h:1,2", W], ["h:2,2", W], ["v:1,1", { type: "bulb", label: "P" }], ["v:2,1", { type: "bulb", label: "Q" }], ["v:3,1", { type: "bulb", label: "R" }]],
};

describe("circuit levels", () => {
  for (const level of circuitSandbox.levels) {
    it(`${level.id}: unsolved at start, solvable with the inventory`, () => {
      const start = circuitSandbox.solve(level.initial);
      expect(level.goals.every((g) => g.check(level.initial, start))).toBe(false);
      const parts = { ...level.initial.parts };
      for (const [e, p] of SOLUTIONS[level.id]) parts[e] = p;
      const solved: CircuitState = { ...level.initial, parts };
      const sol = circuitSandbox.solve(solved);
      for (const g of level.goals) expect(g.check(solved, sol), `${level.id}/${g.id}`).toBe(true);
      // the solution fits the level's inventory
      for (const type of ["wire", "bulb", "switch", "resistor"] as const) {
        const used = SOLUTIONS[level.id].filter(([, p]) => p.type === type).length;
        expect(used).toBeLessThanOrEqual(level.initial.inventory[type] ?? 0);
      }
    });
  }
});
