"use client";
import { useEffect, useRef, useState } from "react";

export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const on = () => setReduced(mq.matches);
    mq.addEventListener("change", on);
    return () => mq.removeEventListener("change", on);
  }, []);
  return reduced;
}

/**
 * Drives a simulation in physics time. `runKey` > 0 starts a run lasting `duration`
 * physics-seconds, played back at `timeScale` × real time. Reduced motion jumps to the end.
 */
export function useSimClock(runKey: number, duration: number, timeScale = 1, onFinish?: () => void) {
  const [t, setT] = useState(0);
  const [running, setRunning] = useState(false);
  const finishRef = useRef(onFinish);
  finishRef.current = onFinish;
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    if (runKey === 0) {
      setT(0);
      return;
    }
    if (reduced || !Number.isFinite(duration)) {
      setT(Number.isFinite(duration) ? duration : 0);
      setRunning(false);
      finishRef.current?.();
      return;
    }
    let raf = 0;
    let start: number | null = null;
    setRunning(true);
    const tick = (now: number) => {
      if (start === null) start = now;
      const sim = ((now - start) / 1000) * timeScale;
      if (sim >= duration) {
        setT(duration);
        setRunning(false);
        finishRef.current?.();
        return;
      }
      setT(sim);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runKey]);

  return { t, running };
}

export interface SimProps {
  params: Record<string, number>;
  runKey: number;
  onFinish: () => void;
}
