import * as React from "react";

import { cn } from "@/lib/utils";
import { fieldBase } from "./input";

const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentProps<"textarea">>(({ className, ...props }, ref) => (
  <textarea className={cn(fieldBase, "min-h-[96px] py-2.5 leading-relaxed", className)} ref={ref} {...props} />
));
Textarea.displayName = "Textarea";

export { Textarea };
