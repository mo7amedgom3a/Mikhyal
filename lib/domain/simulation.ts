/**
 * Simulations and visual components.
 *
 * Content is declarative data; simulations are code "engines" registered by id. A record says
 * which engine to run, which parameters it exposes and which observables it produces. Labs made
 * by teachers can avoid custom code entirely with a rule-based OutcomeSpec.
 */
import { idOf, Latex, MathExpr } from "./common";
import { named, z } from "./z";

export const ParamSpec = named(
  "ParamSpec",
  z.object({
    key: z.string(),
    label: z.string(),
    symbol: z.string(),
    min: z.number(),
    max: z.number(),
    step: z.number().positive(),
    unit: z.string(),
    default: z.number(),
  }),
);
export type ParamSpec = z.infer<typeof ParamSpec>;

export const ObservableSpec = named(
  "ObservableSpec",
  z.object({ key: z.string(), label: z.string(), unit: z.string(), tex: Latex.optional() }),
);

export const VisualComponentKind = named(
  "VisualComponentKind",
  z.enum([
    "slider",
    "choice",
    "toggle",
    "readout",
    "plot2d",
    "vector_plane",
    "particle_canvas",
    "svg_scene",
    "circuit_board",
    "force_table",
    "solution_graph",
    "latex_block",
    "derivation_clip",
    "heatmap",
    "bar_meter",
  ]),
);

export const VisualComponent = named(
  "VisualComponent",
  z.object({
    id: idOf("visualComponent"),
    kind: VisualComponentKind,
    title: z.string(),
    description: z.string(),
    /** Library used on the frontend (Mafs, Canvas 2D, SVG, KaTeX…). */
    renderer: z.string(),
    /** JSON-schema-like description of the props a configured instance accepts. */
    props: z.record(z.string(), z.object({ type: z.string(), required: z.boolean().optional(), description: z.string().optional() })),
  }),
);
export type VisualComponent = z.infer<typeof VisualComponent>;

export const SimulationEngine = named(
  "SimulationEngine",
  z.object({
    id: idOf("simulation"),
    engineId: z.string().openapi({ example: "braking" }),
    kind: z.enum(["parametric", "sandbox", "phenomenon"]),
    title: z.string(),
    params: z.array(ParamSpec),
    observables: z.array(ObservableSpec),
    visualComponentIds: z.array(idOf("visualComponent")),
    conceptIds: z.array(idOf("concept")),
    /** Whether the engine can be configured without code (rules) or needs a coded engine. */
    configurable: z.boolean(),
  }),
);
export type SimulationEngine = z.infer<typeof SimulationEngine>;

/** A configured visual: a component bound to observables of a simulation. */
export const Visualization = named(
  "Visualization",
  z.object({
    id: idOf("visualization"),
    title: z.string(),
    componentId: idOf("visualComponent"),
    simulationId: idOf("simulation").optional(),
    bindings: z.record(z.string(), z.string()).openapi({ description: "prop → observable key or expression" }),
    props: z.record(z.string(), z.unknown()),
  }),
);
export type Visualization = z.infer<typeof Visualization>;

/** How an experiment run is judged. */
export const OutcomeSpec = named(
  "OutcomeSpec",
  z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("engine"), engineId: z.string() }),
    z.object({
      kind: z.literal("rules"),
      readouts: z.array(z.object({ label: z.string(), expr: MathExpr, unit: z.string().default(""), digits: z.number().int().min(0).max(6).default(2) })),
      success: MathExpr.openapi({ description: "Boolean expression over params, e.g. 'abs(u^2/(2*a) - 40) < 2'" }),
      messages: z.array(z.object({ when: MathExpr, text: z.string() })).openapi({ description: "First matching message wins; last one may be 'true'" }),
    }),
  ]),
);
export type OutcomeSpec = z.infer<typeof OutcomeSpec>;

export const SimulationRef = z.object({
  simulationId: idOf("simulation"),
  instruction: z.string(),
  params: z.array(ParamSpec),
  outcome: OutcomeSpec,
});
