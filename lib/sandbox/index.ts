import type { Sandbox } from "./types";
import { circuitSandbox } from "./circuit/levels";
import { forcesSandbox } from "./forces/levels";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const SANDBOXES: Sandbox<any, any>[] = [circuitSandbox, forcesSandbox];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function getSandbox(id: string): Sandbox<any, any> | undefined {
  return SANDBOXES.find((s) => s.id === id);
}
