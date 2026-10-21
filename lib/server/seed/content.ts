/**
 * Adapters from the code-defined content modules to serialisable domain records.
 * These are the seed for the in-memory store and the migration path to a real database.
 */
import type {
  Equation,
  Exam,
  Lab,
  Misconception,
  Mission,
  Phenomenon,
  Quantity,
  SimulationEngine,
  VisualComponent,
  WorkbenchProblem,
} from "@/lib/domain";
import type { Mission as RuntimeMission } from "@/lib/engine/types";
import { MISSIONS } from "@/lib/missions";
import { PHENOMENA, type PhenomenonModule } from "@/lib/phenomena";
import { SANDBOXES } from "@/lib/sandbox";
import { WORKBENCH_PROBLEMS } from "@/lib/workbench/problems";
import type { WorkbenchProblem as WorkbenchSpec } from "@/lib/workbench/types";
import { conceptId } from "./curriculum";

export const SYSTEM_AUTHOR = "usr_system";
const T0 = "2026-09-01T08:00:00.000Z";
const authored = { status: "published" as const, version: 1, authorId: SYSTEM_AUTHOR, createdAt: T0, updatedAt: T0, locale: "ar-EG" as const };

export const ids = {
  mission: (slug: string) => `msn_${slug}`,
  exam: (slug: string) => `exm_${slug}`,
  lab: (slug: string) => `lab_${slug}`,
  phenomenon: (slug: string) => `phn_${slug}`,
  workbench: (slug: string) => `wbp_${slug}`,
  simulation: (engine: string) => `sim_${engine}`,
  equation: (slug: string) => `eqn_${slug}`,
  quantity: (symbol: string) => `qty_${encodeURIComponent(symbol).replace(/%/g, "")}`,
};

// ───────────────────────────── Visual components & simulation engines ─────────────────────────────

const vc = (key: string, kind: VisualComponent["kind"], title: string, renderer: string, description: string, props: VisualComponent["props"] = {}): VisualComponent => ({
  id: `vcp_${key}`,
  kind,
  title,
  description,
  renderer,
  props,
});

export const VISUAL_COMPONENTS: VisualComponent[] = [
  vc("slider", "slider", "منزلق متغير", "shadcn/Radix Slider", "Controls one ParamSpec.", { param: { type: "ParamSpec", required: true } }),
  vc("choice", "choice", "اختيار", "radio chips", "Discrete option group.", { options: { type: "Array<{value,label}>", required: true } }),
  vc("readout", "readout", "قراءة حية", "KaTeX", "Live value with LaTeX and unit.", { tex: { type: "string", required: true } }),
  vc("plot2d", "plot2d", "رسم بياني", "Mafs", "Function plot / curve with points.", { x: { type: "[min,max]", required: true }, y: { type: "[min,max]", required: true }, series: { type: "Array<expr>" } }),
  vc("vector_plane", "vector_plane", "مستوى المتجهات", "Mafs + MovablePoint", "Draggable vectors and resultant."),
  vc("particle_canvas", "particle_canvas", "جسيمات", "Canvas 2D", "Particle systems (carriers, molecules, electron hits)."),
  vc("svg_scene", "svg_scene", "مشهد SVG", "SVG + @use-gesture", "Custom scene with draggable handles."),
  vc("circuit_board", "circuit_board", "لوحة الدوائر", "SVG + MNA solver", "Drag-and-drop circuit builder."),
  vc("force_table", "force_table", "طاولة القوى", "Mafs", "Polar force table with polygon of forces."),
  vc("solution_graph", "solution_graph", "جراف الحل", "SVG layered DAG", "Solution graph with reached nodes and divergence."),
  vc("latex_block", "latex_block", "معادلة", "KaTeX", "Display equation."),
  vc("derivation_clip", "derivation_clip", "اشتقاق متحرك", "Manim video / KaTeX fallback", "Discovery derivation clip."),
  vc("heatmap", "heatmap", "خريطة حرارية", "HTML table", "Class step-validity heatmap."),
  vc("bar_meter", "bar_meter", "شريط إتقان", "HTML", "Mastery / progress meter."),
];

