import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Atom, Flame, Gauge, Layers, Zap } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { MathText } from "@/components/ui/MathText";
import { Badge } from "@/components/ui/badge";
import { WORKBENCH_PROBLEMS } from "@/lib/workbench/problems";

export const metadata: Metadata = { title: "المختبر الرياضي — مِخيال" };

const SUBJECT = {
  mechanics: { icon: Gauge, label: "ميكانيكا" },
  electromagnetic: { icon: Zap, label: "كهرومغناطيسية" },
  thermal: { icon: Flame, label: "حرارة" },
} as const;

export default function WorkbenchIndex() {
  return (
    <>
      <Header cta={false} />
      <main className="mx-auto max-w-[1100px] space-y-8 px-4 py-8">
        <header className="space-y-2">
          <Badge variant="default">
            <Atom /> المختبر الرياضي
          </Badge>
          <h1 className="font-display text-4xl font-extrabold text-ink">بنقيّم طريقة تفكيرك، مش الإجابة النهائية بس</h1>
          <p className="max-w-3xl text-[17px] leading-8 text-ink-2">
            اكتب حلك خطوة خطوة. كل خطوة بتتقيّم رياضيًا وفيزيائيًا وتربويًا، وبتتقارن بجراف حل فيه أكتر من طريق صحيح — ولو لقيت طريق جديد صحيح، بيتقبل ويتسجّل.
          </p>
          <Link href="/workbench/pipeline" className="inline-flex items-center gap-1.5 font-semibold text-primary hover:underline">
            <Layers className="size-4" /> شوف خط التحقق والأخطاء الدقيقة <ArrowLeft className="size-4" />
          </Link>
        </header>
        <ul className="grid gap-4 sm:grid-cols-2">
          {WORKBENCH_PROBLEMS.map((p) => {
            const S = SUBJECT[p.subject];
            return (
              <li key={p.id}>
                <Link
                  href={`/workbench/${p.id}`}
                  className="group flex h-full flex-col gap-3 rounded-[20px] border-2 border-border bg-card p-5 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/40"
                >
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 place-items-center rounded-[14px] bg-primary-soft text-primary">
                      <S.icon className="size-6" />
                    </span>
                    <div>
                      <p className="text-sm text-ink-3">{S.label}</p>
                      <h2 className="font-display text-xl font-extrabold text-ink">{p.title}</h2>
                    </div>
                  </div>
                  <p className="text-[15px] leading-7 text-ink-2">
                    <MathText>{p.ask}</MathText>
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    <Badge variant="mint">{p.paths.length} طرق حل</Badge>
                    <Badge variant="amber">{p.recoverableErrors.length} أخطاء قابلة للتصحيح</Badge>
                    <Badge variant="outline">{p.graph.nodes.length} عقدة في الجراف</Badge>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      </main>
    </>
  );
}
