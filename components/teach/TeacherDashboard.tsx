"use client";
import { useState } from "react";
import { Route, Sparkles, Target, Users } from "lucide-react";
import type { ClassReport, MockStudent } from "@/lib/mock/classroom";
import { STAGE_LABEL } from "@/lib/mock/classroom";
import { brakingWorkbench } from "@/lib/workbench/problems/braking";
import { MathText } from "@/components/ui/MathText";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { SolutionGraphView } from "@/components/workbench/SolutionGraphView";
import { ActionChip, PROPERTY_LABEL } from "@/components/workbench/Verdicts";
import { cn } from "@/lib/utils";
import { GraphAuthoring } from "./GraphAuthoring";

/** Route colours: validated categorical order (indigo, teal, ochre) + neutral for "stuck". */
const ROUTE = {
  A: { label: "بدون الزمن (مسار 1)", color: "#5146e8" },
  B: { label: "باستخدام الزمن (مسار 2)", color: "#0e8a70" },
  unanticipated: { label: "طريق غير متوقع وصحيح", color: "#b7790a" },
  stuck: { label: "لسه ماوصلش", color: "#94a3b8" },
} as const;

/** Sequential single-hue ramp (teal) for pass rate. */
function passColor(p: number) {
  const steps = ["#e6f6f1", "#bfe9dc", "#86d4bd", "#3fb394", "#0e8a70"];
  return steps[Math.min(steps.length - 1, Math.floor(p * steps.length))];
}

function Tile({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub: string }) {
  return (
    <div className="rounded-[18px] border-2 border-border bg-card p-4">
      <p className="flex items-center gap-1.5 text-sm font-semibold text-ink-2">
        <Icon className="size-4 text-primary" /> {label}
      </p>
      <p className="mt-1 font-latin text-4xl font-extrabold text-ink">{value}</p>
      <p className="text-xs text-ink-3">{sub}</p>
    </div>
  );
}