const PHENOMENON_PARAMS: Record<string, SimulationEngine["params"]> = {
  magnetism: [{ key: "I", label: "التيار", symbol: "I", min: -20, max: 20, step: 1, unit: "A", default: 10 }],
  "hall-effect": [
    { key: "I", label: "التيار", symbol: "I", min: 0.5, max: 10, step: 0.5, unit: "A", default: 5 },
    { key: "B", label: "المجال", symbol: "B", min: 0, max: 2, step: 0.1, unit: "T", default: 1 },
  ],
  photoelectric: [{ key: "lambda", label: "الطول الموجي", symbol: "λ", min: 200, max: 700, step: 5, unit: "nm", default: 400 }],
  "thermal-expansion": [{ key: "T", label: "درجة الحرارة", symbol: "T", min: -10, max: 60, step: 1, unit: "°C", default: 20 }],
  "phase-transitions": [{ key: "P", label: "قدرة السخّان", symbol: "P", min: 500, max: 3000, step: 100, unit: "W", default: 2000 }],
  entropy: [{ key: "th", label: "الحرارة السخنة", symbol: "T_h", min: 320, max: 600, step: 10, unit: "K", default: 400 }],
  "wave-particle": [{ key: "V", label: "جهد التعجيل", symbol: "V", min: 30, max: 600, step: 10, unit: "V", default: 100 }],
  tunneling: [{ key: "L", label: "عرض الحاجز", symbol: "L", min: 0.05, max: 1, step: 0.05, unit: "nm", default: 0.2 }],
  unruh: [{ key: "loga", label: "log₁₀ a", symbol: "x", min: 0, max: 22, step: 0.5, unit: "", default: 20 }],
};

const PHENOMENON_VISUALS: Record<string, string[]> = {
  magnetism: ["svg_scene", "slider", "readout"],
  "hall-effect": ["particle_canvas", "slider", "choice", "readout"],
  photoelectric: ["svg_scene", "plot2d", "slider", "choice", "readout"],
  "thermal-expansion": ["svg_scene", "slider", "choice", "readout"],
  "phase-transitions": ["svg_scene", "plot2d", "slider", "readout"],
  entropy: ["particle_canvas", "plot2d", "slider", "readout"],
  "wave-particle": ["particle_canvas", "slider", "choice", "readout"],
  tunneling: ["plot2d", "slider", "readout"],
  unruh: ["svg_scene", "plot2d", "slider", "readout"],
};

// ───────────────────────────── Missions → Mission + Exam + Misconceptions + Equation ─────────────────────────────

