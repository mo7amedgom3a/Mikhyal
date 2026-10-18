"use client";
import { useRef } from "react";
import { cn } from "@/lib/utils";
import { gsap, useGSAP } from "./gsap";

/** 3D tilt + moving glare that follows the pointer. Skipped for touch and reduced motion. */
export function TiltCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const el = useRef<HTMLDivElement>(null);
  const glare = useRef<HTMLSpanElement>(null);
  const api = useRef<{ rx: gsap.QuickToFunc; ry: gsap.QuickToFunc } | null>(null);

  useGSAP(() => {
    gsap.set(el.current, { transformPerspective: 900 });
    api.current = {
      rx: gsap.quickTo(el.current, "rotationX", { duration: 0.5, ease: "power3.out" }),
      ry: gsap.quickTo(el.current, "rotationY", { duration: 0.5, ease: "power3.out" }),
    };
  });

  const enabled = () =>
    typeof window !== "undefined" && window.matchMedia("(hover: hover) and (prefers-reduced-motion: no-preference)").matches;

  return (
    <div
      ref={el}
      className={cn("relative h-full [transform-style:preserve-3d]", className)}
      onPointerMove={(e) => {
        if (!enabled() || !el.current || !api.current) return;
        const r = el.current.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        api.current.ry((px - 0.5) * 14);
        api.current.rx((0.5 - py) * 12);
        if (glare.current) {
          glare.current.style.setProperty("--gx", `${px * 100}%`);
          glare.current.style.setProperty("--gy", `${py * 100}%`);
          glare.current.style.opacity = "1";
        }
      }}
      onPointerLeave={() => {
        api.current?.rx(0);
        api.current?.ry(0);
        if (glare.current) glare.current.style.opacity = "0";
      }}
    >
      {children}
      <span
        ref={glare}
        aria-hidden
        className="pointer-events-none absolute inset-0 rounded-[20px] opacity-0 transition-opacity duration-300"
        style={{ background: "radial-gradient(circle at var(--gx,50%) var(--gy,50%), rgba(255,255,255,0.55), transparent 55%)" }}
      />
    </div>
  );
}
