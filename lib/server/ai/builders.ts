/**
 * Block builders used by the `compose_block` tool. Each turns stored data (topic outline,
 * elements, datasets, equations) into a declarative UI block; the frontend only renders.
 */
import type { Equation, Topic, UiBlock } from "@/lib/domain";
import { db } from "../db/store";
import { badRequest, notFound } from "../http";

type Section = Topic["sections"][number];

const fmt = (x: number, d = 3) => +x.toPrecision(d);
/** 1.67e-27 → "1.673\\times10^{-27}" (LaTeX). */
/** "[Ar] 3d¹⁰ 4s¹" → LaTeX, so the configuration reads left-to-right inside Arabic text. */
const SUP: Record<string, string> = { "⁰": "0", "¹": "1", "²": "2", "³": "3", "⁴": "4", "⁵": "5", "⁶": "6", "⁷": "7", "⁸": "8", "⁹": "9" };
const texConfig = (c: string) => `$\\mathrm{${c.replace(/[⁰¹²³⁴⁵⁶⁷⁸⁹]+/g, (m) => `^{${[...m].map((ch) => SUP[ch]).join("")}}`).replace(/ /g, "\\,")}}$`;
const texSci = (x: number, d = 3) => x.toExponential(d).replace(/e([+-]\d+)/, (_, k) => `\\times10^{${Number(k)}}`);

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

function particle(key: string) {
  const p = db().particles.list((x) => x.key === key)[0];
  if (!p) throw notFound(`particle ${key}`);
  return p;
}

const NA = 6.022e23;
const U_KG = 1.6605e-27;

/** Values a sim choice sets for one element (shared by the 2D/3D atom and nucleus sims). */
const atomValues = (e: ReturnType<typeof element>) => ({ Z: e.Z, N: e.neutrons, A: e.massNumber, shells: e.shells, symbol: e.symbol, rA: e.atomicRadiusPm, rN: e.nuclearRadiusFm });

