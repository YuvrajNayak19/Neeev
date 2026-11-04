import {
  ArrowRight,
  Bell,
  CalendarRange,
  ClipboardCheck,
  GraduationCap,
  LayoutGrid,
  MessageSquareWarning,
  PhoneOff,
  Play,
  School,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Users,
} from "lucide-react";
import { useEffect, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { HeroScene } from "@/components/public/hero-scene";
import {
  AbsencePreview,
  CoverageBoardPreview,
  HeroClashToast,
  HeroCoverageCard,
  HeroNotifyToast,
  NoticePreview,
  RequestsPreview,
  StudentPreview,
  SubstitutePreview,
  TimetablePreview,
} from "@/components/public/previews";
import { CONTACT_EMAIL, SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { useRevealOnScroll } from "@/hooks/use-reveal";
import { useTypewriter } from "@/hooks/use-typewriter";
import { cn } from "@/lib/utils";

const TYPED_LINES = [
  "A teacher calls in sick? The right substitute is suggested in seconds.",
  "Clashes are caught before the timetable reaches the noticeboard.",
  "Every period has a teacher, and everyone knows who.",
] as const;

function Reveal({ children, className, delay = 0, as: Tag = "div" }: { children: ReactNode; className?: string; delay?: number; as?: "div" | "li" | "article" }) {
  return (
    <Tag className={cn("reveal", className)} style={{ ["--reveal-delay" as string]: `${delay}ms` }}>
      {children}
    </Tag>
  );
}

function SectionHeading({ eyebrow, title, intro, align = "left", id }: { eyebrow: string; title: ReactNode; intro?: ReactNode; align?: "left" | "center"; id?: string }) {
  return (
    <Reveal className={cn("max-w-2xl", align === "center" && "mx-auto text-center")}>
      <p className="eyebrow">{eyebrow}</p>
      <h2 id={id} className="mt-3 font-display text-display-lg font-semibold text-ink">{title}</h2>
      {intro ? <p className="mt-4 text-lg leading-relaxed text-ink-muted">{intro}</p> : null}
    </Reveal>
  );
}

/* --------------------------------------------------------------------------- Hero */

function TypedSubline() {
  const { text, animating } = useTypewriter(TYPED_LINES);
  return (
    <div className="mt-6 max-w-xl">
      {/* Screen readers get every line once; the animation is hidden from them. */}
      <p className="sr-only">{TYPED_LINES.join(" ")}</p>
      <p aria-hidden="true" className="relative text-lg leading-relaxed text-ink-muted sm:text-xl">
        {/* Invisible sizer: reserves the height of the longest line so nothing below moves. */}
        <span className="invisible block">{TYPED_LINES.reduce((longest, line) => (line.length > longest.length ? line : longest), "")}</span>
        <span className="absolute inset-0">
          {text}
          {animating ? <span className="ml-0.5 inline-block h-[1.05em] w-[2px] translate-y-[3px] animate-caret bg-plum" /> : null}
        </span>
      </p>
    </div>
  );
}

function Hero() {
  return (
    <section id="top" aria-labelledby="hero-title" className="grain relative -mt-[var(--header-h)] overflow-hidden pt-[var(--header-h)]">
      {/* Illustrated classroom, faded under a cream wash so the text stays crisp. */}
      <div aria-hidden="true" className="absolute inset-0">
        <HeroScene className="absolute inset-0 h-full w-full opacity-70" />
        <div className="absolute inset-0 bg-[linear-gradient(100deg,rgb(var(--cream))_0%,rgb(var(--cream)/0.94)_38%,rgb(var(--cream)/0.6)_70%,rgb(var(--cream)/0.82)_100%)]" />
        <div className="absolute -left-24 top-24 h-72 w-72 rounded-full bg-blush-200/60 blur-3xl" />
        <div className="absolute right-[-6rem] top-40 h-96 w-96 rounded-full bg-peach-200/60 blur-3xl" />
        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-b from-transparent to-cream" />
      </div>

      <div className="container relative grid items-center gap-12 pb-20 pt-10 sm:pt-14 lg:grid-cols-[1.12fr_0.88fr] lg:gap-12 lg:pb-28 lg:pt-20">
        <div>
          <p className="inline-flex flex-wrap items-center gap-2 rounded-full border border-line-strong bg-paper/80 py-1.5 pl-1.5 pr-4 text-[13px] font-medium text-ink shadow-xs backdrop-blur">
            <span className="rounded-full bg-plum px-2.5 py-0.5 text-xs font-semibold text-cream">Built for Indian schools</span>
            <span className="hidden sm:inline">CBSE, ICSE &amp; State boards · </span>Classes 6–12
          </p>
          <h1 id="hero-title" className="mt-6 font-display text-display-xl font-semibold text-ink">
            Every period <span className="marker">covered</span>.<br className="hidden sm:block" /> Every morning <span className="marker marker-blush">calm</span>.
          </h1>
          <TypedSubline />
          <div className="mt-8 flex flex-col gap-3 xs:flex-row">
            <Button asChild size="lg">
              <Link to="/login">
                <Play className="!size-[15px] fill-current" />
                Try the live demo
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <a href="#how-it-works">
                See how it works
                <ArrowRight />
              </a>
            </Button>
          </div>
          <p className="mt-5 text-sm text-ink-muted">No setup needed for the demo · Sign in as a principal, teacher or student</p>
        </div>

        <div className="relative mx-auto mt-6 w-full max-w-[460px] sm:mt-12 lg:mr-0 lg:mt-16">
          <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-gradient-to-br from-peach-100 via-blush-100 to-transparent" aria-hidden="true" />
          <div className="animate-rise-in">
            <HeroCoverageCard />
          </div>
          <div className="absolute -left-8 -top-[4.5rem] hidden rotate-[-2deg] sm:block lg:-left-14"><HeroClashToast /></div>
          <div className="absolute -bottom-[4.25rem] -right-3 hidden rotate-[1.5deg] sm:block"><HeroNotifyToast /></div>
        </div>
      </div>
    </section>
  );
}

/* -------------------------------------------------------------------------- About */

function About() {
  const pillars = [
    { icon: CalendarRange, title: "Plans the week", copy: "Builds a timetable for every class from your teachers and subjects, and refuses to publish one with a clash." },
    { icon: UserCheck, title: "Handles the day", copy: "When someone is absent, it lists who is free that period and who fits best, so cover is arranged in one click." },
    { icon: Bell, title: "Tells everyone", copy: "The substitute sees the duty, the class sees the change, and the office sees what is still uncovered." },
  ];
  return (
    <section id="about" aria-labelledby="about-title" className="relative py-20 sm:py-28">
      <div className="container">
        <div className="grid items-start gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-16">
          <div>
            <SectionHeading
              id="about-title"
              eyebrow="What is ClassSync"
              title={<>The school day runs on a timetable. <span className="text-plum">ClassSync keeps it running.</span></>}
              intro="ClassSync is a simple online register for your school's timetable. Principals and coordinators plan the week, teachers see their day, and students always know which class is next and who is teaching it."
            />
            <Reveal delay={80} className="mt-8 flex flex-wrap gap-2">
              {["Principals & coordinators", "Teachers", "Students"].map((who) => (
                <span key={who} className="rounded-full border border-line-strong bg-paper px-3.5 py-1.5 text-sm font-medium text-ink">{who}</span>
              ))}
            </Reveal>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:mt-10">
            <Reveal className="rounded-3xl border border-line bg-sand/60 p-6 sm:p-7">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-ink-muted"><PhoneOff className="h-4 w-4" />How it usually goes</p>
              <p className="mt-4 font-display text-xl font-semibold leading-snug text-ink">7:40 am. A teacher calls in sick.</p>
              <p className="mt-3 leading-relaxed text-ink-muted">
                The coordinator digs out the paper timetable, rings four colleagues and posts in three WhatsApp groups. Period 1 starts with an empty classroom and a noisy corridor.
              </p>
            </Reveal>
            <Reveal delay={90} className="relative overflow-hidden rounded-3xl border border-plum/15 bg-blush-100 p-6 sm:p-7">
              <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-plum"><Sparkles className="h-4 w-4" />With ClassSync</p>
              <p className="mt-4 font-display text-xl font-semibold leading-snug text-ink">7:42 am. Cover is sorted.</p>
              <p className="mt-3 leading-relaxed text-ink-muted">
                The absence is marked once. ClassSync shows who is free in each period, who teaches the same subject and who has had the lightest day. One tap, and the substitute is told.
              </p>
            </Reveal>
          </div>
        </div>

        <ul className="mt-14 grid gap-4 md:grid-cols-3">
          {pillars.map(({ icon: Icon, title, copy }, index) => (
            <Reveal as="li" key={title} delay={index * 80} className="rounded-3xl border border-line bg-paper p-6 shadow-soft">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-peach-100 text-plum"><Icon className="h-5 w-5" /></span>
              <h3 className="mt-5 text-lg font-semibold text-ink">{title}</h3>
              <p className="mt-2 leading-relaxed text-ink-muted">{copy}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------- Features */

function FeatureRow({ index, eyebrow, title, copy, points, preview, flip }: { index: string; eyebrow: string; title: string; copy: string; points: string[]; preview: ReactNode; flip?: boolean }) {
  return (
    <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
      <Reveal className={cn(flip && "lg:order-2")}>
        <p className="flex items-center gap-3 text-sm font-semibold text-plum">
          <span className="font-display text-2xl font-semibold text-coral">{index}</span>
          {eyebrow}
        </p>
        <h3 className="mt-3 font-display text-display-md font-semibold text-ink">{title}</h3>
        <p className="mt-4 text-lg leading-relaxed text-ink-muted">{copy}</p>
        <ul className="mt-6 space-y-2.5">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-ink">
              <span className="mt-1 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-sage-bg text-sage"><ClipboardCheck className="h-3 w-3" /></span>
              {point}
            </li>
          ))}
        </ul>
      </Reveal>
      <Reveal delay={100} className={cn("relative", flip && "lg:order-1")}>
        <div aria-hidden="true" className={cn("absolute -inset-5 -z-10 rounded-[2.25rem]", flip ? "bg-blush-100" : "bg-peach-100")} />
        <div className="mx-auto max-w-[480px]">{preview}</div>
      </Reveal>
    </div>
  );
}

function BentoTile({ title, copy, icon: Icon, preview, className, delay, horizontal }: { title: string; copy: string; icon: typeof Users; preview: ReactNode; className?: string; delay?: number; horizontal?: boolean }) {
  return (
    <Reveal as="article" delay={delay} className={cn("flex flex-col rounded-3xl border border-line bg-paper p-5 shadow-soft sm:p-6", horizontal && "sm:grid sm:grid-cols-[1fr_auto] sm:items-center sm:gap-6", className)}>
      <div>
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-plum-50 text-plum"><Icon className="h-[18px] w-[18px]" /></span>
          <h3 className="text-lg font-semibold text-ink">{title}</h3>
        </div>
        <p className="mt-2.5 leading-relaxed text-ink-muted">{copy}</p>
      </div>
      <div className={cn("mt-5 flex flex-1 items-end", horizontal && "sm:mt-0")}>
        <div className="w-full">{preview}</div>
      </div>
    </Reveal>
  );
}

function Features() {
  return (
    <section id="features" aria-labelledby="features-title" className="relative bg-paper/60 py-20 sm:py-28">
      <div className="container">
        <SectionHeading
          id="features-title"
          eyebrow="Features"
          title="Made for the way a school day really goes"
          intro="Not a spreadsheet with extra steps. Each part of ClassSync answers a question your office already asks every day."
        />

        <div className="mt-16 space-y-24 sm:mt-20">
          <FeatureRow
            index="01"
            eyebrow="Timetable builder"
            title="A clash-free timetable, before anyone sees it"
            copy="Tell ClassSync your classes, subjects and who teaches what. It builds the week for every section and won't publish a version where a teacher is in two rooms at once."
            points={["Respects TGT and PGT eligibility for each grade", "Keeps daily and weekly teaching loads fair", "Locks lunch and fixed periods in place"]}
            preview={<TimetablePreview />}
          />
          <FeatureRow
            flip
            index="02"
            eyebrow="Substitutions"
            title="The right substitute, suggested in one click"
            copy="For every uncovered period, ClassSync ranks the teachers who are actually free, and says why: same subject, already knows the class, or simply the lightest day."
            points={["Only free, qualified teachers are suggested", "You stay in charge: assign, change or leave as self-study", "The substitute is notified the moment you confirm"]}
            preview={<SubstitutePreview />}
          />
        </div>

        <div className="mt-24 grid gap-4 md:grid-cols-6">
          <BentoTile className="md:col-span-3 lg:col-span-2" icon={UserCheck} title="Absence tracking" copy="Mark a full day or just a few periods, with a reason, in seconds." preview={<AbsencePreview />} />
          <BentoTile className="md:col-span-3 lg:col-span-2" delay={60} icon={LayoutGrid} title="Live coverage board" copy="One glance shows what is covered, waiting or still empty today." preview={<CoverageBoardPreview />} />
          <BentoTile className="md:col-span-3 lg:col-span-2" delay={120} icon={ClipboardCheck} title="Requests & approvals" copy="Teachers ask for leave or a period swap; you approve with one tap." preview={<RequestsPreview />} />
          <BentoTile className="md:col-span-3 lg:col-span-3" icon={MessageSquareWarning} title="Notices & student concerns" copy="Post notices for staff or students, and hear concerns from students, privately, with serious issues handled with care." preview={<NoticePreview />} />
          <BentoTile horizontal className="md:col-span-6 lg:col-span-3" delay={60} icon={GraduationCap} title="A simple student view" copy="Students see today's classes and any substitute, on any phone, with nothing to install." preview={<StudentPreview />} />
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------- How it works */

function HowItWorks() {
  const steps = [
    { title: "Add your school", copy: "Enter classes, subjects and teachers once. Your admin team can do it in an afternoon." },
    { title: "Generate the timetable", copy: "ClassSync builds the week and checks every clash before you publish it." },
    { title: "Mark who's absent", copy: "Each morning, mark absences. Substitute suggestions appear instantly." },
    { title: "Everyone stays in sync", copy: "Teachers see their duties and students see changes, without a single phone call." },
  ];
  return (
    <section id="how-it-works" aria-labelledby="how-title" className="py-20 sm:py-28">
      <div className="container">
        <SectionHeading id="how-title" align="center" eyebrow="How it works" title="From paper register to calm mornings in four steps" />
        <ol className="relative mt-16 grid gap-10 md:grid-cols-4 md:gap-6">
          {/* Connecting line behind the numbers on wider screens */}
          <svg aria-hidden="true" className="absolute left-[12%] right-[12%] top-7 hidden h-4 md:block" preserveAspectRatio="none" viewBox="0 0 100 4">
            <path d="M0 2 Q 25 0 50 2 T 100 2" fill="none" stroke="rgb(var(--coral))" strokeWidth="0.6" strokeDasharray="1.6 1.6" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 2 }} />
          </svg>
          {steps.map((step, index) => (
            <Reveal as="li" key={step.title} delay={index * 90} className="relative flex gap-5 md:flex-col md:items-center md:gap-0 md:text-center">
              {index < steps.length - 1 ? <span aria-hidden="true" className="absolute left-7 top-16 h-[calc(100%-2rem)] w-px border-l-2 border-dashed border-coral/60 md:hidden" /> : null}
              <span className="relative z-10 grid h-14 w-14 shrink-0 place-items-center rounded-full border-2 border-coral bg-cream font-display text-xl font-semibold text-plum shadow-soft">{index + 1}</span>
              <div className="md:mt-6">
                <h3 className="text-lg font-semibold text-ink">{step.title}</h3>
                <p className="mt-2 leading-relaxed text-ink-muted md:mx-auto md:max-w-[15rem]">{step.copy}</p>
              </div>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* --------------------------------------------------------------------------- Roles */

function Roles() {
  const roles = [
    { icon: School, title: "Principals & admin office", tone: "bg-plum text-cream", card: "bg-paper", points: ["Build and publish the timetable", "Mark absences and assign cover", "Approve leave and period swaps", "Manage teacher and student accounts"] },
    { icon: Users, title: "Teachers", tone: "bg-coral text-ink", card: "bg-peach-50", points: ["See today's classes and rooms", "Get notified of substitution duties", "Ask for leave or a swap from a phone", "Check the weekly routine any time"] },
    { icon: GraduationCap, title: "Students", tone: "bg-blush-300 text-ink", card: "bg-blush-100", points: ["Know the next class and teacher", "See when a substitute is coming", "View the whole week's timetable", "Raise a concern privately"] },
  ];
  return (
    <section id="roles" aria-labelledby="roles-title" className="bg-paper/60 py-20 sm:py-28">
      <div className="container">
        <SectionHeading id="roles-title" eyebrow="Who it's for" title="One school, three simple views" intro="Everyone signs in to a screen made for them. Nobody sees more than they need." />
        <div className="mt-14 grid gap-5 lg:grid-cols-3">
          {roles.map(({ icon: Icon, title, tone, card, points }, index) => (
            <Reveal as="article" key={title} delay={index * 90} className={cn("rounded-3xl border border-line p-7 shadow-soft", card)}>
              <span className={cn("grid h-12 w-12 place-items-center rounded-2xl", tone)}><Icon className="h-5 w-5" /></span>
              <h3 className="mt-5 font-display text-2xl font-semibold text-ink">{title}</h3>
              <ul className="mt-5 space-y-3">
                {points.map((point) => (
                  <li key={point} className="flex items-start gap-3 text-ink">
                    <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-plum" />
                    {point}
                  </li>
                ))}
              </ul>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ----------------------------------------------------------------------------- FAQ */

const FAQS = [
  { q: "Do we need technical staff to use ClassSync?", a: "No. If your office can use WhatsApp and fill in a form, they can use ClassSync. Everything works in a normal web browser on a computer or phone, with nothing to install." },
  { q: "How does ClassSync choose a substitute?", a: "It only suggests teachers who are free in that period, present today, and eligible for that grade (for example, TGT for up to class 10). Among them it prefers someone who teaches the same subject, then someone who already teaches that class, then whoever has had the lightest day. You always make the final choice." },
  { q: "Can we keep our current timetable?", a: "In this version you enter your classes, subjects and which teacher takes which class, and ClassSync generates a clash-free timetable from that. Importing an existing spreadsheet is planned for a later version." },
  { q: "Does it work on mobile phones?", a: "Yes. Teachers can check duties and send requests from a phone, and students can open their class timetable on any phone browser." },
  { q: "What can students see?", a: "Only their own class: today's periods, the weekly timetable and any substitute teacher. They can't see other classes' details, teacher contact numbers or staff requests." },
  { q: "Is our school's data kept private?", a: "Each school's data is kept separate, and every person only sees what their role allows. Student concerns about serious matters like bullying are visible only to senior administrators." },
  { q: "What happens if no teacher is free?", a: "ClassSync tells you clearly that the period is uncovered, so it never slips through. You can assign someone manually or mark the class for supervised self-study." },
  { q: "How do we get started?", a: <>Try the live demo with the sample school first. When you're ready, register your school, or write to us at <a className="font-semibold text-plum underline-offset-4 hover:underline" href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a> and we'll help you set up.</> },
];

function Faq() {
  return (
    <section id="faq" aria-labelledby="faq-title" className="py-20 sm:py-28">
      <div className="container grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
        <div>
          <SectionHeading id="faq-title" eyebrow="FAQ" title="Questions schools ask us" intro="Straight answers for principals, coordinators and office staff." />
        </div>
        <Reveal>
          <Accordion type="single" collapsible className="border-t border-line">
            {FAQS.map((item, index) => (
              <AccordionItem key={item.q} value={`faq-${index}`}>
                <AccordionTrigger>{item.q}</AccordionTrigger>
                <AccordionContent>{item.a}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </Reveal>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------------ CTA band */

function FinalCta() {
  return (
    <section aria-labelledby="cta-title" className="pb-20 sm:pb-28">
      <div className="container">
        <Reveal className="grain relative overflow-hidden rounded-[2rem] bg-plum px-6 py-14 text-center sm:px-12 sm:py-16">
          <div aria-hidden="true" className="absolute -left-16 -top-20 h-64 w-64 rounded-full bg-coral/30 blur-3xl" />
          <div aria-hidden="true" className="absolute -bottom-24 right-0 h-72 w-72 rounded-full bg-blush-300/30 blur-3xl" />
          <div className="relative">
            <h2 id="cta-title" className="mx-auto max-w-2xl font-display text-display-lg font-semibold text-cream">Tomorrow's first period could already be covered.</h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-plum-100">Explore the sample school as a principal, teacher or student. It takes two minutes.</p>
            <div className="mt-8 flex flex-col justify-center gap-3 xs:flex-row">
              <Button asChild size="lg" className="bg-cream text-plum shadow-none hover:bg-peach-100">
                <Link to="/login">Try the live demo</Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-cream/40 bg-transparent text-cream hover:border-cream hover:bg-cream/10">
                <Link to="/register">Register your school</Link>
              </Button>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

export function LandingPage() {
  const location = useLocation();
  useRevealOnScroll();

  // Arriving from another page with /#section: scroll there once rendered.
  useEffect(() => {
    if (!location.hash) return;
    const target = document.getElementById(location.hash.slice(1));
    if (target) requestAnimationFrame(() => target.scrollIntoView());
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader onLanding />
      <main id="main">
        <Hero />
        <About />
        <Features />
        <HowItWorks />
        <Roles />
        <Faq />
        <FinalCta />
      </main>
      <SiteFooter />
    </div>
  );
}
