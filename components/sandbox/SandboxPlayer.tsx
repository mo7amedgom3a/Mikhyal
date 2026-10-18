"use client";
import dynamic from "next/dynamic";

const Loading = () => <div className="mx-auto mt-10 h-[60vh] max-w-[1280px] animate-pulse rounded-[20px] bg-muted" aria-hidden />;

// Each sandbox (and its engine, e.g. Mafs) loads only on its own page.
const PLAYERS = {
  circuits: dynamic(() => import("./circuit/CircuitPlayground"), { ssr: false, loading: Loading }),
  forces: dynamic(() => import("./forces/ForcesPlayground"), { ssr: false, loading: Loading }),
};

export function SandboxPlayer({ id }: { id: string }) {
  const Player = PLAYERS[id as keyof typeof PLAYERS];
  return Player ? <Player /> : null;
}
