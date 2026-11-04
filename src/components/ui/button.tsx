import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex cursor-pointer select-none items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-[background-color,color,box-shadow,transform] duration-150 focus-visible:outline-none focus-visible:shadow-focus active:translate-y-px disabled:pointer-events-none disabled:opacity-55 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-plum text-cream shadow-[0_1px_0_rgb(255_255_255/0.18)_inset,0_6px_16px_-6px_rgb(var(--plum)/0.6)] hover:bg-plum-dark",
        destructive: "bg-brick text-cream hover:bg-brick/90",
        outline: "border border-line-strong bg-paper text-ink hover:border-plum/40 hover:bg-plum-50",
        secondary: "bg-peach-100 text-ink hover:bg-peach-200",
        soft: "bg-plum-50 text-plum hover:bg-plum-100",
        ghost: "text-ink-muted hover:bg-sand hover:text-ink",
        link: "rounded-sm px-0 text-plum underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-5 text-sm",
        sm: "h-8 px-3.5 text-[13px]",
        lg: "h-12 px-7 text-[15px]",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
      },
    },
    defaultVariants: { variant: "default", size: "default" },
  },
);

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant, size, asChild = false, ...props }, ref) => {
  const Comp = asChild ? Slot : "button";
  return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
});
Button.displayName = "Button";

export { Button, buttonVariants };
