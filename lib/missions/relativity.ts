import type { Mission } from "@/lib/engine/types";
import { gamma } from "@/lib/physics/relativity";

export const relativity: Mission = {
  id: "relativity",
  subject: "physics",
  order: 6,
  title: "توأم الفضاء: الزمن بيتمدد",
  tagline: "النسبية الخاصة لأينشتاين · إثرائي",
  icon: "🚀",
  enrichment: true,
  concepts: ["relativity.dilation"],
  groundTruth:
    "Special relativity time dilation: Δt = γ Δt0 with γ = 1/sqrt(1 - v^2/c^2). Moving clocks run slow as seen by a stationary observer. Challenge: ship time 1 year, Earth time 2 years → γ = 2 → v = 0.866c.",
  challenge: {
    story: "رائد فضاء هيسافر رحلة، ساعته على السفينة هتعدّي سنة واحدة بس. أينشتاين قال إن الساعات المتحركة بسرعة كبيرة بتمشي أبطأ.",
    goal: "عايزين أخوه التوأم على الأرض يكون عدّى عليه سنتين. السفينة لازم تطير بكام من سرعة الضوء؟",
  },
  prediction: {
    question: "لو السفينة طارت بنص سرعة الضوء (0.5c)، الزمن على الأرض هيبقى قد إيه مقارنة بزمن السفينة؟",
    options: [
      { id: "double", label: "الضعف" },
      { id: "slight", label: "أكتر بحوالي 15% بس" },
      { id: "same", label: "نفس الزمن بالظبط" },
      { id: "less", label: "أقل من زمن السفينة" },
    ],
    correctId: "slight",
    reveal: "عند 0.5c، γ ≈ 1.15 بس! تمدد الزمن مش خطي — بيبان بقوة لما تقرّب جدًا من سرعة الضوء.",
    rules: [
      {
        choiceId: "double",
        ruleId: "rel-linear",
        errorType: "conceptual",
        prompt: "التأثير مش بيتناسب طرديًا مع السرعة. جرّب في المعمل β = 0.5 ثم 0.9 ثم 0.99 وبص على منحنى γ.",
      },
      {
        choiceId: "same",
        ruleId: "rel-absolute-time",
        errorType: "conceptual",
        prompt: "دي فكرة نيوتن عن الزمن المطلق. أينشتاين اقترح غير كده — شغّل التجربة وقارن الساعتين.",
      },
      {
        choiceId: "less",
        ruleId: "rel-reversed",
        errorType: "conceptual",
        prompt: "الساعة المتحركة هي اللي بتبطأ. يعني مين هيعدّي عليه وقت أكتر؟",
      },
    ],
  },
  experiment: {
    sim: "relativity",
    instruction: "غيّر سرعة السفينة كنسبة من سرعة الضوء (β = v/c) واضغط «شغّل». قارن ساعة السفينة بساعة الأرض.",
    params: [
      { key: "beta", label: "السرعة / سرعة الضوء", symbol: "β", min: 0, max: 0.99, step: 0.005, unit: "c", default: 0.5 },
      { key: "t0", label: "زمن الرحلة على السفينة", symbol: "Δt₀", min: 1, max: 10, step: 1, unit: "سنة", default: 1 },
    ],
    evaluate: ({ beta, t0 }) => {
      const g = gamma(beta);
      const readouts = [
        { label: "معامل لورنتز γ", value: g.toFixed(3) },
        { label: "زمن الأرض", value: (g * t0).toFixed(2), unit: "سنة" },
        { label: "زمن السفينة", value: t0.toFixed(0), unit: "سنة" },
      ];
      if (Math.abs(g - 2) <= 0.03)
        return { success: true, message: `🎯 عند β ≈ ${beta.toFixed(3)} الزمن على الأرض ضعف زمن السفينة!`, readouts };
      return {
        success: false,
        message: g < 2 ? "🐢 التوأم على الأرض لسه ماكبرش كفاية. أسرع!" : "⚡ كده الأرض عدّى عليها أكتر من الضعف. هدّي شوية.",
        readouts,
      };
    },
  },
  discovery: {
    prompt: "اكتب العلاقة بين زمن الأرض t وزمن السفينة t0 وسرعة السفينة v وسرعة الضوء c. (تلميح: المعامل بيبقى ∞ لما v = c)",
    variables: { t: "الزمن على الأرض", t0: "الزمن على السفينة", v: "سرعة السفينة", c: "سرعة الضوء" },
    targets: [{ variable: "t", expr: "t0 / sqrt(1 - v^2/c^2)" }],
    domain: { t0: [1, 10], c: [2, 4], v: [0.1, 1.5], t: [1, 20] },
    latex: "\\Delta t = \\gamma\\,\\Delta t_0 = \\dfrac{\\Delta t_0}{\\sqrt{1 - \\frac{v^2}{c^2}}}",
    derivation: [
      "\\text{ساعة ضوئية: } \\Delta t_0 = \\dfrac{2L}{c}",
      "(c\\,\\tfrac{\\Delta t}{2})^2 = L^2 + (v\\,\\tfrac{\\Delta t}{2})^2",
      "\\Delta t = \\dfrac{\\Delta t_0}{\\sqrt{1 - v^2/c^2}}",
    ],
    clip: "/clips/TimeDilation.mp4",
    wrongRelations: [
      {
        relation: { variable: "t", expr: "t0 * sqrt(1 - v^2/c^2)" },
        ruleId: "rel-inverted-gamma",
        errorType: "conceptual",
        prompt: "علاقتك بتدّي زمن أرض أقل من زمن السفينة. بس في التجربة، ساعة الأرض عدّت أكتر ولا أقل؟",
      },
      {
        relation: { variable: "t", expr: "t0 / (1 - v/c)" },
        ruleId: "rel-no-squares",
        errorType: "mathematical",
        prompt: "قربت! جرّب عند v = 0.5c: علاقتك تدي 2 بس التجربة قالت 1.15. فين التربيع والجذر؟",
      },
    ],
    forbiddenSymbols: {},
  },
  application: {
    problem: "جسيم الميون عمره وهو ساكن 2.2 ميكروثانية. لو بيتحرك بسرعة 0.98c، عمره هيبان قد إيه لمراقب في المعمل؟",
    answer: { value: 11.06, unit: "us", tolerance: 0.02 },
    unitHint: "مثال: 5 us (ميكروثانية)",
    wrongValues: [
      { value: 0.4378, ruleId: "muon-inverted", errorType: "conceptual", prompt: "الميون المتحرك بيعيش أطول في نظر المعمل، مش أقصر." },
      { value: 110, ruleId: "muon-linear", errorType: "mathematical", prompt: "استخدمت 1 − v/c بدل √(1 − v²/c²)." },
    ],
    solver: {
      understand: "الزمن الذاتي 2.2 μs (في إطار الميون). المطلوب الزمن في إطار المعمل.",
      represent: "ساعة مع الميون (Δt₀) وساعة في المعمل (Δt).",
      model: "تمدد الزمن: Δt = γ Δt₀.",
      translate: "γ = 1 ÷ √(1 − 0.98²) ≈ 5.03",
      verify: "Δt أكبر من Δt₀ ✓ (الساعة المتحركة أبطأ).",
    },
    solution: "\\Delta t = \\dfrac{2.2}{\\sqrt{1 - 0.98^2}} \\approx 11.06\\ \\mu\\text{s}",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "r-q1",
        question: "عند سرعة 0.6c يكون معامل لورنتز γ =",
        options: [
          { id: "a", label: "1.25" },
          { id: "b", label: "0.8" },
          { id: "c", label: "1.6" },
          { id: "d", label: "2.5" },
        ],
        correctId: "a",
        explanation: "γ = 1/√(1 − 0.36) = 1/0.8 = 1.25",
        rules: [
          { choiceId: "b", ruleId: "rq1-sqrt", errorType: "mathematical", prompt: "0.8 هي √(1 − β²)، و γ مقلوبها." },
          { choiceId: "c", ruleId: "rq1-sum", errorType: "mathematical", prompt: "γ مش 1 + β." },
          { choiceId: "d", ruleId: "rq1-linear", errorType: "mathematical", prompt: "دي 1/(1 − β) — نسيت التربيع والجذر." },
        ],
      },
      {
        id: "r-q2",
        question: "بالنسبة لمراقب على الأرض، ساعة موجودة في سفينة فضاء سريعة جدًا تبدو:",
        options: [
          { id: "a", label: "أبطأ" },
          { id: "b", label: "أسرع" },
          { id: "c", label: "بنفس المعدل" },
          { id: "d", label: "متوقفة تمامًا" },
        ],
        correctId: "a",
        explanation: "الساعات المتحركة تبطئ (تمدد الزمن).",
        rules: [
          { choiceId: "b", ruleId: "rq2-faster", errorType: "conceptual", prompt: "العكس: الساعة المتحركة هي اللي بتبطأ." },
          { choiceId: "c", ruleId: "rq2-absolute", errorType: "conceptual", prompt: "ده الزمن المطلق عند نيوتن، لكن عند السرعات العالية الزمن نسبي." },
          { choiceId: "d", ruleId: "rq2-stop", errorType: "conceptual", prompt: "بتقف بس لو v = c، وده مستحيل لجسم له كتلة." },
        ],
      },
    ],
  },
  hints: {
    predict: ["السرعات العادية مش بتعمل أي فرق ملحوظ في الزمن. 0.5c سريعة، بس هل كفاية؟"],
    experiment: ["زوّد β تدريجيًا وبص على منحنى γ.", "محتاج γ = 2.", "جرّب β ≈ 0.866"],
    discover: [
      "زمن الأرض = γ × زمن السفينة.",
      "γ بيبقى 1 لما v = 0 وبيروح لـ ∞ لما v → c.",
      "γ = 1 ÷ √(1 − v²/c²)",
    ],
    apply: ["العمر 2.2 μs هو الزمن الذاتي Δt₀.", "احسب γ عند 0.98c.", "Δt = γ × 2.2"],
  },
  reflection: {
    summary: "اكتشفت إن الزمن نسبي: الساعة المتحركة بتبطأ بمعامل γ = 1/√(1 − v²/c²)، والتأثير بيبان قرب سرعة الضوء.",
  },
};
