import Link from "next/link";
import {
  ArrowLeft,
  Banknote,
  BookOpenCheck,
  Brain,
  Check,
  CircleCheck,
  ClipboardCheck,
  FlaskConical,
  Gauge,
  PenTool,
  ShieldCheck,
  Sigma,
  Sparkles,
  Users,
  Zap,
} from "lucide-react";
import { Header } from "@/components/ui/Header";
import { Logo } from "@/components/ui/Logo";
import { Tex } from "@/components/ui/Tex";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Waitlist } from "@/components/landing/Waitlist";
import { LandingMotion } from "@/components/landing/motion/LandingMotion";
import { HeroIntro } from "@/components/landing/motion/HeroIntro";
import { LoopPath } from "@/components/landing/motion/LoopPath";
import { ChatReplay } from "@/components/landing/motion/ChatReplay";
import { EngineFlow } from "@/components/landing/motion/EngineFlow";
import { TiltCard } from "@/components/landing/motion/TiltCard";
import { ScrollProgress } from "@/components/landing/motion/ScrollProgress";
import { MISSIONS } from "@/lib/missions";
import { MissionIcon } from "@/lib/missions/icons";

const SUBJECT_LABEL = { physics: "فيزياء", math: "رياضيات", applied: "رياضيات تطبيقية" } as const;

const COMPARE = [
  ["نقطة البداية", "شرح أو فيديو", "تحدي أو ظاهرة"],
  ["التفاعل", "تتفرج، تدوس، تجاوب", "تتحكم، تفترض، تجرّب"],
  ["التصحيح", "صح أو غلط", "بيشخّص الخطأ في طريقة تفكيرك"],
  ["التقدّم", "عدد الدروس اللي خلصتها", "المفاهيم اللي اتقنتها فعلًا"],
  ["التدريب", "أسئلة ثابتة", "مسائل متكيّفة من الواقع والامتحانات"],
  ["دور الـ AI", "بيجاوب أسئلة", "بيوجّه الاكتشاف ويغيّر النشاط"],
];

const SOLVER = [
  { t: "افهم الموقف", d: "إيه اللي بيحصل فعلًا؟ المطلوب إيه؟", icon: BookOpenCheck },
  { t: "ارسم وحدّد", d: "ارسم الموقف، حدد المتغيرات والقوى والعلاقات.", icon: PenTool },
  { t: "اختار النموذج", d: "حفظ؟ حركة؟ اتزان؟ علاقة دالية؟", icon: Brain },
  { t: "ترجم لرياضيات", d: "اكتب المعادلات والفرضيات.", icon: Sigma },
  { t: "حل واتأكد", d: "الوحدات، المنطق، الحالات الطرفية، والمعنى الفيزيائي.", icon: CircleCheck },
];

const PLANS = [
  { name: "مجاني", price: 0, per: "", items: ["معامل مختارة", "مهمات محدودة", "المرشد بمحرك القواعد"], cta: "ابدأ دلوقتي", href: "/learn" },
  {
    name: "مِخيال برو",
    price: 99,
    per: "ج.م / شهر",
    items: ["كل المهمات والمعامل", "مسار تعلم متكيّف", "وضع الامتحان الكامل", "مرشد AI سقراطي", "تقرير تقدّم لولي الأمر"],
    cta: "انضم لقائمة الانتظار",
    href: "#waitlist",
    featured: true,
  },
  { name: "مدارس وسناتر", price: null, per: "", items: ["حسابات للطلاب", "لوحة للمدرس", "تحليلات مجمّعة للفصل"], cta: "كلّمنا", href: "#waitlist" },
];

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div data-reveal className="mx-auto max-w-[720px] text-center">
      <p className="text-sm font-bold tracking-wide text-mint-dark">{kicker}</p>
      <h2 className="mt-2 font-display text-[32px] font-extrabold leading-tight text-primary sm:text-[48px]">{title}</h2>
      {sub && <p className="mt-3 text-[17px] leading-8 text-ink-2">{sub}</p>}
    </div>
  );
}

