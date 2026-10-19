/** Building wire-format steps, checklist status, and replaying authored paths. */
import { parseChain } from "./mathjson";
import { validateSequence } from "./validate";
import { AST_VERSION, type AuthoredStep, type ChecklistItem, type SolutionStep, type StepValidation, type WorkbenchProblem } from "./types";

export function uuid(): string {
  const c = globalThis.crypto as Crypto | undefined;
  if (c?.randomUUID) return c.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (ch) => {
    const r = (Math.random() * 16) | 0;
    return (ch === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

export function stepId(n: number): string {
  return `step_${String(n).padStart(3, "0")}`;
}

/** Client-side AST (advisory; the server recomputes it). */
export function clientAst(problem: WorkbenchProblem, latex: string) {
  try {
    return parseChain(latex, Object.keys(problem.symbols), problem.keepDelta).ast;
  } catch {
    return null;
  }
}

export function makeStep(
  problem: WorkbenchProblem,
  fields: { step_id: string; latex: string; operation: SolutionStep["operation"]; target: string; unit?: string; explanation?: string; inputs?: string[] },
  ids: { attempt_id?: string; client_step_id?: string } = {},
): SolutionStep {
  return {
    step_id: fields.step_id,
    attempt_id: ids.attempt_id ?? `attempt_${uuid().slice(0, 8)}`,
    expression_latex: fields.latex,
    expression_ast: clientAst(problem, fields.latex),
    ast_version: AST_VERSION,
    operation: fields.operation,
    inputs: fields.inputs ?? [],
    target_variable: fields.target,
    unit: fields.unit ?? "",
    student_explanation: fields.explanation ?? "",
    client_step_id: ids.client_step_id ?? uuid(),
  };
}

/** Authored steps → wire steps with deterministic ids (inputs default to the previous step). */
export function authoredToSteps(problem: WorkbenchProblem, steps: AuthoredStep[], prefix = "attempt"): SolutionStep[] {
  return steps.map((s, i) =>
    makeStep(
      problem,
      {
        step_id: stepId(i + 1),
        latex: s.latex,
        operation: s.operation,
        target: s.target,
        unit: s.unit,
        explanation: s.explanation,
        inputs: (s.inputs ?? (i > 0 ? [i - 1] : [])).map((k) => stepId(k + 1)),
      },
      { attempt_id: `${prefix}_${problem.id}_${i + 1}`, client_step_id: `${prefix}-${problem.id}-${i + 1}` },
    ),
  );
}

export function replayPath(problem: WorkbenchProblem, steps: AuthoredStep[]): { steps: SolutionStep[]; validations: StepValidation[] } {
  const wire = authoredToSteps(problem, steps);
  return { steps: wire, validations: validateSequence(problem, wire) };
}

/** Which completion-checklist items the student has satisfied so far. */
export function checklistStatus(problem: WorkbenchProblem, steps: SolutionStep[], validations: StepValidation[]): Record<string, boolean> {
  const nodeType = (id: string) => problem.graph.nodes.find((n) => n.id === id)?.type;
  const ok = (v: StepValidation) => v.mathematical.status !== "fail" && v.physical.status !== "fail";
  const status: Record<string, boolean> = {};
  const has = (pred: (s: SolutionStep, v: StepValidation) => boolean) => steps.some((s, i) => validations[i] && pred(s, validations[i]));
  for (const item of problem.checklist as ChecklistItem[]) {
    switch (item.id) {
      case "selected_relationship":
        status[item.id] = has((s, v) => ok(v) && v.physical.status === "pass" && (s.operation === "select_principle" || v.matchedNodes.some((n) => ["equation_application", "principle", "intermediate_goal"].includes(nodeType(n) ?? "")) || v.unanticipated));
        break;
      case "rearranged":
        status[item.id] = has((s, v) => ok(v) && v.mathematical.code === "equivalent" && (s.operation === "isolate_variable" || s.operation === "solve_equation" || v.matchedNodes.some((n) => nodeType(n) === "transformation")));
        break;
      case "intermediate":
        status[item.id] = has((_s, v) => ok(v) && v.matchedNodes.some((n) => nodeType(n) === "intermediate_value"));
        break;
      case "substituted_with_units":
        status[item.id] = has((s, v) => ok(v) && !!v.value && v.physical.code !== "missing_unit" && (s.unit.trim() !== "" || /[a-zA-Z]\s*$/.test(s.expression_latex)));
        break;
      case "verified":
        status[item.id] = has((s, v) => s.operation === "verify" && v.mathematical.code === "verified");
        break;
      default:
        status[item.id] = false;
    }
  }
  return status;
}

/** Pretty LaTeX of how the machine read a step (symbols rendered with the problem's notation). */
export function chainTex(problem: WorkbenchProblem, latex: string): string | null {
  if (!latex.trim()) return null;
  try {
    const chain = parseChain(latex, Object.keys(problem.symbols), problem.keepDelta);
    const handler = (node: { type: string; name?: string }) => (node.type === "SymbolNode" && node.name && problem.symbols[node.name] ? `{${problem.symbols[node.name].tex}}` : undefined);
    const sides = chain.parts.map((p) => p.node.toTex({ parenthesis: "auto", implicit: "hide", handler: handler as never }));
    return sides.join(" = ") + (chain.trailingUnit ? `\\,\\mathrm{${chain.trailingUnit}}` : "");
  } catch {
    return null;
  }
}
