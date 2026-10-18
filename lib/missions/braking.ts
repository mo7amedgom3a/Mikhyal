import type { Mission } from "@/lib/engine/types";
import { minDeceleration, stoppingDistance } from "@/lib/physics/braking";

const OBSTACLE = 30;

export const braking: Mission = {
  id: "braking",
  subject: "physics",
  order: 1,
  title: "وقّف العربية في الوقت المناسب",
  tagline: "الحركة بعجلة منتظمة · معادلات الحركة",
  icon: "CarFront",
  concepts: ["kinematics.v2", "kinematics.deceleration"],
  groundTruth:
    "Uniform deceleration: v^2 = u^2 - 2as (a = deceleration magnitude). With v=0: s = u^2/(2a), a_min = u^2/(2d). Challenge: u=20 m/s, obstacle at 30 m → a_min = 6.67 m/s^2. Speed is NOT constant while braking, so t = d/u is invalid.",
  challenge: {
    story:
      "عربية ماشية بسرعة 20 متر/ثانية، وفجأة السواق شاف عائق على بعد 30 متر قدامه.",
    goal: "لاقي أقل تباطؤ يخلّي العربية تقف قبل العائق — من غير ما الفرامل تكون أعنف من اللازم.",
  },
  prediction: {
    question:
      "لو العربية كانت ماشية بضعف السرعة (40 م/ث) وبنفس قوة الفرامل، مسافة الوقوف هتبقى قد إيه؟",
    options: [
      { id: "same", label: "نفس المسافة" },
      { id: "double", label: "الضعف" },
      { id: "quad", label: "4 أضعاف" },
      { id: "half", label: "النص" },
    ],
    correctId: "quad",
    reveal:
      "مسافة الوقوف بتتناسب مع مربع السرعة. ضعف السرعة = 4 أضعاف المسافة. هنشوف ده بعينينا في التجربة.",
    rules: [
      {
        choiceId: "double",
        ruleId: "braking-linear",
        errorType: "conceptual",
        prompt:
          "تفكير منطقي، بس العربية الأسرع مش بس بتقطع مسافة أكبر كل ثانية — كمان بتاخد وقت أطول عشان تقف. جرّب في التجربة: u=10 ثم u=20 بنفس التباطؤ، وقارن المسافتين.",
      },
      {
        choiceId: "same",
        ruleId: "braking-speed-irrelevant",
        errorType: "conceptual",
        prompt: "الفرامل نفسها، بس هل الحركة الأسرع محتاجة مسافة أكبر ولا لأ؟ جرّب سرعتين مختلفتين.",
      },
    ],
  },
  experiment: {
    sim: "braking",
    instruction:
      "غيّر التباطؤ (a) واضغط «شغّل». هدفك إن العربية تقف قبل العائق بأقل تباطؤ ممكن. لاحظ علامات المسار.",
    params: [
      { key: "u", label: "السرعة الابتدائية", symbol: "u", min: 5, max: 30, step: 1, unit: "m/s", default: 20 },
      { key: "a", label: "التباطؤ", symbol: "a", min: 1, max: 12, step: 0.1, unit: "m/s²", default: 4 },
    ],
    evaluate: ({ u, a }) => {
      const s = stoppingDistance(u, a);
      const need = minDeceleration(u, OBSTACLE);
      const readouts = [
        { label: "مسافة الوقوف", value: s.toFixed(1), unit: "m" },
        { label: "زمن الوقوف", value: (u / a).toFixed(2), unit: "s" },
        { label: "المسافة للعائق", value: String(OBSTACLE), unit: "m" },
      ];
      if (s > OBSTACLE)
        return { success: false, message: "العربية خبطت في العائق! محتاجين تباطؤ أكبر.", readouts };
      if (s < OBSTACLE * 0.9)
        return {
          success: false,
          message: "وقفت، بس الفرامل أعنف من اللازم. تقدر تقلل التباطؤ أكتر؟",
          readouts,
        };
      return {
        success: true,
        message: `ممتاز! أقل تباطؤ تقريبًا ${need.toFixed(2)} m/s². العربية وقفت على حافة العائق.`,
        readouts,
      };
    },
  },
  discovery: {
    prompt:
      "التجربة ورّتنا إن السرعة بتقل أثناء الفرملة. اكتب علاقة تربط السرعة الابتدائية u والنهائية v والتباطؤ a والمسافة s — من غير الزمن.",
    variables: { v: "السرعة النهائية", u: "السرعة الابتدائية", a: "مقدار التباطؤ", s: "المسافة" },
    targets: [
      { variable: "s", expr: "(u^2 - v^2) / (2*a)" },
      { variable: "s", expr: "(v^2 - u^2) / (2*a)" },
    ],
    domain: { u: [5, 30], v: [0, 20], a: [1, 10], s: [1, 50] },
    latex: "v^2 = u^2 - 2as",
    derivation: [
      "v = u - at \\;\\Rightarrow\\; t = \\dfrac{u - v}{a}",
      "s = \\dfrac{u + v}{2}\\, t",
      "s = \\dfrac{(u+v)(u-v)}{2a} = \\dfrac{u^2 - v^2}{2a}",
      "\\boxed{v^2 = u^2 - 2as}",
    ],
    clip: "/clips/BrakingDerivation.mp4",
    wrongRelations: [
      {
        relation: { variable: "s", expr: "(u^2 - v^2) / a" },
        ruleId: "braking-missing-2",
        errorType: "mathematical",
        prompt: "قربت جدًا! راجع المعامل: لما تحسب المسافة من متوسط السرعة (u+v)/2، الـ 2 بتروح فين؟",
      },
      {
        relation: { variable: "v", expr: "u - a*s" },
        ruleId: "braking-s-for-t",
        errorType: "procedural",
        prompt:
          "دي شكل v = u − at بس حطيت s مكان t. راجع الوحدات: a×s وحدتها m²/s² مش m/s. محتاج تربيع في مكان ما…",
      },
    ],
    forbiddenSymbols: {
      t: {
        ruleId: "braking-uses-time",
        errorType: "procedural",
        prompt:
          "استخدمت الزمن t، بس احنا مش عارفينه. عندك علاقة بتربط السرعة الابتدائية والنهائية والإزاحة والعجلة من غير ما تحتاج الزمن؟",
      },
    },
  },
  application: {
    problem:
      "قطر ماشي بسرعة 30 م/ث، والسواق فرمل بتباطؤ منتظم 2.5 م/ث². القطر هيقطع مسافة قد إيه لحد ما يقف؟",
    answer: { value: 180, unit: "m", tolerance: 0.02 },
    unitHint: "مثال: 120 m",
    wrongValues: [
      {
        value: 360,
        ruleId: "train-missing-2",
        errorType: "mathematical",
        prompt: "الرقم ضعف الإجابة. راجع المقام: s = u² ÷ (؟ × a).",
      },
      {
        value: 12,
        ruleId: "train-time-not-distance",
        errorType: "procedural",
        prompt: "12 دي الزمن اللي القطر بياخده عشان يقف (u ÷ a)، مش المسافة. المطلوب إيه بالظبط؟",
      },
      {
        value: 75,
        ruleId: "train-uniform-speed",
        errorType: "transfer",
        prompt: "يبدو إنك عاملت الحركة كأن السرعة ثابتة. زي العربية بالظبط: السرعة بتقل لحد الصفر.",
      },
    ],
    solver: {
      understand: "القطر بيبدأ بسرعة 30 م/ث وبيقف (v = 0). المطلوب المسافة s.",
      represent: "ارسم خط: u = 30 → v = 0، وسهم التباطؤ عكس الحركة.",
      model: "حركة بعجلة منتظمة، ومش عندنا زمن → نستخدم معادلة من غير t.",
      translate: "0 = u² − 2as  ⇒  s = u² ÷ 2a",
      verify: "الوحدة: (m/s)² ÷ (m/s²) = m . 180 متر منطقي لقطر سريع؟",
    },
    solution: "s = \\dfrac{u^2}{2a} = \\dfrac{30^2}{2 \\times 2.5} = 180\\,\\text{m}",
  },
  exam: {
    timeLimitSec: 180,
    questions: [
      {
        id: "b-q1",
        question:
          "سيارة تتحرك بسرعة 72 km/h، ضغط السائق على الفرامل فتوقفت بعد قطع 40 m. مقدار عجلة التباطؤ =",
        options: [
          { id: "a", label: "5 m/s²" },
          { id: "b", label: "10 m/s²" },
          { id: "c", label: "64.8 m/s²" },
          { id: "d", label: "1.8 m/s²" },
        ],
        correctId: "a",
        explanation: "72 km/h = 20 m/s ⇒ a = u²/2s = 400/80 = 5 m/s²",
        rules: [
          { choiceId: "b", ruleId: "bq1-missing-2", errorType: "mathematical", prompt: "نسيت المعامل 2 في 2as." },
          { choiceId: "c", ruleId: "bq1-units", errorType: "procedural", prompt: "لازم تحوّل km/h إلى m/s الأول (÷ 3.6)." },
          { choiceId: "d", ruleId: "bq1-ratio", errorType: "procedural", prompt: "قسمت السرعة على المسافة — دي مش علاقة صحيحة للعجلة." },
        ],
      },
      {
        id: "b-q2",
        question:
          "سيارتان A و B لهما نفس السرعة الابتدائية، وعجلة تباطؤ A ضعف عجلة تباطؤ B. النسبة بين مسافتي التوقف sA : sB =",
        options: [
          { id: "a", label: "1 : 2" },
          { id: "b", label: "2 : 1" },
          { id: "c", label: "1 : 4" },
          { id: "d", label: "1 : 1" },
        ],
        correctId: "a",
        explanation: "s = u²/2a ⇒ s تتناسب عكسيًا مع a ⇒ sA : sB = 1 : 2",
        rules: [
          { choiceId: "b", ruleId: "bq2-direct", errorType: "conceptual", prompt: "تباطؤ أكبر يعني فرامل أقوى — المسافة تزيد ولا تقل؟" },
          { choiceId: "c", ruleId: "bq2-square", errorType: "mathematical", prompt: "التربيع على السرعة u مش على a." },
          { choiceId: "d", ruleId: "bq2-none", errorType: "conceptual", prompt: "المسافة بتعتمد على التباطؤ، جرّبها في المعمل." },
        ],
      },
    ],
  },
  hints: {
    predict: ["فكّر: العربية الأسرع بتقطع مسافة أكبر كل ثانية، وكمان بتاخد وقت أطول عشان تقف."],
    experiment: [
      "ابدأ بتباطؤ كبير وقلّله تدريجيًا لحد ما العربية تقف عند حافة العائق.",
      "لاحظ علامات المسار: المسافة بين كل علامتين بتقل — يعني السرعة بتتغير.",
      "جرّب u = 20 و a قريب من 6.7",
    ],
    discover: [
      "محتاجين علاقة فيها v و u و a و s بس — من غير زمن.",
      "ابدأ من v = u − at وإن المسافة = متوسط السرعة × الزمن، واحذف t.",
      "الصيغة شكلها v² = u² − ?·a·s",
    ],
    apply: ["القطر في الآخر وقف، يعني v = 0.", "عوّض في v² = u² − 2as وطلّع s.", "s = u² ÷ (2a)"],
  },
  reflection: {
    summary:
      "اكتشفت إن مسافة الوقوف بتتناسب مع مربع السرعة، وإن لما الزمن مش معروف بنستخدم v² = u² − 2as.",
    nextMissionId: "newton",
  },
};
