import type { Goal, Sandbox, SandboxLevel } from "../types";
import { EQUILIBRIUM_TOL, solveForces, type Force, type ForceSolution, type ForceState } from "./model";

type G = Goal<ForceState, ForceSolution>;

const equilibrium: G = {
  id: "equilibrium",
  label: "الحلقة تتزن: المحصلة = صفر",
  check: (_s, sol) => sol.equilibrium,
};
const F = (id: string, magnitude: number, angle: number, extra: Partial<Force> = {}): Force => ({ id, label: id, magnitude, angle, ...extra });
const fixed = (id: string, magnitude: number, angle: number) => F(id, magnitude, angle, { locked: true });

const levels: SandboxLevel<ForceState, ForceSolution>[] = [
  {
    id: "one-force",
    title: "وازن قوة واحدة",
    story: "قوة $F_1 = 5\\,\\mathrm{N}$ بتشد الحلقة يمين. اسحب رأس $F_2$ لحد ما الحلقة تقف في النص.",
    initial: { forces: [fixed("F₁", 5, 0), F("F₂", 3, 90)] },
    goals: [equilibrium],
    hints: ["قوتين بس يتزنوا إمتى؟", "لازم يكونوا متساويين في المقدار.", "ومتضادين في الاتجاه: $180^\\circ$."],
    concepts: ["statics.equilibrium"],
    takeaway: "قوتين يتزنوا بس لو متساويتين في المقدار ومتضادتين في الاتجاه.",
  },
  {
    id: "right-angle",
    title: "قوتين متعامدتين",
    story: "$F_1 = 3\\,\\mathrm{N}$ يمين و $F_2 = 4\\,\\mathrm{N}$ لفوق. قوة تالتة واحدة تقدر تلغيهم؟",
    initial: { forces: [fixed("F₁", 3, 0), fixed("F₂", 4, 90), F("F₃", 2, 180)] },
    goals: [equilibrium],
    hints: ["$F_3$ لازم تلغي **محصلة** $F_1$ و $F_2$.", "محصلتهم $\\sqrt{3^2+4^2}$.", "$F_3 = 5\\,\\mathrm{N}$ في الاتجاه العكسي للمحصلة: حوالي $233^\\circ$."],
    concepts: ["statics.equilibrium", "vectors.resultant"],
    takeaway: "القوة اللي بتوازن مجموعة قوى = عكس محصلتهم بالظبط (القوة المُوازِنة).",
  },
  {
    id: "three-equal",
    title: "تلات قوى متساوية",
    story: "$F_1 = 6\\,\\mathrm{N}$ لفوق. حط قوتين كمان **متساويتين** معاها بحيث الحلقة تتزن.",
    initial: { forces: [fixed("F₁", 6, 90), F("F₂", 4, 200), F("F₃", 4, 300)] },
    goals: [
      equilibrium,
      { id: "equal", label: "القوى التلاتة متساوية", check: (s) => s.forces.every((f) => Math.abs(f.magnitude - 6) < 0.15) },
    ],
    hints: ["التلات قوى متساوية — يبقى الزوايا بينهم إيه؟", "اقسم الدايرة على 3.", "$120^\\circ$ بين كل قوتين: $210^\\circ$ و $330^\\circ$."],
    concepts: ["statics.equilibrium"],
    takeaway: "تلات قوى متساوية تتزن لما الزاوية بين كل اتنين $120^\\circ$ — ومضلع القوى بيبقى مثلث متساوي الأضلاع.",
  },
  {
    id: "lami",
    title: "قاعدة لامي: شد الحبلين",
    story: "ثقل $10\\,\\mathrm{N}$ معلّق بحبلين اتجاههم ثابت ($30^\\circ$ فوق الأفقي من الناحيتين). اسحب كل حبل لحد ما تلاقي الشد الصح.",
    initial: { forces: [fixed("W", 10, 270), F("T₁", 4, 150, { fixedAngle: true, max: 15 }), F("T₂", 4, 30, { fixedAngle: true, max: 15 })] },
    goals: [equilibrium],
    hints: ["الاتجاهات ثابتة — اللي بيتغير المقدار بس.", "المركبات الرأسية: $2T\\sin 30^\\circ = 10$.", "$T_1 = T_2 = 10\\,\\mathrm{N}$."],
    concepts: ["statics.equilibrium", "statics.lami"],
    takeaway: "قاعدة لامي: $\\dfrac{T_1}{\\sin\\alpha} = \\dfrac{T_2}{\\sin\\beta} = \\dfrac{W}{\\sin\\gamma}$ — كل قوة تتناسب مع جيب الزاوية المقابلة لها.",
  },
  {
    id: "limited",
    title: "قوى محدودة",
    story: "قوة $F_1 = 8\\,\\mathrm{N}$، وكل قوة عندك أقصاها $5\\,\\mathrm{N}$ بس. قوة واحدة مش هتكفي — هتعمل إيه؟",
    initial: { forces: [fixed("F₁", 8, 30), F("F₂", 3, 200, { max: 5 }), F("F₃", 3, 260, { max: 5 })] },
    goals: [equilibrium],
    hints: ["محصلة $F_2$ و $F_3$ لازم تساوي $8\\,\\mathrm{N}$ عكس $F_1$.", "اعكس $F_1$: الاتجاه $210^\\circ$.", "خلي $F_2 = F_3 = 5$ على جانبي $210^\\circ$ بزاوية حوالي $37^\\circ$."],
    concepts: ["statics.equilibrium", "vectors.resultant"],
    takeaway: "قوتين أصغر ممكن محصلتهم تبقى أكبر من كل واحدة لوحدها، لو الزاوية بينهم صغيرة كفاية.",
  },
];

export const forcesSandbox: Sandbox<ForceState, ForceSolution> = {
  id: "forces",
  title: "طاولة القوى",
  tagline: "اسحب القوى على الحلقة لحد ما تتزن",
  icon: "Crosshair",
  solve: solveForces,
  levels,
  describe: (s, sol) =>
    `Forces: ${s.forces.map((f) => `${f.label}=${f.magnitude}N@${f.angle}°${f.locked ? " (fixed)" : ""}`).join(", ")}. Resultant ${sol.magnitude.toFixed(2)}N @ ${sol.direction.toFixed(0)}° (tolerance ${EQUILIBRIUM_TOL}).`,
};
