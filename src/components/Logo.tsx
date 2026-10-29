import { CalendarCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "size-7",
  md: "size-8",
  lg: "size-10",
};

export function Logo({ className, size = "md" }: LogoProps) {
  return (
    <span
      aria-label="Timely"
      className={cn(
        "grid shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground",
        sizes[size],
        className,
      )}
    >
      <CalendarCheck aria-hidden="true" className="size-[62%]" strokeWidth={2.4} />
    </span>
  );
}
