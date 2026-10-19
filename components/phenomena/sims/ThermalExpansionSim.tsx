"use client";
import { useState } from "react";
import { bimetalCurvature, expansion } from "@/lib/physics/phenomena";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { Choice, param, SimFrame, Slider, useObservations } from "./SimFrame";
import { useAnimationFrame } from "./useAnimationFrame";

const W = 560;
const H = 330;
const L0 = 12;
const T_INSTALL = 20;
const MAT = { steel: { label: "صلب", alpha: 1.2e-5 }, aluminium: { label: "ألومنيوم", alpha: 2.3e-5 } } as const;
/** Millimetres of expansion drawn as this many pixels (the drawing is exaggerated, the numbers are not). */
const PX_PER_MM = 9;

export function ThermalExpansionSim() {
  const [T, setT] = useState(20);
  const [gapMm, setGapMm] = useState(6);
  const [mat, setMat] = useState<keyof typeof MAT>("steel");
  const [time, setTime] = useState(0);
  const reduced = usePrefersReducedMotion();
  useAnimationFrame((dt) => setTime((t) => t + dt), !reduced);

  const alpha = MAT[mat].alpha;
  const dL = expansion(alpha, L0, T - T_INSTALL);
  const dLmm = dL * 1000;
  const remaining = gapMm - dLmm;
  const buckled = remaining < 0;
  const ext = dLmm * PX_PER_MM;

  // Rails: left rail grows to the right, right rail grows to the left; the gap is drawn to scale.
  const gapPx = gapMm * PX_PER_MM;
  const railY = 110;
  const free = { left: 250 - gapPx / 2 + ext / 2, right: 250 + gapPx / 2 - ext / 2 };
  const overlap = Math.max(0, free.left - free.right);
  // With no room left the rails press end to end and the extra length bows them sideways.
  const leftEnd = overlap > 0 ? 250 : free.left;
  const rightStart = overlap > 0 ? 250 : free.right;
  const kink = buckled ? Math.min(55, 8 * Math.sqrt(overlap * 4)) : 0;

  // Atom lattice: spacing grows with T (exaggerated), jiggle amplitude ∝ absolute temperature.
  const spacing = 22 * (1 + (T - T_INSTALL) * alpha * 400);
  const amp = 0.6 + ((T + 273) / 333) * 2.6;

  // Bimetal: brass (α = 19e-6) on steel (12e-6), 1 mm thick, 10 cm long.
  const kappa = bimetalCurvature(19e-6, 12e-6, T - T_INSTALL, 1e-3);
  const tipMm = (kappa * 0.1 ** 2) / 2 * 1000;
  const bend = tipMm * 14; // exaggerated

  const obs = useObservations([
    { id: "hot", label: "سخّن لـ $50^\\circ\\mathrm{C}$ وشوف الفراغ بيقفل", met: T >= 50 && !buckled },
    { id: "kink", label: "اقفل الفراغ (0 mm) وسخّن: القضبان بتتقوّس!", met: buckled },
    { id: "cold", label: "برّد تحت الصفر: الفراغ بيوسع والشريط بيتقوّس للناحية التانية", met: T < 0 },
  ]);

  const rail = (x1: number, x2: number, bulge: number, key: string) => {
    const mid = (x1 + x2) / 2;
    return <path key={key} d={`M${x1},${railY} Q${mid},${railY - bulge * 2} ${x2},${railY}`} stroke="#64748b" strokeWidth="12" fill="none" strokeLinecap="butt" />;
  };

  return (
    <SimFrame
      onReset={() => {
        setT(20);
        setGapMm(6);
        setMat("steel");
      }}
      stage={
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="قضبان سكة حديد بتتمدد مع الحرارة، وشبكة ذرات، وشريط مزدوج بيتقوّس">
          <rect width={W} height={H} fill={`rgba(244,181,68,${Math.max(0, (T - 20) / 120)})`} />
          {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <rect key={i} x={30 + i * 55} y={railY - 6} width="16" height="40" rx="3" fill="#b08968" opacity="0.7" />
          ))}
          {rail(20, leftEnd, buckled ? kink : 0, "l")}
          {rail(rightStart, W - 60, buckled ? kink * 0.6 : 0, "r")}
          {!buckled && (
            <g>
              <line x1={leftEnd} y1={railY + 22} x2={rightStart} y2={railY + 22} stroke="#e5484d" strokeWidth="2" />
              <text x={(leftEnd + rightStart) / 2} y={railY + 40} textAnchor="middle" fontSize="12" fill="#b42318">
                {remaining.toFixed(2)} mm
              </text>
            </g>
          )}
          {buckled && (
            <text x="250" y={railY + 48} textAnchor="middle" fontSize="13" fill="#b42318" fontWeight="bold">
              مافيش مكان للتمدد ← القضيب اتقوّس
            </text>
          )}
          <text x="20" y="30" fontSize="12" fill="#475569">
            قضبان {MAT[mat].label} · L₀ = 12 m · التمدد مرسوم مكبّر (الأرقام حقيقية)
          </text>

          {/* Atom lattice inset */}
          <g transform="translate(30,190)">
            <rect width="190" height="120" rx="10" fill="#fff" stroke="#cbd5e1" />
            <text x="95" y="16" textAnchor="middle" fontSize="11" fill="#64748b">
              الذرات بتهتز أكتر وتبعد عن بعض
            </text>
            {Array.from({ length: 4 }).flatMap((_, r) =>
              Array.from({ length: 6 }).map((__, c) => {
                const jx = reduced ? 0 : amp * Math.sin(time * 9 + r * 1.7 + c * 2.3);
                const jy = reduced ? 0 : amp * Math.cos(time * 11 + r * 2.1 + c * 1.3);
                return <circle key={`${r}-${c}`} cx={95 + (c - 2.5) * spacing * 0.95 + jx} cy={68 + (r - 1.5) * spacing * 0.95 + jy} r="6" fill="#5146e8" opacity="0.85" />;
              }),
            )}
          </g>

          {/* Bimetallic strip */}
          <g transform="translate(270,200)">
            <rect x="-6" y="-14" width="14" height="70" fill="#334155" rx="2" />
            <path d={`M8,10 Q120,${10 + bend * 0.5} 240,${10 + bend}`} stroke="#d4a72c" strokeWidth="9" fill="none" />
            <path d={`M8,19 Q120,${19 + bend * 0.5} 240,${19 + bend}`} stroke="#94a3b8" strokeWidth="9" fill="none" />
            <text x="120" y="60" textAnchor="middle" fontSize="11" fill="#64748b">
              شريط مزدوج: نحاس أصفر (فوق) + صلب
            </text>
            <text x="120" y="76" textAnchor="middle" fontSize="11" fill="#64748b">
              طرفه اتحرك {tipMm.toFixed(2)} mm
            </text>
          </g>
        </svg>
      }
      controls={
        <>
          <Slider param={param("T", "درجة الحرارة", "T", -10, 60, 1, "°C", 20)} value={T} onChange={setT} />
          <Slider param={param("gap", "الفراغ عند التركيب (20°C)", "g", 0, 10, 0.5, "mm", 6)} value={gapMm} onChange={setGapMm} />
          <Choice label="مادة القضبان" value={mat} onChange={setMat} options={(Object.keys(MAT) as (keyof typeof MAT)[]).map((k) => ({ value: k, label: `${MAT[k].label} (α = ${MAT[k].alpha * 1e6}×10⁻⁶)` }))} />
        </>
      }
      readouts={[
        { label: "التغير في الحرارة", tex: `\\Delta T = ${T - T_INSTALL}\\,\\mathrm{K}` },
        { label: "التمدد", tex: `\\Delta L = ${dLmm.toFixed(2)}\\,\\mathrm{mm}` },
        { label: "الفراغ الباقي", tex: buckled ? "0\\;(\\text{تقوّس})" : `${remaining.toFixed(2)}\\,\\mathrm{mm}`, tone: buckled ? "bad" : "good" },
      ]}
      notice={
        buckled
          ? `القضيب عايز يطول $${dLmm.toFixed(2)}\\,\\mathrm{mm}$ والفراغ $${gapMm}\\,\\mathrm{mm}$ بس — القوة الهائلة دي بتقوّس الحديد (sun kink).`
          : `$\\Delta L = \\alpha L_0 \\Delta T = ${alpha * 1e6}\\times10^{-6}\\times12\\times${T - T_INSTALL}$. الألومنيوم بيتمدد تقريبًا ضعف الصلب.`
      }
      observations={obs}
      howItWorks={[
        "السخونية بتزوّد طاقة اهتزاز الذرات، فمتوسط المسافة بينها بيزيد.",
        "كل جزء صغير من القضيب بيطول شوية، فالزيادة الكلية تتناسب مع الطول الأصلي $L_0$.",
        "والزيادة تتناسب مع التغير في الحرارة: $\\Delta L = \\alpha L_0 \\Delta T$.",
        "في الشريط المزدوج، معدن بيطول أكتر من التاني فالشريط لازم يتقوّس — زي ترموستات المكواة.",
      ]}
    />
  );
}
