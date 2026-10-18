import { describe, expect, it } from "vitest";
import { decideNext, solverScaffold } from "@/lib/engine/pedagogy";
import { bktUpdate } from "@/lib/engine/learnerModel";

describe("pedagogy", () => {
  it("routes error types to different interventions", () => {
    const base = { correct: false, attempts: 1, hintLevel: 0, hints: ["h1", "h2"] };
    const kind = (errorType: "conceptual" | "mathematical" | "procedural" | "representational" | "transfer") =>
      decideNext({ ...base, diagnosis: { ruleId: "x", errorType, prompt: "p" } }).kind;
    expect(kind("conceptual")).toBe("experiment");
    expect(kind("mathematical")).toBe("question");
    expect(kind("procedural")).toBe("hint");
    expect(kind("representational")).toBe("remediation");
  });
  it("escalates hint ladder on undiagnosed errors", () => {
    const r = decideNext({ correct: false, attempts: 2, hintLevel: 0, hints: ["h1", "h2", "h3"] });
    expect(r.message).toBe("h2");
  });
  it("fades scaffolding with mastery", () => {
    expect(solverScaffold(0.2)).toBe("full");
    expect(solverScaffold(0.6)).toBe("partial");
    expect(solverScaffold(0.9)).toBe("none");
  });
  it("BKT: correct raises mastery more without hints", () => {
    expect(bktUpdate(0.3, true, 0)).toBeGreaterThan(bktUpdate(0.3, true, 2));
    expect(bktUpdate(0.3, false)).toBeLessThan(0.3);
  });
});
