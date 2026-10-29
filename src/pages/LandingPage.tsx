import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { Link } from "@tanstack/react-router";
import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useReducedMotion,
  useScroll,
  type MotionStyle,
  type Variants,
} from "framer-motion";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Coffee,
  Copy,
  ListChecks,
  MessageSquare,
  Plus,
  Scale,
  Sparkles,
  Users,
  Wand2,
  Wrench,
} from "lucide-react";
import { Logo } from "@/components/Logo";

/* ------------------------------------------------------------------ */
/*  Tokens & shared styles                                             */
/* ------------------------------------------------------------------ */

const COLORS = {
  bg: "#FDF4DC",
  primary: "#1E3A8A",
  text: "#1A1A1A",
  body: "rgba(26, 26, 26, 0.7)",
};

const EMAIL = "developerstimely@gmail.com";

const COOKIE_KEY = "cookie_consent";

const GLASS: CSSProperties = {
  background: "transparent",
  borderRadius: "0",
  border: "1px solid #1A1A1A",
  boxShadow: "none",
};

const NAV_SPRING = { type: "spring" as const, stiffness: 300, damping: 30 };
const VIEWPORT = { once: true, margin: "-60px" } as const;
const EDITORIAL_EASE = [0.25, 0.1, 0.25, 1] as const;

// The global stylesheet scales every button/link on hover; opt out where it hurts layout.
const NO_SCALE: CSSProperties = { transform: "none" };

const PAGE_CSS = `
@import url("https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@300;400;500;700&display=swap");
.landing-page {
  color: #1A1A1A;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
}
.landing-page h1,
.landing-page h2,
.landing-page h3,
.landing-page h4,
.landing-page h5,
.landing-page h6 {
  color: #1A1A1A;
  font-family: 'JetBrains Mono', 'Courier New', monospace;
  font-weight: 400;
}
.landing-page h1 {
  line-height: 1.08;
  letter-spacing: -0.02em;
}
.landing-page h2 {
  font-size: 48px;
  line-height: 1.15;
}
.landing-page h3 { font-size: 26px; }
.landing-page p,
.landing-page blockquote { color: rgba(26, 26, 26, 0.7); }
.landing-page .text-white { color: #1A1A1A; }
.landing-page a {
  text-decoration: none !important;
  transition: color 0.15s ease, text-decoration-color 0.15s ease !important;
}
.landing-page a:hover {
  color: #1A1A1A !important;
  text-decoration: underline !important;
}
.landing-page button {
  transition: opacity 0.15s ease !important;
}
.landing-page button:hover { opacity: 0.85; }
.landing-page a:hover,
.landing-page button:hover,
.landing-page [role="button"]:hover { transform: none !important; }
@keyframes feature-card-scroll {
  to { transform: translateX(-50%); }
}
.feature-marquee-track {
  animation: feature-card-scroll 20s linear infinite;
}
.feature-marquee:hover .feature-marquee-track {
  animation-play-state: paused;
}
@media (prefers-reduced-motion: reduce) {
  .feature-marquee-track { animation: none; }
}
`;

/* ------------------------------------------------------------------ */
/*  Content                                                            */
/* ------------------------------------------------------------------ */

const TICKER_FEATURES =
  "Substitution plans in 90 seconds • Fair 4-level assignment • Same-subject matching first • Excel timetable import • One-click override • Print-ready cover schedules • Student portal • No teacher accounts • Free for government schools •";

const PROBLEMS = [
  {
    icon: Clock3,
    title: "Done in minutes without any hassle",
    copy: "From first absence to finished plan. Before the staffroom gets loud.",
  },
  {
    icon: Scale,
    title: "Nobody gets overloaded",
    copy: "The algorithm tracks who's covered what. Every teacher gets a fair share.",
  },
  {
    icon: Coffee,
    title: "Your timetable, imported",
    copy: "Upload your .xlsx file. Timely reads it and gets to work.",
  },
];

const BENEFITS = [
  {
    icon: Clock3,
    stat: "Print-ready, always",
    copy: "Clean output, formatted for the notice board.",
  },
  {
    icon: Scale,
    stat: "Your data stays yours",
    copy: "Tied to your account. Nobody else can see it.",
  },
  {
    icon: Sparkles,
    stat: "Any device, any browser",
    copy: "No app to install. Open the link and start.",
  },
];

