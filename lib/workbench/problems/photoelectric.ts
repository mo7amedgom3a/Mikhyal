import { CONST, photoKmax, thresholdFrequency } from "@/lib/physics/phenomena";
import type { WorkbenchProblem } from "../types";
import { WITH_INTERMEDIATE } from "./checklist";

const PHI_EV = 2.28;
const PHI = PHI_EV * CONST.e;
const LAMBDA = 400e-9;
const F = CONST.c / LAMBDA;
const E = CONST.h * F;

export const photoelectricWorkbench: WorkbenchProblem = {
  id: "photoelectric_001",
  title: "التأثير الكهروضوئي: أقصى طاقة حركة",
  subject: "electromagnetic",
  scenario:
    "ضوء بنفسجي طوله الموجي $\\lambda = 400\\,\\mathrm{nm}$ وقع على سطح صوديوم دالة شغله $\\phi = 2.28\\,\\mathrm{eV}$. اعتبر $h = 6.63\\times10^{-34}\\,\\mathrm{J\\,s}$ و $c = 3\\times10^{8}\\,\\mathrm{m/s}$ و $1\\,\\mathrm{eV} = 1.6\\times10^{-19}\\,\\mathrm{J}$.",
  ask: "احسب أقصى طاقة حركة $K_{max}$ للإلكترونات المتحررة.",
  symbols: {
    h: { label_ar: "ثابت بلانك", tex: "h", unit: "J s", domain: [3e-34, 1.3e-33] },
    c: { label_ar: "سرعة الضوء", tex: "c", unit: "m/s", domain: [1e8, 5e8] },
    λ: { label_ar: "الطول الموجي", tex: "\\lambda", unit: "m", domain: [1e-7, 1e-6], sign: "positive", altUnits: ["nm"] },
    f: { label_ar: "التردد", tex: "f", unit: "Hz", domain: [1e14, 3e15], sign: "positive" },
    f0: { label_ar: "التردد الحرج", tex: "f_0", unit: "Hz", domain: [1e14, 3e15], sign: "positive" },
    E: { label_ar: "طاقة الفوتون", tex: "E", unit: "J", domain: [1e-19, 2e-18], sign: "positive", altUnits: ["eV"] },
    φ: { label_ar: "دالة الشغل", tex: "\\phi", unit: "J", domain: [1e-19, 1e-18], sign: "positive", altUnits: ["eV"] },
    Kmax: { label_ar: "أقصى طاقة حركة", tex: "K_{max}", unit: "J", domain: [-1e-18, 1e-18], sign: "nonnegative", altUnits: ["eV"] },
  },
  knowns: { h: CONST.h, c: CONST.c, λ: LAMBDA, φ: PHI },
  truth: { h: CONST.h, c: CONST.c, λ: LAMBDA, φ: PHI, f: F, E, Kmax: photoKmax(LAMBDA, PHI), f0: thresholdFrequency(PHI) },
  goal: "Kmax",
  assumptions: [
    { id: "one-photon", label_ar: "كل فوتون بيتفاعل مع إلكترون واحد بس" },
    { id: "surface", label_ar: "$K_{max}$ لإلكترونات السطح (أقل طاقة ربط = $\\phi$)" },
  ],
  model: {
    free: { h: [CONST.h, CONST.h], c: [CONST.c, CONST.c], λ: [2e-7, 5e-7], φ: [2e-19, 3.8e-19] },
    derived: { f: "c / λ", E: "h * f", Kmax: "E - φ", f0: "φ / h" },
  },
  principles: [
    { id: "wave", latex: "c = f\\lambda", relation: "f = c / λ", status: "applicable", note_ar: "علاقة الموجة: بتحوّل الطول الموجي لتردد." },
    { id: "planck", latex: "E = hf", relation: "E = h * f", status: "applicable", note_ar: "طاقة الفوتون (بلانك/أينشتاين)." },
    { id: "einstein", latex: "K_{max} = hf - \\phi", relation: "Kmax = h*f - φ", status: "applicable", note_ar: "معادلة أينشتاين الكهروضوئية (1905)." },
    { id: "einstein-E", latex: "K_{max} = E - \\phi", relation: "Kmax = E - φ", status: "applicable", note_ar: "حفظ الطاقة: طاقة الفوتون = دالة الشغل + طاقة الحركة." },
    { id: "threshold", latex: "\\phi = hf_0", relation: "φ = h * f0", status: "applicable", note_ar: "دالة الشغل بدلالة التردد الحرج." },
    { id: "einstein-f0", latex: "K_{max} = h(f - f_0)", relation: "Kmax = h*(f - f0)", status: "applicable", note_ar: "صيغة أينشتاين بدلالة التردد الحرج." },
    {
      id: "all-energy",
      latex: "K_{max} = hf",
      relation: "Kmax = h*f",
      status: "incomplete",
      note_ar: "صح إن الفوتون بيدّي طاقته $hf$ للإلكترون، بس الإلكترون بيصرف جزء منها عشان يفلت من السطح. فين دالة الشغل؟",
    },
  ],
  misconceptions: [],
  graph: {
    problem_id: "photoelectric_001",
    goal: "max_kinetic_energy",
    nodes: [
      { id: "known_h", type: "known_quantity", label_ar: "h", produces: ["h"] },
      { id: "known_c", type: "known_quantity", label_ar: "c", produces: ["c"] },
      { id: "known_lambda", type: "known_quantity", label_ar: "λ = 400 nm", produces: ["λ"] },
      { id: "known_phi", type: "known_quantity", label_ar: "φ = 2.28 eV", produces: ["φ"] },
      { id: "assume_single_photon", type: "constraint", label_ar: "فوتون واحد ↔ إلكترون واحد" },
      { id: "frequency", type: "equation_application", label_ar: "f = c/λ", formula: "f = c / λ", requires: ["c", "λ"], hints: { strategic: "القوانين محتاجة التردد، والمعطى طول موجي. إيه اللي بيربطهم؟" } },
      { id: "f_value", type: "intermediate_value", label_ar: "f = 7.5×10¹⁴ Hz", produces: ["f"], expected_quantity: "frequency", hints: { verification: "حوّل $400\\,\\mathrm{nm}$ لمتر قبل القسمة: $400\\times10^{-9}\\,\\mathrm{m}$." } },
      { id: "photon_energy", type: "equation_application", label_ar: "E = hf", formula: "E = h * f", requires: ["h", "f"] },
      { id: "E_value", type: "intermediate_value", label_ar: "E ≈ 3.10 eV", produces: ["E"], expected_quantity: "energy" },
      {
        id: "einstein_balance",
        type: "equation_application",
        label_ar: "K = E − φ",
        formula: "Kmax = E - φ",
        requires: ["E", "φ"],
        hints: { strategic: "الفوتون بيدفع حاجتين: تمن الخروج من السطح، والباقي طاقة حركة." },
      },
      { id: "threshold", type: "equation_application", label_ar: "φ = hf₀", formula: "φ = h * f0", requires: ["φ", "h"], produces: ["f0"] },
      { id: "f0_value", type: "intermediate_value", label_ar: "f₀ ≈ 5.5×10¹⁴ Hz", produces: ["f0"], expected_quantity: "frequency" },
      {
        id: "einstein_threshold",
        type: "equation_application",
        label_ar: "K = h(f − f₀)",
        formula: "Kmax = h*(f - f0)",
        requires: ["h", "f", "f0"],
      },
      { id: "final_K", type: "goal", label_ar: "K ≈ 0.82 eV", produces: ["Kmax"], expected_quantity: "energy", hints: { verification: "طاقة الحركة مايصحش تطلع سالبة. ووحّد الوحدات: كله جول أو كله إلكترون فولت." } },
    ],
    edges: [
      { from: "known_c", to: "frequency", type: "dependency" },
      { from: "known_lambda", to: "frequency", type: "dependency" },
      { from: "frequency", to: "f_value", type: "derivation" },
      { from: "known_h", to: "photon_energy", type: "dependency" },
      { from: "f_value", to: "photon_energy", type: "dependency" },
      { from: "photon_energy", to: "E_value", type: "derivation" },
      { from: "E_value", to: "einstein_balance", type: "dependency" },
      { from: "known_phi", to: "einstein_balance", type: "dependency" },
      { from: "assume_single_photon", to: "einstein_balance", type: "dependency" },
      { from: "einstein_balance", to: "final_K", type: "substitution" },
      { from: "known_phi", to: "threshold", type: "dependency" },
      { from: "known_h", to: "threshold", type: "dependency" },
      { from: "threshold", to: "f0_value", type: "derivation" },
      { from: "f0_value", to: "einstein_threshold", type: "dependency" },
      { from: "f_value", to: "einstein_threshold", type: "dependency" },
      { from: "known_h", to: "einstein_threshold", type: "dependency" },
      { from: "einstein_threshold", to: "final_K", type: "substitution" },
      { from: "photon_energy", to: "threshold", type: "alternative" },
    ],
    paths: [
      ["frequency", "f_value", "photon_energy", "E_value", "einstein_balance", "final_K"],
      ["threshold", "f0_value", "frequency", "f_value", "einstein_threshold", "final_K"],
    ],
  },
  hints: {
    conceptual: "الضوء بيتعامل مع الإلكترون على هيئة كمّات (فوتونات). الطاقة اللي بيجيبها الفوتون بتتوزع على إيه؟",
    strategic: "احسب طاقة الفوتون الأول (محتاج التردد)، وبعدين قارنها بدالة الشغل.",
    procedural: "$f = \\frac{c}{\\lambda}$ ثم $E = hf$ ثم $K_{max} = E - \\phi$ — عوّض بعد ما توحّد الوحدات.",
    verification: "راجع: كل الطاقات بنفس الوحدة؟ $1\\,\\mathrm{eV} = 1.6\\times10^{-19}\\,\\mathrm{J}$. و $K_{max} \\ge 0$.",
  },
  checklist: WITH_INTERMEDIATE,
  paths: [
    {
      id: "joules",
      title_ar: "بالجول (طاقة الفوتون أولًا)",
      steps: [
        { latex: "f = \\frac{c}{\\lambda}", operation: "select_principle", target: "f", explanation: "حوّلت الطول الموجي لتردد", inputs: [] },
        { latex: "f = \\frac{3\\times10^{8}}{400\\times10^{-9}} = 7.5\\times10^{14}", operation: "substitute", target: "f", unit: "Hz", explanation: "" },
        { latex: "E = hf", operation: "select_principle", target: "E", explanation: "طاقة الفوتون", inputs: [] },
        { latex: "E = 6.63\\times10^{-34}\\times7.5\\times10^{14} = 4.97\\times10^{-19}", operation: "substitute", target: "E", unit: "J", explanation: "" },
        { latex: "K_{max} = E - \\phi", operation: "select_principle", target: "Kmax", explanation: "حفظ الطاقة", inputs: [] },
        { latex: "K_{max} = 4.97\\times10^{-19} - 2.28\\times1.6\\times10^{-19} = 1.32\\times10^{-19}", operation: "substitute", target: "Kmax", unit: "J", explanation: "حوّلت φ لجول" },
      ],
    },
    {
      id: "electronvolts",
      title_ar: "بالإلكترون فولت",
      steps: [
        { latex: "f = \\frac{c}{\\lambda} = \\frac{3\\times10^{8}}{4\\times10^{-7}} = 7.5\\times10^{14}", operation: "substitute", target: "f", unit: "Hz", explanation: "", inputs: [] },
        { latex: "E = hf", operation: "select_principle", target: "E", explanation: "", inputs: [] },
        { latex: "E = \\frac{6.63\\times10^{-34}\\times7.5\\times10^{14}}{1.6\\times10^{-19}} = 3.11", operation: "substitute", target: "E", unit: "eV", explanation: "حوّلت لإلكترون فولت" },
        { latex: "K_{max} = E - \\phi", operation: "select_principle", target: "Kmax", explanation: "", inputs: [] },
        { latex: "K_{max} = 3.11 - 2.28 = 0.83", operation: "substitute", target: "Kmax", unit: "eV", explanation: "كله بالإلكترون فولت" },
      ],
    },
    {
      id: "threshold",
      title_ar: "بالتردد الحرج",
      steps: [
        { latex: "\\phi = hf_0", operation: "select_principle", target: "f0", explanation: "", inputs: [] },
        { latex: "f_0 = \\frac{\\phi}{h} = \\frac{2.28\\times1.6\\times10^{-19}}{6.63\\times10^{-34}} = 5.5\\times10^{14}", operation: "isolate_variable", target: "f0", unit: "Hz", explanation: "" },
        { latex: "f = \\frac{c}{\\lambda} = \\frac{3\\times10^{8}}{4\\times10^{-7}} = 7.5\\times10^{14}", operation: "substitute", target: "f", unit: "Hz", explanation: "", inputs: [] },
        { latex: "K_{max} = h(f - f_0)", operation: "select_principle", target: "Kmax", explanation: "", inputs: [] },
        { latex: "K_{max} = 6.63\\times10^{-34}(7.5\\times10^{14} - 5.5\\times10^{14}) = 1.33\\times10^{-19}", operation: "substitute", target: "Kmax", unit: "J", explanation: "" },
      ],
    },
  ],
  recoverableErrors: [
    {
      id: "mixed-units",
      title_ar: "طرح إلكترون فولت من جول",
      steps: [
        { latex: "E = hf", operation: "select_principle", target: "E", explanation: "", inputs: [] },
        { latex: "E = 6.63\\times10^{-34}\\times7.5\\times10^{14} = 4.97\\times10^{-19}", operation: "substitute", target: "E", unit: "J", explanation: "" },
        { latex: "K_{max} = E - \\phi", operation: "select_principle", target: "Kmax", explanation: "", inputs: [] },
        { latex: "K_{max} = 4.97\\times10^{-19} - 2.28 = -2.28", operation: "substitute", target: "Kmax", unit: "J", explanation: "طرحت دالة الشغل" },
      ],
      expected: { mathematical: "pass", physical: "fail", action: "hint" },
    },
    {
      id: "ignore-work-function",
      title_ar: "نسي دالة الشغل",
      steps: [{ latex: "K_{max} = hf", operation: "select_principle", target: "Kmax", explanation: "الفوتون بيدّي طاقته للإلكترون", inputs: [] }],
      expected: { mathematical: "pass", physical: "warn", action: "clarify" },
    },
  ],
  experimentHref: "/phenomena/photoelectric",
  demo: {
    steps: [
      { latex: "f = \\frac{c}{\\lambda} = \\frac{3\\times10^{8}}{4\\times10^{-7}} = 7.5\\times10^{14}", operation: "substitute", target: "f", unit: "Hz", explanation: "", inputs: [] },
      { latex: "E = hf", operation: "select_principle", target: "E", explanation: "", inputs: [] },
      { latex: "E = 6.63\\times10^{-34}\\times7.5\\times10^{14} = 4.97\\times10^{-19}", operation: "substitute", target: "E", unit: "J", explanation: "" },
      { latex: "K_{max} = E - \\phi", operation: "select_principle", target: "Kmax", explanation: "", inputs: [] },
      { latex: "K_{max} = 4.97\\times10^{-19} - 2.28 = -2.28", operation: "substitute", target: "Kmax", unit: "J", explanation: "" },
    ],
    fixIndex: 4,
    fix: { latex: "K_{max} = 4.97\\times10^{-19} - 2.28\\times1.6\\times10^{-19} = 1.32\\times10^{-19}", operation: "substitute", target: "Kmax", unit: "J", explanation: "حوّلت φ لجول الأول" },
  },
};
