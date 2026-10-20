"use client";
import { Activity, BookOpen, Compass, FlaskConical, Globe2, KeyRound, MessageSquareHeart, PencilLine, Scale, Target, Waves } from "lucide-react";
import { EXP_PRACTICE } from "@/lib/exponential/practice";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { FeedbackForm } from "@/components/sequences/FeedbackForm";
import { Section } from "@/components/sequences/LessonSection";
import { Practice } from "@/components/sequences/Practice";
import { LessonTrackerProvider } from "@/components/sequences/tracker";
import { ArtCompareSim } from "./ArtCompareSim";
import { BacteriaSim } from "./BacteriaSim";
import { CarSim } from "./CarSim";
import { DecibelSim } from "./DecibelSim";
import { FeaturesLab } from "./FeaturesLab";
import { LogMachine } from "./LogMachine";
import { PopulationSim } from "./PopulationSim";
import { RatioExplorer } from "./RatioExplorer";
import { RichterSim } from "./RichterSim";
import { SolverSim } from "./SolverSim";

export const LESSON_ID = "exponential-log";

const GOALS = [
  "أن تميّز الدالة الأسية من الدوال الخطية ودوال القوة (نسبة ثابتة لا فرق ثابت).",
  "أن تحدد الخصائص الأساسية للدالة الأسية: المجال، المدى، المقطع، خط التقارب، السلوك الطرفي.",
  "أن تنمذج مواقف حياتية بدوال النمو والاضمحلال الأسي وتفسّر معاملاتها.",
  "أن تفهم اللوغاريتم كمعكوس للدالة الأسية وتستعمله لحل معادلات أسية وفي مقاييس مثل ريختر والديسيبل.",
];

const VOCAB: [string, string, string][] = [
  ["دالة أسية", "exponential function", "y = a\\cdot b^x"],
  ["دالة النمو الأسي", "exponential growth", "b > 1"],
  ["دالة الاضمحلال الأسي", "exponential decay", "0 < b < 1"],
  ["معامل النمو / الاضمحلال", "growth / decay factor", "b = 1 \\pm r"],
  ["خط التقارب", "asymptote", "y = k"],
  ["لوغاريتم", "logarithm", "\\log_b x = y \\iff b^y = x"],
];

const SECTIONS = [
  ["explore", "استكشف"],
  ["features", "الخصائص الأساسية"],
  ["models", "النمو والاضمحلال في الحياة"],
  ["compare", "مقارنة دالتين"],
  ["log", "ما اللوغاريتم؟"],
  ["solve", "حل المعادلات الأسية"],
  ["scales", "مقاييس لوغاريتمية"],
  ["practice", "تدرّب"],
  ["feedback", "رأيك"],
] as const;

function PartTitle({ n, title, sub }: { n: string; title: string; sub: string }) {
  return (
    <div className="rounded-[20px] bg-primary px-5 py-4 text-white">
      <p className="text-sm font-semibold opacity-80">الجزء {n}</p>
      <p className="font-display text-3xl font-extrabold">{title}</p>
      <p className="text-[15px] opacity-90">{sub}</p>
    </div>
  );
}

