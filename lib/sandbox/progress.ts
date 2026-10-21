/** Which lab levels a student has solved — stored in the learner model behind the API. */
import { learnerService } from "@/lib/api/services";

export type SandboxProgress = Record<string, string[]>;

export async function loadProgress(): Promise<SandboxProgress> {
  try {
    return (await learnerService.model()).labProgress;
  } catch {
    return {};
  }
}

/** Optimistically add the level, then persist; the server merges with what it already has. */
export function markSolved(current: SandboxProgress, sandboxId: string, levelId: string): SandboxProgress {
  const next = { ...current, [sandboxId]: [...new Set([...(current[sandboxId] ?? []), levelId])] };
  learnerService.saveLabProgress(sandboxId, [levelId]).catch(() => undefined);
  return next;
}
