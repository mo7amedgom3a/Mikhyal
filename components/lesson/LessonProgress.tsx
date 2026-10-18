import { STEP_ORDER, type StepId } from "@/lib/engine/types";

export const STEP_LABELS: Record<StepId, string> = {
  challenge: "التحدي",
  predict: "التوقّع",
  experiment: "التجربة",
  discover: "الاكتشاف",
  apply: "التطبيق",
  reflect: "المراجعة",
};

export function LessonProgress({ current, onJump, maxReached }: { current: number; maxReached: number; onJump: (i: number) => void }) {
  return (
    <ol className="flex w-full items-center gap-1.5" aria-label="خطوات المهمة">
      {STEP_ORDER.map((s, i) => {
        const done = i < current;
        const active = i === current;
        const reachable = i <= maxReached;
        return (
          <li key={s} className="flex-1">
            <button
              type="button"
              disabled={!reachable}
              onClick={() => onJump(i)}
              aria-current={active ? "step" : undefined}
              className="group block w-full text-start disabled:cursor-default"
            >
              <span
                className={`block h-2.5 rounded-full transition-colors ${
                  active ? "bg-primary" : done ? "bg-mint" : "bg-line"
                }`}
              />
              <span className={`mt-1 hidden text-xs font-semibold sm:block ${active ? "text-primary" : done ? "text-mint-dark" : "text-ink-3"}`}>
                {i + 1}. {STEP_LABELS[s]}
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}
