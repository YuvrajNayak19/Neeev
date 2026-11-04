import { useEffect, useState } from "react";

function prefersReducedMotion() {
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Types each line, pauses, deletes it, then moves to the next.
 * - Reduced motion: returns the first line in full and never animates.
 * - Pauses while the tab is hidden, resuming where it left off.
 */
export function useTypewriter(lines: readonly string[], { typeMs = 38, deleteMs = 18, holdMs = 2600, gapMs = 380 } = {}) {
  const [reduced] = useState(prefersReducedMotion);
  const [lineIndex, setLineIndex] = useState(0);
  const [length, setLength] = useState(reduced ? lines[0]?.length ?? 0 : 0);
  const [phase, setPhase] = useState<"typing" | "holding" | "deleting" | "gap">("typing");
  const [hidden, setHidden] = useState(() => typeof document !== "undefined" && document.hidden);

  useEffect(() => {
    const onVisibility = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    if (reduced || hidden || lines.length === 0) return;
    const line = lines[lineIndex] ?? "";
    let delay = typeMs;
    let next: () => void;
    if (phase === "typing") {
      if (length < line.length) next = () => setLength((value) => value + 1);
      else { delay = 0; next = () => setPhase("holding"); }
    } else if (phase === "holding") {
      delay = holdMs;
      next = () => setPhase("deleting");
    } else if (phase === "deleting") {
      delay = deleteMs;
      if (length > 0) next = () => setLength((value) => value - 1);
      else { delay = 0; next = () => setPhase("gap"); }
    } else {
      delay = gapMs;
      next = () => { setLineIndex((value) => (value + 1) % lines.length); setPhase("typing"); };
    }
    const timer = window.setTimeout(next, delay);
    return () => window.clearTimeout(timer);
  }, [reduced, hidden, lines, lineIndex, length, phase, typeMs, deleteMs, holdMs, gapMs]);

  const line = lines[lineIndex] ?? "";
  return { text: line.slice(0, length), animating: !reduced, lineIndex };
}
