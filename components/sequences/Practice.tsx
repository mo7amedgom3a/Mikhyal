"use client";
import { useState } from "react";
import { Check, CircleCheck, Lightbulb, TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { parseNumber } from "@/lib/sequences";
import type { PracticeQuestion } from "@/lib/sequences/practice";
import { cn } from "@/lib/utils";
import { useLessonTracker } from "./tracker";

export function Practice({ questions }: { questions: PracticeQuestion[] }) {
  return (
    <ol className="space-y-4">
      {questions.map((q, i) => (
        <li key={q.id}>
          <QuestionCard q={q} index={i + 1} />
        </li>
      ))}
    </ol>
  );
}

type Feedback = { ok: boolean; messages: string[] } | null;

function QuestionCard({ q, index }: { q: PracticeQuestion; index: number }) {
  const { recordAttempt } = useLessonTracker();
  const [values, setValues] = useState<Record<string, string>>({});
  const [picked, setPicked] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [hint, setHint] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const solved = feedback?.ok === true;

  const check = () => {
    let result: Feedback;
    if (q.kind === "fields") {
      const messages: string[] = [];
      let ok = true;
      for (const f of q.fields) {
        const v = parseNumber(values[f.key] ?? "");
        if (v === null) {
          ok = false;
          messages.push(`أكمل الخانة ${f.label} برقم.`);
        } else if (Math.abs(v - f.answer) > (f.tolerance ?? 1e-9)) {
          ok = false;
          const known = f.wrong?.find((w) => Math.abs(w.value - v) <= (f.tolerance ?? 1e-9));
          messages.push(known ? known.why : `راجع ${f.label}`);
        }
      }
      result = { ok, messages };
    } else {
      if (!picked) return;
      result = picked === q.answer ? { ok: true, messages: [] } : { ok: false, messages: [q.why[picked] ?? "راجع الاختيار."] };
    }
    setFeedback(result);
    setAttempts((a) => a + 1);
    recordAttempt(q.id, result.ok);
  };

  return (
    <article className={cn("space-y-3 rounded-[20px] border-2 bg-card p-4 sm:p-5", solved ? "border-mint/60" : "border-border")} data-question={q.id}>
      <p className="text-[16px] leading-8 text-ink">
        <span className="me-2 inline-grid size-7 place-items-center rounded-full bg-primary-soft font-latin text-sm font-bold text-primary">{index}</span>
        <MathText>{q.prompt}</MathText>
      </p>

      {q.kind === "fields" ? (
        <div className="flex flex-wrap gap-3">
          {q.fields.map((f) => (
            <label key={f.key} className="flex items-center gap-2 rounded-[14px] border-2 border-border bg-surface px-3 py-2">
              <span className="text-ink-2">
                <MathText>{f.label}</MathText>
              </span>
              <Input
                dir="ltr"
                inputMode="decimal"
                className="h-10 w-24 font-latin text-lg"
                value={values[f.key] ?? ""}
                disabled={solved}
                onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                onKeyDown={(e) => e.key === "Enter" && check()}
                aria-label={f.label.replace(/\$/g, "")}
              />
            </label>
          ))}
        </div>
      ) : (
        <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
          {q.options.map((o) => (
            <button
              key={o.id}
              type="button"
              role="radio"
              aria-checked={picked === o.id}
              disabled={solved}
              onClick={() => setPicked(o.id)}
              className={cn("rounded-[14px] border-2 px-3 py-3 text-lg transition-colors", picked === o.id ? "border-primary bg-primary-soft" : "border-border bg-surface hover:border-primary")}
              dir={o.text ? "rtl" : "ltr"}
            >
              {o.text ? <MathText>{o.text}</MathText> : <Tex>{o.tex ?? ""}</Tex>}
            </button>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {!solved && (
          <Button size="sm" onClick={check} disabled={q.kind === "choice" && !picked}>
            <Check /> تحقّق
          </Button>
        )}
        {!solved && (
          <Button size="sm" variant="ghost" onClick={() => setHint(true)}>
            <Lightbulb /> تلميح
          </Button>
        )}
      </div>

      {hint && !solved && (
        <p className="rounded-[12px] border-2 border-amber bg-amber-soft px-3 py-2 text-[15px] leading-7 text-ink">
          <MathText>{q.hint}</MathText>
        </p>
      )}
      {feedback && !feedback.ok && (
        <div className="space-y-1 rounded-[12px] border-2 border-destructive/30 bg-danger-soft px-3 py-2 text-[15px] leading-7 text-ink" aria-live="polite">
          <p className="flex items-center gap-1.5 font-bold text-destructive">
            <TriangleAlert className="size-4" /> ليس بعد
          </p>
          {feedback.messages.map((m, i) => (
            <p key={i}>
              <MathText>{m}</MathText>
            </p>
          ))}
          {attempts >= 3 && (
            <p className="pt-1 text-ink-2">
              <span className="font-bold">الحل: </span>
              <MathText>{q.solution}</MathText>
            </p>
          )}
        </div>
      )}
      {solved && (
        <div className="space-y-1 rounded-[12px] border-2 border-mint/50 bg-mint-soft px-3 py-2 text-[15px] leading-7 text-ink" aria-live="polite">
          <p className="flex items-center gap-1.5 font-bold text-mint-dark">
            <CircleCheck className="size-4" /> إجابة صحيحة!
          </p>
          <MathText>{q.solution}</MathText>
        </div>
      )}
    </article>
  );
}
