/**
 * Seed knowledge for the atomic-structure topic: element data, the Geiger–Marsden dataset,
 * concepts, equations and the topic outline the AI generator assembles lessons from.
 * The lesson UI is generated from this data — nothing about the atom is hard-coded in the UI.
 */
import type { AtomModelRecord, Concept, Dataset, ElementRecord, Equation, ParticleRecord, Topic } from "@/lib/domain";
import { conceptId } from "./curriculum";

const el = (Z: number, symbol: string, name: string, nameAr: string, A: number, shells: number[], atomicRadiusPm: number, isotopes: [number, number][], extra: Partial<ElementRecord> = {}): ElementRecord => ({
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
  ...extra,
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
  el(
    29,
    "Cu",
    "Copper",
    "النحاس",
    63,
    [2, 8, 18, 1],
    128,
    [
      [63, 69.15],
      [65, 30.85],
    ],
    {
      electronConfig: "[Ar] 3d¹⁰ 4s¹",
      material: {
        crystal: "fcc",
        latticeConstantPm: 361.5,
        densityGcm3: 8.96,
        molarMassGmol: 63.55,
        freeElectronsPerAtom: 1,
        resistivityOhmM: 1.68e-8,
        uses: ["أسلاك الكهربا في البيوت", "ملفات الموتورات والمحوّلات", "مواسير المية", "دوائر الموبايل والكمبيوتر"],
        zoomLevels: [
          { key: "wire", title: "سلك نحاس", caption: "سلك كهربا عادي: معدن لامع بيوصّل الكهربا كويس جدًا.", sizeM: 1e-3, scaleLabel: "1 mm" },
          { key: "crystal", title: "بلّورة النحاس", caption: "الذرات مترتبة في شبكة مكعبة متمركزة الأوجه (FCC)، وكل ذرة سايبة إلكترون حر بيتحرك في البلّورة كلها — ده سر التوصيل.", sizeM: 1e-9, scaleLabel: "1 nm" },
          { key: "atom", title: "ذرة نحاس واحدة", caption: "29 إلكترون في 4 مستويات (2، 8، 18، 1). الإلكترون الوحيد في المستوى الأخير (4s) هو اللي بيتحرر.", sizeM: 2.56e-10, scaleLabel: "256 pm" },
          { key: "nucleus", title: "نواة النحاس", caption: "29 بروتون موجب + 34 نيوترون متعادل، في كرة قطرها حوالي 10 فمتومتر — فيها أكتر من 99.97% من كتلة الذرة.", sizeM: 9.6e-15, scaleLabel: "≈ 10 fm" },
        ],
      },
    },
  ),
  el(79, "Au", "Gold", "الدهب", 197, [2, 8, 18, 32, 18, 1], 174, [[197, 100]], { electronConfig: "[Xe] 4f¹⁴ 5d¹⁰ 6s¹" }),
];

/** How people imagined the atom, in order. Drives the history section and its 2D gallery. */
export const ATOM_MODELS: AtomModelRecord[] = [
  { id: "amd_democritus", key: "democritus", year: -400, yearLabel: "≈ 400 ق.م", scientist: "ديموقريطس", title: "«أتوموس»: مايتقسمش", idea: "لو فضلت تقسم أي حاجة، هتوصل لقطعة صغيرة جدًا مش بتتقسم — سمّاها «أتوموس».", evidence: "تفكير فلسفي بس، من غير تجارب.", flaw: "مفيش دليل، ومايقولش الذرة جواها إيه.", style: "solid" },
  { id: "amd_dalton", key: "dalton", year: 1803, yearLabel: "1803", scientist: "جون دالتون", title: "كرة صلبة زي كورة البلياردو", idea: "كل عنصر ليه نوع ذرات خاص بيه، كرات صلبة مصمتة، والمركبات بتتكوّن من ذرات بنسب ثابتة.", evidence: "قوانين النسب الثابتة والمتضاعفة في التفاعلات الكيميائية.", flaw: "الذرة مش مصمتة: جواها جسيمات أصغر مشحونة.", style: "solid" },
  { id: "amd_thomson", key: "thomson", year: 1904, yearLabel: "1904", scientist: "ج. ج. طومسون", title: "البودينج بالزبيب", idea: "كرة شحنتها موجبة منتشرة، والإلكترونات السالبة مغروسة فيها زي الزبيب.", evidence: "اكتشف الإلكترون (1897) بأشعة المهبط: جسيم سالب أخف من الذرة بكتير.", flaw: "مايقدرش يفسّر ارتداد جسيمات ألفا في تجربة رقيقة الدهب.", style: "pudding" },
  { id: "amd_rutherford", key: "rutherford", year: 1911, yearLabel: "1911", scientist: "إرنست رذرفورد", title: "نواة صغيرة جدًا وفراغ", idea: "كل الشحنة الموجبة وتقريبًا كل الكتلة في نواة صغيرة جدًا في النص، والإلكترونات بعيد حواليها.", evidence: "تجربة رقيقة الدهب: أغلب جسيمات ألفا عدّت، وقليل جدًا ارتد بزوايا كبيرة.", flaw: "الإلكترون اللي بيلف المفروض يشع طاقة ويقع على النواة — بس ده مابيحصلش.", style: "nuclear" },
  { id: "amd_bohr", key: "bohr", year: 1913, yearLabel: "1913", scientist: "نيلز بور", title: "مدارات بطاقات محددة", idea: "الإلكترون بيلف في مدارات مسموحة بس، كل مدار ليه طاقة ثابتة، وبيطلّع أو يمتص فوتون لما ينتقل.", evidence: "خطوط طيف الهيدروجين بأطوال موجية محددة بالظبط.", flaw: "بيشتغل كويس للهيدروجين بس، والإلكترون مش بيمشي في مسار محدد فعلًا.", style: "orbits" },
  { id: "amd_schrodinger", key: "schrodinger", year: 1926, yearLabel: "1926", scientist: "شرودنجر وهايزنبرج", title: "السحابة الإلكترونية", idea: "الإلكترون موجة؛ مانقدرش نحدد مكانه بالظبط، بس نعرف احتمال وجوده — «سحابة» أكثف في أماكن (أوربيتالات).", evidence: "معادلة شرودنجر بتتنبأ بطيف كل الذرات وشكل الروابط الكيميائية.", flaw: "ده النموذج الحالي — بيشتغل لكل الذرات المعروفة.", style: "cloud" },
  { id: "amd_chadwick", key: "chadwick", year: 1932, yearLabel: "1932", scientist: "جيمس شادويك", title: "النيوترون في النواة", idea: "النواة فيها بروتونات موجبة ونيوترونات متعادلة كتلتها قريبة من البروتون.", evidence: "إشعاع متعادل من البريليوم بيخبط البروتونات ويطيّرها — جسيم كتلته ≈ البروتون ومن غير شحنة.", flaw: "اكتمل التركيب: نواة (p + n) وسحابة إلكترونات حواليها.", style: "neutrons" },
];

export const PARTICLES: ParticleRecord[] = [
  { id: "prt_proton", key: "proton", nameAr: "بروتون", symbol: "p⁺", chargeE: 1, massU: 1.00728, massKg: 1.67262e-27, location: "في النواة", discovery: "رذرفورد، 1919" },
  { id: "prt_neutron", key: "neutron", nameAr: "نيوترون", symbol: "n⁰", chargeE: 0, massU: 1.00866, massKg: 1.67493e-27, location: "في النواة", discovery: "شادويك، 1932" },
  { id: "prt_electron", key: "electron", nameAr: "إلكترون", symbol: "e⁻", chargeE: -1, massU: 0.000549, massKg: 9.10938e-31, location: "سحابة حوالين النواة", discovery: "طومسون، 1897" },
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
  title: "طبيعة الذرة: من الخيال للنواة والسحابة الإلكترونية",
  keywords: ["ذرة", "الذرة", "نواة", "النواة", "رذرفورد", "رذرفورد", "إلكترون", "الإلكترونات", "نيوترون", "النيوترونات", "بروتون", "مدارات", "atom", "nucleus", "rutherford", "electron", "neutron", "bohr", "بور", "نحاس", "copper", "سحابة", "تاريخ", "نموذج", "نماذج"],
  conceptKeys: ["atom.models", "atom.nucleus", "atom.rutherford", "atom.bohr", "atom.isotopes"],
  timeline: [
    { year: "≈ 400 ق.م", title: "ديموقريطس", text: "فكرة «الأتوموس»: أصغر جزء مايتقسمش — من غير تجربة." },
    { year: "1803", title: "دالتون", text: "المادة مكوّنة من ذرات صلبة مش بتتقسم." },
    { year: "1897", title: "طومسون", text: "اكتشف الإلكترون، واقترح نموذج «البودينج»: شحنة موجبة منتشرة وفيها إلكترونات." },
    { year: "1909–1911", title: "رذرفورد، جايجر، مارسدن", text: "جسيمات ألفا بترتد من رقيقة دهب بزوايا كبيرة ← لازم تكون الشحنة الموجبة متركزة في نواة صغيرة جدًا." },
    { year: "1913", title: "بور", text: "الإلكترونات في مدارات بطاقات محددة، وبتطلع أو بتمتص فوتونات لما تنتقل بينها." },
    { year: "1926", title: "شرودنجر", text: "الإلكترون موجة: بدل المدار، «سحابة احتمال» حوالين النواة." },
    { year: "1932", title: "شادويك", text: "اكتشف النيوترون: جسيم متعادل في النواة، بيفسّر النظائر." },
  ],
  sections: [
    {
      id: "imagination",
      title: "الناس تخيّلوا الذرة إزاي؟",
      goal: "يتتبع الطالب تطور تخيّل الذرة، وإن كل نموذج اتغيّر لما ظهر دليل جديد.",
      narrative: [
        "محدش شاف ذرة بعينه — كل صورة للذرة هي «نموذج»: تخيّل بيفسّر اللي بنقيسه. ولما تيجي تجربة النموذج مايقدرش يفسّرها، بنغيّره.",
        "اختار نموذج من التاريخ وشوف العالم تخيّلها إزاي، والدليل اللي كان عنده، وإيه اللي كان ناقص.",
      ],
      build: ["timeline", "model_history", "quiz"],
      quiz: {
        question: "ليه العلماء غيّروا نموذج الذرة أكتر من مرة؟",
        options: [
          { id: "evidence", label: "عشان ظهرت تجارب جديدة النموذج القديم مقدرش يفسّرها" },
          { id: "fashion", label: "عشان كل عالم كان عايز يحط اسمه على نموذج" },
          { id: "atoms", label: "عشان الذرات نفسها اتغيّرت مع الوقت" },
        ],
        correctId: "evidence",
        explanation: "النموذج العلمي بيتحكم عليه بالدليل: طومسون اتغيّر بعد رقيقة الدهب، ورذرفورد اتعدّل بعد خطوط الطيف.",
        feedback: {
          fashion: "النموذج اللي مايفسّرش التجارب بيتشال مهما كان اسم صاحبه. إيه اللي خلّى طومسون يتغيّر؟",
          atoms: "الذرات زي ما هي من مليارات السنين — اللي اتغيّر هو اللي نعرفه عنها.",
        },
      },
    },
    {
      id: "puzzle",
      title: "اللغز: الذرة شكلها إيه من جوه؟",
      goal: "يقارن الطالب بين نموذج طومسون ونموذج رذرفورد قبل ما يشوف النتيجة.",
      narrative: [
        "مستحيل نشوف الذرة بعنينا — قطرها حوالي $10^{-10}\\,\\mathrm{m}$. فإزاي نعرف شكلها من جوه؟ رذرفورد كان عنده فكرة: «نرميها بحاجة ونشوف بترتد إزاي».",
        "قبلها، طومسون اقترح إن الذرة كرة موجبة منتشرة وجواها إلكترونات زي الزبيب في البودينج. لو ده صح، جسيمات ألفا التقيلة السريعة هتعدّي تقريبًا من غير ما تنحرف.",
      ],
      build: ["plum_pudding", "quiz"],
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
      id: "inside",
      title: "رحلة جوه الذرة",
      goal: "يوصف الطالب الذرة: نواة كثيفة موجبة في المركز (بروتونات + نيوترونات) وسحابة إلكترونات سالبة حواليها، ويقارن الأحجام والكتل والشحنات.",
      narrative: [
        "في مركز الذرة نواة كثيفة جدًا شحنتها موجبة، مكوّنة من بروتونات موجبة ونيوترونات متعادلة. حواليها سحابة من الإلكترونات السالبة.",
        "النواة صغيرة جدًا بس تقيلة جدًا: فيها أكتر من 99.9% من كتلة الذرة. والإلكترونات خفيفة جدًا بس بتاخد تقريبًا كل الحجم. وفي الذرة المتعادلة عدد الإلكترونات = عدد البروتونات، فالشحنة الكلية صفر.",
        "لفّ الذرة بالماوس في 3D، وبدّل بين «مدارات» (صورة بور) و«سحابة» (الصورة الحديثة). وكبّر النواة — في الحقيقة لو الذرة قد الشاشة، النواة أصغر من البكسل!",
      ],
      build: ["atom_3d", "particles_table", "nucleus_3d", "scale_callout"],
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
      id: "copper",
      title: "مثال من الواقع: النحاس",
      goal: "يربط الطالب تركيب ذرة النحاس بخاصية حقيقية: توصيل الكهربا.",
      narrative: [
        "السلك اللي في الحيطة نحاس. لو كبّرناه مليار مرة هنشوف بلّورة ذرات مترتبة، ولو دخلنا ذرة واحدة هنلاقي 29 إلكترون حوالين نواة فيها 29 بروتون و34 نيوترون.",
        "كل ذرة نحاس عندها إلكترون واحد بعيد في المستوى الأخير مربوط بضعف — في المعدن بيسيب ذرته ويتحرك بحرية. البحر ده من الإلكترونات الحرة هو اللي بيخلّي النحاس موصّل ممتاز.",
      ],
      build: ["copper_zoom", "copper_facts"],
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
    { question: "ليه أغلب جسيمات ألفا عدّت؟ هي الذرة فاضية؟", keywords: ["فاضية", "فراغ", "فاضي", "empty"], answer: "أيوه، الذرة تقريبًا فاضية: نصف قطر النواة حوالي $10^{-15}\\,\\mathrm{m}$ والذرة حوالي $10^{-10}\\,\\mathrm{m}$ — يعني لو النواة قد حبة بسلة، الذرة قد ستاد. عشان كده أغلب جسيمات ألفا عدّت.", conceptKey: "atom.rutherford", visual: "scale_callout" },
    { question: "إزاي جسيم ألفا يرتد لورا؟", keywords: ["ترتد", "ارتد", "رجع", "زاوية كبيرة", "bounce"], answer: "الارتداد بيحصل لما جسيم ألفا يقرّب جدًا من النواة: قوة التنافر $\\propto \\frac{1}{r^2}$ بتكبر جدًا، وكل الشحنة الموجبة مركزة في مكان صغير، فتقدر ترجّعه. ده محصلش في نموذج طومسون لأن الشحنة منتشرة.", conceptKey: "atom.rutherford" },
    { question: "يعني إيه نيوترون ونظائر؟", keywords: ["نيوترون", "neutron", "متعادل", "نظائر", "نظير"], answer: "النيوترون جسيم متعادل في النواة (اكتشفه شادويك 1932). بيزوّد الكتلة من غير ما يغيّر الشحنة، وعشان كده ممكن يكون لنفس العنصر نظائر: نفس $Z$ وعدد نيوترونات مختلف.", conceptKey: "atom.isotopes", visual: "isotopes_table" },
    { question: "إيه هي مدارات بور وخطوط الطيف؟", keywords: ["مدار", "بور", "مستوى", "طيف", "فوتون", "orbit"], answer: "في نموذج بور الإلكترون مسموح له بمستويات طاقة محددة $E_n = -\\frac{13.6Z^2}{n^2}$. لما ينزل لمستوى أقل بيطلّع فوتون طاقته الفرق. النموذج ده دقيق للهيدروجين؛ الصورة الأحدث هي «سحابة احتمال» من ميكانيكا الكم.", conceptKey: "atom.bohr", visual: "energy_levels" },
    { question: "ليه الإلكترون مايقعش على النواة؟", keywords: ["إلكترون", "electron", "يقع", "ليه مايقعش"], answer: "سؤال ممتاز — ده بالظبط اللي كسر نموذج رذرفورد! الفيزياء الكلاسيكية بتقول الإلكترون اللي بيلف يشع ويقع. بور فرض مدارات مستقرة، وميكانيكا الكم فسّرت إن الإلكترون موجة ليها حالات طاقة ثابتة.", conceptKey: "atom.bohr" },
    { question: "إزاي النحاس بيوصّل الكهربا؟", keywords: ["نحاس", "copper", "توصيل", "يوصل", "بيوصّل", "كهربا", "سلك"], answer: "كل ذرة نحاس ($Z = 29$) عندها إلكترون واحد في المستوى الأخير (4s) مربوط بضعف. في المعدن الإلكترون ده بيسيب ذرته ويبقى «حر» يتحرك في البلّورة كلها. لما توصّل بطارية، البحر ده من الإلكترونات الحرة بيتحرك كله في اتجاه واحد — وده التيار.", conceptKey: "atom.nucleus", visual: "copper_facts" },
    { question: "النواة تقيلة قد إيه مقارنة بالإلكترونات؟", keywords: ["تقيلة", "كتلة", "وزن", "mass", "أتقل", "تقيل"], answer: "البروتون أتقل من الإلكترون حوالي $1836$ مرة، والنيوترون تقريبًا زي البروتون. فالنواة فيها أكتر من $99.9\\%$ من كتلة الذرة، مع إن حجمها أصغر من الذرة حوالي $10^5$ مرة.", conceptKey: "atom.nucleus", visual: "particles_table" },
    { question: "يعني إيه سحابة إلكترونية؟", keywords: ["سحابة", "cloud", "أوربيتال", "احتمال", "orbital", "إلكترونية"], answer: "في الصورة الحديثة الإلكترون مش بيمشي في مسار زي الكوكب. هو موجة، وكل اللي نقدر نعرفه هو احتمال وجوده في كل مكان. لو رسمنا الاحتمال ده بنقط، هيبان زي سحابة أكثف قريب من النواة — ده اللي بنسميه «سحابة إلكترونية».", conceptKey: "atom.models", visual: "atom_3d" },
  ],
};
