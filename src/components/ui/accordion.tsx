import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Plus } from "lucide-react";

import { cn } from "@/lib/utils";

const Accordion = AccordionPrimitive.Root;

const AccordionItem = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Item>, React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>>(
  ({ className, ...props }, ref) => <AccordionPrimitive.Item ref={ref} className={cn("border-b border-line", className)} {...props} />,
);
AccordionItem.displayName = "AccordionItem";

const AccordionTrigger = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Trigger>, React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>>(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "group flex flex-1 cursor-pointer items-center justify-between gap-6 py-5 text-left text-base font-semibold text-ink transition-colors hover:text-plum sm:text-[17px]",
          className,
        )}
        {...props}
      >
        {children}
        <span
          aria-hidden="true"
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-line-strong bg-paper text-plum transition-transform duration-200 group-data-[state=open]:rotate-45 group-data-[state=open]:border-plum group-data-[state=open]:bg-plum group-data-[state=open]:text-cream"
        >
          <Plus className="h-4 w-4" />
        </span>
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  ),
);
AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

const AccordionContent = React.forwardRef<React.ElementRef<typeof AccordionPrimitive.Content>, React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>>(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content ref={ref} className="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down" {...props}>
      <div className={cn("max-w-2xl pb-6 pr-12 leading-relaxed text-ink-muted", className)}>{children}</div>
    </AccordionPrimitive.Content>
  ),
);
AccordionContent.displayName = AccordionPrimitive.Content.displayName;

export { Accordion, AccordionItem, AccordionTrigger, AccordionContent };
