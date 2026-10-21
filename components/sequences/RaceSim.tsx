"use client";
import { useState } from "react";
import { Plot, Point } from "mafs";
import { Flag, RotateCcw } from "lucide-react";
import { useObservations, param } from "@/components/phenomena/sims/SimFrame";
import { SimPlot } from "@/components/phenomena/sims/SimPlot";
import { useAnimationFrame } from "@/components/phenomena/sims/useAnimationFrame";
import { VariableSlider } from "@/components/lesson/VariableSlider";
import { Button } from "@/components/ui/button";
import { Tex } from "@/components/ui/Tex";
import { explicitCoefficients, explicitTerm, explicitTex, fmt, recursiveTerms } from "@/lib/sequences";
import { SimCard } from "./SimCard";

const P = {
  a1: param("ra1", "الحد الأول", "a₁", -10, 10, 1, "", 9),
  d: param("rd", "الأساس", "d", -5, 5, 0.5, "", 6),
  n: param("rn", "رتبة الحد المطلوب", "n", 2, 60, 1, "", 10),
};
/** Recursive terms computed per second in the race. */
const RATE = 8;

/** Recursive vs explicit: the recursive form walks through every term, the general term jumps straight there. */
export function RaceSim() {
  const [a1, setA1] = useState(P.a1.default);
  const [d, setD] = useState(P.d.default);
  const [n, setN] = useState(P.n.default);
  const [progress, setProgress] = useState<number | null>(null);
  const [finishedN, setFinishedN] = useState(0);

  const terms = recursiveTerms(a1, d, n);
  const target = explicitTerm(a1, d, n);
  const running = progress !== null && progress < n;
  const reached = progress === null ? 0 : Math.min(n, Math.floor(progress));

  useAnimationFrame((dt) => {
    if (progress === null) return;
    const next = Math.min(n, progress + dt * RATE);
    setProgress(next);
    if (next >= n) setFinishedN(n);
  }, running);

  const start = () => setProgress(1);
  const reset = () => setProgress(null);
  const changed = (set: (v: number) => void) => (v: number) => {
    set(v);
    setProgress(null);
  };

  const obs = useObservations([
    { id: "race", label: "شغّل السباق لحد رتبته $n \\ge 30$ وقارن عدد الخطوات.", met: finishedN >= 30 },
    { id: "line", label: "لاحظ أن نقاط $(n, a_n)$ تقع على خط مستقيم ميله $d$.", met: progress !== null && reached >= 5 },
    { id: "neg", label: "اجعل الخط هابطًا (ميله سالب).", met: d < 0 },
    { id: "ex14", label: "أعِد تمرين 14: $a_1 = 9$ و $d = 6$ واطلب $a_{10}$.", met: a1 === 9 && d === 6 && n === 10 && finishedN === 10 },
  ]);

  const { slope, intercept } = explicitCoefficients(a1, d);
  const lo = Math.min(0, ...terms);
  const hi = Math.max(0, ...terms);
  const pad = Math.max(1, (hi - lo) * 0.1);
  const yStep = niceStep(hi - lo + 2 * pad);
  const xStep = n <= 12 ? 1 : n <= 30 ? 5 : 10;
  const shownPoints = progress === null ? 0 : reached;

  return (
    <SimCard
      id="race"
      title="سباق الصيغتين: الارتدادية ضد الحد العام"
      intro="للوصول إلى $a_n$ بالصيغة الارتدادية نمر على كل الحدود قبله. صيغة الحد العام $a_n = a_1 + (n-1)d$ تصل مباشرة. اختر $n$ كبيرًا وابدأ السباق!"
      actions={
        <>
          <Button size="sm" onClick={start} disabled={running} data-race>
            <Flag /> ابدأ السباق
          </Button>
          <Button size="sm" variant="ghost" onClick={reset}>
            <RotateCcw /> إعادة
          </Button>
        </>
      }
      stage={
        <div className="space-y-3 p-4" dir="rtl">
          <Lane
            title="الصيغة الارتدادية"
            sub="نضيف d مرة بعد مرة"
            fraction={progress === null ? 0 : (Math.max(1, progress) - 1) / Math.max(1, n - 1)}
            tone="mint"
            tex={progress === null ? `a_1 = ${fmt(a1)}` : `a_{${Math.max(1, reached)}} = ${fmt(terms[Math.max(1, reached) - 1])}`}
            note={progress === null ? "لم يبدأ" : `${Math.max(0, reached - 1)} من ${n - 1} عملية جمع`}
            done={progress !== null && reached >= n}
          />
          <Lane
            title="صيغة الحد العام"
            sub="تعويض واحد مباشر"
            fraction={progress === null ? 0 : 1}
            tone="primary"
            tex={progress === null ? "a_n = a_1 + (n-1)d" : `a_{${n}} = ${fmt(a1)} + (${n}-1)(${fmt(d)}) = ${fmt(target)}`}
            note={progress === null ? "لم يبدأ" : "عملية واحدة ✓"}
            done={progress !== null}
          />
        </div>
      }
      readouts={[
        { label: "خطوات الطريقة الارتدادية", tex: `${n - 1}` },
        { label: "خطوات الحد العام", tex: "1" },
        { label: "الحد المطلوب", tex: `a_{${n}} = ${fmt(target)}`, tone: progress !== null && reached >= n ? "good" : "default" },
        { label: "الحد العام مبسّطًا", tex: `a_n = ${explicitTex(a1, d)}` },
        { label: "ميل الخط", tex: `d = ${fmt(slope)}` },
        { label: "يقطع المحور عند", tex: `a_0 = a_1 - d = ${fmt(intercept)}` },
      ]}
      below={
        <SimPlot
          label="النقاط (n, aₙ)"
          x={[0, n + 1.5]}
          y={[lo - pad, hi + pad]}
          xStep={xStep}
          yStep={yStep}
          xLabel="n"
          yLabel="aₙ"
          height={240}
        >
          {shownPoints >= 2 && <Plot.OfX y={(x) => slope * x + intercept} color="var(--mafs-orange)" opacity={0.6} style="dashed" />}
          {terms.slice(0, shownPoints).map((t, i) => (
            <Point key={i} x={i + 1} y={t} color={i === shownPoints - 1 ? "var(--mafs-blue)" : "var(--mafs-green)"} />
          ))}
        </SimPlot>
      }
      controls={
        <>
          <VariableSlider param={P.a1} value={a1} onChange={changed(setA1)} />
          <VariableSlider param={P.d} value={d} onChange={changed(setD)} />
          <VariableSlider param={P.n} value={n} onChange={changed(setN)} />
        </>
      }
      observations={obs}
    />
  );
}

