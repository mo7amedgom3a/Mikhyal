import { describe, expect, it } from "vitest";
import { avgRate, decibels, doublingTime, expAt, features, intensityOf, kindOf, logBase, model, num, quakeAmplitudeRatio, quakeEnergyRatio, solveExp } from "@/lib/exponential";
import { EXP_PRACTICE } from "@/lib/exponential/practice";

describe("exponential functions", () => {
  it("reads the key features from the textbook examples", () => {
    const g = { a: 5, b: 0.5, h: 0, k: 0 };
    expect(expAt(g, 2)).toBe(1.25);
    expect(kindOf(g)).toBe("decay");
    expect(features(g)).toMatchObject({ yIntercept: 5, asymptote: 0, right: 0, left: Infinity });

    const reflected = { a: -1, b: 3, h: 0, k: 0 }; // g(x) = −3^x
    expect(kindOf(reflected)).toBe("decay");
    expect(features(reflected)).toMatchObject({ yIntercept: -1, right: -Infinity, left: 0 });
    expect(features(reflected).range).toBe("\\{y : y < 0\\}");

    const shifted = { a: 1, b: 3, h: 0, k: -4 }; // h(x) = 3^x − 4
    expect(features(shifted)).toMatchObject({ yIntercept: -3, asymptote: -4, left: -4 });
    expect(kindOf({ a: 2, b: 1, h: 0, k: 0 })).toBe("constant");
  });

  it("models growth and decay as in examples 3 and 4", () => {
    expect(model(4.6, 0.013, 30)).toBeCloseTo(6.78, 2);
    expect(model(96000, 0.2, 7, false)).toBeCloseTo(20132.66, 1);
    expect(solveExp(96000, 0.8, 20000)).toBeCloseTo(7.03, 2);
    expect(solveExp(220, 1.05, 280)).toBeCloseTo(4.94, 2);
    expect(solveExp(5, 2, -3)).toBeNull();
    expect(solveExp(5, 1, 10)).toBeNull();
    expect(doublingTime(2)).toBeCloseTo(1, 12);
    expect(doublingTime(0.5)).toBeCloseTo(1, 12);
  });

  it("matches example 5's average rates of change", () => {
    expect(avgRate((x) => 50 * 1.075 ** x, 0, 5)).toBeCloseTo(4.356, 3);
    expect(avgRate((x) => 40 * 1.1 ** x, 0, 5)).toBeCloseTo(4.88, 2);
  });
});

describe("logarithms", () => {
  it("is the inverse of the exponential", () => {
    expect(logBase(2, 8)).toBe(3);
    expect(logBase(3, 1 / 9)).toBe(-2);
    expect(logBase(10, 1000)).toBe(3);
    expect(logBase(0.5, 4)).toBe(-2);
    expect(logBase(7, 1)).toBe(0);
    expect(logBase(2, 0)).toBeNaN();
    expect(logBase(1, 5)).toBeNaN();
    for (const b of [2, 3, 10, 0.5]) for (const x of [-2, 0.5, 3]) expect(logBase(b, b ** x)).toBeCloseTo(x, 12);
  });

  it("drives the Richter and decibel scales", () => {
    expect(quakeAmplitudeRatio(5, 7)).toBeCloseTo(100, 9);
    expect(quakeEnergyRatio(5, 6)).toBeCloseTo(31.62, 2);
    expect(decibels(intensityOf(60))).toBeCloseTo(60, 9);
    expect(intensityOf(70) / intensityOf(60)).toBeCloseTo(10, 9);
    expect(decibels(2 * intensityOf(60)) - 60).toBeCloseTo(3.01, 2);
  });

  it("formats numbers for LaTeX", () => {
    expect(num(96000)).toBe("96\\,000");
    expect(num(1.25)).toBe("1.25");
    expect(num(-0.1234567)).toBe("-0.123");
    expect(num(Infinity)).toBe("\\infty");
  });
});

describe("exponential practice", () => {
  it("has textbook answers", () => {
    const get = (id: string) => {
      const q = EXP_PRACTICE.find((p) => p.id === id);
      if (q?.kind !== "fields") throw new Error(id);
      return q.fields.map((f) => f.answer);
    };
    expect(get("machine-try3")[0]).toBeCloseTo(14.52, 2);
    expect(get("population-ex3")[0]).toBeCloseTo(6.78, 2);
    expect(get("solve-hawks-try4")[0]).toBeCloseTo(4.94, 2);
    expect(get("car-ex4")[0]).toBeCloseTo(7.03, 2);
    expect(get("stamps-ex10")[0]).toBeCloseTo(8878.7, 0);
  });

  it("never lists a right answer as a known mistake, and choices are well formed", () => {
    for (const q of EXP_PRACTICE) {
      if (q.kind === "fields") for (const f of q.fields) for (const w of f.wrong ?? []) expect(Math.abs(w.value - f.answer)).toBeGreaterThan(f.tolerance ?? 1e-9);
      else {
        expect(q.options.map((o) => o.id)).toContain(q.answer);
        for (const o of q.options) if (o.id !== q.answer) expect(q.why[o.id]).toBeTruthy();
      }
    }
    expect(new Set(EXP_PRACTICE.map((q) => q.id)).size).toBe(EXP_PRACTICE.length);
  });
});
