/**
 * AI agents (advisor + generator), their tools and rendering libraries, run transcripts,
 * and the declarative UI spec ("generative UI") the frontend renders from data.
 */
import { MathExpr, Timestamp } from "./common";
import { ParamSpec } from "./simulation";
import { named, z } from "./z";

// ───────────────────────────── Tools & libraries ─────────────────────────────

export const ToolLibrary = named(
  "ToolLibrary",
  z.object({
    id: z.string().openapi({ example: "mafs" }),
    name: z.string(),
    kind: z.enum(["rendering", "math", "physics", "animation", "data"]),
    version: z.string(),
    description: z.string(),
    /** UI-spec block types or scene components this library can render. */
    provides: z.array(z.string()),
  }),
);
export type ToolLibrary = z.infer<typeof ToolLibrary>;

export const AiTool = named(
  "AiTool",
  z.object({
    name: z.string().openapi({ example: "get_equations" }),
    description: z.string(),
    /** JSON-schema-ish description of the arguments. */
    parameters: z.record(z.string(), z.object({ type: z.string(), description: z.string(), required: z.boolean().optional() })),
    agents: z.array(z.enum(["advisor", "generator"])),
    libraryIds: z.array(z.string()),
  }),
);
export type AiTool = z.infer<typeof AiTool>;

// ───────────────────────────── Generative UI spec ─────────────────────────────

const Choice = z.object({ id: z.string(), label: z.string() });
const ChoiceControl = z.object({
  key: z.string(),
  label: z.string(),
  /** Each option sets several sim values at once (e.g. an element sets Z, N, shells…). */
  options: z.array(z.object({ label: z.string(), values: z.record(z.string(), z.union([z.number(), z.string(), z.array(z.number())])) })),
  default: z.number().int().min(0),
});

export type UiBlock =
  | { type: "heading"; text: string; level: 2 | 3 }
  | { type: "text"; text: string }
  | { type: "callout"; tone: "info" | "insight" | "warning"; title: string; text: string }
  | { type: "equation"; latex: string; caption?: string }
  | { type: "timeline"; items: { year: string; title: string; text: string }[] }
  | { type: "table"; columns: { key: string; label: string }[]; rows: Record<string, string | number>[]; caption?: string }
  | {
      type: "plot";
      title: string;
      x: [number, number];
      y: [number, number];
      xLabel: string;
      yLabel: string;
      series: { expr: string; label: string; color?: string }[];
      points?: { x: number; y: number; label?: string }[];
    }
  | { type: "scene"; component: string; title?: string; props: Record<string, unknown>; bind?: Record<string, string> }
  | { type: "quiz"; question: string; options: { id: string; label: string }[]; correctId: string; explanation: string; feedback: Record<string, string> }
  | {
      type: "sim";
      id: string;
      title: string;
      params: z.infer<typeof ParamSpec>[];
      choices?: z.infer<typeof ChoiceControl>[];
      readouts: { label: string; expr: string; unit: string; digits: number }[];
      observations?: { label: string; when: string }[];
      children: UiBlock[];
    }
  | { type: "section"; id: string; title: string; children: UiBlock[] };

const UiBlockLazy: z.ZodType<UiBlock> = z.lazy(() =>
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("heading"), text: z.string(), level: z.union([z.literal(2), z.literal(3)]) }),
    z.object({ type: z.literal("text"), text: z.string() }),
    z.object({ type: z.literal("callout"), tone: z.enum(["info", "insight", "warning"]), title: z.string(), text: z.string() }),
    z.object({ type: z.literal("equation"), latex: z.string(), caption: z.string().optional() }),
    z.object({ type: z.literal("timeline"), items: z.array(z.object({ year: z.string(), title: z.string(), text: z.string() })) }),
    z.object({
      type: z.literal("table"),
      columns: z.array(z.object({ key: z.string(), label: z.string() })),
      rows: z.array(z.record(z.string(), z.union([z.string(), z.number()]))),
      caption: z.string().optional(),
    }),
    z.object({
      type: z.literal("plot"),
      title: z.string(),
      x: z.tuple([z.number(), z.number()]),
      y: z.tuple([z.number(), z.number()]),
      xLabel: z.string(),
      yLabel: z.string(),
      series: z.array(z.object({ expr: MathExpr, label: z.string(), color: z.string().optional() })),
      points: z.array(z.object({ x: z.number(), y: z.number(), label: z.string().optional() })).optional(),
    }),
    z.object({ type: z.literal("scene"), component: z.string(), title: z.string().optional(), props: z.record(z.string(), z.unknown()), bind: z.record(z.string(), z.string()).optional() }),
    z.object({
      type: z.literal("quiz"),
      question: z.string(),
      options: z.array(Choice),
      correctId: z.string(),
      explanation: z.string(),
      feedback: z.record(z.string(), z.string()),
    }),
    z.object({
      type: z.literal("sim"),
      id: z.string(),
      title: z.string(),
      params: z.array(ParamSpec),
      choices: z.array(ChoiceControl).optional(),
      readouts: z.array(z.object({ label: z.string(), expr: MathExpr, unit: z.string(), digits: z.number().int() })),
      observations: z.array(z.object({ label: z.string(), when: MathExpr })).optional(),
      children: z.array(UiBlockLazy),
    }),
    z.object({ type: z.literal("section"), id: z.string(), title: z.string(), children: z.array(UiBlockLazy) }),
  ]),
) as z.ZodType<UiBlock>;

