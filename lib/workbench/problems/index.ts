import type { WorkbenchProblem } from "../types";
import { brakingWorkbench } from "./braking";
import { frictionWorkbench } from "./friction";
import { photoelectricWorkbench } from "./photoelectric";
import { thermalWorkbench } from "./thermal";

export const WORKBENCH_PROBLEMS: WorkbenchProblem[] = [brakingWorkbench, photoelectricWorkbench, thermalWorkbench, frictionWorkbench];

export function getWorkbenchProblem(id: string): WorkbenchProblem | undefined {
  return WORKBENCH_PROBLEMS.find((p) => p.id === id);
}
