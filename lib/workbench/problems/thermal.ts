import { expansion } from "@/lib/physics/phenomena";
import type { WorkbenchProblem } from "../types";
import { WITH_INTERMEDIATE } from "./checklist";

const L0 = 12;
const ALPHA = 1.2e-5;
const T1 = 20;
const T2 = 60;
const DL = expansion(ALPHA, L0, T2 - T1);

export const thermalWorkbench: WorkbenchProblem = {
  id: "thermal_expansion_001",
  title: "فراغ قضبان السكة الحديد",
  subject: "thermal",
  scenario:
    "قضيب سكة حديد من الصلب طوله $L_0 = 12\\,\\mathrm{m}$ عند $T_1 = 20\\,^\\circ\\mathrm{C}$. في عز الصيف القضيب بيوصل $T_2 = 60\\,^\\circ\\mathrm{C}$. معامل التمدد الطولي للصلب $\\alpha = 1.2\\times10^{-5}\\,\\mathrm{K^{-1}}$.",
  ask: "أقل فراغ $\\Delta L$ لازم نسيبه بين القضبان عشان ماتتقوسش؟",
  keepDelta: true,
  symbols: {
    L0: { label_ar: "الطول الأصلي", tex: "L_0", unit: "m", domain: [0.5, 50], sign: "positive" },
    α: { label_ar: "معامل التمدد الطولي", tex: "\\alpha", unit: "1/K", domain: [1e-6, 5e-5], sign: "positive" },
    T1: { label_ar: "درجة الحرارة الابتدائية", tex: "T_1", unit: "K", domain: [-50, 100] },
    T2: { label_ar: "درجة الحرارة النهائية", tex: "T_2", unit: "K", domain: [-50, 200] },
    dT: { label_ar: "التغير في درجة الحرارة", tex: "\\Delta T", unit: "K", domain: [-200, 200], sign: "positive" },
    dL: { label_ar: "الزيادة في الطول", tex: "\\Delta L", unit: "m", domain: [-1, 1], sign: "nonnegative", altUnits: ["mm"] },
    L: { label_ar: "الطول النهائي", tex: "L", unit: "m", domain: [0.1, 60], sign: "positive" },
  },
  knowns: { L0, α: ALPHA, T1, T2 },
  truth: { L0, α: ALPHA, T1, T2, dT: T2 - T1, dL: DL, L: L0 + DL },
  goal: "dL",
  assumptions: [
    { id: "linear", label_ar: "التمدد خطي (ΔT صغيرة نسبيًا و α ثابتة)" },
    { id: "celsius", label_ar: "فرق درجتين بالسيلزيوس = نفس الفرق بالكلفن" },
  ],
  model: { free: { L0: [1, 50], α: [5e-6, 3e-5], T1: [-10, 30], T2: [30, 90] }, derived: { dT: "T2 - T1", dL: "α * L0 * dT", L: "L0 + dL" } },
  principles: [
    { id: "delta-T", latex: "\\Delta T = T_2 - T_1", relation: "dT = T2 - T1", status: "applicable", note_ar: "التغير = النهائي − الابتدائي." },
    { id: "linear", latex: "\\Delta L = \\alpha L_0 \\Delta T", relation: "dL = α*L0*dT", status: "applicable", note_ar: "قانون التمدد الطولي." },
    { id: "final-length", latex: "L = L_0(1 + \\alpha\\Delta T)", relation: "L = L0*(1 + α*dT)", status: "applicable", note_ar: "الطول النهائي مباشرة." },
    { id: "gap", latex: "\\Delta L = L - L_0", relation: "dL = L - L0", status: "applicable", note_ar: "الزيادة = الطول الجديد − الأصلي." },
  ],
  misconceptions: [
    {
      id: "final-temperature",
      match: { symbol: "dL", value: expansion(ALPHA, L0, T2) },
      action: "hint",
      tier: "strategic",
      feedback_ar: "عوّضت بـ $60$… بس القانون محتاج $\\Delta T$: القضيب كان طوله $12\\,\\mathrm{m}$ عند $20^\\circ$ مش عند الصفر. التغير في درجة الحرارة كام؟",
    },
    {
      id: "final-temperature-relation",
      match: { relation: "dL = α*L0*T2" },
      action: "hint",
      tier: "strategic",
      feedback_ar: "القانون فيه التغير $\\Delta T$ مش درجة الحرارة النهائية. ليه؟ فكّر: لو $T_2 = T_1$ القضيب هيتمدد؟",
    },
  ],
  graph: {
    problem_id: "thermal_expansion_001",
    goal: "rail_gap",
    nodes: [
      { id: "known_L0", type: "known_quantity", label_ar: "L₀ = 12 m", produces: ["L0"] },
      { id: "known_alpha", type: "known_quantity", label_ar: "α = 1.2×10⁻⁵ K⁻¹", produces: ["α"] },
      { id: "known_T1", type: "known_quantity", label_ar: "T₁ = 20 °C", produces: ["T1"] },
      { id: "known_T2", type: "known_quantity", label_ar: "T₂ = 60 °C", produces: ["T2"] },
      { id: "assume_linear", type: "constraint", label_ar: "تمدد خطي" },
      { id: "temp_change", type: "equation_application", label_ar: "ΔT = T₂ − T₁", formula: "dT = T2 - T1", requires: ["T1", "T2"], hints: { strategic: "القانون محتاج التغير في درجة الحرارة، مش درجة حرارة واحدة." } },
      { id: "dT_value", type: "intermediate_value", label_ar: "ΔT = 40 K", produces: ["dT"], expected_quantity: "temperature" },
      { id: "linear_law", type: "equation_application", label_ar: "ΔL = αL₀ΔT", formula: "dL = α*L0*dT", requires: ["α", "L0", "dT"] },
      { id: "final_length_law", type: "equation_application", label_ar: "L = L₀(1 + αΔT)", formula: "L = L0*(1 + α*dT)", requires: ["L0", "α", "dT"] },
      { id: "L_value", type: "intermediate_value", label_ar: "L = 12.00576 m", produces: ["L"], expected_quantity: "length" },
      { id: "gap_from_length", type: "transformation", label_ar: "ΔL = L − L₀", formula: "dL = L - L0", requires: ["L", "L0"] },
      { id: "rail_gap", type: "goal", label_ar: "ΔL = 5.76 mm", produces: ["dL"], expected_quantity: "length", hints: { verification: "الرقم صغير جدًا بالمتر — حوّله لمليمتر وشوف هل منطقي لفراغ بين قضبان." } },
    ],
    edges: [
      { from: "known_T1", to: "temp_change", type: "dependency" },
      { from: "known_T2", to: "temp_change", type: "dependency" },
      { from: "temp_change", to: "dT_value", type: "derivation" },
      { from: "dT_value", to: "linear_law", type: "dependency" },
      { from: "known_alpha", to: "linear_law", type: "dependency" },
      { from: "known_L0", to: "linear_law", type: "dependency" },
      { from: "assume_linear", to: "linear_law", type: "dependency" },
      { from: "linear_law", to: "rail_gap", type: "substitution" },
      { from: "dT_value", to: "final_length_law", type: "dependency" },
      { from: "known_alpha", to: "final_length_law", type: "dependency" },
      { from: "known_L0", to: "final_length_law", type: "dependency" },
      { from: "final_length_law", to: "L_value", type: "derivation" },
      { from: "L_value", to: "gap_from_length", type: "dependency" },
      { from: "known_L0", to: "gap_from_length", type: "dependency" },
      { from: "gap_from_length", to: "rail_gap", type: "substitution" },
      { from: "linear_law", to: "final_length_law", type: "alternative" },
    ],
    paths: [
      ["temp_change", "dT_value", "linear_law", "rail_gap"],
      ["temp_change", "dT_value", "final_length_law", "L_value", "gap_from_length", "rail_gap"],
    ],
  },
  hints: {
    conceptual: "المواد بتتمدد لما تسخن، والتمدد بيتناسب مع حاجات معينة. إيه اللي بيأثر على قد إيه القضيب هيطول؟",
    strategic: "احسب التغير في درجة الحرارة الأول، وبعدين الزيادة في الطول.",
    procedural: "$\\Delta T = T_2 - T_1$، وبعدين $\\Delta L = \\alpha L_0 \\Delta T$.",
    verification: "اتأكد إن $\\Delta L$ موجبة (القضيب بيطول) وحوّلها لمليمتر عشان تحس بحجمها.",
  },
  checklist: WITH_INTERMEDIATE,
  paths: [
    {
      id: "expansion-law",
      title_ar: "قانون التمدد مباشرة",
      steps: [
        { latex: "\\Delta T = T_2 - T_1 = 60 - 20 = 40", operation: "substitute", target: "dT", unit: "K", explanation: "التغير في درجة الحرارة", inputs: [] },
        { latex: "\\Delta L = \\alpha L_0 \\Delta T", operation: "select_principle", target: "dL", explanation: "", inputs: [] },
        { latex: "\\Delta L = 1.2\\times10^{-5}\\times12\\times40 = 5.76\\times10^{-3}", operation: "substitute", target: "dL", unit: "m", explanation: "" },
        { latex: "\\Delta L = 5.76", operation: "compute", target: "dL", unit: "mm", explanation: "حوّلت لمليمتر" },
      ],
    },
    {
      id: "final-length",
      title_ar: "عن طريق الطول النهائي",
      steps: [
        { latex: "\\Delta T = T_2 - T_1 = 40", operation: "substitute", target: "dT", unit: "K", explanation: "", inputs: [] },
        { latex: "L = L_0(1 + \\alpha\\Delta T)", operation: "select_principle", target: "L", explanation: "", inputs: [] },
        { latex: "L = 12(1 + 1.2\\times10^{-5}\\times40) = 12.00576", operation: "substitute", target: "L", unit: "m", explanation: "" },
        { latex: "\\Delta L = L - L_0", operation: "select_principle", target: "dL", explanation: "", inputs: [] },
        { latex: "\\Delta L = 12.00576 - 12 = 0.00576", operation: "substitute", target: "dL", unit: "m", explanation: "" },
      ],
    },
  ],
  recoverableErrors: [
    {
      id: "final-temperature",
      title_ar: "استخدم درجة الحرارة النهائية بدل التغير",
      steps: [
        { latex: "\\Delta L = \\alpha L_0 \\Delta T", operation: "select_principle", target: "dL", explanation: "", inputs: [] },
        { latex: "\\Delta L = 1.2\\times10^{-5}\\times12\\times60 = 8.64\\times10^{-3}", operation: "substitute", target: "dL", unit: "m", explanation: "عوّضت بدرجة الحرارة" },
      ],
      expected: { mathematical: "pass", physical: "fail", action: "hint" },
    },
  ],
  experimentHref: "/phenomena/thermal-expansion",
  demo: {
    steps: [
      { latex: "\\Delta L = \\alpha L_0 \\Delta T", operation: "select_principle", target: "dL", explanation: "", inputs: [] },
      { latex: "\\Delta L = 1.2\\times10^{-5}\\times12\\times60 = 8.64\\times10^{-3}", operation: "substitute", target: "dL", unit: "m", explanation: "" },
    ],
    fixIndex: 1,
    fix: { latex: "\\Delta L = 1.2\\times10^{-5}\\times12\\times(60-20) = 5.76\\times10^{-3}", operation: "substitute", target: "dL", unit: "m", explanation: "ΔT = 40" },
    after: [{ latex: "\\Delta L = 5.76", operation: "compute", target: "dL", unit: "mm", explanation: "بالمليمتر" }],
  },
};
