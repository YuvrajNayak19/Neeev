import { createFileRoute, Link } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, ChevronDown, Clock3, Coffee, Copy, Scale, Sparkles, Users } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Timely — Fair Teacher Substitution Plans in 90 Seconds" },
      {
        name: "description",
        content:
          "Generate fair, conflict-free teacher substitution plans in 90 seconds. Timely is simple, print-ready, and built for busy school mornings.",
      },
      { property: "og:title", content: "Timely — Substitute Plans Without the Morning Scramble" },
      {
        property: "og:description",
        content: "A fast, fair and simple way for school admins to arrange teacher substitutions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const revealFromLeft = {
  hidden: { opacity: 0, x: -52, y: 0 },
  visible: { opacity: 1, x: 0, y: 0 },
};

const revealFromRight = {
  hidden: { opacity: 0, x: 52, y: 0 },
  visible: { opacity: 1, x: 0, y: 0 },
};

const revealUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const viewport = { once: true, amount: 0.2 };

const featureCards = [
  {
    icon: Clock3,
    title: "Auto-generated cover",
    copy: "Build fair substitutions before the first bell with live teacher availability.",
  },
  {
    icon: Scale,
    title: "Fairness tracked",
    copy: "Prioritize the right teacher without overloading the same staff repeatedly.",
  },
  {
    icon: Sparkles,
    title: "Fast school updates",
    copy: "Keep every class, teacher, and student view aligned in one clear workflow.",
  },
];

const problems = [
  {
    icon: Clock3,
    title: "Morning chaos",
    copy: "One late absence can trigger a scramble of calls, lists and rushed decisions in minutes.",
  },
  {
    icon: Scale,
    title: "Fairness concerns",
    copy: "When rules are unclear, the same teachers keep getting the most difficult cover.",
  },
  {
    icon: Coffee,
    title: "Teacher burnout",
    copy: "Last-minute substitutions pile pressure onto already stretched teaching staff.",
  },
];

const steps = [
  { number: "01", title: "Input absences", copy: "Mark who is absent and which periods need cover." },
  { number: "02", title: "Generate plan", copy: "Timely balances subject fit, teacher load, and class coverage." },
  { number: "03", title: "Share and print", copy: "Review, approve, and distribute a clean schedule in seconds." },
];

const faqs = [
  { question: "Will teachers use it?", answer: "Teachers only need to see the final, clear plan — no extra system to learn." },
  { question: "Is it secure?", answer: "School data is stored in a controlled workflow with role-aware access and saved school profiles." },
  { question: "What if I make a mistake?", answer: "You can adjust absences or swap teachers before printing, and the plan updates immediately." },
];

function TypewriterText() {
  const words = ["teacher coverage", "class plans", "school operations"];
  const [text, setText] = useState("");
  const [wordIndex, setWordIndex] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);

  const currentWord = words[wordIndex];

  useEffect(() => {
    const speed = isDeleting ? 45 : 90;

    const timeout = window.setTimeout(() => {
      if (!isDeleting) {
        const nextText = currentWord.slice(0, text.length + 1);
        setText(nextText);

        if (nextText === currentWord) {
          setIsDeleting(true);
        }
      } else {
        const nextText = currentWord.slice(0, text.length - 1);
        setText(nextText);

        if (nextText === "") {
          setIsDeleting(false);
          setWordIndex((wordIndex + 1) % words.length);
        }
      }
    }, speed);

    return () => window.clearTimeout(timeout);
  }, [currentWord, isDeleting, text, wordIndex]);

  return <span className="typewriter-text">{text}</span>;
}

