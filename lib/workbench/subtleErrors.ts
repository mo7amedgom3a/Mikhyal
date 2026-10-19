/**
 * Subtle mathematical errors: transformations that are "almost right" because they lose or add
 * solutions, or change the domain. They are classified by the same root-set comparison the
 * Workbench uses, and answered with a Socratic nudge instead of a binary right/wrong.
 */
import { compareRelations, makeRelation, rootsIn, type Comparison } from "./algebra";
import { parseChain } from "./mathjson";

export interface SubtleCase {
  id: string;
  title_ar: string;
  /** What the transformation does, e.g. "taking a square root". */
  move_ar: string;
  input: string;
  step: string;
  variable: string;
  domain: [number, number];
  degrees?: boolean;
  /** Optional assumption the student can toggle, which restricts the domain. */
  assumption?: { label_ar: string; latex: string; domain: [number, number] };
  feedback_ar: string;
  /** Feedback when the assumption makes the step complete. */
  feedbackAssumed_ar?: string;
}

export const SUBTLE_CASES: SubtleCase[] = [
  {
    id: "square-root",
    title_ar: "الجذر التربيعي",
    move_ar: "أخذ الجذر للطرفين",
    input: "x^2 = 9",
    step: "x = 3",
    variable: "x",
    domain: [-10, 10],
    assumption: { label_ar: "لو المسألة بتقول إن x ≥ 0 (طول مثلًا)", latex: "x \\ge 0", domain: [0, 10] },
    feedback_ar: "أنت وصلت لحل صحيح، بس هل ده الحل الوحيد؟ جرّب تعوّض بـ $-3$ في المعادلة الأصلية.",
    feedbackAssumed_ar: "تمام: بما إن $x \\ge 0$ في المسألة، $x = 3$ هو الحل الوحيد. حلو إنك استخدمت القيد.",
  },
  {
    id: "squaring",
    title_ar: "تربيع الطرفين",
    move_ar: "تربيع الطرفين",
    input: "\\sqrt{x+2} = x",
    step: "x + 2 = x^2",
    variable: "x",
    domain: [-2, 10],
    feedback_ar: "التربيع خطوة مشروعة، بس ممكن يدخّل حلول غريبة. المعادلة الجديدة ليها حلين — جرّب تعوّض بـ $x = -1$ في المعادلة الأصلية: الطرفين متساويين؟",
  },
  {
    id: "divide-by-variable",
    title_ar: "القسمة على متغير",
    move_ar: "القسمة على x",
    input: "x^2 = 2x",
    step: "x = 2",
    variable: "x",
    domain: [-10, 10],
    feedback_ar: "قسمت الطرفين على $x$… طب لو $x = 0$؟ عوّض بيها في المعادلة الأصلية وشوف هل هي حل.",
  },
  {
    id: "inverse-trig",
    title_ar: "الدوال المثلثية العكسية",
    move_ar: "أخذ sin⁻¹",
    input: "\\sin\\theta = 0.5",
    step: "\\theta = 30",
    variable: "θ",
    domain: [0, 359],
    degrees: true,
    assumption: { label_ar: "لو الزاوية حادة (زاوية في مثلث قائم)", latex: "0^\\circ < \\theta < 90^\\circ", domain: [0, 89] },
    feedback_ar: "الآلة الحاسبة بتديك $30^\\circ$ بس. في الفترة $[0^\\circ, 360^\\circ)$، فيه زاوية تانية جيبها $0.5$؟ فكّر في الربع التاني.",
    feedbackAssumed_ar: "صح: الزاوية حادة، يبقى $30^\\circ$ هي الوحيدة.",
  },
  {
    id: "restricted-simplify",
    title_ar: "تبسيط بمجال مقيّد",
    move_ar: "اختصار (x − 1)",
    input: "y = \\frac{x^2-1}{x-1}",
    step: "y = x + 1",
    variable: "x",
    domain: [-5, 5],
    feedback_ar: "الاختصار صح جبريًا، بس التعبير الأصلي معرّف عند $x = 1$؟ اكتب الناتج ومعاه الشرط $x \\ne 1$.",
  },
];

export type SubtleVerdict = "complete" | "lost_solutions" | "extraneous_solutions" | "domain_changed" | "wrong";

export interface SubtleResult {
  verdict: SubtleVerdict;
  inputRoots: number[];
  stepRoots: number[];
  counterexample?: number;
  feedback_ar: string;
}

function relationOf(latex: string, symbols: string[], degrees?: boolean) {
  const chain = parseChain(latex, symbols);
  const [l, r] = chain.parts;
  return makeRelation(l.node, r.node, chain.parts.flatMap((p) => p.symbols).filter((v, i, a) => a.indexOf(v) === i), { degrees });
}

export function analyzeSubtle(c: SubtleCase, assumed = false): SubtleResult {
  const symbols = c.id === "restricted-simplify" ? ["x", "y"] : [c.variable];
  const domain = assumed && c.assumption ? c.assumption.domain : c.domain;
  const doms: Record<string, [number, number]> = { [c.variable]: domain, y: [-20, 20] };
  const a = relationOf(c.input, symbols, c.degrees);
  const b = relationOf(c.step, symbols, c.degrees);
  const cmp: Comparison = compareRelations(a, b, doms);
  const roots = (rel: typeof a) =>
    symbols.length === 1 ? rootsIn((x) => rel.lhs({ [c.variable]: x }) - rel.rhs({ [c.variable]: x }), domain[0], domain[1], 720).map((r) => +r.toFixed(6)) : [];
  const ex = "counterexample" in cmp && cmp.counterexample ? cmp.counterexample[c.variable] : undefined;
  const verdict: SubtleVerdict =
    cmp.kind === "equivalent"
      ? "complete"
      : cmp.kind === "lost_solutions"
        ? "lost_solutions"
        : cmp.kind === "extraneous_solutions"
          ? cmp.domainChanged
            ? "domain_changed"
            : "extraneous_solutions"
          : "wrong";
  return {
    verdict,
    inputRoots: roots(a),
    stepRoots: roots(b),
    counterexample: ex === undefined ? undefined : +ex.toFixed(4),
    feedback_ar: verdict === "complete" && c.feedbackAssumed_ar ? c.feedbackAssumed_ar : c.feedback_ar,
  };
}
