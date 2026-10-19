import { NextResponse } from "next/server";
import { getWorkbenchProblem } from "@/lib/workbench/problems";
import { AST_VERSION, type SolutionStep } from "@/lib/workbench/types";
import { validateSequence } from "@/lib/workbench/validate";

interface ValidateRequest {
  problem_id: string;
  /** Latest attempt of every step, in order. */
  steps: SolutionStep[];
  prior_failed_attempts?: Record<string, number>;
  mastery?: number;
}

const MAX_STEPS = 30;
const OPERATIONS = new Set<SolutionStep["operation"]>(["select_principle", "isolate_variable", "substitute", "compute", "simplify", "solve_equation", "verify"]);

/** Deterministic step validation. The client-sent expression_ast is ignored and recomputed here. */
export async function POST(request: Request) {
  let body: ValidateRequest;
  try {
    body = (await request.json()) as ValidateRequest;
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }
  const problem = getWorkbenchProblem(body.problem_id);
  if (!problem) return NextResponse.json({ error: "unknown problem" }, { status: 404 });
  if (!Array.isArray(body.steps) || body.steps.length > MAX_STEPS) return NextResponse.json({ error: "steps must be an array of at most 30" }, { status: 400 });
  if (body.steps.some((s) => !OPERATIONS.has(s?.operation))) return NextResponse.json({ error: "unknown operation" }, { status: 400 });
  const steps: SolutionStep[] = body.steps.map((s) => ({
    step_id: String(s.step_id ?? ""),
    attempt_id: String(s.attempt_id ?? ""),
    expression_latex: String(s.expression_latex ?? "").slice(0, 400),
    expression_ast: null,
    ast_version: AST_VERSION,
    operation: s.operation,
    inputs: Array.isArray(s.inputs) ? s.inputs.map(String).slice(0, 6) : [],
    target_variable: String(s.target_variable ?? ""),
    unit: String(s.unit ?? "").slice(0, 20),
    student_explanation: String(s.student_explanation ?? "").slice(0, 600),
    client_step_id: String(s.client_step_id ?? ""),
  }));
  const validations = validateSequence(problem, steps, { priorFailedAttempts: body.prior_failed_attempts, mastery: body.mastery });
  return NextResponse.json({ problem_id: problem.id, ast_version: AST_VERSION, validations });
}
