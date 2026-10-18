import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border-2 px-3 py-0.5 text-sm font-semibold [&>svg]:pointer-events-none [&>svg]:size-3.5",
  {
    variants: {
      variant: {
        default: "border-primary/30 bg-primary-soft text-primary",
        outline: "border-border bg-surface text-ink-2",
        mint: "border-mint/40 bg-mint-soft text-mint-dark",
        amber: "border-amber bg-amber-soft text-amber-dark",
        destructive: "border-destructive/40 bg-danger-soft text-destructive",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

function Badge({ className, variant, asChild = false, ...props }: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";
  return <Comp data-slot="badge" className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
