import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Repeat, TrendingUp } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Badge } from "@/components/ui/badge";

export const metadata: Metadata = { title: "دروس الرياضيات التفاعلية — مِخيال" };

const LESSONS = [
  {
    href: "/sequences",
    icon: Repeat,
    title: "المتتاليات الحسابية والصيغة الارتدادية",
    text: "ابنِ المتتالية حدًا بحد، وقارن الصيغة الارتدادية بصيغة الحد العام.",
    tags: ["سلّم المتتالية", "سباق الصيغتين", "محقق المتتاليات"],
  },
  {
    href: "/exponential",
    icon: TrendingUp,
    title: "الدوال الأسية واللوغاريتمية",
    text: "خصائص الدوال الأسية، ثم البكتيريا والسكان والسيارات، واللوغاريتم في الزلازل والصوت.",
    tags: ["مختبر الخصائص", "البكتيريا", "قيمة السيارة", "ريختر", "الديسيبل"],
  },
];

export default function LessonsPage() {
  return (
    <>
      <Header cta={false} />
      <main className="mx-auto max-w-[1100px] space-y-8 px-4 py-8">
        <div className="space-y-2">
          <Badge variant="default">دروس الرياضيات</Badge>
          <h1 className="font-display text-4xl font-extrabold text-ink">دروس تفاعلية: جرّب، غيّر الأرقام، وافهم</h1>
          <p className="max-w-2xl text-[17px] leading-8 text-ink-2">كل درس فيه شرح مختصر، ومحاكاة تتحكم في معاملاتها، وتمارين على نمط الكتاب مع ملاحظات على الأخطاء، وفي آخره نسألك عن رأيك.</p>
        </div>
        <div className="grid gap-5 md:grid-cols-2">
          {LESSONS.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="group flex flex-col gap-4 rounded-[20px] border-2 border-border bg-card p-6 shadow-[0_4px_0_0_var(--border)] outline-none transition-[transform,border-color] hover:-translate-y-0.5 hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/40"
              >
                <span className="grid size-16 place-items-center rounded-[18px] bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                  <Icon className="size-8" aria-hidden />
                </span>
                <div className="space-y-1">
                  <h2 className="font-display text-2xl font-extrabold text-ink">{l.title}</h2>
                  <p className="text-[15px] leading-7 text-ink-2">{l.text}</p>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {l.tags.map((t) => (
                    <Badge key={t} variant="outline">
                      {t}
                    </Badge>
                  ))}
                </div>
                <span className="mt-auto inline-flex items-center gap-1 font-bold text-primary">
                  ابدأ الدرس <ArrowLeft className="size-4" />
                </span>
              </Link>
            );
          })}
        </div>
      </main>
    </>
  );
}
