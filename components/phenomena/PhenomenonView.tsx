"use client";
import Link from "next/link";
import { useState } from "react";
import { ArrowLeft, BookOpen, Calculator, CircleCheck, FlaskConical, Lightbulb, Sigma, TriangleAlert } from "lucide-react";
import { checkNumeric, type NumericResult } from "@/lib/engine/evaluator";
import { gradingService } from "@/lib/api/services";
import { CATEGORY_LABEL, type PhenomenonModule } from "@/lib/phenomena";
import { HINT_TIERS } from "@/lib/workbench/types";
import { NumericInput } from "@/components/lesson/NumericInput";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { TIER_LABEL } from "@/components/workbench/StepCard";
import { PhenomenonIcon } from "./icons";
import { PHENOMENON_SIMS } from "./sims";

export function PhenomenonView({ module: m }: { module: PhenomenonModule }) {
  const Sim = PHENOMENON_SIMS[m.id];
  const [answer, setAnswer] = useState("");
  const [result, setResult] = useState<NumericResult | null>(null);
  const [hintLevel, setHintLevel] = useState(0);
  const [attempts, setAttempts] = useState(0);

  const check = async () => {
    let r: NumericResult;
    try {
      const g = await gradingService.phenomenonAnswer(m.id, answer);
      r = g.status === "incorrect" ? { status: "incorrect", diagnosis: g.diagnosis } : { status: g.status };
    } catch {
      r = checkNumeric(answer, m.mission.answer, m.mission.wrongValues);
    }
    setResult(r);
    if (r.status !== "correct") setAttempts((a) => a + 1);
  };

  return (
    <main className="mx-auto max-w-[1100px] space-y-6 px-4 py-8">
      <Link href="/phenomena" className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
        الظواهر ← {CATEGORY_LABEL[m.category].title}
      </Link>
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <span className="grid size-16 shrink-0 place-items-center rounded-[18px] bg-primary text-white">
          <PhenomenonIcon name={m.icon} className="size-8" />
        </span>
        <div className="space-y-1">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="default">{CATEGORY_LABEL[m.category].title}</Badge>
            {m.advanced && <Badge variant="amber">متقدّم · اختياري</Badge>}
          </div>
          <h1 className="font-display text-4xl font-extrabold text-ink">{m.title}</h1>
          <p className="text-lg text-ink-2">{m.tagline}</p>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="min-w-0 space-y-3 rounded-[20px] border-2 border-border bg-card p-5">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <BookOpen className="size-5 text-primary" /> الظاهرة
          </h2>
          <p className="text-[16px] leading-8 text-ink">
            <MathText>{m.description}</MathText>
          </p>
          <div className="rounded-[16px] bg-sim p-4 text-center text-2xl" dir="ltr">
            <Tex block>{m.equation.latex}</Tex>
          </div>
          <p className="text-sm text-ink-2">
            <MathText>{m.equation.meaning}</MathText>
          </p>
        </section>
        <section className="min-w-0 space-y-3 rounded-[20px] border-2 border-amber bg-amber-soft p-5">
          <h2 className="flex items-center gap-2 font-bold text-ink">
            <FlaskConical className="size-5 text-amber-dark" /> التجربة الشهيرة: {m.famous.title}
          </h2>
          <p className="text-sm font-semibold text-ink-2">
            {m.famous.who} · {m.famous.year}
          </p>
          <p className="text-[16px] leading-8 text-ink">
            <MathText>{m.famous.text}</MathText>
          </p>
        </section>
      </div>

      {Sim && <Sim />}

      <section className="space-y-3 rounded-[20px] border-2 border-border bg-card p-5">
        <h2 className="flex items-center gap-2 font-bold text-ink">
          <Sigma className="size-5 text-primary" /> المختبر الرياضي في الظاهرة دي
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <ol className="space-y-2">
            {m.workbench.chain.map((c, i) => (
              <li key={i} className="flex items-center gap-2 rounded-[12px] bg-sim px-3 py-2">
                <span className="font-latin text-sm font-bold text-primary">{i + 1}</span>
                <span className="min-w-0 overflow-x-auto text-lg" dir="ltr">
                  <Tex>{c}</Tex>
                </span>
              </li>
            ))}
          </ol>
          <ul className="space-y-2 text-[15px] leading-7 text-ink-2">
            {m.workbench.checks.map((c, i) => (
              <li key={i} className="flex gap-2">
                <CircleCheck className="mt-1 size-4 shrink-0 text-mint-dark" />
                <MathText>{c}</MathText>
              </li>
            ))}
          </ul>
        </div>
        {m.workbenchProblemId && (
          <Button asChild variant="mint" className="h-auto whitespace-normal py-2.5 text-start">
            <Link href={`/workbench/${m.workbenchProblemId}`}>
              افتح في المختبر الرياضي (درس كامل خطوة بخطوة) <ArrowLeft />
            </Link>
          </Button>
        )}
      </section>

      <section className="space-y-4 rounded-[20px] border-2 border-primary/40 bg-card p-5" aria-labelledby="mission-title">
        <div className="flex items-center gap-2">
          <Calculator className="size-5 text-primary" />
          <h2 id="mission-title" className="font-display text-2xl font-extrabold text-ink">
            مهمة: {m.mission.title}
          </h2>
        </div>
        <p className="text-[16px] leading-8 text-ink">
          <MathText>{m.mission.story}</MathText>
        </p>
        <p className="font-bold text-primary">
          <MathText>{m.mission.question}</MathText>
        </p>
        <NumericInput value={answer} onChange={setAnswer} onSubmit={check} placeholder={m.mission.unitHint} disabled={result?.status === "correct"} />
        {result?.status === "correct" && (
          <Alert variant="mint" className="pop-in">
            <CircleCheck />
            <AlertTitle>إجابة صحيحة!</AlertTitle>
            <AlertDescription className="text-ink">
              <div className="overflow-x-auto" dir="ltr">
                <Tex>{m.mission.solution}</Tex>
              </div>
            </AlertDescription>
          </Alert>
        )}
        {result && result.status !== "correct" && (
          <Alert variant="amber" className="pop-in">
            <TriangleAlert />
            <AlertTitle>{result.status === "parse_error" ? "مش قادر أقرا الإجابة" : "لسه مش هي"}</AlertTitle>
            <AlertDescription className="text-ink">
              <MathText>{result.status === "incorrect" && result.diagnosis ? result.diagnosis.prompt : result.status === "parse_error" ? "اكتب رقم وبعده الوحدة." : "جرّب تاني، أو خد تلميح."}</MathText>
            </AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Button variant="amber" size="sm" onClick={() => setHintLevel((h) => Math.min(4, h + 1))} disabled={hintLevel >= 4} className={attempts >= 2 && hintLevel === 0 ? "animate-pulse" : undefined}>
            <Lightbulb /> {hintLevel ? "تلميح أوضح" : "تلميح"}
          </Button>
          <ol className="space-y-2">
            {HINT_TIERS.slice(0, hintLevel).map((t, i) => (
              <li key={t} className="pop-in rounded-[12px] border-2 border-amber bg-amber-soft p-2.5 text-sm leading-7 text-ink">
                <b>
                  {i + 1}. {TIER_LABEL[t]}:{" "}
                </b>
                <MathText>{m.hints[t]}</MathText>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </main>
  );
}
