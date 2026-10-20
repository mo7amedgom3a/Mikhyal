# مِخيال · Mikhyal

**ماتحفظش القانون… اكتشفه.** An AI-guided, experiment-first learning playground for physics and mathematics, built for Egyptian General Secondary (Thanaweya Amma) students.

Most tutoring follows the same pattern: explain a topic, solve a few problems, move to the next chapter. Mikhyal reverses it. Every lesson is a **mission** that runs through a six-step loop:

| # | Step | What the student does |
|---|------|-----------------------|
| 1 | Challenge | Meets a real problem before any theory ("stop the car before the obstacle") |
| 2 | Predict | Commits to a hypothesis, so a wrong mental model becomes visible |
| 3 | Experiment | Changes variables in a deterministic simulation and tests the idea |
| 4 | Discover | Writes the governing relation; it is checked symbolically |
| 5 | Apply | Solves a new-context problem with units, using the Problem Solver Framework |
| 6 | Reflect | Sees mastery evidence and the reasoning errors that still need work |

Each mission also has an **Exam mode**: timed questions in the style of the curriculum, with diagnosed errors.

## What's in this MVP

- **Landing page** (`/`): positioning, a live braking demo in the hero, the learning loop, the AI tutor, a comparison with traditional platforms, missions, the Discovery and Exam modes, the Problem Solver Framework, the engine, teachers, pricing (early-access hypothesis) and a waitlist. The waitlist only saves to localStorage for now.
- **Learning path** (`/learn`): mission cards with mastery rings and a map of the student's error types.
- **Eleven missions** (`/learn/[id]`) in physics, math, and applied math (statics):

| Mission | Simulation | Student discovers |
|---|---|---|
| 🚗 Stopping a car | braking with trail marks | v² = u² − 2as |
| 🚚 Heaviest load with limited force | winch pulling a truck | F = ma |
| 🛣️ Safe curved road | top-down curve with skid-off | a = v²/r, v_max = √(μgr) |
| 💡 Light the lamp without blowing the fuse | live circuit, ammeter, fuse | I = V/R |
| ⛲ Fountain trajectory | parabola with roots and vertex | h = −b/2a |
| 🚀 Space twins (enrichment) | dilated clocks + γ(β) curve | Δt = γΔt₀ |
| 📐 Measure the Cairo Tower | drag the observer and the line of sight | h = d·tanθ |
| ➡️ Two tugboats in the Suez Canal | drag force vectors on a Mafs plane (parallelogram rule) | R = √(F₁² + F₂² + 2F₁F₂cosθ) |
| ⚖️ Hang the shop sign | drag cable anchors; live triangle of forces | T = W / (2 sinθ) |
| 🎢 Balance the seesaw | drag people along the beam; torque bars | m₁d₁ = m₂d₂ |
| 📦 When does the box slide? | drag the ramp; free-body diagram | μ = tanθ |

## Playground: Brilliant-style sandboxes (`/play`)

Constructive puzzles with no Run button. The student builds, a deterministic solver re-evaluates on every edit, and goals tick ✓ live. Levels are progressive, and the tutor reads the live board.

- **Circuit Builder** (`/play/circuits`, 7 levels):
  - Drag batteries, bulbs, wires, resistors and switches from a tray onto a dotted grid. Tapping and full keyboard control also work.
  - Modified Nodal Analysis (`lib/sandbox/circuit/solver.ts`) drives bulb glow, current-flow animation and short-circuit detection.
  - Levels cover closing the loop, series, parallel, choosing branches, switches, and a bypass puzzle where one wire darkens two inner bulbs.
- **Force Table** (`/play/forces`, 5 levels): drag force vectors on a ring (Mafs) until the resultant vanishes. The head-to-tail force polygon closes at equilibrium. Levels cover equal and opposite forces, perpendicular forces, three forces at 120°, Lami's theorem, and limited forces.
- **Shared engine:**
  - `lib/sandbox/types.ts`, `useSandbox.ts`: undo/redo (drags coalesce into one step), live goal checks, local progress, learner-model credit.
  - `components/sandbox/SandboxShell.tsx`: level rail, goals, hints, AI tutor, celebration.
  - A new sandbox only needs a model, a solver, a board and levels.
