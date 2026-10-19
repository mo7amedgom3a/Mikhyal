import { describe, expect, it } from "vitest";
import { compareRelations, makeRelation } from "@/lib/workbench/algebra";
import { findCycle, multiDependencyNodes, validateGraph } from "@/lib/workbench/graph";
import { parseChain, parseSafe, StepParseError } from "@/lib/workbench/mathjson";
import { BRAKING_UNANTICIPATED, brakingWorkbench } from "@/lib/workbench/problems/braking";
import { WORKBENCH_PROBLEMS } from "@/lib/workbench/problems";
import { authoredToSteps, checklistStatus, replayPath } from "@/lib/workbench/steps";
import { analyzeSubtle, SUBTLE_CASES } from "@/lib/workbench/subtleErrors";
import type { SolutionGraph } from "@/lib/workbench/types";

const S = ["s", "u", "v", "a", "t"];

describe("safe parsing and MathJSON", () => {
  it("converts the rearranged braking relation to MathJSON", () => {
    const chain = parseChain("s = \\frac{v^2-u^2}{2a}", S);
    expect(chain.ast).toEqual(["Equal", "s", ["Divide", ["Subtract", ["Power", "v", 2], ["Power", "u", 2]], ["Multiply", 2, "a"]]]);
  });

  it("keeps ½ as a rational and flattens products", () => {
    const chain = parseChain("s = \\frac{1}{2}at^2", S);
    expect(chain.ast).toEqual(["Equal", "s", ["Multiply", ["Rational", 1, 2], "a", ["Power", "t", 2]]]);
  });

  it("reads a final value with a unit", () => {
    const chain = parseChain("s = 40\\,\\text{m}", S);
    expect(chain.trailingUnit).toBe("m");
    expect(chain.parts).toHaveLength(2);
  });

  it.each([
    ["f(x) = x^2", "unknown_function"],
    ["s = import(1)", "unknown_function"],
    ["s = [1, 2]", "forbidden_node"],
    ["s = z", "unknown_symbol"],
    ["s \\le 4", "forbidden_node"],
  ])("rejects %s", (input, code) => {
    try {
      parseChain(input, S);
      expect.unreachable();
    } catch (e) {
      expect(e).toBeInstanceOf(StepParseError);
      expect((e as StepParseError).code).toBe(code);
    }
  });

  it("rejects assignments and function definitions at the AST level", () => {
    expect(() => parseSafe("a = 2", S)).toThrow(/forbidden_node/);
    expect(() => parseSafe("g(x) = x", S)).toThrow(/forbidden_node/);
  });

  it("rejects oversized input", () => {
    expect(() => parseSafe("s+".repeat(300) + "s", S)).toThrow(StepParseError);
  });
});

describe("relation comparison", () => {
  const rel = (latex: string, vars: string[]) => {
    const c = parseChain(latex, vars);
    return makeRelation(c.parts[0].node, c.parts[1].node, [...new Set(c.parts.flatMap((p) => p.symbols))]);
  };
  const doms = { u: [-40, 40], v: [-40, 40], a: [-10, -0.5], s: [-300, 300], t: [-20, 20] } as Record<string, [number, number]>;

  it("accepts any algebraic rearrangement", () => {
    expect(compareRelations(rel("v^2 = u^2 + 2as", S), rel("s = \\frac{v^2-u^2}{2a}", S), doms).kind).toBe("equivalent");
  });

  it("rejects a wrong rearrangement", () => {
    expect(compareRelations(rel("v^2 = u^2 + 2as", S), rel("s = \\frac{v-u}{2a}", S), doms).kind).toBe("not_equivalent");
  });
});

