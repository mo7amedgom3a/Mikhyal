/** Which sandbox levels a student has solved; local to this browser like the learner model. */
const KEY = "mikhyal.sandbox.v1";

export type SandboxProgress = Record<string, string[]>;

export function loadProgress(): SandboxProgress {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? "{}") as SandboxProgress;
  } catch {
    return {};
  }
}

export function markSolved(sandboxId: string, levelId: string): SandboxProgress {
  const p = loadProgress();
  const set = new Set(p[sandboxId] ?? []);
  set.add(levelId);
  const next = { ...p, [sandboxId]: [...set] };
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // storage unavailable; progress lives for this session only
  }
  return next;
}
