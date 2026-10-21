"use client";
import { useState } from "react";
import { Bot, Brain, CheckCircle2, ChevronDown, LayoutTemplate, Wrench, XCircle } from "lucide-react";
import type { AgentStep } from "@/lib/domain";
import { MathText } from "@/components/ui/MathText";
import { UiRenderer } from "@/components/genui/UiRenderer";
import { cn } from "@/lib/utils";

/** The agent's transcript: thoughts, tool calls with arguments, tool results, messages, generated UI. */
export function AgentRunView({ steps, inlineUi = true, compact = false }: { steps: AgentStep[]; inlineUi?: boolean; compact?: boolean }) {
  const results = new Map(steps.filter((s) => s.type === "tool_result").map((s) => [(s as Extract<AgentStep, { type: "tool_result" }>).callId, s as Extract<AgentStep, { type: "tool_result" }>]));
  return (
    <ol className="space-y-2" data-transcript aria-live="polite">
      {steps.map((s, i) => {
        if (s.type === "tool_result") return null;
        if (s.type === "tool_call") return <ToolCall key={i} call={s} result={results.get(s.callId)} compact={compact} />;
        if (s.type === "thought")
          return (
            <li key={i} className="flex gap-2 text-sm text-ink-3" data-step="thought">
              <Brain className="mt-0.5 size-4 shrink-0" />
              <span className="italic">{s.text}</span>
            </li>
          );
        if (s.type === "message")
          return (
            <li key={i} className="flex gap-2 rounded-[14px] border-2 border-primary/30 bg-primary-soft px-3 py-2 text-[15px] leading-7 text-ink" data-step="message">
              <Bot className="mt-1 size-4 shrink-0 text-primary" />
              <div className="min-w-0 whitespace-pre-line">
                <MathText>{s.text}</MathText>
              </div>
            </li>
          );
        return (
          <li key={i} className="space-y-2" data-step="ui">
            <p className="flex items-center gap-2 text-sm font-semibold text-mint-dark">
              <LayoutTemplate className="size-4" /> واجهة متولّدة: {s.spec.title} · {s.spec.blocks.length} بلوك · مكتبات: {s.spec.libraries.join("، ")}
            </p>
            {inlineUi && (
              <div className="rounded-[16px] border-2 border-dashed border-mint/60 p-3">
                <UiRenderer spec={s.spec} />
              </div>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function ToolCall({ call, result, compact }: { call: Extract<AgentStep, { type: "tool_call" }>; result?: Extract<AgentStep, { type: "tool_result" }>; compact: boolean }) {
  const [open, setOpen] = useState(false);
  const args = JSON.stringify(call.args);
  return (
    <li className="rounded-[12px] border-2 border-border bg-surface text-sm" data-step="tool_call" data-tool={call.tool}>
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 px-3 py-1.5 text-start" aria-expanded={open}>
        <Wrench className="size-4 shrink-0 text-ink-3" />
        <code className="font-latin font-bold text-ink" dir="ltr">
          {call.tool}
        </code>
        {!compact && (
          <code className="min-w-0 flex-1 truncate font-latin text-xs text-ink-3" dir="ltr">
            {args.length > 2 ? args : ""}
          </code>
        )}
        {result ? (
          <span className={cn("ms-auto flex shrink-0 items-center gap-1 text-xs", result.ok ? "text-mint-dark" : "text-destructive")}>
            {result.ok ? <CheckCircle2 className="size-3.5" /> : <XCircle className="size-3.5" />}
            <span className="ltr font-latin">{Math.round(result.ms)}ms</span>
          </span>
        ) : (
          <span className="ms-auto size-3 shrink-0 animate-pulse rounded-full bg-primary" aria-label="جاري التنفيذ" />
        )}
        <ChevronDown className={cn("size-4 shrink-0 text-ink-3 transition-transform", open && "rotate-180")} />
      </button>
      {result && <p className="px-3 pb-1.5 text-xs text-ink-2">{result.summary}</p>}
      {open && (
        <div className="space-y-1 border-t border-border px-3 py-2" dir="ltr">
          <p className="text-xs font-bold text-ink-3">args</p>
          <pre className="max-h-40 overflow-auto rounded bg-card p-2 text-[11px] text-ink-2">{JSON.stringify(call.args, null, 2)}</pre>
          {result && (
            <>
              <p className="text-xs font-bold text-ink-3">result</p>
              <pre className="max-h-64 overflow-auto rounded bg-card p-2 text-[11px] text-ink-2">{JSON.stringify(result.result, null, 2)?.slice(0, 4000)}</pre>
            </>
          )}
        </div>
      )}
    </li>
  );
}
