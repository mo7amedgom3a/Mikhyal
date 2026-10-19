"use client";
import { useMemo, useState } from "react";
import { Eye, EyeOff, StepForward } from "lucide-react";
import type { WorkbenchProblem } from "@/lib/workbench/types";
import { chainTex, replayPath } from "@/lib/workbench/steps";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/MathText";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tex } from "@/components/ui/Tex";
import { OPERATION_LABEL } from "./StepCard";
import { VerdictPill } from "./Verdicts";

/** Authored solution routes, revealed one step at a time and annotated with their own validation. */
export function SolutionExplorer({ problem, onPathChange }: { problem: WorkbenchProblem; onPathChange?: (index: number) => void }) {
  const replays = useMemo(() => problem.paths.map((p) => replayPath(problem, p.steps)), [problem]);
  const [revealed, setRevealed] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);

  return (
    <section className="space-y-3 rounded-[20px] border-2 border-border bg-card p-4 sm:p-5" aria-labelledby="explorer-title">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 id="explorer-title" className="font-display text-xl font-extrabold text-ink">
            مستكشف الحلول
          </h2>
          <p className="text-sm text-ink-2">أكتر من طريق صحيح — مش لازم تمشي بطريقة المدرّس. الخطوات بتظهر واحدة واحدة.</p>
        </div>
        <Button variant="outline" size="sm" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
          {open ? <EyeOff /> : <Eye />} {open ? "اخفي" : "اعرض الحلول المكتوبة"}
        </Button>
      </div>
      {open && (
        <Tabs defaultValue={problem.paths[0].id} onValueChange={(v) => onPathChange?.(problem.paths.findIndex((p) => p.id === v))}>
          <TabsList className="flex-wrap">
            {problem.paths.map((p) => (
              <TabsTrigger key={p.id} value={p.id}>
                {p.title_ar}
              </TabsTrigger>
            ))}
          </TabsList>
          {problem.paths.map((p, pi) => {
            const n = revealed[p.id] ?? 1;
            return (
              <TabsContent key={p.id} value={p.id} className="space-y-2 pt-2">
                <ol className="space-y-2">
                  {p.steps.slice(0, n).map((s, i) => {
                    const v = replays[pi].validations[i];
                    return (
                      <li key={i} className="pop-in rounded-[14px] border-2 border-border bg-surface p-3">
                        <div className="flex flex-wrap items-center gap-2 text-sm">
                          <span className="font-latin font-bold text-primary">{i + 1}</span>
                          <span className="font-semibold text-ink-3">{OPERATION_LABEL[s.operation]}</span>
                          <span className="flex-1" />
                          <VerdictPill property="mathematical" verdict={v.mathematical} />
                          <VerdictPill property="physical" verdict={v.physical} />
                        </div>
                        <div className="mt-2 overflow-x-auto text-lg" dir="ltr">
                          <Tex>{(chainTex(problem, s.latex) ?? s.latex) + (s.unit ? `\\;\\mathrm{${s.unit}}` : "")}</Tex>
                        </div>
                        <p className="mt-1 text-sm text-ink-2">
                          <MathText>{s.explanation || v.pedagogical.note_ar}</MathText>
                        </p>
                      </li>
                    );
                  })}
                </ol>
                {n < p.steps.length ? (
                  <Button size="sm" variant="amber" onClick={() => setRevealed((r) => ({ ...r, [p.id]: n + 1 }))}>
                    <StepForward /> الخطوة الجاية ({n}/{p.steps.length})
                  </Button>
                ) : (
                  <p className="text-sm font-semibold text-mint-dark">الطريق ده كله متحقَّق منه بنفس محرك التحقق ✓</p>
                )}
              </TabsContent>
            );
          })}
        </Tabs>
      )}
    </section>
  );
}
