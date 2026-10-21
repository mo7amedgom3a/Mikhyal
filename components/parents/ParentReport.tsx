"use client";
import Link from "next/link";
import { ArrowLeft, Clock, Lightbulb, MessageCircleHeart, Sparkles, Eye, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useActAs, useChildReport } from "@/lib/api/hooks";
import { parentService } from "@/lib/api/services";
import { DEMO_PARENT_ID } from "@/lib/api/demo";
import { MathText } from "@/components/ui/MathText";
import { Badge } from "@/components/ui/badge";

function Meter({ label, value, trend }: { label: string; value: number; trend?: number }) {
  return (
    <li className="space-y-1">
      <div className="flex items-center gap-2 text-[15px]">
        <span className="text-ink">{label}</span>
        <span className="ms-auto font-latin font-bold text-ink">{Math.round(value * 100)}%</span>
        {trend !== undefined && (
          <span className="flex items-center gap-0.5 font-latin text-xs text-ink-3">
            <TrendingUp className="size-3" /> +{Math.round(trend * 100)}
          </span>
        )}
      </div>
      <div className="h-2.5 rounded-full bg-muted" role="meter" aria-valuenow={Math.round(value * 100)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full bg-primary" style={{ width: `${value * 100}%` }} />
      </div>
    </li>
  );
}

export function ParentReport() {
  useActAs(DEMO_PARENT_ID);
  const kids = useQuery({ queryKey: ["me", "children"], queryFn: parentService.children });
  const childId = kids.data?.items[0]?.child.id ?? "";
  const report = useChildReport(childId, !!childId);
  if (kids.error || report.error) return <main className="mx-auto max-w-[1000px] p-8 text-ink-2" role="alert">مش قادرين نحمّل التقرير.</main>;
  if (!report.data) return <main className="mx-auto mt-8 h-[70vh] max-w-[1000px] animate-pulse rounded-[20px] border-2 border-border bg-sim" aria-label="بيحمّل التقرير" />;
  const r = report.data;
  const CHILD = r.child;
  const WEEK = r.week;
  const CATEGORY_MASTERY = r.categoryMastery;
  const SOLVER_SKILLS = r.solverSkills;
  const INSIGHTS = r.insights;
  const COMPLETED = r.discussionPrompts;
  return (
    <main className="mx-auto max-w-[1000px] space-y-6 px-4 py-8">
      <header className="space-y-1">
        <p className="text-sm font-bold text-primary">
          تقرير ولي الأمر · {CHILD.week} · {r.source === "live" ? "بيانات حية + تجريبية" : "بيانات تجريبية"}
        </p>
        <h1 className="font-display text-4xl font-extrabold text-ink">{CHILD.name} بتفكر إزاي؟</h1>
        <p className="text-ink-2">مش بس الدرجات: إزاي بتوصل للحل، وفين محتاجة تعوّد.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-4" aria-label="الأسبوع ده">
        {[
          [Clock, "دقيقة تعلّم", WEEK.minutes],
          [Sparkles, "مهمات خلّصتها", WEEK.missions],
          [Eye, "خطوة اتقيّمت", WEEK.steps],
          [Lightbulb, "خطوة سليمة من أول مرة", `${Math.round(WEEK.validFirstTry * 100)}%`],
        ].map(([Icon, label, value]) => {
          const I = Icon as typeof Clock;
          return (
            <div key={label as string} className="rounded-[18px] border-2 border-border bg-card p-4">
              <I className="size-5 text-primary" />
              <p className="mt-1 font-latin text-3xl font-extrabold text-ink">{value as string}</p>
              <p className="text-sm text-ink-2">{label as string}</p>
            </div>
          );
        })}
      </section>

      <div className="grid gap-5 md:grid-cols-2">
        <section className="space-y-3 rounded-[20px] border-2 border-border bg-card p-5">
          <h2 className="font-bold text-ink">الإتقان حسب نوع الظواهر</h2>
          <ul className="space-y-3">
            {CATEGORY_MASTERY.map((c) => (
              <Meter key={c.id} label={c.label} value={c.mastery} trend={c.trend} />
            ))}
          </ul>
        </section>
        <section className="space-y-3 rounded-[20px] border-2 border-border bg-card p-5">
          <h2 className="font-bold text-ink">مهارات حل المسائل</h2>
          <ul className="space-y-3">
            {SOLVER_SKILLS.map((s) => (
              <Meter key={s.id} label={s.label} value={s.value} />
            ))}
          </ul>
        </section>
      </div>

      <section className="space-y-3" aria-labelledby="insights-title">
        <h2 id="insights-title" className="font-display text-2xl font-extrabold text-ink">
          جودة التفكير — مش الدرجة بس
        </h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {INSIGHTS.map((i) => (
            <li key={i.title} className={`space-y-1 rounded-[18px] border-2 p-4 ${i.tone === "strength" ? "border-mint/50 bg-mint-soft" : "border-amber bg-amber-soft"}`}>
              <Badge variant={i.tone === "strength" ? "mint" : "amber"}>{i.tone === "strength" ? "نقطة قوة" : "محتاجة متابعة"}</Badge>
              <h3 className="font-bold text-ink">{i.title}</h3>
              <p className="text-[15px] leading-7 text-ink">
                <MathText>{i.detail}</MathText>
              </p>
              <p className="text-xs text-ink-3">الدليل: {i.evidence}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3 rounded-[20px] border-2 border-primary/30 bg-primary-soft p-5" aria-labelledby="talk-title">
        <h2 id="talk-title" className="flex items-center gap-2 font-display text-2xl font-extrabold text-ink">
          <MessageCircleHeart className="size-6 text-primary" /> اتكلموا عنها في البيت
        </h2>
        <p className="text-sm text-ink-2">أسئلة على مهمات {CHILD.name} خلّصتها. مش محتاج تعرف الإجابة — اسألها تشرحلك.</p>
        <ul className="space-y-2">
          {COMPLETED.map((c) => (
            <li key={c.title} className="rounded-[14px] bg-card p-3">
              <p className="text-sm font-semibold text-primary">{c.title}</p>
              <p className="text-[16px] leading-8 text-ink">«{c.prompt}»</p>
              {c.phenomenon && (
                <Link href={`/phenomena/${c.phenomenon}`} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                  شوف الظاهرة <ArrowLeft className="size-3" />
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
