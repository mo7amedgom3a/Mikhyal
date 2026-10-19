/** Phenomena modules: famous phenomena, each with an experiment, a Workbench equation, a mock mission and graduated hints. */
import type { NumericTarget, WrongValueRule } from "@/lib/engine/types";
import type { GraduatedHints } from "@/lib/workbench/types";
import {
  CONST,
  compassDeflectionDeg,
  electronWavelength,
  entropyOfHeatFlow,
  expansion,
  hallVoltage,
  iceToWaterHeat,
  photoKmax,
  tunnelProbability,
  unruhTemperature,
  wireField,
} from "@/lib/physics/phenomena";

export type PhenomenonCategory = "electromagnetic" | "thermal" | "quantum";

export const CATEGORY_LABEL: Record<PhenomenonCategory, { title: string; blurb: string }> = {
  electromagnetic: { title: "ظواهر كهرومغناطيسية", blurb: "التيار بيعمل مغناطيسية، والمغناطيسية بتزق الشحنات، والضوء بيطلّع إلكترونات." },
  thermal: { title: "ظواهر حرارية", blurb: "الحرارة بتمدّد المواد، وبتغيّر حالتها، وليها اتجاه واحد بس." },
  quantum: { title: "ظواهر كمّية ونسبية", blurb: "الجسيمات بتتصرف كموجات، وبتعدّي حواجز مستحيلة، والفراغ نفسه ممكن يسخن." },
};

export interface PhenomenonModule {
  id: string;
  category: PhenomenonCategory;
  title: string;
  tagline: string;
  icon: string;
  description: string;
  famous: { title: string; who: string; year: string; text: string };
  equation: { latex: string; meaning: string };
  /** How the Mathematical Workbench grades the reasoning in this module. */
  workbench: { chain: string[]; checks: string[] };
  mission: {
    title: string;
    story: string;
    question: string;
    answer: NumericTarget;
    unitHint: string;
    wrongValues: WrongValueRule[];
    solution: string;
  };
  hints: GraduatedHints;
  /** Question a parent can ask at home after this module. */
  homePrompt: string;
  advanced?: boolean;
  /** Full step-by-step Workbench lesson, when available. */
  workbenchProblemId?: string;
}

const B_WIRE = wireField(10, 0.05);
const V_HALL = hallVoltage(5, 1, 8.5e28, 1e-4);
const K_EV = photoKmax(400e-9, 2.28 * CONST.e) / CONST.e;
const DL = expansion(1.2e-5, 12, 40);
const ICE = iceToWaterHeat(0.5, -10, 20);
const DS = entropyOfHeatFlow(1000, 400, 300);
const LAMBDA_E = electronWavelength(100);
const T_TUNNEL = tunnelProbability(1, 5, 0.5e-9);
const T_UNRUH = unruhTemperature(1e20);

