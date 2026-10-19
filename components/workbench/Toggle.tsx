import { cn } from "@/lib/utils";

/** Accessible switch with a label. */
export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} onClick={() => onChange(!checked)} className="flex items-center gap-2 text-start text-sm text-ink-2">
      <span className={cn("relative inline-flex h-6 w-11 shrink-0 rounded-full border-2 transition-colors", checked ? "border-primary bg-primary" : "border-line-strong bg-muted")}>
        <span className={cn("absolute top-0.5 size-4 rounded-full bg-white shadow transition-[inset-inline-start]", checked ? "start-[22px]" : "start-0.5")} />
      </span>
      {label}
    </button>
  );
}
