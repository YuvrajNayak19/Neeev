import { ArrowLeft, Check } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { cn } from "@/lib/utils";

/** Two-panel auth screen: form on the left, a warm themed panel on the right (hidden on phones). */
export function AuthLayout({ title, subtitle, children, aside }: { title: string; subtitle: ReactNode; children: ReactNode; aside?: ReactNode }) {
  return (
    <div className="grid min-h-screen bg-cream lg:grid-cols-[minmax(0,1fr)_minmax(0,0.95fr)]">
      <div className="flex flex-col px-5 py-6 sm:px-10 lg:px-16">
        <div className="flex items-center justify-between">
          <Link to="/" aria-label="ClassSync home" className="rounded-lg"><Logo /></Link>
          <Link to="/" className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-muted hover:bg-sand hover:text-ink">
            <ArrowLeft className="h-4 w-4" />Home
          </Link>
        </div>
        <main id="main" className="mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-center py-10">
          <h1 className="font-display text-display-md font-semibold text-ink">{title}</h1>
          <p className="mt-2 text-ink-muted">{subtitle}</p>
          <div className="mt-8">{children}</div>
        </main>
      </div>
      <aside className="grain relative hidden overflow-hidden bg-peach-100 lg:sticky lg:top-0 lg:block lg:h-screen">{aside ?? <AuthAside />}</aside>
    </div>
  );
}

export function AuthAside() {
  const rows = [
    { time: "8:20", label: "Period 1 · 8-A Maths", state: "Arjun Rao covering", tone: "bg-sage-bg text-sage" },
    { time: "9:00", label: "Period 2 · 9-B English", state: "Fatima Khan covering", tone: "bg-sage-bg text-sage" },
    { time: "9:40", label: "Period 3 · 6-A Science", state: "Priya Menon covering", tone: "bg-sage-bg text-sage" },
  ];
  return (
    <div className="relative flex h-full flex-col justify-between p-12 xl:p-16">
      <div aria-hidden="true" className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-blush-200/70 blur-3xl" />
      <div aria-hidden="true" className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-coral-soft/70 blur-3xl" />
      <div className="relative">
        <p className="eyebrow">A calmer school day</p>
        <blockquote className="mt-5 max-w-md font-display text-[2rem] font-semibold leading-tight text-ink">
          “The first bell rings at 8:20. By then, every classroom already knows who is teaching.”
        </blockquote>
        <p className="mt-4 text-sm text-ink-muted">How ClassSync is meant to feel in your staffroom.</p>
      </div>
      <div className="relative max-w-md rounded-3xl border border-line bg-paper/90 p-5 shadow-lift backdrop-blur" aria-hidden="true">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted">This morning</p>
        <ul className="mt-3 space-y-2.5">
          {rows.map((row) => (
            <li key={row.time} className="flex items-center gap-3">
              <span className="tabular w-10 text-sm font-bold text-ink">{row.time}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">{row.label}</p>
                <p className="text-xs text-ink-muted">{row.state}</p>
              </div>
              <span className={cn("grid h-6 w-6 place-items-center rounded-full", row.tone)}><Check className="h-3.5 w-3.5" /></span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
