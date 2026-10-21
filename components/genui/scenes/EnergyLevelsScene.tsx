"use client";
import { bohrEnergy, transitionWavelength } from "@/lib/physics/atomic";
import { wavelengthToRGB } from "@/lib/physics/phenomena";

/** Energy-level diagram computed from Eₙ = −13.6Z²/n², with the selected transition and its spectral line. */
export function EnergyLevelsScene({ Z = 1, nHi = 3, nLo = 2, nMax = 6 }: { Z?: number; nHi?: number; nLo?: number; nMax?: number }) {
  const z = Math.max(1, Number(Z));
  const hi = Math.round(Number(nHi));
  const lo = Math.round(Number(nLo));
  const levels = Array.from({ length: Number(nMax) }, (_, i) => i + 1);
  const e1 = bohrEnergy(z, 1);
  const y = (n: number) => 30 + (1 - bohrEnergy(z, n) / e1) * 240; // n=1 at bottom
  const valid = hi > lo;
  const lambda = valid ? transitionWavelength(z, hi, lo) : 0;
  const visible = lambda >= 380 && lambda <= 700;
  const color = visible ? wavelengthToRGB(lambda) : lambda < 380 ? "#8b5cf6" : "#991b1b";
  // Upper levels crowd together near 0 eV: label a level only if it clears the one below it.
  const labelled = new Set<number>();
  let lastY = Infinity;
  for (const n of levels) {
    const yy = 300 - y(n);
    if (lastY - yy >= 13 || n === hi || n === lo) {
      labelled.add(n);
      lastY = yy;
    }
  }
  const specX = (nm: number) => 330 + ((Math.min(750, Math.max(80, nm)) - 80) / 670) * 210;
  return (
    <svg viewBox="0 0 560 320" className="block h-auto w-full" role="img" aria-label="مستويات طاقة بور والانتقال المختار">
      {levels.map((n) => (
        <g key={n}>
          <line x1="40" x2="250" y1={300 - y(n)} y2={300 - y(n)} stroke={n === hi || n === lo ? "#111827" : "#94a3b8"} strokeWidth={n === hi || n === lo ? 2.5 : 1.2} />
          {labelled.has(n) && (
            <text x="258" y={300 - y(n) + 4} fontSize="11" fill="#475569">
              n={n} {bohrEnergy(z, n).toFixed(2)} eV
            </text>
          )}
        </g>
      ))}
      {valid && (
        <g>
          <line x1="110" x2="110" y1={300 - y(hi)} y2={300 - y(lo) - 8} stroke="#111827" strokeWidth="2.5" markerEnd="url(#arr)" />
          <path d={`M120,${(600 - y(hi) - y(lo)) / 2} q6,-8 12,0 t12,0 t12,0 t12,0 t12,0`} fill="none" stroke={color} strokeWidth="3" />
        </g>
      )}
      <defs>
        <marker id="arr" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
          <path d="M0,0 L10,5 L0,10 z" fill="#111827" />
        </marker>
        <linearGradient id="spec" x1="0" x2="1">
          {[380, 440, 490, 510, 580, 645, 700].map((nm) => (
            <stop key={nm} offset={`${((specX(nm) - 330) / 210) * 100}%`} stopColor={wavelengthToRGB(nm)} />
          ))}
        </linearGradient>
      </defs>
      <rect x={specX(380)} y="40" width={specX(700) - specX(380)} height="26" fill="url(#spec)" opacity="0.35" />
      <rect x="330" y="40" width="210" height="26" fill="none" stroke="#cbd5e1" />
      <text x="330" y="82" fontSize="10" fill="#64748b">UV</text>
      <text x="520" y="82" fontSize="10" fill="#64748b">IR</text>
      {valid && <line x1={specX(lambda)} x2={specX(lambda)} y1="36" y2="70" stroke={color} strokeWidth="4" />}
      <text x="435" y="104" textAnchor="middle" fontSize="12" fill="#334155">
        {valid ? `λ ≈ ${lambda.toFixed(0)} nm ${visible ? "(مرئي)" : lambda < 380 ? "(فوق بنفسجي)" : "(تحت أحمر)"}` : "اختار مستوى ابتدائي أعلى من النهائي"}
      </text>
    </svg>
  );
}
