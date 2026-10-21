"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Bot, Library, Sparkles, Wrench } from "lucide-react";
import type { AiTool, ToolLibrary } from "@/lib/domain";
import { agentService } from "@/lib/api/services";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AgentRunView } from "./AgentRunView";
import { useAgentRun } from "./useAgentRun";

const EXAMPLES = {
  generator: ["اشرح طبيعة الذرة وتجربة رذرفورد", "اعمل محاكاة لقانون أوم", "مدارات بور ومستويات الطاقة"],
  advisor: ["ليه أغلب جسيمات ألفا عدّت من الرقاقة؟", "إيه الفرق بين البروتون والنيوترون؟", "أذاكر إيه الجاي؟"],
};

/** Run either agent against the simulated API and watch tool calls + the generated UI stream in. */
export function AiStudio() {
  const [agent, setAgent] = useState<"generator" | "advisor">("generator");
  const [prompt, setPrompt] = useState(EXAMPLES.generator[0]);
  const [tools, setTools] = useState<AiTool[]>([]);
  const [libs, setLibs] = useState<ToolLibrary[]>([]);
  const { phase, steps, run, error, start, skip } = useAgentRun();

  useEffect(() => {
    void agentService.tools().then((r) => setTools(r.items));
    void agentService.libraries().then((r) => setLibs(r.items));
  }, []);

  const busy = phase === "planning" || phase === "streaming";
  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="min-w-0 space-y-4">
        <header className="space-y-1">
          <h1 className="flex items-center gap-2 font-display text-3xl font-extrabold text-ink">
            <Sparkles className="size-7 text-primary" /> استوديو الذكاء الاصطناعي
          </h1>
          <p className="text-ink-2">المولّد بيبني دروس ومحاكاة من قاعدة المعرفة عن طريق أدوات حقيقية في الـAPI؛ والمرشد بيجاوب الأسئلة ويقترح الخطوة الجاية.</p>
        </header>
        <div className="flex gap-2" role="radiogroup" aria-label="الوكيل">
          {(["generator", "advisor"] as const).map((a) => (
            <button
              key={a}
              type="button"
              role="radio"
              aria-checked={agent === a}
              data-agent={a}
              onClick={() => {
                setAgent(a);
                setPrompt(EXAMPLES[a][0]);
              }}
              className={cn("rounded-full border-2 px-4 py-1.5 font-semibold", agent === a ? "border-primary bg-primary text-white" : "border-line-strong bg-card text-ink-2")}
            >
              {a === "generator" ? "المولّد" : "المرشد"}
            </button>
          ))}
        </div>
        <form
          className="space-y-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (prompt.trim().length >= 2) void start({ agent, prompt });
          }}
        >
          <Textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={3} aria-label="الطلب" />
          <div className="flex flex-wrap items-center gap-2">
            <Button type="submit" disabled={busy}>
              <Bot /> شغّل
            </Button>
            {phase === "streaming" && (
              <Button type="button" variant="ghost" onClick={skip}>
                تخطّى العرض
              </Button>
            )}
            {EXAMPLES[agent].map((x) => (
              <button key={x} type="button" onClick={() => setPrompt(x)} className="rounded-full bg-surface px-3 py-1 text-sm text-ink-2 hover:text-ink">
                {x}
              </button>
            ))}
          </div>
        </form>
        {error && <p className="text-destructive">{error}</p>}
        {run && (
          <p className="text-sm text-ink-3" data-run-id={run.id}>
            <span className="ltr font-latin">{run.id}</span> · {run.model} · {run.usage.toolCalls} tool calls
            {run.output?.lessonSlug && (
              <>
                {" · "}
                <Link className="text-primary underline" href={`/explore/${run.output.lessonSlug}`}>
                  افتح الدرس المنشور
                </Link>
              </>
            )}
          </p>
        )}
        <AgentRunView steps={steps} />
      </div>
      <aside className="min-w-0 space-y-4">
        <div className="space-y-2 rounded-[16px] border-2 border-border bg-card p-3">
          <p className="flex items-center gap-2 font-bold text-ink">
            <Wrench className="size-4" /> الأدوات ({tools.length})
          </p>
          <ul className="space-y-1.5 text-sm">
            {tools.filter((t) => t.agents.includes(agent)).map((t) => (
              <li key={t.name}>
                <code className="font-latin font-bold text-ink" dir="ltr">
                  {t.name}
                </code>
                <p className="text-xs text-ink-3">{t.description}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="space-y-2 rounded-[16px] border-2 border-border bg-card p-3">
          <p className="flex items-center gap-2 font-bold text-ink">
            <Library className="size-4" /> المكتبات ({libs.length})
          </p>
          <ul className="space-y-2 text-sm">
            {libs.map((l) => (
              <li key={l.id}>
                <span className="font-bold text-ink">{l.name}</span> <Badge variant="default" className="ltr font-latin">{l.kind}</Badge>
                <p className="text-xs text-ink-3">{l.description}</p>
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
