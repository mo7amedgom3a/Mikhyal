"use client";
import { useMemo, useState } from "react";
import { ArrowLeft, Binary, Brain, GitBranch, ScanText } from "lucide-react";
import type { AuthoredStep, StepValidation } from "@/lib/workbench/types";
import { BRAKING_UNANTICIPATED, brakingWorkbench } from "@/lib/workbench/problems/braking";
import { frictionWorkbench } from "@/lib/workbench/problems/friction";
import { replayPath } from "@/lib/workbench/steps";
import { analyzeSubtle, SUBTLE_CASES } from "@/lib/workbench/subtleErrors";
import { parseChain, structurallySame } from "@/lib/workbench/mathjson";
import { compareRelations, isIdentity, makeRelation } from "@/lib/workbench/algebra";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Toggle } from "@/components/workbench/Toggle";
import { cn } from "@/lib/utils";
import { ActionChip, LAYER_META, StatusIcon, STATUS_STYLE, VerdictPill } from "./Verdicts";

const STAGES = [
  { icon: ScanText, title: "المحلّل والمُوحِّد", en: "Parser & normalizer", text: "LaTeX ← AST مقيّد ← MathJSON، وتوحيد الرموز والوحدات." },
  { icon: Binary, title: "المدقق الرمزي والفيزيائي", en: "Symbolic & physical validator", text: "التكافؤ، افتراضات المجال، الأبعاد، القيود." },
  { icon: GitBranch, title: "مطابقة جراف الحل", en: "Solution-graph matcher", text: "إيه الهدف الحالي؟ والاشتقاق ده سليم؟ معروف ولا جديد؟" },
  { icon: Brain, title: "محرك القرار التربوي", en: "Pedagogical decision engine", text: "قبول · توضيح · تلميح · تجربة · تفسير بالذكاء الاصطناعي." },
];

const SAMPLES: { id: string; title: string; steps: AuthoredStep[]; problem: typeof brakingWorkbench }[] = [
  { id: "isolate", title: "عزل صحيح: s = (v² − u²)/2a", problem: brakingWorkbench, steps: brakingWorkbench.paths[0].steps.slice(0, 2) },
  { id: "squares", title: "نسي التربيع", problem: brakingWorkbench, steps: brakingWorkbench.recoverableErrors[2].steps },
  { id: "sign", title: "إشارة العجلة غلط", problem: brakingWorkbench, steps: brakingWorkbench.recoverableErrors[0].steps },
  { id: "model", title: "s = ut (نموذج سرعة ثابتة)", problem: brakingWorkbench, steps: brakingWorkbench.recoverableErrors[1].steps },
  { id: "new-route", title: "طريق غير متوقع: s = ½(u+v)t", problem: brakingWorkbench, steps: BRAKING_UNANTICIPATED.slice(0, 3) },
  { id: "fma", title: "F = ma والاحتكاك موجود", problem: frictionWorkbench, steps: frictionWorkbench.recoverableErrors[0].steps },
];