/** Recursive, so OpenAPI gets a hand-written description (zod-to-openapi can't walk z.lazy). */
export const UiBlock: z.ZodType<UiBlock> = named(
  "UiBlock",
  UiBlockLazy.openapi({
    type: "object",
    description: "One generated-UI block, discriminated by `type`; sim and section blocks nest `children: UiBlock[]`.",
    required: ["type"],
    properties: { type: { type: "string", enum: ["heading", "text", "callout", "equation", "timeline", "table", "plot", "scene", "quiz", "sim", "section"] } },
    additionalProperties: true,
  }),
);

export const UiSpec = named(
  "UiSpec",
  z.object({
    version: z.literal("genui/1"),
    title: z.string(),
    subtitle: z.string().optional(),
    blocks: z.array(UiBlock),
    /** Libraries the renderer needs (from /ai/libraries). */
    libraries: z.array(z.string()),
  }),
);
export type UiSpec = z.infer<typeof UiSpec>;

// ───────────────────────────── Agent runs ─────────────────────────────

export const AgentStep = named(
  "AgentStep",
  z.discriminatedUnion("type", [
    z.object({ type: z.literal("thought"), text: z.string(), at: z.number() }),
    z.object({ type: z.literal("tool_call"), callId: z.string(), tool: z.string(), args: z.record(z.string(), z.unknown()), at: z.number() }),
    z.object({ type: z.literal("tool_result"), callId: z.string(), tool: z.string(), ok: z.boolean(), summary: z.string(), result: z.unknown(), ms: z.number(), at: z.number() }),
    z.object({ type: z.literal("message"), text: z.string(), at: z.number() }),
    z.object({ type: z.literal("ui"), spec: UiSpec, at: z.number() }),
  ]),
);
export type AgentStep = z.infer<typeof AgentStep>;

export const RunRequest = named(
  "RunRequest",
  z.object({
    agent: z.enum(["advisor", "generator"]),
    prompt: z.string().min(2).max(2000),
    context: z
      .object({
        lessonSlug: z.string().optional(),
        contentId: z.string().optional(),
        conceptIds: z.array(z.string()).optional(),
      })
      .optional(),
    /** Generator: publish the result as a lesson under this slug. */
    publish: z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }).optional(),
  }),
);
export type RunRequest = z.infer<typeof RunRequest>;

export const AgentRun = named(
  "AgentRun",
  z.object({
    id: z.string(),
    agent: z.enum(["advisor", "generator"]),
    model: z.string().openapi({ description: "mock-planner (deterministic) or an LLM id" }),
    request: RunRequest,
    userId: z.string(),
    status: z.enum(["running", "succeeded", "failed"]),
    steps: z.array(AgentStep),
    output: z.object({ message: z.string(), ui: UiSpec.optional(), lessonSlug: z.string().optional(), draftId: z.string().optional() }).optional(),
    usage: z.object({ toolCalls: z.number().int(), steps: z.number().int(), simulatedLatencyMs: z.number() }),
    createdAt: Timestamp,
  }),
);
export type AgentRun = z.infer<typeof AgentRun>;

// ───────────────────────────── Generated lessons & datasets ─────────────────────────────

export const GeneratedLesson = named(
  "GeneratedLesson",
  z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    subject: z.enum(["physics", "math", "applied"]),
    conceptIds: z.array(z.string()),
    ui: UiSpec,
    runId: z.string(),
    status: z.enum(["draft", "published"]),
    createdAt: Timestamp,
  }),
);
export type GeneratedLesson = z.infer<typeof GeneratedLesson>;

