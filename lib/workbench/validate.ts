/**
 * The Workbench validation pipeline.
 *
 *   1. Parser & normalizer      LaTeX → restricted AST → MathJSON
 *   2. Symbolic & physical      equivalence to inputs, dimensions, principles, model, constraints
 *   3. Solution-graph matcher   which authored node (if any) the step realizes
 *   4. Pedagogical decision     accept · clarify · hint · experiment · ai_interpret
 *
 * Every stage is deterministic. The LLM is only used afterwards, for "ai_interpret".
 */
import type { MathNode } from "mathjs";
import {
  checkDimensions,
  compareRelations,
  compileExpr,
  holdsAt,
  isIdentity,
  makeRelation,
  modelPoints,
  rootsIn,
  toSI,
  type Comparison,
  type Domains,
  type Relation,
  type Scope,
} from "./algebra";
import { parseChain, StepParseError, type ParsedChain } from "./mathjson";
import {
  HINT_TIERS,
  type GraphNode,
  type HintTier,
  type LayerOutput,
  type PedagogicalAction,
  type SolutionStep,
  type StepValidation,
  type Verdict,
  type WorkbenchProblem,
} from "./types";

const V = (status: Verdict["status"], code: string, note_ar: string): Verdict => ({ status, code, note_ar });

/** What a validated step contributes to later steps. */
interface Analysis {
  step: SolutionStep;
  validation: StepValidation;
  relation?: StepRelation;
}

interface StepRelation {
  rel: Relation;
  lhs: MathNode;
  rhs: MathNode;
  /** The side that is a lone symbol, if any (s = …). */
  solvedFor?: string;
}

export interface ValidateOptions {
  /** Failed attempts on earlier retries of this step (not visible in `history`). */
  priorFailedAttempts?: number;
  /** Learner mastery of the problem's concepts (0..1); low mastery starts hints one tier higher. */
  mastery?: number;
}

/** Rounded intermediate values legitimately drift a little from the exact answer. */
const TRUTH_TOL = 0.02;

const near = (a: number, b: number, rel = 0.01) => Math.abs(a - b) <= rel * Math.max(Math.abs(a), Math.abs(b), 1e-300);

const isLoneSymbol = (n: MathNode): string | undefined => {
  let x = n;
  while (x.type === "ParenthesisNode") x = (x as unknown as { content: MathNode }).content;
  return x.type === "SymbolNode" ? (x as unknown as { name: string }).name : undefined;
};

function fmt(x: number): string {
  if (!Number.isFinite(x)) return String(x);
  const a = Math.abs(x);
  return a !== 0 && (a >= 1e5 || a < 1e-3) ? x.toExponential(3) : String(+x.toPrecision(4));
}

function describePoint(p: Scope, problem: WorkbenchProblem): string {
  return Object.entries(p)
    .filter(([k]) => problem.symbols[k])
    .map(([k, v]) => `${problem.symbols[k].tex.replace(/\\/g, "")} = ${fmt(v)}`)
    .join("، ");
}

function symbolNames(problem: WorkbenchProblem) {
  return Object.keys(problem.symbols);
}

function domainsOf(problem: WorkbenchProblem): Domains {
  return Object.fromEntries(Object.entries(problem.symbols).map(([k, s]) => [k, s.domain]));
}

function unitsOf(problem: WorkbenchProblem): Record<string, string> {
  return Object.fromEntries(Object.entries(problem.symbols).map(([k, s]) => [k, s.unit]));
}

function relationFrom(lhs: MathNode, rhs: MathNode, symbols: string[]): StepRelation {
  const vars = new Set<string>();
  for (const n of [lhs, rhs])
    n.traverse((c, _p, parent) => {
      if (c.type !== "SymbolNode") return;
      if (parent?.type === "FunctionNode" && (parent as unknown as { fn: MathNode }).fn === c) return;
      const name = (c as unknown as { name: string }).name;
      if (symbols.includes(name)) vars.add(name);
    });
  return { rel: makeRelation(lhs, rhs, [...vars]), lhs, rhs, solvedFor: isLoneSymbol(lhs) ?? isLoneSymbol(rhs) };
}

