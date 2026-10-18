"use client";
import { useRef } from "react";
import { FlaskConical, Lightbulb, MessageCircleQuestion, Puzzle, Repeat, Target, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from "./gsap";

const LOOP: { icon: LucideIcon; title: string; body: string }[] = [
  { icon: Target, title: "تحدّي", body: "بنبدأ بمشكلة حقيقية مثيرة، قبل أي قانون أو شرح." },
  { icon: MessageCircleQuestion, title: "توقّع", body: "بتقول رأيك الأول: إيه اللي هيحصل؟ عشان تفكيرك يبان." },
  { icon: FlaskConical, title: "جرّب", body: "بتغيّر المتغيرات بإيدك في محاكاة حقيقية وتختبر فكرتك." },
  { icon: Lightbulb, title: "اكتشف", body: "بتربط اللي شفته بالعلاقة الرياضية وتكتبها بنفسك." },
  { icon: Puzzle, title: "طبّق", body: "بتحل مسألة جديدة في موقف مختلف لوحدك." },
  { icon: Repeat, title: "راجع", body: "بنحدد إيه اللي فهمته، وإيه لسه محتاج شغل." },
];

/** Vertical timeline: the line fills as you scroll and each step lights up when reached. */
export function LoopPath() {
  const scope = useRef<HTMLOListElement>(null);

  useGSAP(
    () => {
      const steps = gsap.utils.toArray<HTMLElement>("[data-step]");
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.fromTo("[data-line-fill]", { scaleY: 0 }, { scaleY: 1, ease: "none", scrollTrigger: { trigger: scope.current, start: "top 60%", end: "bottom 60%", scrub: 0.4 } });
        steps.forEach((step, i) => {
          gsap.from(step.querySelector("[data-step-card]"), {
            x: i % 2 ? -70 : 70,
            autoAlpha: 0,
            duration: 0.8,
            ease: "power3.out",
            scrollTrigger: { trigger: step, start: "top 80%", once: true },
          });
          ScrollTrigger.create({
            trigger: step,
            start: "top 60%",
            onEnter: () => step.setAttribute("data-active", ""),
            onLeaveBack: () => step.removeAttribute("data-active"),
          });
        });
      });
      // Without motion every step is simply shown as reached.
      mm.add("(prefers-reduced-motion: reduce)", () => {
        steps.forEach((s) => s.setAttribute("data-active", ""));
      });
    },
    { scope },
  );

  return (
    <ol ref={scope} className="relative mx-auto mt-14 max-w-[900px] space-y-6 md:space-y-10">
      {/* spine */}
      <span aria-hidden className="absolute bottom-6 top-6 start-6 w-1.5 rounded-full bg-border md:start-1/2 md:-translate-x-1/2 rtl:md:translate-x-1/2">
        <span data-line-fill className="block h-full w-full origin-top rounded-full bg-gradient-to-b from-primary via-mint to-amber" />
      </span>
      {LOOP.map((s, i) => {
        const Icon = s.icon;
        return (
          <li key={s.title} data-step className="group relative grid items-center gap-4 ps-16 md:grid-cols-2 md:gap-16 md:ps-0">
            {/* node */}
            <span
              aria-hidden
              className="absolute start-6 top-1/2 z-10 grid size-12 -translate-y-1/2 place-items-center rounded-full border-[3px] border-border bg-surface text-ink-3 transition-all duration-500 ltr:-translate-x-1/2 rtl:translate-x-1/2 group-data-[active]:scale-110 group-data-[active]:border-primary group-data-[active]:bg-primary group-data-[active]:text-white md:start-1/2"
            >
              <Icon className="size-5" />
            </span>
            <div data-step-card className={cn("md:col-span-1", i % 2 ? "md:col-start-2" : "md:col-start-1")}>
              <div className="relative rounded-[20px] border-2 border-border bg-card p-6 shadow-[0_4px_0_0_var(--border)] transition-[border-color,box-shadow] duration-500 group-data-[active]:border-primary group-data-[active]:shadow-[0_6px_0_0_var(--brand-primary)]">
                <span className="absolute end-5 top-4 font-latin text-4xl font-black text-primary-soft transition-colors duration-500 group-data-[active]:text-primary/25">{i + 1}</span>
                <h3 className="text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-ink-2">{s.body}</p>
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