describe("braking workbench (canonical)", () => {
  it.each(brakingWorkbench.paths.map((p) => [p.id, p]))("authored path %s: every step valid, goal reached", (_id, path) => {
    const { validations } = replayPath(brakingWorkbench, path.steps);
    for (const v of validations) {
      expect(v.mathematical.status).toBe("pass");
      expect(v.physical.status).toBe("pass");
      expect(v.action).toBe("accept");
    }
    expect(validations.some((v) => v.goalReached && v.matchedNodes.includes("final_distance"))).toBe(true);
  });

  it("isolating s matches the transformation node, not the principle again", () => {
    const { validations } = replayPath(brakingWorkbench, brakingWorkbench.paths[0].steps);
    expect(validations[1].matchedNodes).toEqual(["isolate_s"]);
    expect(validations[1].mathematical.code).toBe("equivalent");
  });

  it("path B's stopping time matches the intermediate value node", () => {
    const { validations } = replayPath(brakingWorkbench, brakingWorkbench.paths[1].steps);
    expect(validations[1].matchedNodes).toContain("t_value");
    expect(validations[1].value).toEqual({ symbol: "t", si: 4 });
  });

  it("accepts the unanticipated average-velocity route and flags it", () => {
    const { validations } = replayPath(brakingWorkbench, BRAKING_UNANTICIPATED);
    expect(validations[2].unanticipated).toBe(true);
    expect(validations[2].action).toBe("accept");
    expect(validations[3].goalReached).toBe(true);
  });

  it("detects the sign error as physically (not mathematically) wrong", () => {
    const e = brakingWorkbench.recoverableErrors.find((r) => r.id === "sign-error")!;
    const last = replayPath(brakingWorkbench, e.steps).validations.at(-1)!;
    expect(last.physical.code).toBe("sign_convention:a");
    expect(last.hint?.tier).toBe("verification");
  });

  it("produces wire-format steps with retry ids and an AST", () => {
    const steps = authoredToSteps(brakingWorkbench, brakingWorkbench.paths[0].steps);
    expect(steps[1]).toMatchObject({ step_id: "step_002", inputs: ["step_001"], operation: "isolate_variable", target_variable: "s", ast_version: "mathjson/1" });
    expect(steps[1].client_step_id).toBeTruthy();
    expect(steps[1].expression_ast).toEqual(["Equal", "s", ["Divide", ["Subtract", ["Power", "v", 2], ["Power", "u", 2]], ["Multiply", 2, "a"]]]);
  });

  it("ticks the completion checklist", () => {
    const { steps, validations } = replayPath(brakingWorkbench, brakingWorkbench.paths[0].steps);
    expect(checklistStatus(brakingWorkbench, steps, validations)).toEqual({ selected_relationship: true, rearranged: true, substituted_with_units: true, verified: true });
  });

  it("asks for a unit when the number is right but bare", () => {
    const { validations } = replayPath(brakingWorkbench, [
      { latex: "s = \\frac{v^2-u^2}{2a}", operation: "select_principle", target: "s", explanation: "", inputs: [] },
      { latex: "s = 40", operation: "substitute", target: "s", explanation: "" },
    ]);
    expect(validations[1].physical.code).toBe("missing_unit");
    expect(validations[1].action).toBe("clarify");
  });

  it("explains a parse failure through AI interpretation when the student explained", () => {
    const { validations } = replayPath(brakingWorkbench, [{ latex: "s = speed times time", operation: "select_principle", target: "s", explanation: "distance is speed times time", inputs: [] }]);
    expect(validations[0].mathematical.code).toMatch(/^parse:/);
    expect(validations[0].action).toBe("ai_interpret");
  });
});

