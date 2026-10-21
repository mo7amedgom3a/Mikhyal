import type { Metadata } from "next";
import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { PhenomenonIcon } from "@/components/phenomena/icons";
import { GeneratedLessonsList } from "@/components/ai/GeneratedLessonsList";
import { CATEGORY_LABEL, PHENOMENA, type PhenomenonCategory } from "@/lib/phenomena";

export const metadata: Metadata = { title: "الظواهر — مِخيال" };

export default function PhenomenaIndex() {
  return (
    <>
      <Header cta={false} />
      <main className="mx-auto max-w-[1100px] space-y-10 px-4 py-8">
        <header className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold text-ink">ظواهر شهيرة… تكتشفها بإيدك</h1>
          <p className="max-w-3xl text-[17px] leading-8 text-ink-2">كل ظاهرة فيها التجربة اللي غيّرت الفيزيا، والمعادلة اللي بتوصفها، ومهمة بتتحل في المختبر الرياضي بتلميحات متدرّجة.</p>
        </header>
        <GeneratedLessonsList />
        {(Object.keys(CATEGORY_LABEL) as PhenomenonCategory[]).map((cat) => (
          <section key={cat} className="space-y-3" aria-labelledby={`cat-${cat}`}>
            <div>
              <h2 id={`cat-${cat}`} className="font-display text-2xl font-extrabold text-ink">
                {CATEGORY_LABEL[cat].title}
              </h2>
              <p className="text-ink-2">{CATEGORY_LABEL[cat].blurb}</p>
            </div>
            <ul className="grid gap-4 md:grid-cols-3">
              {PHENOMENA.filter((p) => p.category === cat).map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/phenomena/${p.id}`}
                    className="flex h-full flex-col gap-2 rounded-[20px] border-2 border-border bg-card p-5 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid size-12 place-items-center rounded-[14px] bg-primary-soft text-primary">
                        <PhenomenonIcon name={p.icon} className="size-6" />
                      </span>
                      {p.advanced && <Badge variant="amber">متقدّم · اختياري</Badge>}
                      {p.workbenchProblemId && <Badge variant="mint">درس كامل</Badge>}
                    </div>
                    <h3 className="font-display text-xl font-extrabold text-ink">{p.title}</h3>
                    <p className="text-sm text-ink-2">{p.tagline}</p>
                    <div className="mt-auto overflow-x-auto rounded-[12px] bg-sim px-3 py-2" dir="ltr">
                      <Tex>{p.equation.latex}</Tex>
                    </div>
                    <p className="text-xs text-ink-3">
                      <MathText>{`${p.famous.title} · ${p.famous.year}`}</MathText>
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </main>
    </>
  );
}