- Missions link to their related sandbox from the reflection step: Ohm's law → circuits; vectors and statics → force table.

## Math lesson: arithmetic sequences & the recursive formula (`/sequences`)

A full interactive lesson built for a real classroom validation (المتتاليات الحسابية والصيغة الارتدادية, textbook pp. 19–20):

- **Recap & definition**: click any term to see $a_{n-1}$, $a_n$, $a_{n+1}$; glossary of the lesson terms.
- **Staircase sim**: sliders for $a_1$, $d$ and the number of terms; each term is revealed by one recursive step $a_n = a_{n-1} + d$ (bars or number-line view), with small challenges.
- **Race sim**: recursive (n − 1 additions) vs. the general term $a_n = a_1 + (n-1)d$ (one step), with the points $(n, a_n)$ plotted on their line of slope $d$.
- **Detective**: type any list (fractions and Arabic digits accepted); it checks the differences, shows where they break, and flags geometric lists such as homework Q15.
- **Practice**: textbook-style questions with targeted feedback for common mistakes (e.g. using $n$ instead of $n-1$).
- **Feedback survey**: understanding before/after, sim helpfulness, comparison with class, free text. The student's activity (time on page, sims used, practice attempts) is attached automatically and POSTed to `/api/feedback`. Each entry is logged as a `[mikhyal-feedback] {json}` line in the server log; set `FEEDBACK_WEBHOOK_URL` to also forward it (e.g. a Google Apps Script that appends rows to a Sheet).

## Mathematical Workbench: grading reasoning, not just answers (`/workbench`)

Students solve step by step. Each step is a structured object (the wire format the backend validates), not a string:

```json
{ "step_id": "step_002", "attempt_id": "attempt_1a2b3c4d", "expression_latex": "s = \\frac{v^2-u^2}{2a}",
  "expression_ast": ["Equal", "s", ["Divide", ["Subtract", ["Power", "v", 2], ["Power", "u", 2]], ["Multiply", 2, "a"]]],
  "ast_version": "mathjson/1", "operation": "isolate_variable", "inputs": ["step_001"], "target_variable": "s",
  "unit": "m", "student_explanation": "I isolated distance", "client_step_id": "uuid-for-retry" }
```

- **Three independent properties per step.**
  - *Mathematical*: is the step equivalent to its inputs? Root sets are compared in both directions, so a step that **loses solutions** or **adds extraneous ones** is caught, not just a wrong one.
  - *Physical*: dimensions, principle applicability (e.g. $F = ma$ when friction is stated is valid maths but an *incomplete model*), sign conventions, constraints, and agreement with the situation.
  - *Pedagogical*: does the step advance the current goal?
- **Solution graphs, not decision trees** (`lib/workbench/problems/*`):
  - Nodes are known quantities, principles, equation applications, transformations, intermediate goals/values, constraints and goals; edges are dependency, derivation, substitution or alternative.
  - Every problem has at least two authored paths and at least one multi-dependency node.
  - The graph is **not exhaustive**: a valid step that matches no node is accepted and recorded as an *unanticipated route* (e.g. $s = \\tfrac12(u+v)t$ for braking).
- **Pipeline** (`lib/workbench/validate.ts`, shown live at `/workbench/pipeline`):
  1. Restricted parser (whitelisted AST with size limits, so no code execution) → MathJSON.
  2. Symbolic, unit and physics checks.
  3. Graph matcher.
  4. Pedagogical decision: accept · clarify · hint · experiment · AI interpretation.

  The layer table maps each MVP layer to its production tool (Compute Engine, SymPy, Pint).
- **Recoverable errors with diagnosis:**
  - a flipped sign ("your arithmetic is right for the value you used, but a should be negative");
  - an unconverted unit (eV subtracted from J);
  - the wrong model ($s = ut$, which leads to an experiment);
  - a wrong rearrangement (caught by the units check).
