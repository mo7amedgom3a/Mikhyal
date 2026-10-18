"use client";
import type { ComponentType } from "react";
import type { SimId } from "@/lib/engine/types";
import type { SimProps } from "./useSimClock";
import { BrakingSim } from "./BrakingSim";
import { NewtonSim } from "./NewtonSim";
import { CircularRoadSim } from "./CircularRoadSim";
import { OhmCircuitSim } from "./OhmCircuitSim";
import { RelativitySim } from "./RelativitySim";
import { FountainSim } from "./FountainSim";

export const SIMS: Record<SimId, ComponentType<SimProps>> = {
  braking: BrakingSim,
  newton: NewtonSim,
  circular: CircularRoadSim,
  ohm: OhmCircuitSim,
  relativity: RelativitySim,
  fountain: FountainSim,
};
