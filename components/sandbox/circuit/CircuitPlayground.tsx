"use client";
import { circuitSandbox } from "@/lib/sandbox/circuit/levels";
import { SandboxShell } from "../SandboxShell";
import { CircuitBoard, CircuitReadouts } from "./CircuitBoard";

export default function CircuitPlayground() {
  return (
    <SandboxShell
      sandbox={circuitSandbox}
      renderBoard={(api, level) => <CircuitBoard key={level.id} api={api} level={level} />}
      renderSide={(api) => (
        <>
          <p className="mb-2 text-sm font-bold text-ink-2">القياسات (بتتحسب لحظيًا)</p>
          <CircuitReadouts api={api} />
        </>
      )}
    />
  );
}