- **Subtle errors**: $x^2 = 9 \\to x = 3$, squaring both sides, dividing by $x$, $\\sin\\theta = \\tfrac12$, and $(x^2-1)/(x-1)$. Each gets a Socratic nudge instead of right/wrong, and toggling the stated assumption changes the verdict.
- **UI:**
  - graduated hints (conceptual → strategic → procedural → verification, contextual to the next graph node);
  - a live completion checklist;
  - per-step retry with fresh `attempt_id`/`client_step_id`;
  - a solution explorer with progressive reveal;
  - a scripted demo.
  - Steps are validated by `POST /api/workbench/validate`, with an offline fallback.
- **Problems:** braking distance (canonical), photoelectric effect, thermal expansion (rail gaps), and friction ("$F = ma$ is not enough").

## Phenomena, instructors and parents

- **`/phenomena`**: nine famous phenomena in three groups:
  - electromagnetic: magnetism, Hall effect, photoelectric;
  - thermal: expansion, phase transitions, entropy;
  - quantum and relativistic: wave–particle duality, tunnelling, Unruh (advanced, optional).

  Each module has a description, its famous experiment, the Workbench equation chain and checks, a graded mission (any unit), and 4-tier hints. Values come from `lib/physics/phenomena.ts`.
- **«شوف إزاي بتشتغل» simulations** (`components/phenomena/sims/`). Each page lazy-loads one interactive sim with sliders, live readouts, a "notice" caption, guided observations that tick ✓, and the mechanism step by step:
  - **Magnetism**: field rings that circulate by the right-hand rule, and a draggable compass pulled between Earth's field and the wire's.
  - **Hall effect**: canvas carriers deflected by the Lorentz force; the edge charge builds until the voltage settles. Switching between electrons and holes flips the sign.
  - **Photoelectric**: photons coloured by wavelength; no emission below f₀ whatever the intensity. Includes a Mafs plot of K_max against f.
  - **Thermal expansion**: rails closing their gap, or buckling when there is none, a jiggling atom lattice, and a bimetallic strip.
  - **Phase transitions**: the molecules in a beaker change state, alongside a live heating curve with its mL plateaus.
  - **Entropy**: hot and cold molecules mix through elastic collisions while ΔS rises, plus a "rewind the film" button.
  - **Double slit**: electrons arrive one by one, sampled from |ψ|², and build the fringes. Options for one slit or a which-path detector.
  - **Tunnelling**: the barrier and wavefunction in Mafs, with a Monte Carlo counter that converges to T ≈ e^(−2κL).
  - **Unruh** (conceptual): an inertial vacuum next to an accelerated glow, and a log–log plot of T against a.

  The animation and drawing use SVG, Canvas 2D, Mafs and @use-gesture. The physics comes from pure, unit-tested helpers in `lib/physics/phenomena.ts`. With reduced motion, each sim shows a static end state.
- **`/teach`**:
  - The class view shows a step-validity heatmap (stage × property), the reasoning-route split, recoverable-error ranking with recovery rate, and each student's path drawn on the graph with the point where they diverged. The 32 mock students are scripted step sequences run through the **real validator**.
  - A **graph authoring tool** lets you edit nodes, edges, paths, hints and interventions, with live checks for cycles, unreachable goals, unproduced requirements and unreadable formulas, plus JSON export.
- **`/parents`**: mastery by phenomenon category and problem-solving skill, reasoning-quality insights such as "isolated the variable but missed a domain constraint", and at-home discussion prompts.
- **`/features`**: feature sheets for students, instructors and parents.

## The reactive learning engine

```
Student workspace (actions · predictions · equations · answers)
        │
        ▼
Event evaluator ── deterministic physics (lib/physics) + symbolic/unit checks (lib/engine/evaluator.ts)
        │
        ▼
Learner model ── per-concept mastery (Bayesian Knowledge Tracing) + error history (lib/engine/learnerModel.ts)
        │
        ▼
Pedagogical engine ── diagnosis → intervention (lib/engine/pedagogy.ts)
        │
        ▼
Next action ── hint · question · contrasting experiment · remediation · advance
```

- **No LLM on the hot path.** Sliders, animation, equation checks and unit checks are all deterministic.
- **Equation checking** samples points that satisfy the target relation and tests the student's equation at those points. Any algebraic rearrangement is accepted, and identities are rejected. Known wrong relations (missing factor 2, inverted ratio, using *t* when time is unknown) map to specific diagnoses.
- **Five error types** each trigger a different intervention:

