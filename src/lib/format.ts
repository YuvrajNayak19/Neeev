/** Small, dependency-free formatting helpers shared by the app screens. */
import type { SchoolRequest } from "./api";

export function initials(name: string) {
  return name.replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, "").split(/\s+/).filter(Boolean).map((part) => part[0]).slice(0, 2).join("").toUpperCase() || "?";
}

export function greeting(now = new Date()) {
  const hour = now.getHours();
  return hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
}

export function formatShortDate(iso: string) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });
}

export function timeAgo(iso: string) {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? "yesterday" : `${days} days ago`;
}

export function describeRequest(item: SchoolRequest): string {
  switch (item.type) {
    case "PERIOD_SWAP":
      return `Swap period ${item.periodNumber ?? "?"} with period ${item.otherPeriodNumber ?? "?"}${item.className ? ` for ${item.className}` : ""}`;
    case "EXTRA_PERIOD":
      return `Extra ${item.subject || "class"} period${item.className ? ` with ${item.className}` : ""}${item.periodNumber ? ` in period ${item.periodNumber}` : ""}`;
    case "CONSECUTIVE_PERIODS":
      return `Double ${item.subject || "class"} period${item.className ? ` for ${item.className}` : ""}${item.periodNumber ? ` from period ${item.periodNumber}` : ""}`;
    case "COMBINED_CLASS":
      return `Combine ${item.className || "two sections"}${item.otherClassName ? ` and ${item.otherClassName}` : ""}${item.periodNumber ? ` in period ${item.periodNumber}` : ""}`;
    default:
      return "Full-day leave";
  }
}
