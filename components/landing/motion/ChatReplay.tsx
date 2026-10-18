"use client";
import { useRef } from "react";
import { Bot, Calculator, Compass, FlaskConical, PencilLine, Repeat, RotateCcw, type LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TypingDots } from "@/components/lesson/TutorPanel";
import { gsap, MOTION_OK, useGSAP } from "./gsap";

const ERRORS: { t: string; e: string; i: string; icon: LucideIcon }[] = [
  { t: "مفاهيمي", e: "فاكر إن الجسم الأتقل بيقع أسرع في الفراغ", i: "تجربة مقارنة", icon: FlaskConical },
  { t: "رياضي", e: "غلط في ترتيب المعادلة أو نسي معامل", i: "سؤال على الخطوة", icon: Calculator },
  { t: "تمثيلي", e: "رسم أسهم القوى في اتجاه غلط", i: "إعادة رسم", icon: PencilLine },
  { t: "إجرائي", e: "اختار معادلة مش مناسبة أو نسي الوحدات", i: "تلميح للطريقة", icon: Compass },
  { t: "نقل المعرفة", e: "فاهم المثال المشهور بس اتلخبط في موقف جديد", i: "نفس الفكرة بشكل تاني", icon: Repeat },
];

/** The tutor dialogue from the product brief, replayed like a live chat when it scrolls into view. */
export function ChatReplay() {
  const scope = useRef<HTMLDivElement>(null);
  const tl = useRef<gsap.core.Timeline | null>(null);

  const { contextSafe } = useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add(MOTION_OK, () => {
        const bubbles = gsap.utils.toArray<HTMLElement>("[data-bubble]");
        const typing = gsap.utils.toArray<HTMLElement>("[data-typing]");
        const t = gsap.timeline({ paused: true });
        gsap.set(bubbles, { autoAlpha: 0, y: 16 });
        gsap.set(typing, { autoAlpha: 0, y: 16, display: "none" });
        bubbles.forEach((b, i) => {
          // In the DOM each typing indicator sits right before the bubble it announces.
          const dots = typing[i - 1];
          if (dots) {
            // Typing indicators take no space until they appear, so the bubbles don't leave gaps.
            t.set(dots, { display: "block" })
              .to(dots, { autoAlpha: 1, y: 0, duration: 0.25 })
              .to(dots, { autoAlpha: 0, duration: 0.2, delay: 0.9 })
              .set(dots, { display: "none" });
          }
          t.to(b, { autoAlpha: 1, y: 0, duration: 0.5, ease: "back.out(1.6)" }, dots ? ">" : "+=0.5");
          if (b.dataset.bubble === "diagnosis") {
            t.fromTo("[data-err-row='procedural']", { backgroundColor: "rgba(244,181,68,0)" }, { backgroundColor: "rgba(244,181,68,0.25)", duration: 0.4, yoyo: true, repeat: 3 }, "<");
          }
        });
        t.from("[data-err-row]", { x: 40, autoAlpha: 0, stagger: 0.08, duration: 0.4 }, 0);
        tl.current = t;
        gsap.timeline({ scrollTrigger: { trigger: scope.current, start: "top 70%", once: true, onEnter: () => t.play(0) } });
      });
    },
    { scope },
  );

  const replay = contextSafe(() => tl.current?.restart());

  return (
    <div ref={scope} className="mx-auto grid max-w-[1200px] items-center gap-10 px-4 py-24 lg:grid-cols-2">
      <div className="space-y-5">
        <p className="text-sm font-bold text-mint-dark">المرشد الذكي</p>
        <h2 className="font-display text-[32px] font-extrabold leading-tight text-primary sm:text-[48px]">مش شات بوت جنب الدرس.</h2>
        <p className="text-[17px] leading-8 text-ink-2">
          المرشد فاهم المحاكاة، والهدف من الدرس، وتاريخ محاولاتك. لما تغلط، بيحدد نوع الغلطة ويختار التدخل المناسب — سؤال، تجربة مقارنة، أو تلميح — من غير ما يحرق الإجابة.
        </p>
        <ul className="space-y-2">
          {ERRORS.map((e, idx) => {
            const Icon = e.icon;
            return (
              <li key={e.t} data-err-row={idx === 3 ? "procedural" : ""} className="flex flex-wrap items-center gap-2 rounded-[14px] border-2 border-border bg-surface p-3">
                <b className="min-w-24 text-ink">{e.t}</b>
                <span className="flex-1 text-sm text-ink-2">{e.e}</span>
                <Badge className="text-xs">
                  <Icon /> {e.i}
                </Badge>
              </li>
            );
          })}
        </ul>
      </div>
      <div className="space-y-3 rounded-[20px] border-2 border-border bg-card p-5 shadow-[0_8px_0_0_var(--border)]">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-ink-3">مهمة فيزيا: إيقاف عربية</p>
          <Button variant="ghost" size="sm" onClick={replay} className="motion-reduce:hidden">
            <RotateCcw className="size-4" /> أعد التشغيل
          </Button>
        </div>
        <div data-bubble className="rounded-[16px] border-2 border-border bg-muted p-4 leading-8 text-ink">
          <b className="mb-1 flex items-center gap-1.5 text-xs text-primary">
            <Bot className="size-4" aria-hidden /> مِخيال
          </b>
          عربية ماشية بسرعة 20 متر/ثانية، وفي عائق على بعد 30 متر. محتاجين نحدد أقل تباطؤ يخلّي العربية تقف قبل العائق. تحب تبدأ بإيه؟
        </div>
        <div data-typing className="hidden me-auto w-fit rounded-[16px] border-2 border-primary bg-primary px-4 py-3" aria-hidden>
          <span className="[&_span_span]:bg-white">
            <TypingDots />
          </span>
        </div>
        <div data-bubble className="me-auto max-w-[85%] rounded-[16px] border-2 border-primary bg-primary p-4 leading-8 text-white">
          نحسب الزمن من السرعة والمسافة وبعدين نطلع العجلة.
        </div>
        <div data-typing className="hidden w-fit rounded-[16px] border-2 border-border bg-surface px-4 py-3" aria-hidden>
          <TypingDots />
        </div>
        <div data-bubble="diagnosis" className="rounded-[16px] border-2 border-amber bg-amber-soft p-4 leading-8 text-ink">
          <b className="mb-1 flex items-center gap-1.5 text-xs text-amber-dark">
            <Bot className="size-4" aria-hidden /> مِخيال · خطأ إجرائي
          </b>
          ممكن، بس خلي بالك إن السرعة بتتغير أثناء الفرملة. عندك علاقة بتربط السرعة الابتدائية والنهائية والإزاحة والعجلة من غير ما تحتاج الزمن؟
        </div>
        <p data-bubble className="text-center text-xs text-ink-3">تدخّل سقراطي: المرشد بيلفت نظرك للفكرة بدل ما يديك الإجابة.</p>
      </div>
    </div>
  );
}
