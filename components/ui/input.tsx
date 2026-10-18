import * as React from "react";
import { cn } from "@/lib/utils";

function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex min-h-12 w-full min-w-0 rounded-[14px] border-2 border-input bg-surface px-4 text-base text-ink outline-none transition-[color,box-shadow,border-color] placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-55 aria-invalid:border-destructive",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
