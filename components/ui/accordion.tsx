"use client";
import * as React from "react";
import { Accordion as AccordionPrimitive } from "radix-ui";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";

function Accordion(props: React.ComponentProps<typeof AccordionPrimitive.Root>) {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

function AccordionItem({ className, ...props }: React.ComponentProps<typeof AccordionPrimitive.Item>) {
  return <AccordionPrimitive.Item data-slot="accordion-item" className={cn("rounded-[14px] border-2 border-border bg-surface", className)} {...props} />;
}

function AccordionTrigger({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Trigger>) {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        data-slot="accordion-trigger"
        className={cn(
          "flex flex-1 items-center gap-3 rounded-[12px] p-3 text-start text-[15px] font-bold text-ink outline-none transition-colors hover:text-primary focus-visible:ring-[3px] focus-visible:ring-ring/40 [&[data-state=open]>svg:last-child]:rotate-180",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="ms-auto size-4 shrink-0 text-muted-foreground transition-transform duration-200" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

function AccordionContent({ className, children, ...props }: React.ComponentProps<typeof AccordionPrimitive.Content>) {
  return (
    <AccordionPrimitive.Content data-slot="accordion-content" className="overflow-hidden text-[15px] data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" {...props}>
      <div className={cn("border-t-2 border-border px-4 py-2.5 text-ink-2", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
