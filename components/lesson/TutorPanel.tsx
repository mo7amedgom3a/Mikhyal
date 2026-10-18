"use client";
import { useEffect, useRef, useState } from "react";

export interface TutorMessage {
  role: "student" | "tutor";
  text: string;
  source?: "rules" | "llm";
}

export function TutorPanel({
  open,
  onClose,
  messages,
  onSend,
  onHint,
  busy,
}: {
  open: boolean;
  onClose: () => void;
  messages: TutorMessage[];
  onSend: (text: string) => void;
  onHint: () => void;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), [messages, busy]);

  return (
    <aside
      aria-label="المساعد مِخيال"
      aria-hidden={!open}
      className={`fixed inset-y-0 left-0 z-40 flex w-full max-w-[400px] flex-col border-e-2 border-line bg-surface shadow-[8px_0_0_0_rgba(23,34,52,0.06)] transition-transform duration-200 ${
        open ? "translate-x-0" : "-translate-x-full"
      }`}
    >
      <div className="flex items-center justify-between border-b-2 border-line p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-primary-soft text-xl" aria-hidden>
            🦉
          </span>
          <div>
            <p className="font-bold text-ink">مِخيال — المرشد</p>
            <p className="text-xs text-ink-3">بيسألك عشان توصل بنفسك، مش بيقولك الإجابة</p>
          </div>
        </div>
        <button onClick={onClose} className="btn btn-ghost !min-h-10 !px-3" aria-label="اقفل المساعد" tabIndex={open ? 0 : -1}>
          ✕
        </button>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {messages.length === 0 && (
          <p className="rounded-[14px] bg-muted p-3 text-sm text-ink-2">
            اكتب طريقتك في التفكير أو اسأل سؤال، أو اضغط «تلميح» لو محتاج دفعة صغيرة.
          </p>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "student" ? "justify-start" : "justify-end"}`}>
            <div
              className={`max-w-[88%] rounded-[16px] border-2 px-3.5 py-2.5 text-[15px] leading-7 ${
                m.role === "student" ? "border-primary bg-primary text-white" : "border-line bg-surface text-ink"
              }`}
            >
              {m.text}
              {m.role === "tutor" && m.source && (
                <span className="mt-1 block text-[11px] text-ink-3">{m.source === "llm" ? "✦ AI مرشد" : "⚙ محرك القواعد"}</span>
              )}
            </div>
          </div>
        ))}
        {busy && <p className="text-end text-sm text-ink-3">مِخيال بيفكر…</p>}
        <div ref={endRef} />
      </div>
      <form
        className="space-y-2 border-t-2 border-line p-3"
        onSubmit={(e) => {
          e.preventDefault();
          if (!text.trim()) return;
          onSend(text.trim());
          setText("");
        }}
      >
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={2}
          tabIndex={open ? 0 : -1}
          placeholder="مثلاً: نحسب الزمن من السرعة والمسافة وبعدين نطلع العجلة"
          className="w-full resize-none rounded-[14px] border-2 border-line-strong p-3 text-[15px] focus:border-primary"
        />
        <div className="flex gap-2">
          <button type="submit" disabled={busy || !text.trim()} className="btn btn-primary flex-1" tabIndex={open ? 0 : -1}>
            ابعت
          </button>
          <button type="button" disabled={busy} onClick={onHint} className="btn btn-amber" tabIndex={open ? 0 : -1}>
            💡 تلميح
          </button>
        </div>
      </form>
    </aside>
  );
}
