import * as React from "react";
import { Slot } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/** shadcn Button with Mikhyal "sticker" variants: a 2px edge and a ledge that presses in. */
const buttonVariants = cva(
  "inline-flex shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-[14px] border-2 border-transparent text-base font-bold outline-none transition-[transform,box-shadow,background-color,color] duration-150 focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-5",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_4px_0_0_var(--brand-primary-edge)] hover:bg-primary-hover active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--brand-primary-edge)]",
        mint: "bg-mint text-white shadow-[0_4px_0_0_var(--brand-discovery-dark)] hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--brand-discovery-dark)]",
        amber:
          "bg-amber text-ink shadow-[0_4px_0_0_var(--brand-insight-dark)] hover:brightness-105 active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--brand-insight-dark)]",
        outline:
          "border-line-strong bg-surface text-primary shadow-[0_4px_0_0_var(--border-strong)] hover:bg-primary-soft active:translate-y-[3px] active:shadow-[0_1px_0_0_var(--border-strong)]",
        destructive:
          "bg-destructive text-white shadow-[0_4px_0_0_#b42318] active:translate-y-[3px] active:shadow-[0_1px_0_0_#b42318]",
        ghost: "text-ink-2 hover:bg-muted hover:text-primary",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-12 px-5",
        sm: "min-h-10 px-3.5 text-sm",
        lg: "min-h-14 px-7 text-lg",
        icon: "size-12",
        "icon-sm": "size-10",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "button";
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
