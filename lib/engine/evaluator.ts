/**
 * Deterministic evaluation of student work. No LLM is involved here:
 * equations are checked numerically on sampled points, numbers with mathjs units.
 */
import { create, all, type MathNode, type Unit } from "mathjs";
import type {
  Diagnosis,
  EquationRule,
  ExplicitRelation,
  NumericTarget,
  WrongValueRule,
} from "./types";
import { latexToMath } from "./latex";

const math = create(all, {});

/** Names that are functions or constants, never student variables. */
const FUNCTIONS = new Set([
  "sqrt", "nthRoot", "abs", "exp", "log", "log10",
  "sin", "cos", "tan", "cot", "sec", "csc", "asin", "acos", "atan", "sinh", "cosh", "tanh",
  "pi", "e", "deg", "Infinity",
]);

/**
 * Normalize what students type — LaTeX (\frac, \sqrt, \theta, t_{0}), Unicode (², √, π, ×, t₀),
 * Arabic digits — into mathjs syntax, and split glued products like "2as" into known variables.
 * Δ is dropped so Δt and t name the same quantity.
 */
/** Functions that take an argument (as opposed to constants like pi or units like deg). */
const CALLABLE = ["sqrt", "abs", "exp", "log", "log10", "sin", "cos", "tan", "cot", "sec", "csc", "asin", "acos", "atan", "sinh", "cosh", "tanh"];

/** Greek letters spelled out in ASCII by students typing on a plain keyboard. */
const GREEK_WORDS: Record<string, string> = {
  theta: "θ", alpha: "α", beta: "β", gamma: "γ", lambda: "λ", mu: "μ", omega: "ω", phi: "φ", rho: "ρ", sigma: "σ", tau: "τ",
};

export function normalizeExpression(raw: string, knownVars: string[]): string {
  let s = latexToMath(raw).replace(/Δ/g, "");
  s = s.replace(/(?<![A-Za-z])(theta|alpha|beta|gamma|lambda|mu|omega|phi|rho|sigma|tau)(?![A-Za-z])/g, (w) => GREEK_WORDS[w]);
  // "sin θ", "cos 30" → sin(θ), cos(30): mathjs needs parentheses for calls.
  const fnRe = new RegExp(`(?<![A-Za-z])(${CALLABLE.join("|")})\\s+([A-Za-z\\u0370-\\u03FF][A-Za-z0-9_\\u0370-\\u03FF]*|\\d+(?:\\.\\d+)?)`, "g");
  s = s.replace(fnRe, "$1($2)");
  // Split glued identifiers ("2as", "uv", "μmg", "F1F2cos", "sinθ") into known variables and functions.
  const vars = [...knownVars].sort((a, b) => b.length - a.length);
  const pieces = [...vars, ...CALLABLE].sort((a, b) => b.length - a.length);
  s = s.replace(/[A-Za-z_\u0370-\u03FF][A-Za-z0-9_\u0370-\u03FF]*/g, (raw) => {
    const id = raw.replace(/_/g, "");
    if (FUNCTIONS.has(id) || knownVars.includes(id)) return id;
    const parts: string[] = [];
    let rest = id;
    while (rest.length) {
      const v = pieces.find((k) => rest.startsWith(k));
      if (!v) return id;
      parts.push(v);
      rest = rest.slice(v.length);
    }
    // A function glued to the variable after it is a call: sinθ → sin(θ); a trailing function keeps its "(…)".
    const out: string[] = [];
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (CALLABLE.includes(part) && i + 1 < parts.length) {
        out.push(`${part}(${parts[i + 1]})`);
        i++;
      } else {
        out.push(part);
      }
    }
    return out.join("*");
  });
  return s;
}

function symbolsOf(node: MathNode): string[] {
  const out = new Set<string>();
  node.traverse((n, _path, parent) => {
    if (n.type === "SymbolNode") {
      const name = (n as unknown as { name: string }).name;
      const isFnName =
        parent?.type === "FunctionNode" &&
        (parent as unknown as { fn: MathNode }).fn === n;
      if (!isFnName && !FUNCTIONS.has(name)) out.add(name);
    }
  });
  return [...out];
}

/** Deterministic PRNG so evaluation is reproducible in tests. */
function rng(seed: number) {
  let x = seed >>> 0;
  return () => {
    x = (x * 1664525 + 1013904223) >>> 0;
    return x / 2 ** 32;
  };
}