export function TeacherDashboard({ report }: { report: ClassReport }) {
  const [student, setStudent] = useState<MockStudent>(report.students.find((s) => s.mistake && s.recovered) ?? report.students[0]);
  const n = report.students.length;
  const reached = report.students.filter((s) => s.goalReached).length;
  const withMistake = report.students.filter((s) => s.mistake);
  const recovered = withMistake.filter((s) => s.recovered).length;
  const unanticipated = report.routes.find((r) => r.route === "unanticipated")?.count ?? 0;
  const maxMis = Math.max(...report.misconceptions.map((m) => m.count), 1);

  return (
    <main className="mx-auto max-w-[1200px] space-y-8 px-4 py-8">
      <header className="space-y-1">
        <p className="text-sm font-bold text-primary">لوحة المدرّس · فصل 3/2 · مهمة مسافة الفرملة</p>
        <h1 className="font-display text-4xl font-extrabold text-ink">شوف طلابك بيفكروا إزاي</h1>
        <p className="max-w-3xl text-ink-2">بيانات تجريبية: {n} طالب افتراضي، كل خطواتهم اتقيّمت بنفس محرك المختبر الرياضي.</p>
      </header>

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4" aria-label="ملخص الفصل">
        <Tile icon={Users} label="الطلاب" value={String(n)} sub="في المهمة دي" />
        <Tile icon={Target} label="وصلوا للمطلوب" value={`${Math.round((reached / n) * 100)}%`} sub={`${reached} من ${n}`} />
        <Tile icon={Route} label="اتعافوا بعد التدخل" value={`${Math.round((recovered / Math.max(1, withMistake.length)) * 100)}%`} sub={`${recovered} من ${withMistake.length} غلطوا`} />
        <Tile icon={Sparkles} label="طرق جديدة صحيحة" value={String(unanticipated)} sub="مش في الحل المكتوب" />
      </section>

      <div className="grid gap-5 lg:grid-cols-2">
        <section className="min-w-0 space-y-3 rounded-[20px] border-2 border-border bg-card p-5" aria-labelledby="heat-title">
          <h2 id="heat-title" className="font-bold text-ink">
            صحة الخطوات على مستوى الفصل
          </h2>
          <p className="text-sm text-ink-2">نسبة الخطوات السليمة لكل مرحلة ولكل خاصية.</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[280px] border-separate border-spacing-[2px] text-sm" data-heatmap>
              <thead>
                <tr>
                  <th className="p-1 text-start font-semibold text-ink-3">المرحلة</th>
                  {(["mathematical", "physical", "pedagogical"] as const).map((p) => (
                    <th key={p} className="p-1 font-semibold text-ink-3">
                      {PROPERTY_LABEL[p]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(Object.keys(STAGE_LABEL) as (keyof typeof STAGE_LABEL)[]).map((stage) => (
                  <tr key={stage}>
                    <th className="p-1 text-start font-semibold text-ink-2">{STAGE_LABEL[stage]}</th>
                    {(["mathematical", "physical", "pedagogical"] as const).map((p) => {
                      const c = report.heatmap.find((h) => h.stage === stage && h.property === p)!;
                      const rate = c.n ? c.pass / c.n : 0;
                      return (
                        <td
                          key={p}
                          className={cn("h-12 rounded-[6px] text-center font-latin font-bold", rate > 0.7 ? "text-white" : "text-ink")}
                          style={{ background: passColor(rate) }}
                          title={`${STAGE_LABEL[stage]} · ${PROPERTY_LABEL[p]}: ${c.pass} سليم، ${c.warn} انتبه، ${c.fail} مراجعة من ${c.n}`}
                        >
                          {c.n ? `${Math.round(rate * 100)}%` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex items-center gap-2 text-xs text-ink-3">
            <span>0%</span>
            {[0.1, 0.3, 0.5, 0.7, 0.9].map((v) => (
              <span key={v} className="h-3 w-6 rounded-[3px]" style={{ background: passColor(v) }} />
            ))}
            <span>100%</span>
          </div>
        </section>

        <section className="min-w-0 space-y-3 rounded-[20px] border-2 border-border bg-card p-5" aria-labelledby="routes-title">
          <h2 id="routes-title" className="font-bold text-ink">
            مسارات التفكير
          </h2>
          <div className="flex h-9 w-full gap-[2px] overflow-hidden rounded-[8px]" role="img" aria-label={report.routes.map((r) => `${ROUTE[r.route].label}: ${r.count}`).join("، ")}>
            {report.routes
              .filter((r) => r.count)
              .map((r) => (
                <div key={r.route} style={{ width: `${(r.count / n) * 100}%`, background: ROUTE[r.route].color }} title={`${ROUTE[r.route].label}: ${r.count}`} />
              ))}
          </div>
          <ul className="grid grid-cols-2 gap-2 text-sm">
            {report.routes.map((r) => (
              <li key={r.route} className="flex items-center gap-2">
                <span className="size-3 shrink-0 rounded-[3px]" style={{ background: ROUTE[r.route].color }} />
                <span className="text-ink-2">{ROUTE[r.route].label}</span>
                <span className="ms-auto font-latin font-bold text-ink">{r.count}</span>
              </li>
            ))}
          </ul>
          <h3 className="pt-2 font-bold text-ink">أشهر الأخطاء القابلة للتصحيح</h3>
          <ul className="space-y-2.5" data-misconceptions>
            {report.misconceptions.map((m) => (
              <li key={m.code} className="space-y-1">
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="text-ink">{m.label}</span>
                  <ActionChip action={m.action as never} />
                  <span className="ms-auto font-latin text-ink-2">
                    {m.recovered}/{m.count} اتعافوا
                  </span>
                </div>
                <div className="flex h-3 gap-[2px]" title={`${m.count} طالب · ${m.recovered} صححوا`}>
                  <div className="rounded-s-[4px] bg-[#0e8a70]" style={{ width: `${(m.recovered / maxMis) * 100}%` }} />
                  {m.count > m.recovered && <div className="rounded-e-[4px] bg-[#94a3b8]" style={{ width: `${((m.count - m.recovered) / maxMis) * 100}%` }} />}
                </div>
              </li>
            ))}
          </ul>
          <p className="flex gap-4 text-xs text-ink-3">
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-[2px] bg-[#0e8a70]" /> صححوا بعد التدخل
            </span>
            <span className="flex items-center gap-1">
              <span className="size-2.5 rounded-[2px] bg-[#94a3b8]" /> لسه
            </span>
          </p>
        </section>
      </div>

      <section className="space-y-3 rounded-[20px] border-2 border-border bg-card p-5" aria-labelledby="students-title">
        <h2 id="students-title" className="font-bold text-ink">
          مسار كل طالب — وفين اختلف
        </h2>
        <div className="grid gap-4 lg:grid-cols-[minmax(0,360px)_1fr]">
          <div className="max-h-[440px] overflow-y-auto rounded-[14px] border-2 border-border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>الطالب</TableHead>
                  <TableHead>المسار</TableHead>
                  <TableHead>غلطة</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {report.students.map((s, i) => (
                  <TableRow key={i} onClick={() => setStudent(s)} className={cn("cursor-pointer", s === student && "bg-primary-soft")} aria-selected={s === student}>
                    <TableCell className="font-semibold">
                      <button type="button" onClick={() => setStudent(s)} className="text-start">
                        {s.name}
                      </button>
                    </TableCell>
                    <TableCell>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="size-2.5 rounded-[2px]" style={{ background: ROUTE[s.route].color }} />
                        {ROUTE[s.route].label.split(" (")[0]}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-ink-2">{s.mistake ? (s.recovered ? "اتصلحت ✓" : "لسه") : "—"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="min-w-0 space-y-3">
            <p className="font-bold text-ink">
              {student.name}: {ROUTE[student.route].label}
              {student.verified ? " · تحقق من النتيجة ✓" : ""}
            </p>
            <SolutionGraphView graph={brakingWorkbench.graph} highlight={{ reached: new Set(student.reached), divergedAt: student.divergedAt }} compact />
            {student.mistake ? (
              <div className="rounded-[14px] border-2 border-amber bg-amber-soft p-3 text-sm leading-7 text-ink">
                <p className="font-bold">
                  اختلف عند: <span className="font-latin">{student.divergedAt ?? "—"}</span> · <span className="font-latin text-xs">{student.mistake.code}</span>
                </p>
                <p>
                  رد مِخيال: <MathText>{student.mistake.feedback}</MathText>
                </p>
              </div>
            ) : (
              <p className="text-sm text-ink-2">مشي في طريق صحيح من غير أخطاء.</p>
            )}
          </div>
        </div>
      </section>

      <GraphAuthoring />
    </main>
  );
}
