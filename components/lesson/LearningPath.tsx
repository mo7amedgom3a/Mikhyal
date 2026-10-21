"use client";
import Link from "next/link";
import { ArrowLeft, Atom, Check, Compass, Puzzle, Scale, Sigma, Sparkles } from "lucide-react";
import { MissionIcon } from "@/lib/missions/icons";
import { emptyState, missionMastery, type LearnerState } from "@/lib/engine/learnerModel";
import { useCatalog, useLearnerModel } from "@/lib/api/hooks";
import { conceptKey } from "@/lib/engines/ids";
import { ERROR_LABELS } from "@/lib/engine/pedagogy";
import type { ErrorType } from "@/lib/engine/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MasteryRing, masteryLabel } from "./MasteryIndicator";

export function LearningPath() {
  const catalog = useCatalog({ type: "mission", limit: 200 });
  const model = useLearnerModel();
  const state: LearnerState = model.data ? { ...emptyState(), concepts: model.data.concepts, errors: model.data.errors as LearnerState["errors"], completedMissions: model.data.completedMissions } : emptyState();
  const MISSIONS = (catalog.data?.items ?? [])
    .map((c) => ({ ...c, id: c.slug, concepts: c.conceptIds.map(conceptKey), enrichment: c.tags.includes("enrichment") }))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  if (catalog.isLoading) return <main className="mx-auto mt-8 h-[60vh] max-w-[1100px] animate-pulse rounded-[20px] border-2 border-border bg-sim" aria-label="بيحمّل المسار" />;
  if (!MISSIONS.length) return <main className="mx-auto max-w-[1100px] p-8 text-ink-2">مش قادرين نحمّل المهمات دلوقتي.</main>;
  const next = MISSIONS.find((m) => !state.completedMissions.includes(m.id)) ?? MISSIONS[0];
  const totalErrors = Object.values(state.errors).reduce((a, b) => a + b, 0);

  const groups = [
    { title: "فيزياء", subject: "physics" as const, icon: Atom },
    { title: "رياضيات", subject: "math" as const, icon: Sigma },
    { title: "رياضيات تطبيقية (استاتيكا)", subject: "applied" as const, icon: Scale },
  ];

  return (
    <main className="mx-auto max-w-[1100px] space-y-8 px-4 py-8">
      <Card>
        <CardContent className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div className="flex items-center gap-4">
            <span className="grid size-16 shrink-0 place-items-center rounded-[18px] bg-primary text-white">
              <MissionIcon name={next.icon} className="size-8" />
            </span>
            <div>
              <p className="text-sm font-semibold text-ink-3">الخطوة الجاية ليك</p>
              <h1 className="font-display text-3xl font-extrabold text-ink sm:text-4xl">{next.title}</h1>
              <p className="text-ink-2">{next.tagline}</p>
            </div>
          </div>
          <Button asChild size="lg">
            <Link href={`/learn/${next.id}`}>
              {state.completedMissions.includes(next.id) ? "راجع المهمة" : "ابدأ المهمة"}
              <ArrowLeft />
            </Link>
          </Button>
        </CardContent>
      </Card>

      <Link
        href="/play"
        className="group flex items-center gap-4 rounded-[20px] border-2 border-amber bg-amber-soft p-5 outline-none transition-transform hover:-translate-y-0.5 focus-visible:ring-[3px] focus-visible:ring-ring/40"
      >
        <span className="grid size-14 shrink-0 place-items-center rounded-[16px] bg-amber text-ink">
          <Puzzle className="size-7" aria-hidden />
        </span>
        <div className="flex-1">
          <p className="font-bold text-ink">ملعب التجارب</p>
          <p className="text-sm text-ink-2">ألغاز تفاعلية: ابني دوائر ووازن قوى بإيدك — النتيجة بتتحسب لحظيًا.</p>
        </div>
        <ArrowLeft className="size-5 text-amber-dark transition-transform group-hover:-translate-x-1" aria-hidden />
      </Link>

      {totalErrors > 0 && (
        <Card>
          <CardContent className="p-5">
            <h2 className="mb-3 flex items-center gap-2 font-bold text-ink">
              <Compass className="size-5 text-primary" aria-hidden />
              خريطة أخطائك (بتساعدنا نختار التدخل المناسب)
            </h2>
            <div className="flex flex-wrap gap-2">
              {(Object.entries(state.errors) as [ErrorType, number][]).map(([k, v]) => (
                <Badge key={k}>
                  {ERROR_LABELS[k]} <b className="ltr font-latin text-primary">{v}</b>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {groups.map((g) => {
        const GroupIcon = g.icon;
        return (
          <section key={g.subject} className="space-y-3">
            <h2 className="flex items-center gap-2 font-display text-2xl font-extrabold text-ink">
              <GroupIcon className="size-6 text-primary" aria-hidden />
              {g.title}
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {MISSIONS.filter((m) => m.subject === g.subject).map((m) => {
                const mastery = missionMastery(state, m.concepts);
                const done = state.completedMissions.includes(m.id);
                return (
                  <Link
                    key={m.id}
                    href={`/learn/${m.id}`}
                    className="group flex flex-col gap-3 rounded-[20px] border-2 border-border bg-card p-5 shadow-[0_4px_0_0_var(--border)] outline-none transition-[transform,border-color] hover:-translate-y-0.5 hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    <div className="flex items-start justify-between">
                      <span className="grid size-14 place-items-center rounded-[16px] bg-primary-soft text-primary transition-colors group-hover:bg-primary group-hover:text-white">
                        <MissionIcon name={m.icon} className="size-7" />
                      </span>
                      <MasteryRing value={mastery} size={52} />
                    </div>
                    <div>
                      <h3 className="text-lg font-bold leading-7 text-ink group-hover:text-primary">{m.title}</h3>
                      <p className="text-sm text-ink-3">{m.tagline}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap gap-1.5">
                      <Badge className="text-xs">{masteryLabel(mastery)}</Badge>
                      {done && (
                        <Badge variant="mint" className="text-xs">
                          <Check /> اتعملت
                        </Badge>
                      )}
                      {m.enrichment && (
                        <Badge variant="amber" className="text-xs">
                          <Sparkles /> إثرائي
                        </Badge>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
