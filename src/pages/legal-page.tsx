import { Link } from "react-router-dom";
import { CONTACT_EMAIL, SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";

type Section = { heading: string; body: string[] };

const CONTENT: Record<"privacy" | "terms", { title: string; intro: string; sections: Section[] }> = {
  privacy: {
    title: "Privacy",
    intro: "This is a plain-language summary of how ClassSync handles school data. It is a placeholder for the demo and will be replaced by a reviewed policy before launch.",
    sections: [
      { heading: "What we store", body: ["School details (name, city, board), class sections, subjects, and the timetable.", "Staff and student accounts: name, email or admission number, role and a securely hashed password.", "Daily records such as absences, substitutions, requests, notices and student concerns."] },
      { heading: "Who can see it", body: ["Each school's data is separate from every other school.", "Administrators see their school's operations. Teachers see their own routine, duties and requests. Students see only their own class.", "Concerns marked as serious (for example bullying or safety) are visible only to senior administrators."] },
      { heading: "What we don't do", body: ["We do not sell school data or show advertising.", "We do not share student information with other schools or third parties."] },
      { heading: "Questions", body: [`Write to ${CONTACT_EMAIL} and we will respond within a few working days.`] },
    ],
  },
  terms: {
    title: "Terms of use",
    intro: "These placeholder terms describe how the ClassSync demo may be used. They will be replaced by reviewed terms before launch.",
    sections: [
      { heading: "The demo", body: ["The sample school is for exploration only. Its data may reset at any time.", "Please don't enter real student or staff information into the demo."] },
      { heading: "Your school's account", body: ["The person who registers a school is responsible for who is given access.", "Keep passwords private and tell us if you think an account has been misused."] },
      { heading: "Fair use", body: ["Don't attempt to access another school's data or disrupt the service."] },
      { heading: "Contact", body: [`For anything about these terms, write to ${CONTACT_EMAIL}.`] },
    ],
  },
};

export function LegalPage({ kind }: { kind: "privacy" | "terms" }) {
  const page = CONTENT[kind];
  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main id="main" className="container max-w-3xl py-14 sm:py-20">
        <p className="eyebrow">ClassSync</p>
        <h1 className="mt-3 font-display text-display-lg font-semibold text-ink">{page.title}</h1>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">{page.intro}</p>
        <div className="mt-10 space-y-8">
          {page.sections.map((section) => (
            <section key={section.heading} className="rounded-2xl border border-line bg-paper p-6 shadow-soft">
              <h2 className="text-lg font-semibold text-ink">{section.heading}</h2>
              <ul className="mt-3 list-disc space-y-2 pl-5 leading-relaxed text-ink-muted marker:text-coral">
                {section.body.map((line) => <li key={line}>{line}</li>)}
              </ul>
            </section>
          ))}
        </div>
        <p className="mt-10 text-sm text-ink-muted">
          See also <Link className="font-semibold text-plum hover:underline" to={kind === "privacy" ? "/terms" : "/privacy"}>{kind === "privacy" ? "Terms of use" : "Privacy"}</Link>.
        </p>
      </main>
      <SiteFooter />
    </div>
  );
}
