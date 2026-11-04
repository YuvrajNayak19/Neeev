import * as React from "react";

import { cn } from "@/lib/utils";

export const fieldBase =
  "w-full rounded-xl border border-line-strong bg-paper px-3.5 text-[15px] text-ink shadow-xs transition-[border-color,box-shadow] placeholder:text-ink-soft hover:border-ink-soft/60 focus-visible:border-plum focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-plum/15 disabled:cursor-not-allowed disabled:bg-sand disabled:opacity-70 aria-[invalid=true]:border-brick aria-[invalid=true]:focus-visible:ring-brick/15";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(({ className, type, ...props }, ref) => (
  <input type={type} className={cn(fieldBase, "h-11", className)} ref={ref} {...props} />
));
Input.displayName = "Input";

export { Input };