const BUILDERS: Record<string, (ctx: { topic?: Topic; section?: Section; equationId?: string }) => UiBlock> = {
  timeline: ({ topic }) => ({ type: "timeline", items: topic!.timeline }),

  model_history: () => {
    const models = db().atomModels.list().sort((a, b) => a.year - b.year);
    return {
      type: "sim",
      id: "history",
      title: "معرض نماذج الذرة: اختار عالم",
      params: [],
      choices: [{ key: "modelChoice", label: "النموذج", default: 0, options: models.map((m) => ({ label: `${m.scientist} (${m.yearLabel})`, values: { model: m.key, year: m.year } })) }],
      readouts: [{ label: "السنة", expr: "year", unit: "", digits: 0 }],
      observations: [
        { label: "شوف نموذج قبل اكتشاف الإلكترون", when: "year < 1897" },
        { label: "شوف أول نموذج فيه نواة", when: "year == 1911" },
        { label: "وصلت للصورة الحديثة (بعد 1925)", when: "year > 1925" },
      ],
      children: [{ type: "scene", component: "model_gallery", props: { models }, bind: { model: "model" } }],
    };
  },

  atom_3d: () => {
    const els = ["H", "He", "C", "O", "Na", "Cu"].map(element);
    const p = particle("proton");
    const n = particle("neutron");
    const e = particle("electron");
    return {
      type: "sim",
      id: "atom3d",
      title: "الذرة في 3D: نواة كثيفة وسحابة إلكترونات",
      params: [{ key: "zoomExp", label: "تكبير النواة: 10 أس", symbol: "k", min: 0, max: 4.5, step: 0.1, unit: "", default: 3.7 }],
      choices: [
        { key: "element", label: "العنصر", default: 2, options: els.map((x) => ({ label: `${x.nameAr} ${x.symbol}`, values: atomValues(x) })) },
        {
          key: "viewChoice",
          label: "طريقة العرض",
          default: 0,
          options: [
            { label: "سحابة إلكترونية (الحديثة)", values: { view: "cloud", orbits: 0 } },
            { label: "مدارات (بور)", values: { view: "orbits", orbits: 1 } },
          ],
        },
      ],
      readouts: [
        { label: "بروتونات +", expr: "Z", unit: "", digits: 0 },
        { label: "نيوترونات 0", expr: "N", unit: "", digits: 0 },
        { label: "إلكترونات −", expr: "Z", unit: "", digits: 0 },
        { label: "الشحنة الكلية", expr: `Z*${p.chargeE} + N*${n.chargeE} + Z*(${e.chargeE})`, unit: "e", digits: 0 },
        { label: "كتلة النواة من كتلة الذرة", expr: `100*(Z*${p.massU} + N*${n.massU})/(Z*${p.massU} + N*${n.massU} + Z*${e.massU})`, unit: "%", digits: 4 },
        { label: "الذرة أكبر من النواة", expr: "rA*1000/rN", unit: "مرة", digits: 2 },
        { label: "تكبير النواة في الرسم", expr: "10^zoomExp", unit: "×", digits: 2 },
      ],
      observations: [
        { label: "رجّع التكبير لـ 1× — النواة الحقيقية بتختفي!", when: "zoomExp < 0.3" },
        { label: "بدّل لعرض المدارات (صورة بور)", when: "orbits == 1" },
        { label: "افتح ذرة النحاس: 29 إلكترون", when: "Z == 29" },
      ],
      children: [{ type: "scene", component: "atom_3d", props: {}, bind: { Z: "Z", N: "N", shells: "shells", symbol: "symbol", view: "view", zoomExp: "zoomExp", rA: "rA", rN: "rN" } }],
    };
  },

  particles_table: () => {
    const ps = db().particles.list();
    const p = particle("proton");
    const e = particle("electron");
    return {
      type: "section",
      id: "particles",
      title: "مكوّنات الذرة",
      children: [
        {
          type: "table",
          caption: "الجسيمات الثلاثة اللي بتتكون منها كل الذرات العادية",
          columns: [
            { key: "name", label: "الجسيم" },
            { key: "charge", label: "الشحنة" },
            { key: "massU", label: "الكتلة (u)" },
            { key: "massKg", label: "الكتلة (kg)" },
            { key: "location", label: "مكانه" },
            { key: "discovery", label: "اكتشفه" },
          ],
          rows: ps.map((x) => ({
            name: `${x.nameAr} ${x.symbol}`,
            charge: x.chargeE > 0 ? `$+${x.chargeE}e$` : x.chargeE < 0 ? `$${x.chargeE}e$` : "$0$ (متعادل)",
            massU: x.massU,
            massKg: `$${texSci(x.massKg)}$`,
            location: x.location,
            discovery: x.discovery,
          })),
        },
        { type: "equation", latex: "A = Z + N", caption: "العدد الكتلي = بروتونات + نيوترونات" },
        { type: "equation", latex: "q_{\\text{atom}} = Z(+e) + N(0) + Z(-e) = 0", caption: "الذرة المتعادلة: عدد الإلكترونات = عدد البروتونات" },
        {
          type: "callout",
          tone: "insight",
          title: "البروتون أتقل من الإلكترون كام مرة؟",
          text: `$\\dfrac{m_p}{m_e} = \\dfrac{${texSci(p.massKg)}}{${texSci(e.massKg)}} \\approx ${Math.round(p.massKg / e.massKg)}$ — عشان كده تقريبًا كل كتلة الذرة في النواة.`,
        },
      ],
    };
  },

  nucleus_3d: () => {
    const els = ["He", "C", "O", "Cu", "Au"].map(element);
    const p = particle("proton");
    return {
      type: "sim",
      id: "nucleus3d",
      title: "كبّر النواة: بروتونات ونيوترونات متكدسة",
      params: [],
      choices: [{ key: "element", label: "النواة", default: 3, options: els.map((x) => ({ label: `${x.nameAr} ${x.symbol}`, values: atomValues(x) })) }],
      readouts: [
        { label: "نصف قطر النواة (1.2·A^⅓)", expr: "1.2*A^(1/3)", unit: "fm", digits: 2 },
        { label: "كثافة النواة", expr: `A*${U_KG}/(4/3*pi*(1.2e-15*A^(1/3))^3)`, unit: "kg/m³", digits: 2 },
        { label: "أكتف من المية", expr: `A*${U_KG}/(4/3*pi*(1.2e-15*A^(1/3))^3)/1000`, unit: "مرة", digits: 2 },
        { label: "شحنة النواة", expr: `Z*${p.chargeE}`, unit: "e", digits: 0 },
      ],
      observations: [{ label: "قارن نواة الهيليوم بنواة الدهب: الكثافة تقريبًا واحدة!", when: "Z == 79" }],
      children: [{ type: "scene", component: "nucleus_3d", props: {}, bind: { Z: "Z", N: "N", symbol: "symbol" } }],
    };
  },

  copper_zoom: () => {
    const cu = element("Cu");
    const m = cu.material;
    if (!m) throw notFound("copper material data");
    const perCm3 = (m.densityGcm3 / m.molarMassGmol) * NA;
    return {
      type: "sim",
      id: "copper",
      title: "ادخل جوه سلك نحاس",
      params: [],
      choices: [{ key: "levelChoice", label: "المستوى", default: 0, options: m.zoomLevels.map((z, i) => ({ label: `${i + 1}. ${z.title}`, values: { level: i, size: z.sizeM } })) }],
      readouts: [
        { label: "عرض اللي بتشوفه", expr: "size", unit: "m", digits: 2 },
        { label: "العرض ÷ قطر ذرة النحاس", expr: `size/(2*${cu.atomicRadiusPm}e-12)`, unit: "", digits: 2 },
        { label: "ذرات في 1 cm³", expr: `${fmt(perCm3, 4)}`, unit: "ذرة", digits: 3 },
        { label: "إلكترونات حرة في 1 cm³", expr: `${fmt(perCm3, 4)}*${m.freeElectronsPerAtom}`, unit: "e⁻", digits: 3 },
      ],
      observations: [
        { label: "ادخل البلّورة وشوف الإلكترونات الحرة", when: "level >= 1" },
        { label: "وصلت للنواة: 29 بروتون + 34 نيوترون", when: "level == 3" },
      ],
      children: [
        {
          type: "scene",
          component: "copper_zoom",
          props: { levels: m.zoomLevels, latticePm: m.latticeConstantPm, shells: cu.shells, Z: cu.Z, N: cu.neutrons },
          bind: { level: "level" },
        },
      ],
    };
  },

  copper_facts: () => {
    const cu = element("Cu");
    const m = cu.material!;
    const a = m.latticeConstantPm;
    return {
      type: "section",
      id: "copper-facts",
      title: "بطاقة النحاس",
      children: [
        {
          type: "table",
          columns: [
            { key: "k", label: "الخاصية" },
            { key: "v", label: "القيمة" },
          ],
          rows: [
            { k: "العدد الذري Z (بروتونات = إلكترونات)", v: cu.Z },
            { k: "نيوترونات (أشهر نظير ⁶³Cu)", v: cu.neutrons },
            { k: "توزيع الإلكترونات على المستويات", v: `$${cu.shells.join(",\\ ")}$` },
            { k: "التوزيع الإلكتروني", v: cu.electronConfig ? texConfig(cu.electronConfig) : "" },
            { k: "النظائر", v: cu.isotopes.map((i) => `${cu.symbol}-${i.massNumber}: ${i.abundance}%`).join("  ·  ") },
            { k: "نصف قطر الذرة", v: `$${cu.atomicRadiusPm}\\,\\mathrm{pm}$` },
            { k: "البلّورة", v: `مكعب متمركز الأوجه (FCC)، ضلع $${a}\\,\\mathrm{pm}$` },
            { k: "الكثافة", v: `$${m.densityGcm3}\\,\\mathrm{g/cm^3}$` },
            { k: "المقاومة النوعية", v: `$${texSci(m.resistivityOhmM, 2)}\\,\\Omega\\cdot\\mathrm{m}$` },
            { k: "استخدامات", v: m.uses.join("، ") },
          ],
        },
        {
          type: "callout",
          tone: "insight",
          title: "ليه النحاس موصّل ممتاز؟",
          text: `المستوى الأخير فيه إلكترون واحد بس (${cu.electronConfig ? texConfig(cu.electronConfig) : ""}). في البلّورة الإلكترون ده بيتحرر، فيبقى فيه حوالي $${fmt(((m.densityGcm3 / m.molarMassGmol) * NA * m.freeElectronsPerAtom) / 1e22, 3)}\\times10^{22}$ إلكترون حر في كل سنتيمتر مكعب، جاهزين يتحركوا مع أي جهد.`,
        },
        { type: "equation", latex: `a = 2\\sqrt{2}\\,r \\;\\Rightarrow\\; r = \\dfrac{${a}}{2\\sqrt2} \\approx ${fmt(a / (2 * Math.SQRT2), 3)}\\,\\mathrm{pm}`, caption: "في بلّورة FCC الذرات بتلمس بعض على قطر الوجه — نفس نصف قطر ذرة النحاس" },
      ],
    };
  },

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
