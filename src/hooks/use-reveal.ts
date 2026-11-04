import { useEffect } from "react";

/**
 * Fades in every `.reveal` element on the page the first time it scrolls into view.
 * One shared IntersectionObserver; elements are un-observed after revealing.
 * Reduced-motion users get the content immediately via CSS.
 */
export function useRevealOnScroll(dependency?: unknown) {
  useEffect(() => {
    const elements = Array.from(document.querySelectorAll<HTMLElement>(".reveal:not(.is-visible)"));
    if (!("IntersectionObserver" in window)) {
      elements.forEach((element) => element.classList.add("is-visible"));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 },
    );
    elements.forEach((element) => observer.observe(element));
    return () => observer.disconnect();
  }, [dependency]);
}