function Lane({ title, sub, fraction, tone, tex, note, done }: { title: string; sub: string; fraction: number; tone: "mint" | "primary"; tex: string; note: string; done: boolean }) {
  return (
    <div className="rounded-[14px] border-2 border-border bg-surface p-3">
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <p className="font-bold text-ink">
          {title} <span className="text-sm font-normal text-ink-3">· {sub}</span>
        </p>
        <span className={done ? "text-sm font-bold text-mint-dark" : "text-sm text-ink-3"}>{note}</span>
      </div>
      <div className="h-4 overflow-hidden rounded-full border-2 border-border bg-muted" dir="ltr">
        <div className={tone === "mint" ? "h-full bg-mint" : "h-full bg-primary"} style={{ width: `${Math.max(0, Math.min(1, fraction)) * 100}%`, transition: tone === "primary" ? "width 300ms" : undefined }} />
      </div>
      <p className="relative mt-2 overflow-x-auto text-lg text-ink" dir="ltr">
        <Tex>{tex}</Tex>
      </p>
    </div>
  );
}

function niceStep(span: number): number {
  const raw = span / 6;
  const e = 10 ** Math.floor(Math.log10(raw || 1));
  for (const m of [1, 2, 5, 10]) if (raw <= m * e) return m * e;
  return 10 * e;
}
