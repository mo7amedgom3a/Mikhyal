import type { LucideIcon } from "lucide-react";

/** A numbered lesson section with an anchor id for the in-page table of contents. */
export function Section({ id, icon: Icon, title, children }: { id: string; icon: LucideIcon; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-20 space-y-4">
      <h2 className="flex items-center gap-2 font-display text-3xl font-extrabold text-ink">
        <span className="grid size-10 place-items-center rounded-[12px] bg-primary-soft text-primary">
          <Icon className="size-5" aria-hidden />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}