function LayerTable({ v }: { v: StepValidation }) {
  return (
    <div className="overflow-x-auto rounded-[16px] border-2 border-border">
      <Table className="min-w-[760px]">
        <TableHeader>
          <TableRow>
            <TableHead>الطبقة</TableHead>
            <TableHead>المسؤولية</TableHead>
            <TableHead>أداة الإنتاج</TableHead>
            <TableHead>تنفيذ النسخة التجريبية</TableHead>
            <TableHead>مخرج حي للخطوة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {v.trace.map((t) => (
            <TableRow key={t.layer} data-layer={t.layer}>
              <TableCell>
                <span className={cn("inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold", STATUS_STYLE[t.status])}>
                  <StatusIcon status={t.status} className="size-3.5" /> {LAYER_META[t.layer].layer}
                </span>
              </TableCell>
              <TableCell className="text-ink-2">{LAYER_META[t.layer].responsibility}</TableCell>
              <TableCell className="font-latin font-semibold">{LAYER_META[t.layer].production}</TableCell>
              <TableCell className="text-ink-2">{LAYER_META[t.layer].mvp}</TableCell>
              <TableCell>
                <code dir="ltr" className="block max-w-[280px] break-all font-latin text-xs text-ink">
                  {t.output}
                </code>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SameEquivalentIdentity() {
  const rows = useMemo(() => {
    const vars = ["s", "u", "v", "a"];
    const doms = { s: [-300, 300], u: [-40, 40], v: [-40, 40], a: [-10, -0.5] } as Record<string, [number, number]>;
    const rel = (l: string) => {
      const c = parseChain(l, vars);
      return { ast: c.ast, rel: makeRelation(c.parts[0].node, c.parts[1].node, [...new Set(c.parts.flatMap((p) => p.symbols))]) };
    };
    const base = rel("s = \\frac{v^2-u^2}{2a}");
    return [
      { latex: "s = \\frac{v^2-u^2}{2a}", note: "نفس الشجرة بالظبط" },
      { latex: "2as = v^2 - u^2", note: "شجرة مختلفة، نفس الحلول" },
      { latex: "v^2 = u^2 + 2as", note: "شجرة مختلفة، نفس الحلول" },
      { latex: "s = \\frac{v-u}{2a}", note: "شكل شبهها، معنى مختلف" },
      { latex: "s + a = a + s", note: "صح دايمًا — مافيهاش معلومة" },
    ].map((r) => {
      const x = rel(r.latex);
      return {
        ...r,
        same: structurallySame(base.ast, x.ast),
        equivalent: compareRelations(base.rel, x.rel, doms).kind === "equivalent",
        identity: isIdentity(x.rel, doms),
      };
    });
  }, []);
  const yes = (b: boolean) => (b ? <span className="font-bold text-mint-dark">✓</span> : <span className="text-ink-3">✗</span>);
  return (
    <div className="overflow-x-auto rounded-[16px] border-2 border-border">
      <Table className="min-w-[560px]">
        <TableHeader>
          <TableRow>
            <TableHead>مقارنة بـ s = (v² − u²)/2a</TableHead>
            <TableHead>نفس البنية</TableHead>
            <TableHead>مكافئة رياضيًا</TableHead>
            <TableHead>متطابقة (دايمًا صح)</TableHead>
            <TableHead>ملاحظة</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((r) => (
            <TableRow key={r.latex}>
              <TableCell dir="ltr">
                <Tex>{r.latex}</Tex>
              </TableCell>
              <TableCell>{yes(r.same)}</TableCell>
              <TableCell>{yes(r.equivalent)}</TableCell>
              <TableCell>{yes(r.identity)}</TableCell>
              <TableCell className="text-ink-2">{r.note}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function SubtleGallery() {
  const [assumed, setAssumed] = useState<Record<string, boolean>>({});
  return (
    <ul className="grid gap-4 md:grid-cols-2" data-subtle>
      {SUBTLE_CASES.map((c) => {
        const on = !!assumed[c.id];
        const r = analyzeSubtle(c, on);
        const verdictLabel = { complete: "مكتمل", lost_solutions: "ضيّع حلول", extraneous_solutions: "ضاف حلول غريبة", domain_changed: "غيّر المجال", wrong: "غلط" }[r.verdict];
        return (
          <li key={c.id} className="space-y-2 rounded-[18px] border-2 border-border bg-card p-4" data-case={c.id} data-verdict={r.verdict}>
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-bold text-ink">{c.title_ar}</h3>
              <span className={cn("rounded-full border-2 px-2.5 py-0.5 text-xs font-bold", r.verdict === "complete" ? STATUS_STYLE.pass : STATUS_STYLE.warn)}>{verdictLabel}</span>
            </div>
            <div className="flex flex-wrap items-center gap-2 rounded-[12px] bg-sim px-3 py-2 text-lg" dir="ltr">
              <Tex>{c.input}</Tex>
              <span className="text-sm text-ink-3">→</span>
              <Tex>{c.step + (c.degrees ? "^\\circ" : "")}</Tex>
            </div>
            <p className="text-xs text-ink-3" dir="ltr">
              roots(original) = {`{${r.inputRoots.join(", ") || (c.id === "restricted-simplify" ? "y-relation" : "∅")}}`} · roots(step) = {`{${r.stepRoots.join(", ") || "—"}}`}
              {r.counterexample !== undefined ? ` · counterexample: ${c.variable} = ${r.counterexample}` : ""}
            </p>
            <p className="rounded-[12px] border-2 border-primary/30 bg-primary-soft px-3 py-2 text-[15px] leading-7 text-ink">
              <MathText>{r.feedback_ar}</MathText>
            </p>
            {c.assumption && <Toggle checked={on} onChange={(v) => setAssumed((a) => ({ ...a, [c.id]: v }))} label={c.assumption.label_ar} />}
          </li>
        );
      })}
    </ul>
  );
}

export function PipelineShowcase() {
  const [sample, setSample] = useState(SAMPLES[0].id);
  const s = SAMPLES.find((x) => x.id === sample)!;
  const v = useMemo(() => replayPath(s.problem, s.steps).validations.at(-1)!, [s]);

  return (
    <main className="mx-auto max-w-[1200px] space-y-10 px-4 py-8">
      <header className="space-y-2">
        <p className="text-sm font-bold text-primary">خط التحقق الهجين</p>
        <h1 className="font-display text-4xl font-extrabold text-ink">إزاي مِخيال بيقيّم التفكير؟</h1>
        <p className="max-w-3xl text-[17px] leading-8 text-ink-2">كل خطوة بتعدّي على 4 مراحل حتمية (من غير ذكاء اصطناعي). النموذج اللغوي بيتدخل في الآخر بس، لو احتجنا نفسّر كلام الطالب.</p>
      </header>

      <ol className="grid gap-3 md:grid-cols-4" aria-label="مراحل خط التحقق">
        {STAGES.map((st, i) => (
          <li key={st.en} className="relative rounded-[18px] border-2 border-border bg-card p-4">
            <span className="grid size-10 place-items-center rounded-[12px] bg-primary text-white">
              <st.icon className="size-5" />
            </span>
            <p className="mt-2 font-latin text-xs font-semibold text-ink-3">
              {i + 1}. {st.en}
            </p>
            <h2 className="font-bold text-ink">{st.title}</h2>
            <p className="mt-1 text-sm text-ink-2">{st.text}</p>
            {i < STAGES.length - 1 && <ArrowLeft className="absolute -left-3.5 top-1/2 hidden size-5 -translate-y-1/2 text-ink-3 md:block" aria-hidden />}
          </li>
        ))}
      </ol>

      <section className="space-y-3" aria-labelledby="layers-title">
        <h2 id="layers-title" className="font-display text-2xl font-extrabold text-ink">
          جدول الطبقات — بمخرجات حية
        </h2>
        <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="خطوة تجريبية">
          {SAMPLES.map((x) => (
            <button
              key={x.id}
              type="button"
              role="radio"
              aria-checked={x.id === sample}
              onClick={() => setSample(x.id)}
              className={cn("rounded-full border-2 px-3 py-1 text-sm font-semibold", x.id === sample ? "border-primary bg-primary text-white" : "border-line-strong bg-surface text-ink-2")}
            >
              {x.title}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-[16px] border-2 border-border bg-card p-3">
          <span className="text-lg" dir="ltr">
            <Tex>{s.steps.at(-1)!.latex}</Tex>
          </span>
          <span className="flex-1" />
          <VerdictPill property="mathematical" verdict={v.mathematical} />
          <VerdictPill property="physical" verdict={v.physical} />
          <VerdictPill property="pedagogical" verdict={v.pedagogical} />
          <ActionChip action={v.action} />
        </div>
        <p className="text-[15px] leading-7 text-ink">
          <MathText>{v.feedback_ar}</MathText>
        </p>
        <LayerTable v={v} />
      </section>

      <section className="space-y-3 rounded-[20px] border-2 border-primary/30 bg-primary-soft p-5" aria-labelledby="fma-title">
        <h2 id="fma-title" className="font-display text-2xl font-extrabold text-ink">
          صحيح رياضيًا ≠ مناسب فيزيائيًا
        </h2>
        <p className="text-[16px] leading-8 text-ink">
          <MathText>
            {"في مسألة فيها احتكاك، الطالب كتب $F = ma$. القانون صحيح رياضيًا تحت افتراضات نيوتن — بس مايبررش تجاهل الاحتكاك اللي المسألة ذكرته صراحة. عشان كده الخصائص التلاتة بتتقيّم كل واحدة لوحدها:"}
          </MathText>
        </p>
        <FmaRow />
      </section>

      <section className="space-y-3" aria-labelledby="equiv-title">
        <h2 id="equiv-title" className="font-display text-2xl font-extrabold text-ink">
          نفس البنية · مكافئ · متطابق
        </h2>
        <p className="max-w-3xl text-[15px] leading-7 text-ink-2">
          زي ما محرك MathLive الحسابي بيفرّق بين التطابق البنيوي والتكافؤ الرياضي والمتطابقة، مِخيال بيفرّق بينهم. بس ولا مقارنة واحدة بتكفي لاستدلال متعدد الخطوات — خصوصًا التحويلات اللي بتضيف أو بتضيّع حلول — عشان كده بنقارن مجموعات الحلول في الاتجاهين.
        </p>
        <SameEquivalentIdentity />
      </section>

      <section className="space-y-3" aria-labelledby="subtle-title">
        <h2 id="subtle-title" className="font-display text-2xl font-extrabold text-ink">
          أخطاء رياضية دقيقة
        </h2>
        <p className="max-w-3xl text-[15px] leading-7 text-ink-2">
          بدل «صح/غلط»: المحرك بيقارن جذور المعادلة قبل وبعد التحويل، ويلاقي مثال مضاد، ويسأل سؤال يخلّي الطالب يكتشف بنفسه. الافتراضات صريحة: غيّر الافتراض وشوف الحكم بيتغير.
        </p>
        <SubtleGallery />
        <p className="rounded-[14px] border-2 border-border bg-surface p-3 text-sm leading-7 text-ink-2">
          في الإنتاج، SymPy بيشتغل على نفس لغة التعبيرات المقيّدة (أبدًا مش كود Python من الطالب)، بافتراضات معرّفة صراحةً (زي <span className="font-latin">positive=True</span>)، وحدود زمنية للتنفيذ، ومع فحص تعويض مستقل زي اللي شايفه هنا.
        </p>
      </section>
    </main>
  );
}

function FmaRow() {
  const v = useMemo(() => replayPath(frictionWorkbench, frictionWorkbench.recoverableErrors[0].steps).validations[0], []);
  return (
    <div className="space-y-2 rounded-[16px] bg-card p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-lg" dir="ltr">
          <Tex>F = ma</Tex>
        </span>
        <span className="flex-1" />
        <VerdictPill property="mathematical" verdict={v.mathematical} />
        <VerdictPill property="physical" verdict={v.physical} />
        <ActionChip action={v.action} />
      </div>
      <p className="text-[15px] leading-7 text-ink">
        <MathText>{v.feedback_ar}</MathText>
      </p>
    </div>
  );
}
