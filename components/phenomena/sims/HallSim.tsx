"use client";
import { useEffect, useRef, useState } from "react";
import { hallVoltage } from "@/lib/physics/phenomena";
import { rng } from "@/lib/workbench/algebra";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { Choice, param, sci, SimFrame, Slider, useObservations } from "./SimFrame";
import { useAnimationFrame } from "./useAnimationFrame";

const W = 560;
const H = 300;
const STRIP = { x: 60, y: 90, w: 440, h: 120 };
const MATERIALS = { metal: { label: "نحاس (معدن)", n: 8.5e28 }, semi: { label: "شبه موصل", n: 1e24 } } as const;

interface P {
  x: number;
  y: number;
}

function formatVolts(v: number): string {
  const a = Math.abs(v);
  if (a >= 1) return `${v.toFixed(2)}\\,\\mathrm{V}`;
  if (a >= 1e-3) return `${(v * 1e3).toFixed(2)}\\,\\mathrm{mV}`;
  return `${sci(v * 1e6)}\\,\\mu\\mathrm{V}`;
}

export function HallSim() {
  const [I, setI] = useState(5);
  const [B, setB] = useState(1);
  const [tMm, setTMm] = useState(0.1);
  const [material, setMaterial] = useState<keyof typeof MATERIALS>("metal");
  const [carrier, setCarrier] = useState<"electron" | "hole">("electron");
  const [playing, setPlaying] = useState(true);
  const [charge, setCharge] = useState(0);
  const reduced = usePrefersReducedMotion();
  const canvas = useRef<HTMLCanvasElement>(null);
  const parts = useRef<P[]>([]);

  useEffect(() => {
    const rand = rng(4);
    parts.current = Array.from({ length: 70 }, () => ({ x: STRIP.x + rand() * STRIP.w, y: STRIP.y + 10 + rand() * (STRIP.h - 20) }));
  }, []);
  useEffect(() => setCharge(reduced ? (B > 0 ? 1 : 0) : 0), [B, carrier, material, reduced]);

  const n = MATERIALS[material].n;
  const VH = hallVoltage(I, B, n, tMm * 1e-3) * (carrier === "electron" ? -1 : 1);
  // Carriers are pushed toward the top edge in both cases; only their sign differs.
  const topSign = carrier === "electron" ? -1 : 1;

  const draw = () => {
    const c = canvas.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, W, H);
    // Strip
    ctx.fillStyle = material === "metal" ? "#f3e2cf" : "#dfe6f3";
    ctx.fillRect(STRIP.x, STRIP.y, STRIP.w, STRIP.h);
    ctx.strokeStyle = "#475569";
    ctx.lineWidth = 2;
    ctx.strokeRect(STRIP.x, STRIP.y, STRIP.w, STRIP.h);
    // Edge charge build-up
    const q = charge;
    const top = topSign > 0 ? "229,72,77" : "81,70,232";
    const bot = topSign > 0 ? "81,70,232" : "229,72,77";
    ctx.fillStyle = `rgba(${top},${0.75 * q})`;
    ctx.fillRect(STRIP.x, STRIP.y - 12, STRIP.w, 10);
    ctx.fillStyle = `rgba(${bot},${0.75 * q})`;
    ctx.fillRect(STRIP.x, STRIP.y + STRIP.h + 2, STRIP.w, 10);
    ctx.font = "bold 16px sans-serif";
    ctx.textAlign = "center";
    if (q > 0.05) {
      for (let i = 0; i < 9; i++) {
        const x = STRIP.x + 25 + i * 49;
        ctx.fillStyle = topSign > 0 ? "#b42318" : "#3730a3";
        ctx.fillText(topSign > 0 ? "+" : "−", x, STRIP.y - 16);
        ctx.fillStyle = topSign > 0 ? "#3730a3" : "#b42318";
        ctx.fillText(topSign > 0 ? "−" : "+", x, STRIP.y + STRIP.h + 30);
      }
    }
    // B field symbols (into the page)
    if (B > 0) {
      ctx.strokeStyle = "rgba(15,23,42,0.25)";
      ctx.lineWidth = 1.5;
      for (let gx = STRIP.x + 30; gx < STRIP.x + STRIP.w; gx += 60)
        for (let gy = STRIP.y + 25; gy < STRIP.y + STRIP.h; gy += 40) {
          ctx.beginPath();
          ctx.moveTo(gx - 5, gy - 5);
          ctx.lineTo(gx + 5, gy + 5);
          ctx.moveTo(gx + 5, gy - 5);
          ctx.lineTo(gx - 5, gy + 5);
          ctx.stroke();
        }
    }
    // Carriers
    for (const p of parts.current) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = carrier === "electron" ? "#5146e8" : "#e5484d";
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "bold 9px sans-serif";
      ctx.fillText(carrier === "electron" ? "−" : "+", p.x, p.y + 3);
    }
    // Current arrow (conventional)
    ctx.fillStyle = "#334155";
    ctx.font = "13px sans-serif";
    ctx.fillText("I →  (اتجاه التيار الاصطلاحي)", W / 2, H - 22);
    // Voltmeter
    const vx = 530;
    const vy = 150;
    ctx.strokeStyle = "#334155";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(vx, vy, 22, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "#334155";
    ctx.font = "bold 13px sans-serif";
    ctx.fillText("V", vx, vy - 8);
    const needle = Math.max(-1, Math.min(1, (q * Math.sign(VH) * Math.log10(1 + Math.abs(VH) * 1e7)) / 6));
    ctx.beginPath();
    ctx.moveTo(vx, vy + 10);
    ctx.lineTo(vx + 16 * Math.sin(needle * 1.2), vy + 10 - 16 * Math.cos(needle * 1.2));
    ctx.strokeStyle = "#e5484d";
    ctx.stroke();
    ctx.strokeStyle = "#94a3b8";
    ctx.beginPath();
    ctx.moveTo(STRIP.x + STRIP.w, STRIP.y - 7);
    ctx.lineTo(vx, STRIP.y - 7);
    ctx.lineTo(vx, vy - 22);
    ctx.moveTo(STRIP.x + STRIP.w, STRIP.y + STRIP.h + 7);
    ctx.lineTo(vx, STRIP.y + STRIP.h + 7);
    ctx.lineTo(vx, vy + 22);
    ctx.stroke();
  };

  useAnimationFrame(
    (dt) => {
      const drift = 40 + I * 12;
      const vx = carrier === "electron" ? -drift : drift;
      // Sideways push weakens as the edge charge's electric field balances the magnetic force.
      const push = B > 0 ? -B * 60 * (1 - charge) : 0;
      for (const p of parts.current) {
        p.x += vx * dt;
        p.y += push * dt + Math.sin((p.x + p.y) * 0.05) * 6 * dt;
        if (p.x < STRIP.x) p.x += STRIP.w;
        if (p.x > STRIP.x + STRIP.w) p.x -= STRIP.w;
        if (p.y < STRIP.y + 7) p.y = STRIP.y + 7 + Math.random() * (B > 0 ? 18 : STRIP.h - 14);
        if (p.y > STRIP.y + STRIP.h - 7) p.y = STRIP.y + STRIP.h - 7;
      }
      setCharge((c) => (B > 0 ? Math.min(1, c + dt * 0.6) : Math.max(0, c - dt)));
      draw();
    },
    playing && !reduced,
  );
  useEffect(() => {
    draw();
  });

  const obs = useObservations([
    { id: "field", label: "شغّل المجال $B$ وشوف الشحنات بتتجمع على حافة", met: B > 0 && charge > 0.8 },
    { id: "sign", label: "بدّل نوع الحاملات: إشارة الجهد بتنعكس", met: carrier === "hole" && B > 0 },
    { id: "semi", label: "جرّب شبه الموصل: الجهد بيكبر آلاف المرات", met: material === "semi" && B > 0 },
  ]);

  return (
    <SimFrame
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onReset={() => {
        setCharge(0);
        setB(1);
        setI(5);
        setCarrier("electron");
        setMaterial("metal");
      }}
      stage={<canvas ref={canvas} width={W} height={H} className="block h-auto w-full" role="img" aria-label="شريحة فيها تيار وحاملات شحنة بتنحرف في مجال مغناطيسي" />}
      controls={
        <>
          <Slider param={param("I", "التيار", "I", 0.5, 10, 0.5, "A", 5)} value={I} onChange={setI} />
          <Slider param={param("B", "المجال المغناطيسي (داخل الصفحة)", "B", 0, 2, 0.1, "T", 1)} value={B} onChange={setB} />
          <Slider param={param("t", "سُمك الشريحة", "t", 0.05, 1, 0.05, "mm", 0.1)} value={tMm} onChange={setTMm} />
          <Choice label="المادة" value={material} onChange={setMaterial} options={Object.entries(MATERIALS).map(([value, m]) => ({ value: value as keyof typeof MATERIALS, label: m.label }))} />
          <Choice
            label="نوع حاملات الشحنة"
            value={carrier}
            onChange={setCarrier}
            options={[
              { value: "electron", label: "إلكترونات (−)" },
              { value: "hole", label: "فجوات (+)" },
            ]}
          />
        </>
      }
      readouts={[
        { label: "جهد هول (أعلى − أسفل)", tex: B > 0 ? `V_H = ${formatVolts(VH * Math.max(charge, reduced ? 1 : 0))}` : "V_H = 0", tone: B > 0 && charge > 0.8 ? "good" : "default" },
        { label: "كثافة الحاملات", tex: `n = ${sci(n)}\\,\\mathrm{m^{-3}}` },
        { label: "القيمة النهائية", tex: `${formatVolts(B > 0 ? VH : 0)}` },
      ]}
      notice={
        B === 0
          ? "من غير مجال، الحاملات ماشية في خط مستقيم ومافيش فرق جهد عرضي."
          : `القوة المغناطيسية $q\\vec v \\times \\vec B$ بتزق الحاملات لفوق، فالحافة العليا بقت ${topSign > 0 ? "موجبة" : "سالبة"}. التجمع ده بيعمل مجال كهربي بيوقف الانحراف — ساعتها الجهد بيستقر.`
      }
      observations={obs}
      howItWorks={[
        "التيار = شحنات بتتحرك على طول الشريحة.",
        "المجال المغناطيسي العمودي بيأثر بقوة لورنتز $F = qvB$ بتزق الحاملات لجنب.",
        "الشحنات بتتجمع على حافة، والحافة التانية تشحن بعكسها ← فرق جهد عرضي $V_H$.",
        "الاتزان: $qE_H = qvB$ ← $V_H = \\frac{IB}{nqt}$. وإشارة $V_H$ بتكشف إشارة الحاملات.",
      ]}
    />
  );
}
