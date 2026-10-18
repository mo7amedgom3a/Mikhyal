"use client";
import { useEffect, useState } from "react";
import { Tex } from "@/components/ui/Tex";

/** Shows a pre-rendered Manim clip when available, else an animated KaTeX derivation. */
export function DiscoveryClip({ clip, derivation }: { clip?: string; derivation: string[] }) {
  const [hasClip, setHasClip] = useState(false);
  const [shown, setShown] = useState(1);

  useEffect(() => {
    if (!clip) return;
    let alive = true;
    // public/clips/clips.json lists the Manim clips that have actually been rendered.
    fetch("/clips/clips.json")
      .then((r) => (r.ok ? r.json() : []))
      .then((list: string[]) => alive && setHasClip(list.includes(clip.split("/").pop() ?? "")))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [clip]);

  useEffect(() => {
    if (hasClip || shown >= derivation.length) return;
    const id = setTimeout(() => setShown((s) => s + 1), 900);
    return () => clearTimeout(id);
  }, [hasClip, shown, derivation.length]);

  if (hasClip && clip) {
    return (
      <video src={clip} controls autoPlay muted playsInline className="w-full rounded-[16px] border-2 border-line bg-ink" aria-label="اشتقاق العلاقة (Manim)" />
    );
  }
  return (
    <div className="space-y-2 rounded-[16px] border-2 border-line bg-sim p-4">
      {derivation.slice(0, shown).map((d, i) => (
        <div key={i} className="pop-in text-lg">
          <Tex block>{d}</Tex>
        </div>
      ))}
    </div>
  );
}
