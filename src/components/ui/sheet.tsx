import * as React from "react";
import * as SheetPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;
const SheetTitle = SheetPrimitive.Title;
const SheetDescription = SheetPrimitive.Description;

const SheetContent = React.forwardRef<
  React.ElementRef<typeof SheetPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof SheetPrimitive.Content> & { side?: "left" | "right" }
>(({ side = "left", className, children, ...props }, ref) => (
  <SheetPrimitive.Portal>
    <SheetPrimitive.Overlay className="fixed inset-0 z-50 bg-ink/30 backdrop-blur-[2px] data-[state=open]:animate-fade-in" />
    <SheetPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-y-0 z-50 flex w-[86vw] max-w-[320px] flex-col bg-cream shadow-lift outline-none",
        side === "left" ? "left-0 border-r border-line data-[state=open]:animate-slide-in-left" : "right-0 border-l border-line data-[state=open]:animate-slide-in-right",
        className,
      )}
      {...props}
    >
      {children}
      <SheetPrimitive.Close className="absolute right-3 top-3 grid h-10 w-10 cursor-pointer place-items-center rounded-full text-ink-muted hover:bg-sand hover:text-ink">
        <X className="h-5 w-5" />
        <span className="sr-only">Close menu</span>
      </SheetPrimitive.Close>
    </SheetPrimitive.Content>
  </SheetPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetTitle, SheetDescription };
