"use client";
import type { ComponentType } from "react";
import dynamic from "next/dynamic";
import type { SimId } from "@/lib/engine/types";
import type { SimProps } from "./useSimClock";
import { BrakingSim } from "./BrakingSim";
import { NewtonSim } from "./NewtonSim";
import { CircularRoadSim } from "./CircularRoadSim";
import { OhmCircuitSim } from "./OhmCircuitSim";
import { RelativitySim } from "./RelativitySim";
import { FountainSim } from "./FountainSim";
import { ElevationSim } from "./ElevationSim";
import { StaticsSim } from "./StaticsSim";
import { MomentsSim } from "./MomentsSim";
import { InclineSim } from "./InclineSim";

// Mafs (coordinate-plane engine) only loads on the mission that uses it.
const VectorsSim = dynamic(() => import("./VectorsSim").then((m) => m.VectorsSim), {
  ssr: false,
  loading: () => <div className="aspect-[800/340] w-full animate-pulse bg-sim" aria-hidden />,
});

export const SIMS: Record<SimId, ComponentType<SimProps>> = {
  braking: BrakingSim,
  newton: NewtonSim,
  circular: CircularRoadSim,
  ohm: OhmCircuitSim,
  relativity: RelativitySim,
  fountain: FountainSim,
  elevation: ElevationSim,
  vectors: VectorsSim,
  statics: StaticsSim,
  moments: MomentsSim,
  incline: InclineSim,
};
