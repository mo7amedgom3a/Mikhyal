# Manim discovery clips

Each mission's **Discovery** step can show a short [Manim Community](https://www.manim.community/) animation of how the relation is derived. Manim renders offline in Python, so clips are pre-rendered MP4s, not live browser animation.

| Scene | Mission | Shows |
|---|---|---|
| `BrakingDerivation` | braking | eliminating *t* to reach v² = u² − 2as |
| `OhmRelation` | ohm | I–V lines for two resistances, plus the fuse limit |
| `FountainVertex` | fountain | vertex halfway between the roots, h = −b/2a |
| `TimeDilation` | relativity | light-clock derivation of Δt = γΔt₀ |

```bash
pip install manim          # also needs Cairo, Pango, FFmpeg and LaTeX installed
./manim/render.sh          # writes public/clips/*.mp4 and public/clips/clips.json
```

The app reads `public/clips/clips.json`. Any clip not listed there falls back to a step-by-step KaTeX derivation, so the app works without rendering anything.
