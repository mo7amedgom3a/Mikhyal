"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Sparkles, Wand2 } from "lucide-react";
import type { AgentRun, GeneratedLesson, Topic } from "@/lib/domain";
import { ApiClientError } from "@/lib/api/client";
import { knowledgeService } from "@/lib/api/services";
import { Button } from "@/components/ui/button";
import { UiRenderer } from "@/components/genui/UiRenderer";
import { AgentRunView } from "./AgentRunView";
import { AdvisorPanel } from "./AdvisorPanel";
import { useAgentRun } from "./useAgentRun";

/**
 * Loads a generated lesson (GET /lessons/{slug}). If none exists yet but the knowledge base has the
 * topic, the generator agent builds and publishes it while its transcript streams in.
 */
export function ExploreLesson({ slug }: { slug: string }) {
  const [lesson, setLesson] = useState<GeneratedLesson | null>(null);
  const [madeBy, setMadeBy] = useState<AgentRun | null>(null);
  const [topic, setTopic] = useState<Topic | null>(null);
  const [state, setState] = useState<"loading" | "generating" | "ready" | "missing" | "error">("loading");
  const [showRun, setShowRun] = useState(false);
  const gen = useAgentRun();

  const load = async () => {
    const r = await knowledgeService.lesson(slug);
    setLesson(r.lesson);
    setMadeBy(r.run);
    setState("ready");
  };

  const generate = async (t: Topic) => {
    setState("generating");
    const run = await gen.start({ agent: "generator", prompt: `اشرح ${t.title}`, publish: { slug } });
    if (!run || run.status !== "succeeded") return setState("error");
    await load();
  };

  useEffect(() => {
    let alive = true;
    (async () => {
      const t = await knowledgeService
        .topics()
        .then(({ items }) => (items.some((x) => x.slug === slug) ? knowledgeService.topic(slug) : null))
        .catch(() => null);
      if (!alive) return;
      setTopic(t);
      try {
        // Ask the index first so a not-yet-generated lesson isn't a 404 in the console.
        const { items } = await knowledgeService.lessons();
        if (!alive) return;
        if (items.some((l) => l.slug === slug)) await load();
        else if (t) void generate(t);
        else setState("missing");
      } catch (e) {
        if (alive) setState(e instanceof ApiClientError && e.status === 404 ? "missing" : "error");
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  const suggestions = topic?.faq.map((f) => f.question) ?? [];

  if (state === "loading")
    return (
      <p className="flex items-center gap-2 text-ink-2">
        <Loader2 className="size-4 animate-spin" /> بنحمّل الدرس…
      </p>
    );
  if (state === "missing")
    return (
      <div className="space-y-3">
        <p className="text-ink-2">مفيش درس ولا موضوع بالاسم ده لسه.</p>
        <Button asChild>
          <Link href="/ai-studio">
            <Wand2 /> ولّده من استوديو الذكاء الاصطناعي
          </Link>
        </Button>
      </div>
    );
  if (state === "generating" || state === "error")
    return (
      <div className="space-y-4" data-generating>
        <header className="space-y-1">
          <p className="flex items-center gap-2 font-bold text-primary">
            <Sparkles className="size-5" /> الدرس ده بيتولّد دلوقتي من قاعدة المعرفة
          </p>
          <p className="text-ink-2">المولّد بيقرا الموضوع والمعادلات وبيانات العناصر وتجربة جايجر–مارسدن، وبيركّب واجهة من مكتبات جاهزة، وبعدين بيتحقق منها وينشرها.</p>
          {gen.phase === "streaming" && (
            <Button size="sm" variant="ghost" onClick={gen.skip}>
              تخطّى العرض
            </Button>
          )}
        </header>
        {gen.error && <p className="text-destructive">{gen.error}</p>}
        <AgentRunView steps={gen.steps} inlineUi={false} />
      </div>
    );

  if (!lesson) return null;
  return (
    <div className="space-y-8">
      <UiRenderer spec={lesson.ui} />
      <AdvisorPanel lessonSlug={slug} suggestions={suggestions} />
      {madeBy && (
        <section className="space-y-2 rounded-[20px] border-2 border-border bg-surface p-4" data-made-by>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-ink-2">
              اتولّد بواسطة <code className="font-latin">{madeBy.model}</code> · {madeBy.usage.toolCalls} استدعاء أداة · {madeBy.steps.length} خطوة
            </p>
            <Button size="sm" variant="outline" onClick={() => setShowRun((s) => !s)} aria-expanded={showRun}>
              {showRun ? "اخفي" : "اتعمل إزاي؟"}
            </Button>
          </div>
          {showRun && <AgentRunView steps={madeBy.steps} inlineUi={false} />}
        </section>
      )}
    </div>
  );
}
