import { Instagram, Linkedin, Mail, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";

/** Placeholder contact details — replace before going live. */
export const CONTACT_EMAIL = "hello@classsync.example";
const SOCIAL = [
  { label: "ClassSync on LinkedIn", href: "https://www.linkedin.com/", icon: Linkedin },
  { label: "ClassSync on Instagram", href: "https://www.instagram.com/", icon: Instagram },
  { label: "ClassSync on YouTube", href: "https://www.youtube.com/", icon: Youtube },
];

type FooterLink = { label: string; to: string; external?: boolean };
const COLUMNS: Array<{ title: string; links: FooterLink[] }> = [
  {
    title: "Product",
    links: [
      { label: "Features", to: "/#features" },
      { label: "How it works", to: "/#how-it-works" },
      { label: "Try the demo", to: "/login" },
      { label: "Find a class timetable", to: "/schedule" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About ClassSync", to: "/#about" },
      { label: "Who it's for", to: "/#roles" },
      { label: "Register your school", to: "/register" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Questions & answers", to: "/#faq" },
      { label: "Email us", to: `mailto:${CONTACT_EMAIL}`, external: true },
      { label: "Privacy", to: "/privacy" },
      { label: "Terms", to: "/terms" },
    ],
  },
];

function FooterAnchor({ link }: { link: FooterLink }) {
  const className = "text-sm text-ink-muted transition-colors hover:text-plum";
  if (link.external || link.to.includes("#")) return <a href={link.to} className={className}>{link.label}</a>;
  return <Link to={link.to} className={className}>{link.label}</Link>;
}

export function SiteFooter() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-line bg-peach-50">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.3fr_2fr] md:py-16">
        <div className="max-w-sm">
          <Logo />
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Timetables, substitutions and daily coverage for Indian schools, so every period has a teacher and everyone knows who.
          </p>
          <a href={`mailto:${CONTACT_EMAIL}`} className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-ink hover:text-plum">
            <Mail className="h-4 w-4 text-plum" />
            {CONTACT_EMAIL}
          </a>
          <ul className="mt-5 flex gap-2" aria-label="Social media">
            {SOCIAL.map(({ label, href, icon: Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer" aria-label={label} className="grid h-10 w-10 place-items-center rounded-full border border-line-strong bg-paper text-ink-muted transition-colors hover:border-plum/40 hover:text-plum">
                  <Icon className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
          {COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-ink">{column.title}</h2>
              <ul className="mt-4 space-y-3">
                {column.links.map((link) => <li key={link.label}><FooterAnchor link={link} /></li>)}
              </ul>
            </nav>
          ))}
        </div>
      </div>
      <div className="border-t border-line">
        <div className="container flex flex-col gap-2 py-5 text-xs text-ink-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} ClassSync. All rights reserved.</p>
          <p>Made for Indian schools 🇮🇳</p>
        </div>
      </div>
    </footer>
  );
}
