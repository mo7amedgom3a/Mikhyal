"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import type { AgentRun, AgentStep, RunRequest } from "@/lib/domain";
import { agentService } from "@/lib/api/services";

export type RunPhase = "idle" | "planning" | "streaming" | "done" | "error";

/**
 * POST /ai/runs, then replay the transcript over SSE (/ai/runs/{id}/stream) so tool calls and the
 * generated UI appear step by step, as they would from a live model.
 */
export function useAgentRun() {
  const [phase, setPhase] = useState<RunPhase>("idle");
  const [run, setRun] = useState<AgentRun | null>(null);
  const [steps, setSteps] = useState<AgentStep[]>([]);
  const [error, setError] = useState<string | null>(null);
  const stop = useRef<(() => void) | null>(null);

  useEffect(() => () => stop.current?.(), []);

  const start = useCallback(async (req: RunRequest, opts: { speed?: number } = {}) => {
    stop.current?.();
    setPhase("planning");
    setSteps([]);
    setError(null);
    setRun(null);
    try {
      const r = await agentService.run(req);
      setRun(r);
      setPhase("streaming");
      return await new Promise<AgentRun>((resolve) => {
        const finish = () => {
          setSteps(r.steps);
          setPhase("done");
          resolve(r);
        };
        stop.current = agentService.stream(r.id, { step: (s) => setSteps((xs) => [...xs, s]), done: finish, error: finish }, opts.speed ?? 2.5);
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setPhase("error");
      return null;
    }
  }, []);

  const skip = useCallback(() => {
    stop.current?.();
    if (run) {
      setSteps(run.steps);
      setPhase("done");
    }
  }, [run]);

  return { phase, run, steps, error, start, skip };
}
