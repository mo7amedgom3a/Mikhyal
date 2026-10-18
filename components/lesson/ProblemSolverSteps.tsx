"use client";
import { useState } from "react";
import type { Scaffold } from "@/lib/engine/pedagogy";
import type { SolverPrompts } from "@/lib/engine/types";

const STEPS: { key: keyof SolverPrompts; title: string; q: string }[] = [
  { key: "understand", title: "افهم الموقف", q: "إيه اللي بيحصل؟ والمطلوب إيه؟" },
  { key: "represent", title: "ارسم وحدّد المتغيرات", q: "ارسم الموقف وحدّد المعطيات والقوى أو العلاقات." },
  { key: "model", title: "اختار النموذج الذهني", q: "حركة؟ اتزان؟ حفظ؟ علاقة دالية؟" },
  { key: "translate", title: "ترجم لرياضيات", q: "اكتب المعادلات والفرضيات." },
  { key: "verify", title: "حل واتأكد", q: "راجع الوحدات والمنطق والحالات الطرفية." },
];

/** Problem Solver Framework: guidance fades from full → partial → none as mastery grows. */
export function ProblemSolverSteps({ prompts, scaffold }: { prompts: SolverPrompts; scaffold: Scaffold }) {
  const [open, setOpen] = useState<Record<string, boolean>>({});
  if (scaffold === "none") {
    return (
      <div className="rounded-[16px] border-2 border-dashed border-mint bg-mint-soft p-4 text-sm text-mint-dark">
        💪 مستواك عالي في المفهوم ده — حل المرة دي من غير مساعدة الإطار. (تقدر تفتكر الخطوات الخمسة: افهم، ارسم، اختار، ترجم، اتأكد.)
      </div>
    );
  }
  return (
    <ol className="space-y-2">
      {STEPS.map((s, i) => {
        const shown = scaffold === "full" || open[s.key];
        return (
          <li key={s.key} className="rounded-[14px] border-2 border-line bg-surface">
            <button
              type="button"
              onClick={() => setOpen((o) => ({ ...o, [s.key]: !o[s.key] }))}
              className="flex w-full items-center gap-3 p-3 text-start"
              aria-expanded={shown}
            >
              <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-primary-soft font-latin text-sm font-bold text-primary">{i + 1}</span>
              <span className="font-bold text-ink">{s.title}</span>
              <span className="text-sm text-ink-3">— {s.q}</span>
            </button>
            {shown && <p className="border-t-2 border-line px-4 py-2.5 text-[15px] text-ink-2">{prompts[s.key]}</p>}
          </li>
        );
      })}
    </ol>
  );
}
