import type { WorkbenchProblem } from "../types";
import { STANDARD_CHECKLIST } from "./checklist";

/** Canonical Workbench mission: two authored routes to the stopping distance. */
export const brakingWorkbench: WorkbenchProblem = {
  id: "braking_001",
  title: "مسافة الفرملة",
  subject: "mechanics",
  scenario: "عربية ماشية بسرعة $u = 20\\,\\mathrm{m/s}$، والسواق داس فرامل فبقت تبطّأ بعجلة ثابتة $a = -5\\,\\mathrm{m/s^2}$ لحد ما وقفت قبل عائق.",
  ask: "احسب مسافة التوقف $s$.",
  symbols: {
    u: { label_ar: "السرعة الابتدائية", tex: "u", unit: "m/s", domain: [-40, 40], altUnits: ["km/h"] },
    v: { label_ar: "السرعة النهائية", tex: "v", unit: "m/s", domain: [-40, 40] },
    a: { label_ar: "العجلة", tex: "a", unit: "m/s^2", domain: [-10, -0.5], sign: "negative" },
    t: { label_ar: "الزمن", tex: "t", unit: "s", domain: [-20, 20], sign: "positive" },
    s: { label_ar: "الإزاحة", tex: "s", unit: "m", domain: [-300, 300], sign: "nonnegative" },
  },
  knowns: { u: 20, v: 0, a: -5 },
  truth: { u: 20, v: 0, a: -5, t: 4, s: 40 },
  goal: "s",
  assumptions: [
    { id: "const_acc", label_ar: "العجلة ثابتة طول الفرملة، و $a \\ne 0$" },
    { id: "straight", label_ar: "الحركة في خط مستقيم، والاتجاه الموجب هو اتجاه الحركة" },
  ],
  model: { free: { u: [5, 40], a: [-10, -1], t: [0.5, 8] }, derived: { v: "u + a*t", s: "u*t + a*t^2/2" } },
  principles: [
    { id: "v_u_at", latex: "v = u + at", relation: "v = u + a*t", status: "applicable", note_ar: "معادلة الحركة الأولى: مناسبة لأن العجلة ثابتة." },
    { id: "v2_u2_2as", latex: "v^2 = u^2 + 2as", relation: "v^2 = u^2 + 2*a*s", status: "applicable", note_ar: "معادلة الحركة التالتة: بتربط السرعات بالإزاحة من غير زمن — مناسبة لأن العجلة ثابتة." },
    { id: "s_ut_half_at2", latex: "s = ut + \\tfrac12 at^2", relation: "s = u*t + a*t^2/2", status: "applicable", note_ar: "معادلة الحركة التانية: محتاجة الزمن، والعجلة ثابتة." },
    { id: "s_ut", latex: "s = ut", relation: "s = u*t", status: "inapplicable", note_ar: "$s = ut$ قانون السرعة الثابتة، بس العربية بتبطّأ. هل السرعة فضلت $20\\,\\mathrm{m/s}$ طول الوقت؟" },
    { id: "s_vt", latex: "s = vt", relation: "s = v*t", status: "inapplicable", note_ar: "$s = vt$ بيفترض إن السرعة ثابتة. السرعة هنا بتتغير من $20$ لـ $0$." },
  ],
  misconceptions: [
    {
      id: "constant-speed-distance",
      match: { symbol: "s", value: 80 },
      action: "experiment",
      feedback_ar: "$80\\,\\mathrm{m}$ هي المسافة لو العربية فضلت بسرعة $20\\,\\mathrm{m/s}$ طول الـ $4\\,\\mathrm{s}$. شغّل المحاكاة: العربية بتقطع نفس المسافة كل ثانية وهي بتفرمل؟",
    },
    {
      id: "forgot-squares",
      match: { relation: "s = (v - u)/(2*a)" },
      action: "hint",
      tier: "verification",
      feedback_ar: "قارن وحدات الطرفين: $\\frac{\\mathrm{m/s}}{\\mathrm{m/s^2}}$ بتطلع ثواني مش متر. السرعات في القانون الأصلي متربّعة؟",
    },
  ],
  graph: {
    problem_id: "braking_001",
    goal: "stopping_distance",
    nodes: [
      { id: "known_u", type: "known_quantity", label_ar: "u = 20 m/s", produces: ["u"] },
      { id: "known_v", type: "known_quantity", label_ar: "v = 0 (وقفت)", produces: ["v"] },
      { id: "known_a", type: "known_quantity", label_ar: "a = −5 m/s²", produces: ["a"] },
      { id: "assume_const_acc", type: "constraint", label_ar: "عجلة ثابتة" },
      {
        id: "distance_direct",
        type: "equation_application",
        label_ar: "v² = u² + 2as",
        formula: "v^2 = u^2 + 2*a*s",
        requires: ["u", "v", "a"],
        hints: { strategic: "عندك $u$ و $v$ و $a$ ومش محتاج الزمن. فيه معادلة حركة بتربطهم بـ $s$ من غير $t$؟" },
      },
      {
        id: "isolate_s",
        type: "transformation",
        label_ar: "s = (v² − u²)/2a",
        formula: "s = (v^2 - u^2)/(2*a)",
        requires: [],
        hints: { procedural: "اطرح $u^2$ من الطرفين، وبعدين اقسم على $2a$." },
      },
      {
        id: "find_time",
        type: "intermediate_goal",
        label_ar: "زمن التوقف: v = u + at",
        formula: "v = u + a*t",
        requires: ["u", "v", "a"],
        produces: ["t"],
        hints: { strategic: "لو هتمشي بالزمن: إيه المعادلة اللي فيها $v$ و $u$ و $a$ و $t$ بس؟" },
      },
      { id: "t_value", type: "intermediate_value", label_ar: "t = 4 s", produces: ["t"], expected_quantity: "time", hints: { procedural: "اعزل $t$: $t = \\frac{v - u}{a}$ وعوّض." } },
      {
        id: "distance_from_time",
        type: "equation_application",
        label_ar: "s = ut + ½at²",
        formula: "s = u*t + a*t^2/2",
        requires: ["t", "u", "a"],
        hints: { strategic: "معاك الزمن دلوقتي. أي معادلة بتدّي الإزاحة من $u$ و $a$ و $t$؟" },
      },
      { id: "final_distance", type: "goal", label_ar: "s = 40 m", produces: ["s"], expected_quantity: "length", hints: { verification: "عوّض بـ $s$ في $v^2 = u^2 + 2as$: الطرفين متساويين؟ والإشارة منطقية؟" } },
    ],
    edges: [
      { from: "known_u", to: "distance_direct", type: "dependency" },
      { from: "known_v", to: "distance_direct", type: "dependency" },
      { from: "known_a", to: "distance_direct", type: "dependency" },
      { from: "assume_const_acc", to: "distance_direct", type: "dependency" },
      { from: "distance_direct", to: "isolate_s", type: "derivation" },
      { from: "isolate_s", to: "final_distance", type: "substitution" },
      { from: "known_u", to: "find_time", type: "dependency" },
      { from: "known_v", to: "find_time", type: "dependency" },
      { from: "known_a", to: "find_time", type: "dependency" },
      { from: "assume_const_acc", to: "find_time", type: "dependency" },
      { from: "find_time", to: "t_value", type: "derivation" },
      { from: "t_value", to: "distance_from_time", type: "dependency" },
      { from: "known_u", to: "distance_from_time", type: "dependency" },
      { from: "known_a", to: "distance_from_time", type: "dependency" },
      { from: "distance_from_time", to: "final_distance", type: "substitution" },
      { from: "distance_direct", to: "find_time", type: "alternative" },
    ],
    paths: [
      ["distance_direct", "isolate_s", "final_distance"],
      ["find_time", "t_value", "distance_from_time", "final_distance"],
    ],
  },
  hints: {
    conceptual: "العربية بتبطّأ بمعدل ثابت لحد ما تقف. إيه الكميات اللي عارفها عن بداية ونهاية الحركة؟",
    strategic: "عندك $u$ و $v$ و $a$. ممكن تلاقي الإزاحة مباشرة من غير زمن، أو تحسب زمن التوقف الأول.",
    procedural: "اعزل الكمية المطلوبة جبريًا قبل ما تعوّض بأرقام.",
    verification: "راجع الإشارات: العربية بتبطّأ، يبقى $a$ سالبة، والمسافة لازم تطلع موجبة. وراجع الوحدات.",
  },
  checklist: STANDARD_CHECKLIST,
  paths: [
    {
      id: "without-time",
      title_ar: "بدون الزمن",
      steps: [
        { latex: "v^2 = u^2 + 2as", operation: "select_principle", target: "s", explanation: "اخترت معادلة الحركة اللي مافيهاش زمن", inputs: [] },
        { latex: "s = \\frac{v^2-u^2}{2a}", operation: "isolate_variable", target: "s", explanation: "عزلت المسافة" },
        { latex: "s = \\frac{0^2-20^2}{2(-5)} = 40", operation: "substitute", target: "s", unit: "m", explanation: "عوّضت بالقيم" },
        { latex: "0^2 = 20^2 + 2(-5)(40)", operation: "verify", target: "s", explanation: "تحققت بالتعويض العكسي" },
      ],
    },
    {
      id: "using-time",
      title_ar: "باستخدام الزمن",
      steps: [
        { latex: "v = u + at", operation: "select_principle", target: "t", explanation: "هحسب زمن التوقف الأول", inputs: [] },
        { latex: "t = \\frac{v-u}{a} = \\frac{0-20}{-5} = 4", operation: "isolate_variable", target: "t", unit: "s", explanation: "عزلت الزمن وعوّضت" },
        { latex: "s = ut + \\frac{1}{2}at^2", operation: "select_principle", target: "s", explanation: "معادلة الإزاحة بدلالة الزمن", inputs: [] },
        { latex: "s = 20(4) + \\frac{1}{2}(-5)(4)^2 = 40", operation: "substitute", target: "s", unit: "m", explanation: "عوّضت بالزمن اللي حسبته" },
        { latex: "0^2 = 20^2 + 2(-5)(40)", operation: "verify", target: "s", explanation: "تحققت بمعادلة تانية" },
      ],
    },
  ],
  recoverableErrors: [
    {
      id: "sign-error",
      title_ar: "نسي إن العجلة سالبة",
      steps: [
        { latex: "v^2 = u^2 + 2as", operation: "select_principle", target: "s", explanation: "", inputs: [] },
        { latex: "s = \\frac{v^2-u^2}{2a}", operation: "isolate_variable", target: "s", explanation: "" },
        { latex: "s = \\frac{0^2-20^2}{2(5)} = -40", operation: "substitute", target: "s", unit: "m", explanation: "عوّضت بالعجلة 5" },
      ],
      expected: { mathematical: "pass", physical: "fail", action: "hint" },
    },
    {
      id: "constant-speed-model",
      title_ar: "استخدم قانون السرعة الثابتة",
      steps: [{ latex: "s = ut", operation: "select_principle", target: "s", explanation: "المسافة = السرعة × الزمن", inputs: [] }],
      expected: { mathematical: "pass", physical: "fail", action: "experiment" },
    },
    {
      id: "forgot-squares",
      title_ar: "نسي تربيع السرعات",
      steps: [
        { latex: "v^2 = u^2 + 2as", operation: "select_principle", target: "s", explanation: "", inputs: [] },
        { latex: "s = \\frac{v-u}{2a}", operation: "isolate_variable", target: "s", explanation: "عزلت s" },
      ],
      expected: { mathematical: "fail", physical: "fail", action: "hint" },
    },
  ],
  experimentHref: "/learn/braking",
  demo: {
    steps: [
      { latex: "v = u + at", operation: "select_principle", target: "t", explanation: "هحسب زمن التوقف", inputs: [] },
      { latex: "t = \\frac{v-u}{a} = \\frac{0-20}{-5} = 4", operation: "isolate_variable", target: "t", unit: "s", explanation: "" },
      { latex: "s = ut + \\frac{1}{2}at^2", operation: "select_principle", target: "s", explanation: "", inputs: [] },
      { latex: "s = 20(4) + \\frac{1}{2}(5)(4)^2 = 120", operation: "substitute", target: "s", unit: "m", explanation: "عوّضت بالعجلة" },
    ],
    fixIndex: 3,
    fix: { latex: "s = 20(4) + \\frac{1}{2}(-5)(4)^2 = 40", operation: "substitute", target: "s", unit: "m", explanation: "العجلة سالبة لأنها بتبطّأ" },
    after: [{ latex: "0^2 = 20^2 + 2(-5)(40)", operation: "verify", target: "s", explanation: "تحقق بمعادلة تانية" }],
  },
};

/** A valid route the teacher did not author: average velocity × time. */
export const BRAKING_UNANTICIPATED = [
  { latex: "v = u + at", operation: "select_principle" as const, target: "t", explanation: "", inputs: [] },
  { latex: "t = \\frac{v-u}{a} = \\frac{0-20}{-5} = 4", operation: "isolate_variable" as const, target: "t", unit: "s", explanation: "" },
  { latex: "s = \\frac{u+v}{2}t", operation: "select_principle" as const, target: "s", explanation: "المسافة = متوسط السرعة × الزمن", inputs: [] },
  { latex: "s = \\frac{20+0}{2}(4) = 40", operation: "substitute" as const, target: "s", unit: "m", explanation: "" },
];
