"use client";
import { useRef, useState } from "react";
import { Plot, Point, Line, Text } from "mafs";
import { CONST, photoEmission, wavelengthToRGB, WORK_FUNCTIONS_EV } from "@/lib/physics/phenomena";
import { usePrefersReducedMotion } from "@/components/sims/useSimClock";
import { Choice, param, sci, SimFrame, Slider, useObservations } from "./SimFrame";
import { SimPlot } from "./SimPlot";
import { useAnimationFrame } from "./useAnimationFrame";

const W = 560;
const H = 300;
const PLATE_X = 380;
const METALS = { Cs: "سيزيوم", Na: "صوديوم", Zn: "خارصين" } as const;

interface Photon {
  id: number;
  x: number;
  y: number;
}
interface Electron {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

export function PhotoelectricSim() {
  const [lambda, setLambda] = useState(400);
  const [intensity, setIntensity] = useState(5);
  const [metal, setMetal] = useState<keyof typeof METALS>("Na");
  const [playing, setPlaying] = useState(true);
  const [, setFrame] = useState(0);
  const reduced = usePrefersReducedMotion();
  const photons = useRef<Photon[]>([]);
  const electrons = useRef<Electron[]>([]);
  const counter = useRef({ next: 0, spawn: 0, emitted: [] as number[], clock: 0 });

  const phi = WORK_FUNCTIONS_EV[metal];
  const out = photoEmission(lambda, phi);
  const color = wavelengthToRGB(lambda);
  // Visual electron speed ∝ √K (K = ½mv²).
  const speed = 60 + 110 * Math.sqrt(out.kEv);

  useAnimationFrame(
    (dt) => {
      const c = counter.current;
      c.clock += dt;
      c.spawn += dt * intensity * 2.2;
      while (c.spawn >= 1) {
        c.spawn -= 1;
        photons.current.push({ id: c.next++, x: 70, y: 70 + Math.random() * 160 });
      }
      photons.current = photons.current.filter((p) => {
        p.x += 260 * dt;
        if (p.x < PLATE_X - 6) return true;
        if (out.emits) {
          const a = (-0.6 + Math.random() * 1.2) * 0.9;
          electrons.current.push({ id: c.next++, x: PLATE_X + 8, y: p.y, vx: speed * Math.cos(a), vy: speed * Math.sin(a) });
          c.emitted.push(c.clock);
        }
        return false;
      });
      electrons.current = electrons.current.filter((e) => {
        e.x += e.vx * dt;
        e.y += e.vy * dt;
        return e.x < W + 10 && e.y > -10 && e.y < H + 10;
      });
      c.emitted = c.emitted.filter((t) => c.clock - t < 2);
      setFrame((f) => f + 1);
    },
    playing && !reduced,
  );

  const rate = reduced ? (out.emits ? intensity * 2.2 : 0) : counter.current.emitted.length / 2;
  const obs = useObservations([
    { id: "red", label: "ضوء أحمر ($\\lambda > 600\\,\\mathrm{nm}$) بأقصى شدة: ولا إلكترون!", met: lambda > 600 && intensity >= 9.5 && !out.emits },
    { id: "uv", label: "قصّر الطول الموجي: الإلكترونات بتطلع أسرع", met: out.kEv > 1.5 },
    { id: "metal", label: "غيّر المعدن للخارصين: محتاج فوق بنفسجي", met: metal === "Zn" && out.emits },
  ]);

  const fx = out.f / 1e14;
  const f0x = out.f0 / 1e14;
  const slope = CONST.h / CONST.e * 1e14;
  return (
    <SimFrame
      playing={playing}
      onTogglePlay={() => setPlaying((p) => !p)}
      onReset={() => {
        photons.current = [];
        electrons.current = [];
        setLambda(400);
        setIntensity(5);
        setMetal("Na");
      }}
      stage={
        <svg viewBox={`0 0 ${W} ${H}`} className="block h-auto w-full" role="img" aria-label="ضوء بيقع على سطح معدن وإلكترونات بتتحرر">
          <defs>
            <radialGradient id="lamp" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={color} stopOpacity="0.9" />
              <stop offset="100%" stopColor={color} stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle cx="45" cy="150" r={30 + intensity * 4} fill="url(#lamp)" />
          <circle cx="45" cy="150" r="20" fill={color} stroke="#334155" strokeWidth="2" />
          <text x="45" y="200" textAnchor="middle" fontSize="12" fill="#475569">
            {lambda < 380 ? "UV" : `${lambda} nm`}
          </text>
          {photons.current.map((p) => (
            <path key={p.id} d={`M${p.x - 16},${p.y} q4,-7 8,0 t8,0 t8,0`} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />
          ))}
          <rect x={PLATE_X} y="40" width="16" height="220" rx="3" fill="#94a3b8" stroke="#475569" strokeWidth="2" />
          <text x={PLATE_X + 8} y="30" textAnchor="middle" fontSize="13" fill="#334155">
            {METALS[metal]} · φ = {phi} eV
          </text>
          {electrons.current.map((e) => (
            <g key={e.id}>
              <circle cx={e.x} cy={e.y} r="6" fill="#5146e8" />
              <text x={e.x} y={e.y + 3.5} textAnchor="middle" fontSize="9" fill="#fff" fontWeight="bold">
                −
              </text>
            </g>
          ))}
          {reduced && out.emits && <text x={PLATE_X + 90} y="150" fontSize="14" fill="#5146e8">e⁻ →→→</text>}
          {!out.emits && (
            <text x={PLATE_X + 90} y="150" fontSize="14" fill="#b42318" textAnchor="middle">
              مافيش انبعاث
            </text>
          )}
        </svg>
      }
      controls={
        <>
          <Slider param={param("lambda", "الطول الموجي", "λ", 200, 700, 5, "nm", 400)} value={lambda} onChange={setLambda} />
          <Slider param={param("int", "شدة الضوء (فوتونات/ث)", "I", 1, 10, 0.5, "", 5)} value={intensity} onChange={setIntensity} />
          <Choice label="المعدن" value={metal} onChange={setMetal} options={(Object.keys(METALS) as (keyof typeof METALS)[]).map((m) => ({ value: m, label: `${METALS[m]} (${WORK_FUNCTIONS_EV[m]} eV)` }))} />
        </>
      }
      readouts={[
        { label: "طاقة الفوتون", tex: `hf = ${out.photonEv.toFixed(2)}\\,\\mathrm{eV}` },
        { label: "أقصى طاقة حركة", tex: out.emits ? `K_{max} = ${out.kEv.toFixed(2)}\\,\\mathrm{eV}` : "K_{max} = 0", tone: out.emits ? "good" : "bad" },
        { label: "إلكترونات/ث (تقريبًا)", tex: rate.toFixed(1) },
        { label: "التردد", tex: `f = ${sci(out.f)}\\,\\mathrm{Hz}` },
        { label: "التردد الحرج", tex: `f_0 = ${sci(out.f0)}\\,\\mathrm{Hz}` },
      ]}
      notice={
        out.emits
          ? `كل فوتون بيدّي $${out.photonEv.toFixed(2)}\\,\\mathrm{eV}$ لإلكترون واحد؛ $${phi}\\,\\mathrm{eV}$ تمن الخروج والباقي حركة. زوّد الشدة: عدد الإلكترونات بيزيد بس سرعتهم زي ما هي.`
          : `طاقة الفوتون $${out.photonEv.toFixed(2)}\\,\\mathrm{eV}$ أقل من دالة الشغل $${phi}\\,\\mathrm{eV}$ — ولا إلكترون هيخرج مهما زوّدت الشدة. ده اللي الموجة الكلاسيكية ماقدرتش تفسّره.`
      }
      plot={
        <SimPlot label="K_max مقابل f" x={[3, 15]} y={[-0.5, 4.5]} xStep={2} yStep={1} xLabel="f (×10¹⁴ Hz)" yLabel="K_max (eV)">
          <Plot.OfX y={(x) => Math.max(0, slope * (x - f0x))} color="var(--mafs-blue)" />
          <Line.Segment point1={[f0x, 0]} point2={[f0x, 4.2]} color="var(--mafs-red)" style="dashed" />
          <Text x={f0x} y={4.3} size={12} color="var(--mafs-red)">
            f₀
          </Text>
          {fx >= 3 && fx <= 15 && <Point x={fx} y={out.kEv} color="var(--mafs-orange)" />}
        </SimPlot>
      }
      observations={obs}
      howItWorks={[
        "الضوء بيوصل على هيئة فوتونات، طاقة كل واحد $E = hf$ (التردد بس، مش الشدة).",
        "الفوتون بيدّي كل طاقته لإلكترون واحد مرة واحدة.",
        "الإلكترون محتاج على الأقل دالة الشغل $\\phi$ عشان يفلت من السطح.",
        "الباقي بيبقى طاقة حركة: $K_{max} = hf - \\phi$. الشدة بتزوّد العدد بس.",
      ]}
    />
  );
}
