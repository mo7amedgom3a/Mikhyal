"use client";
import { useEffect, useState } from "react";
import { CarFront, CircleCheck, TriangleAlert } from "lucide-react";
import { BrakingSim } from "@/components/sims/BrakingSim";
import { stoppingDistance } from "@/lib/physics/braking";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";

/** A live, playable slice of the braking mission right in the hero. */
export function HeroDemo() {
  const [a, setA] = useState(4);
  const [runKey, setRunKey] = useState(0);
  useEffect(() => {
    const id = setTimeout(() => setRunKey((k) => k + 1), 500);
    return () => clearTimeout(id);
  }, [a]);
  const ok = stoppingDistance(20, a) <= 30;
  return (
    <div className="overflow-hidden rounded-[20px] border-2 border-border bg-card shadow-[0_8px_0_0_var(--border)]">
      <div className="flex items-center justify-between gap-2 border-b-2 border-border px-4 py-2.5">
        <span className="flex items-center gap-2 text-sm font-bold text-ink">
          <CarFront className="size-4 text-primary" aria-hidden /> جرّبها دلوقتي: وقّف العربية قبل العائق
        </span>
        <Badge variant={ok ? "mint" : "destructive"} className="text-xs">
          {ok ? <CircleCheck /> : <TriangleAlert />}
          {ok ? "وقفت" : "هتخبط"}
        </Badge>
      </div>
      <div dir="ltr">
        <BrakingSim params={{ u: 20, a }} runKey={runKey} onFinish={() => undefined} />
      </div>
      <div className="space-y-2 p-4">
        <div className="flex justify-between text-sm font-semibold text-ink-2">
          <span id="hero-a-label">التباطؤ (قوة الفرامل)</span>
          <span className="ltr font-latin font-bold text-primary">{a.toFixed(1)} m/s²</span>
        </div>
        <Slider aria-labelledby="hero-a-label" min={1} max={12} step={0.1} value={[a]} onValueChange={([v]) => setA(v)} />
        <p className="text-sm text-ink-3">حرّك السلايدر — المحاكاة بتتحسب لحظيًا من قوانين الفيزيا، مش فيديو.</p>
      </div>
    </div>
  );
}
