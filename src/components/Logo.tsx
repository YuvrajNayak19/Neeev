import { useId } from "react";
import { cn } from "@/lib/utils";

type LogoTone = "light" | "dark";

/**
 * ClassSync mark: a calendar block holding one filled timetable slot,
 * wrapped at its corner by a sync loop. The block is cut away under the loop
 * (SVG mask), so the mark reads on any background without a halo colour.
 */
export function LogoMark({ className, tone = "light", title }: { className?: string; tone?: LogoTone; title?: string }) {
  const maskId = useId().replace(/:/g, "");
  const stroke = tone === "light" ? "rgb(var(--ink))" : "rgb(var(--cream))";
  const slot = tone === "light" ? "rgb(var(--plum))" : "rgb(var(--blush-200))";
  return (
    <svg viewBox="0 0 40 40" className={cn("h-8 w-8 shrink-0", className)} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <mask id={maskId} maskUnits="userSpaceOnUse">
          <rect width="40" height="40" fill="#fff" />
          <circle cx="29.5" cy="29.5" r="9.6" fill="#000" />
        </mask>
      </defs>
      <g mask={`url(#${maskId})`} fill="none" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="7.5" width="24" height="23.5" rx="6" />
        <path d="M4 14.5h24" />
      </g>
      <path d="M11 4.5v5.5M21 4.5v5.5" stroke={stroke} strokeWidth="2.6" strokeLinecap="round" />
      <rect x="10.5" y="18" width="7.5" height="7.5" rx="2.2" fill={slot} />
      <path d="M23.6 27.3a6.2 6.2 0 1 1 2.6 7.6" fill="none" stroke="rgb(var(--coral))" strokeWidth="2.6" strokeLinecap="round" />
      <path d="M29.8 34l-3.6.9.9 3.6" fill="none" stroke="rgb(var(--coral))" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Logo({ className, tone = "light", markClassName }: { className?: string; tone?: LogoTone; markClassName?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <LogoMark tone={tone} className={markClassName} />
      <span aria-hidden="true" className={cn("font-display text-[1.32rem] font-semibold leading-none tracking-[-0.02em]", tone === "light" ? "text-ink" : "text-cream")}>
        Class<span className={tone === "light" ? "text-plum" : "text-blush-200"}>Sync</span>
      </span>
      <span className="sr-only">ClassSync</span>
    </span>
  );
}
