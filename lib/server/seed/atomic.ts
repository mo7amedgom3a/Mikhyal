/**
 * Seed knowledge for the atomic-structure topic: element data, the Geiger–Marsden dataset,
 * concepts, equations and the topic outline the AI generator assembles lessons from.
 * The lesson UI is generated from this data — nothing about the atom is hard-coded in the UI.
 */
import type { Concept, Dataset, ElementRecord, Equation, Topic } from "@/lib/domain";
import { conceptId } from "./curriculum";

const el = (Z: number, symbol: string, name: string, nameAr: string, A: number, shells: number[], atomicRadiusPm: number, isotopes: [number, number][]): ElementRecord => ({
  id: `elm_${symbol}`,
  Z,
  symbol,
  name,
  nameAr,
  massNumber: A,
  neutrons: A - Z,
  shells,
  atomicRadiusPm,
  // r ≈ 1.2 A^(1/3) fm
  nuclearRadiusFm: +(1.2 * Math.cbrt(A)).toFixed(2),
  isotopes: isotopes.map(([mass, abundance]) => ({ massNumber: mass, neutrons: mass - Z, abundance })),
});

export const ELEMENTS: ElementRecord[] = [
  el(1, "H", "Hydrogen", "الهيدروجين", 1, [1], 53, [[1, 99.98], [2, 0.02], [3, 0]]),
  el(2, "He", "Helium", "الهيليوم", 4, [2], 31, [[4, 99.9999], [3, 0.0001]]),
  el(3, "Li", "Lithium", "الليثيوم", 7, [2, 1], 167, [[7, 92.4], [6, 7.6]]),
  el(6, "C", "Carbon", "الكربون", 12, [2, 4], 67, [[12, 98.9], [13, 1.1], [14, 0]]),
  el(7, "N", "Nitrogen", "النيتروجين", 14, [2, 5], 56, [[14, 99.6], [15, 0.4]]),
  el(8, "O", "Oxygen", "الأكسجين", 16, [2, 6], 48, [[16, 99.76], [18, 0.2], [17, 0.04]]),
  el(11, "Na", "Sodium", "الصوديوم", 23, [2, 8, 1], 190, [[23, 100]]),
  el(13, "Al", "Aluminium", "الألومنيوم", 27, [2, 8, 3], 118, [[27, 100]]),
  el(79, "Au", "Gold", "الدهب", 197, [2, 8, 18, 32, 18, 1], 174, [[197, 100]]),
];

/** Geiger & Marsden (1913), gold foil: scintillation counts at each angle (approximate published values). */
export const GEIGER_MARSDEN: Dataset = {
  id: "dst_geiger_marsden_1913",
  title: "تجربة جايجر ومارسدن (1913) — رقيقة دهب",
  source: "H. Geiger & E. Marsden, Phil. Mag. 25, 604 (1913)",
  note: "أعداد ومضات تقريبية عند كل زاوية لنفس زمن العد؛ القيم المنشورة مقرّبة.",
  columns: [
    { key: "angle", label: "الزاوية", unit: "deg" },
    { key: "counts", label: "عدد الومضات", unit: "" },
  ],
  rows: [
    { angle: 15, counts: 132000 },
    { angle: 22.5, counts: 27300 },
    { angle: 30, counts: 7800 },
    { angle: 37.5, counts: 3300 },
    { angle: 45, counts: 1435 },
    { angle: 60, counts: 477 },
    { angle: 75, counts: 211 },
    { angle: 105, counts: 69.5 },
    { angle: 120, counts: 51.9 },
    { angle: 135, counts: 43 },
    { angle: 150, counts: 33.1 },
  ],
};

const T0 = conceptId;
export const ATOMIC_CONCEPTS: Concept[] = [
  ["atom.models", "نماذج الذرة عبر التاريخ", []],
  ["atom.nucleus", "النواة: بروتونات ونيوترونات", ["atom.models"]],
  ["atom.rutherford", "تجربة رذرفورد للتشتت", ["atom.models", "atom.nucleus"]],
  ["atom.bohr", "نموذج بور ومستويات الطاقة", ["atom.rutherford"]],
  ["atom.isotopes", "النظائر والعدد الكتلي", ["atom.nucleus"]],
].map(([key, title, pre]) => ({
  id: T0(key as string),
  key: key as string,
  title: title as string,
  description: "",
  subjectId: "sbj_physics",
  unitId: "unt_modern",
  prerequisites: (pre as string[]).map(T0),
  related: [],
  bkt: { pInit: 0.15, pLearn: 0.2, pSlip: 0.1, pGuess: 0.2 },
}));

