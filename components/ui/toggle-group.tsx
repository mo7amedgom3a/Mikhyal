"use client";
import * as React from "react";
import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** Choice tiles (prediction options, exam answers, roles) in the sticker style. */
function ToggleGroup({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Root>) {
  return <ToggleGroupPrimitive.Root data-slot="toggle-group" className={cn("grid gap-2.5", className)} {...props} />;
}

function ToggleGroupItem({ className, ...props }: React.ComponentProps<typeof ToggleGroupPrimitive.Item>) {
  return (
    <ToggleGroupPrimitive.Item
      data-slot="toggle-group-item"
      className={cn(
        "inline-flex min-h-14 items-center justify-center gap-2 rounded-[14px] border-2 border-line-strong bg-surface px-4 text-base font-bold text-ink shadow-[0_4px_0_0_var(--border-strong)] outline-none transition-[transform,box-shadow,background-color,color,border-color] duration-150 hover:bg-muted focus-visible:ring-[3px] focus-visible:ring-ring/40 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--border-strong)] disabled:pointer-events-none data-[state=on]:border-primary data-[state=on]:bg-primary-soft data-[state=on]:text-primary data-[state=on]:shadow-[0_4px_0_0_var(--brand-primary)] [&_svg]:size-4",
        className,
      )}
      {...props}
    />
  );
}

export { ToggleGroup, ToggleGroupItem };
