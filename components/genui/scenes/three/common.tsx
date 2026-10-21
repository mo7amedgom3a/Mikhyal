"use client";
import { useEffect, useState } from "react";
import { rng } from "@/lib/workbench/algebra";

export const COLORS = { proton: "#ef4444", neutron: "#94a3b8", electron: "#5146e8", free: "#38bdf8", copper: "#c2703d", highlight: "#facc15" };

/** Nucleons packed in a ball: radius ∝ cbrt(index) along a 3D golden-angle spiral. Protons and neutrons interleaved. */
export function packNucleus(Z: number, N: number, radius: number) {
  const A = Math.max(1, Z + N);
  const r = rng(A * 31 + Z);
  const kinds = [...Array(Z).fill("p"), ...Array(N).fill("n")] as ("p" | "n")[];
  for (let i = kinds.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [kinds[i], kinds[j]] = [kinds[j], kinds[i]];
  }
  const ga = Math.PI * (3 - Math.sqrt(5));
  return kinds.map((kind, i) => {
    const rr = A === 1 ? 0 : radius * Math.cbrt((i + 0.5) / A);
    const y = 1 - (2 * (i + 0.5)) / A;
    const ring = Math.sqrt(1 - y * y);
    const th = ga * i;
    return { kind, pos: [rr * ring * Math.cos(th), rr * y, rr * ring * Math.sin(th)] as [number, number, number] };
  });
}

/** Radius of one nucleon sphere so A of them roughly fill a ball of radius R. */
export const nucleonRadius = (A: number, R: number) => (A <= 1 ? R : (R / Math.cbrt(A)) * 1.05);

/** Electron-cloud sample: per shell, points spread radially around the shell radius (hydrogen-like falloff). */
export function cloudPoints(shells: number[], rOf: (i: number) => number, perElectron = 90) {
  const r = rng(shells.reduce((a, b) => a * 7 + b, 3));
  const pts: number[] = [];
  shells.forEach((count, i) => {
    const R = rOf(i);
    for (let k = 0; k < count * perElectron; k++) {
      // r² e^{-2r/R'} peaks at R': sample by rejection on [0, 3R].
      let d = 0;
      for (;;) {
        d = r() * 3 * R;
        const x = d / R;
        if (r() < x * x * Math.exp(2 - 2 * x)) break;
      }
      const u = r() * 2 - 1;
      const th = r() * Math.PI * 2;
      const s = Math.sqrt(1 - u * u);
      pts.push(d * s * Math.cos(th), d * u, d * s * Math.sin(th));
    }
  });
  return new Float32Array(pts);
}

export function useWebGL() {
  const [ok, setOk] = useState<boolean | null>(null);
  useEffect(() => {
    try {
      const c = document.createElement("canvas");
      setOk(!!(c.getContext("webgl2") || c.getContext("webgl")));
    } catch {
      setOk(false);
    }
  }, []);
  return ok;
}

export function Legend({ items }: { items: { color: string; label: string }[] }) {
  return (
    <ul dir="rtl" className="pointer-events-none absolute end-2 top-2 space-y-1 rounded-[10px] bg-white/80 px-2 py-1.5 text-xs text-ink-2 backdrop-blur">
      {items.map((i) => (
        <li key={i.label} className="flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full" style={{ background: i.color }} />
          {i.label}
        </li>
      ))}
    </ul>
  );
}

export function NoWebGL({ children }: { children?: React.ReactNode }) {
  return (
    <div className="space-y-2 p-3">
      <p dir="rtl" className="text-sm text-ink-3">
        المتصفح ده مش بيدعم WebGL، فهنعرض الرسم ثنائي الأبعاد.
      </p>
      {children}
    </div>
  );
}
