import type { Mission } from "@/lib/engine/types";
import { symmetricTension } from "@/lib/physics/statics";

const W = 400;
const TMAX = 400;

export const statics: Mission = {
  id: "statics",
  subject: "applied",
  order: 9,
  title: "علّق اليافطة من غير ما الكابل يتقطع",
  tagline: "الاستاتيكا · اتزان جسيم تحت تأثير ثلاث قوى",
  icon: "Cable",
  concepts: ["statics.equilibrium", "statics.resolution"],
  groundTruth:
    "Equilibrium of a particle: a weight W hung from two symmetric cables, each at θ above the horizontal. Horizontal components cancel; vertical: 2T sinθ = W, so T = W/(2 sinθ). Shallow (near-horizontal) cables need huge tension. Challenge: W = 400 N, cable rating 400 N → θ ≥ 30°; shallowest safe angle is 30°. The three forces form a closed triangle (Lami's theorem).",
  challenge: {
    story: "صاحب محل عايز يعلّق يافطة وزنها 400 نيوتن بكابلين متماثلين. السقف واطي، فكل ما الكابلات تبقى أفقية أكتر، اليافطة بتطلع لفوق أكتر وبتبان أحسن. بس كل كابل أقصى شد يستحمله 400 نيوتن.",
    goal: "لاقي أقل زاوية للكابلات (أقرب للأفقي) من غير ما أي كابل يتقطع.",
  },
  prediction: {
    question: "عشان الشد في الكابلات يقل، الأحسن نخلّي الكابلات:",
    options: [
      { id: "steep", label: "أقرب للرأسي (زاوية كبيرة مع الأفقي)" },
      { id: "flat", label: "أقرب للأفقي (زاوية صغيرة)" },
      { id: "nomatter", label: "الزاوية مش هتفرق" },
      { id: "weight", label: "الشد دايمًا = الوزن" },
    ],
    correctId: "steep",
    reveal: "الكابل الرأسي بيشيل الوزن كله في اتجاه واحد. الكابل الأفقي تقريبًا بيضيع معظم شده في شد جانبي — فلازم يشد جامد جدًا عشان يشيل نفس الوزن.",
    rules: [
      {
        choiceId: "flat",
        ruleId: "statics-flat-safer",
        errorType: "conceptual",
        prompt: "بيبان منطقي إن الكابل المفرود أريح، بس جرّب في المعمل: نزّل الزاوية لـ $15^\\circ$ وبص على عداد الشد.",
      },
      { choiceId: "nomatter", ruleId: "statics-angle-irrelevant", errorType: "conceptual", prompt: "غيّر الزاوية في المعمل وراقب الشد — بيتغير ولا لأ؟" },
      { choiceId: "weight", ruleId: "statics-T-equals-W", errorType: "conceptual", prompt: "الوزن متوزّع على كابلين، وكمان جزء من كل شد بيروح جانبي. جرّب كام زاوية." },
    ],
  },
  experiment: {
    sim: "statics",
    instruction: "اسحب نقط تعليق الكابلات (أو السلايدر) لتغيير الزاوية، وراقب الشد ومثلث القوى. اضغط «شغّل» تشوف الكابل هيستحمل ولا لأ.",
    params: [{ key: "theta", label: "زاوية الكابل مع الأفقي", symbol: "θ", min: 10, max: 80, step: 0.5, unit: "°", default: 55 }],
    evaluate: ({ theta }) => {
      const T = symmetricTension(W, theta);
      const readouts = [
        { label: "الشد في كل كابل T", value: T.toFixed(0), unit: "N" },
        { label: "المركبة الرأسية لكل كابل", value: (T * Math.sin((theta * Math.PI) / 180)).toFixed(0), unit: "N" },
        { label: "أقصى شد مسموح", value: String(TMAX), unit: "N" },
      ];
      if (T > TMAX + 0.5) return { success: false, message: `الكابل اتقطع! الشد ${T.toFixed(0)} N أكبر من 400 N. الكابلات أفقية زيادة.`, readouts };
      if (theta > 31) return { success: false, message: "آمن، بس تقدر تخلي الكابلات أفقية أكتر عشان اليافطة تطلع لفوق.", readouts };
      return { success: true, message: `ممتاز! عند $${theta}^\\circ$ الشد ${T.toFixed(0)} N — على الحد بالظبط.`, readouts };
    },
  },
  discovery: {
    prompt: "اليافطة متزنة: المركبات الأفقية للشدين بتلغي بعض، والمركبات الرأسية بتشيل الوزن. اكتب الشد $T$ في كل كابل بدلالة الوزن $W$ والزاوية $\\theta$ مع الأفقي.",
    variables: { T: "الشد في كل كابل", W: "الوزن", θ: "زاوية الكابل مع الأفقي" },
    targets: [{ variable: "T", expr: "W / (2 * sin(θ))" }],
    domain: { W: [50, 1000], θ: [0.15, 1.4], T: [10, 5000] },
    latex: "T = \\dfrac{W}{2\\sin\\theta}",
    derivation: [
      "\\sum F_x = 0:\; T\\cos\\theta - T\\cos\\theta = 0",
      "\\sum F_y = 0:\; 2T\\sin\\theta - W = 0",
      "\\boxed{T = \\dfrac{W}{2\\sin\\theta}}",
      "T \\le 400 \\Rightarrow \\sin\\theta \\ge \\tfrac{1}{2} \\Rightarrow \\theta \\ge 30^\\circ",
    ],
    wrongRelations: [
      {
        relation: { variable: "T", expr: "W / 2" },
        ruleId: "statics-ignore-angle",
        errorType: "conceptual",
        prompt: "علاقتك بتقول إن الشد مش بيتغير مع الزاوية، بس العداد في المعمل اتغير! جزء بس من الشد بيشيل لفوق — أنهي جزء؟",
      },
      {
        relation: { variable: "T", expr: "W / (2 * cos(θ))" },
        ruleId: "statics-cos",
        errorType: "representational",
        prompt: "ارسم المركبات: الزاوية $\\theta$ مقاسة من **الأفقي**. المركبة الرأسية تبقى $T\\sin\\theta$ ولا $T\\cos\\theta$؟",
      },
      {
        relation: { variable: "T", expr: "W / sin(θ)" },
        ruleId: "statics-one-cable",
        errorType: "mathematical",
        prompt: "كأنك حسبت إن كابل واحد شايل الوزن كله. عندنا كابلين متماثلين بيتقاسموه.",
      },
    ],
    forbiddenSymbols: {},
  },
  application: {
    problem: "نجفة وزنها 600 N معلقة بسلكين متماثلين، كل سلك يميل بزاوية $20^\\circ$ على الأفقي. أوجد الشد في كل سلك.",
    answer: { value: 877.1, unit: "N", tolerance: 0.01 },
    unitHint: "مثال: 450 N",
    wrongValues: [
      { value: 300, ruleId: "lamp-half", errorType: "transfer", prompt: "قسمت الوزن على 2 وخلاص — بس السلكين مايلين، فالشد لازم يبقى أكبر من كده." },
      { value: 319.25, ruleId: "lamp-cos", errorType: "representational", prompt: "استخدمت $\\cos 20^\\circ$. الزاوية مع الأفقي ← المركبة الرأسية $T\\sin\\theta$." },
      { value: 1754.3, ruleId: "lamp-one", errorType: "mathematical", prompt: "نسيت إن في سلكين بيتقاسموا الوزن." },
    ],
    solver: {
      understand: "جسم متزن تحت 3 قوى: الوزن وشدين متساويين. المطلوب الشد.",
      represent: "ارسم مخطط الجسم الحر: $W$ لتحت، وكل شد بزاوية $20^\\circ$ فوق الأفقي.",
      model: "اتزان جسيم: $\\sum F_x = 0$ و $\\sum F_y = 0$.",
      translate: "$2T\\sin 20^\\circ = 600 \\Rightarrow T = \\dfrac{600}{2\\sin 20^\\circ}$",
      verify: "الشد أكبر من الوزن نفسه؟ منطقي لأن السلك قريب من الأفقي ✓ — نفس اللي شفته في المعمل.",
    },
    solution: "T = \\dfrac{600}{2\\sin 20^\\circ} \\approx 877\\ \\text{N}",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "s-q1",
        question: "جسم وزنه 100 N معلق بخيطين متماثلين، يميل كل منهما على الأفقي بزاوية $30^\\circ$. الشد في كل خيط =",
        options: [
          { id: "a", label: "100 N" },
          { id: "b", label: "50 N" },
          { id: "c", label: "57.7 N" },
          { id: "d", label: "200 N" },
        ],
        correctId: "a",
        explanation: "$T = \\dfrac{100}{2\\sin 30^\\circ} = \\dfrac{100}{1} = 100\\,\\mathrm{N}$",
        rules: [
          { choiceId: "b", ruleId: "sq1-half", errorType: "conceptual", prompt: "50 = W/2 بيتجاهل ميل الخيطين." },
          { choiceId: "c", ruleId: "sq1-cos", errorType: "representational", prompt: "استخدمت $\\cos 30^\\circ$؛ الزاوية مع الأفقي ← $\\sin$." },
          { choiceId: "d", ruleId: "sq1-one", errorType: "mathematical", prompt: "كأن خيط واحد شايل الوزن كله." },
        ],
      },
      {
        id: "s-q2",
        question: "عندما يقترب الخيطان من الوضع الأفقي، فإن الشد فيهما:",
        options: [
          { id: "a", label: "يزداد بشدة" },
          { id: "b", label: "يقل" },
          { id: "c", label: "يظل ثابتًا" },
          { id: "d", label: "يساوي صفرًا" },
        ],
        correctId: "a",
        explanation: "$T = \\dfrac{W}{2\\sin\\theta}$ و $\\sin\\theta \\to 0$ ⇐ $T \\to \\infty$",
        rules: [
          { choiceId: "b", ruleId: "sq2-less", errorType: "conceptual", prompt: "المركبة الرأسية بتقل، فالشد لازم يزيد عشان يشيل نفس الوزن." },
          { choiceId: "c", ruleId: "sq2-const", errorType: "conceptual", prompt: "الشد بيعتمد على الزاوية — جربتها في المعمل." },
          { choiceId: "d", ruleId: "sq2-zero", errorType: "conceptual", prompt: "لو الشد صفر، مين شايل الوزن؟" },
        ],
      },
    ],
  },
  hints: {
    predict: ["جرّب تشيل شنطة تقيلة بحبلين: مرة الحبلين رأسيين ومرة مفرودين."],
    experiment: ["ابدأ من زاوية كبيرة وانزل بالتدريج وراقب العداد.", "الكابل بيتقطع لما الشد يعدي 400 N.", "جرّب $\\theta = 30^\\circ$."],
    discover: ["المركبة الرأسية لكل شد: $T\\sin\\theta$.", "الكابلين مع بعض بيشيلوا الوزن كله.", "$2T\\sin\\theta = W$"],
    apply: ["$\\sin 20^\\circ \\approx 0.342$", "$2T\\sin 20^\\circ = 600$", "$T = \\dfrac{600}{0.684}$"],
  },
  reflection: {
    sandbox: "forces",
    summary: "اكتشفت شرط الاتزان: المحصلة صفر ومثلث القوى مقفول، وإن $T = \\frac{W}{2\\sin\\theta}$ — الكابلات الأفقية خطيرة لأن الشد بيكبر جدًا.",
    nextMissionId: "moments",
  },
};