const eq = (id: string, name: string, latex: string, relation: string, concepts: string[], assumptions: string[] = []): Equation => ({
  id: `eqn_${id}`,
  name,
  latex,
  relation,
  quantityIds: [],
  conceptIds: concepts.map(T0),
  assumptions,
  derivedFrom: [],
});

export const ATOMIC_EQUATIONS: Equation[] = [
  eq("atom.mass_number", "العدد الكتلي", "A = Z + N", "A = Z + N", ["atom.nucleus", "atom.isotopes"]),
  eq("atom.closest_approach", "أقرب مسافة لجسيم ألفا", "d = \\dfrac{k\\,(2e)(Ze)}{K}", "d = 1.44*2*Z/K", ["atom.rutherford"], ["تصادم مباشر", "النواة ثابتة (أثقل بكتير)"]),
  eq("atom.rutherford_deflection", "زاوية الانحراف", "\\tan\\dfrac{\\theta}{2} = \\dfrac{d}{2b}", "theta = 2*atan(d/(2*b))", ["atom.rutherford"]),
  eq("atom.rutherford_cross_section", "قانون رذرفورد للتشتت", "N(\\theta) \\propto \\dfrac{1}{\\sin^4(\\theta/2)}", "N = 1/sin(theta/2)^4", ["atom.rutherford"]),
  eq("atom.bohr_energy", "طاقة المستوى في نموذج بور", "E_n = -\\dfrac{13.6\\,Z^2}{n^2}\\ \\mathrm{eV}", "E = -13.6*Z^2/n^2", ["atom.bohr"], ["ذرة شبيهة بالهيدروجين (إلكترون واحد)"]),
  eq("atom.bohr_radius", "نصف قطر المدار", "r_n = 0.529\\,\\dfrac{n^2}{Z}\\ \\text{Å}", "r = 0.529*n^2/Z", ["atom.bohr"]),
  eq("atom.photon", "طاقة الفوتون المنبعث", "h f = E_{n_2} - E_{n_1}", "E = 13.6*Z^2*(1/n1^2 - 1/n2^2)", ["atom.bohr"]),
];

