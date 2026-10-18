"""Discovery-step clips for Mikhyal missions.

Render all scenes:   ./manim/render.sh
Each MP4 lands in public/clips/ and is registered in public/clips/clips.json,
which the app reads to decide between the video and its KaTeX fallback.
"""
from manim import (
    BLUE, DOWN, UP, LEFT, RIGHT, ORIGIN,
    Axes, Create, DashedLine, Dot, FadeIn, MathTex, Scene, SurroundingRectangle,
    TransformMatchingTex, ValueTracker, VGroup, Write, always_redraw, config,
)

INDIGO = "#5146E8"
MINT = "#12A889"
AMBER = "#F4B544"
config.background_color = "#F8FAF9"
INK = "#172234"


def tex(*parts, **kw):
    return MathTex(*parts, color=INK, **kw)


class BrakingDerivation(Scene):
    """v = u - at and s = (u+v)/2 · t  →  v² = u² − 2as."""

    def construct(self):
        a = tex(r"v = u - at").shift(UP * 2)
        b = tex(r"s = \frac{u+v}{2}\,t").next_to(a, DOWN, buff=0.6)
        self.play(Write(a))
        self.play(Write(b))
        t = tex(r"t = \frac{u - v}{a}").next_to(b, DOWN, buff=0.6).set_color(INDIGO)
        self.play(FadeIn(t, shift=DOWN * 0.3))
        sub = tex(r"s = \frac{(u+v)(u-v)}{2a}").next_to(t, DOWN, buff=0.6)
        self.play(Write(sub))
        final = tex(r"s = \frac{u^2 - v^2}{2a}").move_to(sub)
        self.play(TransformMatchingTex(sub, final))
        result = tex(r"v^2 = u^2 - 2as").scale(1.4).move_to(ORIGIN + DOWN * 0.2)
        self.play(*[m.animate.set_opacity(0.15) for m in (a, b, t)], TransformMatchingTex(final, result))
        self.play(Create(SurroundingRectangle(result, color=MINT, buff=0.25)))
        self.wait(1.5)


class OhmRelation(Scene):
    """Plot I against V for two resistances: straight lines with slope 1/R."""

    def construct(self):
        axes = Axes(x_range=[0, 24, 4], y_range=[0, 4, 1], x_length=8, y_length=4.5,
                    axis_config={"color": INK}).shift(DOWN * 0.4)
        labels = axes.get_axis_labels(tex("V"), tex("I"))
        self.play(Create(axes), FadeIn(labels))
        for R, color in ((6, INDIGO), (12, MINT)):
            line = axes.plot(lambda v, R=R: v / R, x_range=[0, 24], color=color)
            lab = tex(rf"R = {R}\,\Omega").set_color(color).scale(0.8).next_to(line.get_end(), RIGHT)
            self.play(Create(line), FadeIn(lab))
        fuse = DashedLine(axes.c2p(0, 2), axes.c2p(24, 2), color=AMBER)
        self.play(Create(fuse), FadeIn(tex(r"I_{max} = 2\,A").set_color(AMBER).scale(0.7).next_to(fuse, UP).to_edge(LEFT)))
        law = tex(r"I = \frac{V}{R}").scale(1.4).to_edge(UP)
        self.play(Write(law), Create(SurroundingRectangle(law, color=MINT)))
        self.wait(1.5)


class FountainVertex(Scene):
    """The vertex sits halfway between the roots: h = -b / 2a."""

    def construct(self):
        a_t = ValueTracker(-1.0)
        b = 3.0
        axes = Axes(x_range=[0, 7, 1], y_range=[0, 4, 1], x_length=9, y_length=4.5,
                    axis_config={"color": INK}).shift(DOWN * 0.6)
        self.play(Create(axes))
        curve = always_redraw(lambda: axes.plot(
            lambda x: a_t.get_value() * x * x + b * x, x_range=[0, -b / a_t.get_value()], color=BLUE))
        vertex = always_redraw(lambda: Dot(axes.c2p(-b / (2 * a_t.get_value()), -b * b / (4 * a_t.get_value())), color=INDIGO))
        root = always_redraw(lambda: Dot(axes.c2p(-b / a_t.get_value(), 0), color=AMBER))
        guide = always_redraw(lambda: DashedLine(
            axes.c2p(-b / (2 * a_t.get_value()), 0), vertex.get_center(), color=INDIGO))
        self.play(Create(curve), FadeIn(vertex, root, guide))
        self.play(a_t.animate.set_value(-0.75), run_time=2)
        eqs = VGroup(
            tex(r"x_1 = 0,\quad x_2 = -\frac{b}{a}"),
            tex(r"h = \frac{x_1 + x_2}{2} = -\frac{b}{2a}").set_color(INDIGO),
        ).arrange(DOWN).to_edge(UP)
        self.play(Write(eqs[0]))
        self.play(Write(eqs[1]))
        self.wait(1.5)


class TimeDilation(Scene):
    """Light clock: (cΔt/2)² = L² + (vΔt/2)²  →  Δt = Δt₀ / √(1 − v²/c²)."""

    def construct(self):
        steps = [
            r"\Delta t_0 = \frac{2L}{c}",
            r"\left(\frac{c\,\Delta t}{2}\right)^2 = L^2 + \left(\frac{v\,\Delta t}{2}\right)^2",
            r"\Delta t^2 (c^2 - v^2) = 4L^2 = c^2 \Delta t_0^2",
            r"\Delta t = \frac{\Delta t_0}{\sqrt{1 - v^2/c^2}}",
        ]
        prev = None
        for i, s in enumerate(steps):
            m = tex(s).shift(UP * (2 - i * 1.3))
            self.play(Write(m))
            prev = m
        self.play(Create(SurroundingRectangle(prev, color=MINT, buff=0.2)))
        self.wait(1.5)
