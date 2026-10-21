"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Sandbox, SandboxLevel } from "./types";
import { loadProgress, markSolved, type SandboxProgress } from "./progress";
import { learnerService } from "@/lib/api/services";

interface History<S> {
  past: S[];
  present: S;
  future: S[];
}

const COALESCE_MS = 450;

/**
 * Sandbox runtime: undo/redo history (rapid drag updates coalesce into one step), a live
 * deterministic solve, per-goal status, and progress + learner-model credit on completion.
 */
export function useSandbox<S, Sol>(sandbox: Sandbox<S, Sol>, level: SandboxLevel<S, Sol>) {
  const [h, setH] = useState<History<S>>({ past: [], present: level.initial, future: [] });
  const [edits, setEdits] = useState(0);
  const [progress, setProgress] = useState<SandboxProgress>({});
  const lastCommit = useRef(0);
  const startedAt = useRef(Date.now());
  const credited = useRef(false);

  useEffect(() => {
    setH({ past: [], present: level.initial, future: [] });
    setEdits(0);
    startedAt.current = Date.now();
    credited.current = false;
  }, [level]);
  useEffect(() => {
    let alive = true;
    loadProgress().then((p) => alive && setProgress(p));
    return () => {
      alive = false;
    };
  }, []);

  const commit = useCallback((next: S, opts: { coalesce?: boolean } = {}) => {
    setH((cur) => {
      if (next === cur.present) return cur;
      const now = Date.now();
      const merge = opts.coalesce && now - lastCommit.current < COALESCE_MS && cur.past.length > 0;
      lastCommit.current = opts.coalesce ? now : 0;
      return merge ? { ...cur, present: next, future: [] } : { past: [...cur.past.slice(-99), cur.present], present: next, future: [] };
    });
    setEdits((e) => e + 1);
  }, []);

  const undo = useCallback(() => setH((c) => (c.past.length ? { past: c.past.slice(0, -1), present: c.past[c.past.length - 1], future: [c.present, ...c.future] } : c)), []);
  const redo = useCallback(() => setH((c) => (c.future.length ? { past: [...c.past, c.present], present: c.future[0], future: c.future.slice(1) } : c)), []);
  const reset = useCallback(() => setH((c) => ({ past: [...c.past, c.present], present: level.initial, future: [] })), [level]);

  const solution = useMemo(() => sandbox.solve(h.present), [sandbox, h.present]);
  const goalStatus = useMemo(() => level.goals.map((g) => g.check(h.present, solution)), [level, h.present, solution]);
  const solved = level.goals.length > 0 && goalStatus.every(Boolean);

  useEffect(() => {
    if (!solved || credited.current) return;
    credited.current = true;
    setProgress((p) => markSolved(p, sandbox.id, level.id));
    learnerService
      .events([
        {
          contentId: `lab_${sandbox.id}`,
          step: "sandbox",
          kind: "sandbox_level_complete",
          correct: true,
          detail: `${level.id} edits=${edits} seconds=${Math.round((Date.now() - startedAt.current) / 1000)}`,
          // Fewer edits = more independent evidence, mirroring how hints discount mastery.
          evidence: { conceptKeys: level.concepts, correct: true, hintsUsed: edits > 12 ? 1 : 0 },
          at: Date.now(),
        },
      ])
      .catch(() => undefined);
  }, [solved, sandbox.id, level, edits]);

  return {
    state: h.present,
    commit,
    undo,
    redo,
    reset,
    canUndo: h.past.length > 0,
    canRedo: h.future.length > 0,
    solution,
    goalStatus,
    solved,
    edits,
    progress,
    describe: () => sandbox.describe(h.present, solution),
  };
}

export type SandboxApi<S, Sol> = ReturnType<typeof useSandbox<S, Sol>>;
