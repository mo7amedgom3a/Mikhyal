"use client";
import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

/** Reading-progress bar pinned under the sticky header. */
export function ScrollProgress() {
  const bar = useRef<HTMLDivElement>(null);
  useGSAP(() => {
    const mm = gsap.matchMedia();
    mm.add(MOTION_OK, () => {
      gsap.fromTo(
        bar.current,
        { scaleX: 0 },
        { scaleX: 1, ease: "none", scrollTrigger: { trigger: document.documentElement, start: "top top", end: "bottom bottom", scrub: 0.3 } },
      );
    });
  });
  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-30 h-1" aria-hidden>
      <div ref={bar} className="h-full origin-right scale-x-0 bg-gradient-to-l from-primary via-mint to-amber motion-reduce:hidden" />
    </div>
  );
}
