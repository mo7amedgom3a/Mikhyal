"use client";
import { useEffect, useState } from "react";
import { BrakingSim } from "@/components/sims/BrakingSim";
import { stoppingDistance } from "@/lib/physics/braking";

/** A live, playable slice of the braking mission right in the hero. */
export function HeroDemo() {
  const [a, setA] = useState(4);
  const [runKey, setRunKey] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setRunKey((k) => k + 1), 500);
    return () => clearTimeout(id);
  }, [a]);
  const s = stoppingDistance(20, a);
  const ok = s <= 30;
  const fill = ((a - 1) / 11) * 100;
  return (
    <div className="card overflow-hidden shadow-[0_8px_0_0_var(--border)]">
      <div className="flex items-center justify-between border-b-2 border-line px-4 py-2.5">
        <span className="text-sm font-bold text-ink">🚗 جرّبها دلوقتي: وقّف العربية قبل العائق</span>
        <span className={`chip !py-0 text-xs ${ok ? "!border-mint !text-mint-dark" : "!border-danger !text-danger"}`}>{ok ? "وقفت ✓" : "هتخبط ✗"}</span>
      </div>
      <div dir="ltr">
        <BrakingSim params={{ u: 20, a }} runKey={runKey} onFinish={() => undefined} />
      </div>
      <div className="space-y-2 p-4">
        <label htmlFor="hero-a" className="flex justify-between text-sm font-semibold text-ink-2">
          <span>التباطؤ (قوة الفرامل)</span>
          <span className="ltr font-latin font-bold text-primary">{a.toFixed(1)} m/s²</span>
        </label>
        <input id="hero-a" type="range" className="slider" min={1} max={12} step={0.1} value={a} onChange={(e) => setA(parseFloat(e.target.value))} style={{ ["--fill" as string]: `${fill}%` }} />
        <p className="text-sm text-ink-3">حرّك السلايدر — المحاكاة بتتحسب لحظيًا من قوانين الفيزيا، مش فيديو.</p>
      </div>
    </div>
  );
}
