import type { Mission } from "@/lib/engine/types";
import { centripetalAcceleration, maxSafeSpeed } from "@/lib/physics/circular";
import { G } from "@/lib/physics/newton";

export const circular: Mission = {
  id: "circular",
  subject: "physics",
  order: 3,
  title: "صمّم منحنى طريق آمن",
  tagline: "الحركة الدائرية · العجلة المركزية",
  icon: "Route",
  concepts: ["circular.centripetal", "circular.friction"],
  groundTruth:
    "Uniform circular motion: centripetal acceleration a = v^2/r directed toward the center. On a flat curve, friction supplies it: v_max = sqrt(mu*g*r). Challenge: r=50 m, mu=0.5 → v_max ≈ 15.7 m/s (≈56 km/h). There is no outward 'centrifugal' force in the ground frame.",
  challenge: {
    story: "انت مهندس طرق. في منحنى نصف قطره 50 متر، ومعامل احتكاك الكاوتش بالأسفلت 0.5. العربيات اللي بتدخل المنحنى بسرعة كبيرة بتنزلق برّه الطريق.",
    goal: "حدد أقصى سرعة آمنة نكتبها على اللافتة — قريبة من الحد بس من غير انزلاق.",
  },
  prediction: {
    question: "لو العربية دخلت نفس المنحنى بضعف السرعة، العجلة المركزية المطلوبة عشان تفضل على الطريق هتبقى؟",
    options: [
      { id: "double", label: "الضعف" },
      { id: "quad", label: "4 أضعاف" },
      { id: "same", label: "زي ما هي" },
      { id: "half", label: "النص" },
    ],
    correctId: "quad",
    reveal: "العجلة المركزية بتتناسب مع مربع السرعة: ضعف السرعة = 4 أضعاف العجلة المطلوبة.",
    rules: [
      {
        choiceId: "double",
        ruleId: "circ-linear",
        errorType: "conceptual",
        prompt: "جرّب في المعمل: $v = 10$ ثم $v = 20$ بنفس نصف القطر، وقارن قراءة العجلة المركزية.",
      },
      {
        choiceId: "same",
        ruleId: "circ-speed-irrelevant",
        errorType: "conceptual",
        prompt: "لو مفيش فرق، ليه العربيات السريعة بس هي اللي بتنزلق؟",
      },
    ],
  },
  experiment: {
    sim: "circular",
    instruction: "غيّر السرعة ونصف القطر ومعامل الاحتكاك واضغط «شغّل». لاحظ سهم العجلة المركزية (لجوه) والسرعة (مماس).",
    params: [
      { key: "v", label: "السرعة", symbol: "v", min: 5, max: 30, step: 0.5, unit: "m/s", default: 20 },
      { key: "r", label: "نصف القطر", symbol: "r", min: 20, max: 150, step: 5, unit: "m", default: 50 },
      { key: "mu", label: "معامل الاحتكاك", symbol: "μ", min: 0.1, max: 1, step: 0.05, unit: "", default: 0.5 },
    ],
    evaluate: ({ v, r, mu }) => {
      const a = centripetalAcceleration(v, r);
      const vmax = maxSafeSpeed(mu, r);
      const readouts = [
        { label: "العجلة المركزية المطلوبة", value: a.toFixed(2), unit: "m/s²" },
        { label: "أقصى عجلة يوفرها الاحتكاك μg", value: (mu * G).toFixed(2), unit: "m/s²" },
        { label: "أقصى سرعة آمنة", value: vmax.toFixed(1), unit: "m/s" },
      ];
      if (v > vmax)
        return { success: false, message: "العربية انزلقت برّه! الاحتكاك مش كفاية يوفّر العجلة المركزية.", readouts };
      if (Math.abs(r - 50) > 0.01 || Math.abs(mu - 0.5) > 0.001)
        return {
          success: false,
          message: "آمن. بس اللافتة للمنحنى الحقيقي: رجّع r = 50 و μ = 0.5 ولاقي أقصى سرعة.",
          readouts,
        };
      if (v < vmax * 0.92)
        return { success: false, message: "آمن، بس السرعة أقل من اللازم. تقدر تزودها شوية؟", readouts };
      return {
        success: true,
        message: `أقصى سرعة آمنة ≈ ${vmax.toFixed(1)} m/s (≈ ${(vmax * 3.6).toFixed(0)} km/h). اكتبها على اللافتة!`,
        readouts,
      };
    },
  },
  discovery: {
    prompt: "من القراءات: العجلة المركزية بتزيد بسرعة مع v وبتقل لما المنحنى يوسع. اكتب العلاقة بين $a$ و $v$ و $r$.",
    variables: { a: "العجلة المركزية", v: "السرعة", r: "نصف القطر" },
    targets: [{ variable: "a", expr: "v^2 / r" }],
    domain: { v: [1, 40], r: [5, 200], a: [0.1, 50] },
    latex: "a_c = \\dfrac{v^2}{r}",
    derivation: [
      "a \\propto v^2 \\quad (r\\ \\text{ثابت})",
      "a \\propto \\dfrac{1}{r} \\quad (v\\ \\text{ثابتة})",
      "\\boxed{a_c = \\dfrac{v^2}{r}}",
      "\\mu m g = \\dfrac{m v^2}{r} \\Rightarrow v_{max} = \\sqrt{\\mu g r}",
    ],
    wrongRelations: [
      {
        relation: { variable: "a", expr: "v / r" },
        ruleId: "circ-a-vr",
        errorType: "mathematical",
        prompt: "لما ضاعفت السرعة في التجربة، العجلة زادت ضعف ولا 4 أضعاف؟ والوحدة: $\\dfrac{\\mathrm{m/s}}{\\mathrm{m}} = \\mathrm{s^{-1}}$ مش $\\mathrm{m/s^2}$.",
      },
      {
        relation: { variable: "a", expr: "v^2 * r" },
        ruleId: "circ-a-v2r",
        errorType: "conceptual",
        prompt: "يعني المنحنى الأوسع أخطر؟ ارجع للتجربة وزوّد r: العجلة زادت ولا قلت؟",
      },
    ],
    forbiddenSymbols: {},
  },
  application: {
    problem: "عربة في لعبة ملاهي بتلف في دائرة نصف قطرها 8 m بسرعة ثابتة 12 m/s. العجلة المركزية قد إيه؟",
    answer: { value: 18, unit: "m/s^2", tolerance: 0.02 },
    unitHint: "مثال: 9.8 m/s^2",
    wrongValues: [
      { value: 1.5, ruleId: "ride-v-over-r", errorType: "mathematical", prompt: "نسيت تربّع السرعة." },
      { value: 1152, ruleId: "ride-v2r", errorType: "conceptual", prompt: "نصف القطر في المقام: الدائرة الأوسع أسهل." },
    ],
    solver: {
      understand: "حركة دائرية منتظمة. المطلوب العجلة المركزية.",
      represent: "ارسم الدائرة، سهم السرعة مماس، وسهم العجلة لجوه ناحية المركز.",
      model: "عجلة مركزية: $a_c = \\dfrac{v^2}{r}$.",
      translate: "$a_c = \\dfrac{12^2}{8}$",
      verify: "الوحدة $\\dfrac{\\mathrm{m^2/s^2}}{\\mathrm{m}} = \\mathrm{m/s^2}$ ✓ — و $18\\,\\mathrm{m/s^2} \\approx 2g$، لعبة ملاهي مثيرة!",
    },
    solution: "a_c = \\dfrac{12^2}{8} = 18\\ \\text{m/s}^2",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "c-q1",
        question: "جسم يتحرك حركة دائرية منتظمة. اتجاه العجلة المركزية يكون:",
        options: [
          { id: "a", label: "نحو مركز الدائرة" },
          { id: "b", label: "للخارج بعيدًا عن المركز" },
          { id: "c", label: "في اتجاه السرعة (مماس)" },
          { id: "d", label: "ليس لها اتجاه" },
        ],
        correctId: "a",
        explanation: "العجلة المركزية دائمًا نحو المركز، عمودية على السرعة.",
        rules: [
          { choiceId: "b", ruleId: "cq1-centrifugal", errorType: "representational", prompt: "الإحساس بالدفع للخارج سببه القصور الذاتي، مش قوة حقيقية للخارج. ارسم القوة اللي بتلف الجسم." },
          { choiceId: "c", ruleId: "cq1-tangent", errorType: "representational", prompt: "السرعة هي اللي مماس. العجلة بتغيّر اتجاه السرعة، يبقى لازم تكون عمودية عليها." },
          { choiceId: "d", ruleId: "cq1-scalar", errorType: "conceptual", prompt: "العجلة كمية متجهة، ولازم يكون لها اتجاه." },
        ],
      },
      {
        id: "c-q2",
        question: "سيارة تسير في منحنى نصف قطره 100 m بسرعة 20 m/s. العجلة المركزية =",
        options: [
          { id: "a", label: "4 m/s²" },
          { id: "b", label: "0.2 m/s²" },
          { id: "c", label: "2 m/s²" },
          { id: "d", label: "400 m/s²" },
        ],
        correctId: "a",
        explanation: "$a_c = \\dfrac{v^2}{r} = \\dfrac{400}{100} = 4\\,\\mathrm{m/s^2}$",
        rules: [
          { choiceId: "b", ruleId: "cq2-vr", errorType: "mathematical", prompt: "نسيت تربيع السرعة." },
          { choiceId: "c", ruleId: "cq2-2r", errorType: "mathematical", prompt: "قسمت على $2r$؟ العلاقة $\\frac{v^2}{r}$ من غير 2." },
          { choiceId: "d", ruleId: "cq2-nodiv", errorType: "procedural", prompt: "ربّعت السرعة بس ماقسمتش على نصف القطر." },
        ],
      },
    ],
  },
  hints: {
    predict: ["لاحظ إن السرعة بتأثر مرتين: أسرع في تغيير الاتجاه، وفي نفس الوقت مسافة أكبر في نفس الزمن."],
    experiment: [
      "ثبّت r = 50 و μ = 0.5 وزوّد السرعة لحد ما العربية تنزلق.",
      "قارن «العجلة المطلوبة» بـ «أقصى عجلة يوفرها الاحتكاك».",
      "السرعة الآمنة القصوى قريبة من 15.5 m/s",
    ],
    discover: ["ضاعف v وشوف العجلة اتضربت في كام.", "ضاعف r وشوف العجلة حصلها إيه.", "$a = \\dfrac{v^{?}}{?}$"],
    apply: ["العلاقة نفسها اللي اكتشفتها.", "ربّع السرعة الأول.", "$a = \\dfrac{144}{8}$"],
  },
  reflection: {
    summary: "اكتشفت إن العجلة المركزية $a_c = \\frac{v^2}{r}$ ناحية المركز، وإن الاحتكاك هو اللي بيوفرها: $v_{max} = \\sqrt{\\mu g r}$.",
    nextMissionId: "ohm",
  },
};
