import type { Mission } from "@/lib/engine/types";
import { current, power } from "@/lib/physics/ohm";

export const FUSE_MAX = 2;

export const ohm: Mission = {
  id: "ohm",
  subject: "physics",
  order: 4,
  title: "نوّر اللمبة من غير ما الفيوز يضرب",
  tagline: "الكهربية · قانون أوم",
  icon: "Lightbulb",
  concepts: ["electricity.ohm", "electricity.series"],
  groundTruth:
    "Ohm's law: I = V/R. Power P = V^2/R. Challenge: 12 V battery, fuse rated 2 A → minimum R = 6 ohm for the brightest safe lamp. In a series circuit the current is the same everywhere; current is not 'used up'.",
  challenge: {
    story: "عندك بطارية 12 فولت ولمبة ومقاومة متغيرة، وفيوز بيتحمل 2 أمبير بس. لو التيار عدّى الحد، الفيوز بيضرب والدايرة تفصل.",
    goal: "خلّي اللمبة تنوّر أقوى ما يمكن من غير ما الفيوز يضرب.",
  },
  prediction: {
    question: "لو قللنا المقاومة للنص وفرق الجهد ثابت، شدة التيار هتبقى؟",
    options: [
      { id: "double", label: "الضعف" },
      { id: "half", label: "النص" },
      { id: "same", label: "زي ما هي" },
      { id: "quad", label: "4 أضعاف" },
    ],
    correctId: "double",
    reveal: "عند ثبات فرق الجهد، التيار بيتناسب عكسيًا مع المقاومة: نص المقاومة = ضعف التيار.",
    rules: [
      {
        choiceId: "half",
        ruleId: "ohm-direct",
        errorType: "conceptual",
        prompt: "المقاومة بتعمل إيه في التيار؟ بتسهّل مروره ولا بتعيقه؟ جرّب R = 12 ثم R = 6.",
      },
      {
        choiceId: "same",
        ruleId: "ohm-constant-current",
        errorType: "conceptual",
        prompt: "البطارية مش مصدر تيار ثابت — هي بتدي فرق جهد ثابت. جرّب تغيّر R وبص على الأميتر.",
      },
      { choiceId: "quad", ruleId: "ohm-square", errorType: "mathematical", prompt: "القدرة هي اللي فيها تربيع، مش التيار." },
    ],
  },
  experiment: {
    sim: "ohm",
    instruction: "غيّر المقاومة (وجرّب فرق الجهد)، واقفل المفتاح. لاحظ الأميتر وإضاءة اللمبة والفيوز.",
    params: [
      { key: "V", label: "فرق الجهد", symbol: "V", min: 3, max: 24, step: 1, unit: "V", default: 12 },
      { key: "R", label: "المقاومة", symbol: "R", min: 1, max: 30, step: 0.5, unit: "Ω", default: 15 },
    ],
    evaluate: ({ V, R }) => {
      const I = current(V, R);
      const readouts = [
        { label: "شدة التيار", value: I.toFixed(2), unit: "A" },
        { label: "القدرة", value: power(V, R).toFixed(1), unit: "W" },
        { label: "حد الفيوز", value: String(FUSE_MAX), unit: "A" },
      ];
      if (I > FUSE_MAX) return { success: false, message: "الفيوز ضرب! التيار أكبر من 2 A.", readouts };
      if (V !== 12)
        return { success: false, message: "آمن. بس البطارية في المهمة 12 V — رجّعها ولاقي أقل مقاومة.", readouts };
      if (I < FUSE_MAX * 0.9)
        return { success: false, message: "اللمبة منورة، بس ممكن تنور أكتر بأمان. قلّل المقاومة؟", readouts };
      return { success: true, message: "أقصى إضاءة آمنة! أقل مقاومة = 6 Ω.", readouts };
    },
  },
  discovery: {
    prompt: "التيار زاد لما زودت الجهد، وقلّ لما زودت المقاومة. اكتب العلاقة بين $I$ و $V$ و $R$.",
    variables: { I: "شدة التيار", V: "فرق الجهد", R: "المقاومة" },
    targets: [{ variable: "I", expr: "V / R" }],
    domain: { V: [1, 240], R: [1, 100], I: [0.1, 10] },
    latex: "I = \\dfrac{V}{R} \\quad\\Longleftrightarrow\\quad V = IR",
    derivation: [
      "I \\propto V \\quad (R\\ \\text{ثابتة})",
      "I \\propto \\dfrac{1}{R} \\quad (V\\ \\text{ثابت})",
      "\\boxed{V = IR}",
      "R_{min} = \\dfrac{V}{I_{max}} = \\dfrac{12}{2} = 6\\,\\Omega",
    ],
    clip: "/clips/OhmRelation.mp4",
    wrongRelations: [
      {
        relation: { variable: "I", expr: "V * R" },
        ruleId: "ohm-I-VR",
        errorType: "conceptual",
        prompt: "يعني مقاومة أكبر تدي تيار أكبر؟ ارجع للأميتر لما زودت R.",
      },
      {
        relation: { variable: "I", expr: "R / V" },
        ruleId: "ohm-I-RV",
        errorType: "mathematical",
        prompt: "النسبة مقلوبة. التيار بيزيد مع الجهد ولا مع المقاومة؟",
      },
    ],
    forbiddenSymbols: {},
  },
  application: {
    problem: "سخان كهربي شغال على 220 V، والفيوز بتاعه بيتحمل 10 A. أقل مقاومة ممكنة لسلك السخان؟",
    answer: { value: 22, unit: "ohm", tolerance: 0.02 },
    unitHint: "مثال: 15 ohm",
    wrongValues: [
      { value: 2200, ruleId: "heater-VI", errorType: "mathematical", prompt: "ضربت الجهد في التيار — ده بيدي القدرة (W) مش المقاومة." },
      { value: 0.04545, ruleId: "heater-IV", errorType: "mathematical", prompt: "النسبة مقلوبة: $R = \\frac{V}{I}$." },
    ],
    solver: {
      understand: "جهد ثابت 220 V وتيار أقصى 10 A. المطلوب أقل مقاومة.",
      represent: "دايرة بسيطة: مصدر — فيوز — مقاومة السخان.",
      model: "قانون أوم: V = IR. أقل R تقابل أكبر تيار مسموح.",
      translate: "$R_{min} = \\dfrac{V}{I_{max}}$",
      verify: "$\\mathrm{V/A} = \\Omega$ ✓ — نفس فكرة اللمبة: $\\frac{12}{2} = 6\\,\\Omega$.",
    },
    solution: "R_{min} = \\dfrac{220}{10} = 22\\ \\Omega",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "o-q1",
        question: "مقاومة 4 Ω وُصلت بفرق جهد 12 V. شدة التيار المار فيها =",
        options: [
          { id: "a", label: "3 A" },
          { id: "b", label: "48 A" },
          { id: "c", label: "0.33 A" },
          { id: "d", label: "16 A" },
        ],
        correctId: "a",
        explanation: "$I = \\dfrac{V}{R} = \\dfrac{12}{4} = 3\\,\\mathrm{A}$",
        rules: [
          { choiceId: "b", ruleId: "oq1-VR", errorType: "conceptual", prompt: "ضربت V في R؛ المقاومة بتقلل التيار." },
          { choiceId: "c", ruleId: "oq1-RV", errorType: "mathematical", prompt: "قسمت R على V — مقلوبة." },
          { choiceId: "d", ruleId: "oq1-add", errorType: "procedural", prompt: "جمع فولت وأوم مش ممكن — وحدات مختلفة." },
        ],
      },
      {
        id: "o-q2",
        question: "لمبتان متصلتان على التوالي مع بطارية. شدة التيار في اللمبة الأولى مقارنة بالثانية:",
        options: [
          { id: "a", label: "متساوية" },
          { id: "b", label: "الأولى أكبر" },
          { id: "c", label: "الثانية أكبر" },
          { id: "d", label: "تعتمد على ترتيب اللمبات" },
        ],
        correctId: "a",
        explanation: "في التوالي يمر نفس التيار في كل العناصر؛ التيار لا يُستهلك.",
        rules: [
          { choiceId: "b", ruleId: "oq2-consumed", errorType: "conceptual", prompt: "التيار مش بيتستهلك في اللمبة الأولى. الشحنات اللي بتدخل هي نفسها اللي بتخرج." },
          { choiceId: "c", ruleId: "oq2-accumulate", errorType: "conceptual", prompt: "الشحنات مش بتتراكم. في مسار واحد التيار واحد." },
          { choiceId: "d", ruleId: "oq2-order", errorType: "conceptual", prompt: "الترتيب في التوالي مش بيغير التيار." },
        ],
      },
    ],
  },
  hints: {
    predict: ["تخيل المقاومة زي ضيق في ماسورة مية: كل ما تضيق، المية بتعدي أكتر ولا أقل؟"],
    experiment: ["سيب V = 12 وقلّل R خطوة خطوة وراقب الأميتر.", "الفيوز بيضرب لما I > 2 A.", "جرّب R = 6 Ω"],
    discover: ["ضاعف V: التيار حصله إيه؟", "ضاعف R: التيار حصله إيه؟", "$I = \\dfrac{?}{?}$"],
    apply: ["نفس فكرة الفيوز في اللمبة.", "أقل مقاومة ⇔ أكبر تيار مسموح.", "$R = \\dfrac{V}{I}$"],
  },
  reflection: {
    summary: "اكتشفت قانون أوم $V = IR$، وإن الفيوز بيحدد أقل مقاومة آمنة $R_{min} = \\frac{V}{I_{max}}$.",
    nextMissionId: "fountain",
  },
};
