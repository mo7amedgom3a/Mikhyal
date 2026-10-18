import type { Mission } from "@/lib/engine/types";
import { landingX, vertex } from "@/lib/physics/fountain";

export const fountain: Mission = {
  id: "fountain",
  subject: "math",
  order: 5,
  title: "صمّم مسار نافورة",
  tagline: "الدوال التربيعية · الجذور ورأس المنحنى",
  icon: "Droplets",
  concepts: ["algebra.quadratic.vertex", "algebra.quadratic.roots"],
  groundTruth:
    "Quadratic y = ax^2 + bx + c (a<0 opens down). Vertex x = -b/(2a), y = c - b^2/(4a). Roots via quadratic formula. Challenge: nozzle at origin (c=0), land at x=4, peak height 2 → a = -0.5, b = 2.",
  challenge: {
    story: "بنصمم نافورة في ميدان. المية بتطلع من فوهة على الأرض عند x = 0، ومسارها $y = ax^2 + bx + c$.",
    goal: "لازم المية تنزل جوه الحوض عند x = 4 m، وأعلى نقطة تكون 2 m بالظبط عشان ماتطرطش على الناس.",
  },
  prediction: {
    question: "لو زودنا b والباقي ثابت، أعلى نقطة في مسار المية هتتحرك إزاي؟",
    options: [
      { id: "upforward", label: "تعلى وتبعد لقدّام" },
      { id: "up", label: "تعلى بس في نفس المكان" },
      { id: "down", label: "توطى" },
      { id: "none", label: "مش هتتغير" },
    ],
    correctId: "upforward",
    reveal: "الرأس عند $x = -\\frac{b}{2a}$ و $y = -\\frac{b^2}{4a}$: زيادة $b$ بتزوّد الاتنين.",
    rules: [
      {
        choiceId: "up",
        ruleId: "fountain-vertex-fixed",
        errorType: "conceptual",
        prompt: "جرّب تحرك b في المعمل وتابع نقطة الرأس: بتتحرك أفقيًا كمان؟",
      },
      { choiceId: "down", ruleId: "fountain-down", errorType: "conceptual", prompt: "b هي ميل المسار عند الفوهة. لو المية طالعة بميل أكبر، هتعلى ولا توطى؟" },
      { choiceId: "none", ruleId: "fountain-none", errorType: "conceptual", prompt: "حرّك b وشوف المنحنى." },
    ],
  },
  experiment: {
    sim: "fountain",
    instruction: "حرّك a و b و c واضغط «شغّل». لاحظ الجذور (مكان نزول المية) والرأس (أعلى نقطة).",
    params: [
      { key: "a", label: "المعامل a", symbol: "a", min: -2, max: -0.1, step: 0.05, unit: "", default: -1 },
      { key: "b", label: "المعامل b", symbol: "b", min: 0.5, max: 5, step: 0.1, unit: "", default: 3 },
      { key: "c", label: "المعامل c (ارتفاع الفوهة)", symbol: "c", min: 0, max: 1, step: 0.1, unit: "m", default: 0 },
    ],
    evaluate: ({ a, b, c }) => {
      const v = vertex(a, b, c);
      const land = landingX(a, b, c);
      const readouts = [
        { label: "مكان النزول (الجذر)", value: land === null ? "—" : land.toFixed(2), unit: "m" },
        { label: "الرأس x", value: v.x.toFixed(2), unit: "m" },
        { label: "أقصى ارتفاع", value: v.y.toFixed(2), unit: "m" },
      ];
      const lands = land !== null && Math.abs(land - 4) <= 0.2;
      const peak = Math.abs(v.y - 2) <= 0.15;
      if (lands && peak) return { success: true, message: "المية نزلت في الحوض وأعلى نقطة 2 m. تصميم مثالي!", readouts };
      if (lands) return { success: false, message: "نزلت في الحوض، بس الارتفاع مش 2 m.", readouts };
      if (peak) return { success: false, message: "الارتفاع مظبوط، بس المية مانزلتش في الحوض.", readouts };
      return { success: false, message: "المية طرطشت برّه الحوض. جرّب تاني.", readouts };
    },
  },
  discovery: {
    prompt: "لاحظت إن الرأس دايمًا في نص المسافة بين الجذرين. لو $c = 0$، الجذور $0$ و $-\\frac{b}{a}$. اكتب الإحداثي الأفقي للرأس $h$ بدلالة $a$ و $b$.",
    variables: { h: "الإحداثي x للرأس", a: "المعامل a", b: "المعامل b" },
    targets: [{ variable: "h", expr: "-b / (2*a)" }],
    domain: { a: [-3, -0.2], b: [0.5, 5], h: [0.1, 10] },
    latex: "x_{\\text{vertex}} = -\\dfrac{b}{2a}",
    derivation: [
      "y = x(ax + b) \\Rightarrow x_1 = 0,\\; x_2 = -\\tfrac{b}{a}",
      "h = \\dfrac{x_1 + x_2}{2} = -\\dfrac{b}{2a}",
      "k = c - \\dfrac{b^2}{4a}",
    ],
    clip: "/clips/FountainVertex.mp4",
    wrongRelations: [
      {
        relation: { variable: "h", expr: "b / (2*a)" },
        ruleId: "vertex-sign",
        errorType: "mathematical",
        prompt: "علاقتك بتدّي h سالب لما a سالبة وb موجبة، بس الرأس قدّام الفوهة. راجع الإشارة.",
      },
      {
        relation: { variable: "h", expr: "-b / a" },
        ruleId: "vertex-is-root",
        errorType: "conceptual",
        prompt: "دي مكان نزول المية (الجذر التاني)، مش أعلى نقطة. الرأس فين بالنسبة للجذرين؟",
      },
    ],
    forbiddenSymbols: {
      c: {
        ruleId: "vertex-uses-c",
        errorType: "conceptual",
        prompt: "حرّك c في المعمل: الرأس بيتحرك أفقيًا ولا رأسيًا بس؟ h محتاجة c ولا لأ؟",
      },
    },
  },
  application: {
    problem: "كورة اتشاطت ومسارها $y = -0.25x^2 + 3x$ (بالمتر). أقصى ارتفاع هتوصله الكورة قد إيه؟",
    answer: { value: 9, unit: "m", tolerance: 0.02 },
    unitHint: "مثال: 4 m",
    wrongValues: [
      { value: 6, ruleId: "ball-x-not-y", errorType: "procedural", prompt: "6 هي مكان الرأس الأفقي x. المطلوب الارتفاع y عند النقطة دي." },
      { value: 12, ruleId: "ball-range", errorType: "transfer", prompt: "12 ده المدى (مكان نزول الكورة)، زي حوض النافورة. المطلوب أعلى نقطة." },
    ],
    solver: {
      understand: "مسار تربيعي مفتوح لتحت. المطلوب أقصى ارتفاع = y للرأس.",
      represent: "ارسم القطع المكافئ: يبدأ من 0 ويرجع للأرض، والرأس في النص.",
      model: "رأس الدالة التربيعية: $h = -\\dfrac{b}{2a}$ ثم $k = y(h)$.",
      translate: "$h = -\\dfrac{3}{2(-0.25)} = 6 \;\\Rightarrow\; k = -0.25(6)^2 + 3(6)$",
      verify: "الرأس في نص المسافة بين الجذرين $0$ و $12$ ✓.",
    },
    solution: "h = 6,\\quad k = -0.25(6)^2 + 3(6) = 9\\ \\text{m}",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "f-q1",
        question: "إحداثيات رأس منحنى الدالة $y = x^2 - 6x + 5$ هي:",
        options: [
          { id: "a", label: "(3, −4)" },
          { id: "b", label: "(−3, 32)" },
          { id: "c", label: "(6, 5)" },
          { id: "d", label: "(1, 0)" },
        ],
        correctId: "a",
        explanation: "$h = -\\dfrac{-6}{2} = 3,\\quad k = 9 - 18 + 5 = -4$",
        rules: [
          { choiceId: "b", ruleId: "fq1-sign", errorType: "mathematical", prompt: "$h = -\\frac{b}{2a} = -\\frac{(-6)}{2} = +3$. راجع الإشارة." },
          { choiceId: "c", ruleId: "fq1-coeffs", errorType: "procedural", prompt: "الرأس مش (−b, c)؛ استخدم h = −b/2a." },
          { choiceId: "d", ruleId: "fq1-root", errorType: "conceptual", prompt: "(1, 0) جذر، مش الرأس." },
        ],
      },
      {
        id: "f-q2",
        question: "عدد الجذور الحقيقية للمعادلة $x^2 + 2x + 5 = 0$ هو:",
        options: [
          { id: "a", label: "لا يوجد جذور حقيقية" },
          { id: "b", label: "جذران" },
          { id: "c", label: "جذر واحد" },
          { id: "d", label: "5 جذور" },
        ],
        correctId: "a",
        explanation: "المميز $\\Delta = b^2 - 4ac = 4 - 20 = -16 < 0$",
        rules: [
          { choiceId: "b", ruleId: "fq2-always-two", errorType: "conceptual", prompt: "مش كل معادلة تربيعية ليها جذرين حقيقيين — احسب المميز." },
          { choiceId: "c", ruleId: "fq2-one", errorType: "mathematical", prompt: "جذر واحد لما المميز = صفر بالظبط. احسبه." },
          { choiceId: "d", ruleId: "fq2-five", errorType: "procedural", prompt: "الدرجة التانية ليها جذرين على الأكثر." },
        ],
      },
    ],
  },
  hints: {
    predict: ["b بتتحكم في ميل المية وهي طالعة من الفوهة."],
    experiment: [
      "ابدأ بـ c = 0. مكان النزول = −b/a — خليه 4.",
      "أقصى ارتفاع $= -\\frac{b^2}{4a}$. خليه 2.",
      "جرّب a = −0.5 و b = 2",
    ],
    discover: ["الرأس في نص المسافة بين الجذرين.", "الجذرين $0$ و $-\\frac{b}{a}$.", "$h = \\dfrac{0 + \\left(-\\frac{b}{a}\\right)}{2}$"],
    apply: ["احسب h الأول.", "عوّض h في المعادلة عشان تطلع الارتفاع.", "$k = y(6)$"],
  },
  reflection: {
    summary: "اكتشفت إن رأس القطع المكافئ في نص المسافة بين الجذرين: h = −b/2a، وإن الجذور هي أماكن نزول المسار.",
    nextMissionId: "relativity",
  },
};