function SupportOptions() {
  const [open, setOpen] = useState<"feature" | "support" | null>(null);
  const [copyMessage, setCopyMessage] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setOpen(null);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    return () => document.removeEventListener("mousedown", closeOnOutsideClick);
  }, []);

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText("developerstimely@gmail.com");
      setCopyMessage("Copied!");
    } catch {
      setCopyMessage("Copy failed. Email developerstimely@gmail.com");
    }
  };

  return (
    <div ref={containerRef} className="support-options">
      {(["feature", "support"] as const).map((type) => {
        const isOpen = open === type;
        const label = type === "feature" ? "Suggest a feature" : "Get support";
        return (
          <motion.div
            key={type}
            layout
            className={isOpen ? "glass support-option support-option-open" : "support-option"}
          >
            <button
              type="button"
              className="support-pill"
              onClick={() => setOpen(isOpen ? null : type)}
              aria-expanded={isOpen}
            >
              {label}
            </button>
            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="support-card-content"
                >
                  <span>Email us at developerstimely@gmail.com</span>
                  <button
                    type="button"
                    onClick={() => void copyEmail()}
                    className="support-copy"
                    aria-label="Copy support email"
                  >
                    <Copy className="size-4" />
                  </button>
                  <span className="copied-note" aria-live="polite">{copyMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}
    </div>
  );
}

function Landing() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  return (
    <main className="timely-landing">
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
            description:
              "Fair, conflict-free teacher substitution planning for schools.",
            offers: {
              "@type": "Offer",
              price: "0",
              priceCurrency: "USD",
            },
          }),
        }}
      />
      <header className="landing-navbar sticky top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-foreground" aria-label="Timely home">
            <Logo size="md" />
            <span className="text-lg font-bold">Timely</span>
          </Link>
          <nav className="flex items-center gap-2" aria-label="Main navigation">
            <Button asChild variant="ghost" size="sm" className="px-2 text-xs sm:px-3 sm:text-sm">
              <Link to="/student">Student portal</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link to="/auth" search={{ tab: "login" }}>Log in</Link>
            </Button>
            <Button asChild size="sm" className="landing-nav-btn-primary">
              <Link to="/auth" search={{ tab: "signup" }}>Sign up</Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="hero-section px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-16">
        <div className="mx-auto max-w-7xl">
          <div className="landing-hero">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={revealFromLeft}
              transition={{ duration: 0.6 }}
              className="hero-copy"
            >
              <span className="landing-eyebrow">
                <Users className="size-4" /> Built for busy school mornings
              </span>
              <h1>
                Make every <span className="hero-highlight">class</span> feel planned.
              </h1>
              <div className="typewriter-wrap">
                <span className="typewriter-label">Live</span>
                <TypewriterText />
              </div>
              <p className="hero-subtext">
                From sudden absences to last-period swaps, Timely turns chaos into a clean, fair, and shareable timetable plan.
              </p>
              <div className="hero-actions">
                <Button asChild size="lg" className="landing-cta-btn cta-pulse">
                  <Link to="/app">
                    Launch dashboard <ArrowRight />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="ghost" className="landing-light-cta">
                  <a href="#how-it-works">See how it works</a>
                </Button>
              </div>
            </motion.div>

            <motion.div
              initial="hidden"
              animate="visible"
              variants={revealFromRight}
              transition={{ duration: 0.7, delay: 0.08 }}
              className="hero-visual"
            >
              <div className="mini-timetable">
                <div className="mini-header">
                  <span>Today</span>
                  <span>8 periods</span>
                </div>
                <div className="mini-grid">
                  {Array.from({ length: 8 }).map((_, index) => (
                    <div key={index} className={`period-pill ${index === 3 ? "is-active" : ""}`}>
                      {index + 1}
                    </div>
                  ))}
                </div>
                <div className="mini-stats">
                  <div className="mini-stat">
                    <span>Coverage</span>
                    <strong>96%</strong>
                  </div>
                  <div className="mini-stat accent">
                    <span>Teachers</span>
                    <strong>12 ready</strong>
                  </div>
                </div>
                <div className="mini-table">
                  {[
                    ["8:30", "English", "Asha"],
                    ["9:20", "Maths", "Ravi"],
                    ["10:15", "Science", "Nisha"],
                    ["11:10", "Break", "—"],
                    ["11:30", "Biology", "Leena"],
                    ["12:20", "Computer", "Mohan"],
                    ["1:10", "History", "Aditya"],
                    ["2:00", "Physics", "Arun"],
                  ].map(([time, subject, teacher], rowIndex) => (
                    <div key={time} className={`mini-row ${rowIndex % 2 === 0 ? "even" : "odd"}`}>
                      <span>{time}</span>
                      <strong>{subject}</strong>
                      <em>{teacher}</em>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <motion.section
        id="why-it-matters"
        initial="hidden"
        whileInView="visible"
        viewport={viewport}
        variants={revealUp}
        className="landing-section landing-section-soft"
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <div className="section-heading">
            <span>Why this matters</span>
            <h2>A calmer start for the whole school</h2>
            <p>When someone is absent, the admin team carries the pressure. Timely helps you act fast without losing fairness.</p>
          </div>
          <div className="mt-10 grid gap-8 md:grid-cols-3">
            {problems.map((problem, index) => (
              <motion.article
                key={problem.title}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={index % 2 === 0 ? revealFromLeft : revealFromRight}
                transition={{ delay: index * 0.08 }}
                className="problem-item"
              >
                <span className="problem-icon"><problem.icon className="size-5" /></span>
                <h3>{problem.title}</h3>
                <p>{problem.copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </motion.section>

      <section className="landing-section">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={revealUp} className="section-heading">
            <span>Fast, fair, simple</span>
            <h2>Less admin. More confidence.</h2>
          </motion.div>
          <div className="mt-10 grid gap-4 md:grid-cols-3">
            {featureCards.map((feature, index) => (
              <motion.article
                key={feature.title}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={index % 2 === 0 ? revealFromLeft : revealFromRight}
                transition={{ delay: index * 0.08 }}
                className="landing-glass-card"
              >
                <span className="benefit-icon"><feature.icon className="size-5" /></span>
                <p className="benefit-label">Feature</p>
                <h3>{feature.title}</h3>
                <p>{feature.copy}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      <section id="how-it-works" className="landing-section landing-section-soft scroll-mt-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={revealUp} className="section-heading">
            <span>How it works</span>
            <h2>From absences to a fair plan in three steps</h2>
          </motion.div>
          <ol className="steps-list mt-12">
            {steps.map((step, index) => (
              <motion.li
                key={step.number}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={index % 2 === 0 ? revealFromLeft : revealFromRight}
                transition={{ delay: index * 0.1 }}
                className="step-item"
              >
                <span className="step-number">{step.number}</span>
                <div>
                  <h3>{step.title}</h3>
                  <p>{step.copy}</p>
                </div>
                {index < steps.length - 1 && <ArrowRight className="step-arrow" aria-hidden="true" />}
              </motion.li>
            ))}
          </ol>
        </div>
      </section>

      <motion.section initial="hidden" whileInView="visible" viewport={viewport} variants={revealUp} className="landing-section">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <figure className="testimonial-card">
            <div className="quote-mark" aria-hidden="true">“</div>
            <blockquote>Everything is easier when the school knows who is free, who is qualified, and what the plan should be.</blockquote>
          </figure>
          <SupportOptions />
        </div>
      </motion.section>

      <section className="landing-section landing-section-soft">
        <div className="mx-auto max-w-3xl px-4 sm:px-6">
          <motion.div initial="hidden" whileInView="visible" viewport={viewport} variants={revealUp} className="section-heading">
            <span>FAQ</span>
            <h2>Questions school admins ask</h2>
          </motion.div>
          <div className="mt-10 space-y-3">
            {faqs.map((faq, index) => {
              const isOpen = openFaq === index;
              return (
              <motion.article
                key={faq.question}
                initial="hidden"
                whileInView="visible"
                viewport={viewport}
                variants={index % 2 === 0 ? revealFromLeft : revealFromRight}
                transition={{ delay: index * 0.06 }}
                className="glass faq-item"
              >
                <button type="button" className="faq-question" onClick={() => setOpenFaq(isOpen ? null : index)} aria-expanded={isOpen}><span>{faq.question}</span><ChevronDown className="size-5" style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)" }} /></button>
                <AnimatePresence initial={false}>{isOpen && <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2 }} className="faq-answer"><p>{faq.answer}</p></motion.div>}</AnimatePresence>
              </motion.article>
              );
            })}
          </div>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="mx-auto flex max-w-7xl flex-col gap-6 px-4 py-9 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <Link to="/" className="flex items-center gap-2 text-foreground"><Logo size="sm" /><span className="font-bold">Timely</span></Link>
          <div className="flex flex-col gap-3 text-sm sm:flex-row sm:items-center sm:gap-6">
            <Link to="/student">Student portal</Link>
            <Link to="/auth" search={{ tab: "login" }}>Log in</Link>
            <Link to="/auth" search={{ tab: "signup" }}>Sign up</Link>
            <a href="mailto:developerstimely@gmail.com">developerstimely@gmail.com</a>
          </div>
        </div>
      </footer>
    </main>
  );
}