function samplePoint(
  relation: ExplicitRelation,
  domain: Record<string, [number, number]>,
  rand: () => number,
): Record<string, number> | null {
  const scope: Record<string, number> = {};
  for (const [k, [lo, hi]] of Object.entries(domain)) {
    if (k !== relation.variable) scope[k] = lo + (hi - lo) * rand();
  }
  const val = Number(math.evaluate(relation.expr, scope));
  if (!Number.isFinite(val)) return null;
  scope[relation.variable] = val;
  return scope;
}

export type EquationResult =
  | { status: "correct" }
  | { status: "parse_error" }
  | { status: "incorrect"; diagnosis?: Diagnosis };

interface ParsedEquation {
  residual: (scope: Record<string, number>) => number;
  scale: (scope: Record<string, number>) => number;
  symbols: string[];
}

function parseEquation(input: string, vars: string[], defaultLhs: string): ParsedEquation | null {
  const norm = normalizeExpression(input.trim(), vars);
  if (!norm) return null;
  const sides = norm.split("=");
  if (sides.length > 2) return null;
  const [lhsSrc, rhsSrc] = sides.length === 2 ? sides : [defaultLhs, sides[0]];
  try {
    const lhs = math.parse(lhsSrc).compile();
    const rhs = math.parse(rhsSrc).compile();
    const symbols = [
      ...new Set([...symbolsOf(math.parse(lhsSrc)), ...symbolsOf(math.parse(rhsSrc))]),
    ];
    return {
      symbols,
      residual: (sc) => Number(lhs.evaluate(sc)) - Number(rhs.evaluate(sc)),
      scale: (sc) =>
        Math.max(Math.abs(Number(lhs.evaluate(sc))), Math.abs(Number(rhs.evaluate(sc))), 1e-9),
    };
  } catch {
    return null;
  }
}

/**
 * True when every sampled point satisfying `relation` also satisfies the student's
 * equation, and the equation is not an identity (fails when the relation is broken).
 */
function satisfies(
  eq: ParsedEquation,
  relation: ExplicitRelation,
  domain: Record<string, [number, number]>,
): boolean {
  const rand = rng(42);
  let checked = 0;
  for (let i = 0; i < 40 && checked < 8; i++) {
    const p = samplePoint(relation, domain, rand);
    if (!p) continue;
    let r: number;
    try {
      r = eq.residual(p);
      if (!Number.isFinite(r)) continue;
      if (Math.abs(r) > 1e-6 * eq.scale(p)) return false;
      // Perturb the solved variable: a real relation must now be violated.
      const broken = { ...p, [relation.variable]: p[relation.variable] * 1.37 + 0.11 };
      const rb = eq.residual(broken);
      if (Number.isFinite(rb) && Math.abs(rb) <= 1e-6 * eq.scale(broken)) return false;
    } catch {
      return false;
    }
    checked++;
  }
  return checked >= 3;
}

export function checkEquation(
  input: string,
  opts: {
    variables: string[];
    targets: ExplicitRelation[];
    domain: Record<string, [number, number]>;
    wrongRelations: EquationRule[];
    forbiddenSymbols: Record<string, Diagnosis>;
  },
): EquationResult {
  const defaultLhs = opts.targets[0].variable;
  // Forbidden symbols (e.g. t in the braking mission) must still split out of "ut" so they can be diagnosed.
  const eq = parseEquation(input, [...opts.variables, ...Object.keys(opts.forbiddenSymbols)], defaultLhs);
  if (!eq) return { status: "parse_error" };

  for (const sym of eq.symbols) {
    if (opts.forbiddenSymbols[sym]) {
      return { status: "incorrect", diagnosis: opts.forbiddenSymbols[sym] };
    }
  }
  const unknown = eq.symbols.filter((s) => !opts.variables.includes(s));
  if (unknown.length) {
    return {
      status: "incorrect",
      diagnosis: {
        ruleId: "unknown-symbol",
        errorType: "representational",
        prompt: `الرمز ${unknown.join("، ")} مش من متغيرات المسألة. استخدم بس: ${opts.variables.join("، ")}.`,
      },
    };
  }

  if (opts.targets.some((t) => satisfies(eq, t, opts.domain))) return { status: "correct" };

  for (const rule of opts.wrongRelations) {
    if (satisfies(eq, rule.relation, opts.domain)) {
      const { relation: _relation, ...diagnosis } = rule;
      void _relation;
      return { status: "incorrect", diagnosis };
    }
  }
  return { status: "incorrect" };
}

export type NumericResult =
  | { status: "correct" }
  | { status: "parse_error" }
  | { status: "incorrect"; diagnosis?: Diagnosis };

