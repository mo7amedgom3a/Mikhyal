/**
 * Safe parsing of student steps into a restricted expression language, plus a MathJSON
 * canonical representation.
 *
 * Nothing the student types is ever executed as code: input is normalized (LaTeX, Unicode,
 * glued identifiers), parsed by mathjs into an AST, and the AST is checked against a whitelist
 * of node types, operators and functions with size and depth limits before anything is evaluated.
 */
import { create, all, type MathNode } from "mathjs";
import { normalizeExpression } from "@/lib/engine/evaluator";
import { latexToMath } from "@/lib/engine/latex";
import type { MathJSON } from "./types";

export const math = create(all, {});

export const LIMITS = { maxChars: 400, maxNodes: 160, maxDepth: 24 };

const OPERATORS: Record<string, string> = {
  add: "Add",
  subtract: "Subtract",
  multiply: "Multiply",
  divide: "Divide",
  pow: "Power",
  unaryMinus: "Negate",
  unaryPlus: "",
};

const FUNCTIONS: Record<string, string> = {
  sqrt: "Sqrt",
  nthRoot: "Root",
  abs: "Abs",
  exp: "Exp",
  log: "Ln",
  log10: "Log",
  sin: "Sin",
  cos: "Cos",
  tan: "Tan",
  asin: "Arcsin",
  acos: "Arccos",
  atan: "Arctan",
};

const CONSTANTS: Record<string, string> = { pi: "Pi", e: "ExponentialE", deg: "Degrees" };

export class StepParseError extends Error {
  constructor(
    public code: "too_long" | "empty" | "syntax" | "forbidden_node" | "unknown_function" | "unknown_symbol" | "too_complex",
    public detail: string,
  ) {
    super(`${code}: ${detail}`);
  }
}

/** One side of an equation chain, parsed and whitelisted. */
export interface SafeExpr {
  source: string;
  node: MathNode;
  symbols: string[];
}

/** LaTeX/Unicode → mathjs syntax. Δx becomes dx when the problem keeps deltas as separate symbols. */
export function normalizePart(raw: string, symbols: string[], keepDelta: boolean): string {
  let s = latexToMath(raw);
  if (keepDelta) s = s.replace(/Δ\s*([A-Za-zͰ-Ͽ])/g, "d$1");
  return normalizeExpression(s, symbols).trim();
}

function depthOf(node: MathNode): number {
  let max = 0;
  const walk = (n: MathNode, d: number) => {
    max = Math.max(max, d);
    n.forEach((c) => walk(c, d + 1));
  };
  walk(node, 1);
  return max;
}

/** Parse one side and enforce the whitelist. `h(f - f0)` with h a symbol is read as h·(f − f0). */
export function parseSafe(src: string, symbols: string[]): SafeExpr {
  if (!src) throw new StepParseError("empty", "empty expression");
  if (src.length > LIMITS.maxChars) throw new StepParseError("too_long", `${src.length} chars`);
  let node: MathNode;
  try {
    node = math.parse(src);
  } catch (e) {
    throw new StepParseError("syntax", e instanceof Error ? e.message : String(e));
  }
  // Implicit multiplication written like a call: a symbol followed by parentheses.
  node = node.transform((n) => {
    if (n.type === "FunctionNode") {
      const fn = n as unknown as { fn: { name: string }; args: MathNode[] };
      if (!FUNCTIONS[fn.fn.name] && symbols.includes(fn.fn.name) && fn.args.length === 1) {
        return new math.OperatorNode("*", "multiply", [new math.SymbolNode(fn.fn.name), new math.ParenthesisNode(fn.args[0])]);
      }
    }
    return n;
  });
  let count = 0;
  const found = new Set<string>();
  node.traverse((n, _path, parent) => {
    count++;
    switch (n.type) {
      case "ConstantNode": {
        const v = (n as unknown as { value: unknown }).value;
        if (typeof v !== "number") throw new StepParseError("forbidden_node", "non-numeric constant");
        break;
      }
      case "ParenthesisNode":
        break;
      case "OperatorNode": {
        const fn = (n as unknown as { fn: string }).fn;
        if (!(fn in OPERATORS)) throw new StepParseError("forbidden_node", `operator ${fn}`);
        break;
      }
      case "FunctionNode": {
        const name = (n as unknown as { fn: { name: string } }).fn.name;
        if (!(name in FUNCTIONS)) throw new StepParseError("unknown_function", name);
        break;
      }
      case "SymbolNode": {
        const name = (n as unknown as { name: string }).name;
        const isFnName = parent?.type === "FunctionNode" && (parent as unknown as { fn: MathNode }).fn === n;
        if (isFnName) break;
        if (name in CONSTANTS) break;
        if (!symbols.includes(name)) throw new StepParseError("unknown_symbol", name);
        found.add(name);
        break;
      }
      default:
        // Assignments, function definitions, accessors, arrays, objects, blocks, conditionals, ranges…
        throw new StepParseError("forbidden_node", n.type);
    }
  });
  if (count > LIMITS.maxNodes) throw new StepParseError("too_complex", `${count} nodes`);
  if (depthOf(node) > LIMITS.maxDepth) throw new StepParseError("too_complex", "nesting too deep");
  return { source: src, node, symbols: [...found] };
}

