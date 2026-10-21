"use client";
import { useState } from "react";
import { MessageCircleQuestion, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AgentRunView } from "./AgentRunView";
import { useAgentRun } from "./useAgentRun";

/** Ask the advisor agent about a lesson; suggestions come from the topic's FAQ (GET /topics/{slug}). */
export function AdvisorPanel({ lessonSlug, suggestions }: { lessonSlug?: string; suggestions: string[] }) {
  const [q, setQ] = useState("");
  const { phase, steps, error, start } = useAgentRun();
  const ask = (prompt: string) => {
    if (prompt.trim().length < 2) return;
    setQ(prompt);
    void start({ agent: "advisor", prompt, context: lessonSlug ? { lessonSlug } : undefined }, { speed: 4 });
  };
  const busy = phase === "planning" || phase === "streaming";
  return (
    <section className="space-y-3 rounded-[20px] border-2 border-primary/30 bg-card p-4" aria-labelledby="advisor-title" data-advisor>
      <h2 id="advisor-title" className="flex items-center gap-2 font-display text-xl font-extrabold text-ink">
        <MessageCircleQuestion className="size-5 text-primary" /> اسأل المرشد
      </h2>
      <div className="flex flex-wrap gap-1.5">
        {suggestions.map((s) => (
          <button key={s} type="button" disabled={busy} onClick={() => ask(s)} className="rounded-full border-2 border-line-strong bg-surface px-3 py-1 text-start text-sm text-ink-2 hover:border-primary/50 disabled:opacity-50" data-suggestion>
            {s}
          </button>
        ))}
      </div>
      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          ask(q);
        }}
      >
        <Textarea value={q} onChange={(e) => setQ(e.target.value)} placeholder="مثلًا: ليه الإلكترون مش بيقع في النواة؟" rows={2} className="min-h-0 flex-1" aria-label="سؤالك" />
        <Button type="submit" disabled={busy || q.trim().length < 2} aria-label="اسأل">
          <Send />
        </Button>
      </form>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {phase !== "idle" && <AgentRunView steps={steps} compact />}
    </section>
  );
}
