import type { ActionKind } from "@/lib/engine/pedagogy";
import { ERROR_LABELS } from "@/lib/engine/pedagogy";
import type { ErrorType } from "@/lib/engine/types";

const STYLE: Record<ActionKind, { box: string; icon: string; title: string }> = {
  advance: { box: "border-mint bg-mint-soft", icon: "✨", title: "اكتشاف!" },
  hint: { box: "border-amber bg-amber-soft", icon: "🧭", title: "تلميح" },
  question: { box: "border-primary bg-primary-soft", icon: "🧮", title: "سؤال يساعدك" },
  experiment: { box: "border-mint bg-mint-soft", icon: "🔬", title: "جرّب دي" },
  remediation: { box: "border-amber bg-amber-soft", icon: "✏️", title: "نرجع خطوة" },
};

export function FeedbackPanel({ kind, message, errorType }: { kind: ActionKind; message: string; errorType?: ErrorType }) {
  const s = STYLE[kind];
  return (
    <div role="status" aria-live="polite" className={`pop-in rounded-[16px] border-2 p-4 ${s.box}`}>
      <div className="mb-1 flex flex-wrap items-center gap-2">
        <span className="text-lg" aria-hidden>
          {s.icon}
        </span>
        <strong className="text-ink">{s.title}</strong>
        {errorType && <span className="chip !py-0 text-xs">نوع الخطأ: {ERROR_LABELS[errorType]}</span>}
      </div>
      <p className="text-[17px] leading-8 text-ink">{message}</p>
    </div>
  );
}