const relCache = new Map<string, StepRelation>();
/** Relation from an authored mathjs formula ("s = u*t + a*t^2/2"). */
export function formulaRelation(problem: WorkbenchProblem, formula: string): StepRelation | null {
  const key = `${problem.id}|${formula}`;
  const hit = relCache.get(key);
  if (hit) return hit;
  try {
    const chain = parseChain(formula, symbolNames(problem), problem.keepDelta);
    if (chain.parts.length !== 2) return null;
    const r = relationFrom(chain.parts[0].node, chain.parts[1].node, symbolNames(problem));
    relCache.set(key, r);
    return r;
  } catch {
    return null;
  }
}

/** Pin variables that a comparison partner lacks to their known values (substituted equations). */
function pinnedDomains(problem: WorkbenchProblem, a: Relation, b: Relation, scope: Scope): Domains {
  const d = { ...domainsOf(problem) };
  const inB = new Set(b.vars);
  const inA = new Set(a.vars);
  for (const v of a.vars) if (!inB.has(v) && v in scope) d[v] = [scope[v], scope[v]];
  for (const v of b.vars) if (!inA.has(v) && v in scope) d[v] = [scope[v], scope[v]];
  // Pinned variables cannot be solved for.
  return d;
}

function compareIn(problem: WorkbenchProblem, a: Relation, b: Relation, scope: Scope): Comparison {
  const doms = pinnedDomains(problem, a, b, scope);
  const strip = (r: Relation): Relation => ({ ...r, vars: r.vars.filter((v) => doms[v][0] !== doms[v][1]) });
  const vars = [...new Set([...a.vars, ...b.vars])];
  // Pinned variables are fed through the domain; only free ones are solved for.
  const withPins = (r: Relation): Relation => {
    const pins = Object.fromEntries(vars.filter((v) => doms[v][0] === doms[v][1]).map((v) => [v, doms[v][0]]));
    return { ...strip(r), key: `${r.key}|${JSON.stringify(pins)}`, lhs: (s) => r.lhs({ ...pins, ...s }), rhs: (s) => r.rhs({ ...pins, ...s }) };
  };
  return compareRelations(withPins(a), withPins(b), doms);
}

/** Value of `target` implied by a relation at the given scope (explicit side, or a root nearest `near`). */
function solveFor(sr: StepRelation, target: string, scope: Scope, problem: WorkbenchProblem, nearTo?: number): number | null {
  if (!sr.rel.vars.includes(target)) return null;
  const missing = sr.rel.vars.filter((v) => v !== target && !(v in scope));
  if (missing.length) return null;
  if (sr.solvedFor === target) {
    const other = isLoneSymbol(sr.lhs) === target ? sr.rhs : sr.lhs;
    const v = compileExpr(other)(scope);
    if (Number.isFinite(v)) return v;
  }
  const [lo, hi] = problem.symbols[target].domain;
  const span = Math.max(Math.abs(lo), Math.abs(hi));
  const roots = rootsIn((x) => sr.rel.lhs({ ...scope, [target]: x }) - sr.rel.rhs({ ...scope, [target]: x }), -span * 4, span * 4, 800);
  if (!roots.length) return null;
  if (nearTo === undefined) return roots.find((r) => r >= 0) ?? roots[0];
  return roots.reduce((best, r) => (Math.abs(r - nearTo) < Math.abs(best - nearTo) ? r : best));
}

/** Known values plus values established by earlier valid steps. */
function scopeFrom(problem: WorkbenchProblem, history: Analysis[]): Scope {
  const s: Scope = { ...problem.knowns };
  for (const h of history) {
    const v = h.validation.value;
    if (v && h.validation.mathematical.status !== "fail" && h.validation.physical.status !== "fail") s[v.symbol] = v.si;
  }
  return s;
}

function reachedNodes(problem: WorkbenchProblem, history: Analysis[]): Set<string> {
  const set = new Set(problem.graph.nodes.filter((n) => n.type === "known_quantity" || n.type === "constraint").map((n) => n.id));
  for (const h of history) if (h.validation.action === "accept" || h.validation.action === "clarify") h.validation.matchedNodes.forEach((n) => set.add(n));
  return set;
}

export function pathStatus(problem: WorkbenchProblem, reached: Set<string>) {
  const structural = new Set(problem.graph.nodes.filter((n) => n.type === "known_quantity" || n.type === "constraint").map((n) => n.id));
  const steps = [...reached].filter((n) => !structural.has(n));
  return problem.graph.paths.map((path, i) => {
    const done = path.filter((n) => reached.has(n)).length;
    const consistent = steps.every((n) => path.includes(n));
    return { index: i, path, done, total: path.length, consistent, complete: done === path.length };
  });
}

