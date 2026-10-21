/**
 * Block builders used by the `compose_block` tool. Each turns stored data (topic outline,
 * elements, datasets, equations) into a declarative UI block; the frontend only renders.
 */
import type { Equation, Topic, UiBlock } from "@/lib/domain";
import { db } from "../db/store";
import { badRequest, notFound } from "../http";

type Section = Topic["sections"][number];

const fmt = (x: number, d = 3) => +x.toPrecision(d);

function topicOf(slug: string) {
  const t = db().topics.list((x) => x.slug === slug)[0];
  if (!t) throw notFound(`topic ${slug}`);
  return t;
}

export function sectionOf(topic: Topic, id?: string): Section | undefined {
  return topic.sections.find((s) => s.id === id);
}

function element(symbol: string) {
  const e = db().elements.list((x) => x.symbol === symbol)[0];
  if (!e) throw notFound(`element ${symbol}`);
  return e;
}

export function equationsFor(conceptKeys: string[]): Equation[] {
  const ids = conceptKeys.map((k) => `cpt_${k}`);
  return db().equations.list((e) => e.conceptIds.some((c) => ids.includes(c)));
}

const BUILDERS: Record<string, (ctx: { topic?: Topic; section?: Section; equationId?: string }) => UiBlock> = {
  timeline: ({ topic }) => ({ type: "timeline", items: topic!.timeline }),

  plum_pudding: () => ({
    type: "scene",
    component: "plum_pudding",
    title: "نموذج طومسون (البودينج)",
    props: { electrons: 10, caption: "شحنة موجبة منتشرة + إلكترونات مغروسة فيها" },
  }),

  rutherford_scattering: () => {
    const targets = ["Au", "Al", "C"].map(element);
    return {
      type: "sim",
      id: "rutherford",
      title: "جهاز رذرفورد: ارمي جسيمات ألفا على الرقيقة",
      params: [
        { key: "K", label: "طاقة جسيم ألفا", symbol: "K", min: 1, max: 10, step: 0.5, unit: "MeV", default: 5 },
        { key: "rate", label: "جسيمات في الثانية", symbol: "N", min: 10, max: 400, step: 10, unit: "", default: 120 },
      ],
      choices: [
        { key: "target", label: "الرقيقة", default: 0, options: targets.map((e) => ({ label: `${e.nameAr} (Z = ${e.Z})`, values: { Z: e.Z } })) },
        { key: "modelChoice", label: "النموذج المفترض للذرة", default: 0, options: [{ label: "رذرفورد: نواة مركّزة", values: { model: "rutherford" } }, { label: "طومسون: شحنة منتشرة", values: { model: "thomson" } }] },
      ],
      readouts: [
        { label: "أقرب مسافة (تصادم مباشر)", expr: "1.44*2*Z/K", unit: "fm", digits: 1 },
        { label: "نسبة اللي بترتد > 90° (رذرفورد)", expr: "100*((1.44*2*Z/K)/2/2000)^2", unit: "%", digits: 3 },
      ],
      observations: [
        { label: "قلّل الطاقة لـ 2 MeV: الارتدادات بتزيد", when: "K <= 2" },
        { label: "جرّب رقيقة الكربون: الانحراف أقل بكتير", when: "Z < 10" },
      ],
      children: [{ type: "scene", component: "rutherford_scattering", props: { bMaxFm: 2000 }, bind: { Z: "Z", energyMeV: "K", model: "model", rate: "rate" } }],
    };
  },

  geiger_marsden_plot: () => {
    const ds = db().datasets.get("dst_geiger_marsden_1913");
    if (!ds) throw notFound("dataset");
    const ref = ds.rows.find((r) => r.angle === 45)!;
    const C = ref.counts * Math.sin((22.5 * Math.PI) / 180) ** 4;
    return {
      type: "plot",
      title: `${ds.title}: البيانات مقابل تنبؤ رذرفورد`,
      x: [0, 165],
      y: [-0.6, 5.6],
      xLabel: "θ (درجة)",
      yLabel: "log₁₀ (عدد الومضات)",
      series: [{ expr: `log10(${fmt(C, 5)}/sin(x*pi/360)^4)`, label: "رذرفورد: N ∝ 1/sin⁴(θ/2)" }],
      points: ds.rows.map((r) => ({ x: r.angle, y: fmt(Math.log10(r.counts), 4), label: `${r.counts}` })),
    };
  },

  scale_callout: () => {
    const au = element("Au");
    const ratio = (au.atomicRadiusPm * 1e3) / au.nuclearRadiusFm;
    return {
      type: "callout",
      tone: "insight",
      title: "الذرة تقريبًا فاضية",
      text: `نصف قطر ذرة الدهب حوالي $${au.atomicRadiusPm}\\,\\mathrm{pm}$ ونواتها حوالي $${au.nuclearRadiusFm}\\,\\mathrm{fm}$ — الذرة أكبر من نواتها حوالي $${Math.round(ratio).toLocaleString("en")}$ مرة. لو النواة قد حبة بسلة (5 مم)، الذرة قطرها حوالي ${fmt((ratio * 5) / 1e6, 2)} كيلومتر!`,
    };
  },

  atom_model: () => {
    const els = db().elements.list((e) => e.Z <= 13).sort((a, b) => a.Z - b.Z);
    return {
      type: "sim",
      id: "atom",
      title: "ابني الذرة: اختار عنصر",
      params: [],
      choices: [
        {
          key: "element",
          label: "العنصر",
          default: 3,
          options: els.map((e) => ({ label: `${e.nameAr} ${e.symbol}`, values: { Z: e.Z, N: e.neutrons, A: e.massNumber, shells: e.shells, symbol: e.symbol } })),
        },
      ],
      readouts: [
        { label: "بروتونات (Z)", expr: "Z", unit: "", digits: 0 },
        { label: "نيوترونات (N)", expr: "N", unit: "", digits: 0 },
        { label: "العدد الكتلي A = Z + N", expr: "Z + N", unit: "", digits: 0 },
        { label: "إلكترونات (ذرة متعادلة)", expr: "Z", unit: "", digits: 0 },
      ],
      observations: [{ label: "اختار عنصر فيه 3 مستويات إلكترونات", when: "Z > 10" }],
      children: [{ type: "scene", component: "atom_model", props: { notToScale: true }, bind: { Z: "Z", N: "N", shells: "shells", symbol: "symbol" } }],
    };
  },

  isotopes_table: () => {
    const rows = db()
      .elements.list((e) => ["H", "C", "O"].includes(e.symbol))
      .flatMap((e) => e.isotopes.map((i) => ({ element: `${e.nameAr} ${e.symbol}`, isotope: `${e.symbol}-${i.massNumber}`, Z: e.Z, N: i.neutrons, A: i.massNumber, abundance: i.abundance ? `${i.abundance}%` : "مشع (أثر)" })));
    return {
      type: "table",
      caption: "نظائر: نفس عدد البروتونات، عدد نيوترونات مختلف",
      columns: [
        { key: "isotope", label: "النظير" },
        { key: "Z", label: "Z" },
        { key: "N", label: "N" },
        { key: "A", label: "A" },
        { key: "abundance", label: "الوفرة" },
      ],
      rows,
    };
  },

  energy_levels: () => ({
    type: "sim",
    id: "bohr",
    title: "مستويات بور: نزّل الإلكترون وشوف لون الفوتون",
    params: [
      { key: "Z", label: "العدد الذري (ذرة بإلكترون واحد)", symbol: "Z", min: 1, max: 3, step: 1, unit: "", default: 1 },
      { key: "nHi", label: "المستوى الابتدائي", symbol: "n_2", min: 2, max: 6, step: 1, unit: "", default: 3 },
      { key: "nLo", label: "المستوى النهائي", symbol: "n_1", min: 1, max: 5, step: 1, unit: "", default: 2 },
    ],
    readouts: [
      { label: "طاقة المستوى الابتدائي", expr: "-13.6*Z^2/nHi^2", unit: "eV", digits: 2 },
      { label: "طاقة الفوتون", expr: "13.6*Z^2*(1/nLo^2 - 1/nHi^2)", unit: "eV", digits: 2 },
      { label: "الطول الموجي", expr: "1240/(13.6*Z^2*(1/nLo^2 - 1/nHi^2))", unit: "nm", digits: 0 },
      { label: "نصف قطر المدار الابتدائي", expr: "0.529*nHi^2/Z", unit: "Å", digits: 2 },
    ],
    observations: [
      { label: "اعمل خط Hα الأحمر: هيدروجين من 3 لـ 2", when: "Z == 1 and nHi == 3 and nLo == 2" },
      { label: "انزل لـ n = 1 (سلسلة ليمان): الفوتون بقى فوق بنفسجي", when: "nLo == 1 and nHi > nLo" },
    ],
    children: [{ type: "scene", component: "energy_levels", props: { nMax: 6 }, bind: { Z: "Z", nHi: "nHi", nLo: "nLo" } }],
  }),

  quiz: ({ section }) => {
    if (!section?.quiz) throw badRequest("section has no quiz");
    return { type: "quiz", ...section.quiz };
  },

  equations: ({ section, topic }) => {
    const keys = section?.id === "experiment" ? ["atom.rutherford"] : topic?.conceptKeys ?? [];
    const eqs = equationsFor(keys);
    return { type: "section", id: `eq-${section?.id ?? "all"}`, title: "المعادلات", children: eqs.map((e) => ({ type: "equation" as const, latex: e.latex, caption: `${e.name}${e.assumptions.length ? ` — ${e.assumptions.join("، ")}` : ""}` })) };
  },

  /** Generic fallback for any equation: a sim with one slider per variable and a plot. */
  equation_explorer: ({ equationId }) => {
    const e = db().equations.get(equationId ?? "");
    if (!e) throw notFound(`equation ${equationId}`);
    const [lhs, rhs] = e.relation.split("=").map((s) => s.trim());
    const vars = [...new Set((rhs.match(/[A-Za-zͰ-Ͽ][A-Za-z0-9Ͱ-Ͽ]*/g) ?? []).filter((v) => !["pi", "e", "sqrt", "sin", "cos", "tan", "exp", "abs", "log", "log10", "atan"].includes(v)))].slice(0, 4);
    const params = vars.map((v) => ({ key: v, label: v, symbol: v, min: 1, max: 10, step: 0.5, unit: "", default: 5 }));
    const xVar = vars[0] ?? "x";
    const plotExpr = rhs.replace(new RegExp(`\\b${xVar}\\b`, "g"), "x");
    return {
      type: "sim",
      id: `eq-${e.id}`,
      title: e.name,
      params,
      readouts: [{ label: lhs, expr: rhs, unit: "", digits: 3 }],
      children: [
        { type: "equation", latex: e.latex },
        { type: "plot", title: `${lhs} مقابل ${xVar}`, x: [0.5, 10], y: [-20, 20], xLabel: xVar, yLabel: lhs, series: [{ expr: plotExpr, label: lhs }] },
      ],
    };
  },
};

export const BLOCK_KINDS = Object.keys(BUILDERS);

export function composeBlock(kind: string, opts: { topic?: string; section?: string; equationId?: string }): UiBlock {
  const build = BUILDERS[kind];
  if (!build) throw badRequest(`unknown block kind: ${kind}`, { known: BLOCK_KINDS });
  const topic = opts.topic ? topicOf(opts.topic) : undefined;
  return build({ topic, section: topic ? sectionOf(topic, opts.section) : undefined, equationId: opts.equationId });
}

export { topicOf };