| Error type | Intervention |
|---|---|
| Conceptual | Contrasting experiment |
| Mathematical | Targeted question on the step |
| Representational | Redraw the situation |
| Procedural | Method hint |
| Transfer | Same principle in a new setting |

- **LaTeX and complex equations.** Students type equations in a visual math editor ([MathLive](https://mathlive.io)) with a palette for fractions, roots, powers, subscripts, Greek letters, trig/log functions and degrees, or switch to a LaTeX/text box. `lib/engine/latex.ts` converts LaTeX (`\frac`, `\sqrt[n]{}`, `\left(…\right)`, `t_{0}`, `\theta`, `\sin 30^\circ`, …) and Unicode math (`²`, `√`, `π`, `t₀`, `×`, `½`, Arabic digits) into expressions the checker grades. Numeric answers accept `3\times10^{8}\,\text{m/s}`, `\frac{400}{60} m/s^2` or `2.2 μs`, and the app shows how each input was read before grading. Any text that embeds `$…$` or `$$…$$` (mission content, feedback, exam explanations, tutor replies) renders with KaTeX.
- **The Problem Solver Framework** scaffolding fades from full to partial to none as mastery grows.
- **AI tutor** (`app/api/tutor/route.ts`): a Socratic tutor in Egyptian Arabic, grounded on each mission's verified relation and the current workspace state. It uses Claude through `@anthropic-ai/sdk` (default model `claude-opus-5-5`, low effort, server-side refusal fallback). It is called only for free-text questions or deeper hints. Without an API key, or on any error, the deterministic rules engine answers instead.

## Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · lucide icons · GSAP + ScrollTrigger · Mafs + @use-gesture (draggable vectors and handles) · SVG simulations · Math.js (expressions and units) · KaTeX · Anthropic SDK · Vitest · Manim (offline clips).

UI components live in `components/ui/` as shadcn source (`components.json` is set up, so `npx shadcn add <component>` works). Landing-page motion lives in `components/landing/motion/`: a hero word reveal with floating formula chips and pointer parallax, a scroll-drawn learning-loop timeline, a replayed tutor chat, an engine "event packet" loop, tilt cards and a reading-progress bar. All of it respects `prefers-reduced-motion`.

Design follows the *Playful Scientific Minimalism* system: Electric Indigo `#5146E8`, Discovery Mint `#12A889`, Insight Amber `#F4B544`, IBM Plex Sans Arabic + Inter, with a Duolingo-style feel (chunky "sticker" buttons with a pressable ledge, rounded display type, a full-bleed footer band). The layout is Arabic-first RTL, with equations isolated left-to-right.

## Running

```bash
npm install
cp .env.example .env.local   # optional: add ANTHROPIC_API_KEY to enable the Claude tutor
npm run dev                  # http://localhost:3000
npm test                     # engine, physics and mission tests
npm run build
```

### Manim clips (optional)

```bash
pip install manim   # also needs Cairo, Pango, FFmpeg, LaTeX
./manim/render.sh   # renders public/clips/*.mp4 and registers them in clips.json
```

Until clips are rendered, the Discovery step shows an animated KaTeX derivation instead. See `manim/README.md`.

## Project layout

```
app/                    landing, /learn, /learn/[missionId], /api/tutor
components/landing/     hero demo, waitlist
components/lesson/      mission player, exam mode, tutor panel, inputs, feedback, mastery
components/sims/        six SVG simulations driven in physics time
lib/physics/            pure deterministic models
lib/engine/             types, evaluator, learner model, pedagogy, tutor contract
lib/missions/           mission content (Arabic) + misconception rules
manim/                  Manim scenes + render script
tests/                  Vitest suites
```

## Next steps

- Map missions against the current Grade 11/12 and Egyptian Baccalaureate syllabi.
- Add a backend (accounts, PostgreSQL, event store) so the learner model and waitlist persist beyond the browser.
- Add a teacher console and parent summaries, and an authoring tool for new missions.
- Add SymPy (restricted language, explicit assumptions, time limits) and Pint behind `/api/workbench/validate` as a second opinion to the numeric checks.
- Run a pilot with pre/post transfer tests and pricing experiments.
