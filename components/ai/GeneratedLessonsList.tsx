"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";
import { knowledgeService } from "@/lib/api/services";

/** Knowledge-base topics (GET /topics) with their generated lessons (GET /lessons), if any. */
export function GeneratedLessonsList() {
  const [items, setItems] = useState<{ slug: string; title: string; ready: boolean }[] | null>(null);
  useEffect(() => {
    void Promise.all([knowledgeService.topics(), knowledgeService.lessons()])
      .then(([t, l]) => {
        const ready = new Set(l.items.map((x) => x.slug));
        const extra = l.items.filter((x) => !t.items.some((y) => y.slug === x.slug)).map((x) => ({ slug: x.slug, title: x.title, ready: true }));
        setItems([...t.items.map((x) => ({ slug: x.slug, title: x.title, ready: ready.has(x.slug) })), ...extra]);
      })
      .catch(() => setItems([]));
  }, []);
  if (!items?.length) return null;
  return (
    <section className="space-y-3" aria-labelledby="gen-lessons">
      <h2 id="gen-lessons" className="flex items-center gap-2 font-display text-2xl font-extrabold text-ink">
        <Sparkles className="size-6 text-primary" /> دروس بيولّدها الذكاء الاصطناعي
      </h2>
      <ul className="grid gap-4 md:grid-cols-3">
        {items.map((x) => (
          <li key={x.slug}>
            <Link href={`/explore/${x.slug}`} className="flex h-full flex-col gap-1 rounded-[20px] border-2 border-primary/30 bg-card p-5 transition-transform hover:-translate-y-0.5" data-explore={x.slug}>
              <span className="font-bold text-ink">{x.title}</span>
              <span className="text-sm text-ink-3">{x.ready ? "جاهز" : "هيتولّد أول ما تفتحه"}</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