function missionRecords(m: RuntimeMission) {
  const slug = m.id;
  const simulationId = ids.simulation(m.experiment.sim);
  const conceptIds = m.concepts.map(conceptId);
  const equation: Equation = {
    id: ids.equation(slug),
    name: m.title,
    latex: m.discovery.latex,
    relation: `${m.discovery.targets[0].variable} = ${m.discovery.targets[0].expr}`,
    quantityIds: [m.discovery.targets[0].variable, ...Object.keys(m.discovery.domain)].filter((v, i, a) => a.indexOf(v) === i).map(ids.quantity),
    conceptIds,
    assumptions: [],
    derivedFrom: [],
  };
  const exam: Exam = {
    ...authored,
    id: ids.exam(slug),
    slug,
    type: "exam",
    title: `امتحان: ${m.title}`,
    tagline: m.tagline,
    icon: "ClipboardCheck",
    subject: m.subject,
    conceptIds,
    outcomeIds: [],
    difficulty: 3,
    estimatedMinutes: Math.ceil(m.exam.timeLimitSec / 60),
    tags: ["exam"],
    missionId: ids.mission(slug),
    timeLimitSec: m.exam.timeLimitSec,
    questions: m.exam.questions.map((q) => ({ ...q, kind: "choice" as const, outcomeIds: [] })),
  };
  const mission: Mission = {
    ...authored,
    id: ids.mission(slug),
    slug,
    type: "mission",
    title: m.title,
    tagline: m.tagline,
    icon: m.icon,
    subject: m.subject,
    conceptIds,
    outcomeIds: [],
    difficulty: m.enrichment ? 4 : 2 + (m.order > 6 ? 1 : 0),
    estimatedMinutes: 25,
    tags: m.enrichment ? ["enrichment"] : [],
    order: m.order,
    enrichment: m.enrichment,
    groundTruth: m.groundTruth,
    equationIds: [equation.id],
    challenge: m.challenge,
    prediction: m.prediction,
    experiment: {
      simulationId,
      engineId: m.experiment.sim,
      instruction: m.experiment.instruction,
      params: m.experiment.params,
      outcome: { kind: "engine", engineId: m.experiment.sim },
    },
    discovery: {
      prompt: m.discovery.prompt,
      variables: m.discovery.variables,
      targets: m.discovery.targets,
      domain: m.discovery.domain,
      latex: m.discovery.latex,
      derivation: m.discovery.derivation,
      clip: m.discovery.clip,
      wrongRelations: m.discovery.wrongRelations,
      forbiddenSymbols: m.discovery.forbiddenSymbols,
    },
    application: m.application,
    examId: exam.id,
    hints: m.hints,
    reflection: {
      summary: m.reflection.summary,
      nextMissionId: m.reflection.nextMissionId ? ids.mission(m.reflection.nextMissionId) : undefined,
      labId: m.reflection.sandbox ? ids.lab(m.reflection.sandbox) : undefined,
    },
  };
  const misconceptions: Misconception[] = [
    ...m.prediction.rules.map((r) => ({ kind: "choice" as const, r, detector: { kind: "choice" as const, questionRef: "prediction", choiceId: r.choiceId } })),
    ...m.discovery.wrongRelations.map((r) => ({ r, detector: { kind: "wrong_relation" as const, variable: r.relation.variable, expr: r.relation.expr } })),
    ...m.application.wrongValues.map((r) => ({ r, detector: { kind: "wrong_value" as const, value: r.value, unit: m.application.answer.unit } })),
    ...Object.entries(m.discovery.forbiddenSymbols).map(([symbol, r]) => ({ r, detector: { kind: "forbidden_symbol" as const, symbol } })),
  ].map(({ r, detector }) => ({
    id: `mis_${slug}.${r.ruleId}`,
    ruleId: r.ruleId,
    errorType: r.errorType,
    conceptIds,
    detector,
    prompt: r.prompt,
    intervention: r.errorType === "conceptual" ? "experiment" : r.errorType === "mathematical" ? "question" : r.errorType === "procedural" ? "hint" : "remediation",
    sourceId: mission.id,
  }));
  const simulation: SimulationEngine = {
    id: simulationId,
    engineId: m.experiment.sim,
    kind: "parametric",
    title: m.title,
    params: m.experiment.params,
    observables: m.experiment.evaluate(Object.fromEntries(m.experiment.params.map((p) => [p.key, p.default]))).readouts.map((r, i) => ({ key: `r${i}`, label: r.label, unit: r.unit ?? "" })),
    visualComponentIds: ["vcp_svg_scene", "vcp_slider", "vcp_readout", ...(m.experiment.sim === "vectors" ? ["vcp_vector_plane"] : [])],
    conceptIds,
    configurable: false,
  };
  return { mission, exam, equation, misconceptions, simulation };
}

// ───────────────────────────── Labs ─────────────────────────────

const LAB_CONCEPTS: Record<string, string[]> = { circuits: ["electricity.closed-circuit", "electricity.series", "electricity.parallel"], forces: ["statics.equilibrium", "vectors.resultant"] };

