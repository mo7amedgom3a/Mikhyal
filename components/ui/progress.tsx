"use client";
import * as React from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

/** Fill uses width (not translateX) so it grows from the start edge in both RTL and LTR. */
function Progress({ className, value, indicatorClassName, ...props }: React.ComponentProps<typeof ProgressPrimitive.Root> & { indicatorClassName?: string }) {
  return (
    <ProgressPrimitive.Root data-slot="progress" value={value} className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-muted", className)} {...props}>
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn("h-full rounded-full bg-primary transition-[width] duration-300", indicatorClassName)}
        style={{ width: `${Math.max(0, Math.min(100, value ?? 0))}%` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