describe("all workbench problems", () => {
  it.each(WORKBENCH_PROBLEMS.flatMap((p) => p.paths.map((path) => [`${p.id}/${path.id}`, p, path] as const)))("%s is fully valid", (_n, p, path) => {
    const { validations } = replayPath(p, path.steps);
    for (const v of validations) {
      expect(v.mathematical.status, v.feedback_ar).not.toBe("fail");
      expect(v.physical.status, v.feedback_ar).not.toBe("fail");
      expect(v.action).toBe("accept");
    }
    expect(validations.some((v) => v.goalReached)).toBe(true);
  });

  it.each(WORKBENCH_PROBLEMS.flatMap((p) => p.recoverableErrors.map((e) => [`${p.id}/${e.id}`, p, e] as const)))("recoverable error %s gets its expected verdicts", (_n, p, e) => {
    const last = replayPath(p, e.steps).validations.at(-1)!;
    expect(last.mathematical.status).toBe(e.expected.mathematical);
    expect(last.physical.status).toBe(e.expected.physical);
    expect(last.action).toBe(e.expected.action);
    expect(last.feedback_ar.length).toBeGreaterThan(10);
  });

  it.each(WORKBENCH_PROBLEMS.filter((p) => p.demo).map((p) => [p.id, p] as const))("demo of %s: mistake is caught, the retry is accepted", (_id, p) => {
    const d = p.demo!;
    const wrong = replayPath(p, d.steps).validations[d.fixIndex];
    expect(wrong.action).not.toBe("accept");
    const fixed = [...d.steps.slice(0, d.fixIndex), d.fix, ...(d.after ?? [])];
    const vs = replayPath(p, fixed).validations;
    expect(vs.every((v) => v.action === "accept")).toBe(true);
    expect(vs.some((v) => v.goalReached)).toBe(true);
  });

  it("F = ma with friction present: valid mathematics, incomplete physics", () => {
    const p = WORKBENCH_PROBLEMS.find((x) => x.id === "newton_friction_001")!;
    const v = replayPath(p, p.recoverableErrors[0].steps).validations[0];
    expect(v.mathematical.status).toBe("pass");
    expect(v.physical.code).toBe("incomplete_model:newton-naive");
    expect(v.action).toBe("clarify");
    expect(v.unanticipated).toBe(false);
  });

  it("photoelectric: subtracting eV from J is caught as a unit mix", () => {
    const p = WORKBENCH_PROBLEMS.find((x) => x.id === "photoelectric_001")!;
    const last = replayPath(p, p.recoverableErrors[0].steps).validations.at(-1)!;
    expect(last.physical.code).toBe("unit_mix:φ");
  });

  it.each(WORKBENCH_PROBLEMS.map((p) => [p.id, p] as const))("graph of %s is consistent and has a multi-dependency node", (_id, p) => {
    expect(validateGraph(p.graph, Object.keys(p.symbols)).filter((i) => i.level === "error")).toEqual([]);
    expect(multiDependencyNodes(p.graph).length).toBeGreaterThan(0);
    expect(p.paths.length).toBeGreaterThanOrEqual(2);
    expect(Object.keys(p.hints)).toEqual(["conceptual", "strategic", "procedural", "verification"]);
  });
});

describe("graph validation", () => {
  const base: SolutionGraph = JSON.parse(JSON.stringify(brakingWorkbench.graph));
  const symbols = Object.keys(brakingWorkbench.symbols);

  it("finds a cycle", () => {
    const g = { ...base, edges: [...base.edges, { from: "final_distance", to: "distance_direct", type: "dependency" as const }] };
    expect(findCycle(g)).not.toBeNull();
    expect(validateGraph(g, symbols).some((i) => i.code === "cycle")).toBe(true);
  });

  it("flags a path that misses the goal and an unproduced requirement", () => {
    const g = { ...base, paths: [["distance_direct", "isolate_s"]], nodes: [...base.nodes, { id: "x", type: "equation_application" as const, label_ar: "x", requires: ["w"] }] };
    const codes = validateGraph(g, symbols).map((i) => i.code);
    expect(codes).toContain("path_not_to_goal");
    expect(codes).toContain("unproduced_requirement");
  });

  it("flags an unreadable formula", () => {
    const g = { ...base, nodes: [...base.nodes, { id: "bad", type: "equation_application" as const, label_ar: "bad", formula: "s = q + 1" }] };
    expect(validateGraph(g, symbols).some((i) => i.code === "formula")).toBe(true);
  });
});

describe("subtle errors", () => {
  const byId = Object.fromEntries(SUBTLE_CASES.map((c) => [c.id, c]));
  it("x² = 9 → x = 3 loses −3, unless x ≥ 0", () => {
    const r = analyzeSubtle(byId["square-root"]);
    expect(r.verdict).toBe("lost_solutions");
    expect(r.inputRoots).toEqual([-3, 3]);
    expect(r.counterexample).toBe(-3);
    expect(analyzeSubtle(byId["square-root"], true).verdict).toBe("complete");
  });
  it("squaring adds x = −1", () => {
    const r = analyzeSubtle(byId["squaring"]);
    expect(r.verdict).toBe("extraneous_solutions");
    expect(r.counterexample).toBe(-1);
  });
  it("dividing by x loses x = 0", () => {
    expect(analyzeSubtle(byId["divide-by-variable"])).toMatchObject({ verdict: "lost_solutions", counterexample: 0 });
  });
  it("sin θ = ½ also has 150°", () => {
    const r = analyzeSubtle(byId["inverse-trig"]);
    expect(r.verdict).toBe("lost_solutions");
    expect(r.inputRoots).toEqual([30, 150]);
    expect(analyzeSubtle(byId["inverse-trig"], true).verdict).toBe("complete");
  });
  it("cancelling (x − 1) changes the domain", () => {
    expect(analyzeSubtle(byId["restricted-simplify"])).toMatchObject({ verdict: "domain_changed", counterexample: 1 });
  });
});
