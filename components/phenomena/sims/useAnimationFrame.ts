"use client";
import { useEffect, useRef } from "react";

/** Calls `step(dt)` every frame (dt in seconds, capped) while `active`; pauses in hidden tabs. */
export function useAnimationFrame(step: (dt: number) => void, active: boolean) {
  const ref = useRef(step);
  useEffect(() => {
    ref.current = step;
  });
  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let last: number | null = null;
    const tick = (now: number) => {
      const dt = last === null ? 0 : Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!document.hidden) ref.current(dt);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}