export function ExponentialLesson() {
  return (
    <LessonTrackerProvider>
      <main className="mx-auto max-w-[1100px] space-y-10 px-4 py-8">
        <header className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="default">رياضيات · الوحدة 1</Badge>
            <Badge variant="mint">درس تفاعلي</Badge>
            <Badge variant="amber">نسخة تجريبية · نحتاج رأيكم</Badge>
          </div>
          <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">الدوال الأسية واللوغاريتمية</h1>
          <p className="max-w-3xl text-[17px] leading-8 text-ink-2">
            البكتيريا التي تتضاعف، والمدينة التي يزداد سكانها، والسيارة التي تفقد قيمتها، والزلزال الذي يقاس بالريختر: كلها تحكمها الدوال الأسية واللوغاريتمية. هنا لن تكتفي بالنظر إلى المنحنى، بل ستشغّل هذه المواقف بنفسك وتغيّر أرقامها.
          </p>
          <div className="grid gap-4 md:grid-cols-[1fr_auto]">
            <div className="rounded-[18px] border-2 border-border bg-card p-4">
              <p className="mb-2 flex items-center gap-2 font-bold text-ink">
                <Target className="size-5 text-primary" /> أهداف الدرس
              </p>
              <ol className="list-inside list-decimal space-y-1 text-[15px] leading-7 text-ink-2">
                {GOALS.map((g) => (
                  <li key={g}>{g}</li>
                ))}
              </ol>
            </div>
            <nav aria-label="أقسام الدرس" className="rounded-[18px] border-2 border-border bg-card p-4">
              <p className="mb-2 font-bold text-ink">أقسام الدرس</p>
              <ol className="space-y-1 text-[15px]">
                {SECTIONS.map(([id, label], i) => (
                  <li key={id}>
                    <a href={`#${id}`} className="text-primary hover:underline">
                      <span className="font-latin">{i + 1}.</span> {label}
                    </a>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
          <div className="overflow-x-auto rounded-[18px] border-2 border-border bg-card">
            <p className="border-b-2 border-border px-4 py-2 font-bold text-ink">المفردات</p>
            <table className="w-full text-[15px]">
              <tbody>
                {VOCAB.map(([ar, en, tex]) => (
                  <tr key={en} className="border-b border-border last:border-0">
                    <td className="px-4 py-2 font-semibold text-ink">{ar}</td>
                    <td className="px-4 py-2 font-latin text-ink-2" dir="ltr">
                      {en}
                    </td>
                    <td className="relative px-4 py-2" dir="ltr">
                      <Tex>{tex}</Tex>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </header>

        <PartTitle n="الأول" title="الدوال الأسية" sub="عندما يتغير الشيء بنسبة ثابتة لا بمقدار ثابت." />

        <Section id="explore" icon={Compass} title="استكشف: فرق أم نسبة؟">
          <RatioExplorer />
        </Section>

        <Section id="features" icon={BookOpen} title="الخصائص الأساسية للدالة الأسية">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-3 rounded-[20px] border-2 border-primary/30 bg-primary-soft p-5">
              <p className="text-[16px] leading-8 text-ink">
                <MathText>{String.raw`الدالة الأسية هي أي دالة في الصورة $y = a \cdot b^x$ حيث $a$ و $b$ عددان ثابتان و $a \ne 0$ و $b > 0$ و $b \ne 1$. القيمة $a$ هي المقطع $y$ (القيمة الابتدائية)، و $b$ هو الأساس: النسبة بين كل قيمتين متتاليتين.`}</MathText>
              </p>
              <div className="relative overflow-x-auto rounded-[14px] bg-surface p-3 text-center text-2xl" dir="ltr">
                <Tex block>{"y = a \\cdot b^{x}"}</Tex>
              </div>
            </div>
            <div className="min-w-0 overflow-x-auto rounded-[20px] border-2 border-border bg-card">
              <table className="w-full text-[15px]">
                <thead>
                  <tr className="border-b-2 border-border bg-muted text-ink">
                    <th className="px-3 py-2 text-start" />
                    <th className="px-3 py-2 text-start text-primary">النمو الأسي</th>
                    <th className="px-3 py-2 text-start text-amber-dark">الاضمحلال الأسي</th>
                  </tr>
                </thead>
                <tbody className="text-ink-2">
                  {[
                    ["الأساس", "b > 1", "0 < b < 1"],
                    ["المجال", "\\mathbb{R}", "\\mathbb{R}"],
                    ["المدى", "\\{y : y > 0\\}", "\\{y : y > 0\\}"],
                    ["المقطع y", "a", "a"],
                    ["خط التقارب", "y = 0", "y = 0"],
                    ["x \\to \\infty", "y \\to \\infty", "y \\to 0"],
                    ["x \\to -\\infty", "y \\to 0", "y \\to \\infty"],
                    ["النموذج", "A(t) = a(1 + r)^t", "A(t) = a(1 - r)^t"],
                  ].map(([k, g, d]) => (
                    <tr key={k} className="border-b border-border last:border-0">
                      <td className="px-3 py-2 font-semibold text-ink">{k.includes("\\") ? <Tex>{k}</Tex> : k}</td>
                      <td className="px-3 py-2" dir="ltr">
                        <Tex>{g}</Tex>
                      </td>
                      <td className="px-3 py-2" dir="ltr">
                        <Tex>{d}</Tex>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="px-3 pb-3 text-xs text-ink-3">(عندما <Tex>{"a > 0"}</Tex> ولا توجد إزاحات.)</p>
            </div>
          </div>
          <FeaturesLab />
        </Section>

        <Section id="models" icon={FlaskConical} title="النمو والاضمحلال في الحياة">
          <div className="rounded-[20px] border-2 border-amber bg-amber-soft p-5">
            <p className="text-[16px] leading-8 text-ink">
              <MathText>{String.raw`إذا كانت كمية ابتدائية $a$ تتزايد أو تتناقص بنسبة مئوية ثابتة $r$ كل فترة زمنية، فإن قيمتها بعد $t$ فترة: نمو $A(t) = a(1 + r)^t$، واضمحلال $A(t) = a(1 - r)^t$. المعامل $b = 1 \pm r$ هو ما نضرب فيه كل مرة. لكن تذكّر: معامل الاضمحلال $b$ يختلف عن معدل الاضمحلال $r$!`}</MathText>
            </p>
          </div>
          <BacteriaSim />
          <PopulationSim />
          <CarSim />
        </Section>

        <Section id="compare" icon={Scale} title="مقارنة دالتين أسيتين">
          <ArtCompareSim />
        </Section>

        <PartTitle n="الثاني" title="الدوال اللوغاريتمية" sub="الأداة التي تُنزل المجهول من الأس، وتروّض الأرقام الهائلة." />

        <Section id="log" icon={KeyRound} title="ما اللوغاريتم؟">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-3 rounded-[20px] border-2 border-primary/30 bg-primary-soft p-5">
              <p className="text-[16px] leading-8 text-ink">
                <MathText>{String.raw`لكل $b > 0$ و $b \ne 1$ و $x > 0$: لوغاريتم $x$ للأساس $b$ هو الأس الذي نرفع إليه $b$ لنحصل على $x$.`}</MathText>
              </p>
              <div className="relative overflow-x-auto rounded-[14px] bg-surface p-3 text-center text-2xl" dir="ltr">
                <Tex block>{"\\log_b x = y \\iff b^{y} = x"}</Tex>
              </div>
              <p className="text-[15px] leading-7 text-ink-2">
                <MathText>{String.raw`عندما لا يُكتب الأساس فهو 10: $\log 1000 = 3$ لأن $10^3 = 1000$.`}</MathText>
              </p>
            </div>
            <div className="min-w-0 space-y-2 rounded-[20px] border-2 border-border bg-card p-5">
              <p className="font-bold text-ink">خصائص مفيدة</p>
              <ul className="space-y-2 text-ink-2" dir="ltr">
                {["\\log_b 1 = 0", "\\log_b b = 1", "\\log_b b^{x} = x", "\\log_b (MN) = \\log_b M + \\log_b N", "\\log_b \\dfrac{M}{N} = \\log_b M - \\log_b N", "\\log_b M^{p} = p\\log_b M"].map((t) => (
                  <li key={t} className="relative overflow-x-auto text-lg">
                    <Tex>{t}</Tex>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-3">
                <MathText>{String.raw`الخاصية الأخيرة هي مفتاح حل المعادلات: تُنزل الأس $p$ إلى الأمام.`}</MathText>
              </p>
            </div>
          </div>
          <LogMachine />
        </Section>

        <Section id="solve" icon={Activity} title="حل المعادلات الأسية">
          <SolverSim />
        </Section>

        <Section id="scales" icon={Waves} title="مقاييس لوغاريتمية من حولنا">
          <p className="flex items-start gap-2 text-[15px] leading-7 text-ink-2">
            <Globe2 className="mt-1 size-5 shrink-0 text-primary" />
            عندما تمتد الكمية من أرقام صغيرة جدًا إلى كبيرة جدًا، يضغطها اللوغاريتم إلى أرقام مريحة: كل «درجة» على المقياس تعني الضرب في 10.
          </p>
          <RichterSim />
          <DecibelSim />
        </Section>

        <Section id="practice" icon={PencilLine} title="تدرّب (على نمط تمارين الكتاب)">
          <p className="text-[15px] leading-7 text-ink-2">اكتب الأعداد في الخانات (يمكن كتابة سالب أو كسر مثل 1/2، واستعمل الآلة الحاسبة عند الحاجة). عند الخطأ تظهر ملاحظة عن سببه، وبعد 3 محاولات يظهر الحل.</p>
          <Practice questions={EXP_PRACTICE} />
        </Section>

        <Section id="feedback" icon={MessageSquareHeart} title="رأيك يهمّنا">
          <div className="space-y-3 rounded-[20px] border-2 border-primary/30 bg-card p-5">
            <p className="text-[15px] leading-7 text-ink-2">هل ساعدتك المحاكاة والأمثلة الواقعية على فهم الدوال الأسية واللوغاريتمية؟ أخبرنا بصراحة (الاسم اختياري).</p>
            <FeedbackForm lessonId={LESSON_ID} topic="الدوال الأسية واللوغاريتمات" />
          </div>
        </Section>
      </main>
    </LessonTrackerProvider>
  );
}
