import { Calculator, Compass, FlaskConical, PencilLine, Sparkles, type LucideIcon } from "lucide-react";
import type { ActionKind } from "@/lib/engine/pedagogy";
import { ERROR_LABELS } from "@/lib/engine/pedagogy";
import type { ErrorType } from "@/lib/engine/types";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

const STYLE: Record<ActionKind, { variant: "mint" | "amber" | "primary"; icon: LucideIcon; title: string }> = {
  advance: { variant: "mint", icon: Sparkles, title: "اكتشاف!" },
  hint: { variant: "amber", icon: Compass, title: "تلميح" },
  question: { variant: "primary", icon: Calculator, title: "سؤال يساعدك" },
  experiment: { variant: "mint", icon: FlaskConical, title: "جرّب دي" },
  remediation: { variant: "amber", icon: PencilLine, title: "نرجع خطوة" },
};

export function FeedbackPanel({ kind, message, errorType }: { kind: ActionKind; message: string; errorType?: ErrorType }) {
  const s = STYLE[kind];
  const Icon = s.icon;
  return (
    <Alert variant={s.variant} role="status" aria-live="polite" className="pop-in">
      <Icon />
      <AlertTitle>
        {s.title}
        {errorType && <Badge className="text-xs">نوع الخطأ: {ERROR_LABELS[errorType]}</Badge>}
      </AlertTitle>
      <AlertDescription className="text-[17px] leading-8 text-ink">{message}</AlertDescription>
    </Alert>
  );
}
