"use client";
import { BookOpen, Lightbulb, MessageSquareHeart, PencilLine, Repeat, Scale, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { MathText } from "@/components/ui/MathText";
import { Tex } from "@/components/ui/Tex";
import { DetectiveSim } from "./DetectiveSim";
import { FeedbackForm } from "./FeedbackForm";
import { Practice } from "./Practice";
import { RaceSim } from "./RaceSim";
import { StairsSim } from "./StairsSim";
import { TermNeighbours } from "./TermNeighbours";
import { LessonTrackerProvider } from "./tracker";

export const LESSON_ID = "arithmetic-sequences";

const GOALS = [
  "أن تستنتج مفهوم المتتالية الحسابية.",
  "أن تميّز المتتالية الحسابية من غيرها.",
  "أن تكتب الصيغة الارتدادية للمتتالية الحسابية.",
  "أن توجد حدًا من حدود متتالية باستخدام الصيغة الارتدادية، وتكتب الحد العام إذا عُلمت الصيغة الارتدادية.",
];

const TERMS: [string, string, string][] = [
  ["الفرق الثابت (الأساس)", "Common difference", "d"],
  ["متتالية حسابية", "Arithmetic sequence", "a_n - a_{n-1} = d"],
  ["الصيغة الارتدادية", "Recursive formula", "a_n = a_{n-1} + d"],
  ["صيغة الحد العام", "General term formula", "a_n = a_1 + (n-1)d"],
];

const SECTIONS = [
  ["remember", "تذكّر"],
  ["definition", "التعريف"],
  ["recursive", "الصيغة الارتدادية"],
  ["compare", "الارتدادية والحد العام"],
  ["detect", "هل هي حسابية؟"],
  ["practice", "تدرّب"],
  ["feedback", "رأيك"],
] as const;

function Section({ id, icon: Icon, title, children }: { id: string; icon: typeof BookOpen; title: string; children: React.ReactNode }) {
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

export function SequencesLesson() {
  return (
    <LessonTrackerProvider>
      <main className="mx-auto max-w-[1100px] space-y-10 px-4 py-8">
        <header className="space-y-4">
          <div className="flex flex-wrap gap-1.5">
            <Badge variant="default">رياضيات</Badge>
            <Badge variant="mint">درس تفاعلي</Badge>
            <Badge variant="amber">نسخة تجريبية · نحتاج رأيكم</Badge>
          </div>
          <h1 className="font-display text-4xl font-extrabold text-ink sm:text-5xl">المتتاليات الحسابية والصيغة الارتدادية</h1>
          <p className="max-w-3xl text-[17px] leading-8 text-ink-2">
            بدل حفظ القانون، سنبني المتتالية بأيدينا: نحرّك الحد الأول والأساس، نشاهد كل حد يولد من الذي قبله، ونقارن بين الصيغة الارتدادية وصيغة الحد العام. في النهاية تمارين على نمط الكتاب، ثم نسألكم عن رأيكم.
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
        </header>

        <Section id="remember" icon={Lightbulb} title="تذكّر: ترقيم الحدود">
          <div className="space-y-3 rounded-[20px] border-2 border-border bg-card p-5">
            <p className="text-[16px] leading-8 text-ink">
              <MathText>{String.raw`المتتالية قائمة أعداد مرتبة: الحد الأول $a_1$، الثاني $a_2$، … وبشكل عام $a_1, a_2, a_3, \dots, a_{n-1}, a_n, a_{n+1}, \dots$ حيث $n$ هي رتبة الحد (رقمه في الترتيب) و $a_n$ هي قيمته.`}</MathText>
            </p>
            <TermNeighbours />
          </div>
        </Section>

        <Section id="definition" icon={BookOpen} title="ما المتتالية الحسابية؟">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-3 rounded-[20px] border-2 border-primary/30 bg-primary-soft p-5">
              <p className="text-[16px] leading-8 text-ink">
                <MathText>{String.raw`تكون المتتالية $\{a_n\}$ متتالية حسابية إذا كان الفرق بين كل حد والحد الذي يسبقه مباشرة ثابتًا. يُسمّى هذا الفرق الثابت أساس المتتالية ويُرمز له بالرمز $d$:`}</MathText>
              </p>
              <div className="relative overflow-x-auto rounded-[14px] bg-surface p-3 text-center text-2xl" dir="ltr">
                <Tex block>{"d = a_n - a_{n-1}"}</Tex>
              </div>
              <p className="text-[15px] leading-7 text-ink-2">
                <MathText>{String.raw`مثال: في $1, 3, 5, 7, 9, \dots$ نجد $3 - 1 = 5 - 3 = 7 - 5 = 2$، إذن هي حسابية وأساسها $d = 2$.`}</MathText>
              </p>
            </div>
            <div className="min-w-0 overflow-hidden rounded-[20px] border-2 border-border bg-card">
              <p className="border-b-2 border-border px-5 py-3 font-bold text-ink">المصطلحات</p>
              <table className="w-full text-[15px]">
                <tbody>
                  {TERMS.map(([ar, en, tex]) => (
                    <tr key={en} className="border-b border-border last:border-0">
                      <td className="px-4 py-2.5 font-semibold text-ink">{ar}</td>
                      <td className="px-4 py-2.5 font-latin text-ink-2" dir="ltr">
                        {en}
                      </td>
                      <td className="px-4 py-2.5" dir="ltr">
                        <Tex>{tex}</Tex>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Section>

        <Section id="recursive" icon={Repeat} title="الصيغة الارتدادية">
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="min-w-0 space-y-3 rounded-[20px] border-2 border-border bg-card p-5">
              <p className="text-[16px] leading-8 text-ink">
                <MathText>{String.raw`الصيغة الارتدادية (Recursive Formula) تعبّر عن الحد الحالي بدلالة الحد الذي يسبقه مباشرة. وتُكتب للمتتالية الحسابية هكذا:`}</MathText>
              </p>
              <div className="relative overflow-x-auto rounded-[14px] bg-sim p-3 text-center text-2xl" dir="ltr">
                <Tex block>{"\\begin{cases} a_1 = \\square \\\\ a_n = a_{n-1} + d, \\quad n \\ge 2 \\end{cases}"}</Tex>
              </div>
              <ul className="space-y-1 text-[15px] leading-7 text-ink-2">
                <li>
                  <MathText>{String.raw`• $a_1$: الحد الأول، ويجب تحديده دائمًا (من دونه لا نعرف من أين نبدأ).`}</MathText>
                </li>
                <li>
                  <MathText>{String.raw`• $a_n$: الحد رقم $n$، و $a_{n-1}$: الحد الذي يسبقه مباشرة.`}</MathText>
                </li>
                <li>
                  <MathText>{String.raw`• $d$: أساس المتتالية، الفرق الثابت $a_n - a_{n-1} = d$.`}</MathText>
                </li>
              </ul>
            </div>
            <div className="min-w-0 space-y-3 rounded-[20px] border-2 border-amber bg-amber-soft p-5">
              <p className="font-bold text-ink">مثال توضيحي</p>
              <p className="text-[16px] leading-8 text-ink">
                <MathText>{String.raw`المتتالية $3, 5, 7, 9, 11, \dots$: الحد الأول $a_1 = 3$ والأساس $d = 5 - 3 = 2$، فتكون الصيغة الارتدادية: $a_1 = 3$ و $a_n = a_{n-1} + 2$ لكل $n \ge 2$.`}</MathText>
              </p>
              <p className="text-[15px] leading-7 text-ink-2">
                <MathText>{String.raw`للتأكد: $a_2 = a_1 + 2 = 5$ ، $a_3 = a_2 + 2 = 7$ ، $a_4 = a_3 + 2 = 9$ ✓`}</MathText>
              </p>
            </div>
          </div>
          <StairsSim />
        </Section>

        <Section id="compare" icon={Scale} title="الصيغة الارتدادية أم صيغة الحد العام؟">
          <div className="grid gap-5 md:grid-cols-2">
            <div className="min-w-0 space-y-2 rounded-[20px] border-2 border-mint/50 bg-mint-soft p-5">
              <p className="font-bold text-mint-dark">الصيغة الارتدادية</p>
              <p className="relative overflow-x-auto text-center text-xl" dir="ltr">
                <Tex>{"a_n = a_{n-1} + d"}</Tex>
              </p>
              <p className="text-[15px] leading-7 text-ink">
                <MathText>{String.raw`تحتاج معرفة الحد السابق $a_{n-1}$ لتجد الحد اللاحق، فلإيجاد $a_{100}$ نمر على 99 خطوة.`}</MathText>
              </p>
            </div>
            <div className="min-w-0 space-y-2 rounded-[20px] border-2 border-primary/30 bg-primary-soft p-5">
              <p className="font-bold text-primary">صيغة الحد العام (الصريحة)</p>
              <p className="relative overflow-x-auto text-center text-xl" dir="ltr">
                <Tex>{"a_n = a_1 + (n-1)d"}</Tex>
              </p>
              <p className="text-[15px] leading-7 text-ink">
                <MathText>{String.raw`توجد أي حد مباشرة دون معرفة الحدود التي قبله. لماذا $(n-1)$؟ لأن من $a_1$ إلى $a_n$ توجد $n-1$ قفزة فقط، كل قفزة تساوي $d$.`}</MathText>
              </p>
            </div>
          </div>
          <RaceSim />
        </Section>

        <Section id="detect" icon={Lightbulb} title="هل هي حسابية؟">
          <DetectiveSim />
        </Section>

        <Section id="practice" icon={PencilLine} title="تدرّب (على نمط الواجب ص 19 – 20)">
          <p className="text-[15px] leading-7 text-ink-2">
            <MathText>{String.raw`اكتب الأعداد في الخانات (يمكن كتابة سالب مثل -3 أو كسر مثل 1/2). إذا أخطأت ستظهر لك ملاحظة عن سبب الخطأ، وبعد 3 محاولات يظهر الحل.`}</MathText>
          </p>
          <Practice />
        </Section>

        <Section id="feedback" icon={MessageSquareHeart} title="رأيك يهمّنا">
          <div className="space-y-3 rounded-[20px] border-2 border-primary/30 bg-card p-5">
            <p className="text-[15px] leading-7 text-ink-2">
              هذه طريقة تعلّم جديدة نجرّبها معكم لأول مرة. أخبرونا بصراحة: هل ساعدتكم المحاكاة على الفهم؟ (لا توجد إجابات صحيحة أو خاطئة، والاسم اختياري.)
            </p>
            <FeedbackForm lessonId={LESSON_ID} />
          </div>
        </Section>
      </main>
    </LessonTrackerProvider>
  );
}
