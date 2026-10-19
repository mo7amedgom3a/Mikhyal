"use client";
import { useEffect, useRef, useState } from "react";
import { electronWavelength, fringeSpacing, sampleHits, slitIntensity, type SlitMode } from "@/lib/physics/phenomena";
import { rng } from "@/lib/workbench/algebra";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { Choice, param, sci, SimFrame, Slider, useObservations } from "./SimFrame";
import { useAnimationFrame } from "./useAnimationFrame";

const W = 560;
const H = 300;
const D = 1; // m, slits → screen
const HALF = 0.5e-3; // m, half-height of the visible screen
const SCREEN_X = 420;
const BINS = 70;
const yToPx = (y: number) => H / 2 - (y / HALF) * (H / 2 - 12);

interface Flight {
  t: number;
  y: number;
}

export function DoubleSlitSim() {
  const [V, setV] = useState(100);
  const [dUm, setDUm] = useState(1);
  const [mode, setMode] = useState<SlitMode>("both");
  const [rate, setRate] = useState(30);
  const [playing, setPlaying] = useState(true);
  const [, setFrame] = useState(0);
  const reduced = usePrefersReducedMotion();
  const hits = useRef<number[]>([]);
  const flights = useRef<Flight[]>([]);
  const rand = useRef(rng(77));
  const acc = useRef(0);
  const canvas = useRef<HTMLCanvasElement>(null);

  const lambda = electronWavelength(V);
  const d = dUm * 1e-6;
  const spacing = fringeSpacing(lambda, D, d);

  useEffect(() => {
    hits.current = reduced ? sampleHits(1500, lambda, d, D, mode, HALF, rng(5)) : [];
    flights.current = [];
  }, [lambda, d, mode, reduced]);

  const draw = () => {
    const ctx = canvas.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(0, 0, W, H);
    // Source
    ctx.fillStyle = "#f4b544";
    ctx.beginPath();
    ctx.arc(34, H / 2, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "11px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText("مدفع إلكترونات", 40, H / 2 + 30);
    // Barrier with slits
    const bx = 170;
    const gap = 10 + dUm * 14;
    ctx.fillStyle = "#64748b";
    const slitH = 10;
    const s1 = H / 2 - gap / 2;
    const s2 = H / 2 + gap / 2;
    ctx.fillRect(bx, 0, 8, s1 - slitH / 2);
    ctx.fillRect(bx, s1 + slitH / 2, 8, s2 - s1 - slitH);
    if (mode === "one") ctx.fillRect(bx, s2 - slitH / 2, 8, slitH);
    ctx.fillRect(bx, s2 + slitH / 2, 8, H - s2 - slitH / 2);
    if (mode === "detector") {
      ctx.fillStyle = "#e5484d";
      ctx.fillRect(bx + 12, s1 - 8, 14, 16);
      ctx.fillRect(bx + 12, s2 - 8, 14, 16);
      ctx.fillStyle = "#fecaca";
      ctx.fillText("كاشف", bx + 19, s1 - 14);
    }
    // Electrons in flight
    ctx.fillStyle = "#93c5fd";
    for (const f of flights.current) {
      const x = 34 + f.t * (SCREEN_X - 34);
      const y = f.t < 0.36 ? H / 2 : yToPx(f.y) + (H / 2 - yToPx(f.y)) * (1 - (f.t - 0.36) / 0.64);
      ctx.beginPath();
      ctx.arc(x, y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Screen with dots
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(SCREEN_X, 0, 30, H);
    ctx.fillStyle = "rgba(147,197,253,0.85)";
    const r2 = rng(3);
    for (const y of hits.current) ctx.fillRect(SCREEN_X + 3 + r2() * 24, yToPx(y), 2, 2);
    // Histogram
    const counts = new Array(BINS).fill(0);
    for (const y of hits.current) {
      const b = Math.floor(((y + HALF) / (2 * HALF)) * BINS);
      if (b >= 0 && b < BINS) counts[b]++;
    }
    const max = Math.max(1, ...counts);
    const hx = SCREEN_X + 36;
    const bw = (H - 24) / BINS;
    ctx.fillStyle = "#38bdf8";
    counts.forEach((c, i) => {
      const y = H - 12 - (i + 1) * bw;
      ctx.fillRect(hx, y, (c / max) * (W - hx - 6), bw - 0.5);
    });
    // Theory curve
    ctx.strokeStyle = "#f4b544";
    ctx.lineWidth = 2;
    ctx.beginPath();
    for (let k = 0; k <= 200; k++) {
      const y = -HALF + (2 * HALF * k) / 200;
      const I = slitIntensity(y, lambda, d, D, mode);
      const px = hx + I * (W - hx - 6);
      const py = yToPx(y);
      if (k) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
  };

  useAnimationFrame(
    (dt) => {
      acc.current += dt * rate;
      while (acc.current >= 1) {
        acc.current -= 1;
        const [y] = sampleHits(1, lambda, d, D, mode, HALF, rand.current);
        if (y !== undefined) flights.current.push({ t: 0, y });
      }
      flights.current = flights.current.filter((f) => {
        f.t += dt * 1.6;
        if (f.t >= 1) {
          hits.current.push(f.y);
          return false;
        }
        return true;
      });
      if (hits.current.length > 6000) hits.current.splice(0, 1000);
      draw();
      setFrame((x) => x + 1);
    },
    playing && !reduced,
  );
  useEffect(() => {
    draw();
  });

  const n = hits.current.length;
  const obs = useObservations([
    { id: "build", label: "سيب 300 إلكترون يوصلوا: الهُدب بتظهر نقطة نقطة", met: mode === "both" && n >= 300 },
    { id: "one", label: "اقفل شق: الهُدب بتختفي", met: mode === "one" && n >= 150 },
    { id: "watch", label: "حط كاشف يعرف الإلكترون عدّى منين: التداخل بيختفي", met: mode === "detector" && n >= 150 },
  ]);

  return (
    <SimFrame
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onReset={() => {
        hits.current = [];
        flights.current = [];
      }}
      stage={<canvas ref={canvas} width={W} height={H} className="block h-auto w-full" role="img" aria-label="إلكترونات بتعدّي من شقين وبتعمل نقط على شاشة بتكوّن هُدب تداخل" />}
      controls={
        <>
          <Slider param={param("V", "جهد التعجيل", "V", 30, 600, 10, "V", 100)} value={V} onChange={setV} />
          <Slider param={param("d", "المسافة بين الشقين", "d", 0.5, 2, 0.1, "μm", 1)} value={dUm} onChange={setDUm} />
          <Slider param={param("rate", "إلكترونات في الثانية", "N", 5, 200, 5, "", 30)} value={rate} onChange={setRate} />
          <Choice
            label="الشقوق"
            value={mode}
            onChange={setMode}
            options={[
              { value: "both", label: "الشقين مفتوحين" },
              { value: "one", label: "شق واحد" },
              { value: "detector", label: "كاشف عند الشقوق" },
            ]}
          />
        </>
      }
      readouts={[
        { label: "طول موجة الإلكترون", tex: `\\lambda = ${sci(lambda * 1e9)}\\,\\mathrm{nm}` },
        { label: "المسافة بين الهُدب", tex: `\\Delta y = \\frac{\\lambda D}{d} = ${sci(spacing * 1e3)}\\,\\mathrm{mm}` },
        { label: "إلكترونات وصلت", tex: String(n), tone: n >= 300 ? "good" : "default" },
      ]}
      notice={
        mode === "both"
          ? n < 60
            ? "كل إلكترون بيوصل في نقطة واحدة — زي الجسيم. النقط شكلها عشوائي… استنى شوية."
            : "النقط بتتجمع في هُدب! كل إلكترون لوحده «عدّى» من الشقين وتداخل مع نفسه — زي الموجة. المنحنى الأصفر هو $|\\psi|^2$."
          : mode === "one"
            ? "بشق واحد مافيش موجتين يتداخلوا — بقعة واحدة عريضة."
            : "لما نعرف الإلكترون عدّى من أنهي شق، التداخل بيختفي. القياس بيغيّر النتيجة."
      }
      observations={obs}
      howItWorks={[
        "الإلكترون ليه طول موجي $\\lambda = \\frac{h}{p}$ — كل ما يسرع، الطول الموجي يقصر.",
        "الموجة بتعدّي من الشقين، والجزءين بيتداخلوا: بناء في أماكن وهدم في أماكن.",
        "الشاشة بتسجّل كل إلكترون كنقطة (جسيم)، بس احتمال مكانه $\\propto |\\psi|^2$ (موجة).",
        "الهُدب على مسافات $\\Delta y = \\frac{\\lambda D}{d}$؛ ومعرفة المسار بتلغي التداخل.",
      ]}
    />
  );
}
