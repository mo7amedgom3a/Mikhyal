/**
 * Constructive sandboxes (Brilliant-style): the student edits a structure, a deterministic
 * solver re-evaluates on every edit, and goals check themselves live. No "Run" button.
 */

export interface Goal<S, Sol> {
  id: string;
  /** Arabic label; may embed $LaTeX$. */
  label: string;
  check: (state: S, solved: Sol) => boolean;
  /** Part label to pin a ✓ badge on (e.g. a bulb "A"). */
  anchor?: string;
}

export interface SandboxLevel<S, Sol> {
  id: string;
  title: string;
  story: string;
  initial: S;
  goals: Goal<S, Sol>[];
  hints: string[];
  /** Concept ids credited in the learner model when the level is solved. */
  concepts: string[];
  /** What the student should notice once solved (shown after completion). */
  takeaway: string;
  freeBuild?: boolean;
}

export interface Sandbox<S, Sol> {
  id: string;
  title: string;
  tagline: string;
  icon: string;
  solve: (state: S) => Sol;
  levels: SandboxLevel<S, Sol>[];
  /** Compact text summary of the board for the AI tutor and analytics. */
  describe: (state: S, solved: Sol) => string;
}
