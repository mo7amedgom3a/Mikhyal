"use client";
import { useEffect, useRef, useState } from "react";
import { Brain, Gauge, MousePointerClick, Route, Workflow, type LucideIcon } from "lucide-react";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

const ENGINE: { t: string; d: string; icon: LucideIcon }[] = [
  { t: "مساحة الطالب", d: "أفعال · توقعات · معادلات · إجابات · وقت", icon: MousePointerClick },
  { t: "مُقيّم الأحداث", d: "محاكاة حتمية + تحقق رياضي رمزي", icon: Gauge },
  { t: "نموذج المتعلم", d: "الإتقان · المفاهيم الخاطئة · المتطلبات السابقة", icon: Brain },
  { t: "المحرك التربوي", d: "تلميح · سؤال · تجربة · علاج", icon: Workflow },
  { t: "الخطوة الجاية", d: "تغيير المهمة، تلميح، تجربة، أو تقدّم", icon: Route },
];

/** A learning-event "packet" travels through the engine pipeline; each stage pulses as it passes. */
export function EngineFlow() {
  const scope = useRef<HTMLDivElement>(null);
  const [layoutKey, setLayoutKey] = useState(0);

  useEffect(() => {
    const ro = new ResizeObserver(() => setLayoutKey((k) => k + 1));
    if (scope.current) ro.observe(scope.current);
    return () => ro.disconnect();
  }, []);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const root = scope.current!;
        const nodes = gsap.utils.toArray<HTMLElement>("[data-node]");
        // offsetLeft/Top ignore transforms, so the reveal animation on the cards can't skew the path.
        const centers = nodes.map((n) => {
          const icon = n.querySelector<HTMLElement>("[data-node-icon]")!;
          let x = icon.offsetWidth / 2;
          let y = icon.offsetHeight / 2;
          for (let el: HTMLElement | null = icon; el && el !== root; el = el.offsetParent as HTMLElement | null) {
            x += el.offsetLeft;
            y += el.offsetTop;
          }
          return { x, y };
        });
        const tl = gsap.timeline({ repeat: -1, repeatDelay: 0.6, paused: true });
        gsap.set("[data-packet]", { x: centers[0].x, y: centers[0].y, xPercent: -50, yPercent: -50, autoAlpha: 0 });
        tl.to("[data-packet]", { autoAlpha: 1, scale: 1, duration: 0.2 });
        centers.forEach((c, i) => {
          tl.to("[data-packet]", { x: c.x, y: c.y, duration: i === 0 ? 0.01 : 0.7, ease: "power2.inOut" });
          tl.fromTo(
            nodes[i].querySelector("[data-node-icon]"),
            { scale: 1, backgroundColor: "#eef0ff", color: "#5146e8" },
            { scale: 1.18, backgroundColor: "#5146e8", color: "#ffffff", duration: 0.25, yoyo: true, repeat: 1, ease: "power1.inOut" },
            "<0.55",
          );
        });
        tl.to("[data-packet]", { autoAlpha: 0, scale: 0.4, duration: 0.3 });
        gsap.timeline({
          scrollTrigger: { trigger: root, start: "top 80%", end: "bottom 20%", onToggle: (self) => (self.isActive ? tl.play() : tl.pause()) },
        });
      });
    },
    { scope, dependencies: [layoutKey], revertOnUpdate: true },
  );

  return (
    <div ref={scope} className="relative mx-auto mt-12 max-w-[1100px]">
      <ol className="flex flex-col items-stretch gap-4 lg:flex-row" data-stagger>
        {ENGINE.map((s) => {
          const Icon = s.icon;
          return (
            <li key={s.t} data-node className="flex-1">
              <div className="h-full rounded-[20px] border-2 border-border bg-card p-4 text-center">
                <span data-node-icon className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
                  <Icon className="size-6" aria-hidden />
                </span>
                <p className="mt-2 font-bold text-primary">{s.t}</p>
                <p className="mt-1 text-sm text-ink-2">{s.d}</p>
              </div>
            </li>
          );
        })}
      </ol>
      <span
        data-packet
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 z-10 size-5 rounded-full bg-amber shadow-[0_0_0_6px_rgba(244,181,68,0.3),0_0_24px_rgba(244,181,68,0.8)]"
      />
    </div>
  );
}
