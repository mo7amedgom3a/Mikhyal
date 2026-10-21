import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "./Logo";

export function Header({ cta = true }: { cta?: boolean }) {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-border bg-surface/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-[1200px] items-center justify-between px-4">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-2">
          {[
            ["/lessons", "دروس الرياضيات", "inline-flex"],
            ["/learn", "المهمات", "hidden lg:inline-flex"],
            ["/workbench", "المختبر الرياضي", "hidden sm:inline-flex"],
            ["/phenomena", "الظواهر", "hidden md:inline-flex"],
            ["/play", "ملعب التجارب", "inline-flex"],
            ["/features", "لكل واحد", "hidden lg:inline-flex"],
          ].map(([href, label, cls]) => (
            <Button key={href} asChild variant="ghost" size="sm" className={cls}>
              <Link href={href}>{label}</Link>
            </Button>
          ))}
          {cta && (
            <Button asChild size="sm">
              <Link href="/learn">
                جرّب مجانًا <ArrowLeft />
              </Link>
            </Button>
          )}
        </nav>
      </div>
    </header>
  );
}
