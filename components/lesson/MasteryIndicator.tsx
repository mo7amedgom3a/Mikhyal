export function MasteryRing({ value, size = 56 }: { value: number; size?: number }) {
  const r = size / 2 - 5;
  const c = 2 * Math.PI * r;
  const pct = Math.round(value * 100);
  const color = value >= 0.75 ? "var(--brand-discovery)" : value >= 0.45 ? "var(--brand-insight)" : "var(--brand-primary)";
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`الإتقان ${pct}%`}>
      <circle cx={size / 2} cy={size / 2} r={r} stroke="var(--border)" strokeWidth="6" fill="none" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth="6"
        fill="none"
        strokeDasharray={`${c * value} ${c}`}
        strokeLinecap="round"
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      <text x="50%" y="54%" textAnchor="middle" dominantBaseline="middle" fontSize={size / 4.2} fontWeight="700" fill="var(--foreground)" fontFamily="var(--font-latin)">
        {pct}%
      </text>
    </svg>
  );
}

export function masteryLabel(v: number): string {
  if (v >= 0.75) return "متقن";
  if (v >= 0.45) return "في الطريق";
  if (v > 0.16) return "بدأت";
  return "جديد";
}
