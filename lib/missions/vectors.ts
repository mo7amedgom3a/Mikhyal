import type { Mission } from "@/lib/engine/types";
import { add, fromPolar, magnitude, type Vec2 } from "@/lib/physics/vectors";

const TARGET = 10;

export const vectors: Mission = {
  id: "vectors",
  subject: "applied",
  order: 8,
  title: "قاطرتين بيسحبوا سفينة في قناة السويس",
  tagline: "المتجهات · محصلة قوتين",
  icon: "MoveUpRight",
  concepts: ["vectors.resultant", "vectors.components"],
  groundTruth:
    "Resultant of two forces F1, F2 with angle θ between them (law of cosines / parallelogram rule): R = sqrt(F1^2 + F2^2 + 2 F1 F2 cosθ). R = F1+F2 only when θ = 0; Pythagoras only when θ = 90°. Challenge: two 6 kN tugs at ±33.6° give R = 10 kN along the canal; lateral components must cancel.",
  challenge: {
    story: "سفينة حاويات ضخمة داخلة قناة السويس، وفي قاطرتين صغيرتين بيسحبوها بحبال. كل قاطرة أقصى قوة سحب ليها 6 كيلو نيوتن.",
    goal: "خلّي المحصلة 10 kN بالظبط وفي اتجاه محور القناة — وإلا السفينة هتخبط في الجنب.",
  },
  prediction: {
    question: "القاطرتين كل واحدة بتشد بـ 6 kN. لما نكبّر الزاوية بين الحبلين، المحصلة هتبقى؟",
    options: [
      { id: "less", label: "تقل" },
      { id: "more", label: "تزيد" },
      { id: "fixed", label: "ثابتة = 12 kN" },
      { id: "zero", label: "تبقى صفر" },
    ],
    correctId: "less",
    reveal: "كل ما الزاوية تكبر، جزء أكبر من كل قوة بيروح في اتجاه جانبي ويلغي التاني. المحصلة بتقل من 12 kN (زاوية صفر) لحد صفر (زاوية $180^\\circ$).",
    rules: [
      {
        choiceId: "fixed",
        ruleId: "vec-scalar-sum",
        errorType: "conceptual",
        prompt: "القوى متجهات مش أرقام بس. اسحب الحبلين بعيد عن بعض وبص على طول السهم الأصفر.",
      },
      { choiceId: "more", ruleId: "vec-more", errorType: "conceptual", prompt: "جرّب في المعمل: زاوية صغيرة ثم كبيرة. المحصلة زادت ولا قلت؟" },
      { choiceId: "zero", ruleId: "vec-zero", errorType: "conceptual", prompt: "المحصلة صفر بس لو القوتين متساويتين ومتضادتين تمامًا ($180^\\circ$)." },
    ],
  },
  experiment: {
    sim: "vectors",
    instruction: "اسحب رأس كل قوة (أو استخدم السلايدرات). لاحظ متوازي الأضلاع والسهم الأصفر (المحصلة). اضغط «شغّل» وشوف السفينة هتمشي فين.",
    params: [
      { key: "F1", label: "قوة القاطرة 1", symbol: "F₁", min: 0.5, max: 6, step: 0.1, unit: "kN", default: 5 },
      { key: "a1", label: "زاوية الحبل 1", symbol: "α₁", min: 0, max: 80, step: 0.5, unit: "°", default: 50 },
      { key: "F2", label: "قوة القاطرة 2", symbol: "F₂", min: 0.5, max: 6, step: 0.1, unit: "kN", default: 4 },
      { key: "a2", label: "زاوية الحبل 2", symbol: "α₂", min: 0, max: 80, step: 0.5, unit: "°", default: 20 },
    ],
    evaluate: ({ F1, a1, F2, a2 }) => {
      const t1 = fromPolar(F1, a1);
      const t2: Vec2 = [fromPolar(F2, a2)[0], -fromPolar(F2, a2)[1]];
      const R = add(t1, t2);
      const Rm = magnitude(R);
      const readouts = [
        { label: "المحصلة R", value: Rm.toFixed(2), unit: "kN" },
        { label: "الزاوية بين القوتين θ", value: (a1 + a2).toFixed(1), unit: "°" },
        { label: "المركبة الجانبية", value: R[1].toFixed(2), unit: "kN" },
      ];
      if (Math.abs(R[1]) > 0.3) return { success: false, message: "السفينة بتنحرف ناحية الجنب! المركبات الجانبية لازم تلغي بعض.", readouts };
      if (Math.abs(Rm - TARGET) > 0.3) return { success: false, message: Rm < TARGET ? "مستقيمة، بس المحصلة أقل من 10 kN. قرّب الحبلين من المحور أو زوّد القوة." : "مستقيمة، بس المحصلة أكبر من المطلوب.", readouts };
      return { success: true, message: `ممتاز! المحصلة ${Rm.toFixed(2)} kN على محور القناة بالظبط.`, readouts };
    },
  },
  discovery: {
    prompt: "قوتان $F_1$ و $F_2$ والزاوية بينهما $\\theta$. من متوازي الأضلاع (وقانون جيب التمام)، اكتب مقدار المحصلة $R$.",
    variables: { R: "المحصلة", F1: "القوة الأولى", F2: "القوة الثانية", θ: "الزاوية بين القوتين" },
    targets: [{ variable: "R", expr: "sqrt(F1^2 + F2^2 + 2*F1*F2*cos(θ))" }],
    domain: { F1: [1, 10], F2: [1, 10], θ: [0.2, 2.6], R: [0.1, 20] },
    latex: "R = \\sqrt{F_1^2 + F_2^2 + 2F_1F_2\\cos\\theta}",
    derivation: [
      "\\vec R = \\vec F_1 + \\vec F_2",
      "R^2 = \\vec R\\cdot\\vec R = F_1^2 + F_2^2 + 2\\,\\vec F_1\\cdot\\vec F_2",
      "\\vec F_1\\cdot\\vec F_2 = F_1F_2\\cos\\theta",
      "\\boxed{R = \\sqrt{F_1^2 + F_2^2 + 2F_1F_2\\cos\\theta}}",
    ],
    wrongRelations: [
      {
        relation: { variable: "R", expr: "sqrt(F1^2 + F2^2)" },
        ruleId: "vec-pythagoras",
        errorType: "conceptual",
        prompt: "فيثاغورس بيشتغل بس لما القوتين متعامدتين ($90^\\circ$). جرّب في المعمل زاوية $30^\\circ$ وقارن بالرقم اللي علاقتك بتديه.",
      },
      {
        relation: { variable: "R", expr: "sqrt(F1^2 + F2^2 - 2*F1*F2*cos(θ))" },
        ruleId: "vec-minus",
        errorType: "mathematical",
        prompt: "الإشارة السالبة بتاعة قانون جيب التمام في المثلث بتستخدم الزاوية **الداخلية** المقابلة للضلع. هنا $\\theta$ هي الزاوية **بين القوتين** — إيه علاقتها بالزاوية الداخلية؟",
      },
      {
        relation: { variable: "R", expr: "F1 + F2" },
        ruleId: "vec-add-magnitudes",
        errorType: "conceptual",
        prompt: "جمع المقادير بيصح بس لو القوتين في نفس الاتجاه ($\\theta = 0$). القوى متجهات.",
      },
    ],
    forbiddenSymbols: {},
  },
  application: {
    problem: "قوتان مقدارهما 6 N و 8 N تؤثران في نقطة، والزاوية بينهما $60^\\circ$. أوجد مقدار المحصلة.",
    answer: { value: 12.17, unit: "N", tolerance: 0.01 },
    unitHint: "مثال: 9.5 N",
    wrongValues: [
      { value: 10, ruleId: "app-pyth", errorType: "transfer", prompt: "ده فيثاغورس — بيصح بس لما الزاوية $90^\\circ$. هنا الزاوية $60^\\circ$." },
      { value: 14, ruleId: "app-sum", errorType: "conceptual", prompt: "جمعت المقادير كأن القوتين في نفس الاتجاه." },
      { value: 7.21, ruleId: "app-minus", errorType: "mathematical", prompt: "استخدمت $-2F_1F_2\\cos\\theta$. مع الزاوية بين القوتين الإشارة موجبة." },
    ],
    solver: {
      understand: "قوتان معلومتان والزاوية بينهما. المطلوب مقدار المحصلة.",
      represent: "ارسم القوتين من نقطة واحدة وكمّل متوازي الأضلاع؛ المحصلة هي القطر.",
      model: "قاعدة متوازي الأضلاع: $R^2 = F_1^2 + F_2^2 + 2F_1F_2\\cos\\theta$.",
      translate: "$R = \\sqrt{36 + 64 + 2(6)(8)\\cos 60^\\circ} = \\sqrt{148}$",
      verify: "المحصلة لازم تكون بين $|F_1 - F_2| = 2$ و $F_1 + F_2 = 14$ ✓.",
    },
    solution: "R = \\sqrt{6^2 + 8^2 + 2(6)(8)\\cos 60^\\circ} = \\sqrt{148} \\approx 12.17\\ \\text{N}",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "v-q1",
        question: "قوتان مقدارهما 3 N و 4 N متعامدتان. مقدار المحصلة =",
        options: [
          { id: "a", label: "5 N" },
          { id: "b", label: "7 N" },
          { id: "c", label: "1 N" },
          { id: "d", label: "12 N" },
        ],
        correctId: "a",
        explanation: "$\\theta = 90^\\circ \\Rightarrow \\cos\\theta = 0 \\Rightarrow R = \\sqrt{9 + 16} = 5\\,\\mathrm{N}$",
        rules: [
          { choiceId: "b", ruleId: "vq1-sum", errorType: "conceptual", prompt: "7 = 3 + 4 بيصح بس لو القوتين في نفس الاتجاه." },
          { choiceId: "c", ruleId: "vq1-diff", errorType: "conceptual", prompt: "1 = 4 − 3 بيصح بس لو القوتين متضادتين." },
          { choiceId: "d", ruleId: "vq1-product", errorType: "mathematical", prompt: "ضربت المقدارين؛ المحصلة مش حاصل ضرب." },
        ],
      },
      {
        id: "v-q2",
        question: "قوتان متساويتان مقدار كل منهما $F$ والزاوية بينهما $120^\\circ$. مقدار المحصلة =",
        options: [
          { id: "a", label: "$F$" },
          { id: "b", label: "$2F$" },
          { id: "c", label: "$F\\sqrt{3}$" },
          { id: "d", label: "$0$" },
        ],
        correctId: "a",
        explanation: "$R^2 = F^2 + F^2 + 2F^2\\cos 120^\\circ = 2F^2 - F^2 = F^2 \\Rightarrow R = F$",
        rules: [
          { choiceId: "b", ruleId: "vq2-sum", errorType: "conceptual", prompt: "$2F$ لما الزاوية صفر بس." },
          { choiceId: "c", ruleId: "vq2-60", errorType: "mathematical", prompt: "$F\\sqrt{3}$ هي المحصلة عند $60^\\circ$. راجع إشارة $\\cos 120^\\circ$." },
          { choiceId: "d", ruleId: "vq2-zero", errorType: "conceptual", prompt: "المحصلة صفر عند $180^\\circ$ بس." },
        ],
      },
    ],
  },
  hints: {
    predict: ["تخيّل حبلين بيشدوا صندوق: لو الحبلين جنب بعض ولو مفتوحين على الآخر."],
    experiment: [
      "خلّي القوتين متساويتين والزاويتين متساويتين — المركبات الجانبية هتلغي بعض.",
      "كل قاطرة بتساهم بـ $F\\cos\\alpha$ في اتجاه القناة. محتاجين المجموع 10.",
      "جرّب $F_1 = F_2 = 6$ و $\\alpha \\approx 33.5^\\circ$.",
    ],
    discover: ["المحصلة هي قطر متوازي الأضلاع.", "قانون جيب التمام في المثلث اللي فيه $F_1$ و $F_2$ و $R$.", "$R^2 = F_1^2 + F_2^2 + 2F_1F_2\\cos\\theta$"],
    apply: ["$\\cos 60^\\circ = \\frac{1}{2}$.", "عوّض في قاعدة متوازي الأضلاع.", "$R = \\sqrt{148}$"],
  },
  reflection: {
    sandbox: "forces",
    summary: "اكتشفت إن القوى بتتجمع كمتجهات: $R = \\sqrt{F_1^2 + F_2^2 + 2F_1F_2\\cos\\theta}$، وإن المركبات الجانبية لازم تلغي بعض عشان الحركة تبقى مستقيمة.",
    nextMissionId: "statics",
  },
};
