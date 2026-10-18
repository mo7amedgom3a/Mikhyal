import { describe, expect, it } from "vitest";
import { evaluate } from "mathjs";
import { latexToMath } from "@/lib/engine/latex";
import { checkEquation, checkNumeric, parseQuantity } from "@/lib/engine/evaluator";
import { getMission } from "@/lib/missions";

const ev = (latex: string, scope: Record<string, number> = {}) => Number(evaluate(latexToMath(latex), scope));

describe("latexToMath", () => {
  it("handles fractions, roots and powers, nested", () => {
    expect(ev("\\frac{1}{2}")).toBe(0.5);
    expect(ev("\\dfrac{u^2-v^2}{2a}", { u: 20, v: 0, a: 5 })).toBe(40);
    expect(ev("\\sqrt{16}")).toBe(4);
    expect(ev("\\sqrt[3]{27}")).toBeCloseTo(3);
    expect(ev("\\frac{t_0}{\\sqrt{1-\\frac{v^2}{c^2}}}", { t0: 1, v: 0.6, c: 1 })).toBeCloseTo(1.25);
    expect(ev("2^{10}")).toBe(1024);
    expect(ev("\\frac12")).toBe(0.5);
  });

  it("handles operators, delimiters and spacing", () => {
    expect(ev("3\\times 4 \\cdot 2")).toBe(24);
    expect(ev("\\left(1+2\\right)^{2}")).toBe(9);
    expect(ev("\\left|-5\\right|")).toBe(5);
    expect(ev("8 \\div 2\\,")).toBe(4);
  });

  it("handles Greek letters, subscripts and trig in degrees", () => {
    expect(latexToMath("\\mu m g")).toBe("μ m g");
    expect(latexToMath("v_{max} = \\sqrt{\\mu g r}")).toBe("vmax = sqrt(μ g r)");
    expect(latexToMath("\\Delta t = \\gamma \\Delta t_0")).toBe("Δ t = γ Δ t0");
    expect(ev("\\sin 30^{\\circ}")).toBeCloseTo(0.5);
    expect(ev("\\cos\\left(60^\\circ\\right)")).toBeCloseTo(0.5);
    expect(ev("\\sin^2\\theta + \\cos^2\\theta", { θ: 0.7 })).toBeCloseTo(1);
    expect(ev("\\pi")).toBeCloseTo(Math.PI);
    expect(ev("\\log 100 + \\ln e")).toBeCloseTo(3);
  });

  it("handles Unicode math", () => {
    expect(latexToMath("v² = u² − 2as")).toBe("v^2 = u^2 - 2as");
    expect(latexToMath("t = t₀/√(1 − v²/c²)")).toBe("t = t0/sqrt(1 - v^2/c^2)");
    expect(ev("½ × 4")).toBe(2);
    expect(ev("√9")).toBe(3);
    expect(ev("٣ × ٤")).toBe(12);
  });
});

const eqOpts = (id: string) => {
  const d = getMission(id)!.discovery;
  return { variables: Object.keys(d.variables), targets: d.targets, domain: d.domain, wrongRelations: d.wrongRelations, forbiddenSymbols: d.forbiddenSymbols };
};

describe("LaTeX equations in every mission", () => {
  const cases: [string, string][] = [
    ["braking", "v^{2}=u^{2}-2as"],
    ["braking", "s=\\frac{u^2-v^2}{2a}"],
    ["braking", "a=\\dfrac{u^{2}-v^{2}}{2\\cdot s}"],
    ["newton", "F=m\\times a"],
    ["newton", "a=\\frac{F}{m}"],
    ["circular", "a=\\frac{v^2}{r}"],
    ["ohm", "V=I\\cdot R"],
    ["ohm", "I=\\frac{V}{R}"],
    ["fountain", "h=-\\frac{b}{2a}"],
    ["relativity", "t=\\frac{t_0}{\\sqrt{1-\\frac{v^2}{c^2}}}"],
    ["relativity", "\\Delta t=\\frac{\\Delta t_{0}}{\\sqrt{1-\\left(\\frac{v}{c}\\right)^{2}}}"],
    ["relativity", "t\\sqrt{1-\\frac{v^2}{c^2}}=t_0"],
  ];
  it.each(cases)("%s accepts %s", (id, latex) => {
    expect(checkEquation(latex, eqOpts(id)).status).toBe("correct");
  });

  it("still diagnoses misconceptions written in LaTeX", () => {
    const r = checkEquation("t=t_0\\sqrt{1-\\frac{v^2}{c^2}}", eqOpts("relativity"));
    expect(r.status === "incorrect" && r.diagnosis?.ruleId).toBe("rel-inverted-gamma");
    const b = checkEquation("s=ut-\\frac{1}{2}at^{2}", eqOpts("braking"));
    expect(b.status === "incorrect" && b.diagnosis?.ruleId).toBe("braking-uses-time");
  });

  it("explains a γ shortcut instead of rejecting it as unknown", () => {
    const r = checkEquation("t=\\gamma t_0", eqOpts("relativity"));
    expect(r.status === "incorrect" && r.diagnosis?.ruleId).toBe("rel-uses-gamma");
  });
});

describe("LaTeX and scientific numbers with units", () => {
  it("parses quantities", () => {
    expect(parseQuantity("6.67\\,\\text{m/s}^2")).toEqual({ value: 6.67, unit: "m/s^2" });
    expect(parseQuantity("3\\times10^{8}\\ \\text{m/s}")).toEqual({ value: 3e8, unit: "m/s" });
    expect(parseQuantity("3×10⁸ m/s")).toEqual({ value: 3e8, unit: "m/s" });
    expect(parseQuantity("1.2e3 m")).toEqual({ value: 1200, unit: "m" });
    expect(parseQuantity("\\frac{400}{60} m/s^2")!.value).toBeCloseTo(6.667, 3);
  });
  it("grades LaTeX answers", () => {
    expect(checkNumeric("180\\,\\text{m}", getMission("braking")!.application.answer).status).toBe("correct");
    expect(checkNumeric("11.06\\,\\mu s", getMission("relativity")!.application.answer).status).toBe("correct");
    expect(checkNumeric("22\\,\\Omega", getMission("ohm")!.application.answer).status).toBe("correct");
    expect(checkNumeric("1.8\\times10^{-1} km", getMission("braking")!.application.answer).status).toBe("correct");
  });
});
