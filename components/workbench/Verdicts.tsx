import { CircleAlert, CircleCheck, CircleDashed, CircleX, FlaskConical, HelpCircle, Lightbulb, MessagesSquare, ThumbsUp } from "lucide-react";
import type { LayerId, PedagogicalAction, Verdict, VerdictStatus } from "@/lib/workbench/types";
import { cn } from "@/lib/utils";

export const PROPERTY_LABEL = {
  mathematical: "رياضيًا",
  physical: "فيزيائيًا",
  pedagogical: "تربويًا",
} as const;

export const PROPERTY_QUESTION = {
  mathematical: "هل التحويل صحيح منطقيًا تحت افتراضاته؟",
  physical: "هل القوانين والقيود والإشارات والوحدات مناسبة للموقف؟",
  pedagogical: "هل الخطوة بتقرّب من الهدف الحالي؟",
} as const;

export const STATUS_STYLE: Record<VerdictStatus, string> = {
  pass: "border-mint/50 bg-mint-soft text-mint-dark",
  warn: "border-amber bg-amber-soft text-amber-dark",
  fail: "border-destructive/40 bg-danger-soft text-destructive",
  na: "border-border bg-muted text-ink-3",
};

export const STATUS_LABEL: Record<VerdictStatus, string> = { pass: "سليم", warn: "انتبه", fail: "محتاج مراجعة", na: "مؤجل" };

export function StatusIcon({ status, className }: { status: VerdictStatus; className?: string }) {
  const cls = cn("size-4 shrink-0", className);
  if (status === "pass") return <CircleCheck className={cls} aria-hidden />;
  if (status === "warn") return <CircleAlert className={cls} aria-hidden />;
  if (status === "fail") return <CircleX className={cls} aria-hidden />;
  return <CircleDashed className={cls} aria-hidden />;
}

export function VerdictPill({ property, verdict }: { property: keyof typeof PROPERTY_LABEL; verdict: Verdict }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 rounded-full border-2 px-2.5 py-0.5 text-sm font-semibold", STATUS_STYLE[verdict.status])}
      title={`${PROPERTY_QUESTION[property]} — ${verdict.code}`}
      data-verdict={`${property}:${verdict.status}`}
    >
      <StatusIcon status={verdict.status} />
      {PROPERTY_LABEL[property]}
      <span className="sr-only">: {STATUS_LABEL[verdict.status]}</span>
    </span>
  );
}

export const ACTION_META: Record<PedagogicalAction, { label: string; icon: typeof ThumbsUp; cls: string }> = {
  accept: { label: "قبول", icon: ThumbsUp, cls: "bg-mint text-white" },
  clarify: { label: "توضيح", icon: HelpCircle, cls: "bg-amber text-ink" },
  hint: { label: "تلميح", icon: Lightbulb, cls: "bg-amber text-ink" },
  experiment: { label: "تجربة", icon: FlaskConical, cls: "bg-primary text-white" },
  ai_interpret: { label: "تفسير بالذكاء الاصطناعي", icon: MessagesSquare, cls: "bg-primary text-white" },
};

export function ActionChip({ action }: { action: PedagogicalAction }) {
  const m = ACTION_META[action];
  const Icon = m.icon;
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-bold", m.cls)} data-action={action}>
      <Icon className="size-4" aria-hidden />
      {m.label}
    </span>
  );
}

export const LAYER_META: Record<LayerId, { layer: string; responsibility: string; production: string; mvp: string }> = {
  syntax: { layer: "Syntax", responsibility: "قراءة المدخل الرياضي", production: "MathLive", mvp: "MathLive + latex.ts" },
  canonical: { layer: "Canonical representation", responsibility: "توحيد الرموز والتعبيرات", production: "Compute Engine (MathJSON)", mvp: "mathjs AST → MathJSON (whitelist)" },
  symbolic: { layer: "Symbolic verification", responsibility: "التحقق من التحويلات والحلول", production: "SymPy (لغة مقيّدة)", mvp: "مقارنة مجموعات الحلول بالعيّنات + تعويض مستقل" },
  units: { layer: "Units", responsibility: "الأبعاد والتحويلات", production: "Pint", mvp: "mathjs units" },
  physics: { layer: "Physics constraints", responsibility: "شروط النموذج الفيزيائي", production: "Custom validators", mvp: "مكتبة القوانين + النموذج + القيود" },
  reasoning: { layer: "Reasoning path", responsibility: "مطابقة الاشتقاق والأهداف الوسيطة", production: "Solution graph engine", mvp: "lib/workbench/validate.ts" },
  pedagogy: { layer: "Pedagogical action", responsibility: "اختيار التدخل التالي", production: "Rules + learner model", mvp: "قواعد + BKT" },
  language: { layer: "Natural-language feedback", responsibility: "الشرح والتوجيه", production: "LLM عند الحاجة", mvp: "قوالب + Claude (اختياري)" },
};
