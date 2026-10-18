import Link from "next/link";
import { Logo } from "./Logo";

export function Header({ cta = true }: { cta?: boolean }) {
  return (
    <header className="sticky top-0 z-30 border-b-2 border-line bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-2 sm:gap-4">
          <Link href="/#how" className="hidden text-sm font-semibold text-ink-2 hover:text-primary sm:inline">
            إزاي بنتعلم
          </Link>
          <Link href="/#missions" className="hidden text-sm font-semibold text-ink-2 hover:text-primary sm:inline">
            المهمات
          </Link>
          <Link href="/#pricing" className="hidden text-sm font-semibold text-ink-2 hover:text-primary md:inline">
            الأسعار
          </Link>
          {cta && (
            <Link href="/learn" className="btn btn-primary !min-h-10 !px-4 text-sm">
              جرّب مجانًا
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