export const ATOMIC_TOPIC: Topic = {
  id: "tpc_atomic_structure",
  slug: "atomic-structure",
  title: "طبيعة الذرة: من البودينج للنواة لمدارات بور",
  keywords: ["ذرة", "الذرة", "نواة", "النواة", "رذرفورد", "رذرفورد", "إلكترون", "الإلكترونات", "نيوترون", "النيوترونات", "بروتون", "مدارات", "atom", "nucleus", "rutherford", "electron", "neutron", "bohr", "بور"],
  conceptKeys: ["atom.models", "atom.nucleus", "atom.rutherford", "atom.bohr", "atom.isotopes"],
  timeline: [
    { year: "1803", title: "دالتون", text: "المادة مكوّنة من ذرات صلبة مش بتتقسم." },
    { year: "1897", title: "طومسون", text: "اكتشف الإلكترون، واقترح نموذج «البودينج»: شحنة موجبة منتشرة وفيها إلكترونات." },
    { year: "1909–1911", title: "رذرفورد، جايجر، مارسدن", text: "جسيمات ألفا بترتد من رقيقة دهب بزوايا كبيرة ← لازم تكون الشحنة الموجبة متركزة في نواة صغيرة جدًا." },
    { year: "1913", title: "بور", text: "الإلكترونات في مدارات بطاقات محددة، وبتطلع أو بتمتص فوتونات لما تنتقل بينها." },
    { year: "1932", title: "شادويك", text: "اكتشف النيوترون: جسيم متعادل في النواة، بيفسّر النظائر." },
  ],
  sections: [
    {
      id: "puzzle",
      title: "اللغز: الذرة شكلها إيه من جوه؟",
      goal: "يقارن الطالب بين نموذج طومسون ونموذج رذرفورد قبل ما يشوف النتيجة.",
      narrative: [
        "مستحيل نشوف الذرة بعنينا — قطرها حوالي $10^{-10}\\,\\mathrm{m}$. فإزاي نعرف شكلها من جوه؟ رذرفورد كان عنده فكرة: «نرميها بحاجة ونشوف بترتد إزاي».",
        "قبلها، طومسون اقترح إن الذرة كرة موجبة منتشرة وجواها إلكترونات زي الزبيب في البودينج. لو ده صح، جسيمات ألفا التقيلة السريعة هتعدّي تقريبًا من غير ما تنحرف.",
      ],
      build: ["timeline", "plum_pudding", "quiz"],
      quiz: {
        question: "لو نموذج طومسون صح، هيحصل إيه لجسيمات ألفا اللي بنرميها على رقيقة دهب؟",
        options: [
          { id: "pass", label: "أغلبها هيعدّي بانحراف صغير جدًا" },
          { id: "bounce", label: "كتير منها هيرتد لورا" },
          { id: "stop", label: "كلها هتقف جوه الرقيقة" },
        ],
        correctId: "pass",
        explanation: "الشحنة الموجبة المنتشرة مجالها ضعيف، فمفيش حاجة تقدر ترجّع جسيم ألفا التقيل لورا.",
        feedback: {
          bounce: "عشان يرتد لازم يقابل قوة كبيرة جدًا في مسافة صغيرة. الشحنة المنتشرة تقدر تعمل كده؟",
          stop: "جسيمات ألفا طاقتها ملايين الإلكترون فولت، والرقيقة رفيعة جدًا. فكّر في القوة اللي هتقابلها.",
        },
      },
    },
    {
      id: "experiment",
      title: "تجربة رقيقة الدهب",
      goal: "يجرب الطالب التشتت بنفسه ويلاحظ الارتدادات النادرة بزوايا كبيرة.",
      narrative: [
        "جسيمات ألفا (نواة هيليوم، شحنتها $+2e$) بتتضرب على رقيقة دهب ($Z = 79$) سُمكها بضع مئات من الذرات. شاشة كبريتيد الزنك بتنوّر مكان ما الجسيم يخبط.",
        "النتيجة اللي صدمت رذرفورد: تقريبًا كل الجسيمات عدّت، بس حوالي واحد من كل ثمانية آلاف ارتد بزاوية أكبر من $90^\\circ$ — «كأنك ضربت ورقة مناديل بقذيفة فرجعتلك».",
      ],
      build: ["rutherford_scattering", "equations"],
    },
    {
      id: "evidence",
      title: "الأرقام بتقول إيه؟",
      goal: "يقارن الطالب بيانات جايجر ومارسدن بتنبؤ رذرفورد 1/sin⁴(θ/2).",
      narrative: [
        "لو الشحنة الموجبة متركزة في نقطة، عدد الجسيمات عند زاوية $\\theta$ لازم يتناسب مع $\\frac{1}{\\sin^4(\\theta/2)}$. جايجر ومارسدن عدّوا الومضات عند زوايا كتير — والنقط ماشية على المنحنى على مدى أكتر من 4 قوى عشرة!",
      ],
      build: ["geiger_marsden_plot", "scale_callout"],
    },
    {
      id: "nucleus",
      title: "جوه النواة: بروتونات ونيوترونات",
      goal: "يربط الطالب العدد الذري والعدد الكتلي والنظائر بتركيب النواة.",
      narrative: [
        "النواة فيها بروتونات (موجبة) عددها $Z$ = العدد الذري، ونيوترونات (متعادلة) عددها $N$. العدد الكتلي $A = Z + N$.",
        "ذرات نفس العنصر ليها نفس $Z$ بس ممكن $N$ يختلف — دي النظائر. والإلكترونات (عددها $Z$ في الذرة المتعادلة) حوالين النواة في مستويات.",
      ],
      build: ["atom_model", "isotopes_table"],
    },
    {
      id: "bohr",
      title: "مدارات بور ومستويات الطاقة",
      goal: "يحسب الطالب طاقات المستويات ويربط الانتقالات بألوان الطيف.",
      narrative: [
        "نموذج رذرفورد كان فيه مشكلة: الإلكترون اللي بيلف المفروض يشع طاقة ويقع على النواة! بور حل ده بفرض إن الإلكترون مسموح له بمدارات معينة بس، طاقتها $E_n = -\\frac{13.6 Z^2}{n^2}\\,\\mathrm{eV}$.",
        "لما الإلكترون ينزل من مستوى أعلى لأقل، بيطلّع فوتون طاقته = الفرق بين المستويين — وده سبب خطوط الطيف المميزة لكل عنصر.",
      ],
      build: ["energy_levels", "quiz"],
      quiz: {
        question: "إلكترون في ذرة هيدروجين نزل من $n = 3$ لـ $n = 2$. الفوتون المنبعث طاقته تقريبًا كام؟",
        options: [
          { id: "a", label: "$1.89\\,\\mathrm{eV}$ (أحمر)" },
          { id: "b", label: "$13.6\\,\\mathrm{eV}$" },
          { id: "c", label: "$3.4\\,\\mathrm{eV}$" },
        ],
        correctId: "a",
        explanation: "$E = 13.6\\left(\\frac{1}{4} - \\frac{1}{9}\\right) \\approx 1.89\\,\\mathrm{eV}$ ← طول موجي $656\\,\\mathrm{nm}$ (خط Hα الأحمر).",
        feedback: {
          b: "دي طاقة تأيّن الهيدروجين من المستوى الأرضي. احنا عايزين الفرق بين $n=3$ و $n=2$ بس.",
          c: "دي $|E_2|$ لوحدها. الفوتون بياخد الفرق: $E_3 - E_2$.",
        },
      },
    },
  ],
  faq: [
    { question: "ليه أغلب جسيمات ألفا عدّت؟ هي الذرة فاضية؟", keywords: ["فاضية", "فراغ", "فاضي", "empty"], answer: "أيوه، الذرة تقريبًا فاضية: نصف قطر النواة حوالي $10^{-15}\\,\\mathrm{m}$ والذرة حوالي $10^{-10}\\,\\mathrm{m}$ — يعني لو النواة قد حبة بسلة، الذرة قد ستاد. عشان كده أغلب جسيمات ألفا عدّت.", conceptKey: "atom.rutherford" },
    { question: "إزاي جسيم ألفا يرتد لورا؟", keywords: ["ترتد", "ارتد", "رجع", "زاوية كبيرة", "bounce"], answer: "الارتداد بيحصل لما جسيم ألفا يقرّب جدًا من النواة: قوة التنافر $\\propto \\frac{1}{r^2}$ بتكبر جدًا، وكل الشحنة الموجبة مركزة في مكان صغير، فتقدر ترجّعه. ده محصلش في نموذج طومسون لأن الشحنة منتشرة.", conceptKey: "atom.rutherford" },
    { question: "يعني إيه نيوترون ونظائر؟", keywords: ["نيوترون", "neutron", "متعادل", "نظائر", "نظير"], answer: "النيوترون جسيم متعادل في النواة (اكتشفه شادويك 1932). بيزوّد الكتلة من غير ما يغيّر الشحنة، وعشان كده ممكن يكون لنفس العنصر نظائر: نفس $Z$ وعدد نيوترونات مختلف.", conceptKey: "atom.isotopes" },
    { question: "إيه هي مدارات بور وخطوط الطيف؟", keywords: ["مدار", "بور", "مستوى", "طيف", "فوتون", "orbit"], answer: "في نموذج بور الإلكترون مسموح له بمستويات طاقة محددة $E_n = -\\frac{13.6Z^2}{n^2}$. لما ينزل لمستوى أقل بيطلّع فوتون طاقته الفرق. النموذج ده دقيق للهيدروجين؛ الصورة الأحدث هي «سحابة احتمال» من ميكانيكا الكم.", conceptKey: "atom.bohr" },
    { question: "ليه الإلكترون مايقعش على النواة؟", keywords: ["إلكترون", "electron", "يقع", "ليه مايقعش"], answer: "سؤال ممتاز — ده بالظبط اللي كسر نموذج رذرفورد! الفيزياء الكلاسيكية بتقول الإلكترون اللي بيلف يشع ويقع. بور فرض مدارات مستقرة، وميكانيكا الكم فسّرت إن الإلكترون موجة ليها حالات طاقة ثابتة.", conceptKey: "atom.bohr" },
  ],
};
