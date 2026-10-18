import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 font-display text-2xl font-extrabold text-primary" aria-label="مِخيال">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
        <rect x="1" y="1" width="32" height="32" rx="10" fill="var(--brand-primary)" />
        <path d="M8 22 Q17 4 26 22" stroke="var(--brand-insight)" strokeWidth="3" fill="none" strokeLinecap="round" />
        <circle cx="26" cy="22" r="3" fill="var(--brand-discovery)" />
        <circle cx="17" cy="12.5" r="2" fill="#fff" />
      </svg>
      مِخيال
    </Link>
  );
}
