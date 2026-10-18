"use client";
import { useEffect, useState } from "react";
import type { ChoiceRule, Mission } from "@/lib/engine/types";
import { ERROR_LABELS } from "@/lib/engine/pedagogy";

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
  const [picked, setPicked] = useState<string | null>(null);
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
    setPicked(null);
    setIdx((i) => i + 1);
  };

  const restart = () => {
    setAnswers([]);
    setIdx(0);
    setPicked(null);
    setLeft(timeLimitSec);
    setStarted(true);
  };

  if (!started) {
    return (
      <div className="card mx-auto max-w-[720px] p-6 text-center sm:p-10">
        <p className="text-4xl">📝</p>
        <h2 className="mt-2 font-display text-3xl font-extrabold text-ink">وضع الامتحان</h2>
        <p className="mx-auto mt-2 max-w-md text-ink-2">
          {questions.length} أسئلة بنظام امتحانات الثانوية العامة على نفس المفهوم، في {Math.round(timeLimitSec / 60)} دقايق. بعد ما تخلص هنقولك نوع كل غلطة.
        </p>
        <button onClick={() => setStarted(true)} className="btn btn-primary mt-6">
          ابدأ الامتحان ⏱️
        </button>
      </div>
    );
  }

  if (finished) {
    const score = answers.filter((a) => a.correct).length;
    return (
      <div className="card mx-auto max-w-[760px] space-y-4 p-6 sm:p-8">
        <div className="text-center">
          <p className="text-4xl">{score === questions.length ? "🏆" : "📊"}</p>
          <h2 className="font-display text-3xl font-extrabold text-ink">
            النتيجة: <span className="ltr font-latin">{score} / {questions.length}</span>
          </h2>
          {left <= 0 && answers.length < questions.length && <p className="text-sm text-danger">الوقت خلص قبل ما تكمّل.</p>}
        </div>
        {questions.map((q, i) => {
          const a = answers[i];
          return (
            <div key={q.id} className={`rounded-[16px] border-2 p-4 ${a?.correct ? "border-mint bg-mint-soft" : "border-line bg-surface"}`}>
              <p className="font-semibold text-ink">{q.question}</p>
              <p className="mt-1 text-sm text-ink-2">
                {a ? (a.correct ? "✅ صح" : `❌ اخترت: ${q.options.find((o) => o.id === a.choiceId)?.label ?? "—"}`) : "⏱️ ماتجاوبش"}
              </p>
              {a && !a.correct && a.rule && (
                <p className="mt-2 rounded-[12px] bg-amber-soft p-2 text-sm text-ink">
                  <b>خطأ {ERROR_LABELS[a.rule.errorType]}:</b> {a.rule.prompt}
                </p>
              )}
              <p className="mt-2 text-sm text-ink-2">
                <b>الحل:</b> <bdi>{q.explanation}</bdi>
              </p>
            </div>
          );
        })}
        <div className="flex justify-center">
          <button onClick={restart} className="btn btn-ghost">
            أعد المحاولة
          </button>
        </div>
      </div>
    );
  }

  const q = questions[idx];
  const mm = Math.floor(Math.max(left, 0) / 60);
  const ss = String(Math.max(left, 0) % 60).padStart(2, "0");
  return (
    <div className="card mx-auto max-w-[720px] space-y-5 p-6 sm:p-8">
      <div className="flex items-center justify-between text-sm font-semibold">
        <span className="text-ink-3">
          سؤال {idx + 1} من {questions.length}
        </span>
        <span className={`ltr rounded-lg px-2 py-1 font-latin ${left < 30 ? "bg-danger-soft text-danger" : "bg-muted text-ink-2"}`}>
          ⏱ {mm}:{ss}
        </span>
      </div>
      <h3 className="text-xl font-bold leading-9 text-ink">{q.question}</h3>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {q.options.map((o) => (
          <button
            key={o.id}
            onClick={() => setPicked(o.id)}
            aria-pressed={picked === o.id}
            className={`min-h-14 rounded-[14px] border-2 px-4 text-start text-lg font-semibold transition-colors ${
              picked === o.id ? "border-primary bg-primary-soft text-primary shadow-[0_4px_0_0_var(--brand-primary)]" : "border-line-strong bg-surface text-ink shadow-[0_4px_0_0_var(--border-strong)]"
            }`}
          >
            <bdi>{o.label}</bdi>
          </button>
        ))}
      </div>
      <div className="flex justify-end">
        <button disabled={!picked} onClick={submit} className="btn btn-primary">
          {idx + 1 === questions.length ? "إنهاء" : "التالي"}
        </button>
      </div>
    </div>
  );
}