/** Next node to work on: first unreached node of the most advanced consistent path. */
export function nextNode(problem: WorkbenchProblem, reached: Set<string>): GraphNode | undefined {
  const status = pathStatus(problem, reached).filter((p) => p.consistent).sort((a, b) => b.done / b.total - a.done / a.total);
  const best = status[0] ?? pathStatus(problem, reached)[0];
  const id = best?.path.find((n) => !reached.has(n));
  return problem.graph.nodes.find((n) => n.id === id);
}

function pickHint(problem: WorkbenchProblem, reached: Set<string>, tierIdx: number): { tier: HintTier; text: string } {
  const tier = HINT_TIERS[Math.max(0, Math.min(3, tierIdx))];
  const node = nextNode(problem, reached);
  return { tier, text: node?.hints?.[tier] ?? problem.hints[tier] };
}

export function validateStep(problem: WorkbenchProblem, history: Analysis[], step: SolutionStep, opts: ValidateOptions = {}): Analysis {
  const symbols = symbolNames(problem);
  const scope = scopeFrom(problem, history);
  const reached = reachedNodes(problem, history);
  const trace: LayerOutput[] = [];
  const failures =
    (opts.priorFailedAttempts ?? 0) + history.filter((h) => h.validation.action !== "accept").length + ((opts.mastery ?? 0.5) < 0.3 ? 1 : 0);

  const base = {
    step_id: step.step_id,
    attempt_id: step.attempt_id,
    client_step_id: step.client_step_id,
  };

  // ── 1. Parse & normalize ──────────────────────────────────────────────
  let chain: ParsedChain;
  try {
    chain = parseChain(step.expression_latex, symbols, problem.keepDelta);
    trace.push({ layer: "syntax", status: "pass", output: chain.normalized });
    trace.push({ layer: "canonical", status: "pass", output: JSON.stringify(chain.ast) });
  } catch (e) {
    const err = e instanceof StepParseError ? e : new StepParseError("syntax", String(e));
    const note =
      err.code === "unknown_symbol"
        ? `الرمز «${err.detail}» مش من رموز المسألة. الرموز المتاحة: ${symbols.map((s) => problem.symbols[s].tex.replace(/\\/g, "")).join("، ")}.`
        : err.code === "forbidden_node" || err.code === "unknown_function"
          ? "الصيغة دي فيها حاجة برّه لغة الرياضيات المسموحة (مثلًا متباينة أو تعريف دالة). اكتب معادلة بعلامة = بس."
          : err.code === "too_long" || err.code === "too_complex"
            ? "الخطوة طويلة أو متداخلة أوي. قسّمها لخطوتين."
            : "مش قادر أقرأ الخطوة. راجع الأقواس والكسور.";
    trace.push({ layer: "syntax", status: "fail", output: `${err.code}: ${err.detail}` });
    const action: PedagogicalAction = step.student_explanation.trim() ? "ai_interpret" : "clarify";
    const validation: StepValidation = {
      ...base,
      expression_ast: null,
      mathematical: V("fail", `parse:${err.code}`, note),
      physical: V("na", "not_evaluated", "مستني خطوة مقروءة."),
      pedagogical: V("na", "not_evaluated", "مستني خطوة مقروءة."),
      action,
      feedback_ar: note,
      trace: [...trace, { layer: "pedagogy", status: "warn", output: action }],
      matchedNodes: [],
      unanticipated: false,
      goalReached: false,
    };
    return { step, validation };
  }

  const parts = chain.parts;
  const isNumeric = parts.map((p) => p.symbols.length === 0);
  const symIdx = parts.map((_, i) => i).filter((i) => !isNumeric[i]);
  const numIdx = parts.map((_, i) => i).filter((i) => isNumeric[i]);
  const numVals = numIdx.map((i) => compileExpr(parts[i].node)(scope));
  const firstLone = isLoneSymbol(parts[0].node);

  let mathematical: Verdict = V("pass", "well_formed", "الصيغة سليمة.");
  let physical: Verdict = V("pass", "consistent", "متسقة مع الموقف الفيزيائي.");
  let units: LayerOutput = { layer: "units", status: "na", output: "—" };
  let symbolicOut = "—";
  let physicsOut = "—";
  let relation: StepRelation | undefined;
  let value: { symbol: string; si: number } | undefined;
  let misconception: WorkbenchProblem["misconceptions"][number] | undefined;
  let forceTier: number | undefined;
  let experimentFromPrinciple = false;

  const inputAnalyses = step.inputs.map((id) => history.find((h) => h.step.step_id === id)).filter(Boolean) as Analysis[];
  const inputRelations = inputAnalyses.map((a) => a.relation).filter(Boolean) as StepRelation[];
  // Choosing a new law is not a transformation of the previous step.
  const derivedFrom = step.operation === "select_principle" ? [] : inputRelations;

  // ── Verify: substitute everything known and check the balance ─────────
  if (step.operation === "verify") {
    const vals = parts.map((p) => compileExpr(p.node)(scope));
    const missing = parts.flatMap((p) => p.symbols).filter((s) => !(s in scope));
    if (missing.length) {
      mathematical = V("warn", "verify_unknowns", `لسه ماعندناش قيمة لـ ${[...new Set(missing)].join("، ")}. التحقق بيكون بقيم معروفة.`);
    } else if (vals.length >= 2 && vals.every((v) => near(v, vals[0], 0.005))) {
      mathematical = V("pass", "verified", `الطرفين متساويين (${fmt(vals[0])}) ✓`);
    } else {
      mathematical = V("fail", "verify_unbalanced", "الطرفين مش متساويين — يعني في قيمة مش مظبوطة. ارجع للخطوة اللي حسبتها فيها.");
    }
    symbolicOut = `values: ${vals.map(fmt).join(" | ")}`;
    physical = V("pass", "verification", "التعويض العكسي في القانون الأصلي.");
    physicsOut = "verification step";
  } else {
    // ── 2a. Relation part ──────────────────────────────────────────────
    if (symIdx.length >= 2) {
      relation = relationFrom(parts[symIdx[0]].node, parts[symIdx[symIdx.length - 1]].node, symbols);
    } else if (symIdx.length === 1 && numIdx.length >= 1 && !isLoneSymbol(parts[symIdx[0]].node)) {
      // "0 = 400 + 2(−5)s": an equation after substitution.
      relation = relationFrom(parts[symIdx[0]].node, parts[numIdx[0]].node, symbols);
    }

    if (relation) {
      const doms = domainsOf(problem);
      const dims = checkDimensions(relation.lhs, relation.rhs, unitsOf(problem));
      units = dims.ok
        ? { layer: "units", status: "pass", output: `[${dims.lhs}] = [${dims.rhs}]` }
        : { layer: "units", status: "fail", output: `[${dims.lhs ?? "?"}] ≠ [${dims.rhs ?? "?"}]` };

      if (isIdentity(relation.rel, doms)) {
        mathematical = V("fail", "identity", "العلاقة دي صح دايمًا (متطابقة) فمش بتقول أي معلومة جديدة. إيه العلاقة اللي بتربط المجهول بالمعطيات؟");
        symbolicOut = "identity";
      } else if (derivedFrom.length === 1) {
        const cmp = compareIn(problem, derivedFrom[0].rel, relation.rel, scope);
        symbolicOut = `vs ${step.inputs.join(",")}: ${cmp.kind}`;
        if (cmp.kind === "equivalent") mathematical = V("pass", "equivalent", "تحويل جبري سليم: الخطوة مكافئة للي قبلها.");
        else if (cmp.kind === "lost_solutions")
          mathematical = V("warn", "lost_solutions", `التحويل ده بيضيّع حلول كانت موجودة في المعادلة الأصلية (مثلًا ${describePoint(cmp.counterexample, problem)}). هل قسمت على حاجة ممكن تكون صفر، أو أخدت جذر؟`);
        else if (cmp.kind === "extraneous_solutions")
          mathematical = V("warn", cmp.domainChanged ? "domain_changed" : "extraneous_solutions", cmp.domainChanged ? "التبسيط غيّر مجال التعريف." : "التحويل ده بيضيف حلول مش موجودة في الأصل. لازم تتحقق من الحلول في المعادلة الأصلية.");
        else if (cmp.kind === "inconclusive") mathematical = V("pass", "inconclusive", "مش قادر أقارن بالخطوة السابقة؛ هتحقق من الاتساق مع الموقف.");
        else mathematical = V("fail", "not_equivalent", "الخطوة دي مش ناتجة عن الخطوة اللي اخترتها كمدخل. راجع التحويل الجبري حتة حتة.");
      } else {
        mathematical = V("pass", "well_formed_relation", "علاقة سليمة رياضيًا تحت افتراضاتها.");
        symbolicOut = derivedFrom.length ? "multi-input: checked against model" : "no relational input";
      }

      // Physical: dimensions → principle library → model.
      if (!dims.ok) {
        physical = V("fail", "dimensions", `الأبعاد مش متسقة: الطرف الشمال [${dims.lhs ?? "?"}] واليمين [${dims.rhs ?? "?"}]. الوحدات بتفضح الغلطة!`);
        forceTier = 3;
      } else {
        const principle = problem.principles.find((p) => {
          const pr = formulaRelation(problem, p.relation);
          return pr && compareIn(problem, pr.rel, relation!.rel, scope).kind === "equivalent";
        });
        if (principle) {
          physicsOut = `principle ${principle.id}: ${principle.status}`;
          if (principle.status === "applicable") physical = V("pass", `principle:${principle.id}`, principle.note_ar);
          else if (principle.status === "incomplete") physical = V("warn", `incomplete_model:${principle.id}`, principle.note_ar);
          else {
            physical = V("fail", `inapplicable:${principle.id}`, principle.note_ar);
            experimentFromPrinciple = true;
          }
        } else {
          const pts = modelPoints(problem.model, scope);
          const tolScale = (s: Scope) => Math.max(Math.abs(relation!.rel.lhs(s)), Math.abs(relation!.rel.rhs(s)));
          const onModel = pts.length > 0 && pts.every((p) => holdsAt(relation!.rel, p, 1e-9 * tolScale(p)) === "holds");
          const atTruth = holdsAt(relation.rel, { ...problem.truth }, 0) === "holds";
          physicsOut = `model: ${onModel ? "holds" : "fails"} · truth: ${atTruth ? "holds" : "fails"}`;
          if (onModel) physical = V("pass", "model_consequence", "العلاقة دي نتيجة صحيحة للنموذج الفيزيائي في المسألة.");
          else if (atTruth) physical = V("pass", "consistent_with_data", "متسقة مع معطيات المسألة.");
          else {
            physical = V("fail", "model_mismatch", "العلاقة دي مش بتوصف الموقف ده. جرّب في المحاكاة: هل الكميات فعلًا بتتغير كده؟");
            experimentFromPrinciple = true;
          }
        }
      }
    }

    // A valid law that simply isn't derived from the chosen input is still correct mathematics.
    if (relation && mathematical.code === "not_equivalent" && physical.status === "pass") {
      mathematical = V("pass", "independent_relation", "علاقة صحيحة جديدة (مش ناتجة من الخطوة اللي اخترتها كمدخل، وده عادي).");
    }

    // ── 2b. Numeric part ────────────────────────────────────────────────
    if (numIdx.length && (firstLone || symIdx.length === 0)) {
      const target = firstLone && !isNumeric[0] ? firstLone : step.target_variable;
      const spec = problem.symbols[target];
      const raw = numVals[numVals.length - 1];
      const unit = (chain.trailingUnit ?? step.unit ?? "").trim().replace(/°C|degC/g, "K");
      const consistentArithmetic = numVals.every((v) => Number.isFinite(v) && near(v, raw, 0.005));

      if (!spec) {
        mathematical = V("fail", "unknown_target", "الكمية المطلوبة مش معروفة في المسألة.");
      } else {
        let si: number | null = unit ? toSI(raw, unit, spec.unit) : raw;
        if (unit && si === null) {
          physical = V("fail", "wrong_unit", `الوحدة «${unit}» مش بتقيس ${spec.label_ar}. ${spec.label_ar} بتتقاس بـ ${spec.unit || "من غير وحدة"}.`);
          units = { layer: "units", status: "fail", output: `${unit} ≠ [${spec.unit}]` };
          si = raw;
        } else if (!unit && spec.unit) {
          units = { layer: "units", status: "warn", output: `missing unit (assumed ${spec.unit})` };
        } else if (units.status !== "fail") {
          units = { layer: "units", status: "pass", output: `${unit || "1"} → ${spec.unit || "1"}` };
        }
        const siVal = si ?? raw;

        if (!consistentArithmetic) {
          mathematical = V("fail", "arithmetic", `في خطأ حسابي: الأطراف مش متساوية (${numVals.map(fmt).join(" ≠ ")}). احسب كل حتة لوحدها.`);
        } else {
          // Expected value from the relation in this step, or from the input relation.
          const source = relation ?? inputRelations.find((r) => r.rel.vars.includes(target));
          const expected = source ? solveFor(source, target, scope, problem, siVal) : null;
          symbolicOut = `${symbolicOut === "—" ? "" : symbolicOut + " · "}value ${fmt(siVal)} ${spec.unit}${expected !== null ? ` · expected from relation ${fmt(expected)}` : ""}`;
          if (expected === null || near(expected, siVal)) {
            if (!relation) mathematical = V("pass", expected === null ? "arithmetic_ok" : "substitution_ok", "التعويض والحساب سليمين.");
          } else {
            // Was the substitution right, but with a flipped sign or an unconverted unit?
            const explained = explainMismatch(problem, source!, target, scope, siVal, raw);
            if (explained) {
              mathematical = V("pass", "substitution_consistent", "الحساب نفسه سليم للقيم اللي عوّضت بيها.");
              physical = V("fail", explained.code, explained.note);
              forceTier = 3;
            } else {
              mathematical = V("fail", "substitution_error", "الرقم ده مش طالع من العلاقة اللي بتعوّض فيها. راجع التعويض: كل رمز اتعوّض بقيمته الصح؟");
            }
          }
        }

        // Physical checks of the value itself.
        if (physical.status !== "fail") {
          const truth = problem.truth[target];
          const signBad =
            (spec.sign === "positive" && siVal <= 0) || (spec.sign === "nonnegative" && siVal < 0) || (spec.sign === "negative" && siVal >= 0);
          if (signBad) {
            physical = V("fail", `constraint:${target}`, `${spec.label_ar} ${spec.sign === "negative" ? "لازم تكون سالبة" : "مايصحش تطلع سالبة"} في الموقف ده. القيمة ${fmt(siVal)} معناها إيه فيزيائيًا؟`);
            forceTier = 3;
          } else if (truth !== undefined && !near(truth, siVal, TRUTH_TOL)) {
            if (mathematical.status === "pass")
              physical = V("fail", "value_mismatch", `القيمة دي مش متسقة مع الموقف الحقيقي. مصدرها علاقة مش مناسبة للمسألة؟`);
          } else if (!unit && spec.unit) {
            physical = V("warn", "missing_unit", `الرقم مظبوط، بس فين الوحدة؟ ${spec.label_ar} بتتقاس بـ ${spec.unit}.`);
          } else if (unit && unit !== spec.unit) {
            physical = V("pass", "converted_unit", `قيمة صحيحة؛ حوّلتها من ${unit} لـ ${spec.unit} بنجاح.`);
          } else {
            physical = V("pass", "value_ok", "القيمة متسقة مع الموقف الفيزيائي.");
          }
        }
        physicsOut = `${physicsOut === "—" ? "" : physicsOut + " · "}${target} = ${fmt(siVal)} ${spec.unit}`;
        if (mathematical.status !== "fail" && physical.status !== "fail") value = { symbol: target, si: siVal };
        misconception = problem.misconceptions.find((m) => "symbol" in m.match && m.match.symbol === target && near(m.match.value, siVal));
      }
    }

    if (!relation && !numIdx.length) {
      mathematical = V("warn", "expression_only", "دي تعبير مش معادلة. اكتبها على صورة «كمية = ...».");
    }
  }

  if (relation && !misconception) {
    misconception = problem.misconceptions.find((m) => {
      if (!("relation" in m.match)) return false;
      const mr = formulaRelation(problem, m.match.relation);
      return mr && compareIn(problem, mr.rel, relation!.rel, scope).kind === "equivalent";
    });
  }

  trace.push({ layer: "symbolic", status: mathematical.status, output: symbolicOut });
  trace.push(units);
  trace.push({ layer: "physics", status: physical.status, output: physicsOut });

  // ── 3. Solution-graph matcher ──────────────────────────────────────────
  const valid = mathematical.status !== "fail" && physical.status !== "fail";
  const matched: string[] = [];
  if (valid) {
    if (relation) {
      let best: { id: string; score: number } | null = null;
      for (const node of problem.graph.nodes) {
        if (!node.formula) continue;
        const nr = formulaRelation(problem, node.formula);
        if (!nr || compareIn(problem, nr.rel, relation.rel, scope).kind !== "equivalent") continue;
        let score = 1;
        if (nr.solvedFor && nr.solvedFor === relation.solvedFor) score += 1;
        if (!reached.has(node.id)) score += 2;
        if ((node.requires ?? []).every((q) => q in scope || reached.has(q))) score += 0.5;
        if (!best || score > best.score) best = { id: node.id, score };
      }
      if (best) matched.push(best.id);
    }
    if (value) {
      const node = problem.graph.nodes.find(
        (n) => (n.type === "intermediate_value" || n.type === "goal" || n.type === "subgoal") && n.produces?.includes(value!.symbol) && (problem.truth[value!.symbol] === undefined || near(problem.truth[value!.symbol], value!.si, TRUTH_TOL)),
      );
      if (node && !matched.includes(node.id)) matched.push(node.id);
    }
  }
  const goalNode = problem.graph.nodes.find((n) => n.type === "goal");
  const goalReached = !!goalNode && matched.includes(goalNode.id);
  const unanticipated = valid && physical.status === "pass" && !!relation && matched.length === 0 && step.operation !== "verify";
  trace.push({
    layer: "reasoning",
    status: matched.length || step.operation === "verify" ? "pass" : unanticipated ? "warn" : valid ? "warn" : "na",
    output: matched.length ? `matched: ${matched.join(", ")}` : unanticipated ? "unanticipated valid route" : "no authored node",
  });

  // ── Pedagogical relevance ─────────────────────────────────────────────
  let pedagogical: Verdict;
  const opMismatch = operationMismatch(step, !!relation, value !== undefined || numIdx.length > 0, inputRelations.length);
  if (!valid) pedagogical = V("na", "blocked_by_validity", "نصلّح صحة الخطوة الأول، وبعدين نشوف بتقرّبنا من الهدف ولا لأ.");
  else if (step.operation === "verify")
    pedagogical = [...reached].includes(goalNode?.id ?? "") ? V("pass", "verification", "تحقق ممتاز من النتيجة.") : V("warn", "verify_early", "التحقق بيكون بعد ما توصل للنتيجة.");
  else if (matched.length) {
    const fresh = matched.filter((m) => !reached.has(m));
    const labels = matched.map((m) => problem.graph.nodes.find((n) => n.id === m)?.label_ar).join(" + ");
    pedagogical = fresh.length
      ? V("pass", goalReached ? "goal_reached" : "advances", goalReached ? "وصلت للمطلوب! 🎯" : `خطوة بتقرّبك من الهدف: ${labels}.`)
      : physical.code === "converted_unit"
        ? V("pass", "unit_conversion", "تحويل وحدات مفيد: الرقم بقى أسهل في الفهم.")
        : V("warn", "redundant", "الخطوة دي صح، بس عملت نفسها قبل كده. إيه اللي محتاجه دلوقتي عشان تقرّب من المطلوب؟");
  } else if (unanticipated) {
    const unknowns = relation!.rel.vars.filter((v) => !(v in problem.knowns));
    pedagogical = unknowns.includes(problem.goal) || unknowns.some((u) => problem.graph.nodes.some((n) => n.produces?.includes(u)))
      ? V("pass", "unanticipated_valid", "طريقة مش من الحلول المكتوبة، بس صحيحة رياضيًا وفيزيائيًا — اتسجّلت كمسار جديد.")
      : V("warn", "not_on_route", "العلاقة صحيحة، بس مش واضح إزاي هتوصّلك للمطلوب. إيه الكمية اللي بتدور عليها؟");
  } else pedagogical = V("warn", "off_route", "القيمة صحيحة بس مش محتاجينها للمطلوب. ركّز على الكمية المطلوبة.");
  if (pedagogical.status === "pass" && opMismatch) pedagogical = V("warn", "operation_mismatch", opMismatch);

  // ── 4. Pedagogical decision ────────────────────────────────────────────
  let action: PedagogicalAction;
  let tierIdx = Math.min(3, failures);
  if (misconception) {
    action = misconception.action;
    if (misconception.tier) tierIdx = HINT_TIERS.indexOf(misconception.tier);
  } else if (mathematical.status === "fail") action = "hint";
  else if (physical.status === "fail") action = experimentFromPrinciple ? "experiment" : "hint";
  else if (mathematical.status === "warn" || physical.status === "warn") action = "clarify";
  else if (pedagogical.code === "operation_mismatch") action = step.student_explanation.trim() ? "ai_interpret" : "clarify";
  else if (pedagogical.status === "warn") action = "clarify";
  else action = "accept";
  if (forceTier !== undefined && action === "hint") tierIdx = Math.max(tierIdx, forceTier);
  const hint = action === "hint" ? pickHint(problem, reached, tierIdx) : undefined;

  const firstIssue = [mathematical, physical, pedagogical].find((v) => v.status === "fail") ?? [mathematical, physical, pedagogical].find((v) => v.status === "warn");
  const feedback_ar = misconception
    ? misconception.feedback_ar
    : action === "accept"
      ? unanticipated
        ? pedagogical.note_ar
        : goalReached
          ? `${pedagogical.note_ar} اتأكد من النتيجة بالتعويض العكسي لو حابب.`
          : pedagogical.note_ar
      : (firstIssue?.note_ar ?? "");
  trace.push({ layer: "pedagogy", status: action === "accept" ? "pass" : "warn", output: hint ? `${action} (${hint.tier})` : action });
  trace.push({ layer: "language", status: "pass", output: action === "ai_interpret" ? "LLM interpretation (rules fallback)" : "deterministic template" });

  const validation: StepValidation = {
    ...base,
    expression_ast: chain.ast,
    mathematical,
    physical,
    pedagogical,
    action,
    feedback_ar,
    hint,
    trace,
    matchedNodes: matched,
    unanticipated: unanticipated && pedagogical.code === "unanticipated_valid",
    value,
    goalReached,
  };
  return { step, validation, relation };
}

