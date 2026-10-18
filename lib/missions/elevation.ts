import type { Mission } from "@/lib/engine/types";
import { heightFromAngle } from "@/lib/physics/trig";

const TOWER = 187;

export const elevation: Mission = {
  id: "elevation",
  subject: "applied",
  order: 7,
  title: "قيس برج القاهرة من غير ما تطلعه",
  tagline: "حساب المثلثات · زاوية الارتفاع",
  icon: "Triangle",
  concepts: ["trig.tangent", "trig.elevation"],
  groundTruth:
    "Angle of elevation: for an observer at horizontal distance d from the base, the height reached by the line of sight is h = d·tanθ (opposite = adjacent × tan). Cairo Tower is 187 m tall. Doubling d does not halve θ (tan is non-linear). Calculators must be in degree mode.",
  challenge: {
    story: "برج القاهرة طوله 187 متر. مهندس مساحة واقف على الأرض ومعاه جهاز بيقيس الزاوية بس (ثيودوليت) وشريط قياس.",
    goal: "صوّب خط النظر على قمة البرج من مسافات مختلفة، واكتشف إزاي الزاوية والمسافة بيحددوا الارتفاع.",
  },
  prediction: {
    question: "لو بعدت عن البرج ضعف المسافة، زاوية الارتفاع لقمته هتبقى؟",
    options: [
      { id: "half", label: "نص الزاوية بالظبط" },
      { id: "less", label: "أقل، بس مش النص بالظبط" },
      { id: "same", label: "نفس الزاوية" },
      { id: "double", label: "ضعف الزاوية" },
    ],
    correctId: "less",
    reveal: "الزاوية بتقل، بس العلاقة مش خطية: اللي بيتناسب مع المسافة هو $\\tan\\theta$ مش $\\theta$ نفسها.",
    rules: [
      {
        choiceId: "half",
        ruleId: "elev-linear",
        errorType: "conceptual",
        prompt: "جرّب: صوّب من 100 m وبعدين من 200 m وقارن الزاويتين. هل الثانية نص الأولى بالظبط؟",
      },
      { choiceId: "same", ruleId: "elev-same", errorType: "conceptual", prompt: "لما تبعد، بتبص لفوق أكتر ولا أقل؟ جرّب في المعمل." },
      { choiceId: "double", ruleId: "elev-double", errorType: "conceptual", prompt: "كل ما تقرّب من البرج بترفع راسك أكتر. وكل ما تبعد؟" },
    ],
  },
  experiment: {
    sim: "elevation",
    instruction: "اسحب الراصد لأي مسافة، واسحب خط النظر لحد ما يلمس قمة البرج بالظبط، وبعدين اضغط «شغّل». جرّب من أكتر من مسافة.",
    params: [
      { key: "d", label: "المسافة عن البرج", symbol: "d", min: 50, max: 400, step: 1, unit: "m", default: 150 },
      { key: "theta", label: "زاوية الارتفاع", symbol: "θ", min: 5, max: 80, step: 0.1, unit: "°", default: 30 },
    ],
    evaluate: ({ d, theta }) => {
      const h = heightFromAngle(d, theta);
      const readouts = [
        { label: "زاوية الارتفاع", value: theta.toFixed(1), unit: "°" },
        { label: "المسافة الأفقية", value: d.toFixed(0), unit: "m" },
        { label: "tan θ", value: Math.tan((theta * Math.PI) / 180).toFixed(3) },
      ];
      if (Math.abs(h - TOWER) <= 3) {
        return { success: true, message: `خط النظر لمس القمة! من ${d} m الزاوية ${theta.toFixed(1)}°. جرّب مسافة تانية وقارن.`, readouts };
      }
      return { success: false, message: h > TOWER ? "خط النظر عدّى فوق القمة. قلّل الزاوية." : "خط النظر خبط في جسم البرج تحت القمة. زوّد الزاوية.", readouts };
    },
  },
  discovery: {
    prompt: "في المثلث القائم: البرج هو الضلع المقابل للزاوية $\\theta$، والمسافة $d$ هي الضلع المجاور. اكتب الارتفاع $h$ بدلالة $d$ و $\\theta$.",
    variables: { h: "الارتفاع", d: "المسافة الأفقية", θ: "زاوية الارتفاع" },
    targets: [{ variable: "h", expr: "d * tan(θ)" }],
    domain: { d: [10, 400], θ: [0.1, 1.3], h: [1, 500] },
    latex: "h = d\\,\\tan\\theta",
    derivation: [
      "\\tan\\theta = \\dfrac{\\text{المقابل}}{\\text{المجاور}} = \\dfrac{h}{d}",
      "\\boxed{h = d\\,\\tan\\theta}",
      "187 = d\\,\\tan\\theta \;\\Rightarrow\; \\theta = \\tan^{-1}\\!\\left(\\dfrac{187}{d}\\right)",
    ],
    wrongRelations: [
      {
        relation: { variable: "h", expr: "d * sin(θ)" },
        ruleId: "elev-sin",
        errorType: "conceptual",
        prompt: "$\\sin\\theta$ بيربط المقابل بالوتر (خط النظر نفسه)، بس احنا عارفين المسافة الأفقية $d$ — المجاور. أنهي نسبة بتربط المقابل بالمجاور؟",
      },
      {
        relation: { variable: "h", expr: "d / tan(θ)" },
        ruleId: "elev-inverse",
        errorType: "mathematical",
        prompt: "النسبة مقلوبة. لو $\\tan\\theta = \\frac{h}{d}$، يبقى $h$ = ؟",
      },
      {
        relation: { variable: "h", expr: "d * cos(θ)" },
        ruleId: "elev-cos",
        errorType: "conceptual",
        prompt: "$\\cos\\theta$ بيربط المجاور بالوتر. ارسم المثلث وحدد: البرج مقابل الزاوية ولا مجاور لها؟",
      },
    ],
    forbiddenSymbols: {},
  },
  application: {
    problem: "مركب في البحر على بعد 200 m من منارة الإسكندرية الجديدة، والبحّار قاس زاوية ارتفاع قمتها $12^\\circ$. ارتفاع المنارة كام متر؟",
    answer: { value: 42.51, unit: "m", tolerance: 0.01 },
    unitHint: "مثال: 35 m",
    wrongValues: [
      { value: 41.58, ruleId: "light-sin", errorType: "conceptual", prompt: "استخدمت $\\sin$. المسافة 200 m أفقية (مجاور)، يبقى النسبة اللي محتاجها $\\tan$." },
      { value: 195.63, ruleId: "light-cos", errorType: "conceptual", prompt: "دي $200\\cos 12^\\circ$ — قريبة من المسافة نفسها. المنارة أكيد أقصر من كده بكتير!" },
      {
        value: -127.17,
        ruleId: "light-radians",
        errorType: "procedural",
        prompt: "الآلة الحاسبة شغالة بالراديان (RAD)! حوّلها لـ DEG لأن الزاوية بالدرجات. وكمان: ارتفاع سالب منطقي؟",
      },
      { value: 940.9, ruleId: "light-inverse", errorType: "mathematical", prompt: "قسمت على $\\tan$ بدل ما تضرب. زاوية صغيرة ($12^\\circ$) لازم تدي ارتفاع صغير." },
    ],
    solver: {
      understand: "مسافة أفقية وزاوية ارتفاع. المطلوب الارتفاع.",
      represent: "ارسم مثلث قائم: المركب عند الزاوية، المنارة رأسية، والمسافة على الأرض.",
      model: "حساب مثلثات: المقابل والمجاور ← $\\tan$.",
      translate: "$h = 200\\tan 12^\\circ$",
      verify: "الآلة الحاسبة على DEG؟ زاوية $12^\\circ$ صغيرة، فالارتفاع لازم يكون أقل بكتير من 200 m ✓.",
    },
    solution: "h = 200\\tan 12^\\circ \\approx 42.5\\ \\text{m}",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "e-q1",
        question: "من نقطة على بعد 50 m من قاعدة مبنى، قيست زاوية ارتفاع قمته فوجدت $60^\\circ$. ارتفاع المبنى ≈",
        options: [
          { id: "a", label: "86.6 m" },
          { id: "b", label: "25 m" },
          { id: "c", label: "43.3 m" },
          { id: "d", label: "28.9 m" },
        ],
        correctId: "a",
        explanation: "$h = 50\\tan 60^\\circ = 50\\sqrt{3} \\approx 86.6\\,\\mathrm{m}$",
        rules: [
          { choiceId: "b", ruleId: "eq1-cos", errorType: "conceptual", prompt: "دي $50\\cos 60^\\circ$؛ المسافة مجاور والارتفاع مقابل ← $\\tan$." },
          { choiceId: "c", ruleId: "eq1-sin", errorType: "conceptual", prompt: "دي $50\\sin 60^\\circ$؛ $\\sin$ محتاج الوتر مش المسافة الأفقية." },
          { choiceId: "d", ruleId: "eq1-div", errorType: "mathematical", prompt: "قسمت على $\\tan 60^\\circ$ بدل الضرب." },
        ],
      },
      {
        id: "e-q2",
        question: "إذا ضاعفنا زاوية الارتفاع من $30^\\circ$ إلى $60^\\circ$ مع ثبات المسافة، فإن الارتفاع المحسوب:",
        options: [
          { id: "a", label: "يزيد 3 أمثال" },
          { id: "b", label: "يتضاعف" },
          { id: "c", label: "لا يتغير" },
          { id: "d", label: "يقل للنصف" },
        ],
        correctId: "a",
        explanation: "$\\dfrac{\\tan 60^\\circ}{\\tan 30^\\circ} = \\dfrac{\\sqrt{3}}{1/\\sqrt{3}} = 3$",
        rules: [
          { choiceId: "b", ruleId: "eq2-linear", errorType: "conceptual", prompt: "الارتفاع بيتناسب مع $\\tan\\theta$ مش مع $\\theta$. احسب $\\frac{\\tan 60^\\circ}{\\tan 30^\\circ}$." },
          { choiceId: "c", ruleId: "eq2-same", errorType: "conceptual", prompt: "نفس المسافة وزاوية أكبر يعني بتبص لنقطة أعلى." },
          { choiceId: "d", ruleId: "eq2-inverse", errorType: "conceptual", prompt: "زاوية أكبر ← ارتفاع أكبر، مش أقل." },
        ],
      },
    ],
  },
  hints: {
    predict: ["تخيّل إنك قريب جدًا من البرج: بترفع راسك قد إيه؟ ولما تكون بعيد جدًا؟"],
    experiment: ["ثبّت المسافة وغيّر الزاوية لحد ما الخط يلمس القمة.", "جرّب $d = 187$ m: الزاوية بتبقى كام؟", "عند $d = 187$ m الزاوية $45^\\circ$ لأن $\\tan 45^\\circ = 1$."],
    discover: ["ارسم المثلث: البرج مقابل الزاوية، والمسافة مجاورة.", "النسبة اللي بتربط المقابل بالمجاور هي $\\tan$.", "$\\tan\\theta = \\dfrac{h}{d}$"],
    apply: ["المسافة 200 m هي المجاور.", "الآلة الحاسبة لازم تكون DEG.", "$h = 200\\tan 12^\\circ$"],
  },
  reflection: {
    summary: "اكتشفت إن $h = d\\tan\\theta$: زاوية الارتفاع والمسافة الأفقية كفاية تقيس أي ارتفاع — من غير ما تطلعه.",
    nextMissionId: "vectors",
  },
};