const STEPS = [
  {
    number: "01",
    icon: ListChecks,
    title: "Mark who's absent",
    copy: "Takes under a minute. Pick the teachers and the periods they're missing.",
  },
  {
    number: "02",
    icon: Wand2,
    title: "Get the plan",
    copy: "Timely assigns substitutes automatically. No favourites, no overloading the same person twice.",
  },
  {
    number: "03",
    icon: CheckCircle2,
    title: "Print and walk away",
    copy: "One tap. Ready for the notice board.",
  },
];

const FAQS = [
  {
    question: "Do teachers need to create accounts?",
    answer:
      "No. Only the admin logs in. Teachers and students never need to touch the app — they just receive the printed or shared plan.",
  },
  {
    question: "Is our school's data secure?",
    answer:
      "Yes. Timely runs in your browser and your data is stored securely in the cloud, tied to your school account only. No other school can access your data.",
  },
  {
    question: "What if I want to override a substitution?",
    answer:
      "Every assignment can be manually overridden with one click using the Override drawer in the dashboard. You're always in control.",
  },
  {
    question: "Is Timely free for government schools?",
    answer:
      "Yes. Timely is free for government schools. No per-teacher fees, no seat charges, no hidden costs.",
  },
  {
    question: "How does the fairness algorithm work?",
    answer:
      "Timely assigns substitutes using a 4-level priority: same subject first, then eligible category (PGT covers TGT/PRT), then the teacher with the lowest substitution load today, then alphabetical as a tiebreaker. No manual guesswork.",
  },
  {
    question: "Can students see their substitution plan?",
    answer:
      "Yes. There's a public student portal protected by a school password set by the admin. Students can check their plan without creating any account.",
  },
];

/* ------------------------------------------------------------------ */
/*  Motion helpers                                                     */
/* ------------------------------------------------------------------ */

function makeReveal(reduced: boolean): Variants {
  return {
    hidden: { opacity: reduced ? 1 : 0, y: reduced ? 0 : 16 },
    visible: {
      opacity: 1,
      y: 0,
      transition: reduced ? { duration: 0 } : { duration: 0.5, ease: EDITORIAL_EASE },
    },
  };
}

function makeStagger(reduced: boolean, gap = 0.08): Variants {
  return {
    hidden: {},
    visible: { transition: { staggerChildren: reduced ? 0 : gap } },
  };
}

/* ------------------------------------------------------------------ */
/*  Navbar — contracts into a floating pill on scroll                  */
/* ------------------------------------------------------------------ */

const navLinkClass =
  "whitespace-nowrap rounded-lg px-1 py-1 text-[11px] transition-colors min-[400px]:px-2 min-[400px]:text-xs sm:px-3 sm:py-1.5 sm:text-sm";

