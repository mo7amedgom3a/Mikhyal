import { describe, expect, it } from "vitest";
import { checkEquation, checkNumeric, normalizeExpression } from "@/lib/engine/evaluator";
import { MISSIONS, getMission } from "@/lib/missions";

const eqOpts = (id: string) => {
  const d = getMission(id)!.discovery;
  return {
    variables: Object.keys(d.variables),
    targets: d.targets,
    domain: d.domain,
    wrongRelations: d.wrongRelations,
    forbiddenSymbols: d.forbiddenSymbols,
  };
};

describe("normalizeExpression", () => {
  it("splits glued variables and converts symbols", () => {
    expect(normalizeExpression("v² = u² - 2as", ["v", "u", "a", "s"])).toBe("v^2 = u^2 - 2a*s");
    expect(normalizeExpression("t = t_0/√(1-v^2/c^2)", ["t", "t0", "v", "c"])).toBe(
      "t = t0/sqrt(1-v^2/c^2)",
    );
  });
});

describe("checkEquation", () => {
  it("accepts any algebraic rearrangement of v² = u² − 2as", () => {
    const o = eqOpts("braking");
    for (const s of ["v^2 = u^2 - 2as", "v² = u² + 2as", "s = (u^2 - v^2)/(2a)", "2*a*s = u^2 - v^2", "a = (u^2-v^2)/(2 s)"]) {
      expect(checkEquation(s, o).status, s).toBe("correct");
    }
  });
  it("diagnoses use of time as procedural", () => {
    const r = checkEquation("s = u*t - 0.5 a t^2", eqOpts("braking"));
    expect(r.status).toBe("incorrect");
    expect(r.status === "incorrect" && r.diagnosis?.errorType).toBe("procedural");
  });
  it("diagnoses missing factor 2 as mathematical", () => {
    const r = checkEquation("v^2 = u^2 - a s", eqOpts("braking"));
    expect(r.status === "incorrect" && r.diagnosis?.ruleId).toBe("braking-missing-2");
  });
  it("rejects identities", () => {
    expect(checkEquation("s = s", eqOpts("braking")).status).toBe("incorrect");
  });
  it("handles every mission's canonical relation", () => {
    const canon: Record<string, string> = {
      braking: "v^2 = u^2 - 2*a*s",
      newton: "F = m a",
      circular: "a = v^2/r",
      ohm: "V = I R",
      fountain: "h = -b/(2a)",
      relativity: "t = t0/sqrt(1 - v^2/c^2)",
    };
    for (const m of MISSIONS) expect(checkEquation(canon[m.id], eqOpts(m.id)).status, m.id).toBe("correct");
  });
  it("detects misconceptions per mission", () => {
    const cases: [string, string, string][] = [
      ["newton", "a = F*m", "newton-a-Fm"],
      ["circular", "a = v/r", "circ-a-vr"],
      ["ohm", "I = V R", "ohm-I-VR"],
      ["fountain", "h = -b/a", "vertex-is-root"],
      ["fountain", "h = -b/(2a) + c", "vertex-uses-c"],
      ["relativity", "t = t0 * sqrt(1-v^2/c^2)", "rel-inverted-gamma"],
    ];
    for (const [id, input, rule] of cases) {
      const r = checkEquation(input, eqOpts(id));
      expect(r.status === "incorrect" && r.diagnosis?.ruleId, `${id}: ${input}`).toBe(rule);
    }
  });
});

describe("checkNumeric", () => {
  const app = (id: string) => getMission(id)!.application;
  it("accepts correct value with compatible units", () => {
    expect(checkNumeric("180 m", app("braking").answer).status).toBe("correct");
    expect(checkNumeric("0.18 km", app("braking").answer).status).toBe("correct");
    expect(checkNumeric("14.2 m/s2", app("newton").answer).status).toBe("correct");
    expect(checkNumeric("22 Ω", app("ohm").answer).status).toBe("correct");
    expect(checkNumeric("11.06 μs", app("relativity").answer).status).toBe("correct");
  });
  it("flags missing units as procedural", () => {
    const r = checkNumeric("180", app("braking").answer);
    expect(r.status === "incorrect" && r.diagnosis?.ruleId).toBe("missing-unit");
  });
  it("flags known wrong values", () => {
    const a = app("newton");
    const r = checkNumeric("24 m/s^2", a.answer, a.wrongValues);
    expect(r.status === "incorrect" && r.diagnosis?.errorType).toBe("transfer");
  });
  it("flags incompatible units", () => {
    const r = checkNumeric("180 s", app("braking").answer);
    expect(r.status === "incorrect" && r.diagnosis?.ruleId).toBe("wrong-unit");
  });
});

describe("mission experiments", () => {
  it("each mission's intended solution succeeds", () => {
    const winning: Record<string, Record<string, number>> = {
      braking: { u: 20, a: 6.7 },
      newton: { F: 3000, m: 2400 },
      circular: { v: 15.5, r: 50, mu: 0.5 },
      ohm: { V: 12, R: 6 },
      fountain: { a: -0.5, b: 2, c: 0 },
      relativity: { beta: 0.865, t0: 1 },
    };
    for (const m of MISSIONS) expect(m.experiment.evaluate(winning[m.id]).success, m.id).toBe(true);
  });
});
