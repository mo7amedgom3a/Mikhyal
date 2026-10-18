import type { Goal, Sandbox, SandboxLevel } from "../types";
import { type CircuitState, type Part, type PartType, edgeNodes, toggleSwitch } from "./model";
import { bulbByLabel, solveCircuit, type CircuitSolution } from "./solver";

type G = Goal<CircuitState, CircuitSolution>;
type L = SandboxLevel<CircuitState, CircuitSolution>;

const W = (): Part => ({ type: "wire", locked: true });
const B = (label: string): Part => ({ type: "bulb", label, locked: true });
const BAT = (): Part => ({ type: "battery", locked: true });

function board(cols: number, rows: number, parts: Record<string, Part>, inventory: Partial<Record<PartType, number>>): CircuitState {
  return { cols, rows, parts, inventory };
}

const bulbs = (s: CircuitState) => Object.entries(s.parts).filter(([, p]) => p.type === "bulb");

const lit = (label: string): G => ({
  id: `lit-${label}`,
  label: `نوّر اللمبة ${label}`,
  anchor: label,
  check: (s, sol) => {
    const e = bulbByLabel(s, label);
    return !!e && !sol.shortCircuit && sol.readings[e]?.lit === true;
  },
});
const off = (label: string): G => ({
  id: `off-${label}`,
  label: `اللمبة ${label} تفضل طافية`,
  anchor: label,
  check: (s, sol) => {
    const e = bulbByLabel(s, label);
    return !!e && !sol.shortCircuit && !sol.readings[e]?.lit;
  },
});
const noShort: G = { id: "no-short", label: "من غير ما تعمل قِصَر (short) للبطارية", check: (_s, sol) => !sol.shortCircuit };
const litCount = (n: number): G => ({
  id: `lit-count-${n}`,
  label: `نوّر ${n} لمبات على الأقل`,
  check: (s, sol) => !sol.shortCircuit && bulbs(s).filter(([e]) => sol.readings[e]?.lit).length >= n,
});
const allBright = (n: number): G => ({
  id: "full-bright",
  label: `${n} لمبات كل واحدة بنورها الكامل (زي لمبة لوحدها على البطارية)`,
  check: (s, sol) => !sol.shortCircuit && bulbs(s).filter(([e]) => (sol.readings[e]?.brightness ?? 0) > 0.95).length >= n,
});
/** Evaluate the board with every switch forced open or closed. */
const withSwitches = (s: CircuitState, closed: boolean): CircuitSolution => {
  let t = s;
  for (const [e, p] of Object.entries(s.parts)) if (p.type === "switch" && !!p.closed !== closed) t = toggleSwitch(t, e);
  return solveCircuit(t);
};
const switchControls = (target: string, always: string): G => ({
  id: "switch-controls",
  label: `المفتاح يتحكم في ${target} بس، و ${always} تفضل منورة`,
  check: (s) => {
    if (!Object.values(s.parts).some((p) => p.type === "switch")) return false;
    const on = withSwitches(s, true);
    const offS = withSwitches(s, false);
    const T = bulbByLabel(s, target)!;
    const A = bulbByLabel(s, always)!;
    return !on.shortCircuit && !offS.shortCircuit && !!on.readings[T]?.lit && !offS.readings[T]?.lit && !!on.readings[A]?.lit && !!offS.readings[A]?.lit;
  },
});

