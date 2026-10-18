"use client";
import Link from "next/link";
import { useRef } from "react";
import { ArrowLeft, ClipboardCheck, Languages, PlayCircle, Smartphone, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tex } from "@/components/ui/Tex";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { gsap, MOTION_OK, useGSAP } from "./gsap";
import { Magnetic } from "./Magnetic";

const LINE_1 = "ماتحفظش القانون…";
const LINE_2 = "اكتشفه بإيدك.";

const FORMULAS = [
  { tex: "v^2 = u^2 - 2as", cls: "-top-5 start-6", color: "text-primary" },
  { tex: "F = ma", cls: "top-1/3 -end-4", color: "text-mint-dark" },
  { tex: "I = \\tfrac{V}{R}", cls: "-bottom-6 end-10", color: "text-amber-dark" },
  { tex: "a = \\tfrac{v^2}{r}", cls: "bottom-1/4 -start-6", color: "text-primary" },
];

/** Split by words, not letters: Arabic glyphs must stay joined. */
function Words({ text, className }: { text: string; className?: string }) {
  return (
    <span className={className}>
      {text.split(" ").map((w, i) => (
        <span key={i} className="inline-block overflow-hidden pb-2 align-bottom">
          <span data-hero-word className="inline-block">
            {w}
            {" "}
          </span>
        </span>
      ))}
    </span>
  );
}

export function HeroIntro() {
  const scope = useRef<HTMLElement>(null);
  const stage = useRef<HTMLDivElement>(null);

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
        tl.from("[data-hero-badge]", { y: -16, autoAlpha: 0, duration: 0.5 })
          .from("[data-hero-word]", { yPercent: 110, rotate: 4, autoAlpha: 0, duration: 0.9, stagger: 0.08 }, "-=0.2")
          .from("[data-hero-sub]", { y: 24, autoAlpha: 0, duration: 0.7 }, "-=0.5")
          .from("[data-hero-cta] > *", { y: 20, autoAlpha: 0, scale: 0.9, duration: 0.6, stagger: 0.1, ease: "back.out(2)" }, "-=0.4")
          .from("[data-hero-chip]", { y: 12, autoAlpha: 0, duration: 0.4, stagger: 0.06 }, "-=0.3")
          .from("[data-hero-demo]", { x: -60, rotate: -3, autoAlpha: 0, duration: 1 }, 0.3)
          .from("[data-formula]", { scale: 0, autoAlpha: 0, duration: 0.6, stagger: 0.12, ease: "back.out(2.5)" }, "-=0.5");

        // Formula chips bob gently forever.
        gsap.utils.toArray<HTMLElement>("[data-formula]").forEach((el, i) => {
          gsap.to(el, { y: i % 2 ? 10 : -10, rotate: i % 2 ? 3 : -3, duration: 2.4 + i * 0.4, ease: "sine.inOut", yoyo: true, repeat: -1, delay: 1.5 });
        });

        // Underline sweep under the key phrase.
        gsap.from("[data-hero-underline]", { scaleX: 0, transformOrigin: "right center", duration: 0.8, ease: "power2.inOut", delay: 1.1 });
      });
    },
    { scope },
  );

  // Pointer parallax on the demo stage: chips move more than the card.
  const onMove = contextSafe((e: React.PointerEvent) => {
    if (!stage.current || !window.matchMedia(`(hover: hover) and ${MOTION_OK}`).matches) return;
    const r = stage.current.getBoundingClientRect();
    const dx = (e.clientX - r.left) / r.width - 0.5;
    const dy = (e.clientY - r.top) / r.height - 0.5;
    gsap.to("[data-hero-demo]", { x: dx * 10, y: dy * 10, duration: 0.6, ease: "power2.out", overwrite: "auto" });
    gsap.utils.toArray<HTMLElement>("[data-formula-wrap]").forEach((el, i) => {
      gsap.to(el, { x: dx * (28 + i * 8), y: dy * (28 + i * 8), duration: 0.8, ease: "power2.out", overwrite: "auto" });
    });
  });
  const onLeave = contextSafe(() => {
    gsap.to(["[data-hero-demo]", "[data-formula-wrap]"], { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.5)" });
  });

  return (
    <section ref={scope} className="mx-auto grid max-w-[1200px] items-center gap-12 px-4 pb-20 pt-10 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
      <div className="space-y-6">
        <Badge data-hero-badge variant="default">
          <Zap /> ملعب علمي تفاعلي لطلاب الثانوية العامة
        </Badge>
        <h1 className="font-display text-[40px] font-extrabold leading-[1.15] text-ink sm:text-[56px]">
          <Words text={LINE_1} />
          <br />
          <span className="relative inline-block text-primary">
            <Words text={LINE_2} />
            <span data-hero-underline aria-hidden className="absolute inset-x-0 bottom-1 -z-10 h-3 rounded-full bg-amber/50" />
          </span>
        </h1>
        <p data-hero-sub className="max-w-[520px] text-[18px] leading-9 text-ink-2">
          مِخيال بيحوّل الفيزيا والرياضيات من شرح وحفظ لتجارب وتحديات. بتتوقّع، تجرّب، تكتشف العلاقة بنفسك — ومرشد ذكي بيشخّص طريقة تفكيرك، مش بس إجابتك. وبعدها تطبّق على أسئلة الامتحانات.
        </p>
        <div data-hero-cta className="flex flex-wrap gap-3">
          <Magnetic>
            <Button asChild size="lg">
              <Link href="/learn/braking">
                جرّب أول مهمة مجانًا
                <ArrowLeft />
              </Link>
            </Button>
          </Magnetic>
          <Button asChild size="lg" variant="outline">
            <a href="#how">
              <PlayCircle />
              إزاي بنتعلم؟
            </a>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge data-hero-chip>
            <Languages /> بالعامية المصرية
          </Badge>
          <Badge data-hero-chip>
            <Smartphone /> بيشتغل على الموبايل
          </Badge>
          <Badge data-hero-chip>
            <ClipboardCheck /> مربوط بالمنهج والامتحانات
          </Badge>
        </div>
      </div>
      <div ref={stage} className="relative" onPointerMove={onMove} onPointerLeave={onLeave}>
        <div data-hero-demo>
          <HeroDemo />
        </div>
        {FORMULAS.map((f) => (
          <div key={f.tex} data-formula-wrap className={`pointer-events-none absolute hidden sm:block ${f.cls}`} aria-hidden>
            <div data-formula className={`rounded-[14px] border-2 border-border bg-surface px-3 py-1.5 text-lg shadow-[0_4px_0_0_var(--border)] ${f.color}`}>
              <Tex>{f.tex}</Tex>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