export const ElementRecord = named(
  "ElementRecord",
  z.object({
    id: z.string(),
    Z: z.number().int().positive(),
    symbol: z.string(),
    name: z.string(),
    nameAr: z.string(),
    massNumber: z.number().int(),
    neutrons: z.number().int(),
    shells: z.array(z.number().int()),
    atomicRadiusPm: z.number(),
    nuclearRadiusFm: z.number(),
    isotopes: z.array(z.object({ massNumber: z.number().int(), neutrons: z.number().int(), abundance: z.number() })),
    electronConfig: z.string().optional(),
    /** Bulk-material data for elements used as real-world examples (e.g. copper). */
    material: z
      .object({
        crystal: z.enum(["fcc", "bcc", "hcp"]),
        latticeConstantPm: z.number(),
        densityGcm3: z.number(),
        molarMassGmol: z.number(),
        freeElectronsPerAtom: z.number(),
        resistivityOhmM: z.number(),
        uses: z.array(z.string()),
        /** Zoom path from everyday object to nucleus. */
        zoomLevels: z.array(z.object({ key: z.string(), title: z.string(), caption: z.string(), sizeM: z.number(), scaleLabel: z.string() })),
      })
      .optional(),
  }),
);
export type ElementRecord = z.infer<typeof ElementRecord>;

export const Dataset = named(
  "Dataset",
  z.object({
    id: z.string(),
    title: z.string(),
    source: z.string(),
    note: z.string(),
    columns: z.array(z.object({ key: z.string(), label: z.string(), unit: z.string() })),
    rows: z.array(z.record(z.string(), z.number())),
  }),
);
export type Dataset = z.infer<typeof Dataset>;

/** How people imagined the atom: one row per historical model. */
export const AtomModelRecord = named(
  "AtomModelRecord",
  z.object({
    id: z.string(),
    key: z.string(),
    year: z.number().int().openapi({ description: "Negative = BC" }),
    yearLabel: z.string(),
    scientist: z.string(),
    title: z.string(),
    idea: z.string(),
    evidence: z.string(),
    flaw: z.string(),
    /** How the 2D gallery draws it. */
    style: z.enum(["solid", "pudding", "nuclear", "orbits", "neutrons", "cloud"]),
  }),
);
export type AtomModelRecord = z.infer<typeof AtomModelRecord>;

export const ParticleRecord = named(
  "ParticleRecord",
  z.object({
    id: z.string(),
    key: z.enum(["proton", "neutron", "electron"]),
    nameAr: z.string(),
    symbol: z.string(),
    chargeE: z.number(),
    massU: z.number(),
    massKg: z.number(),
    location: z.string(),
    discovery: z.string(),
  }),
);
export type ParticleRecord = z.infer<typeof ParticleRecord>;

/** A knowledge-base topic the generator draws on (outline, narrative, FAQ). */
export const Topic = named(
  "Topic",
  z.object({
    id: z.string(),
    slug: z.string(),
    title: z.string(),
    keywords: z.array(z.string()),
    conceptKeys: z.array(z.string()),
    sections: z.array(
      z.object({
        id: z.string(),
        title: z.string(),
        goal: z.string(),
        narrative: z.array(z.string()),
        /** What the generator should build for this section. */
        build: z.array(
          z.enum([
            "timeline",
            "model_history",
            "atom_model",
            "atom_3d",
            "nucleus_3d",
            "particles_table",
            "plum_pudding",
            "rutherford_scattering",
            "geiger_marsden_plot",
            "energy_levels",
            "isotopes_table",
            "scale_callout",
            "copper_zoom",
            "copper_facts",
            "quiz",
            "equations",
          ]),
        ),
        quiz: z.object({ question: z.string(), options: z.array(Choice), correctId: z.string(), explanation: z.string(), feedback: z.record(z.string(), z.string()) }).optional(),
      }),
    ),
    timeline: z.array(z.object({ year: z.string(), title: z.string(), text: z.string() })),
    faq: z.array(
      z.object({
        question: z.string(),
        keywords: z.array(z.string()),
        answer: z.string(),
        conceptKey: z.string().optional(),
        /** Block kind (compose_block) the advisor attaches to illustrate the answer. */
        visual: z.string().optional(),
      }),
    ),
  }),
);
export type Topic = z.infer<typeof Topic>;
