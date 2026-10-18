"use client";
import { BookOpenCheck, Brain, CircleCheck, PenTool, Sigma, Trophy } from "lucide-react";
import type { Scaffold } from "@/lib/engine/pedagogy";
import type { SolverPrompts } from "@/lib/engine/types";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { MathText } from "@/components/ui/MathText";

export const SOLVER_STEPS = [
  { key: "understand", title: "افهم الموقف", q: "إيه اللي بيحصل؟ والمطلوب إيه؟", icon: BookOpenCheck },
  { key: "represent", title: "ارسم وحدّد المتغيرات", q: "ارسم الموقف وحدّد المعطيات والقوى أو العلاقات.", icon: PenTool },
  { key: "model", title: "اختار النموذج الذهني", q: "حركة؟ اتزان؟ حفظ؟ علاقة دالية؟", icon: Brain },
  { key: "translate", title: "ترجم لرياضيات", q: "اكتب المعادلات والفرضيات.", icon: Sigma },
  { key: "verify", title: "حل واتأكد", q: "راجع الوحدات والمنطق والحالات الطرفية.", icon: CircleCheck },
] as const;

/** Problem Solver Framework: guidance fades from full → partial → none as mastery grows. */
export function ProblemSolverSteps({ prompts, scaffold }: { prompts: SolverPrompts; scaffold: Scaffold }) {
  if (scaffold === "none") {
    return (
      <Alert variant="mint">
        <Trophy />
        <AlertTitle>مستواك عالي في المفهوم ده</AlertTitle>
        <AlertDescription>حل المرة دي من غير مساعدة الإطار. افتكر الخطوات: افهم، ارسم، اختار، ترجم، اتأكد.</AlertDescription>
      </Alert>
    );
  }
  return (
    <Accordion type="multiple" defaultValue={scaffold === "full" ? SOLVER_STEPS.map((s) => s.key) : []} className="space-y-2">
      {SOLVER_STEPS.map((s, i) => {
        const Icon = s.icon;
        return (
          <AccordionItem key={s.key} value={s.key}>
            <AccordionTrigger>
              <span className="grid size-8 shrink-0 place-items-center rounded-full bg-primary-soft text-primary">
                <Icon className="size-4" aria-hidden />
              </span>
              <span>
                <span className="ltr font-latin text-ink-3">{i + 1}. </span>
                {s.title}
                <span className="block text-sm font-normal text-ink-3">{s.q}</span>
              </span>
            </AccordionTrigger>
            <AccordionContent>
              <MathText>{prompts[s.key]}</MathText>
            </AccordionContent>
          </AccordionItem>
        );
      })}
    </Accordion>
  );
}
