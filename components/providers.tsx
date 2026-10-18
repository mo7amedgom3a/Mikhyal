"use client";
import { Direction, Tooltip } from "radix-ui";

/** Radix primitives read direction from context, not the <html dir> attribute. */
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Direction.Provider dir="rtl">
      <Tooltip.Provider delayDuration={200}>{children}</Tooltip.Provider>
    </Direction.Provider>
  );
}
