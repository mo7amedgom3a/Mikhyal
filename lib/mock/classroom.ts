/**
 * Mock class data for the instructor dashboard. Nothing here is invented at the verdict level:
 * each mock student is a scripted sequence of steps that is run through the real Workbench
 * validator, and the dashboard aggregates those validations.
 */
import { rng } from "@/lib/workbench/algebra";
import { BRAKING_UNANTICIPATED, brakingWorkbench } from "@/lib/workbench/problems/braking";
import { replayPath } from "@/lib/workbench/steps";
import type { AuthoredStep, StepValidation, VerdictStatus } from "@/lib/workbench/types";
import { nextNode, reachedFromValidations } from "@/lib/workbench/validate";

const NAMES = [
  "يوسف", "مريم", "عمر", "سلمى", "آدم", "نور", "مصطفى", "جنى", "كريم", "فريدة", "زياد", "ملك", "حمزة", "ليلى", "مالك", "هنا",
  "علي", "رقية", "سيف", "تقى", "ياسين", "حبيبة", "أنس", "شهد", "بلال", "ريم", "إياد", "دينا", "طارق", "لمى", "معاذ", "جودي",
];

type Archetype = "path_a" | "path_b" | "unanticipated" | "sign_fixed" | "model_fixed" | "squares_fixed" | "sign_stuck" | "no_unit";

const ARCHETYPE_WEIGHTS: [Archetype, number][] = [
  ["path_a", 8],
  ["path_b", 6],
  ["unanticipated", 3],
  ["sign_fixed", 5],
  ["model_fixed", 4],
  ["squares_fixed", 3],
  ["sign_stuck", 2],
  ["no_unit", 1],
];

const P = brakingWorkbench;
const [A, B] = P.paths;
const err = (id: string) => P.recoverableErrors.find((e) => e.id === id)!.steps;

/** Mistaken attempt (if any) followed by the student's final route. */
const SCRIPTS: Record<Archetype, { mistake?: AuthoredStep[]; final: AuthoredStep[] }> = {
  path_a: { final: A.steps },
  path_b: { final: B.steps.slice(0, 4) },
  unanticipated: { final: BRAKING_UNANTICIPATED },
  sign_fixed: { mistake: err("sign-error"), final: A.steps.slice(0, 3) },
  model_fixed: { mistake: err("constant-speed-model"), final: A.steps },
  squares_fixed: { mistake: err("forgot-squares"), final: A.steps.slice(0, 3) },
  sign_stuck: { mistake: err("sign-error"), final: A.steps.slice(0, 2) },
  no_unit: {
    final: [
      ...A.steps.slice(0, 2),
      { latex: "s = \\frac{0^2-20^2}{2(-5)} = 40", operation: "substitute", target: "s", explanation: "" },
    ],
  },
};

export type StageId = "select" | "rearrange" | "substitute" | "verify";
export const STAGE_LABEL: Record<StageId, string> = { select: "اختيار القانون", rearrange: "عزل وترتيب", substitute: "تعويض وحساب", verify: "تحقق" };

const stageOf = (op: AuthoredStep["operation"]): StageId =>
  op === "select_principle" ? "select" : op === "isolate_variable" || op === "solve_equation" || op === "simplify" ? "rearrange" : op === "verify" ? "verify" : "substitute";

export interface MockStudent {
  name: string;
  archetype: Archetype;
  route: "A" | "B" | "unanticipated" | "stuck";
  reached: string[];
  goalReached: boolean;
  /** Node the student was working toward when they first went wrong. */
  divergedAt?: string;
  mistake?: { code: string; action: string; feedback: string };
  recovered: boolean;
  steps: number;
  verified: boolean;
}

export interface ClassReport {
  problemId: string;
  students: MockStudent[];
  heatmap: { stage: StageId; property: "mathematical" | "physical" | "pedagogical"; pass: number; warn: number; fail: number; n: number }[];
  misconceptions: { code: string; label: string; count: number; recovered: number; action: string }[];
  routes: { route: MockStudent["route"]; count: number }[];
}

