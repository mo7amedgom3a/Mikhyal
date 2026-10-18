import type { Mission } from "@/lib/engine/types";
import { acceleration, distanceAt } from "@/lib/physics/newton";

const TARGET_D = 10;
const T = 4;

export const newton: Mission = {
  id: "newton",
  subject: "physics",
  order: 2,
  title: "اسحب أتقل حمولة بقوة محدودة",
  tagline: "قانون نيوتن الثاني · القوة والكتلة والعجلة",
  icon: "🚚",
  concepts: ["dynamics.newton2", "dynamics.netforce"],
  groundTruth:
    "Newton's second law: a = F_net / m. Challenge: winch max 3000 N, must move a load 10 m from rest in 4 s on a smooth surface → a = 2d/t^2 = 1.25 m/s^2 → m_max = 2400 kg. Heavier objects do NOT accelerate faster under the same force.",
  challenge: {
    story:
      "عندك ونش بيشد بقوة أقصاها 3000 نيوتن، وعربية نقل واقفة على أرض ملسا. لازم العربية تتحرك من السكون 10 متر في 4 ثواني بالظبط أو أقل.",
    goal: "أقصى حمولة (كتلة العربية مع الحمولة) تقدر تشدها وتحقق الهدف؟",
  },
  prediction: {
    question: "لو ثبّتنا قوة الشد وضاعفنا الكتلة، العجلة هتبقى؟",
    options: [
      { id: "double", label: "الضعف" },
      { id: "half", label: "النص" },
      { id: "same", label: "زي ما هي" },
      { id: "quarter", label: "الربع" },
    ],
    correctId: "half",
    reveal: "العجلة بتتناسب عكسيًا مع الكتلة عند ثبات القوة: ضعف الكتلة = نص العجلة.",
    rules: [
      {
        choiceId: "double",
        ruleId: "newton-heavier-faster",
        errorType: "conceptual",
        prompt: "الأتقل مش بيتسارع أسرع بنفس القوة. جرّب في المعمل: 1000 kg ثم 2000 kg بنفس القوة وقارن.",
      },
      {
        choiceId: "same",
        ruleId: "newton-force-only",
        errorType: "conceptual",
        prompt: "القوة ثابتة آه، بس هل الكتلة ملهاش دور؟ جرّب تزوّد الكتلة وشوف العربية هتعمل إيه.",
      },
      {
        choiceId: "quarter",
        ruleId: "newton-square",
        errorType: "mathematical",
        prompt: "مفيش تربيع هنا. قارن العجلة عند كتلتين وانت مثبّت القوة.",
      },
    ],
  },
  experiment: {
    sim: "newton",
    instruction: "غيّر قوة الشد والكتلة، واضغط «شغّل». العربية لازم تعدّي خط الـ 10 متر خلال 4 ثواني بأتقل حمولة ممكنة.",
    params: [
      { key: "F", label: "قوة الشد", symbol: "F", min: 500, max: 3000, step: 50, unit: "N", default: 3000 },
      { key: "m", label: "الكتلة", symbol: "m", min: 500, max: 4000, step: 100, unit: "kg", default: 1000 },
    ],
    evaluate: ({ F, m }) => {
      const a = acceleration(F, m);
      const d = distanceAt(T, a);
      const readouts = [
        { label: "العجلة", value: a.toFixed(2), unit: "m/s²" },
        { label: "المسافة في 4 ث", value: d.toFixed(1), unit: "m" },
      ];
      if (d < TARGET_D)
        return { success: false, message: "⏱️ العربية ماوصلتش للخط في الوقت. الحمولة تقيلة على القوة دي.", readouts };
      if (m < 2300)
        return { success: false, message: "✅ وصلت! بس تقدر تشد حمولة أتقل من كده؟", readouts };
      return { success: true, message: "🎯 أقصى حمولة تقريبًا 2400 kg بقوة 3000 N. ممتاز!", readouts };
    },
  },
  discovery: {
    prompt: "من تجاربك: العجلة بتزيد مع القوة وبتقل مع الكتلة. اكتب العلاقة بين a و F و m.",
    variables: { a: "العجلة", F: "محصلة القوة", m: "الكتلة" },
    targets: [{ variable: "a", expr: "F / m" }],
    domain: { F: [100, 5000], m: [10, 4000], a: [0.1, 10] },
    latex: "a = \\dfrac{F}{m} \\quad\\Longleftrightarrow\\quad F = ma",
    derivation: [
      "a \\propto F \\quad (m\\ \\text{ثابتة})",
      "a \\propto \\dfrac{1}{m} \\quad (F\\ \\text{ثابتة})",
      "\\boxed{F = ma}",
    ],
    wrongRelations: [
      {
        relation: { variable: "a", expr: "F * m" },
        ruleId: "newton-a-Fm",
        errorType: "conceptual",
        prompt: "يعني لو الكتلة زادت العجلة تزيد؟ ارجع للتجربة: إيه اللي حصل لما زودت الكتلة؟",
      },
      {
        relation: { variable: "a", expr: "m / F" },
        ruleId: "newton-a-mF",
        errorType: "mathematical",
        prompt: "النسبة مقلوبة. العجلة بتزيد مع مين وبتقل مع مين؟",
      },
    ],
    forbiddenSymbols: {
      g: {
        ruleId: "newton-uses-g",
        errorType: "representational",
        prompt: "الجاذبية رأسية، والحركة هنا أفقية على سطح أملس. ارسم القوى: إيه القوة اللي في اتجاه الحركة؟",
      },
    },
  },
  application: {
    problem:
      "صاروخ لعبة كتلته 0.5 kg، محركه بيدي قوة دفع 12 N لفوق. عجلة الصاروخ وهو طالع قد إيه؟ (g = 9.8 m/s²)",
    answer: { value: 14.2, unit: "m/s^2", tolerance: 0.02 },
    unitHint: "مثال: 3.5 m/s^2",
    wrongValues: [
      {
        value: 24,
        ruleId: "rocket-ignore-weight",
        errorType: "transfer",
        prompt:
          "في العربية مكانش في قوة تانية في اتجاه الحركة، بس هنا الحركة رأسية! ارسم القوى على الصاروخ: في قوة تانية بتشده لتحت؟",
      },
      {
        value: 33.8,
        ruleId: "rocket-add-weight",
        errorType: "representational",
        prompt: "الوزن اتجاهه لتحت والدفع لفوق. المحصلة بتتجمع ولا بتتطرح؟",
      },
    ],
    solver: {
      understand: "صاروخ طالع لفوق، عليه قوة دفع. المطلوب العجلة.",
      represent: "ارسم سهم الدفع 12 N لفوق وسهم الوزن mg لتحت.",
      model: "قانون نيوتن الثاني على المحصلة: F_net = ma.",
      translate: "F_net = 12 − 0.5 × 9.8 = 7.1 N  ⇒  a = F_net ÷ m",
      verify: "الوحدة N/kg = m/s² ✓. لو مكانش في وزن كانت هتبقى 24 — منطقي إن الإجابة أقل.",
    },
    solution: "a = \\dfrac{12 - 0.5 \\times 9.8}{0.5} = 14.2\\ \\text{m/s}^2",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "n-q1",
        question: "قوة مقدارها 20 N أثرت على جسم كتلته 4 kg موضوع على سطح أفقي أملس. العجلة التي يتحرك بها الجسم =",
        options: [
          { id: "a", label: "5 m/s²" },
          { id: "b", label: "80 m/s²" },
          { id: "c", label: "0.2 m/s²" },
          { id: "d", label: "16 m/s²" },
        ],
        correctId: "a",
        explanation: "a = F/m = 20/4 = 5 m/s²",
        rules: [
          { choiceId: "b", ruleId: "nq1-Fm", errorType: "conceptual", prompt: "ضربت القوة في الكتلة؛ العجلة بتقل مع الكتلة." },
          { choiceId: "c", ruleId: "nq1-mF", errorType: "mathematical", prompt: "قسمت الكتلة على القوة — النسبة مقلوبة." },
          { choiceId: "d", ruleId: "nq1-sub", errorType: "procedural", prompt: "طرح كميات بوحدات مختلفة (N و kg) مش ممكن." },
        ],
      },
      {
        id: "n-q2",
        question: "جسم يتحرك بسرعة ثابتة في خط مستقيم. محصلة القوى المؤثرة عليه =",
        options: [
          { id: "a", label: "صفر" },
          { id: "b", label: "في اتجاه الحركة" },
          { id: "c", label: "عكس اتجاه الحركة" },
          { id: "d", label: "تساوي وزنه" },
        ],
        correctId: "a",
        explanation: "سرعة ثابتة ⇒ a = 0 ⇒ F_net = ma = 0 (قانون نيوتن الأول).",
        rules: [
          { choiceId: "b", ruleId: "nq2-motion-needs-force", errorType: "conceptual", prompt: "الحركة بسرعة ثابتة مش محتاجة محصلة قوة — القوة بتغيّر السرعة." },
          { choiceId: "c", ruleId: "nq2-opposite", errorType: "conceptual", prompt: "لو المحصلة عكس الحركة، السرعة هتقل. هل السرعة بتتغير؟" },
          { choiceId: "d", ruleId: "nq2-weight", errorType: "representational", prompt: "الوزن قوة واحدة بس من القوى؛ المطلوب المحصلة." },
        ],
      },
    ],
  },
  hints: {
    predict: ["تخيّل إنك بتزق عربية سوبر ماركت فاضية وبعدين مليانة بنفس القوة."],
    experiment: [
      "ثبّت القوة على أقصى قيمة (3000 N) وزوّد الكتلة تدريجيًا.",
      "المسافة في 4 ثواني = ½ × a × 16. عشان توصل 10 m محتاج a ≥ 1.25 m/s².",
      "جرّب كتلة حوالي 2400 kg",
    ],
    discover: ["العجلة بتزيد مع القوة.", "العجلة بتقل لما الكتلة تزيد.", "a = ؟ ÷ ؟"],
    apply: ["في قوتين على الصاروخ مش واحدة.", "الوزن = m × g لتحت.", "المحصلة = الدفع − الوزن، وبعدين اقسم على الكتلة."],
  },
  reflection: {
    summary: "اكتشفت إن العجلة بتتناسب طرديًا مع محصلة القوة وعكسيًا مع الكتلة: F = ma — وإن المهم هو المحصلة مش قوة واحدة.",
    nextMissionId: "circular",
  },
};