export function normalizeUnit(u: string): string {
  return u
    .trim()
    .replace(/²/g, "^2")
    .replace(/³/g, "^3")
    .replace(/[μµ]\s*/g, "u")
    .replace(/\s*\^\s*/g, "^")
    .replace(/Ω|ohms?/gi, "ohm")
    .replace(/([a-zA-Z])(\d)\b/g, "$1^$2")
    .replace(/\s+/g, " ");
}

/** Split "3*10^8 m/s" or "((400)/(60)) m/s^2" into its numeric expression and its unit. */
function splitQuantity(s: string): [string, string] {
  let i = 0;
  while (i < s.length) {
    const rest = s.slice(i);
    const word = rest.match(/^[A-Za-z\u0370-\u03FF]+/);
    if (word) {
      if (["sqrt", "nthRoot", "pi"].includes(word[0])) {
        i += word[0].length;
        continue;
      }
      // scientific notation: 3e8, 1.2E-3
      if (/^e[-+]?\d/i.test(rest) && /\d/.test(s[i - 1] ?? "")) {
        i += 1;
        continue;
      }
      break;
    }
    if (/[0-9.+\-*/^()\s,]/.test(s[i])) {
      i++;
      continue;
    }
    break;
  }
  let num = s.slice(0, i);
  let unit = s.slice(i);
  while (/[(*\s]$/.test(num) && num.length) {
    if (num.endsWith("(")) unit = "(" + unit;
    num = num.slice(0, -1);
  }
  return [num.trim(), unit.trim()];
}

/** Accepts plain numbers, LaTeX (6.67\,\text{m/s}^2, \frac{400}{60}), and 3×10^8 notation. */
export function parseQuantity(raw: string): { value: number; unit: string } | null {
  const s = latexToMath(raw);
  const [num, unit] = splitQuantity(s);
  if (!num || !/\d/.test(num)) return null;
  let value: number;
  try {
    value = Number(math.evaluate(num));
  } catch {
    return null;
  }
  if (!Number.isFinite(value)) return null;
  return { value, unit: normalizeUnit(unit) };
}

const near = (a: number, b: number, tol: number) =>
  Math.abs(a - b) <= tol * Math.max(Math.abs(b), 1e-12);

export function checkNumeric(
  raw: string,
  target: NumericTarget,
  wrongValues: WrongValueRule[] = [],
): NumericResult {
  const q = parseQuantity(raw);
  if (!q) return { status: "parse_error" };

  let value = q.value;
  if (target.unit) {
    if (!q.unit) {
      const valueMatches = near(q.value, target.value, target.tolerance);
      return {
        status: "incorrect",
        diagnosis: {
          ruleId: "missing-unit",
          errorType: "procedural",
          prompt: valueMatches
            ? "الرقم مظبوط، بس الإجابة في الفيزيا من غير وحدة ناقصة. الوحدة إيه؟"
            : "فين الوحدة؟ اكتب الرقم والوحدة مع بعض، وده كمان هيساعدك تتأكد من الحل.",
        },
      };
    }
    let u: Unit;
    try {
      u = math.unit(q.value, q.unit);
      value = u.toNumber(target.unit);
    } catch {
      return {
        status: "incorrect",
        diagnosis: {
          ruleId: "wrong-unit",
          errorType: "procedural",
          prompt: `الوحدة "${q.unit}" مش بتقيس نفس الكمية المطلوبة. فكّر: الكمية دي بتتقاس بإيه؟`,
        },
      };
    }
  }

  if (near(value, target.value, target.tolerance)) return { status: "correct" };

  for (const w of wrongValues) {
    if (near(value, w.value, Math.max(target.tolerance, 0.02))) {
      const { value: _v, ...diagnosis } = w;
      void _v;
      return { status: "incorrect", diagnosis };
    }
  }
  if (near(value, -target.value, target.tolerance)) {
    return {
      status: "incorrect",
      diagnosis: {
        ruleId: "sign-error",
        errorType: "mathematical",
        prompt: "المقدار قريب جدًا بس الإشارة معكوسة. راجع اتجاه الكمية والإشارات في المعادلة.",
      },
    };
  }
  const ratio = value / target.value;
  if ([2, 0.5, 10, 0.1, 100, 0.01, 1000, 0.001].some((r) => near(ratio, r, 0.02))) {
    return {
      status: "incorrect",
      diagnosis: {
        ruleId: "factor-error",
        errorType: "mathematical",
        prompt:
          "إجابتك بعيدة عن الصح بمعامل ثابت (×2 أو ×10...). راجع خطوة التعويض أو تحويل الوحدات.",
      },
    };
  }
  return { status: "incorrect" };
}
