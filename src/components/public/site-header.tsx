import { Menu } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const SECTIONS = [
  { id: "top", label: "Home" },
  { id: "about", label: "About" },
  { id: "features", label: "Features" },
  { id: "how-it-works", label: "How it works" },
  { id: "faq", label: "FAQ" },
] as const;

/** Highlights the nav item for the section currently in view. */
function useActiveSection(enabled: boolean) {
  const [active, setActive] = useState<string>("top");
  useEffect(() => {
    if (!enabled || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-35% 0px -55% 0px", threshold: [0, 0.25, 0.5] },
    );
    SECTIONS.forEach(({ id }) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [enabled]);
  return active;
}

export function SiteHeader({ onLanding = false }: { onLanding?: boolean }) {
  const [scrolled, setScrolled] = useState(false);
  const active = useActiveSection(onLanding);
  const href = (id: string) => (onLanding ? `#${id}` : `/#${id}`);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={cn("sticky top-0 z-40 transition-[background-color,box-shadow,border-color] duration-200", scrolled ? "border-b border-line bg-cream/90 shadow-xs backdrop-blur-md" : "border-b border-transparent bg-cream/0")}>
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-full focus:bg-plum focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-cream">
        Skip to content
      </a>
      <div className="container flex h-[var(--header-h)] items-center justify-between gap-4">
        <Link to="/" aria-label="ClassSync home" className="rounded-lg">
          <Logo />
        </Link>

        <nav aria-label="Main" className="hidden items-center gap-1 lg:flex">
          {SECTIONS.map((section) => (
            <a
              key={section.id}
              href={href(section.id)}
              aria-current={onLanding && active === section.id ? "true" : undefined}
              className={cn(
                "rounded-full px-3.5 py-2 text-sm font-semibold transition-colors",
                onLanding && active === section.id ? "bg-peach-100 text-ink" : "text-ink-muted hover:bg-sand hover:text-ink",
              )}
            >
              {section.label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <Button asChild variant="ghost" className="hidden sm:inline-flex">
            <Link to="/login">Log in</Link>
          </Button>
          <Button asChild className="hidden xs:inline-flex">
            <Link to="/register">Get started</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" className="lg:hidden" aria-label="Open menu">
                <Menu className="!size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="px-5 pb-6 pt-5">
              <SheetTitle className="sr-only">Menu</SheetTitle>
              <SheetDescription className="sr-only">Jump to a section or sign in</SheetDescription>
              <Logo />
              <nav aria-label="Mobile" className="mt-8 flex flex-col gap-1">
                {SECTIONS.map((section) => (
                  <SheetClose asChild key={section.id}>
                    <a href={href(section.id)} className="rounded-xl px-3 py-3 font-display text-xl font-semibold text-ink hover:bg-peach-100">
                      {section.label}
                    </a>
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-auto grid gap-2">
                <Button asChild variant="outline" size="lg"><Link to="/login">Log in</Link></Button>
                <Button asChild size="lg"><Link to="/register">Get started</Link></Button>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
