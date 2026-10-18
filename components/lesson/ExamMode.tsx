"use client";
import { useEffect, useState } from "react";
import { ChartColumn, CircleCheck, CircleX, ClipboardCheck, Clock, RotateCcw, Timer, Trophy } from "lucide-react";
import type { ChoiceRule, Mission } from "@/lib/engine/types";
import { ERROR_LABELS } from "@/lib/engine/pedagogy";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { MathText } from "@/components/ui/MathText";

interface Answer {
  qid: string;
  choiceId: string | null;
  correct: boolean;
  rule?: ChoiceRule;
}

export function ExamMode({ mission, onAnswer }: { mission: Mission; onAnswer: (correct: boolean, rule?: ChoiceRule) => void }) {
  const { questions, timeLimitSec } = mission.exam;
  const [started, setStarted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [picked, setPicked] = useState<string>("");
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [left, setLeft] = useState(timeLimitSec);
  const finished = answers.length === questions.length || (started && left <= 0);

  useEffect(() => {
    if (!started || finished) return;
    const id = setInterval(() => setLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [started, finished]);

  const submit = () => {
    const q = questions[idx];
    const correct = picked === q.correctId;
    const rule = q.rules.find((r) => r.choiceId === picked);
    setAnswers((a) => [...a, { qid: q.id, choiceId: picked, correct, rule }]);
    onAnswer(correct, rule);
    setPicked("");
    setIdx((i) => i + 1);
  };

  const restart = () => {
    setAnswers([]);
    setIdx(0);
    setPicked("");
    setLeft(timeLimitSec);
    setStarted(true);
  };

  if (!started) {
    return (
      <Card className="mx-auto max-w-[720px]">
        <CardContent className="flex flex-col items-center p-6 text-center sm:p-10">
          <span className="grid size-16 place-items-center rounded-[18px] bg-amber-soft text-amber-dark">
            <ClipboardCheck className="size-8" aria-hidden />
          </span>
          <h2 className="mt-3 font-display text-3xl font-extrabold text-ink">وضع الامتحان</h2>
          <p className="mx-auto mt-2 max-w-md text-ink-2">
            {questions.length} أسئلة بنظام امتحانات الثانوية العامة على نفس المفهوم، في {Math.round(timeLimitSec / 60)} دقايق. بعد ما تخلص هنقولك نوع كل غلطة.
          </p>
          <Button onClick={() => setStarted(true)} className="mt-6">
            <Timer />
            ابدأ الامتحان
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (finished) {
    const score = answers.filter((a) => a.correct).length;
    const perfect = score === questions.length;
    return (
      <Card className="mx-auto max-w-[760px]">
        <CardContent className="space-y-4 p-6 sm:p-8">
          <div className="flex flex-col items-center text-center">
            <span className={`grid size-16 place-items-center rounded-[18px] ${perfect ? "bg-mint-soft text-mint-dark" : "bg-primary-soft text-primary"}`}>
              {perfect ? <Trophy className="size-8" aria-hidden /> : <ChartColumn className="size-8" aria-hidden />}
            </span>
            <h2 className="mt-2 font-display text-3xl font-extrabold text-ink">
              النتيجة: <span className="ltr font-latin">{score} / {questions.length}</span>
            </h2>
            {left <= 0 && answers.length < questions.length && <p className="text-sm text-destructive">الوقت خلص قبل ما تكمّل.</p>}
          </div>
          {questions.map((q, i) => {
            const a = answers[i];
            return (
              <div key={q.id} className={`rounded-[16px] border-2 p-4 ${a?.correct ? "border-mint bg-mint-soft" : "border-border bg-surface"}`}>
                <p className="font-semibold text-ink">
                  <MathText>{q.question}</MathText>
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-2">
                  {a ? (
                    a.correct ? (
                      <>
                        <CircleCheck className="size-4 text-mint-dark" aria-hidden /> صح
                      </>
                    ) : (
                      <>
                        <CircleX className="size-4 text-destructive" aria-hidden /> اخترت: <MathText>{q.options.find((o) => o.id === a.choiceId)?.label ?? "—"}</MathText>
                      </>
                    )
                  ) : (
                    <>
                      <Clock className="size-4" aria-hidden /> ماتجاوبش
                    </>
                  )}
                </p>
                {a && !a.correct && a.rule && (
                  <p className="mt-2 rounded-[12px] bg-amber-soft p-2 text-sm text-ink">
                    <b>خطأ {ERROR_LABELS[a.rule.errorType]}:</b> <MathText>{a.rule.prompt}</MathText>
                  </p>
                )}
                <p className="mt-2 text-sm text-ink-2">
                  <b>الحل:</b> <MathText>{q.explanation}</MathText>
                </p>
              </div>
            );
          })}
          <div className="flex justify-center">
            <Button variant="outline" onClick={restart}>
              <RotateCcw />
              أعد المحاولة
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  const q = questions[idx];
  const mm = Math.floor(Math.max(left, 0) / 60);
  const ss = String(Math.max(left, 0) % 60).padStart(2, "0");
  return (
    <Card className="mx-auto max-w-[720px]">
      <CardContent className="space-y-5 p-6 sm:p-8">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span className="text-ink-3">
            سؤال {idx + 1} من {questions.length}
          </span>
          <Badge variant={left < 30 ? "destructive" : "outline"} className="ltr font-latin">
            <Timer />
            {mm}:{ss}
          </Badge>
        </div>
        <Progress value={(left / timeLimitSec) * 100} indicatorClassName={left < 30 ? "bg-destructive" : "bg-amber"} aria-label="الوقت المتبقي" />
        <h3 className="text-xl font-bold leading-9 text-ink">
          <MathText>{q.question}</MathText>
        </h3>
        <ToggleGroup type="single" value={picked} onValueChange={setPicked} className="sm:grid-cols-2" aria-label="الاختيارات">
          {q.options.map((o) => (
            <ToggleGroupItem key={o.id} value={o.id} className="justify-start text-lg">
              <MathText>{o.label}</MathText>
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
        <div className="flex justify-end">
          <Button disabled={!picked} onClick={submit}>
            {idx + 1 === questions.length ? "إنهاء" : "التالي"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
