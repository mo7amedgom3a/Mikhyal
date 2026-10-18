/**
 * Converts what students actually type — LaTeX from the visual math editor, LaTeX typed by
 * hand, or Unicode math (², √, π, θ, ×, ½, t₀) — into a plain expression mathjs can parse.
 * The output feeds the deterministic checker in evaluator.ts; nothing here is graded.
 */

const GREEK: Record<string, string> = {
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε", varepsilon: "ε", zeta: "ζ", eta: "η",
  theta: "θ", vartheta: "θ", iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ",
  rho: "ρ", varrho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ", varphi: "φ", chi: "χ",
  psi: "ψ", omega: "ω", Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Sigma: "Σ",
  Phi: "Φ", Psi: "Ψ", Omega: "Ω",
};

/** LaTeX function commands → mathjs function names. \log is base 10 as in the Egyptian curriculum. */
const FUNCS: Record<string, string> = {
  sin: "sin", cos: "cos", tan: "tan", cot: "cot", sec: "sec", csc: "csc",
  arcsin: "asin", arccos: "acos", arctan: "atan", sinh: "sinh", cosh: "cosh", tanh: "tanh",
  exp: "exp", ln: "log", log: "log10",
};

const OPERATORS: Record<string, string> = {
  cdot: "*", times: "*", ast: "*", div: "/", pm: "+", mp: "-",
  approx: "=", simeq: "=", equiv: "=", infty: "Infinity", pi: "pi", circ: " deg ",
};

const SPACING = new Set([
  "left", "right", "big", "Big", "bigg", "Bigg", "bigl", "bigr", "Bigl", "Bigr", "displaystyle",
  "textstyle", "limits", "quad", "qquad", ",", ";", ":", "!", " ", "mathstrut",
]);

const TEXT_CMDS = new Set(["text", "mathrm", "mathit", "mathbf", "textrm", "mathsf", "boldsymbol", "vec", "overrightarrow"]);

class LatexReader {
  private i = 0;
  constructor(private readonly src: string) {}

  private peek(): string {
    return this.src[this.i] ?? "";
  }

  private skipSpaces() {
    while (/\s/.test(this.peek())) this.i++;
  }

  private readCommand(): string {
    this.i++; // backslash
    const start = this.i;
    if (/[A-Za-z]/.test(this.peek())) {
      while (/[A-Za-z]/.test(this.peek())) this.i++;
    } else {
      this.i++;
    }
    return this.src.slice(start, this.i);
  }

  /** A braced group, or a single token when braces are omitted (\frac12, x^2). */
  private readArg(): string {
    this.skipSpaces();
    const c = this.peek();
    if (c === "{") {
      this.i++;
      const inner = this.readSequence("}");
      this.i++;
      return inner;
    }
    if (c === "\\") return this.readCommandAsExpr();
    this.i++;
    return c;
  }

  private readRaw(): string {
    this.skipSpaces();
    if (this.peek() !== "{") return this.peek() ? this.src[this.i++] : "";
    this.i++;
    let depth = 1;
    const start = this.i;
    while (this.i < this.src.length && depth > 0) {
      if (this.src[this.i] === "{") depth++;
      else if (this.src[this.i] === "}") depth--;
      this.i++;
    }
    return this.src.slice(start, this.i - 1);
  }

  private readDelimiter(opening: boolean): string {
    this.skipSpaces();
    let d = this.peek();
    if (d === "\\") {
      const name = this.readCommand();
      d = name === "{" ? "(" : name === "}" ? ")" : name === "|" || name === "vert" ? "|" : name === "langle" ? "(" : name === "rangle" ? ")" : "";
    } else {
      this.i++;
    }
    if (d === "|") return opening ? "abs(" : ")";
    if (d === "." || d === "") return "";
    if ("([".includes(d)) return "(";
    if (")]".includes(d)) return ")";
    return d;
  }

  /** Argument of a function written without parentheses: \sin\theta, \sin 2x stays sin(2)*x. */
  private readFunctionArg(): string {
    this.skipSpaces();
    const c = this.peek();
    if (c === "(" || c === "\\" && this.src.startsWith("\\left", this.i)) {
      return ""; // the parenthesised group that follows is the argument
    }
    let arg: string;
    const num = this.src.slice(this.i).match(/^\d+(?:\.\d+)?/);
    if (num) {
      arg = num[0];
      this.i += num[0].length;
    } else {
      arg = this.readArg();
    }
    // keep a subscript or a degree sign attached: \sin\theta_1, \sin 30^\circ
    if (this.peek() === "_") {
      this.i++;
      arg += subscriptText(this.readArg());
    }
    if (this.src.startsWith("^\\circ", this.i) || this.src.startsWith("^{\\circ}", this.i)) {
      this.i += this.src.startsWith("^{", this.i) ? 8 : 6;
      arg += " deg";
    }
    return `(${arg})`;
  }