function operationMismatch(step: SolutionStep, hasRelation: boolean, hasValue: boolean, relationalInputs: number): string | null {
  switch (step.operation) {
    case "select_principle":
      return hasRelation ? null : "اخترت «اختيار قانون» بس الخطوة مش علاقة عامة. قصدك تعويض؟";
    case "isolate_variable":
      return hasRelation && relationalInputs > 0 ? null : "«عزل متغير» محتاج علاقة سابقة تعزل منها. اختار الخطوة اللي بتعزل منها كمدخل.";
    case "substitute":
    case "compute":
      return hasValue ? null : "اخترت «تعويض» بس مافيش أرقام في الخطوة.";
    default:
      return null;
  }
}

/** Re-evaluate the relation with one known sign-flipped or left in an unconverted unit. */
function explainMismatch(problem: WorkbenchProblem, source: StepRelation, target: string, scope: Scope, si: number, raw: number): { code: string; note: string } | null {
  for (const k of source.rel.vars) {
    if (k === target || !(k in scope) || scope[k] === 0) continue;
    const spec = problem.symbols[k];
    const flipped = solveFor(source, target, { ...scope, [k]: -scope[k] }, problem, si);
    if (flipped !== null && (near(flipped, si) || near(flipped, raw))) {
      return {
        code: `sign_convention:${k}`,
        note: `حسابك صح للقيمة اللي عوّضت بيها، بس إشارة ${spec.label_ar} (${spec.tex.replace(/\\/g, "")}) مش مناسبة للموقف. ${spec.sign === "negative" ? "العربية بتبطّأ، يبقى الإشارة إيه؟" : "فكّر في اتجاه الكمية."}`,
      };
    }
    for (const alt of spec.altUnits ?? []) {
      const altVal = toSI(scope[k], spec.unit, alt);
      if (altVal === null) continue;
      const v = solveFor(source, target, { ...scope, [k]: altVal }, problem, si);
      if (v !== null && (near(v, si) || near(v, raw))) {
        return {
          code: `unit_mix:${k}`,
          note: `الحساب ماشي، بس ${spec.label_ar} اتعوّضت بالـ ${alt} جنب كميات بالـ ${spec.unit}. مينفعش نجمع أو نطرح وحدات مختلفة — حوّل الأول.`,
        };
      }
    }
  }
  return null;
}

/** Validate a whole sequence (latest attempt of each step), in order. */
export function validateSequence(problem: WorkbenchProblem, steps: SolutionStep[], opts: { priorFailedAttempts?: Record<string, number>; mastery?: number } = {}): StepValidation[] {
  const history: Analysis[] = [];
  for (const s of steps) {
    history.push(validateStep(problem, history, s, { priorFailedAttempts: opts.priorFailedAttempts?.[s.step_id], mastery: opts.mastery }));
  }
  return history.map((h) => h.validation);
}

export function reachedFromValidations(problem: WorkbenchProblem, validations: StepValidation[]): Set<string> {
  return reachedNodes(problem, validations.map((v) => ({ validation: v }) as Analysis));
}

export type { Analysis };
