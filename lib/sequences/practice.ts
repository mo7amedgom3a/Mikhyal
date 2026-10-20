/**
 * Practice for the arithmetic-sequences lesson, modelled on the textbook exercises (ص 19 – 20).
 * Every numeric field is checked exactly; known wrong values carry a targeted explanation.
 */

export interface PracticeField {
  key: string;
  /** Shown before the box; may embed $math$, e.g. "$a_1 =$". */
  label: string;
  answer: number;
  /** Accepted distance from the answer, for rounded results (default: exact). */
  tolerance?: number;
  /** Specific wrong values and why a student usually lands on them. */
  wrong?: { value: number; why: string }[];
}

export type PracticeQuestion =
  | { id: string; kind: "fields"; prompt: string; fields: PracticeField[]; hint: string; solution: string }
  | { id: string; kind: "choice"; prompt: string; options: { id: string; tex?: string; text?: string }[]; answer: string; why: Record<string, string>; hint: string; solution: string };

export const PRACTICE: PracticeQuestion[] = [
  {
    id: "write-recursive",
    kind: "fields",
    prompt: "اكتب الصيغة الارتدادية للمتتالية الحسابية $3, 5, 7, 9, 11, \\dots$ بتحديد الحد الأول والأساس.",
    fields: [
      { key: "a1", label: "$a_1 =$", answer: 3 },
      { key: "d", label: "$a_n = a_{n-1} +$", answer: 2, wrong: [{ value: -2, why: "الأساس هو الحد ناقص الذي قبله: $5 - 3$ وليس $3 - 5$." }] },
    ],
    hint: "الأساس $d = a_2 - a_1$.",
    solution: "$a_1 = 3$ و $d = 5 - 3 = 2$، إذن $a_n = a_{n-1} + 2$ لكل $n \\ge 2$.",
  },
  {
    id: "next-term",
    kind: "fields",
    prompt: "في متتالية حسابية صيغتها الارتدادية $a_n = a_{n-1} + 4$، إذا كان $a_7 = 20$ فما قيمة $a_8$ و $a_6$؟",
    fields: [
      { key: "a8", label: "$a_8 =$", answer: 24, wrong: [{ value: 16, why: "$a_8$ يأتي بعد $a_7$ فنضيف الأساس: $a_8 = a_7 + 4$." }] },
      { key: "a6", label: "$a_6 =$", answer: 16, wrong: [{ value: 24, why: "$a_6$ يسبق $a_7$، فـ $a_7 = a_6 + 4$ أي $a_6 = a_7 - 4$." }] },
    ],
    hint: "الصيغة تقول: كل حد = الحد الذي قبله + 4. للرجوع للخلف اطرح 4.",
    solution: "$a_8 = a_7 + 4 = 24$، و $a_6 = a_7 - 4 = 16$.",
  },
  {
    id: "ex14",
    kind: "fields",
    prompt: "(تمرين 14 ص 19) أوجد الحد العام والحد العاشر للمتتالية الحسابية: $a_1 = 9$ ، $a_n = a_{n-1} + 6$ ، $n \\ge 2$. اكتب الحد العام على الصورة $a_n = \\square\\,n + \\square$.",
    fields: [
      { key: "slope", label: "معامل $n$ =", answer: 6, wrong: [{ value: 9, why: "معامل $n$ هو الأساس $d$ وليس الحد الأول." }] },
      {
        key: "intercept",
        label: "الحد الثابت =",
        answer: 3,
        wrong: [
          { value: 9, why: "يبدو أنك كتبت $a_n = 9 + 6n$. الصيغة $a_1 + (n-1)d$ فيها $(n-1)$ وليس $n$: $9 + 6n - 6 = 6n + 3$." },
          { value: 15, why: "انتبه للإشارة: $9 + 6(n-1) = 9 + 6n - 6$، فنطرح 6 ولا نضيفها." },
        ],
      },
      { key: "a10", label: "$a_{10} =$", answer: 63, wrong: [{ value: 69, why: "هذا $9 + 6 \\times 10$. الحد العاشر يحتاج 9 قفزات فقط: $9 + 6 \\times 9 = 63$." }] },
    ],
    hint: "استخدم $a_n = a_1 + (n-1)d$ ثم بسّط الأقواس.",
    solution: "$a_n = 9 + (n-1)\\cdot 6 = 6n + 3$، و $a_{10} = 6(10) + 3 = 63$.",
  },
  {
    id: "ex13",
    kind: "fields",
    prompt: "(على نمط تمرين 13) أوجد الحد العام والحد العاشر للمتتالية: $a_1 = 4$ ، $a_n = a_{n-1} - 3$ ، $n \\ge 2$.",
    fields: [
      { key: "slope", label: "معامل $n$ =", answer: -3, wrong: [{ value: 3, why: "الصيغة تطرح 3 في كل خطوة، فالأساس $d = -3$." }] },
      { key: "intercept", label: "الحد الثابت =", answer: 7, wrong: [{ value: 1, why: "$4 + (n-1)(-3) = 4 - 3n + 3$؛ ضرب $-3$ في $-1$ يعطي $+3$." }, { value: 4, why: "لا تنسَ أن الصيغة فيها $(n-1)$: $4 - 3(n-1) = -3n + 7$." }] },
      { key: "a10", label: "$a_{10} =$", answer: -23, wrong: [{ value: -26, why: "هذا $4 - 3 \\times 10$. من $a_1$ إلى $a_{10}$ تسع قفزات فقط: $4 - 27 = -23$." }] },
    ],
    hint: "الأساس هنا سالب: $d = -3$. المتتالية متناقصة.",
    solution: "$a_n = 4 + (n-1)(-3) = -3n + 7$، و $a_{10} = -30 + 7 = -23$.",
  },
  {
    id: "term-index",
    kind: "fields",
    prompt: "ما رتبة الحد الذي قيمته $99$ في المتتالية الحسابية $3, 7, 11, 15, \\dots$؟",
    fields: [{ key: "n", label: "$n =$", answer: 25, wrong: [{ value: 24, why: "حللت $99 = 3 + 4n$. الصحيح $99 = 3 + 4(n-1)$ فيكون $n - 1 = 24$ أي $n = 25$." }] }],
    hint: "ضع $a_n = 99$ في $a_n = a_1 + (n-1)d$ وحل المعادلة في $n$.",
    solution: "$99 = 3 + 4(n-1) \\Rightarrow n - 1 = 24 \\Rightarrow n = 25$.",
  },
  {
    id: "which-not",
    kind: "choice",
    prompt: "(فكرة تمرين 15 ص 8) أي صيغة ارتدادية مما يلي لا تمثّل متتالية حسابية؟",
    options: [
      { id: "a", tex: "a_1 = 2,\\ a_n = a_{n-1} + 5" },
      { id: "b", tex: "a_1 = \\tfrac13,\\ a_n = \\tfrac14\\,a_{n-1}" },
      { id: "c", tex: "a_1 = 10,\\ a_n = a_{n-1} - \\tfrac12" },
      { id: "d", tex: "a_1 = 0,\\ a_n = a_{n-1} + 0" },
    ],
    answer: "b",
    why: {
      a: "هنا نضيف 5 دائمًا، فالفرق ثابت $d = 5$: حسابية.",
      c: "نطرح $\\tfrac12$ في كل مرة، فالفرق ثابت $d = -\\tfrac12$: حسابية متناقصة.",
      d: "الفرق ثابت ويساوي صفرًا: متتالية ثابتة، وهي حسابية أساسها $0$.",
    },
    hint: "في المتتالية الحسابية نضيف العدد نفسه في كل خطوة. أيّها يضرب بدل أن يضيف؟",
    solution: "$a_n = \\tfrac14 a_{n-1}$ تضرب في $\\tfrac14$ فتعطي $\\tfrac13, \\tfrac1{12}, \\tfrac1{48}, \\dots$ والفروق غير ثابتة؛ النسبة هي الثابتة (هذه متتالية هندسية).",
  },
];
