import Link from "next/link";
import { Header } from "@/components/ui/Header";
import { Logo } from "@/components/ui/Logo";
import { Tex } from "@/components/ui/Tex";
import { HeroDemo } from "@/components/landing/HeroDemo";
import { Waitlist } from "@/components/landing/Waitlist";
import { MISSIONS } from "@/lib/missions";

const LOOP = [
  { icon: "🎯", title: "تحدّي", body: "بنبدأ بمشكلة حقيقية مثيرة، قبل أي قانون أو شرح." },
  { icon: "🤔", title: "توقّع", body: "بتقول رأيك الأول: إيه اللي هيحصل؟ عشان تفكيرك يبان." },
  { icon: "🔬", title: "جرّب", body: "بتغيّر المتغيرات بإيدك في محاكاة حقيقية وتختبر فكرتك." },
  { icon: "💡", title: "اكتشف", body: "بتربط اللي شفته بالعلاقة الرياضية وتكتبها بنفسك." },
  { icon: "🧩", title: "طبّق", body: "بتحل مسألة جديدة في موقف مختلف لوحدك." },
  { icon: "🪞", title: "راجع", body: "بنحدد إيه اللي فهمته، وإيه لسه محتاج شغل." },
];

const COMPARE = [
  ["نقطة البداية", "شرح أو فيديو", "تحدي أو ظاهرة"],
  ["التفاعل", "تتفرج، تدوس، تجاوب", "تتحكم، تفترض، تجرّب"],
  ["التصحيح", "صح أو غلط", "بيشخّص الخطأ في طريقة تفكيرك"],
  ["التقدّم", "عدد الدروس اللي خلصتها", "المفاهيم اللي اتقنتها فعلًا"],
  ["التدريب", "أسئلة ثابتة", "مسائل متكيّفة من الواقع والامتحانات"],
  ["دور الـ AI", "بيجاوب أسئلة", "بيوجّه الاكتشاف ويغيّر النشاط"],
];

const ERRORS = [
  { t: "مفاهيمي", e: "فاكر إن الجسم الأتقل بيقع أسرع في الفراغ", i: "🔬 تجربة مقارنة" },
  { t: "رياضي", e: "غلط في ترتيب المعادلة أو نسي معامل", i: "🧮 سؤال على الخطوة" },
  { t: "تمثيلي", e: "رسم أسهم القوى في اتجاه غلط", i: "✏️ إعادة رسم" },
  { t: "إجرائي", e: "اختار معادلة مش مناسبة أو نسي الوحدات", i: "🧭 تلميح للطريقة" },
  { t: "نقل المعرفة", e: "فاهم المثال المشهور بس اتلخبط في موقف جديد", i: "🔁 نفس الفكرة بشكل تاني" },
];

const SOLVER = [
  ["افهم الموقف", "إيه اللي بيحصل فعلًا؟ المطلوب إيه؟"],
  ["ارسم وحدّد", "ارسم الموقف، حدد المتغيرات والقوى والعلاقات."],
  ["اختار النموذج", "حفظ؟ حركة؟ اتزان؟ علاقة دالية؟"],
  ["ترجم لرياضيات", "اكتب المعادلات والفرضيات."],
  ["حل واتأكد", "الوحدات، المنطق، الحالات الطرفية، والمعنى الفيزيائي."],
];

const ENGINE = [
  { t: "مساحة الطالب", d: "أفعال · توقعات · معادلات · إجابات · وقت" },
  { t: "مُقيّم الأحداث", d: "محاكاة حتمية + تحقق رياضي رمزي" },
  { t: "نموذج المتعلم", d: "الإتقان · المفاهيم الخاطئة · المتطلبات السابقة" },
  { t: "المحرك التربوي", d: "تلميح · سؤال · تجربة · علاج" },
  { t: "الخطوة الجاية", d: "تغيير المهمة، تلميح، تجربة، أو تقدّم" },
];