export const PHENOMENA: PhenomenonModule[] = [
  {
    id: "magnetism",
    category: "electromagnetic",
    title: "المغناطيسية حوالين سلك",
    tagline: "التيار الكهربي بيعمل مجال مغناطيسي",
    icon: "Magnet",
    description:
      "أي شحنة بتتحرك بتعمل مجال مغناطيسي. حوالين سلك مستقيم، خطوط المجال دواير متحدة المركز، وشدته بتقل كل ما نبعد عن السلك. اتجاهه بقاعدة اليد اليمنى.",
    famous: {
      title: "بوصلة أورستد",
      who: "هانز كريستيان أورستد",
      year: "1820",
      text: "في محاضرة، أورستد لاحظ إن إبرة بوصلة جنب سلك بتنحرف لما يوصّل التيار. كانت أول دليل إن الكهربا والمغناطيسية ظاهرة واحدة.",
    },
    equation: { latex: "B = \\dfrac{\\mu_0 I}{2\\pi r}", meaning: "المجال يتناسب طرديًا مع التيار وعكسيًا مع البُعد." },
    workbench: {
      chain: ["B = \\frac{\\mu_0 I}{2\\pi r}", "r = 5\\,\\mathrm{cm} = 0.05\\,\\mathrm{m}", "B = \\frac{4\\pi\\times10^{-7}(10)}{2\\pi(0.05)}"],
      checks: ["الأبعاد: $\\mathrm{T\\,m/A} \\cdot \\mathrm{A} / \\mathrm{m} = \\mathrm{T}$", "تحويل $\\mathrm{cm} \\to \\mathrm{m}$ قبل التعويض", "مقارنة بمجال الأرض ($\\approx 40\\,\\mu\\mathrm{T}$) كتحقق فيزيائي"],
    },
    mission: {
      title: "البوصلة هتنحرف قد إيه؟",
      story: `سلك رأسي طويل فيه تيار $I = 10\\,\\mathrm{A}$، وبوصلة على بُعد $5\\,\\mathrm{cm}$ منه. المجال الأفقي للأرض حوالي $40\\,\\mu\\mathrm{T}$، فلو مجال السلك قدّه بالظبط الإبرة هتنحرف $${compassDeflectionDeg(B_WIRE).toFixed(0)}^\\circ$.`,
      question: "احسب شدة المجال المغناطيسي للسلك عند البوصلة.",
      answer: { value: B_WIRE, unit: "T", tolerance: 0.03 },
      unitHint: "مثال: 2e-5 T أو 20 μT",
      wrongValues: [
        { value: (CONST.mu0 * 10) / 0.05, ruleId: "mag-no-2pi", errorType: "mathematical", prompt: "إجابتك أكبر بحوالي $2\\pi$. راجع المقام: $2\\pi r$." },
        { value: wireField(10, 5), ruleId: "mag-cm", errorType: "procedural", prompt: "عوّضت بـ $r = 5$… بالسنتيمتر؟ القانون بالمتر." },
      ],
      solution: "B = \\frac{4\\pi\\times10^{-7}\\times10}{2\\pi\\times0.05} = 4\\times10^{-5}\\,\\mathrm{T} = 40\\,\\mu\\mathrm{T}",
    },
    hints: {
      conceptual: "التيار بيعمل دواير مجال حوالين السلك. إيه اللي يقوّي المجال وإيه اللي يضعّفه؟",
      strategic: "محتاج قانون المجال لسلك مستقيم لانهائي الطول عند بُعد $r$.",
      procedural: "عوّض في $B = \\frac{\\mu_0 I}{2\\pi r}$ بعد تحويل $r$ للمتر؛ الـ $\\pi$ هتختصر.",
      verification: "قارن بمجال الأرض: لو طلع أكبر منه بآلاف المرات أو أصغر بكتير، راجع التحويل.",
    },
    homePrompt: "ليه البوصلة ممكن تلخبط لو حطيناها جنب سلك الشاحن أو سماعات الموبايل؟",
  },
  {
    id: "hall-effect",
    category: "electromagnetic",
    title: "تأثير هول",
    tagline: "إزاي نعرف إشارة حاملات الشحنة",
    icon: "Waypoints",
    description:
      "لما تيار يعدّي في شريحة موصل جوه مجال مغناطيسي عمودي، القوة المغناطيسية بتزق الشحنات لناحية واحدة، فيظهر فرق جهد عرضي (جهد هول). إشارة الجهد بتقول الحاملات سالبة (إلكترونات) ولا موجبة (فجوات).",
    famous: {
      title: "تجربة إدوين هول",
      who: "إدوين هول",
      year: "1879",
      text: "وهو طالب دكتوراه، هول قاس فرق جهد صغير جدًا على شريحة دهب في مجال مغناطيسي. بعدها بعقود، نفس التجربة كشفت إن بعض أشباه الموصلات حاملاتها موجبة — أساس الترانزستور وحساسات العربيات والموبايلات.",
    },
    equation: { latex: "V_H = \\dfrac{IB}{nqt}", meaning: "الجهد أكبر لما كثافة الحاملات $n$ تقل — عشان كده أشباه الموصلات أحسن حساسات." },
    workbench: {
      chain: ["F_B = qvB = qE_H", "I = nqAv", "V_H = \\frac{IB}{nqt}"],
      checks: ["إشارة $q$ بتحدد إشارة $V_H$", "تحويل السُمك $0.1\\,\\mathrm{mm} \\to 10^{-4}\\,\\mathrm{m}$", "الأبعاد بتطلع فولت"],
    },
    mission: {
      title: "جهد هول في شريحة نحاس",
      story: "شريحة نحاس سُمكها $t = 0.1\\,\\mathrm{mm}$ فيها تيار $5\\,\\mathrm{A}$ في مجال $B = 1\\,\\mathrm{T}$. كثافة الإلكترونات الحرة في النحاس $n = 8.5\\times10^{28}\\,\\mathrm{m^{-3}}$.",
      question: "احسب جهد هول.",
      answer: { value: V_HALL, unit: "V", tolerance: 0.03 },
      unitHint: "مثال: 2e-6 V أو 2 μV",
      wrongValues: [{ value: hallVoltage(5, 1, 8.5e28, 0.1), ruleId: "hall-mm", errorType: "procedural", prompt: "السُمك اتعوّض بالمليمتر. حوّله لمتر." }],
      solution: "V_H = \\frac{5\\times1}{8.5\\times10^{28}\\times1.6\\times10^{-19}\\times10^{-4}} \\approx 3.7\\,\\mu\\mathrm{V}",
    },
    hints: {
      conceptual: "الشحنات المتحركة في مجال مغناطيسي بتتزق جنب. لما تتجمع على حافة، إيه اللي يوقف التجمع؟",
      strategic: "التوازن بين القوة المغناطيسية والقوة الكهربية العرضية بيدّي قانون جهد هول.",
      procedural: "$V_H = \\frac{IB}{nqt}$ — كل الكميات بالـ SI.",
      verification: "في النحاس الجهد بيطلع ميكروفولتات. لو طلع فولتات كاملة، فيه تحويل ناقص.",
    },
    homePrompt: "الموبايل بيعرف إن الجراب المغناطيسي اتقفل إزاي؟ (فيه حساس هول!)",
  },
  {
    id: "photoelectric",
    category: "electromagnetic",
    title: "التأثير الكهروضوئي",
    tagline: "الضوء كمّات طاقة",
    icon: "Sun",
    description:
      "الضوء لما يقع على معدن ممكن يطلّع إلكترونات — بس فوق تردد معين بس (التردد الحرج)، مهما كانت شدة الضوء. الشدة بتزوّد عدد الإلكترونات، والتردد بيزوّد طاقتها.",
    famous: {
      title: "تفسير أينشتاين",
      who: "ألبرت أينشتاين",
      year: "1905",
      text: "أينشتاين اقترح إن الضوء مكوّن من كمّات طاقتها $hf$، وكل كمّة بتتعامل مع إلكترون واحد. التفسير ده أخد عليه جايزة نوبل 1921 — مش على النسبية.",
    },
    equation: { latex: "K_{max} = hf - \\phi", meaning: "طاقة الفوتون = تمن الخروج (دالة الشغل) + طاقة الحركة." },
    workbench: {
      chain: ["f = \\frac{c}{\\lambda}", "E = hf", "K_{max} = E - \\phi"],
      checks: ["توحيد الوحدات: جول أو إلكترون فولت", "$K_{max} \\ge 0$ (وإلا مافيش انبعاث)", "مسار بديل: $K_{max} = h(f - f_0)$"],
    },
    mission: {
      title: "ضوء بنفسجي على صوديوم",
      story: "ضوء طوله الموجي $400\\,\\mathrm{nm}$ وقع على صوديوم دالة شغله $2.28\\,\\mathrm{eV}$.",
      question: "احسب أقصى طاقة حركة للإلكترونات المتحررة.",
      answer: { value: K_EV, unit: "eV", tolerance: 0.03 },
      unitHint: "مثال: 1.5 eV أو 2.4e-19 J",
      wrongValues: [{ value: K_EV + 2.28, ruleId: "photo-no-phi", errorType: "conceptual", prompt: "دي طاقة الفوتون كلها. الإلكترون بيدفع جزء منها عشان يخرج — فين $\\phi$؟" }],
      solution: "K_{max} = \\frac{hc}{\\lambda} - \\phi \\approx 3.10 - 2.28 = 0.82\\,\\mathrm{eV}",
    },
    hints: {
      conceptual: "الفوتون بيدّي طاقته كلها لإلكترون واحد. الطاقة دي بتروح فين؟",
      strategic: "احسب طاقة الفوتون الأول، وبعدين اطرح تمن الخروج.",
      procedural: "$E = \\frac{hc}{\\lambda}$، حوّلها لـ eV بالقسمة على $1.6\\times10^{-19}$، واطرح $\\phi$.",
      verification: "كل الطاقات بنفس الوحدة؟ والناتج موجب؟",
    },
    homePrompt: "ليه الضوء الأحمر مهما كان قوي مايطلّعش إلكترونات من الصوديوم، والبنفسجي الضعيف يطلّع؟",
    workbenchProblemId: "photoelectric_001",
  },
  {
    id: "thermal-expansion",
    category: "thermal",
    title: "التمدد الحراري",
    tagline: "ليه بنسيب فراغات في السكة الحديد",
    icon: "Thermometer",
    description:
      "لما المادة تسخن، جزيئاتها بتتذبذب أكتر والمسافات بينها بتزيد، فالأبعاد كلها بتكبر. التمدد الطولي يتناسب مع الطول الأصلي ومع التغير في درجة الحرارة.",
    famous: {
      title: "قضبان السكة الحديد والشريط المزدوج",
      who: "مهندسو السكك الحديدية",
      year: "القرن الـ 19",
      text: "قضبان من غير فراغات بتتقوس في الصيف (sun kink). ونفس الفكرة في الشريط المزدوج (bimetallic strip): معدنين بمعاملات تمدد مختلفة ملحومين ببعض، فيتقوّس مع الحرارة — قلب الترموستات القديم.",
    },
    equation: { latex: "\\Delta L = \\alpha L_0 \\Delta T", meaning: "الزيادة تتناسب مع الطول الأصلي والتغير في الحرارة." },
    workbench: {
      chain: ["\\Delta T = T_2 - T_1", "\\Delta L = \\alpha L_0 \\Delta T", "\\text{أو } L = L_0(1+\\alpha\\Delta T)"],
      checks: ["$\\Delta T$ هي التغير مش درجة الحرارة النهائية", "$\\alpha$ بوحدة $\\mathrm{K^{-1}}$ مع $\\Delta T$ بالكلفن أو السيلزيوس", "تحويل الناتج لـ mm للإحساس بالحجم"],
    },
    mission: {
      title: "فراغ بين القضبان",
      story: "قضيب صلب طوله $12\\,\\mathrm{m}$ عند $20^\\circ\\mathrm{C}$، ومعامل تمدده $1.2\\times10^{-5}\\,\\mathrm{K^{-1}}$. في الصيف بيوصل $60^\\circ\\mathrm{C}$.",
      question: "أقل فراغ لازم نسيبه؟",
      answer: { value: DL, unit: "m", tolerance: 0.02 },
      unitHint: "مثال: 4 mm أو 0.004 m",
      wrongValues: [{ value: expansion(1.2e-5, 12, 60), ruleId: "exp-final-T", errorType: "procedural", prompt: "عوّضت بـ $60$ مش بالتغير $\\Delta T$." }],
      solution: "\\Delta L = 1.2\\times10^{-5}\\times12\\times40 = 5.76\\times10^{-3}\\,\\mathrm{m} = 5.76\\,\\mathrm{mm}",
    },
    hints: {
      conceptual: "إيه اللي بيحدد القضيب هيطول قد إيه؟ فكّر في طوله والمادة وقد إيه سخن.",
      strategic: "احسب التغير في درجة الحرارة الأول.",
      procedural: "$\\Delta L = \\alpha L_0 \\Delta T$ مع $\\Delta T = 40\\,\\mathrm{K}$.",
      verification: "الناتج ملّيمترات قليلة — منطقي لفراغ بين قضبان؟",
    },
    homePrompt: "ليه غطا البرطمان الحديد بيتفتح أسهل لو حطيناه تحت مية سخنة؟",
    workbenchProblemId: "thermal_expansion_001",
  },
  {
    id: "phase-transitions",
    category: "thermal",
    title: "تحولات الحالة",
    tagline: "حرارة بتدخل… والحرارة ثابتة!",
    icon: "Snowflake",
    description:
      "وقت الانصهار أو الغليان، الحرارة اللي بتدخل مابترفعش درجة الحرارة — بتروح في كسر الروابط بين الجزيئات. عشان كده منحنى التسخين فيه «هضاب» أفقية. الحرارة دي اسمها الحرارة الكامنة.",
    famous: {
      title: "الحرارة الكامنة لجوزيف بلاك",
      who: "جوزيف بلاك",
      year: "حوالي 1761",
      text: "بلاك لاحظ إن التلج بيفضل عند $0^\\circ\\mathrm{C}$ وهو بيسيح رغم إنه بياخد حرارة، وإن المية بتفضل عند $100^\\circ\\mathrm{C}$ وهي بتغلي. سمّى الحرارة «المستخبية» دي الحرارة الكامنة.",
    },
    equation: { latex: "Q = mL", meaning: "حرارة تغيير الحالة = الكتلة × الحرارة الكامنة (من غير $\\Delta T$)." },
    workbench: {
      chain: ["Q_1 = mc_{ice}\\Delta T_1", "Q_2 = mL_f", "Q_3 = mc_{w}\\Delta T_3", "Q = Q_1 + Q_2 + Q_3"],
      checks: ["كل مرحلة بقانونها: $mc\\Delta T$ للتسخين و $mL$ للانصهار", "الحرارة النوعية للتلج غير المية", "مجموع موجب بالجول"],
    },
    mission: {
      title: "من تلجة لمية دافية",
      story: "عندك $0.5\\,\\mathrm{kg}$ تلج عند $-10^\\circ\\mathrm{C}$ وعايز توصله مية عند $20^\\circ\\mathrm{C}$. اعتبر $c_{ice} = 2100$ و $c_w = 4186\\,\\mathrm{J/(kg\\,K)}$ و $L_f = 3.34\\times10^5\\,\\mathrm{J/kg}$.",
      question: "إجمالي الحرارة المطلوبة؟",
      answer: { value: ICE.total, unit: "J", tolerance: 0.02 },
      unitHint: "مثال: 150000 J أو 150 kJ",
      wrongValues: [
        { value: ICE.warmIce + ICE.warmWater, ruleId: "phase-no-latent", errorType: "conceptual", prompt: "نسيت الهضبة! التلج بياخد حرارة وهو بيسيح من غير ما سخونته تتغير." },
        { value: ICE.melt, ruleId: "phase-only-melt", errorType: "procedural", prompt: "حسبت الانصهار بس. التلج لازم يسخن لـ $0^\\circ$ الأول، والمية تسخن بعدها." },
      ],
      solution: "Q = 10\\,500 + 167\\,000 + 41\\,860 = 219\\,360\\,\\mathrm{J}",
    },
    hints: {
      conceptual: "التلج هيعدّي بكام مرحلة؟ وفي أي مرحلة درجة الحرارة مش هتتغير؟",
      strategic: "قسّم المسألة لـ 3 مراحل واحسب حرارة كل واحدة.",
      procedural: "تسخين تلج $mc\\Delta T$، انصهار $mL_f$، تسخين مية $mc\\Delta T$، وبعدين اجمع.",
      verification: "أكبر جزء المفروض يكون الانصهار. لو مش كده، راجع.",
    },
    homePrompt: "ليه المية في الحلة بتفضل 100 درجة مهما عليّنا النار وهي بتغلي؟",
  },
  {
    id: "entropy",
    category: "thermal",
    title: "الإنتروبيا واتجاه الحرارة",
    tagline: "القانون التاني للديناميكا الحرارية",
    icon: "Shuffle",
    description:
      "الحرارة بتنتقل لوحدها من السخن للبارد، عمرها ما بترجع لوحدها. الإنتروبيا الكلية لنظام معزول بتزيد أو تفضل ثابتة. ده اللي بيدّي للزمن اتجاه.",
    famous: {
      title: "صياغة كلاوزيوس",
      who: "رودولف كلاوزيوس",
      year: "1850 – 1865",
      text: "كلاوزيوس صاغ إن «الحرارة مابتنتقلش لوحدها من جسم بارد لجسم أسخن»، وعرّف الإنتروبيا $\\Delta S = Q/T$. فنجان الشاي بيبرد في الأوضة، والأوضة عمرها ما تسخّنه.",
    },
    equation: { latex: "\\Delta S_{total} = -\\dfrac{Q}{T_h} + \\dfrac{Q}{T_c} > 0", meaning: "الخزان البارد بيكسب إنتروبيا أكتر من اللي السخن بيخسرها." },
    workbench: {
      chain: ["\\Delta S_h = -\\frac{Q}{T_h}", "\\Delta S_c = +\\frac{Q}{T_c}", "\\Delta S = \\Delta S_h + \\Delta S_c"],
      checks: ["إشارة كل حد (اللي بيدّي حرارة إشارته سالبة)", "درجات الحرارة بالكلفن", "$\\Delta S_{total} > 0$ كتحقق من الاتجاه"],
    },
    mission: {
      title: "حرارة من سخن لبارد",
      story: "$1000\\,\\mathrm{J}$ حرارة انتقلت من خزان عند $400\\,\\mathrm{K}$ لخزان عند $300\\,\\mathrm{K}$.",
      question: "التغير الكلي في الإنتروبيا؟",
      answer: { value: DS, unit: "J/K", tolerance: 0.02 },
      unitHint: "مثال: 0.5 J/K",
      wrongValues: [{ value: entropyOfHeatFlow(1000, 300, 400), ruleId: "entropy-sign", errorType: "conceptual", prompt: "الإشارة معكوسة: معناها إن الحرارة انتقلت لوحدها من البارد للسخن. ممكن؟" }],
      solution: "\\Delta S = -\\frac{1000}{400} + \\frac{1000}{300} = 0.833\\,\\mathrm{J/K}",
    },
    hints: {
      conceptual: "خزان خسر حرارة وخزان كسبها. الإنتروبيا بتتغير لكل واحد بإشارة إيه؟",
      strategic: "احسب $\\Delta S$ لكل خزان لوحده واجمع.",
      procedural: "$\\Delta S = -\\frac{Q}{T_h} + \\frac{Q}{T_c}$.",
      verification: "الناتج لازم يطلع موجب — ده بالظبط القانون التاني.",
    },
    homePrompt: "ليه الأوضة بتتكركب لوحدها، بس عمرها ما بتتوضب لوحدها؟",
  },
  {
    id: "wave-particle",
    category: "quantum",
    title: "ازدواجية الموجة والجسيم",
    tagline: "الإلكترون بيعمل هُدب تداخل",
    icon: "Waves",
    description:
      "الإلكترونات (وكل المادة) ليها طول موجي $\\lambda = h/p$. لو بعتناها واحد واحد على شقين، كل إلكترون بيوصل الشاشة كنقطة، بس مع الوقت النقط بتعمل هُدب تداخل — كأن كل إلكترون عدّى من الشقين.",
    famous: {
      title: "تجربة الشق المزدوج بالإلكترونات",
      who: "دي بروي (فكرة 1924)، دافيسون وجيرمر (1927)، تونومورا (1989)",
      year: "1924 – 1989",
      text: "تونومورا وفريقه بعتوا إلكترونات واحد واحد وصوّروا الهُدب وهي بتتكون نقطة نقطة — اتختارت من «أجمل تجربة في الفيزيا».",
    },
    equation: { latex: "\\lambda = \\dfrac{h}{p} = \\dfrac{h}{\\sqrt{2meV}}", meaning: "كل ما الإلكترون يتسارع بجهد أكبر، طوله الموجي يقصر." },
    workbench: {
      chain: ["eV = \\tfrac12 mv^2", "p = \\sqrt{2meV}", "\\lambda = \\frac{h}{p}"],
      checks: ["الفرق بين فوتون ($\\lambda = hc/E$) وجسيم كتلته مش صفر", "الأبعاد: $\\mathrm{J\\,s}/(\\mathrm{kg\\,m/s}) = \\mathrm{m}$", "الطول الموجي قريب من المسافات بين الذرات (تحقق فيزيائي)"],
    },
    mission: {
      title: "طول موجة إلكترون",
      story: "إلكترون اتسارع من السكون خلال فرق جهد $100\\,\\mathrm{V}$.",
      question: "احسب طوله الموجي (دي بروي).",
      answer: { value: LAMBDA_E, unit: "m", tolerance: 0.03 },
      unitHint: "مثال: 0.2 nm أو 2e-10 m",
      wrongValues: [{ value: (CONST.h * CONST.c) / (100 * CONST.e), ruleId: "dual-photon", errorType: "transfer", prompt: "استخدمت $\\lambda = hc/E$ — ده للفوتون اللي كتلته صفر. للإلكترون استخدم $\\lambda = h/p$." }],
      solution: "\\lambda = \\frac{6.63\\times10^{-34}}{\\sqrt{2(9.11\\times10^{-31})(1.6\\times10^{-19})(100)}} \\approx 0.123\\,\\mathrm{nm}",
    },
    hints: {
      conceptual: "أي جسيم بكمية حركة ليه طول موجي. الإلكترون اكتسب طاقة من فرق الجهد.",
      strategic: "احسب كمية الحركة من الطاقة، وبعدين الطول الموجي.",
      procedural: "$p = \\sqrt{2meV}$ ثم $\\lambda = h/p$.",
      verification: "الناتج لازم يطلع جزء من النانومتر — قد المسافات بين الذرات، وده سبب إن البلورات بتعمل حيود للإلكترونات.",
    },
    homePrompt: "لو الكورة ليها طول موجي، ليه عمرنا ما شفنا كورة بتعمل تداخل؟",
  },
  {
    id: "tunneling",
    category: "quantum",
    title: "النفق الكمّي",
    tagline: "عبور حاجز أعلى من طاقتك",
    icon: "Orbit",
    description:
      "كلاسيكيًا، جسيم طاقته أقل من ارتفاع حاجز عمره ما يعدّيه. كمّيًا، دالة الموجة بتضمحل جوه الحاجز بس مابتوصلش صفر، فيه احتمال صغير يظهر على الناحية التانية. الاحتمال حساس جدًا لعرض الحاجز.",
    famous: {
      title: "تحلل ألفا والدايود النفقي",
      who: "جورج جاموف (1928)، ليو إيساكي (1957)",
      year: "1928 · 1957",
      text: "جاموف فسّر إزاي جسيمات ألفا بتهرب من النواة رغم إن طاقتها أقل من الحاجز. إيساكي عمل الدايود النفقي وأخد نوبل 1973. النهارده النفق هو أساس ميكروسكوب المسح النفقي وذواكر الفلاش.",
    },
    equation: { latex: "T \\approx e^{-2\\kappa L},\\quad \\kappa = \\dfrac{\\sqrt{2m(U-E)}}{\\hbar}", meaning: "الاحتمال بيقل أُسّيًا مع عرض الحاجز $L$." },
    workbench: {
      chain: ["U - E = 4\\,\\mathrm{eV}", "\\kappa = \\frac{\\sqrt{2m(U-E)}}{\\hbar}", "T \\approx e^{-2\\kappa L}"],
      checks: ["الأُس لازم يكون من غير وحدات ($\\kappa L$)", "تحويل $\\mathrm{eV} \\to \\mathrm{J}$ و $\\mathrm{nm} \\to \\mathrm{m}$", "$0 < T < 1$"],
    },
    mission: {
      title: "إلكترون قدّام حاجز",
      story: "إلكترون طاقته $1\\,\\mathrm{eV}$ قدّام حاجز ارتفاعه $5\\,\\mathrm{eV}$ وعرضه $0.5\\,\\mathrm{nm}$.",
      question: "احسب احتمال النفق التقريبي $T$.",
      answer: { value: T_TUNNEL, unit: "", tolerance: 0.05 },
      unitHint: "رقم من غير وحدة، مثال: 2e-4",
      wrongValues: [{ value: Math.sqrt(T_TUNNEL), ruleId: "tunnel-factor-2", errorType: "mathematical", prompt: "الأُس فيه $2\\kappa L$ مش $\\kappa L$ — الاحتمال مربع سعة الموجة." }],
      solution: `\\kappa \\approx 1.02\\times10^{10}\\,\\mathrm{m^{-1}},\\quad T \\approx e^{-10.2} \\approx ${T_TUNNEL.toExponential(1).replace(/e([+-]\d+)/, "\\times10^{$1}")}`,
    },
    hints: {
      conceptual: "الموجة مابتقفش فجأة عند الحاجز. بتعمل إيه جوّاه؟",
      strategic: "احسب ثابت الاضمحلال $\\kappa$ الأول.",
      procedural: "حوّل $U - E$ لجول، احسب $\\kappa$، وبعدين $e^{-2\\kappa L}$.",
      verification: "الاحتمال لازم بين 0 و 1، وصغير. جرّب تضاعف العرض: الاحتمال هيتربّع تقريبًا!",
    },
    homePrompt: "لو الإلكترون ممكن «يعدّي من الحيطة»، ليه إحنا مابنعدّيش؟",
  },
  {
    id: "unruh",
    category: "quantum",
    title: "تأثير أونرو",
    tagline: "الفراغ بيسخن للمتسارع",
    icon: "Rocket",
    advanced: true,
    description:
      "تنبؤ نظري: راصد بيتسارع بعجلة ثابتة في الفراغ «يشوف» إشعاع حراري درجة حرارته تتناسب مع عجلته، والراصد الساكن مايشوفش حاجة. قريب في روحه من إشعاع هوكينج للثقوب السوداء. لسه ماتقاسش مباشرة لأن العجلة المطلوبة رهيبة.",
    famous: {
      title: "تنبؤ أونرو",
      who: "ويليام أونرو (بعد فولينج وديفيز)",
      year: "1976",
      text: "أونرو بيّن إن مفهوم «الجسيم» نفسه بيعتمد على الراصد. تجارب حديثة بتدوّر على أثره في معجلات الجسيمات ونظائر في المعامل.",
    },
    equation: { latex: "T = \\dfrac{\\hbar a}{2\\pi c k_B}", meaning: "درجة الحرارة تتناسب طرديًا مع العجلة — بس بمعامل صغير جدًا." },
    workbench: {
      chain: ["T = \\frac{\\hbar a}{2\\pi c k_B}", "\\frac{\\hbar}{2\\pi c k_B} \\approx 4\\times10^{-21}\\,\\mathrm{K\\,s^2/m}"],
      checks: ["الأبعاد بتطلع كلفن", "مقارنة: $a = 9.8$ بتدّي $\\sim 10^{-20}\\,\\mathrm{K}$ — مستحيل نقيسه", "ده تقدير تصوري (متقدّم · اختياري)"],
    },
    mission: {
      title: "قد إيه لازم نتسارع؟",
      story: "تخيّل جسيم بيتسارع بعجلة $a = 10^{20}\\,\\mathrm{m/s^2}$ (زي إلكترون في مجال ليزر فائق).",
      question: "احسب درجة حرارة أونرو.",
      answer: { value: T_UNRUH, unit: "K", tolerance: 0.03 },
      unitHint: "مثال: 0.2 K",
      wrongValues: [{ value: T_UNRUH * 2 * Math.PI, ruleId: "unruh-2pi", errorType: "mathematical", prompt: "ناقص $2\\pi$ في المقام." }],
      solution: "T = \\frac{1.05\\times10^{-34}\\times10^{20}}{2\\pi\\times3\\times10^{8}\\times1.38\\times10^{-23}} \\approx 0.41\\,\\mathrm{K}",
    },
    hints: {
      conceptual: "كل ما العجلة تزيد، الراصد «يحس» بفراغ أسخن. العلاقة طردية.",
      strategic: "عوّض مباشرة في قانون أونرو بالثوابت.",
      procedural: "$T = \\frac{\\hbar a}{2\\pi c k_B}$ — خلّي بالك إنها $\\hbar$ مش $h$.",
      verification: "حتى مع عجلة $10^{20}$ الحرارة أقل من كلفن! منطقي إن التأثير لسه ماتقاسش مباشرة.",
    },
    homePrompt: "هل ممكن حاجة تبان «سخنة» لحد و«باردة» لحد تاني في نفس المكان؟ ليه ده غريب؟",
  },
];

export function getPhenomenon(id: string): PhenomenonModule | undefined {
  return PHENOMENA.find((p) => p.id === id);
}
