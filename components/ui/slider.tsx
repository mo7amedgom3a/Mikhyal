"use client";
import * as React from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

function Slider({ className, defaultValue, value, min = 0, max = 100, ...props }: React.ComponentProps<typeof SliderPrimitive.Root>) {
  const values = React.useMemo(
    () => (Array.isArray(value) ? value : Array.isArray(defaultValue) ? defaultValue : [min]),
    [value, defaultValue, min],
  );
  return (
    <SliderPrimitive.Root
      data-slot="slider"
      defaultValue={defaultValue}
      value={value}
      min={min}
      max={max}
      className={cn("relative flex w-full touch-none select-none items-center py-2 data-[disabled]:opacity-50", className)}
      {...props}
    >
      <SliderPrimitive.Track data-slot="slider-track" className="relative h-2.5 w-full grow overflow-hidden rounded-full border-2 border-border bg-muted">
        <SliderPrimitive.Range data-slot="slider-range" className="absolute h-full bg-primary" />
      </SliderPrimitive.Track>
      {values.map((_, i) => (
        <SliderPrimitive.Thumb
          data-slot="slider-thumb"
          key={i}
          className="block size-6 shrink-0 cursor-grab rounded-full border-[3px] border-primary bg-surface shadow-[0_2px_0_0_var(--brand-primary-edge)] outline-none transition-[box-shadow,transform] hover:scale-110 focus-visible:ring-4 focus-visible:ring-ring/30 active:cursor-grabbing"
        />
      ))}
    </SliderPrimitive.Root>
  );
}

export { Slider };
