"use client";
import { useState } from "react";
import { HeartHandshake, Send } from "lucide-react";
import type { LessonFeedback, Scale } from "@/lib/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useLessonTracker } from "./tracker";

const LOCAL_KEY = "mikhyal.feedback.v1";

function ScaleRow({ label, low, high, value, onChange }: { label: string; low: string; high: string; value: Scale | null; onChange: (v: Scale) => void }) {
  return (
    <fieldset className="space-y-2 rounded-[14px] border-2 border-border bg-surface p-3">
      <legend className="px-1 text-[15px] font-semibold text-ink">{label}</legend>
      <div className="flex max-w-sm justify-between gap-1" role="radiogroup" aria-label={label}>
        {([1, 2, 3, 4, 5] as Scale[]).map((v) => (
          <button
            key={v}
            type="button"
            role="radio"
            aria-checked={value === v}
            onClick={() => onChange(v)}
            className={cn("grid size-10 place-items-center rounded-full border-2 font-latin font-bold transition-colors", value === v ? "border-primary bg-primary text-white" : "border-line-strong bg-card text-ink-2 hover:border-primary")}
          >
            {v}
          </button>
        ))}
      </div>
      <div className="flex max-w-sm justify-between text-xs text-ink-3">
        <span>{low}</span>
        <span>{high}</span>
      </div>
    </fieldset>
  );
}

/** Short end-of-lesson survey; the student's in-lesson activity is attached automatically. */
export function FeedbackForm({ lessonId }: { lessonId: string }) {
  const { activity, startedAt } = useLessonTracker();
  const [before, setBefore] = useState<Scale | null>(null);
  const [after, setAfter] = useState<Scale | null>(null);
  const [sims, setSims] = useState<Scale | null>(null);
  const [versus, setVersus] = useState<LessonFeedback["versusClass"] | null>(null);
  const [name, setName] = useState("");
  const [favourite, setFavourite] = useState("");
  const [confusing, setConfusing] = useState("");
  const [comment, setComment] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "offline">("idle");

  const ready = before && after && sims && versus;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ready) return;
    const payload: LessonFeedback = {
      lessonId,
      name: name || undefined,
      understandingBefore: before,
      understandingAfter: after,
      simsHelpful: sims,
      versusClass: versus,
      favourite: favourite || undefined,
      confusing: confusing || undefined,
      comment: comment || undefined,
      activity: { ...activity, secondsOnPage: Math.round((Date.now() - startedAt) / 1000) },
    };
    try {
      const list = JSON.parse(localStorage.getItem(LOCAL_KEY) ?? "[]");
      localStorage.setItem(LOCAL_KEY, JSON.stringify([...list, { ...payload, at: Date.now() }]));
    } catch {
      // storage unavailable; the server copy is the one that matters
    }
    setState("sending");
    try {
      const res = await fetch("/api/feedback", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
      setState(res.ok ? "sent" : "offline");
    } catch {
      setState("offline");
    }
  };

  if (state === "sent" || state === "offline")
    return (
      <div className="pop-in flex flex-col items-center gap-2 rounded-[20px] border-2 border-mint bg-mint-soft p-6 text-center">
        <HeartHandshake className="size-10 text-mint-dark" aria-hidden />
        <p className="text-lg font-bold text-mint-dark">شكرًا لكم! رأيكم يساعدنا نطوّر طريقة التعلّم.</p>
        {state === "offline" && <p className="text-sm text-ink-2">لم نستطع الإرسال الآن (مشكلة اتصال)، وحُفظ الرد على هذا الجهاز.</p>}
      </div>
    );

  return (
    <form onSubmit={submit} className="space-y-3">
      <ScaleRow label="قبل هذا الدرس، كم كنت تفهم الصيغة الارتدادية؟" low="لم أفهمها" high="فاهم تمامًا" value={before} onChange={setBefore} />
      <ScaleRow label="والآن بعد التجربة، كم تفهمها؟" low="لم أفهمها" high="فاهم تمامًا" value={after} onChange={setAfter} />
      <ScaleRow label="هل ساعدتك المحاكاة والرسوم على الفهم؟" low="لم تساعد" high="ساعدت جدًا" value={sims} onChange={setSims} />
      <fieldset className="space-y-2 rounded-[14px] border-2 border-border bg-surface p-3">
        <legend className="px-1 text-[15px] font-semibold text-ink">مقارنة بشرح الحصة المعتاد، هذه الطريقة:</legend>
        <div className="flex flex-wrap gap-2" role="radiogroup">
          {(
            [
              ["better", "أوضح وأمتع"],
              ["same", "مثلها تقريبًا"],
              ["worse", "أصعب / أقل وضوحًا"],
            ] as const
          ).map(([v, label]) => (
            <button key={v} type="button" role="radio" aria-checked={versus === v} onClick={() => setVersus(v)} className={cn("rounded-full border-2 px-4 py-2 text-sm font-semibold transition-colors", versus === v ? "border-primary bg-primary text-white" : "border-line-strong bg-card text-ink-2 hover:border-primary")}>
              {label}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="space-y-1">
          <span className="text-sm font-semibold text-ink-2">أكثر جزء أعجبك؟</span>
          <Textarea value={favourite} onChange={(e) => setFavourite(e.target.value)} maxLength={1000} rows={3} />
        </label>
        <label className="space-y-1">
          <span className="text-sm font-semibold text-ink-2">ما الذي كان مربكًا أو غير واضح؟</span>
          <Textarea value={confusing} onChange={(e) => setConfusing(e.target.value)} maxLength={1000} rows={3} />
        </label>
      </div>
      <label className="block space-y-1">
        <span className="text-sm font-semibold text-ink-2">أي ملاحظات أو اقتراحات أخرى؟</span>
        <Textarea value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} rows={3} />
      </label>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="الاسم الأول (اختياري)" aria-label="الاسم الأول (اختياري)" className="sm:max-w-xs" />
        <Button type="submit" disabled={!ready || state === "sending"}>
          <Send className="-scale-x-100" /> {state === "sending" ? "جارٍ الإرسال…" : "أرسل رأيي"}
        </Button>
        {!ready && <span className="text-sm text-ink-3">أجب عن الأسئلة الأربعة الأولى للإرسال.</span>}
      </div>
    </form>
  );
}