const MISCONCEPTION_LABEL: Record<string, string> = {
  "sign_convention:a": "إشارة العجلة موجبة رغم إن العربية بتبطّأ",
  "inapplicable:s_ut": "استخدام قانون السرعة الثابتة s = ut",
  not_equivalent: "عزل غلط: نسي تربيع السرعات",
  dimensions: "عدم اتساق الوحدات",
  missing_unit: "ناتج صحيح من غير وحدة",
};

export function buildClassReport(): ClassReport {
  const rand = rng(2026);
  const total = ARCHETYPE_WEIGHTS.reduce((s, [, w]) => s + w, 0);
  const pool: Archetype[] = ARCHETYPE_WEIGHTS.flatMap(([a, w]) => Array(w).fill(a));
  // Deterministic shuffle so names don't line up with archetypes.
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  void total;

  const cells = new Map<string, { pass: number; warn: number; fail: number; n: number }>();
  const tally = (s: AuthoredStep, v: StepValidation) => {
    for (const prop of ["mathematical", "physical", "pedagogical"] as const) {
      const st: VerdictStatus = v[prop].status;
      if (st === "na") continue;
      const key = `${stageOf(s.operation)}|${prop}`;
      const c = cells.get(key) ?? { pass: 0, warn: 0, fail: 0, n: 0 };
      c[st]++;
      c.n++;
      cells.set(key, c);
    }
  };
  const miscount = new Map<string, { count: number; recovered: number; action: string }>();

  const students: MockStudent[] = pool.map((archetype, i) => {
    const script = SCRIPTS[archetype];
    let mistake: MockStudent["mistake"];
    let divergedAt: string | undefined;
    if (script.mistake) {
      const r = replayPath(P, script.mistake);
      r.validations.forEach((v, k) => tally(script.mistake![k], v));
      const bad = r.validations.findIndex((v) => v.action !== "accept");
      const v = r.validations[bad];
      const code = v.physical.status === "fail" ? v.physical.code : v.mathematical.code;
      mistake = { code, action: v.action, feedback: v.feedback_ar };
      divergedAt = nextNode(P, reachedFromValidations(P, r.validations.slice(0, bad)))?.id;
    }
    const f = replayPath(P, script.final);
    f.validations.forEach((v, k) => tally(script.final[k], v));
    const warnUnit = f.validations.find((v) => v.physical.code === "missing_unit");
    if (warnUnit && !mistake) mistake = { code: "missing_unit", action: warnUnit.action, feedback: warnUnit.feedback_ar };
    const goalReached = f.validations.some((v) => v.goalReached);
    const reached = [...reachedFromValidations(P, f.validations)];
    if (mistake) {
      const m = miscount.get(mistake.code) ?? { count: 0, recovered: 0, action: mistake.action };
      m.count++;
      if (goalReached) m.recovered++;
      miscount.set(mistake.code, m);
    }
    const route: MockStudent["route"] = !goalReached ? "stuck" : f.validations.some((v) => v.unanticipated) ? "unanticipated" : reached.includes("find_time") ? "B" : "A";
    return {
      name: NAMES[i % NAMES.length],
      archetype,
      route,
      reached,
      goalReached,
      divergedAt,
      mistake,
      recovered: !!mistake && goalReached,
      steps: script.final.length + (script.mistake?.length ? 1 : 0),
      verified: f.validations.some((v) => v.mathematical.code === "verified"),
    };
  });

  const heatmap = (["select", "rearrange", "substitute", "verify"] as StageId[]).flatMap((stage) =>
    (["mathematical", "physical", "pedagogical"] as const).map((property) => ({ stage, property, ...(cells.get(`${stage}|${property}`) ?? { pass: 0, warn: 0, fail: 0, n: 0 }) })),
  );
  const misconceptions = [...miscount.entries()]
    .map(([code, m]) => ({ code, label: MISCONCEPTION_LABEL[code] ?? code, ...m }))
    .sort((a, b) => b.count - a.count);
  const routes = (["A", "B", "unanticipated", "stuck"] as const).map((route) => ({ route, count: students.filter((s) => s.route === route).length }));
  return { problemId: P.id, students, heatmap, misconceptions, routes };
}
