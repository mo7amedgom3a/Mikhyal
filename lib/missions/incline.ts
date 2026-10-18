import type { Mission } from "@/lib/engine/types";
import { frictionAngle, slides, weightComponents } from "@/lib/physics/incline";

export const incline: Mission = {
  id: "incline",
  subject: "applied",
  order: 11,
  title: "إمتى الصندوق يتزحلق على المنحدر؟",
  tagline: "الاستاتيكا · تحليل القوى والاحتكاك على مستوى مائل",
  icon: "Package",
  concepts: ["statics.incline", "statics.friction"],
  groundTruth:
    "Block on a rough incline at θ: weight resolves into mg sinθ down the slope and mg cosθ into it; normal reaction N = mg cosθ; maximum static friction μN. The block is on the point of sliding when mg sinθ = μ mg cosθ, i.e. μ = tanθ (angle of friction). Mass cancels. Challenge: μ = 0.4 → steepest safe angle tan⁻¹(0.4) ≈ 21.8°.",
  challenge: {
    story: "شركة نقل بتصمم منحدر خشب لتنزيل صناديق السيراميك من العربية. معامل الاحتكاك بين الصندوق والخشب 0.4. لو المنحدر شديد، الصناديق هتتزحلق وتتكسر.",
    goal: "لاقي أقصى زاوية للمنحدر الصناديق تفضل عندها ثابتة.",
  },
  prediction: {
    question: "صندوقين من نفس المادة، واحد كتلته ضعف التاني. لما نزوّد ميل المنحدر بالتدريج، مين هيتزحلق الأول؟",
    options: [
      { id: "both", label: "الاتنين عند نفس الزاوية" },
      { id: "heavy", label: "التقيل الأول" },
      { id: "light", label: "الخفيف الأول" },
      { id: "never", label: "محدش هيتزحلق" },
    ],
    correctId: "both",
    reveal: "الصندوق التقيل بيتشد لتحت أكتر، بس كمان بيضغط على المنحدر أكتر فالاحتكاك بيزيد بنفس النسبة. الكتلة بتختصر!",
    rules: [
      {
        choiceId: "heavy",
        ruleId: "incline-heavy-first",
        errorType: "conceptual",
        prompt: "التقيل بيتشد لتحت أكتر — بس الاحتكاك عليه كمان أكبر. جرّب في المعمل: غيّر الكتلة وشوف زاوية الانزلاق بتتغير ولا لأ.",
      },
      { choiceId: "light", ruleId: "incline-light-first", errorType: "conceptual", prompt: "جرّب كتلتين مختلفتين في المعمل وقارن زاوية بداية الانزلاق." },
      { choiceId: "never", ruleId: "incline-never", errorType: "conceptual", prompt: "زوّد الزاوية لحد $45^\\circ$ وشوف." },
    ],
  },
  experiment: {
    sim: "incline",
    instruction: "اسحب قمة المنحدر لتغيير الزاوية، وراقب مخطط القوى. اضغط «شغّل» تشوف الصندوق هيتزحلق ولا يفضل ثابت. جرّب تغيّر الكتلة كمان.",
    params: [
      { key: "theta", label: "زاوية الميل", symbol: "θ", min: 5, max: 45, step: 0.5, unit: "°", default: 30 },
      { key: "mu", label: "معامل الاحتكاك", symbol: "μ", min: 0.1, max: 0.8, step: 0.05, unit: "", default: 0.4 },
      { key: "m", label: "كتلة الصندوق", symbol: "m", min: 1, max: 20, step: 1, unit: "kg", default: 5 },
    ],
    evaluate: ({ theta, mu, m }) => {
      const { along, normal } = weightComponents(m, theta);
      const readouts = [
        { label: "القوة لأسفل المنحدر mg sinθ", value: along.toFixed(1), unit: "N" },
        { label: "أقصى احتكاك μN", value: (mu * normal).toFixed(1), unit: "N" },
        { label: "tan θ", value: Math.tan((theta * Math.PI) / 180).toFixed(3) },
      ];
      const slip = slides(theta, mu);
      if (slip) return { success: false, message: "الصندوق اتزحلق! القوة لأسفل المنحدر أكبر من أقصى احتكاك.", readouts };
      if (Math.abs(mu - 0.4) > 1e-9) return { success: false, message: "ثابت. بس معامل احتكاك الخشب في المهمة 0.4 — رجّعه ولاقي أقصى زاوية.", readouts };
      if (theta < frictionAngle(mu) - 0.6) return { success: false, message: "ثابت، بس المنحدر ممكن يبقى أشد شوية.", readouts };
      return { success: true, message: `ممتاز! عند $${theta}^\\circ$ الصندوق على وشك الانزلاق بالظبط.`, readouts };
    },
  },
  discovery: {
    prompt: "عند بداية الانزلاق: القوة لأسفل المنحدر = أقصى احتكاك، يعني $mg\\sin\\theta = \\mu\\, mg\\cos\\theta$. اكتب $\\mu$ بدلالة زاوية الانزلاق $\\theta$.",
    variables: { μ: "معامل الاحتكاك", θ: "زاوية بداية الانزلاق" },
    targets: [{ variable: "μ", expr: "tan(θ)" }],
    domain: { θ: [0.1, 1.2], μ: [0.05, 3] },
    latex: "\\mu = \\tan\\theta",
    derivation: [
      "N = mg\\cos\\theta",
      "mg\\sin\\theta = \\mu N = \\mu\\, mg\\cos\\theta",
      "\\boxed{\\mu = \\tan\\theta}",
      "\\theta_{max} = \\tan^{-1}(0.4) \\approx 21.8^\\circ",
    ],
    wrongRelations: [
      {
        relation: { variable: "μ", expr: "sin(θ)" },
        ruleId: "incline-sin",
        errorType: "conceptual",
        prompt: "$\\mu$ هو نسبة الاحتكاك للقوة العمودية $N = mg\\cos\\theta$، مش للوزن كله. قسّم الطرفين على $mg\\cos\\theta$.",
      },
      {
        relation: { variable: "μ", expr: "cos(θ)" },
        ruleId: "incline-cos",
        errorType: "conceptual",
        prompt: "علاقتك بتقول إن المنحدر الأشد يحتاج احتكاك أقل — جرّب في المعمل.",
      },
      {
        relation: { variable: "μ", expr: "1 / tan(θ)" },
        ruleId: "incline-cot",
        errorType: "mathematical",
        prompt: "النسبة مقلوبة. $\\frac{\\sin\\theta}{\\cos\\theta}$ = ؟",
      },
    ],
    forbiddenSymbols: {},
  },
  application: {
    problem: "طالب حط كتاب على لوح خشب ورفع طرف اللوح بالتدريج. الكتاب بدأ يتزحلق لما زاوية ميل اللوح وصلت $35^\\circ$. أوجد معامل الاحتكاك السكوني بين الكتاب والخشب.",
    answer: { value: 0.7, unit: "", tolerance: 0.01 },
    unitHint: "رقم من غير وحدة، مثال: 0.45",
    wrongValues: [
      { value: 0.5736, ruleId: "book-sin", errorType: "conceptual", prompt: "ده $\\sin 35^\\circ$. عند بداية الانزلاق $\\mu = \\tan\\theta$." },
      { value: 0.8192, ruleId: "book-cos", errorType: "conceptual", prompt: "ده $\\cos 35^\\circ$. راجع: $mg\\sin\\theta = \\mu\\,mg\\cos\\theta$." },
      { value: 0.4738, ruleId: "book-radians", errorType: "procedural", prompt: "الآلة الحاسبة على RAD! حوّلها لـ DEG." },
      { value: 1.428, ruleId: "book-cot", errorType: "mathematical", prompt: "ده $\\frac{1}{\\tan 35^\\circ}$ — النسبة مقلوبة." },
    ],
    solver: {
      understand: "الكتاب على وشك الانزلاق عند $35^\\circ$. المطلوب $\\mu$.",
      represent: "ارسم الكتاب على المستوى: $W$ لتحت، $N$ عمودي على السطح، $f$ لأعلى المستوى.",
      model: "اتزان على وشك الحركة: الاحتكاك وصل أقصاه $\\mu N$.",
      translate: "$\\mu = \\tan 35^\\circ$",
      verify: "$\\mu < 1$ لأن الزاوية أقل من $45^\\circ$ ✓ — والكتلة مش محتاجينها.",
    },
    solution: "\\mu = \\tan 35^\\circ \\approx 0.70",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "i-q1",
        question: "جسم موضوع على مستوى خشن يميل على الأفقي بزاوية $30^\\circ$ وكان على وشك الانزلاق. معامل الاحتكاك السكوني =",
        options: [
          { id: "a", label: "$\\frac{1}{\\sqrt{3}} \\approx 0.577$" },
          { id: "b", label: "0.5" },
          { id: "c", label: "0.866" },
          { id: "d", label: "$\\sqrt{3} \\approx 1.73$" },
        ],
        correctId: "a",
        explanation: "$\\mu = \\tan 30^\\circ = \\dfrac{1}{\\sqrt{3}}$",
        rules: [
          { choiceId: "b", ruleId: "iq1-sin", errorType: "conceptual", prompt: "$0.5 = \\sin 30^\\circ$؛ الصح $\\tan 30^\\circ$." },
          { choiceId: "c", ruleId: "iq1-cos", errorType: "conceptual", prompt: "$0.866 = \\cos 30^\\circ$." },
          { choiceId: "d", ruleId: "iq1-cot", errorType: "mathematical", prompt: "$\\sqrt{3} = \\cot 30^\\circ$ — مقلوب الإجابة." },
        ],
      },
      {
        id: "i-q2",
        question: "إذا ضاعفنا كتلة الجسم على نفس المستوى الخشن، فإن زاوية بداية الانزلاق:",
        options: [
          { id: "a", label: "لا تتغير" },
          { id: "b", label: "تزداد" },
          { id: "c", label: "تقل" },
          { id: "d", label: "تتضاعف" },
        ],
        correctId: "a",
        explanation: "$\\tan\\theta = \\mu$ — الكتلة لا تظهر في العلاقة.",
        rules: [
          { choiceId: "b", ruleId: "iq2-more", errorType: "conceptual", prompt: "الاحتكاك والقوة لأسفل الاتنين بيتضاعفوا مع الكتلة." },
          { choiceId: "c", ruleId: "iq2-less", errorType: "conceptual", prompt: "التقيل مش بيتزحلق الأول — الكتلة بتختصر." },
          { choiceId: "d", ruleId: "iq2-double", errorType: "conceptual", prompt: "الزاوية بتعتمد على $\\mu$ بس." },
        ],
      },
    ],
  },
  hints: {
    predict: ["الصندوق التقيل بيتشد لتحت أكتر، بس كمان بيضغط على الخشب أكتر."],
    experiment: ["ثبّت $\\mu = 0.4$ وزوّد الزاوية لحد ما الصندوق يتزحلق.", "قارن $\\tan\\theta$ في القراءات بـ $\\mu$ عند بداية الانزلاق.", "جرّب $\\theta \\approx 21.5^\\circ$."],
    discover: ["عند بداية الانزلاق: $mg\\sin\\theta = \\mu\\,mg\\cos\\theta$.", "اختصر $mg$ من الطرفين.", "$\\frac{\\sin\\theta}{\\cos\\theta}$ = ؟"],
    apply: ["الكتاب على وشك الانزلاق ← $\\mu = \\tan\\theta$.", "الآلة الحاسبة على DEG.", "$\\mu = \\tan 35^\\circ$"],
  },
  reflection: {
    summary: "اكتشفت إن زاوية الانزلاق بتحقق $\\mu = \\tan\\theta$ (زاوية الاحتكاك)، وإن الكتلة بتختصر — فالتصميم بيعتمد على نوع السطح بس.",
  },
};
