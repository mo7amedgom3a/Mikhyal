"use client";
import { useRef } from "react";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

/**
 * Scroll-driven motion for the landing page, wired through data attributes so the
 * page markup stays server-rendered:
 *  - [data-reveal]        fade + rise when scrolled into view
 *  - [data-stagger]       children rise one after another
 *  - [data-rows]          children slide in from alternating sides
 *  - [data-count]         number counts up from 0
 *  - [data-fade-guides]   [data-guide] lines fade out with scroll (scaffolding fading)
 *  - [data-float]         slow parallax drift while scrolling
 */
export function LandingMotion({ children }: { children: React.ReactNode }) {
  const scope = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        gsap.utils.toArray<HTMLElement>("[data-reveal]").forEach((el) => {
          gsap.from(el, {
            y: 48,
            autoAlpha: 0,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 85%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-stagger]").forEach((group) => {
          gsap.from(group.children, {
            y: 56,
            autoAlpha: 0,
            scale: 0.96,
            duration: 0.7,
            ease: "back.out(1.4)",
            stagger: 0.09,
            scrollTrigger: { trigger: group, start: "top 82%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-rows]").forEach((group) => {
          Array.from(group.children).forEach((row, i) => {
            gsap.from(row, {
              x: i % 2 ? -80 : 80,
              autoAlpha: 0,
              duration: 0.7,
              ease: "power3.out",
              scrollTrigger: { trigger: row, start: "top 90%", once: true },
            });
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-count]").forEach((el) => {
          const target = Number(el.dataset.count);
          const counter = { v: 0 };
          gsap.to(counter, {
            v: target,
            duration: 1.4,
            ease: "power2.out",
            onUpdate: () => {
              el.textContent = String(Math.round(counter.v));
            },
            scrollTrigger: { trigger: el, start: "top 90%", once: true },
          });
        });

        gsap.utils.toArray<HTMLElement>("[data-fade-guides]").forEach((group) => {
          const guides = group.querySelectorAll("[data-guide]");
          gsap.fromTo(
            guides,
            { autoAlpha: 1 },
            {
              autoAlpha: 0.08,
              ease: "none",
              stagger: 0.5,
              scrollTrigger: { trigger: group, start: "top 70%", end: "bottom 35%", scrub: true },
            },
          );
        });

        gsap.utils.toArray<HTMLElement>("[data-float]").forEach((el) => {
          gsap.to(el, {
            yPercent: Number(el.dataset.float) || -20,
            ease: "none",
            scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
          });
        });
      });
    },
    { scope },
  );

  return <div ref={scope}>{children}</div>;
}
