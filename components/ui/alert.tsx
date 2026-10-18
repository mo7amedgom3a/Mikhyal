import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative grid w-full grid-cols-[0_1fr] items-start gap-y-1 rounded-[16px] border-2 px-4 py-3.5 text-[15px] has-[>svg]:grid-cols-[calc(var(--spacing)*5)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-5 [&>svg]:translate-y-0.5 [&>svg]:text-current",
  {
    variants: {
      variant: {
        default: "border-border bg-card text-card-foreground",
        primary: "border-primary bg-primary-soft text-ink [&>svg]:text-primary",
        mint: "border-mint bg-mint-soft text-ink [&>svg]:text-mint-dark",
        amber: "border-amber bg-amber-soft text-ink [&>svg]:text-amber-dark",
        destructive: "border-destructive bg-danger-soft text-ink [&>svg]:text-destructive",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

function Alert({ className, variant, ...props }: React.ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return <div data-slot="alert" role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

function AlertTitle({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-title" className={cn("col-start-2 flex min-h-5 flex-wrap items-center gap-2 font-bold", className)} {...props} />;
}

function AlertDescription({ className, ...props }: React.ComponentProps<"div">) {
  return <div data-slot="alert-description" className={cn("col-start-2 grid justify-items-start gap-1 leading-7 text-ink-2", className)} {...props} />;
}

export { Alert, AlertTitle, AlertDescription };
