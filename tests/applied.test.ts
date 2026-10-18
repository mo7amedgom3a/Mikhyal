import { describe, expect, it } from "vitest";
import { angleToTop, heightFromAngle } from "@/lib/physics/trig";
import { resultant, add, fromPolar, magnitude } from "@/lib/physics/vectors";
import { minSafeAngle, symmetricTension } from "@/lib/physics/statics";
import { balancePosition, leverEffort, netTorque } from "@/lib/physics/moments";
import { frictionAngle, slides, slideAcceleration, weightComponents } from "@/lib/physics/incline";
import { checkEquation, checkNumeric } from "@/lib/engine/evaluator";
import { getMission } from "@/lib/missions";
import { snapToParam } from "@/components/sims/useSimClock";

describe("applied-math models", () => {
  it("trig: angle of elevation", () => {
    expect(heightFromAngle(187, 45)).toBeCloseTo(187);
    expect(heightFromAngle(200, 12)).toBeCloseTo(42.51, 2);
    expect(angleToTop(187, 187)).toBeCloseTo(45);
  });
  it("vectors: law of cosines agrees with component addition", () => {
    expect(resultant(6, 8, 60)).toBeCloseTo(12.17, 2);
    expect(resultant(3, 4, 90)).toBeCloseTo(5);
    expect(resultant(5, 5, 180)).toBeCloseTo(0);
    const R = add(fromPolar(6, 20), fromPolar(8, 20 + 75));
    expect(magnitude(R)).toBeCloseTo(resultant(6, 8, 75), 9);
  });
  it("statics: symmetric cables", () => {
    expect(symmetricTension(400, 30)).toBeCloseTo(400);
    expect(symmetricTension(600, 20)).toBeCloseTo(877.1, 1);
    expect(minSafeAngle(400, 400)).toBeCloseTo(30);
  });
  it("moments: balance and lever", () => {
    expect(balancePosition(40, 2.4, 60)).toBeCloseTo(1.6);
    expect(netTorque(40, 2.4, 60, 1.6)).toBeCloseTo(0);
    expect(leverEffort(900, 0.3, 1.5)).toBeCloseTo(180);
  });
  it("incline: angle of friction, mass cancels", () => {
    expect(frictionAngle(0.4)).toBeCloseTo(21.8, 1);
    expect(slides(21.5, 0.4)).toBe(false);
    expect(slides(22, 0.4)).toBe(true);
    expect(slides(30, 0.4)).toBe(slides(30, 0.4));
    expect(slideAcceleration(20, 0.4)).toBe(0);
    const light = weightComponents(1, 30);
    const heavy = weightComponents(10, 30);
    expect(heavy.along / heavy.normal).toBeCloseTo(light.along / light.normal);
  });
  it("drag values snap to slider steps and ranges", () => {
    expect(snapToParam(33.37, { min: 0, max: 80, step: 0.5 })).toBe(33.5);
    expect(snapToParam(999, { min: 0, max: 80, step: 0.5 })).toBe(80);
    expect(snapToParam(1.234, { min: 0.2, max: 2.5, step: 0.05 })).toBe(1.25);
  });
});

const eqOpts = (id: string) => {
  const d = getMission(id)!.discovery;
  return { variables: Object.keys(d.variables), targets: d.targets, domain: d.domain, wrongRelations: d.wrongRelations, forbiddenSymbols: d.forbiddenSymbols };
};

describe("applied-math discovery (plain text and LaTeX)", () => {
  const ok: [string, string][] = [
    ["elevation", "h=d\\tan\\theta"],
    ["elevation", "\\tan\\theta=\\frac{h}{d}"],
    ["vectors", "R=\\sqrt{F_1^2+F_2^2+2F_1F_2\\cos\\theta}"],
    ["vectors", "R^2 = F1^2 + F2^2 + 2F1F2cos(theta)"],
    ["statics", "T=\\frac{W}{2\\sin\\theta}"],
    ["statics", "2T sin θ = W"],
    ["moments", "m_1d_1=m_2d_2"],
    ["moments", "d_2=\\frac{m_1d_1}{m_2}"],
    ["incline", "\\mu=\\tan\\theta"],
    ["incline", "mu = sin(theta)/cos(theta)"],
  ];
  it.each(ok)("%s accepts %s", (id, input) => {
    expect(checkEquation(input, eqOpts(id)).status).toBe("correct");
  });

  const wrong: [string, string, string][] = [
    ["elevation", "h=d\\sin\\theta", "elev-sin"],
    ["elevation", "h=\\frac{d}{\\tan\\theta}", "elev-inverse"],
    ["vectors", "R=\\sqrt{F_1^2+F_2^2}", "vec-pythagoras"],
    ["vectors", "R=\\sqrt{F_1^2+F_2^2-2F_1F_2\\cos\\theta}", "vec-minus"],
    ["vectors", "R=F_1+F_2", "vec-add-magnitudes"],
    ["statics", "T=\\frac{W}{2}", "statics-ignore-angle"],
    ["statics", "T=\\frac{W}{2\\cos\\theta}", "statics-cos"],
    ["moments", "m_1 d_2 = m_2 d_1", "mom-inverted"],
    ["incline", "\\mu=\\sin\\theta", "incline-sin"],
  ];
  it.each(wrong)("%s diagnoses %s", (id, input, rule) => {
    const r = checkEquation(input, eqOpts(id));
    expect(r.status === "incorrect" && r.diagnosis?.ruleId).toBe(rule);
  });
});

describe("applied-math answers", () => {
  const app = (id: string) => getMission(id)!.application;
  it("grades correct answers and flags realistic mistakes", () => {
    expect(checkNumeric("42.5 m", app("elevation").answer).status).toBe("correct");
    const rad = checkNumeric("-127.2 m", app("elevation").answer, app("elevation").wrongValues);
    expect(rad.status === "incorrect" && rad.diagnosis?.ruleId).toBe("light-radians");
    expect(checkNumeric("\\sqrt{148}\\,\\text{N}", app("vectors").answer).status).toBe("correct");
    const pyth = checkNumeric("10 N", app("vectors").answer, app("vectors").wrongValues);
    expect(pyth.status === "incorrect" && pyth.diagnosis?.errorType).toBe("transfer");
    expect(checkNumeric("877 N", app("statics").answer).status).toBe("correct");
    expect(checkNumeric("180 N", app("moments").answer).status).toBe("correct");
    expect(checkNumeric("0.70", app("incline").answer).status).toBe("correct");
    const sin = checkNumeric("0.574", app("incline").answer, app("incline").wrongValues);
    expect(sin.status === "incorrect" && sin.diagnosis?.ruleId).toBe("book-sin");
  });
});