/** mathjs AST → MathJSON. */
export function toMathJSON(node: MathNode): MathJSON {
  switch (node.type) {
    case "ConstantNode":
      return (node as unknown as { value: number }).value;
    case "SymbolNode": {
      const name = (node as unknown as { name: string }).name;
      return CONSTANTS[name] ?? name;
    }
    case "ParenthesisNode":
      return toMathJSON((node as unknown as { content: MathNode }).content);
    case "OperatorNode": {
      const op = node as unknown as { fn: string; args: MathNode[] };
      const args = op.args.map(toMathJSON);
      if (op.fn === "unaryPlus") return args[0];
      if (op.fn === "multiply" || op.fn === "add") {
        // Flatten associative chains: a*b*c → ["Multiply", a, b, c].
        const head = OPERATORS[op.fn];
        const flat: MathJSON[] = [];
        for (const a of args) {
          if (Array.isArray(a) && a[0] === head) flat.push(...(a.slice(1) as MathJSON[]));
          else flat.push(a);
        }
        return [head, ...flat];
      }
      // ½ written as 1/2 is a rational number in MathJSON.
      if (op.fn === "divide" && typeof args[0] === "number" && typeof args[1] === "number" && Number.isInteger(args[0]) && Number.isInteger(args[1])) {
        return ["Rational", args[0], args[1]];
      }
      if (op.fn === "pow" && args[1] === 0.5) return ["Sqrt", args[0]];
      return [OPERATORS[op.fn], ...args];
    }
    case "FunctionNode": {
      const fn = node as unknown as { fn: { name: string }; args: MathNode[] };
      return [FUNCTIONS[fn.fn.name], ...fn.args.map(toMathJSON)];
    }
    default:
      return ["Error", `'unsupported ${node.type}'`];
  }
}

/** Structural sameness of two MathJSON trees (not mathematical equivalence). */
export function structurallySame(a: MathJSON, b: MathJSON): boolean {
  return JSON.stringify(a) === JSON.stringify(b);
}

/** A whole step: an equation chain "a = b = c …" (or a lone expression). */
export interface ParsedChain {
  parts: SafeExpr[];
  /** Unit written after the final number, e.g. "s = … = 40 m". */
  trailingUnit?: string;
  ast: MathJSON;
  normalized: string;
}

/** Split on "=" (ignoring \le, \ge, \neq), normalize and whitelist every side. */
export function parseChain(latex: string, symbols: string[], keepDelta = false): ParsedChain {
  const raw = latex.trim();
  if (!raw) throw new StepParseError("empty", "empty step");
  if (raw.length > LIMITS.maxChars) throw new StepParseError("too_long", `${raw.length} chars`);
  if (/\\(le|ge|leq|geq|neq|ne)\b|[<>≤≥≠]/.test(raw)) throw new StepParseError("forbidden_node", "inequality");
  const rawParts = raw.split("=");
  let trailingUnit: string | undefined;
  const parts = rawParts.map((p, i) => {
    const norm = normalizePart(p, symbols, keepDelta);
    try {
      return parseSafe(norm, symbols);
    } catch (e) {
      // "40 m", "4\,\text{s}": a final number followed by a unit.
      if (i === rawParts.length - 1 && e instanceof StepParseError && e.code === "unknown_symbol") {
        const q = splitTrailingUnit(p);
        if (q) {
          trailingUnit = q.unit;
          return parseSafe(q.num, symbols);
        }
      }
      throw e;
    }
  });
  const sides = parts.map((p) => toMathJSON(p.node));
  const ast: MathJSON = sides.length === 1 ? sides[0] : ["Equal", ...sides];
  return { parts, trailingUnit, ast, normalized: parts.map((p) => p.source).join(" = ") };
}

function splitTrailingUnit(rawPart: string): { num: string; unit: string } | null {
  const s = latexToMath(rawPart).trim();
  const m = s.match(/^(.*?[\d)])\s*([A-Za-zμΩ°][A-Za-z0-9μΩ°/^*\s]*)$/);
  if (!m) return null;
  const unit = m[2].trim().replace(/μ/g, "u").replace(/Ω/g, "ohm").replace(/°C|degC/g, "K");
  try {
    math.unit(1, unit);
  } catch {
    return null;
  }
  return { num: m[1].trim(), unit };
}

/** Parse a relation authored in mathjs syntax (graph formulas, principles). */
export function parseRelation(src: string, symbols: string[]): { lhs: SafeExpr; rhs: SafeExpr } {
  const sides = src.split("=");
  if (sides.length !== 2) throw new StepParseError("syntax", "a relation needs exactly one '='");
  return { lhs: parseSafe(sides[0].trim(), symbols), rhs: parseSafe(sides[1].trim(), symbols) };
}
