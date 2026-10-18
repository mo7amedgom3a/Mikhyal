"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { MISSIONS } from "@/lib/missions";
import { emptyState, loadState, missionMastery, type LearnerState } from "@/lib/engine/learnerModel";
import { ERROR_LABELS } from "@/lib/engine/pedagogy";
import type { ErrorType } from "@/lib/engine/types";
import { MasteryRing, masteryLabel } from "./MasteryIndicator";

export function LearningPath() {
  const [state, setState] = useState<LearnerState>(emptyState);
  useEffect(() => setState(loadState()), []);
  const next = MISSIONS.find((m) => !state.completedMissions.includes(m.id)) ?? MISSIONS[0];
  const totalErrors = Object.values(state.errors).reduce((a, b) => a + b, 0);

  const groups: { title: string; subject: "physics" | "math" }[] = [
    { title: "فيزياء", subject: "physics" },
    { title: "رياضيات", subject: "math" },
  ];

  return (
    <main className="mx-auto max-w-[1100px] space-y-8 px-4 py-8">
      <section className="card flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
        <div>
          <p className="text-sm font-semibold text-ink-3">الخطوة الجاية ليك</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-ink sm:text-4xl">
            {next.icon} {next.title}
          </h1>
          <p className="mt-1 text-ink-2">{next.tagline}</p>
        </div>
        <Link href={`/learn/${next.id}`} className="btn btn-primary text-lg">
          {state.completedMissions.includes(next.id) ? "راجع المهمة" : "ابدأ المهمة"} ←
        </Link>
      </section>

      {totalErrors > 0 && (
        <section className="card p-5">
          <h2 className="mb-3 font-bold text-ink">🧭 خريطة أخطائك (بتساعدنا نختار التدخل المناسب)</h2>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(state.errors) as [ErrorType, number][]).map(([k, v]) => (
              <span key={k} className="chip">
                {ERROR_LABELS[k]} <b className="ltr font-latin text-primary">{v}</b>
              </span>
            ))}
          </div>
        </section>
      )}

      {groups.map((g) => (
        <section key={g.subject} className="space-y-3">
          <h2 className="font-display text-2xl font-extrabold text-ink">{g.title}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MISSIONS.filter((m) => m.subject === g.subject).map((m) => {
              const mastery = missionMastery(state, m.concepts);
              const done = state.completedMissions.includes(m.id);
              return (
                <Link
                  key={m.id}
                  href={`/learn/${m.id}`}
                  className="card group flex flex-col gap-3 p-5 shadow-[0_4px_0_0_var(--border)] transition-transform hover:-translate-y-0.5 hover:border-primary"
                >
                  <div className="flex items-start justify-between">
                    <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-primary-soft text-3xl" aria-hidden>
                      {m.icon}
                    </span>
                    <MasteryRing value={mastery} size={52} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold leading-7 text-ink group-hover:text-primary">{m.title}</h3>
                    <p className="text-sm text-ink-3">{m.tagline}</p>
                  </div>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    <span className="chip text-xs">{masteryLabel(mastery)}</span>
                    {done && <span className="chip !border-mint text-xs !text-mint-dark">✓ اتعملت</span>}
                    {m.enrichment && <span className="chip !border-amber text-xs !text-amber-dark">إثرائي</span>}
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