function labRecords() {
  return SANDBOXES.map((s) => {
    const lab: Lab = {
      ...authored,
      id: ids.lab(s.id),
      slug: s.id,
      type: "lab",
      title: s.title,
      tagline: s.tagline,
      icon: s.icon,
      subject: s.id === "circuits" ? "physics" : "applied",
      conceptIds: (LAB_CONCEPTS[s.id] ?? []).map(conceptId),
      outcomeIds: [],
      difficulty: 2,
      estimatedMinutes: 20,
      tags: ["sandbox"],
      simulationId: ids.simulation(`${s.id}-sandbox`),
      engineId: s.id,
      levels: s.levels.map((l, i) => ({
        id: l.id,
        order: i + 1,
        title: l.title,
        story: l.story,
        initial: JSON.parse(JSON.stringify(l.initial)),
        goals: l.goals.map((g) => ({ id: g.id, label: g.label, anchor: g.anchor, check: { kind: "engine" as const, key: g.id } })),
        hints: l.hints,
        conceptIds: l.concepts.map(conceptId),
        takeaway: l.takeaway,
        freeBuild: l.freeBuild,
      })),
    };
    const simulation: SimulationEngine = {
      id: lab.simulationId,
      engineId: s.id,
      kind: "sandbox",
      title: s.title,
      params: [],
      observables: [],
      visualComponentIds: [s.id === "circuits" ? "vcp_circuit_board" : "vcp_force_table", "vcp_readout"],
      conceptIds: lab.conceptIds,
      configurable: false,
    };
    return { lab, simulation };
  });
}

// ───────────────────────────── Phenomena ─────────────────────────────

const PHENOMENON_CONCEPT: Record<string, string> = {
  magnetism: "em.magnetism",
  "hall-effect": "em.hall",
  photoelectric: "em.photoelectric",
  "thermal-expansion": "thermal.expansion",
  "phase-transitions": "thermal.phase",
  entropy: "thermal.entropy",
  "wave-particle": "quantum.duality",
  tunneling: "quantum.tunneling",
  unruh: "relativity.unruh",
};

const PHENOMENON_RELATION: Record<string, string> = {
  magnetism: "B = mu0*I/(2*pi*r)",
  "hall-effect": "VH = I*B/(n*q*t)",
  photoelectric: "Kmax = h*f - φ",
  "thermal-expansion": "dL = α*L0*dT",
  "phase-transitions": "Q = m*L",
  entropy: "dS = -Q/Th + Q/Tc",
  "wave-particle": "λ = h/p",
  tunneling: "T = exp(-2*κ*L)",
  unruh: "T = hbar*a/(2*pi*c*kB)",
};

function phenomenonRecords(p: PhenomenonModule) {
  const conceptIds = [conceptId(PHENOMENON_CONCEPT[p.id])];
  const equation: Equation = {
    id: ids.equation(`phn.${p.id}`),
    name: p.title,
    latex: p.equation.latex,
    relation: PHENOMENON_RELATION[p.id],
    quantityIds: [],
    conceptIds,
    assumptions: [],
    derivedFrom: [],
  };
  const simulation: SimulationEngine = {
    id: ids.simulation(`phn-${p.id}`),
    engineId: p.id,
    kind: "phenomenon",
    title: p.title,
    params: PHENOMENON_PARAMS[p.id] ?? [],
    observables: [],
    visualComponentIds: (PHENOMENON_VISUALS[p.id] ?? []).map((k) => `vcp_${k}`),
    conceptIds,
    configurable: false,
  };
  const phenomenon: Phenomenon = {
    ...authored,
    id: ids.phenomenon(p.id),
    slug: p.id,
    type: "phenomenon",
    title: p.title,
    tagline: p.tagline,
    icon: p.icon,
    subject: "physics",
    conceptIds,
    outcomeIds: [],
    difficulty: p.advanced ? 5 : 3,
    estimatedMinutes: 20,
    tags: [p.category, ...(p.advanced ? ["advanced"] : [])],
    category: p.category,
    advanced: p.advanced,
    description: p.description,
    famous: p.famous,
    equation: p.equation,
    equationIds: [equation.id],
    workbench: p.workbench,
    mission: p.mission,
    hints: p.hints,
    homePrompt: p.homePrompt,
    simulationId: simulation.id,
    workbenchProblemId: p.workbenchProblemId ? ids.workbench(p.workbenchProblemId) : undefined,
  };
  return { phenomenon, equation, simulation };
}

