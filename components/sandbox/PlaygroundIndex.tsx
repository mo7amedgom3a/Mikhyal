"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowLeft, Check, Crosshair, Zap, type LucideIcon } from "lucide-react";
import { SANDBOXES } from "@/lib/sandbox";
import { loadProgress, type SandboxProgress } from "@/lib/sandbox/progress";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

const ICONS: Record<string, LucideIcon> = { Zap, Crosshair };

export function PlaygroundIndex() {
  const [progress, setProgress] = useState<SandboxProgress>({});
  useEffect(() => {
    loadProgress().then(setProgress);
  }, []);
  return (
    <main className="mx-auto max-w-[1100px] space-y-8 px-4 py-8">
      <div className="space-y-2">
        <Badge variant="default">ملعب التجارب</Badge>
        <h1 className="font-display text-4xl font-extrabold text-ink">ابني، جرّب، واتعلم من غير ما حد يقولك الإجابة</h1>
        <p className="max-w-2xl text-[17px] leading-8 text-ink-2">
          ألغاز تفاعلية: بتركّب القطع بإيدك والنتيجة بتتحسب لحظيًا من قوانين الفيزيا. كل مستوى فيه أهداف بتتعلّم عليها ✓ أول ما تتحقق.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        {SANDBOXES.map((s) => {
          const Icon = ICONS[s.icon] ?? Zap;
          const done = new Set(progress[s.id] ?? []);
          return (
            <Link
              key={s.id}
              href={`/play/${s.id}`}
              className="group flex flex-col gap-4 rounded-[20px] border-2 border-border bg-card p-6 shadow-[0_4px_0_0_var(--border)] outline-none transition-[transform,border-color] hover:-translate-y-0.5 hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/40"
            >
              <div className="flex items-start justify-between">
                <span className="grid size-16 place-items-center rounded-[18px] bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="size-8" aria-hidden />
                </span>
                <Badge variant={done.size === s.levels.length ? "mint" : "outline"}>
                  <span className="ltr font-latin">
                    {done.size}/{s.levels.length}
                  </span>
                  مستوى
                </Badge>
              </div>
              <div>
                <h2 className="text-xl font-bold text-ink group-hover:text-primary">{s.title}</h2>
                <p className="text-ink-2">{s.tagline}</p>
              </div>
              <Progress value={(done.size / s.levels.length) * 100} indicatorClassName="bg-mint" aria-label="التقدم" />
              <ol className="flex flex-wrap gap-1.5">
                {s.levels.map((l, i) => (
                  <li key={l.id} className={`flex items-center gap-1 rounded-full border-2 px-2.5 py-0.5 text-xs font-semibold ${done.has(l.id) ? "border-mint bg-mint-soft text-mint-dark" : "border-border text-ink-3"}`}>
                    {done.has(l.id) ? <Check className="size-3" aria-hidden /> : <span className="ltr font-latin">{i + 1}</span>}
                    {l.title}
                  </li>
                ))}
              </ol>
              <span className="mt-auto inline-flex items-center gap-1 font-bold text-primary">
                ابدأ <ArrowLeft className="size-4" />
              </span>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
