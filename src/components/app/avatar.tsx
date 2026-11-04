import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

const TONES = ["bg-peach-200 text-ink", "bg-blush-200 text-ink", "bg-plum-100 text-plum", "bg-sage-bg text-sage", "bg-honey-bg text-honey", "bg-subject-math-bg text-subject-math"];

/** Initials avatar with a stable colour per name. */
export function Avatar({ name, size = "md", className }: { name: string; size?: "sm" | "md" | "lg"; className?: string }) {
  const tone = TONES[[...name].reduce((sum, char) => sum + char.charCodeAt(0), 0) % TONES.length];
  const sizes = { sm: "h-8 w-8 text-[11px]", md: "h-10 w-10 text-xs", lg: "h-14 w-14 text-base" };
  return (
    <span aria-hidden="true" className={cn("grid shrink-0 place-items-center rounded-full font-bold", tone, sizes[size], className)}>
      {initials(name)}
    </span>
  );
}
