"use client";
import dynamic from "next/dynamic";
import type { ComponentType } from "react";

const loading = () => <div className="h-[420px] animate-pulse rounded-[20px] border-2 border-border bg-sim" aria-label="بيحمّل المحاكاة" />;

/** One lazily loaded simulation per phenomenon: each page ships only its own sim. */
export const PHENOMENON_SIMS: Record<string, ComponentType> = {
  magnetism: dynamic(() => import("./MagnetismSim").then((m) => m.MagnetismSim), { ssr: false, loading }),
  "hall-effect": dynamic(() => import("./HallSim").then((m) => m.HallSim), { ssr: false, loading }),
  photoelectric: dynamic(() => import("./PhotoelectricSim").then((m) => m.PhotoelectricSim), { ssr: false, loading }),
  "thermal-expansion": dynamic(() => import("./ThermalExpansionSim").then((m) => m.ThermalExpansionSim), { ssr: false, loading }),
  "phase-transitions": dynamic(() => import("./PhaseSim").then((m) => m.PhaseSim), { ssr: false, loading }),
  entropy: dynamic(() => import("./EntropySim").then((m) => m.EntropySim), { ssr: false, loading }),
  "wave-particle": dynamic(() => import("./DoubleSlitSim").then((m) => m.DoubleSlitSim), { ssr: false, loading }),
  tunneling: dynamic(() => import("./TunnelingSim").then((m) => m.TunnelingSim), { ssr: false, loading }),
  unruh: dynamic(() => import("./UnruhSim").then((m) => m.UnruhSim), { ssr: false, loading }),
};