// ───────────────────────────── Workbench problems ─────────────────────────────

const WORKBENCH_CONCEPTS: Record<string, string[]> = {
  braking_001: ["kinematics.v2", "kinematics.deceleration"],
  photoelectric_001: ["em.photoelectric"],
  thermal_expansion_001: ["thermal.expansion"],
  newton_friction_001: ["dynamics.newton2", "dynamics.netforce"],
};

function workbenchRecords(spec: WorkbenchSpec) {
  const conceptIds = (WORKBENCH_CONCEPTS[spec.id] ?? []).map(conceptId);
  const equations: Equation[] = spec.principles
    .filter((p) => p.status === "applicable")
    .map((p) => ({
      id: ids.equation(`${spec.id}.${p.id}`),
      name: p.note_ar.slice(0, 60),
      latex: p.latex,
      relation: p.relation,
      quantityIds: Object.keys(spec.symbols)
        .filter((s) => new RegExp(`(^|[^A-Za-z0-9_])${s}([^A-Za-z0-9_]|$)`).test(p.relation))
        .map(ids.quantity),
      conceptIds,
      assumptions: spec.assumptions.map((a) => a.label_ar),
      derivedFrom: [],
    }));
  const problem: WorkbenchProblem = {
    ...authored,
    id: ids.workbench(spec.id),
    slug: spec.id,
    type: "workbench",
    title: spec.title,
    tagline: spec.ask.replace(/\$[^$]*\$/g, "").trim(),
    icon: "Sigma",
    subject: "physics",
    conceptIds,
    outcomeIds: [],
    difficulty: 3,
    estimatedMinutes: 15,
    tags: ["workbench", spec.subject],
    equationIds: equations.map((e) => e.id),
    spec: JSON.parse(JSON.stringify(spec)),
  };
  const quantities: Quantity[] = Object.entries(spec.symbols).map(([symbol, s]) => ({
    id: ids.quantity(symbol),
    symbol,
    tex: s.tex,
    name: s.label_ar,
    unit: s.unit,
    dimension: s.unit || "1",
    domain: s.domain,
    sign: s.sign ?? "any",
  }));
  return { problem, equations, quantities };
}

// ───────────────────────────── Build everything ─────────────────────────────

export function buildContentSeed() {
  const missions = MISSIONS.map(missionRecords);
  const labs = labRecords();
  const phenomena = PHENOMENA.map(phenomenonRecords);
  const workbench = WORKBENCH_PROBLEMS.map(workbenchRecords);

  // Quantities: workbench symbols carry units; mission-only symbols are added without a unit.
  const quantities = new Map<string, Quantity>();
  for (const w of workbench) for (const q of w.quantities) if (!quantities.has(q.id)) quantities.set(q.id, q);
  for (const m of MISSIONS)
    for (const [symbol, name] of Object.entries(m.discovery.variables)) {
      const id = ids.quantity(symbol);
      if (!quantities.has(id)) quantities.set(id, { id, symbol, tex: symbol, name, unit: "", dimension: "?", sign: "any" });
    }
  const equations = [...missions.map((m) => m.equation), ...phenomena.map((p) => p.equation), ...workbench.flatMap((w) => w.equations)];
  for (const e of equations) e.quantityIds = e.quantityIds.filter((q) => quantities.has(q));

  return {
    missions: missions.map((m) => m.mission),
    exams: missions.map((m) => m.exam),
    misconceptions: missions.flatMap((m) => m.misconceptions),
    labs: labs.map((l) => l.lab),
    phenomena: phenomena.map((p) => p.phenomenon),
    workbench: workbench.map((w) => w.problem),
    equations,
    quantities: [...quantities.values()],
    simulations: [...missions.map((m) => m.simulation), ...labs.map((l) => l.simulation), ...phenomena.map((p) => p.simulation)],
    visualComponents: VISUAL_COMPONENTS,
  };
}
