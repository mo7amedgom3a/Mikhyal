"use client";
import { useEffect, useRef, useState } from "react";
import { Bot, Cog, Lightbulb, Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { MathText } from "@/components/ui/MathText";

export interface TutorMessage {
  role: "student" | "tutor";
  text: string;
  source?: "rules" | "llm";
}

export function TypingDots() {
  return (
    <span className="inline-flex items-center gap-1" aria-label="بيكتب">
      {[0, 1, 2].map((i) => (
        <span key={i} className="size-1.5 rounded-full bg-ink-3" style={{ animation: `typing-dot 1s ${i * 0.15}s infinite` }} />
      ))}
    </span>
  );
}

export function TutorPanel({
  open,
  onOpenChange,
  messages,
  onSend,
  onHint,
  busy,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  messages: TutorMessage[];
  onSend: (text: string) => void;
  onHint: () => void;
  busy: boolean;
}) {
  const [text, setText] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  // Block body: scrollIntoView returns a Promise in recent browsers, and effects must return only a cleanup function.
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, busy]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" aria-label="المرشد مِخيال">
        <SheetHeader className="flex-row items-center gap-3">
          <span className="grid size-11 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
            <Bot className="size-6" aria-hidden />
          </span>
          <div>
            <SheetTitle>مِخيال — المرشد</SheetTitle>
            <SheetDescription>بيسألك عشان توصل بنفسك، مش بيقولك الإجابة</SheetDescription>
          </div>
        </SheetHeader>
        <div className="flex-1 space-y-3 overflow-y-auto p-4">
          {messages.length === 0 && (
            <p className="rounded-[14px] bg-muted p-3 text-sm text-ink-2">اكتب طريقتك في التفكير أو اسأل سؤال، أو اضغط «تلميح» لو محتاج دفعة صغيرة.</p>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "student" ? "justify-start" : "justify-end"}`}>
              <div
                className={`pop-in max-w-[88%] rounded-[16px] border-2 px-3.5 py-2.5 text-[15px] leading-7 ${
                  m.role === "student" ? "border-primary bg-primary text-white" : "border-border bg-surface text-ink"
                }`}
              >
                <MathText>{m.text}</MathText>
                {m.role === "tutor" && m.source && (
                  <span className="mt-1 flex items-center gap-1 text-[11px] text-ink-3">
                    {m.source === "llm" ? <Sparkles className="size-3" aria-hidden /> : <Cog className="size-3" aria-hidden />}
                    {m.source === "llm" ? "مرشد AI" : "محرك القواعد"}
                  </span>
                )}
              </div>
            </div>
          ))}
          {busy && (
            <div className="flex justify-end">
              <div className="rounded-[16px] border-2 border-border bg-surface px-4 py-3">
                <TypingDots />
              </div>
            </div>
          )}
          <div ref={endRef} />
        </div>
        <SheetFooter>
          <form
            className="space-y-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!text.trim()) return;
              onSend(text.trim());
              setText("");
            }}
          >
            <Textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} aria-label="رسالتك للمرشد" placeholder="مثلاً: نحسب الزمن من السرعة والمسافة وبعدين نطلع العجلة" />
            <div className="flex gap-2">
              <Button type="submit" disabled={busy || !text.trim()} className="flex-1">
                <Send className="-scale-x-100" />
                ابعت
              </Button>
              <Button type="button" variant="amber" disabled={busy} onClick={onHint}>
                <Lightbulb />
                تلميح
              </Button>
            </div>
          </form>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
