/** Rendering/maths libraries and the tool catalog exposed to the AI agents. */
import type { AiTool, ToolLibrary } from "@/lib/domain";

export const LIBRARIES: ToolLibrary[] = [
  { id: "genui-core", name: "Mikhyal GenUI core", kind: "rendering", version: "1.0.0", description: "Headings, text with inline LaTeX, callouts, timelines, tables, quizzes, sections.", provides: ["heading", "text", "callout", "timeline", "table", "quiz", "section"] },
  { id: "katex", name: "KaTeX", kind: "math", version: "0.16", description: "Display and inline equations.", provides: ["equation"] },
  { id: "mafs", name: "Mafs", kind: "rendering", version: "0.21", description: "Interactive 2D plots of expressions and data points.", provides: ["plot"] },
  { id: "mathjs-rules", name: "mathjs (whitelisted rules)", kind: "math", version: "15", description: "Safe expression evaluation for readouts, plots and observations.", provides: ["sim.readouts", "sim.observations", "plot.series"] },
  { id: "svg-scenes", name: "SVG scene kit", kind: "rendering", version: "1.0.0", description: "Data-driven SVG scenes: atom model, plum pudding, energy levels.", provides: ["scene:atom_model", "scene:plum_pudding", "scene:energy_levels"] },
  { id: "canvas-particles", name: "Canvas 2D particle engine", kind: "physics", version: "1.0.0", description: "Particle beams and trajectories in central force fields (Coulomb scattering).", provides: ["scene:rutherford_scattering"] },
  { id: "atomic-physics", name: "lib/physics/atomic", kind: "physics", version: "1.0.0", description: "Bohr energies and radii, closest approach, Rutherford deflection and sampling.", provides: ["scene:rutherford_scattering", "scene:energy_levels"] },
  { id: "gsap", name: "GSAP", kind: "animation", version: "3.15", description: "Timed reveals and celebrations.", provides: ["animation"] },
];

const P = (type: string, description: string, required = false) => ({ type, description, required });

export const TOOLS: AiTool[] = [
  { name: "search_knowledge", description: "Search topics, concepts and content by free text.", parameters: { query: P("string", "free text", true) }, agents: ["advisor", "generator"], libraryIds: [] },
  { name: "get_topic", description: "Load a knowledge-base topic outline (sections, narrative, FAQ).", parameters: { slug: P("string", "topic slug", true) }, agents: ["advisor", "generator"], libraryIds: [] },
  { name: "get_concepts", description: "Concept details with prerequisites.", parameters: { keys: P("string[]", "concept keys", true) }, agents: ["advisor", "generator"], libraryIds: [] },
  { name: "get_equations", description: "Equations linked to concepts.", parameters: { conceptKeys: P("string[]", "concept keys", true) }, agents: ["advisor", "generator"], libraryIds: ["katex"] },
  { name: "get_elements", description: "Element data (Z, neutrons, shells, radii, isotopes).", parameters: { symbols: P("string[]", "element symbols; empty = all") }, agents: ["advisor", "generator"], libraryIds: [] },
  { name: "get_dataset", description: "Experimental dataset by id.", parameters: { id: P("string", "dataset id", true) }, agents: ["advisor", "generator"], libraryIds: [] },
  { name: "list_libraries", description: "Rendering/maths libraries the UI can use.", parameters: {}, agents: ["generator"], libraryIds: [] },
  {
    name: "compose_block",
    description: "Build one UI-spec block (visualization, simulation, plot, table, quiz…) from data.",
    parameters: { kind: P("string", "timeline | plum_pudding | rutherford_scattering | geiger_marsden_plot | scale_callout | atom_model | isotopes_table | energy_levels | quiz | equations | equation_explorer", true), topic: P("string", "topic slug"), section: P("string", "section id"), equationId: P("string", "for equation_explorer") },
    agents: ["advisor", "generator"],
    libraryIds: ["genui-core", "mafs", "svg-scenes", "canvas-particles", "atomic-physics", "mathjs-rules", "katex"],
  },
  { name: "validate_ui", description: "Validate a UI spec: schema, expressions, bound parameters, libraries.", parameters: { spec: P("UiSpec", "spec to validate", true) }, agents: ["generator"], libraryIds: ["mathjs-rules"] },
  { name: "publish_lesson", description: "Publish a validated UI spec as a lesson.", parameters: { slug: P("string", "lesson slug", true), spec: P("UiSpec", "spec", true) }, agents: ["generator"], libraryIds: [] },
  { name: "answer_faq", description: "Find the knowledge-base answer for a question within a topic.", parameters: { topic: P("string", "topic slug", true), question: P("string", "student question", true) }, agents: ["advisor"], libraryIds: [] },
  { name: "get_learner_state", description: "The current student's mastery and error profile.", parameters: {}, agents: ["advisor"], libraryIds: [] },
  { name: "recommend_content", description: "Adaptive next activities for the current student.", parameters: {}, agents: ["advisor"], libraryIds: [] },
];