const levels: L[] = [
  {
    id: "close-loop",
    title: "أقفل الدايرة",
    story: "البطارية واللمبة مكانهم، بس الدايرة مفتوحة من الشمال. الكهربا محتاجة **مسار مقفول** ترجع بيه للبطارية.",
    initial: board(3, 3, { "h:0,0": BAT(), "h:0,2": B("A"), "v:1,0": W(), "v:1,1": W() }, { wire: 3 }),
    goals: [lit("A")],
    hints: ["اسحب سلك من الدُرج وحطه على أي حافة فاضية بالنقط.", "الدايرة مفتوحة في العمود الشمال.", "حط سلكين على $v_{0,0}$ و $v_{0,1}$ (الحافة الشمال من فوق لتحت)."],
    concepts: ["electricity.closed-circuit"],
    takeaway: "التيار مش بيمر غير لما يكون في مسار مقفول من القطب الموجب للسالب.",
  },
  {
    id: "series",
    title: "لمبتين على التوالي",
    story: "عندك لمبتين وسلك. نوّر الاتنين في **نفس المسار** — وبص نورهم بقى عامل إزاي مقارنة بلمبة لوحدها.",
    initial: board(4, 3, { "h:0,0": BAT(), "h:1,0": W(), "h:2,0": W(), "v:3,0": W(), "v:3,1": W(), "v:0,0": W(), "v:0,1": W() }, { bulb: 2, wire: 1 }),
    goals: [litCount(2)],
    hints: ["الحافة اللي تحت فاضية: 3 خانات ومعاك لمبتين وسلك.", "حط اللمبتين ورا بعض في الصف اللي تحت، والسلك يكمّل.", "بص على عمود السطوع: كل لمبة بقت ربع نور اللمبة لوحدها!"],
    concepts: ["electricity.series"],
    takeaway: "على التوالي نفس التيار بيعدّي في الاتنين، والمقاومة الكلية اتضاعفت، فالتيار قلّ للنص والقدرة لكل لمبة بقت الربع: $P = I^2R$.",
  },
  {
    id: "parallel",
    title: "نفس النور الكامل",
    story: "عايزين لمبتين منورين **كل واحدة بكامل نورها** كأنها لوحدها على البطارية. التوالي مش هينفع هنا!",
    initial: board(3, 3, { "v:0,0": BAT(), "v:0,1": W(), "h:0,0": W(), "h:1,0": W(), "h:0,2": W(), "h:1,2": W() }, { bulb: 2, wire: 2 }),
    goals: [allBright(2), noShort],
    hints: ["كل لمبة لازم يبقى عليها فرق جهد البطارية كله.", "اعمل لكل لمبة فرع لوحدها بين السلك اللي فوق والسلك اللي تحت.", "لمبة + سلك في العمود الأوسط، ولمبة + سلك في العمود اليمين."],
    concepts: ["electricity.parallel"],
    takeaway: "على التوازي كل فرع عليه فرق جهد البطارية كله، فكل لمبة بتنور كأنها لوحدها — والبطارية بتدي تيار أكبر.",
  },
  {
    id: "choose-branches",
    title: "نوّر دول بس",
    story: "تلات لمبات A و B و C متركبين. عايزين A و B ينوروا، و C تفضل طافية. معاك سلكين بس.",
    initial: board(4, 3, {
      "v:0,0": BAT(), "v:0,1": W(),
      "h:0,0": W(), "h:1,0": W(), "h:2,0": W(),
      "h:0,2": W(), "h:1,2": W(), "h:2,2": W(),
      "v:1,0": B("A"), "v:2,0": B("B"), "v:3,0": B("C"),
    }, { wire: 2 }),
    goals: [lit("A"), lit("B"), off("C"), noShort],
    hints: ["كل لمبة فرع لوحدها، والفرع لازم يتقفل للسلك اللي تحت.", "الفرع اللي مش مقفول = لمبة طافية.", "قفّل الفرع تحت A وتحت B بس."],
    concepts: ["electricity.parallel", "electricity.closed-circuit"],
    takeaway: "كل فرع في التوازي مستقل: فتح فرع مش بيطفي الفروع التانية — زي لمبات البيت.",
  },
  {
    id: "switch",
    title: "مفتاح يتحكم في لمبة واحدة",
    story: "زي أوضة النوم: المفتاح يطفي ويولّع B بس، و A تفضل منورة على طول. معاك سلك ومفتاح.",
    initial: board(3, 3, {
      "v:0,0": BAT(), "v:0,1": W(),
      "h:0,0": W(), "h:1,0": W(), "h:0,2": W(), "h:1,2": W(),
      "v:1,0": B("A"), "v:2,0": B("B"),
    }, { wire: 1, switch: 1 }),
    goals: [switchControls("B", "A")],
    hints: ["المفتاح لازم يبقى في نفس الفرع بتاع B.", "فرع A محتاج يتقفل بسلك عادي.", "سلك تحت A، ومفتاح تحت B. دوس على المفتاح تجرّبه."],
    concepts: ["electricity.parallel", "electricity.switch"],
    takeaway: "المفتاح بيتحكم بس في الفرع اللي هو فيه. لو حطيته في المسار الرئيسي هيطفي كل حاجة.",
  },
  {
    id: "bypass",
    title: "اطفي اللمبتين اللي جوه",
    story: "اللمبات A و B و C منورين، و D و E جوه منورين نور خفيف. عايزين **نطفي D و E بس** و A و B و C يفضلوا منورين. معاك سلك واحد!",
    initial: board(5, 3, {
      "h:0,0": B("A"), "h:1,0": BAT(), "h:2,0": W(), "h:3,0": B("B"),
      "v:4,0": W(), "v:4,1": W(), "h:3,2": W(),
      "h:1,2": B("D"), "h:2,2": W(),
      "v:1,1": W(), "h:1,1": W(), "h:2,1": B("E"), "v:3,1": W(),
      "h:0,2": B("C"), "v:0,0": W(), "v:0,1": W(),
    }, { wire: 1 }),
    goals: [lit("A"), lit("B"), lit("C"), off("D"), off("E"), noShort],
    hints: [
      "التيار بيحب المسار اللي مقاومته أقل.",
      "لو وصّلت طرفين اللمبة بسلك، التيار هيعدّي من السلك ويسيب اللمبة.",
      "سلك واحد يوصّل نص المربع اللي فوق بنص المربع اللي تحت يعمل «تحويلة» للمبتين مع بعض.",
    ],
    concepts: ["electricity.short", "electricity.series"],
    takeaway: "السلك اللي بيوصّل طرفين جزء من الدايرة بيعمل «قِصَر» للجزء ده: التيار بيعدّي من السلك (مقاومته صفر) وبيسيب اللمبات من غير تيار.",
  },
  {
    id: "free-build",
    title: "ابني بحرّيتك",
    story: "ملعب مفتوح: بطارية وقطع كتير. ابني أي دايرة وجرّب — التوالي، التوازي، المفاتيح، المقاومات. الهدف: نوّر 3 لمبات.",
    initial: board(6, 4, { "v:0,1": BAT() }, { wire: 20, bulb: 5, resistor: 2, switch: 2 }),
    goals: [litCount(3), noShort],
    hints: ["ابدأ بدايرة بسيطة حوالين البطارية.", "جرّب تحط لمبة في التوالي ولمبة في التوازي وقارن السطوع.", "دوس على اللمبة أو اقرا عمود القياسات تعرف التيار والجهد."],
    concepts: ["electricity.series", "electricity.parallel"],
    takeaway: "خلاصة: التوالي بيقسّم الجهد، والتوازي بيقسّم التيار — والقصر بيحرق البطارية.",
    freeBuild: true,
  },
];

export const circuitSandbox: Sandbox<CircuitState, CircuitSolution> = {
  id: "circuits",
  title: "مُعمل الدوائر",
  tagline: "ابني دوائر بإيدك وشوف اللمبات بتنوّر لحظيًا",
  icon: "Zap",
  solve: solveCircuit,
  levels,
  describe: (s, sol) => {
    const parts = Object.entries(s.parts).map(([e, p]) => {
      const [a, b] = edgeNodes(e);
      const r = sol.readings[e];
      const extra = p.type === "bulb" ? ` brightness=${(r?.brightness ?? 0).toFixed(2)}` : p.type === "switch" ? ` ${p.closed ? "closed" : "open"}` : "";
      return `${p.type}${p.label ? " " + p.label : ""} ${a}–${b}${extra}`;
    });
    return `${sol.shortCircuit ? "SHORT CIRCUIT. " : ""}Parts: ${parts.join("; ")}`;
  },
};
