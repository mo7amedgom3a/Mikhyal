"use client";
import { useRef } from "react";
import { gsap, useGSAP } from "./gsap";

/** Pulls its child gently toward the pointer (CTA buttons). */
export function Magnetic({ children, strength = 0.3 }: { children: React.ReactNode; strength?: number }) {
  const el = useRef<HTMLSpanElement>(null);
  const api = useRef<{ x: gsap.QuickToFunc; y: gsap.QuickToFunc } | null>(null);
  useGSAP(() => {
    api.current = {
      x: gsap.quickTo(el.current, "x", { duration: 0.6, ease: "elastic.out(1, 0.4)" }),
      y: gsap.quickTo(el.current, "y", { duration: 0.6, ease: "elastic.out(1, 0.4)" }),
    };
  });
  return (
    <span
      ref={el}
      className="inline-block"
      onPointerMove={(e) => {
        if (!api.current || !el.current || !window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches) return;
        const r = el.current.getBoundingClientRect();
        api.current.x((e.clientX - (r.left + r.width / 2)) * strength);
        api.current.y((e.clientY - (r.top + r.height / 2)) * strength);
      }}
      onPointerLeave={() => {
        api.current?.x(0);
        api.current?.y(0);
      }}
    >
      {children}
    </span>
  );
}