  private readCommandAsExpr(): string {
    const name = this.readCommand();
    if (name === "frac" || name === "dfrac" || name === "tfrac" || name === "cfrac") {
      const num = this.readArg();
      const den = this.readArg();
      return `((${num})/(${den}))`;
    }
    if (name === "sqrt") {
      this.skipSpaces();
      let index = "";
      if (this.peek() === "[") {
        this.i++;
        index = this.readSequence("]");
        this.i++;
      }
      const body = this.readArg();
      return index ? `nthRoot(${body}, ${index})` : `sqrt(${body})`;
    }
    if (name === "left") return this.readDelimiter(true);
    if (name === "right") return this.readDelimiter(false);
    if (name === "{" ) return "(";
    if (name === "}") return ")";
    if (name === "|") return "|";
    if (name in GREEK) return GREEK[name];
    if (name in OPERATORS) return OPERATORS[name];
    if (name in FUNCS) {
      let power = "";
      this.skipSpaces();
      if (this.peek() === "^") {
        this.i++;
        power = this.readArg();
      }
      const arg = this.readFunctionArg();
      const call = arg ? `${FUNCS[name]}${arg}` : FUNCS[name];
      return power && arg ? `${call}^(${power})` : call;
    }
    if (name === "operatorname") return this.readRaw();
    if (TEXT_CMDS.has(name)) return ` ${this.readRaw()}`;
    if (SPACING.has(name)) return " ";
    return name; // unknown command: becomes a symbol so the checker can name it
  }

  readSequence(until = ""): string {
    let out = "";
    while (this.i < this.src.length) {
      const c = this.peek();
      if (until && c === until) break;
      if (c === "\\") {
        const r = this.readCommandAsExpr();
        // "t\sqrt{x}" must not glue into the identifier "tsqrt": separate with a space (implicit product).
        const glue = /[A-Za-z0-9\u0370-\u03FF)]$/.test(out) && /^[A-Za-z\u0370-\u03FF(]/.test(r);
        out += (glue ? " " : "") + r;
      } else if (c === "{") {
        this.i++;
        out += `(${this.readSequence("}")})`;
        this.i++;
      } else if (c === "^") {
        this.i++;
        const exp = this.readArg().trim();
        out += exp === "deg" || exp === "°" ? " deg " : `^(${exp})`;
      } else if (c === "_") {
        this.i++;
        out += subscriptText(this.readArg());
      } else if (c === "&") {
        this.i++;
      } else {
        out += c;
        this.i++;
      }
    }
    return out;
  }
}

/** Subscripts become part of the identifier: t_0 → t0, v_{max} → vmax. */
function subscriptText(s: string): string {
  return s.replace(/[^A-Za-z0-9Ͱ-Ͽ]/g, "");
}

const SUPERSCRIPTS: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9", "⁻": "-", "⁺": "+", "ⁿ": "n" };
const SUBSCRIPTS: Record<string, string> = { "₀": "0", "₁": "1", "₂": "2", "₃": "3", "₄": "4", "₅": "5", "₆": "6", "₇": "7", "₈": "8", "₉": "9", "ₓ": "x", "ₙ": "n" };

/** Unicode math typed on a phone or copied from a book. */
export function normalizeUnicodeMath(raw: string): string {
  return raw
    .replace(/[٠-٩]/g, (d) => String("٠١٢٣٤٥٦٧٨٩".indexOf(d)))
    .replace(/٫/g, ".")
    .replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹⁻⁺ⁿ]+/g, (m) => `^(${[...m].map((c) => SUPERSCRIPTS[c]).join("")})`)
    .replace(/[₀₁₂₃₄₅₆₇₈₉ₓₙ]+/g, (m) => [...m].map((c) => SUBSCRIPTS[c]).join(""))
    .replace(/½/g, "(1/2)")
    .replace(/¼/g, "(1/4)")
    .replace(/¾/g, "(3/4)")
    .replace(/[×·⋅∙]/g, "*")
    .replace(/÷/g, "/")
    .replace(/[−–]/g, "-")
    .replace(/[≈≃≡]/g, "=")
    .replace(/π/g, "pi")
    .replace(/∞/g, "Infinity")
    .replace(/°/g, " deg ")
    .replace(/√\s*([A-Za-zͰ-Ͽ][A-Za-z0-9_Ͱ-Ͽ]*|\d+(?:\.\d+)?)/g, "sqrt($1)")
    .replace(/√/g, "sqrt");
}

export function looksLikeLatex(s: string): boolean {
  return /\\[A-Za-z]|[{}]|\\[,;!]/.test(s);
}

/** LaTeX or Unicode math → mathjs syntax. Plain ASCII input passes through unchanged. */
export function latexToMath(input: string): string {
  let s = input.trim().replace(/^\$+|\$+$/g, "").replace(/^\\\(|\\\)$/g, "").replace(/^\\\[|\\\]$/g, "");
  if (looksLikeLatex(s)) s = new LatexReader(s).readSequence();
  s = normalizeUnicodeMath(s);
  return s
    .replace(/\^\(\s*(-?[\w.Ͱ-Ͽ]+)\s*\)/g, "^$1") // ^(2) → ^2 keeps units and previews tidy
    .replace(/\s+/g, " ")
    .trim();
}
