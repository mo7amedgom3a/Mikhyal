import type { Mission } from "@/lib/engine/types";
import { netTorque } from "@/lib/physics/moments";

export const moments: Mission = {
  id: "moments",
  subject: "applied",
  order: 10,
  title: "وازن الأرجوحة بين الابن وأبوه",
  tagline: "الاستاتيكا · العزوم واتزان الجسم المتماسك",
  icon: "Scale",
  concepts: ["statics.moments"],
  groundTruth:
    "Moments about a pivot: a beam balances when the clockwise and anticlockwise moments are equal: m1·d1 = m2·d2 (forces × perpendicular distances). The heavier person must sit closer to the pivot. Challenge: 40 kg child at 2.4 m balances a 60 kg father at 1.6 m. Lever: effort × effort arm = load × load arm.",
  challenge: {
    story: "في الجنينة: ابن وزنه 40 kg وأبوه 60 kg عايزين يلعبوا على الأرجوحة (السيسو). الابن قاعد على الطرف خالص، على بعد 2.4 m من المحور.",
    goal: "الأب يقعد فين بالظبط عشان الأرجوحة تتزن أفقيًا؟",
  },
  prediction: {
    question: "الأب أتقل من الابن. عشان الأرجوحة تتزن، الأب يقعد:",
    options: [
      { id: "closer", label: "أقرب للمحور من الابن" },
      { id: "farther", label: "أبعد عن المحور من الابن" },
      { id: "same", label: "على نفس البعد" },
      { id: "impossible", label: "مستحيل تتزن" },
    ],
    correctId: "closer",
    reveal: "تأثير الوزن في الدوران (العزم) بيعتمد على الوزن **والبعد** مع بعض. الأتقل يقرب من المحور عشان عزمه يساوي عزم الأخف.",
    rules: [
      { choiceId: "farther", ruleId: "mom-farther", errorType: "conceptual", prompt: "جرّب في المعمل: لو الأب بعد أكتر، الأرجوحة هتميل ناحية مين؟" },
      { choiceId: "same", ruleId: "mom-same", errorType: "conceptual", prompt: "نفس البعد مع أوزان مختلفة — جرّبها وشوف الأرجوحة هتعمل إيه." },
      { choiceId: "impossible", ruleId: "mom-impossible", errorType: "conceptual", prompt: "الأوزان مختلفة، بس البعد كمان بيأثر. جرّب تحرّك الأب." },
    ],
  },
  experiment: {
    sim: "moments",
    instruction: "اسحب كل شخص على العارضة (أو السلايدرات)، واضغط «شغّل» تشوف الأرجوحة هتميل ولا تتزن. راقب أعمدة العزم.",
    params: [
      { key: "m1", label: "كتلة الابن", symbol: "m₁", min: 20, max: 80, step: 1, unit: "kg", default: 40 },
      { key: "d1", label: "بعد الابن عن المحور", symbol: "d₁", min: 0.2, max: 2.5, step: 0.05, unit: "m", default: 2.4 },
      { key: "m2", label: "كتلة الأب", symbol: "m₂", min: 30, max: 100, step: 1, unit: "kg", default: 60 },
      { key: "d2", label: "بعد الأب عن المحور", symbol: "d₂", min: 0.2, max: 2.5, step: 0.05, unit: "m", default: 2.4 },
    ],
    evaluate: ({ m1, d1, m2, d2 }) => {
      const L = m1 * d1;
      const R = m2 * d2;
      const readouts = [
        { label: "عزم الابن m₁d₁", value: L.toFixed(1), unit: "kg·m" },
        { label: "عزم الأب m₂d₂", value: R.toFixed(1), unit: "kg·m" },
        { label: "العزم المحصل", value: netTorque(m1, d1, m2, d2).toFixed(0), unit: "N·m" },
      ];
      if (Math.abs(L - R) <= 1.5) return { success: true, message: `اتزنت! ${L.toFixed(0)} = ${R.toFixed(0)} kg·m على الجهتين.`, readouts };
      return { success: false, message: R > L ? "الأرجوحة مالت ناحية الأب. قرّبه من المحور." : "الأرجوحة مالت ناحية الابن. بعّد الأب أو قرّب الابن.", readouts };
    },
  },
  discovery: {
    prompt: "من أعمدة العزم: الأرجوحة بتتزن لما عزم الجهتين يتساوى. اكتب بعد الأب $d_2$ بدلالة $m_1$ و $d_1$ و $m_2$.",
    variables: { d2: "بعد الأب", m1: "كتلة الابن", d1: "بعد الابن", m2: "كتلة الأب" },
    targets: [{ variable: "d2", expr: "m1 * d1 / m2" }],
    domain: { m1: [10, 100], d1: [0.2, 3], m2: [10, 100], d2: [0.05, 30] },
    latex: "m_1 d_1 = m_2 d_2",
    derivation: [
      "\\tau = F \\times d_{\\perp}",
      "\\tau_{\\circlearrowleft} = \\tau_{\\circlearrowright}",
      "m_1 g\\, d_1 = m_2 g\\, d_2",
      "\\boxed{d_2 = \\dfrac{m_1 d_1}{m_2}} = \\dfrac{40 \\times 2.4}{60} = 1.6\\ \\text{m}",
    ],
    wrongRelations: [
      {
        relation: { variable: "d2", expr: "m2 * d1 / m1" },
        ruleId: "mom-inverted",
        errorType: "conceptual",
        prompt: "علاقتك بتخلي الأتقل يقعد **أبعد**. جرّبها في المعمل: الأرجوحة هتميل ناحية مين؟",
      },
      {
        relation: { variable: "d2", expr: "d1" },
        ruleId: "mom-ignore-mass",
        errorType: "conceptual",
        prompt: "البعد لوحده مش كفاية — الوزن كمان بيأثر في الدوران. بص على أعمدة العزم.",
      },
    ],
    forbiddenSymbols: {},
  },
  application: {
    problem: "عامل عايز يرفع صخرة وزنها 900 N بعتلة (عتلة من النوع الأول). الصخرة على بعد 0.3 m من نقطة الارتكاز، وإيده على بعد 1.5 m في الناحية التانية. أقل قوة لازم يأثر بيها كام؟",
    answer: { value: 180, unit: "N", tolerance: 0.01 },
    unitHint: "مثال: 250 N",
    wrongValues: [
      { value: 4500, ruleId: "lever-inverted", errorType: "transfer", prompt: "العتلة بتسهّل الشغل — الذراع الطويل بيقلل القوة. القوة المطلوبة لازم تبقى أقل من 900 N." },
      { value: 270, ruleId: "lever-noarm", errorType: "procedural", prompt: "حسبت عزم الصخرة ($900 \\times 0.3$) بس ده عزم مش قوة. قسّم على ذراع القوة." },
    ],
    solver: {
      understand: "عتلة متزنة على وشك الرفع. المطلوب قوة العامل.",
      represent: "ارسم العتلة: الصخرة على جنب قريب من المحور، والعامل على الجنب التاني بعيد.",
      model: "اتزان العزوم حول نقطة الارتكاز.",
      translate: "$F \\times 1.5 = 900 \\times 0.3$",
      verify: "الذراع أطول 5 مرات ← القوة أقل 5 مرات ✓.",
    },
    solution: "F = \\dfrac{900 \\times 0.3}{1.5} = 180\\ \\text{N}",
  },
  exam: {
    timeLimitSec: 150,
    questions: [
      {
        id: "m-q1",
        question: "قضيب خفيف مرتكز من منتصفه، عُلّق ثقل 30 N عند أحد طرفيه على بعد 2 m من نقطة الارتكاز. مقدار القوة التي تؤثر على بعد 1.5 m في الجهة الأخرى لاتزانه =",
        options: [
          { id: "a", label: "40 N" },
          { id: "b", label: "22.5 N" },
          { id: "c", label: "30 N" },
          { id: "d", label: "60 N" },
        ],
        correctId: "a",
        explanation: "$F \\times 1.5 = 30 \\times 2 \\Rightarrow F = 40\\,\\mathrm{N}$",
        rules: [
          { choiceId: "b", ruleId: "mq1-inverted", errorType: "conceptual", prompt: "البعد الأقل محتاج قوة **أكبر** مش أقل." },
          { choiceId: "c", ruleId: "mq1-same", errorType: "conceptual", prompt: "القوتين متساويتين بس لو البعدين متساويين." },
          { choiceId: "d", ruleId: "mq1-torque", errorType: "procedural", prompt: "60 هو العزم ($30 \\times 2$) مش القوة." },
        ],
      },
      {
        id: "m-q2",
        question: "عزم قوة حول نقطة يساوي:",
        options: [
          { id: "a", label: "القوة × البعد العمودي عن النقطة" },
          { id: "b", label: "القوة ÷ البعد" },
          { id: "c", label: "القوة × طول القضيب" },
          { id: "d", label: "القوة + البعد" },
        ],
        correctId: "a",
        explanation: "$\\tau = F \\times d_{\\perp}$",
        rules: [
          { choiceId: "b", ruleId: "mq2-div", errorType: "conceptual", prompt: "كل ما تبعد عن المحور التأثير بيزيد، مش بيقل." },
          { choiceId: "c", ruleId: "mq2-length", errorType: "representational", prompt: "البعد المقصود من نقطة الدوران لخط عمل القوة، مش طول القضيب كله." },
          { choiceId: "d", ruleId: "mq2-sum", errorType: "procedural", prompt: "مينفعش نجمع كميات بوحدات مختلفة (N و m)." },
        ],
      },
    ],
  },
  hints: {
    predict: ["افتكر الباب: بتزقه من جنب المفصلة ولا من الطرف عشان يفتح بسهولة؟"],
    experiment: ["ثبّت الابن على 2.4 m وحرّك الأب لحد ما الأعمدة تتساوى.", "عزم الابن $40 \\times 2.4 = 96$ kg·m.", "الأب محتاج $60 \\times d_2 = 96$."],
    discover: ["العزم = الكتلة (أو القوة) × البعد.", "الاتزان: عزم الشمال = عزم اليمين.", "$m_1 d_1 = m_2 d_2$"],
    apply: ["الصخرة والعامل على جهتين مختلفتين من نقطة الارتكاز.", "$F \\times 1.5 = 900 \\times 0.3$", "$F = \\dfrac{270}{1.5}$"],
  },
  reflection: {
    summary: "اكتشفت قاعدة العزوم: $m_1 d_1 = m_2 d_2$ — الأتقل يقرب من المحور، والذراع الطويل في العتلة بيقلل القوة اللازمة.",
    nextMissionId: "incline",
  },
};
