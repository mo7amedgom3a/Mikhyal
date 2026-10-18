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
- **Six missions** (`/learn/[id]`):

| Mission | Simulation | Student discovers |
|---|---|---|
| 🚗 Stopping a car | braking with trail marks | v² = u² − 2as |
| 🚚 Heaviest load with limited force | winch pulling a truck | F = ma |
| 🛣️ Safe curved road | top-down curve with skid-off | a = v²/r, v_max = √(μgr) |
| 💡 Light the lamp without blowing the fuse | live circuit, ammeter, fuse | I = V/R |
| ⛲ Fountain trajectory | parabola with roots and vertex | h = −b/2a |
| 🚀 Space twins (enrichment) | dilated clocks + γ(β) curve | Δt = γΔt₀ |

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

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui (Radix) · lucide icons · GSAP + ScrollTrigger · SVG simulations · Math.js (expressions and units) · KaTeX · Anthropic SDK · Vitest · Manim (offline clips).

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
- Add SymPy server-side validation for richer symbolic work.
- Run a pilot with pre/post transfer tests and pricing experiments.
