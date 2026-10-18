"use client";
import { forcesSandbox } from "@/lib/sandbox/forces/levels";
import { SandboxShell } from "../SandboxShell";
import { ForceBoard } from "./ForceBoard";

export default function ForcesPlayground() {
  return <SandboxShell sandbox={forcesSandbox} renderBoard={(api, level) => <ForceBoard key={level.id} api={api} />} />;
}