export default function Home() {
  return (
    <>
      <Header />
      <ScrollProgress />
      <LandingMotion>
        <main className="overflow-x-clip">
          <HeroIntro />

          {/* Learning loop */}
          <section id="how" className="scroll-mt-20 border-y-2 border-border bg-surface px-4 py-24">
            <SectionTitle kicker="دورة التعلم" title="تحدّي. توقّع. جرّب. اكتشف." sub="كل مهمة في مِخيال ماشية على نفس الدورة اللي العلماء بيفكروا بيها — والشرح بييجي بعد ما تكون فكّرت وجرّبت." />
            <LoopPath />
          </section>

          {/* AI tutor */}
          <section>
            <ChatReplay />
          </section>

          {/* Comparison */}
          <section className="border-y-2 border-border bg-surface px-4 py-24">
            <SectionTitle kicker="الفرق" title="نفس المنهج. طريقة تانية خالص." />
            <Card data-reveal className="mx-auto mt-10 max-w-[900px] overflow-hidden">
              <Table className="min-w-[560px]">
                <TableHeader>
                  <TableRow className="hover:bg-transparent">
                    <TableHead />
                    <TableHead>المنصات التقليدية</TableHead>
                    <TableHead className="font-bold text-primary">
                      <span className="inline-flex items-center gap-1.5">
                        <Sparkles className="size-4" aria-hidden /> مِخيال
                      </span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody data-rows>
                  {COMPARE.map(([dim, old, neu]) => (
                    <TableRow key={dim}>
                      <TableCell className="font-bold text-ink">{dim}</TableCell>
                      <TableCell className="text-ink-3">{old}</TableCell>
                      <TableCell className="bg-primary-soft/70 font-semibold text-primary">
                        <span className="inline-flex items-center gap-1.5">
                          <Check className="size-4 shrink-0" aria-hidden />
                          {neu}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Card>
          </section>

          {/* Missions */}
          <section id="missions" className="scroll-mt-20 px-4 py-24">
            <SectionTitle kicker="المهمات" title="مشكلة حقيقية في كل درس" sub="إحدى عشرة مهمة جاهزة في النسخة التجريبية — كل واحدة فيها محاكاة حقيقية، اكتشاف للعلاقة، تطبيق، ووضع امتحان." />
            <div data-stagger className="mx-auto mt-12 grid max-w-[1100px] gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {MISSIONS.map((m) => (
                <TiltCard key={m.id}>
                  <Link
                    href={`/learn/${m.id}`}
                    className="group flex h-full flex-col gap-3 rounded-[20px] border-2 border-border bg-card p-6 shadow-[0_4px_0_0_var(--border)] outline-none transition-colors hover:border-primary focus-visible:ring-[3px] focus-visible:ring-ring/40"
                  >
                    <div className="flex items-center justify-between">
                      <span className="grid size-14 place-items-center rounded-[16px] bg-primary-soft text-primary transition-[background-color,color,transform] duration-300 group-hover:-rotate-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white">
                        <MissionIcon name={m.icon} className="size-7" />
                      </span>
                      <Badge variant={m.enrichment ? "amber" : "outline"} className="text-xs">
                        {SUBJECT_LABEL[m.subject]}
                        {m.enrichment ? " · إثرائي" : ""}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold leading-7 text-ink group-hover:text-primary">{m.title}</h3>
                    <p className="text-sm text-ink-2">{m.challenge.goal}</p>
                    <div className="mt-auto rounded-[12px] bg-sim px-3 py-2 text-center">
                      <Tex>{m.discovery.latex}</Tex>
                    </div>
                  </Link>
                </TiltCard>
              ))}
            </div>
          </section>

          {/* Two modes */}
          <section className="border-y-2 border-border bg-surface px-4 py-24">
            <SectionTitle kicker="وضعين بيكمّلوا بعض" title="تفهم بجد. وتقفل الامتحان." sub="التجربة الممتعة بتجذب الطالب، والتحسن الحقيقي في الدرجات بيقنع الطالب وولي الأمر." />
            <div data-stagger className="mx-auto mt-12 grid max-w-[1000px] gap-5 md:grid-cols-2">
              <Card className="border-mint">
                <CardContent className="p-7">
                  <span className="grid size-14 place-items-center rounded-[16px] bg-mint-soft text-mint-dark">
                    <FlaskConical className="size-7" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold text-mint-dark">وضع الاكتشاف</h3>
                  <p className="mt-2 text-ink-2">افهم الأفكار من خلال محاكاة وتجارب ومسائل ليها معنى.</p>
                  <Badge variant="mint" className="mt-4">
                    الهدف: إتقان المفهوم
                  </Badge>
                </CardContent>
              </Card>
              <Card className="border-amber">
                <CardContent className="p-7">
                  <span className="grid size-14 place-items-center rounded-[16px] bg-amber-soft text-amber-dark">
                    <ClipboardCheck className="size-7" aria-hidden />
                  </span>
                  <h3 className="mt-4 font-display text-2xl font-extrabold text-amber-dark">وضع الامتحان</h3>
                  <p className="mt-2 text-ink-2">طبّق نفس المعرفة على أسئلة بنظام المنهج، بوقت، وبنفس شكل الامتحانات.</p>
                  <Badge variant="amber" className="mt-4">
                    الهدف: الجاهزية للامتحان
                  </Badge>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* Problem solver framework: the guidance lines fade as you scroll, like scaffolding fading with mastery */}
          <section className="mx-auto max-w-[1200px] px-4 py-24">
            <SectionTitle kicker="إطار حل المشكلات" title="من حفظ القانون… لمعرفة إمتى وليه وإزاي تستخدمه" sub="في الأول المنصة بتوجّهك في كل خطوة. ومع تحسّنك، المساعدة بتختفي تدريجيًا لحد ما تحل مسائل جديدة لوحدك." />
            <div data-fade-guides>
              <ol data-stagger className="mx-auto mt-12 grid max-w-[1100px] gap-3 md:grid-cols-5">
                {SOLVER.map((s, i) => {
                  const Icon = s.icon;
                  return (
                    <li key={s.t}>
                      <Card className="h-full">
                        <CardContent className="p-5">
                          <span className="grid size-10 place-items-center rounded-full bg-primary text-white">
                            <Icon className="size-5" aria-hidden />
                          </span>
                          <h3 className="mt-3 font-bold text-ink">
                            <span className="ltr font-latin text-ink-3">{i + 1}. </span>
                            {s.t}
                          </h3>
                          <p data-guide className="mt-1 text-sm text-ink-2">
                            {s.d}
                          </p>
                        </CardContent>
                      </Card>
                    </li>
                  );
                })}
              </ol>
              <p className="mt-5 flex items-center justify-center gap-2 text-sm text-ink-3">
                <ArrowLeft className="size-4" aria-hidden /> الإرشاد بيقل كل ما إتقانك يزيد — كمّل سكرول وشوفه بيختفي
              </p>
            </div>
          </section>

          {/* Engine */}
          <section className="border-y-2 border-border bg-surface px-4 py-24">
            <SectionTitle
              kicker="تحت الغطا"
              title="محرك تعلم تفاعلي، مش LLM لكل حركة"
              sub="محرك الفيزيا بيحسب الحالة، محرك رياضي بيتحقق من المعادلات، نموذج المتعلم بيتابع الإتقان، ومحرك قواعد بيتعامل مع المفاهيم الخاطئة الشائعة. الذكاء الاصطناعي بيتدخل بس لما الشرح بالكلام أو التكيّف مفيد."
            />
            <EngineFlow />
            <div data-stagger className="mx-auto mt-8 flex max-w-[900px] flex-wrap justify-center gap-2 text-sm">
              <Badge>
                <Zap /> استجابة لحظية
              </Badge>
              <Badge>
                <Banknote /> تكلفة أقل
              </Badge>
              <Badge>
                <ShieldCheck /> مفيش «هلوسة» في الأرقام
              </Badge>
            </div>
          </section>

          {/* Teachers */}
          <section className="mx-auto grid max-w-[1100px] items-center gap-8 px-4 py-24 md:grid-cols-2">
            <div data-reveal className="space-y-4">
              <p className="flex items-center gap-2 text-sm font-bold text-mint-dark">
                <Users className="size-4" aria-hidden /> للمدرسين
              </p>
              <h2 className="font-display text-[32px] font-extrabold leading-tight text-primary sm:text-[44px]">إحنا مع المدرس، مش ضده.</h2>
              <p className="text-[17px] leading-8 text-ink-2">
                المدرسين الأقوياء ممكن يبقوا مصممين محتوى، وخبراء تعلم، وشركاء توزيع. ابعت المهمات لطلابك قبل الحصة أو كتدريب، وشوف بالظبط فين الفصل متلخبط.
              </p>
            </div>
            <ul data-stagger className="grid gap-3">
              {["معامل تفاعلية موثوقة علميًا", "واجبات ومهمات تبعتها لفصلك", "تقارير بالمفاهيم الخاطئة الأكثر انتشارًا", "صمّم مهمات بنفسك مع فريقنا"].map((t) => (
                <li key={t} className="flex items-center gap-3 rounded-[20px] border-2 border-border bg-card p-4 font-semibold text-ink">
                  <span className="grid size-8 shrink-0 place-items-center rounded-full bg-mint-soft text-mint-dark">
                    <Check className="size-4" aria-hidden />
                  </span>
                  {t}
                </li>
              ))}
            </ul>
          </section>

          {/* Pricing */}
          <section id="pricing" className="scroll-mt-20 border-y-2 border-border bg-surface px-4 py-24">
            <SectionTitle kicker="الأسعار" title="ابدأ مجانًا" sub="أسعار مبدئية للإطلاق التجريبي — هنختبرها مع أول دفعة من الطلاب وأولياء الأمور." />
            <div data-stagger className="mx-auto mt-12 grid max-w-[1050px] gap-5 md:grid-cols-3">
              {PLANS.map((p) => (
                <Card key={p.name} className={`flex flex-col ${p.featured ? "border-primary shadow-[0_8px_0_0_var(--brand-primary)] md:-translate-y-2" : ""}`}>
                  <CardContent className="flex flex-1 flex-col p-7">
                    {p.featured && (
                      <Badge variant="default" className="mb-3">
                        <Sparkles /> الأكثر قيمة
                      </Badge>
                    )}
                    <h3 className="text-xl font-bold text-ink">{p.name}</h3>
                    <p className="mt-2">
                      {p.price === null ? (
                        <span className="font-display text-3xl font-extrabold text-ink">تواصل معانا</span>
                      ) : (
                        <span data-count={p.price} className="font-display text-4xl font-extrabold text-ink">
                          {p.price}
                        </span>
                      )}{" "}
                      <span className="text-sm text-ink-3">{p.per}</span>
                    </p>
                    <ul className="mt-4 flex-1 space-y-2 text-ink-2">
                      {p.items.map((i) => (
                        <li key={i} className="flex items-center gap-2">
                          <Check className="size-4 shrink-0 text-mint-dark" aria-hidden /> {i}
                        </li>
                      ))}
                    </ul>
                    <Button asChild variant={p.featured ? "default" : "outline"} className="mt-6">
                      <a href={p.href}>{p.cta}</a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          {/* Waitlist */}
          <section id="waitlist" className="relative scroll-mt-20 px-4 py-24">
            <div data-float="-30" aria-hidden className="pointer-events-none absolute start-[8%] top-10 hidden rounded-[14px] border-2 border-border bg-surface px-3 py-1.5 text-lg text-primary md:block">
              <Tex>{"\\Delta t = \\gamma\\,\\Delta t_0"}</Tex>
            </div>
            <div data-float="-60" aria-hidden className="pointer-events-none absolute bottom-16 end-[8%] hidden rounded-[14px] border-2 border-border bg-surface px-3 py-1.5 text-lg text-mint-dark md:block">
              <Tex>{"h = -\\tfrac{b}{2a}"}</Tex>
            </div>
            <Card data-reveal className="mx-auto max-w-[640px]">
              <CardContent className="space-y-5 p-7 text-center sm:p-10">
                <span className="mx-auto grid size-14 place-items-center rounded-[16px] bg-primary-soft text-primary">
                  <Gauge className="size-7" aria-hidden />
                </span>
                <h2 className="font-display text-[32px] font-extrabold leading-tight text-primary sm:text-[40px]">كن من أول دفعة</h2>
                <p className="text-ink-2">بنختار أول طلاب ومدرسين للتجربة المجانية. سجّل وهنكلمك.</p>
                <Waitlist />
              </CardContent>
            </Card>
          </section>
        </main>
      </LandingMotion>

      {/* Footer band */}
      <footer className="bg-primary px-4 py-12 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="w-fit rounded-[14px] bg-white px-3 py-1.5">
              <Logo />
            </div>
            <p className="max-w-xs text-sm text-white/80">ملعب علمي تفاعلي بالذكاء الاصطناعي لطلاب الثانوية العامة في مصر.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <p className="font-bold">المنصة</p>
              <Link href="/learn" className="block text-white/80 hover:text-white">
                مسار التعلم
              </Link>
              <a href="#missions" className="block text-white/80 hover:text-white">
                المهمات
              </a>
              <a href="#pricing" className="block text-white/80 hover:text-white">
                الأسعار
              </a>
            </div>
            <div className="space-y-2">
              <p className="font-bold">للشركاء</p>
              <a href="#waitlist" className="block text-white/80 hover:text-white">
                المدرسين
              </a>
              <a href="#waitlist" className="block text-white/80 hover:text-white">
                المدارس والسناتر
              </a>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-[1200px] text-xs text-white/60">© 2026 مِخيال — نسخة تجريبية (MVP). كل الأسعار والأرقام فرضيات قيد الاختبار.</p>
      </footer>
    </>
  );
}
