import type { WorkbenchProblem } from "../types";
import { WITH_INTERMEDIATE } from "./checklist";

const F = 50;
const M = 10;
const MU = 0.2;
const G = 9.8;
const FR = MU * M * G;

/** "F = ma is valid — but not a license to ignore friction." */
export const frictionWorkbench: WorkbenchProblem = {
  id: "newton_friction_001",
  title: "صندوق بيتسحب على أرض خشنة",
  subject: "mechanics",
  scenario: "عامل بيسحب صندوق كتلته $m = 10\\,\\mathrm{kg}$ بقوة أفقية $F = 50\\,\\mathrm{N}$ على أرض معامل احتكاكها الحركي $\\mu = 0.2$. اعتبر $g = 9.8\\,\\mathrm{m/s^2}$.",
  ask: "احسب عجلة الصندوق $a$.",
  symbols: {
    F: { label_ar: "قوة الشد", tex: "F", unit: "N", domain: [-200, 200] },
    m: { label_ar: "الكتلة", tex: "m", unit: "kg", domain: [0.5, 50], sign: "positive" },
    μ: { label_ar: "معامل الاحتكاك", tex: "\\mu", unit: "", domain: [0.01, 1], sign: "positive" },
    g: { label_ar: "عجلة الجاذبية", tex: "g", unit: "m/s^2", domain: [1, 20], sign: "positive" },
    f: { label_ar: "قوة الاحتكاك", tex: "f", unit: "N", domain: [-200, 200], sign: "positive" },
    a: { label_ar: "العجلة", tex: "a", unit: "m/s^2", domain: [-50, 50] },
  },
  knowns: { F, m: M, μ: MU, g: G },
  truth: { F, m: M, μ: MU, g: G, f: FR, a: (F - FR) / M },
  goal: "a",
  assumptions: [
    { id: "horizontal", label_ar: "الأرض أفقية، فرد الفعل العمودي $= mg$" },
    { id: "kinetic", label_ar: "الصندوق بيتحرك (احتكاك حركي)" },
  ],
  model: { free: { F: [20, 200], m: [1, 40], μ: [0.05, 0.4], g: [G, G] }, derived: { f: "μ * m * g", a: "(F - f) / m" } },
  principles: [
    {
      id: "newton-naive",
      latex: "F = ma",
      relation: "F = m * a",
      status: "incomplete",
      note_ar: "$F = ma$ صحيحة رياضيًا تحت افتراضات نيوتن — بس $F$ فيها هي القوة المحصلة. المسألة فيها احتكاك، فهل $50\\,\\mathrm{N}$ هي المحصلة فعلًا؟",
    },
    { id: "newton-net", latex: "F - f = ma", relation: "F - f = m * a", status: "applicable", note_ar: "قانون نيوتن التاني بالقوة المحصلة." },
    { id: "friction", latex: "f = \\mu m g", relation: "f = μ * m * g", status: "applicable", note_ar: "الاحتكاك الحركي على أرض أفقية." },
    { id: "newton-full", latex: "F - \\mu mg = ma", relation: "F - μ*m*g = m*a", status: "applicable", note_ar: "نيوتن التاني بعد التعويض عن الاحتكاك." },
  ],
  misconceptions: [
    {
      id: "no-friction-value",
      match: { symbol: "a", value: F / M },
      action: "clarify",
      feedback_ar: "$5\\,\\mathrm{m/s^2}$ هي العجلة لو الأرض ناعمة خالص. المسألة قالت فيه احتكاك — هيأثر على العجلة إزاي؟",
    },
  ],
  graph: {
    problem_id: "newton_friction_001",
    goal: "acceleration",
    nodes: [
      { id: "known_F", type: "known_quantity", label_ar: "F = 50 N", produces: ["F"] },
      { id: "known_m", type: "known_quantity", label_ar: "m = 10 kg", produces: ["m"] },
      { id: "known_mu", type: "known_quantity", label_ar: "μ = 0.2", produces: ["μ"] },
      { id: "known_g", type: "known_quantity", label_ar: "g = 9.8", produces: ["g"] },
      { id: "assume_friction", type: "constraint", label_ar: "فيه احتكاك حركي" },
      { id: "friction_force", type: "equation_application", label_ar: "f = μmg", formula: "f = μ * m * g", requires: ["μ", "m", "g"] },
      { id: "f_value", type: "intermediate_value", label_ar: "f = 19.6 N", produces: ["f"], expected_quantity: "force" },
      { id: "newton_net", type: "equation_application", label_ar: "F − f = ma", formula: "F - f = m * a", requires: ["F", "f", "m"] },
      { id: "newton_direct", type: "transformation", label_ar: "a = F/m − μg", formula: "a = F/m - μ*g", requires: ["F", "m", "μ", "g"] },
      { id: "final_a", type: "goal", label_ar: "a = 3.04 m/s²", produces: ["a"], expected_quantity: "acceleration" },
    ],
    edges: [
      { from: "known_mu", to: "friction_force", type: "dependency" },
      { from: "known_m", to: "friction_force", type: "dependency" },
      { from: "known_g", to: "friction_force", type: "dependency" },
      { from: "assume_friction", to: "friction_force", type: "dependency" },
      { from: "friction_force", to: "f_value", type: "derivation" },
      { from: "f_value", to: "newton_net", type: "dependency" },
      { from: "known_F", to: "newton_net", type: "dependency" },
      { from: "known_m", to: "newton_net", type: "dependency" },
      { from: "newton_net", to: "final_a", type: "substitution" },
      { from: "known_F", to: "newton_direct", type: "dependency" },
      { from: "known_mu", to: "newton_direct", type: "dependency" },
      { from: "newton_direct", to: "final_a", type: "substitution" },
      { from: "newton_net", to: "newton_direct", type: "alternative" },
    ],
    paths: [
      ["friction_force", "f_value", "newton_net", "final_a"],
      ["newton_direct", "final_a"],
    ],
  },
  hints: {
    conceptual: "إيه كل القوى الأفقية اللي على الصندوق؟ ارسمها.",
    strategic: "احسب قوة الاحتكاك الأول، وبعدين القوة المحصلة.",
    procedural: "$f = \\mu mg$ ثم $F - f = ma$ واعزل $a$.",
    verification: "العجلة لازم تطلع أقل من $\\frac{F}{m} = 5\\,\\mathrm{m/s^2}$ — ليه؟",
  },
  checklist: WITH_INTERMEDIATE,
  paths: [
    {
      id: "net-force",
      title_ar: "الاحتكاك ثم المحصلة",
      steps: [
        { latex: "f = \\mu mg = 0.2\\times10\\times9.8 = 19.6", operation: "substitute", target: "f", unit: "N", explanation: "", inputs: [] },
        { latex: "F - f = ma", operation: "select_principle", target: "a", explanation: "", inputs: [] },
        { latex: "a = \\frac{F - f}{m} = \\frac{50 - 19.6}{10} = 3.04", operation: "isolate_variable", target: "a", unit: "m/s^2", explanation: "" },
      ],
    },
    {
      id: "direct",
      title_ar: "معادلة واحدة",
      steps: [
        { latex: "a = \\frac{F}{m} - \\mu g", operation: "select_principle", target: "a", explanation: "", inputs: [] },
        { latex: "a = \\frac{50}{10} - 0.2\\times9.8 = 3.04", operation: "substitute", target: "a", unit: "m/s^2", explanation: "" },
      ],
    },
  ],
  recoverableErrors: [
    {
      id: "ignore-friction",
      title_ar: "F = ma والاحتكاك اتنسى",
      steps: [{ latex: "F = ma", operation: "select_principle", target: "a", explanation: "قانون نيوتن التاني", inputs: [] }],
      expected: { mathematical: "pass", physical: "warn", action: "clarify" },
    },
  ],
  experimentHref: "/learn/newton",
  demo: {
    steps: [{ latex: "F = ma", operation: "select_principle", target: "a", explanation: "نيوتن التاني", inputs: [] }],
    fixIndex: 0,
    fix: { latex: "F - \\mu mg = ma", operation: "select_principle", target: "a", explanation: "المحصلة = الشد − الاحتكاك", inputs: [] },
    after: [{ latex: "a = \\frac{50 - 0.2(10)(9.8)}{10} = 3.04", operation: "substitute", target: "a", unit: "m/s^2", explanation: "" }],
  },
};