function SectionTitle({ kicker, title, sub }: { kicker: string; title: string; sub?: string }) {
  return (
    <div className="mx-auto max-w-[720px] text-center">
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
      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 pb-16 pt-10 lg:grid-cols-[1fr_1.1fr] lg:pt-16">
          <div className="space-y-6">
            <span className="chip">⚡ ملعب علمي تفاعلي لطلاب الثانوية العامة</span>
            <h1 className="font-display text-[40px] font-extrabold leading-[1.15] text-ink sm:text-[56px]">
              ماتحفظش القانون…
              <br />
              <span className="text-primary">اكتشفه بإيدك.</span>
            </h1>
            <p className="max-w-[520px] text-[18px] leading-9 text-ink-2">
              مِخيال بيحوّل الفيزيا والرياضيات من شرح وحفظ لتجارب وتحديات. بتتوقّع، تجرّب، تكتشف العلاقة بنفسك — ومرشد ذكي بيشخّص طريقة تفكيرك، مش بس إجابتك. وبعدها تطبّق على أسئلة الامتحانات.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link href="/learn/braking" className="btn btn-primary text-lg">
                جرّب أول مهمة مجانًا
              </Link>
              <a href="#how" className="btn btn-ghost text-lg">
                إزاي بنتعلم؟
              </a>
            </div>
            <div className="flex flex-wrap gap-2 text-sm">
              <span className="chip">🇪🇬 بالعامية المصرية</span>
              <span className="chip">📱 بيشتغل على الموبايل</span>
              <span className="chip">📝 مربوط بالمنهج والامتحانات</span>
            </div>
          </div>
          <HeroDemo />
        </section>

        {/* Loop */}
        <section id="how" className="scroll-mt-20 border-y-2 border-line bg-surface px-4 py-20">
          <SectionTitle kicker="دورة التعلم" title="تحدّي. توقّع. جرّب. اكتشف." sub="كل مهمة في مِخيال ماشية على نفس الدورة اللي العلماء بيفكروا بيها — والشرح بييجي بعد ما تكون فكّرت وجرّبت." />
          <ol className="mx-auto mt-12 grid max-w-[1100px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {LOOP.map((s, i) => (
              <li key={s.title} className="card relative p-6 shadow-[0_4px_0_0_var(--border)]">
                <span className="absolute left-5 top-5 font-latin text-4xl font-black text-primary-soft">{i + 1}</span>
                <span className="text-3xl" aria-hidden>
                  {s.icon}
                </span>
                <h3 className="mt-3 text-xl font-bold text-ink">{s.title}</h3>
                <p className="mt-1 text-ink-2">{s.body}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* AI tutor */}
        <section className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-20 lg:grid-cols-2">
          <div className="space-y-5">
            <p className="text-sm font-bold text-mint-dark">المرشد الذكي</p>
            <h2 className="font-display text-[32px] font-extrabold leading-tight text-primary sm:text-[48px]">مش شات بوت جنب الدرس.</h2>
            <p className="text-[17px] leading-8 text-ink-2">
              المرشد فاهم المحاكاة، والهدف من الدرس، وتاريخ محاولاتك. لما تغلط، بيحدد نوع الغلطة ويختار التدخل المناسب — سؤال، تجربة مقارنة، أو تلميح — من غير ما يحرق الإجابة.
            </p>
            <ul className="space-y-2">
              {ERRORS.map((e) => (
                <li key={e.t} className="flex flex-wrap items-center gap-2 rounded-[14px] border-2 border-line bg-surface p-3">
                  <b className="min-w-24 text-ink">{e.t}</b>
                  <span className="flex-1 text-sm text-ink-2">{e.e}</span>
                  <span className="chip text-xs">{e.i}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="card space-y-3 p-5 shadow-[0_8px_0_0_var(--border)]">
            <p className="text-sm font-bold text-ink-3">مهمة فيزيا: إيقاف عربية</p>
            <div className="rounded-[16px] border-2 border-line bg-muted p-4 leading-8 text-ink">
              <b className="block text-xs text-primary">🦉 مِخيال</b>
              عربية ماشية بسرعة 20 متر/ثانية، وفي عائق على بعد 30 متر. محتاجين نحدد أقل تباطؤ يخلّي العربية تقف قبل العائق. تحب تبدأ بإيه؟
            </div>
            <div className="mr-auto max-w-[85%] rounded-[16px] border-2 border-primary bg-primary p-4 leading-8 text-white">
              نحسب الزمن من السرعة والمسافة وبعدين نطلع العجلة.
            </div>
            <div className="rounded-[16px] border-2 border-amber bg-amber-soft p-4 leading-8 text-ink">
              <b className="block text-xs text-amber-dark">🦉 مِخيال · خطأ إجرائي</b>
              ممكن، بس خلي بالك إن السرعة بتتغير أثناء الفرملة. عندك علاقة بتربط السرعة الابتدائية والنهائية والإزاحة والعجلة من غير ما تحتاج الزمن؟
            </div>
            <p className="text-center text-xs text-ink-3">تدخّل سقراطي: المرشد بيلفت نظرك للفكرة بدل ما يديك الإجابة.</p>
          </div>
        </section>

        {/* Comparison */}
        <section className="border-y-2 border-line bg-surface px-4 py-20">
          <SectionTitle kicker="الفرق" title="نفس المنهج. طريقة تانية خالص." />
          <div className="mx-auto mt-10 max-w-[900px] overflow-x-auto">
            <table className="w-full min-w-[560px] border-separate border-spacing-y-2 text-start">
              <thead>
                <tr className="text-sm text-ink-3">
                  <th className="px-4 text-start font-semibold"></th>
                  <th className="px-4 text-start font-semibold">المنصات التقليدية</th>
                  <th className="px-4 text-start font-bold text-primary">مِخيال</th>
                </tr>
              </thead>
              <tbody>
                {COMPARE.map(([dim, old, neu]) => (
                  <tr key={dim}>
                    <td className="rounded-s-[14px] border-2 border-e-0 border-line bg-canvas px-4 py-3 font-bold text-ink">{dim}</td>
                    <td className="border-y-2 border-line bg-canvas px-4 py-3 text-ink-3">{old}</td>
                    <td className="rounded-e-[14px] border-2 border-s-0 border-line bg-primary-soft px-4 py-3 font-semibold text-primary">{neu}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Missions */}
        <section id="missions" className="scroll-mt-20 px-4 py-20">
          <SectionTitle kicker="المهمات" title="مشكلة حقيقية في كل درس" sub="ست مهمات جاهزة في النسخة التجريبية — كل واحدة فيها محاكاة حقيقية، اكتشاف للعلاقة، تطبيق، ووضع امتحان." />
          <div className="mx-auto mt-12 grid max-w-[1100px] gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {MISSIONS.map((m) => (
              <Link key={m.id} href={`/learn/${m.id}`} className="card group flex flex-col gap-3 p-6 shadow-[0_4px_0_0_var(--border)] transition-transform hover:-translate-y-1 hover:border-primary">
                <div className="flex items-center justify-between">
                  <span className="grid h-14 w-14 place-items-center rounded-[16px] bg-primary-soft text-3xl" aria-hidden>
                    {m.icon}
                  </span>
                  <span className="chip text-xs">{m.subject === "math" ? "رياضيات" : "فيزياء"}{m.enrichment ? " · إثرائي" : ""}</span>
                </div>
                <h3 className="text-lg font-bold leading-7 text-ink group-hover:text-primary">{m.title}</h3>
                <p className="text-sm text-ink-2">{m.challenge.goal}</p>
                <div className="mt-auto rounded-[12px] bg-sim px-3 py-2 text-center">
                  <Tex>{m.discovery.latex}</Tex>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* Two modes */}
        <section className="border-y-2 border-line bg-surface px-4 py-20">
          <SectionTitle kicker="وضعين بيكمّلوا بعض" title="تفهم بجد. وتقفل الامتحان." sub="التجربة الممتعة بتجذب الطالب، والتحسن الحقيقي في الدرجات بيقنع الطالب وولي الأمر." />
          <div className="mx-auto mt-12 grid max-w-[1000px] gap-5 md:grid-cols-2">
            <div className="card border-mint p-7">
              <p className="text-4xl">🔬</p>
              <h3 className="mt-3 font-display text-2xl font-extrabold text-mint-dark">وضع الاكتشاف</h3>
              <p className="mt-2 text-ink-2">افهم الأفكار من خلال محاكاة وتجارب ومسائل ليها معنى.</p>
              <p className="mt-4 chip !border-mint !text-mint-dark">الهدف: إتقان المفهوم</p>
            </div>
            <div className="card border-amber p-7">
              <p className="text-4xl">📝</p>
              <h3 className="mt-3 font-display text-2xl font-extrabold text-amber-dark">وضع الامتحان</h3>
              <p className="mt-2 text-ink-2">طبّق نفس المعرفة على أسئلة بنظام المنهج، بوقت، وبنفس شكل الامتحانات.</p>
              <p className="mt-4 chip !border-amber !text-amber-dark">الهدف: الجاهزية للامتحان</p>
            </div>
          </div>
        </section>

        {/* Problem solver framework */}
        <section className="mx-auto max-w-[1200px] px-4 py-20">
          <SectionTitle kicker="إطار حل المشكلات" title="من حفظ القانون… لمعرفة إمتى وليه وإزاي تستخدمه" sub="في الأول المنصة بتوجّهك في كل خطوة. ومع تحسّنك، المساعدة بتختفي تدريجيًا لحد ما تحل مسائل جديدة لوحدك." />
          <ol className="mx-auto mt-12 grid max-w-[1100px] gap-3 md:grid-cols-5">
            {SOLVER.map(([t, d], i) => (
              <li key={t} className="card p-5" style={{ opacity: 1 - i * 0.12 }}>
                <span className="grid h-9 w-9 place-items-center rounded-full bg-primary font-latin font-bold text-white">{i + 1}</span>
                <h3 className="mt-3 font-bold text-ink">{t}</h3>
                <p className="mt-1 text-sm text-ink-2">{d}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 text-center text-sm text-ink-3">← الإرشاد بيقل كل ما إتقانك يزيد</p>
        </section>

        {/* Engine */}
        <section className="border-y-2 border-line bg-surface px-4 py-20">
          <SectionTitle kicker="تحت الغطا" title="محرك تعلم تفاعلي، مش LLM لكل حركة" sub="محرك الفيزيا بيحسب الحالة، محرك رياضي بيتحقق من المعادلات، نموذج المتعلم بيتابع الإتقان، ومحرك قواعد بيتعامل مع المفاهيم الخاطئة الشائعة. الذكاء الاصطناعي بيتدخل بس لما الشرح بالكلام أو التكيّف مفيد." />
          <ol className="mx-auto mt-12 flex max-w-[1100px] flex-col items-stretch gap-3 lg:flex-row">
            {ENGINE.map((s, i) => (
              <li key={s.t} className="flex flex-1 items-center gap-3 lg:flex-col">
                <div className="card w-full flex-1 p-4 text-center">
                  <p className="font-bold text-primary">{s.t}</p>
                  <p className="mt-1 text-sm text-ink-2">{s.d}</p>
                </div>
                {i < ENGINE.length - 1 && <span className="text-2xl text-ink-3 lg:hidden">↓</span>}
              </li>
            ))}
          </ol>
          <div className="mx-auto mt-6 flex max-w-[900px] flex-wrap justify-center gap-2 text-sm">
            <span className="chip">⚡ استجابة لحظية</span>
            <span className="chip">💸 تكلفة أقل</span>
            <span className="chip">🎯 مفيش «هلوسة» في الأرقام</span>
          </div>
        </section>

        {/* Teachers */}
        <section className="mx-auto grid max-w-[1100px] items-center gap-8 px-4 py-20 md:grid-cols-[1fr_1fr]">
          <div className="space-y-4">
            <p className="text-sm font-bold text-mint-dark">للمدرسين</p>
            <h2 className="font-display text-[32px] font-extrabold leading-tight text-primary sm:text-[44px]">إحنا مع المدرس، مش ضده.</h2>
            <p className="text-[17px] leading-8 text-ink-2">
              المدرسين الأقوياء ممكن يبقوا مصممين محتوى، وخبراء تعلم، وشركاء توزيع. ابعت المهمات لطلابك قبل الحصة أو كتدريب، وشوف بالظبط فين الفصل متلخبط.
            </p>
          </div>
          <ul className="grid gap-3">
            {["معامل تفاعلية موثوقة علميًا", "واجبات ومهمات تبعتها لفصلك", "تقارير بالمفاهيم الخاطئة الأكثر انتشارًا", "صمّم مهمات بنفسك مع فريقنا"].map((t) => (
              <li key={t} className="card flex items-center gap-3 p-4 font-semibold text-ink">
                <span className="grid h-8 w-8 place-items-center rounded-full bg-mint-soft text-mint-dark">✓</span>
                {t}
              </li>
            ))}
          </ul>
        </section>

        {/* Pricing */}
        <section id="pricing" className="scroll-mt-20 border-y-2 border-line bg-surface px-4 py-20">
          <SectionTitle kicker="الأسعار" title="ابدأ مجانًا" sub="أسعار مبدئية للإطلاق التجريبي — هنختبرها مع أول دفعة من الطلاب وأولياء الأمور." />
          <div className="mx-auto mt-12 grid max-w-[1050px] gap-5 md:grid-cols-3">
            {[
              { name: "مجاني", price: "0", per: "", items: ["معامل مختارة", "مهمات محدودة", "المرشد بمحرك القواعد"], cta: "ابدأ دلوقتي", href: "/learn", style: "btn-ghost" },
              { name: "مِخيال برو", price: "99", per: "ج.م / شهر", items: ["كل المهمات والمعامل", "مسار تعلم متكيّف", "وضع الامتحان الكامل", "مرشد AI سقراطي", "تقرير تقدّم لولي الأمر"], cta: "انضم لقائمة الانتظار", href: "#waitlist", style: "btn-primary", featured: true },
              { name: "مدارس وسناتر", price: "تواصل معانا", per: "", items: ["حسابات للطلاب", "لوحة للمدرس", "تحليلات مجمّعة للفصل"], cta: "كلّمنا", href: "#waitlist", style: "btn-ghost" },
            ].map((p) => (
              <div key={p.name} className={`card flex flex-col p-7 ${p.featured ? "border-primary shadow-[0_8px_0_0_var(--brand-primary)]" : ""}`}>
                {p.featured && <span className="chip mb-3 self-start !border-primary !text-primary">الأكثر قيمة</span>}
                <h3 className="text-xl font-bold text-ink">{p.name}</h3>
                <p className="mt-2">
                  <span className="font-display text-4xl font-extrabold text-ink">{p.price}</span> <span className="text-sm text-ink-3">{p.per}</span>
                </p>
                <ul className="mt-4 flex-1 space-y-2 text-ink-2">
                  {p.items.map((i) => (
                    <li key={i}>✓ {i}</li>
                  ))}
                </ul>
                <a href={p.href} className={`btn ${p.style} mt-6`}>
                  {p.cta}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Waitlist */}
        <section id="waitlist" className="scroll-mt-20 px-4 py-20">
          <div className="card mx-auto max-w-[640px] space-y-5 p-7 text-center sm:p-10">
            <h2 className="font-display text-[32px] font-extrabold leading-tight text-primary sm:text-[40px]">كن من أول دفعة</h2>
            <p className="text-ink-2">بنختار أول طلاب ومدرسين للتجربة المجانية. سجّل وهنكلمك.</p>
            <Waitlist />
          </div>
        </section>
      </main>

      {/* Footer band */}
      <footer className="bg-primary px-4 py-12 text-white">
        <div className="mx-auto flex max-w-[1200px] flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="rounded-[14px] bg-white px-3 py-1.5">
              <Logo />
            </div>
            <p className="max-w-xs text-sm text-white/80">ملعب علمي تفاعلي بالذكاء الاصطناعي لطلاب الثانوية العامة في مصر.</p>
          </div>
          <div className="grid grid-cols-2 gap-8 text-sm">
            <div className="space-y-2">
              <p className="font-bold">المنصة</p>
              <Link href="/learn" className="block text-white/80 hover:text-white">مسار التعلم</Link>
              <a href="#missions" className="block text-white/80 hover:text-white">المهمات</a>
              <a href="#pricing" className="block text-white/80 hover:text-white">الأسعار</a>
            </div>
            <div className="space-y-2">
              <p className="font-bold">للشركاء</p>
              <a href="#waitlist" className="block text-white/80 hover:text-white">المدرسين</a>
              <a href="#waitlist" className="block text-white/80 hover:text-white">المدارس والسناتر</a>
            </div>
          </div>
        </div>
        <p className="mx-auto mt-10 max-w-[1200px] text-xs text-white/60">© 2026 مِخيال — نسخة تجريبية (MVP). كل الأسعار والأرقام فرضيات قيد الاختبار.</p>
      </footer>
    </>
  );
}
