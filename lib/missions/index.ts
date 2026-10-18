import type { Mission } from "@/lib/engine/types";
import { braking } from "./braking";
import { newton } from "./newton";
import { circular } from "./circular";
import { ohm } from "./ohm";
import { fountain } from "./fountain";
import { relativity } from "./relativity";
import { elevation } from "./elevation";
import { vectors } from "./vectors";
import { statics } from "./statics";
import { moments } from "./moments";
import { incline } from "./incline";

export const MISSIONS: Mission[] = [braking, newton, circular, ohm, fountain, relativity, elevation, vectors, statics, moments, incline].sort(
  (a, b) => a.order - b.order,
);

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id);
}