function Navbar() {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [vw, setVw] = useState(1280);

  useMotionValueEvent(scrollY, "change", (latest) => setScrolled(latest >= 50));

  useEffect(() => {
    const update = () => setVw(window.innerWidth);
    setScrolled(scrollY.get() >= 50);
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [scrollY]);

  const mobile = vw < 640;

  const expanded = {
    paddingTop: 16,
    paddingBottom: 16,
    paddingLeft: mobile ? 20 : 40,
    paddingRight: mobile ? 20 : 40,
    borderRadius: 0,
    background: "rgba(255, 255, 255, 0)",
    backdropFilter: "blur(0px)",
    WebkitBackdropFilter: "blur(0px)",
    border: "1px solid transparent",
    boxShadow: "0 4px 30px rgba(0, 0, 0, 0)",
  };

  const contracted = {
    paddingTop: 10,
    paddingBottom: 10,
    paddingLeft: mobile ? 16 : 24,
    paddingRight: mobile ? 16 : 24,
    borderRadius: 999,
    background: "rgba(253, 244, 220, 0.82)",
    backdropFilter: "blur(14px)",
    WebkitBackdropFilter: "blur(14px)",
    border: "1px solid rgba(26, 26, 26, 0.22)",
    boxShadow: "0 10px 28px rgba(26, 26, 26, 0.08)",
  };

  return (
    <motion.div
      initial={false}
      animate={{ top: scrolled ? 12 : 0 }}
      transition={NAV_SPRING}
      className="pointer-events-none fixed inset-x-0 z-50 flex justify-center"
    >
      <motion.header
        layout
        initial={false}
        animate={scrolled ? contracted : expanded}
        transition={NAV_SPRING}
        className="pointer-events-auto flex items-center justify-between"
        style={{
          boxSizing: "border-box",
          width: scrolled ? "max-content" : "100%",
          maxWidth: scrolled ? "calc(100vw - 24px)" : "100%",
          gap: mobile ? 12 : 24,
          margin: "0 auto",
        }}
      >
        <Link
          to="/"
          aria-label="Timely home"
          className="flex items-center gap-2 text-white"
          style={NO_SCALE}
        >
          <Logo size="sm" />
          <span className="hidden text-base font-semibold tracking-tight min-[400px]:inline">
            Timely
          </span>
        </Link>
        <nav className="flex items-center gap-0.5 sm:gap-1" aria-label="Main navigation">
          <Link to="/student" className={navLinkClass} style={{ color: COLORS.text, ...NO_SCALE }}>
            Student portal
          </Link>
          <Link
            to="/auth"
            search={{ tab: "login" }}
            className={navLinkClass}
            style={{ color: COLORS.text, ...NO_SCALE }}
          >
            Log in
          </Link>
          <Link
            to="/auth"
            search={{ tab: "signup" }}
            className="whitespace-nowrap rounded-lg border px-2 py-1 text-[11px] font-normal min-[400px]:px-2.5 min-[400px]:text-xs sm:px-3.5 sm:py-1.5 sm:text-sm"
            style={{
              background: "transparent",
              borderColor: COLORS.text,
              color: COLORS.text,
              ...NO_SCALE,
            }}
          >
            Sign up
          </Link>
        </nav>
      </motion.header>
    </motion.div>
  );
}
/* ------------------------------------------------------------------ */
/*  Hero                                                               */
/* ------------------------------------------------------------------ */

function Hero({ reduced }: { reduced: boolean }) {
  return (
    <section className="relative flex min-h-[100svh] flex-col">
      <div className="relative z-10 flex flex-1 items-center justify-center px-5 pb-20 pt-20 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: reduced ? 0 : 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduced ? 0 : 0.6 }}
          className="mx-auto w-full max-w-6xl text-center"
        >
          <div className="flex justify-center">
            <span
              className="inline-flex items-center gap-2 text-xs font-medium uppercase tracking-[0.12em] sm:text-sm"
              style={{
                color: COLORS.body,
              }}
            >
              <Users className="size-5" style={{ color: COLORS.primary }} aria-hidden="true" />
              SUBSTITUTE MANAGEMENT MADE EASIER
            </span>
          </div>

          <h1
            className="mx-auto mt-8 max-w-5xl uppercase"
            style={{
              fontSize: "clamp(2.5rem, 6vw, 5rem)",
              fontWeight: 300,
              letterSpacing: "-0.02em",
              lineHeight: 1.08,
              color: COLORS.text,
            }}
          >
            FAIR SUBSTITUTION PLANS. GENERATED IN MINUTES.
          </h1>

          <p
            className="mx-auto mt-6 text-base leading-relaxed sm:text-lg 2xl:text-xl"
            style={{ maxWidth: 560, color: COLORS.body }}
          >
            Mark absences. Timely generates a conflict-free, fair substitution plan instantly — no
            manual coordination required.
          </p>

          <div className="mt-10 flex justify-center">
            <Link
              to="/app"
              className="inline-flex items-center gap-2 px-7 py-3.5 text-sm font-semibold text-white"
              style={{
                background: COLORS.primary,
                color: "#FFFFFF",
                borderRadius: 8,
                ...NO_SCALE,
              }}
            >
              Open the dashboard <ArrowRight className="size-4" />
            </Link>
          </div>
        </motion.div>
      </div>
      <LogoTicker />
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Logo ticker                                                        */
/* ------------------------------------------------------------------ */

function LogoTicker() {
  return (
    <div
      aria-label="Key features"
      role="region"
      className="relative overflow-hidden py-8 text-center text-sm font-normal tracking-wide sm:py-10 sm:text-base"
      style={{ color: COLORS.body }}
    >
      {TICKER_FEATURES}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section heading                                                    */
/* ------------------------------------------------------------------ */

function SectionHeading({
  eyebrow,
  title,
  copy,
  variants,
}: {
  eyebrow: string;
  title: string;
  copy?: string;
  variants: Variants;
}) {
  return (
    <motion.div
      variants={variants}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      className="mx-auto max-w-2xl text-center"
    >
      <span
        className="text-xs font-normal uppercase tracking-[0.2em]"
        style={{ color: COLORS.body }}
      >
        {eyebrow}
      </span>
      <h2 className="mt-4 text-3xl leading-tight tracking-tight sm:text-5xl">{title}</h2>
      {copy && (
        <p className="mt-4 text-base leading-relaxed" style={{ color: COLORS.body }}>
          {copy}
        </p>
      )}
    </motion.div>
  );
}

/* ------------------------------------------------------------------ */
/*  Feature cards (why it matters + benefits)                          */
/* ------------------------------------------------------------------ */

function FeatureCard({
  icon: Icon,
  title,
  copy,
  variants,
}: {
  icon: typeof Clock3;
  title: string;
  copy: string;
  variants: Variants;
}) {
  return (
    <motion.article
      variants={variants}
      data-lift
      style={
        {
          ...GLASS,
          width: 280,
          flexShrink: 0,
          padding: "32px 24px",
        } as MotionStyle
      }
    >
      <Icon className="size-6" style={{ color: COLORS.primary }} aria-hidden="true" />
      <h3 className="mt-5" style={{ fontSize: 16, fontWeight: 700, color: COLORS.text }}>
        {title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed" style={{ color: COLORS.body }}>
        {copy}
      </p>
    </motion.article>
  );
}

function Features({ reduced }: { reduced: boolean }) {
  const reveal = makeReveal(reduced);
  const stagger = makeStagger(reduced);
  const cards = [
    ...PROBLEMS.map((p) => ({
      key: p.title,
      icon: p.icon,
      title: p.title,
      copy: p.copy,
    })),
    ...BENEFITS.map((b) => ({
      key: b.stat,
      icon: b.icon,
      title: b.stat,
      copy: b.copy,
    })),
  ];

  return (
    <section id="why-it-matters" className="py-20">
      <div className="mx-auto max-w-6xl px-5 sm:px-8">
        <SectionHeading
          eyebrow="Why this matters"
          title="Designed for School Administration"
          copy="Unplanned absences create administrative burden and scheduling conflicts. Timely automates the substitution process — ensuring every assignment is fair, transparent, and audit-ready."
          variants={reveal}
        />
      </div>
      <div
        className="feature-marquee relative mt-12 w-full overflow-hidden"
        style={{ paddingLeft: "max(20px, calc((100vw - 72rem) / 2 + 32px))" }}
      >
        <motion.div
          className="feature-marquee-track flex w-max items-start"
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          style={reduced ? { animation: "none" } : undefined}
        >
          {[false, true].map((duplicate) => (
            <div
              key={duplicate ? "duplicate" : "original"}
              aria-hidden={duplicate || undefined}
              className="flex flex-none items-start gap-6 py-10 pr-6"
            >
              {cards.map((card) => (
                <FeatureCard
                  key={`${duplicate ? "duplicate" : "original"}-${card.key}`}
                  icon={card.icon}
                  title={card.title}
                  copy={card.copy}
                  variants={reveal}
                />
              ))}
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
/* ------------------------------------------------------------------ */
/*  How it works                                                       */
/* ------------------------------------------------------------------ */

function HowItWorks({ reduced }: { reduced: boolean }) {
  const reveal = makeReveal(reduced);
  const stagger = makeStagger(reduced);

  return (
    <section id="how-it-works" className="scroll-mt-20 px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          eyebrow="How it works"
          title="Three Steps to a Complete Substitution Plan"
          variants={reveal}
        />
        <motion.ol
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="mt-16 grid list-none gap-10 p-0 md:grid-cols-3 md:gap-6"
        >
          {STEPS.map((step) => (
            <motion.li key={step.number} variants={reveal} className="relative pt-10">
              <span
                aria-hidden="true"
                className="pointer-events-none absolute -top-2 left-2 select-none font-bold leading-none"
                style={{ fontSize: 120, color: "rgba(15, 23, 42, 0.04)" }}
              >
                {step.number}
              </span>
              <div data-lift style={GLASS} className="relative p-7">
                <step.icon
                  className="size-5"
                  style={{ color: COLORS.primary }}
                  aria-hidden="true"
                />
                <h3 className="mt-5 text-xl">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed" style={{ color: COLORS.body }}>
                  {step.copy}
                </p>
              </div>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Testimonial + support pills                                        */
/* ------------------------------------------------------------------ */

function SupportOptions() {
  const [open, setOpen] = useState<"feature" | "support" | null>(null);
  const [copied, setCopied] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const copyEmail = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }, []);

  return (
    <div ref={ref} className="mt-6 flex flex-wrap items-start justify-center gap-3">
      {(["feature", "support"] as const).map((type) => {
        const isOpen = open === type;
        return (
          <div
            key={type}
            data-lift
            style={{
              ...GLASS,
              overflow: "hidden",
            }}
          >
            <button
              type="button"
              onClick={() => setOpen(isOpen ? null : type)}
              aria-expanded={isOpen}
              className="px-5 py-2.5 text-sm font-normal"
              style={NO_SCALE}
            >
              <span className="inline-flex items-center gap-2">
                {type === "feature" ? (
                  <MessageSquare
                    className="size-5"
                    style={{ color: COLORS.primary }}
                    aria-hidden="true"
                  />
                ) : (
                  <Wrench className="size-5" style={{ color: COLORS.primary }} aria-hidden="true" />
                )}
                {type === "feature" ? "Suggest a Feature" : "Get Support"}
              </span>
            </button>
            {isOpen && (
              <div
                className="flex items-center gap-2 overflow-hidden whitespace-nowrap px-5 pb-3 text-xs"
                style={{ color: COLORS.body }}
              >
                <span>{EMAIL}</span>
                <button
                  type="button"
                  onClick={copyEmail}
                  aria-label="Copy support email"
                  className="grid size-7 flex-none place-items-center rounded-lg"
                  style={{
                    background: "transparent",
                    color: COLORS.primary,
                    ...NO_SCALE,
                  }}
                >
                  <Copy className="size-3.5" />
                </button>
                {copied && <span style={{ color: COLORS.text }}>Copied!</span>}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

function Testimonial({ reduced }: { reduced: boolean }) {
  const reveal = makeReveal(reduced);
  return (
    <section className="px-5 py-20 sm:px-8">
      <motion.div
        variants={reveal}
        initial="hidden"
        whileInView="visible"
        viewport={VIEWPORT}
        className="mx-auto max-w-3xl"
      >
        <figure data-lift style={GLASS} className="m-0 px-8 py-12 text-center sm:px-14">
          <div
            aria-hidden="true"
            className="leading-none"
            style={{ fontSize: "4rem", color: COLORS.body }}
          >
            “
          </div>
          <blockquote className="m-0 text-2xl font-normal leading-snug tracking-tight sm:text-3xl">
            What previously required 30 minutes of manual coordination now takes minutes. The
            fairness logic ensures no teacher is overburdened.
          </blockquote>
        </figure>
        <SupportOptions />
      </motion.div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Pricing                                                            */
/* ------------------------------------------------------------------ */

const BASIC_FEATURES = [
  "Absence logging by period",
  "Automated substitution generator",
  "Fair priority-based assignment",
  "Teacher roster management",
  "Same-subject matching first",
];

const PRO_FEATURES = [
  "Public schedule board",
  "Manual override per assignment",
  "Download schedule as PDF/CSV",
  "Schedule history & logs",
];

function Pricing() {
  const mutedStyle = { color: "rgba(26, 26, 26, 0.6)" };
  const featureStyle: CSSProperties = {
    display: "flex",
    alignItems: "flex-start",
    gap: 10,
    fontSize: 13,
    lineHeight: 1.6,
    color: COLORS.text,
  };
  const buttonStyle: CSSProperties = {
    display: "inline-flex",
    minHeight: 44,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    border: "1px solid rgba(0, 0, 0, 0.65)",
    borderRadius: 4,
    background: "transparent",
    padding: "10px 16px",
    color: COLORS.text,
    fontSize: 13,
    fontWeight: 600,
    ...NO_SCALE,
  };

  return (
    <section id="pricing" className="px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-5xl">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <span className="text-[11px] font-normal uppercase tracking-[0.2em]" style={mutedStyle}>
            Pricing
          </span>
          <h2 className="mt-4 text-3xl leading-tight tracking-tight sm:text-5xl">
            Simple, school-friendly pricing.
          </h2>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <article
            className="flex flex-col"
            style={{
              background: COLORS.bg,
              border: "1px solid rgba(0, 0, 0, 0.14)",
              borderRadius: 4,
              padding: "36px 32px",
            }}
          >
            <p className="text-[11px] font-normal uppercase tracking-[0.16em]" style={mutedStyle}>
              Basic
            </p>
            <p className="mt-4 text-5xl font-bold leading-none" style={{ color: COLORS.text }}>
              ₹409
            </p>
            <p className="mt-2 text-xs" style={mutedStyle}>
              per school / month
            </p>
            <hr className="my-6 border-0" style={{ borderTop: "1px solid rgba(0, 0, 0, 0.14)" }} />
            <ul className="mb-8 flex flex-1 flex-col gap-3">
              {BASIC_FEATURES.map((feature) => (
                <li key={feature} style={featureStyle}>
                  <CheckCircle2 className="mt-0.5 size-4 flex-none" aria-hidden="true" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link to="/auth" search={{ tab: "signup" }} style={buttonStyle}>
              Get started
            </Link>
          </article>

          <article
            className="relative flex flex-col"
            style={{
              background: COLORS.bg,
              border: "1px solid rgba(0, 0, 0, 0.14)",
              borderRadius: 4,
              padding: "36px 32px",
            }}
          >
            <span
              className="absolute -top-3 left-8 px-3 py-1 text-[10px] font-semibold"
              style={{
                border: "1px solid rgba(0, 0, 0, 0.14)",
                borderRadius: 999,
                background: COLORS.bg,
                color: COLORS.text,
              }}
            >
              Most popular
            </span>
            <p className="text-[11px] font-normal uppercase tracking-[0.16em]" style={mutedStyle}>
              Pro
            </p>
            <p className="mt-4 text-5xl font-bold leading-none" style={{ color: COLORS.text }}>
              ₹499
            </p>
            <p className="mt-2 text-xs" style={mutedStyle}>
              per school / month
            </p>
            <hr className="my-6 border-0" style={{ borderTop: "1px solid rgba(0, 0, 0, 0.14)" }} />
            <ul className="mb-8 flex flex-1 flex-col gap-3">
              <li style={{ ...featureStyle, fontWeight: 600 }}>
                <CheckCircle2 className="mt-0.5 size-4 flex-none" aria-hidden="true" />
                <span>Everything in Basic</span>
              </li>
              {PRO_FEATURES.map((feature) => (
                <li key={feature} style={{ ...featureStyle, fontWeight: 700 }}>
                  <span aria-hidden="true">+</span>
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link to="/auth" search={{ tab: "signup" }} style={buttonStyle}>
              Get started <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </article>
        </div>
        <p className="mt-6 text-center text-[11px]" style={mutedStyle}>
          All plans include unlimited absences and substitutions. No hidden charges.
        </p>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  FAQ                                                                */
/* ------------------------------------------------------------------ */

function Faq({ reduced }: { reduced: boolean }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const reveal = makeReveal(reduced);
  const stagger = makeStagger(reduced);

  return (
    <section className="px-5 py-20 sm:px-8">
      <div className="mx-auto max-w-3xl">
        <SectionHeading eyebrow="FAQ" title="Questions we actually get asked" variants={reveal} />
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="visible"
          viewport={VIEWPORT}
          className="mt-12 flex flex-col gap-3"
        >
          {FAQS.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <motion.article
                key={faq.question}
                variants={reveal}
                data-lift
                style={GLASS as MotionStyle}
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  aria-expanded={isOpen}
                  className="flex w-full items-center justify-between gap-4 px-6 py-5 text-left text-base font-normal"
                  style={NO_SCALE}
                >
                  <span>{faq.question}</span>
                  <span aria-hidden="true" className="flex-none" style={{ color: COLORS.primary }}>
                    <Plus className="size-5" />
                  </span>
                </button>
                {isOpen && (
                  <div className="overflow-hidden">
                    <p
                      className="px-6 pb-5 pt-4 text-sm leading-relaxed"
                      style={{
                        color: COLORS.body,
                        borderTop: "none",
                      }}
                    >
                      {faq.answer}
                    </p>
                  </div>
                )}
              </motion.article>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Footer                                                             */
/* ------------------------------------------------------------------ */

function Footer({ reduced }: { reduced: boolean }) {
  const reveal = makeReveal(reduced);
  const link = "transition-colors";
  return (
    <motion.footer
      variants={reveal}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
      style={{ borderTop: "1px solid #1A1A1A" }}
    >
      <div className="mx-auto grid max-w-6xl items-center gap-6 px-5 py-10 text-sm sm:px-8 md:grid-cols-3">
        <Link
          to="/"
          className="flex items-center gap-2 text-white md:justify-self-start"
          style={NO_SCALE}
        >
          <Logo size="sm" />
          <span className="font-semibold">Timely</span>
        </Link>
        <a
          href={`mailto:${EMAIL}`}
          className={`${link} md:justify-self-center`}
          style={{ color: COLORS.body, ...NO_SCALE }}
        >
          {EMAIL}
        </a>
        <nav
          aria-label="Footer navigation"
          className="flex flex-wrap items-center gap-x-6 gap-y-2 md:justify-self-end"
          style={{ color: COLORS.body }}
        >
          <Link to="/student" className={link} style={NO_SCALE}>
            Student portal
          </Link>
          <Link to="/auth" search={{ tab: "login" }} className={link} style={NO_SCALE}>
            Log in
          </Link>
          <Link to="/auth" search={{ tab: "signup" }} className={link} style={NO_SCALE}>
            Sign up
          </Link>
        </nav>
      </div>
    </motion.footer>
  );
}

/* ------------------------------------------------------------------ */
/*  Cookie consent                                                     */
/* ------------------------------------------------------------------ */

function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (window.localStorage.getItem(COOKIE_KEY) === null) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  const choose = (value: "accepted" | "declined") => {
    try {
      window.localStorage.setItem(COOKIE_KEY, value);
    } catch {
      // Storage can be blocked (e.g. private mode); still hide for this visit.
    }
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent"
      className="fixed z-50 p-5 text-sm"
      style={{
        bottom: 24,
        right: 24,
        maxWidth: 320,
        width: "calc(100vw - 48px)",
        background: COLORS.bg,
        border: "1px solid #1A1A1A",
        borderRadius: 0,
        boxShadow: "none",
      }}
    >
      <p className="leading-relaxed" style={{ color: COLORS.body }}>
        This site uses cookies to improve user experience.{" "}
        <a href="/privacy" className="underline" style={{ color: COLORS.primary }}>
          Privacy policy
        </a>
      </p>
      <div className="mt-4 flex items-center gap-4">
        <button
          type="button"
          onClick={() => choose("accepted")}
          className="px-4 py-2 text-sm font-semibold"
          style={{
            background: COLORS.primary,
            color: "#FFFFFF",
            borderRadius: "8px",
          }}
        >
          That&apos;s OK
        </button>
        <button
          type="button"
          onClick={() => choose("declined")}
          className="text-sm"
          style={{ background: "transparent", color: COLORS.body }}
        >
          Decline cookies
        </button>
      </div>
    </div>
  );
}

/* ================================================================== */
/*  Page                                                               */
/* ================================================================== */

export function LandingPage() {
  const reduced = useReducedMotion() ?? false;

  return (
    <main
      className="landing-page relative min-h-screen overflow-x-clip"
      style={{ background: COLORS.bg, colorScheme: "light" }}
    >
      <style>{PAGE_CSS}</style>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "SoftwareApplication",
            name: "TimelySub",
            alternateName: "Timely",
            url: "https://timelysub.vercel.app/",
            applicationCategory: "BusinessApplication",
            operatingSystem: "Web",
            description: "Fair, conflict-free teacher substitution planning for schools.",
            offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
          }),
        }}
      />
      <Navbar />
      <div className="relative z-10">
        <Hero reduced={reduced} />
        <Features reduced={reduced} />
        <HowItWorks reduced={reduced} />
        <Testimonial reduced={reduced} />
        <Pricing />
        <Faq reduced={reduced} />
        <Footer reduced={reduced} />
      </div>
      <CookieBanner />
    </main>
  );
}

export default LandingPage;
