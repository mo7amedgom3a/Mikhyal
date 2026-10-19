import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FeatureIcon } from "@/components/features/FeatureIcon";
import { AUDIENCES, type Audience } from "@/lib/features";

export const metadata: Metadata = { title: "لكل واحد — مِخيال" };

export default function FeaturesPage() {
  return (
    <>
      <Header />
      <main className="mx-auto max-w-[1100px] space-y-6 px-4 py-8">
        <header className="space-y-2">
          <h1 className="font-display text-4xl font-extrabold text-ink">منصة واحدة، تلات جماهير</h1>
          <p className="max-w-3xl text-[17px] leading-8 text-ink-2">الطالب بيتعلم ويتقيّم على تفكيره، المدرّس بيشوف ويألّف، وولي الأمر بيفهم ويتابع.</p>
        </header>
        <Tabs defaultValue="students">
          <TabsList>
            {(Object.keys(AUDIENCES) as Audience[]).map((a) => (
              <TabsTrigger key={a} value={a}>
                {AUDIENCES[a].title}
              </TabsTrigger>
            ))}
          </TabsList>
          {(Object.keys(AUDIENCES) as Audience[]).map((a) => {
            const s = AUDIENCES[a];
            return (
              <TabsContent key={a} value={a} className="space-y-4 pt-4">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-[20px] border-2 border-primary/30 bg-primary-soft p-5">
                  <p className="font-display text-2xl font-extrabold text-ink">{s.pitch}</p>
                  <Button asChild>
                    <Link href={s.href}>
                      {s.cta} <ArrowLeft />
                    </Link>
                  </Button>
                </div>
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {s.features.map((f) => (
                    <li key={f.title} className="flex flex-col gap-2 rounded-[20px] border-2 border-border bg-card p-5">
                      <span className="grid size-11 place-items-center rounded-[14px] bg-primary-soft text-primary">
                        <FeatureIcon name={f.icon} className="size-5" />
                      </span>
                      <h2 className="font-bold text-ink">{f.title}</h2>
                      <p className="text-[15px] leading-7 text-ink-2">{f.text}</p>
                      {f.href && (
                        <Link href={f.href} className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                          شوفها <ArrowLeft className="size-4" />
                        </Link>
                      )}
                    </li>
                  ))}
                </ul>
              </TabsContent>
            );
          })}
        </Tabs>
      </main>
    </>
  );
}
