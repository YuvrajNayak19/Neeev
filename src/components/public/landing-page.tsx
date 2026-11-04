import { ArrowRight, CalendarClock, GraduationCap, Printer, Shuffle, ShieldCheck, Users } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";

const FEATURES = [
  { icon: CalendarClock, title: "Master timetable auto-solver", copy: "A constraint solver builds a clash-free Mon-Sat grid that respects TGT/PGT qualifications, daily caps and the lunch lock.", wide: true },
  { icon: Shuffle, title: "Smart substitutions", copy: "Same subject first, then department, then lightest workload. Nothing is left uncovered without a flag." },
  { icon: Printer, title: "Noticeboard export", copy: "One click prints a clean A4 matrix for the staffroom." },
  { icon: ShieldCheck, title: "Role-based access", copy: "Admin, teacher and student portals with separate permissions.", wide: true },
];

const STAKEHOLDERS = [
  { icon: ShieldCheck, title: "School admin", copy: "Generate timetables, log absences, review coverage and print the daily notice." },
  { icon: Users, title: "Teachers", copy: "See your routine, acknowledge cover duties and raise requests." },
  { icon: GraduationCap, title: "Students & parents", copy: "A read-only class schedule with live substitution badges. No login needed." },
];

function SchoolIllustration() {
  return (
    <svg viewBox="0 0 280 300" role="img" aria-label="Illustration of a welcoming school and its community" className="h-auto w-full drop-shadow-[0_20px_28px_rgba(14,10,54,0.28)]">
      <defs>
        <linearGradient id="school-glass" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#C5E7FF" />
          <stop offset="1" stopColor="#78A8FF" />
        </linearGradient>
        <linearGradient id="school-wall" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#B9BFE1" />
          <stop offset="1" stopColor="#777CAB" />
        </linearGradient>
      </defs>
      <circle cx="210" cy="58" r="31" fill="#FFD978" />
      <path d="M24 247c26-42 45-52 68-26 20-40 42-39 62-2 22-38 44-38 70 3 12-14 23-19 38-15v47H24z" fill="#76D6B2" />
      <path d="M55 139 140 85l86 54v111H55z" fill="url(#school-wall)" />
      <path d="m43 143 97-65 98 65-10 14-88-58-87 58z" fill="#FFB975" />
      <path d="M121 110h39v35h-39z" fill="#5140B8" />
      <path d="M128 118h25v7h-25zm0 12h25v7h-25z" fill="#FFF" />
      <path d="M72 160h33v33H72zm103 0h33v33h-33z" fill="url(#school-glass)" stroke="#5140B8" strokeWidth="5" />
      <path d="M84 160v33m-12-17h33m79-16v33m-12-17h33" stroke="#FFF" strokeWidth="3" />
      <path d="M119 187h42v63h-42z" fill="#5140B8" />
      <path d="M125 196h30v54h-30z" fill="#FFC66D" />
      <circle cx="149" cy="225" r="2.5" fill="#5140B8" />
      <path d="M38 252h208" stroke="#D3CEFF" strokeLinecap="round" strokeWidth="5" />
      <g>
        <circle cx="89" cy="217" r="9" fill="#A85F45" />
        <path d="M77 253v-24a12 12 0 0 1 24 0v24z" fill="#FF8D70" />
        <path d="m79 238-10 11m30-11 8 9" stroke="#A85F45" strokeLinecap="round" strokeWidth="5" />
      </g>
      <g>
        <circle cx="192" cy="216" r="9" fill="#704638" />
        <path d="M180 253v-24a12 12 0 0 1 24 0v24z" fill="#60C6B0" />
        <path d="m181 238-8 11m30-11 9 10" stroke="#704638" strokeLinecap="round" strokeWidth="5" />
      </g>
      <path d="M42 228c-8-19-4-31 13-38 2 17-2 29-13 38zm199 1c6-18 17-25 34-20-8 16-19 22-34 20z" fill="#8BE0B7" />
    </svg>
  );
}

export function LandingPage(): JSX.Element {
  const reduceMotion = useReducedMotion();

  return (
    <div className="classsync-dark-page min-h-screen overflow-hidden bg-[#080b17] text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-700/70 bg-slate-950/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#442DC5] text-white shadow-lg shadow-indigo-950/20"><GraduationCap className="h-5 w-5" /></span>
            <span className="text-base font-bold tracking-tight text-white">ClassSync</span>
          </Link>
          <nav className="hidden items-center gap-8 text-sm font-medium text-slate-300 md:flex">
            <a href="#features" className="transition-colors hover:text-white">Features</a>
            <a href="#how-it-works" className="transition-colors hover:text-white">How it works</a>
            <a href="#stakeholders" className="transition-colors hover:text-white">For schools</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-lg px-3.5 py-2 text-sm font-semibold text-slate-200 transition-colors hover:bg-slate-800 hover:text-white focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30">Sign in</Link>
            <Link to="/schedule" className="rounded-lg bg-[#5845d6] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-black/25 transition hover:-translate-y-0.5 hover:bg-[#6a57ed] hover:shadow-lg focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/40">View schedule</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="relative isolate mx-auto grid max-w-7xl items-center gap-12 px-4 py-14 sm:px-6 sm:py-20 lg:grid-cols-[0.94fr_1.06fr] lg:px-8 lg:py-24">
          <div aria-hidden="true" className="pointer-events-none absolute -left-48 top-8 -z-10 h-96 w-96 rounded-full bg-violet-600/20 blur-3xl" />
          <motion.div
            initial={reduceMotion ? false : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.35, ease: "easeOut" }}
          >
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-400/30 bg-indigo-950/60 px-3 py-1.5 text-xs font-bold tracking-wide text-indigo-200 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" /> K–12 SCHOOL OPERATIONS · GRADES 6–12
            </span>
            <h1 className="mt-6 max-w-2xl font-display text-4xl font-bold leading-[1.08] tracking-[-0.045em] text-white sm:text-5xl lg:text-[3.55rem]">
              A clearer school day starts with a <span className="text-[#a99bff]">better plan.</span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-7 text-slate-300 sm:text-lg sm:leading-8">
              Bring class schedules, staff coverage and school-day coordination into one calm, easy-to-follow workspace.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="group inline-flex items-center gap-2 rounded-lg bg-[#5845d6] px-5 py-3 text-sm font-bold text-white shadow-lg shadow-black/25 transition duration-200 hover:-translate-y-0.5 hover:bg-[#6a57ed] hover:shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-400/40">
                Open your workspace <ArrowRight className="h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
              <Link to="/schedule" className="rounded-lg border border-slate-600 bg-slate-900 px-5 py-3 text-sm font-bold text-slate-100 shadow-sm transition duration-200 hover:border-indigo-400 hover:bg-slate-800 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-indigo-500/30">View school schedule</Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-slate-700 pt-6">
              {[["6–12", "school grades"], ["Mon–Sat", "weekly planning"], ["One view", "shared clarity"]].map(([value, label]) => (
                <div key={label}><dt className="font-mono text-lg font-bold text-white sm:text-xl">{value}</dt><dd className="mt-1 text-xs font-medium leading-4 text-slate-400">{label}</dd></div>
              ))}
            </dl>
          </motion.div>

          <motion.div
            initial={reduceMotion ? false : { opacity: 0, scale: 0.97, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: reduceMotion ? 0 : 0.4, delay: reduceMotion ? 0 : 0.08, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-[620px]"
          >
            <div aria-hidden="true" className="absolute -right-10 -top-8 h-44 w-44 rounded-full bg-sky-400/20 blur-3xl" />
            <div className="relative overflow-hidden rounded-[2rem] border border-indigo-300/20 bg-gradient-to-br from-[#171b36] via-[#24245a] to-[#342d78] p-5 shadow-[0_32px_80px_rgba(0,0,0,0.45)] sm:p-7">
              <div aria-hidden="true" className="absolute inset-0 opacity-30 [background-image:radial-gradient(rgba(255,255,255,0.8)_0.7px,transparent_0.7px)] [background-size:18px_18px]" />
              <div className="relative grid min-h-[330px] items-center gap-4 sm:min-h-[380px] sm:grid-cols-[1fr_0.8fr]">
                <div className="order-2 space-y-3 sm:order-1">
                  <p className="text-xs font-bold uppercase tracking-[0.18em] text-indigo-100">Made for the school day</p>
                  <h2 className="max-w-xs font-display text-2xl font-bold leading-tight tracking-tight text-white sm:text-3xl">Less coordination chaos. More room to teach.</h2>
                  <div className="flex flex-wrap gap-2 pt-2">
                    <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Timetables</span>
                    <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">Coverage</span>
                    <span className="rounded-full border border-white/25 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white">School teams</span>
                  </div>
                </div>
                <div className={`relative order-1 mx-auto w-full max-w-[250px] sm:order-2 ${reduceMotion ? "" : "float-soft"}`}>
                  <SchoolIllustration />
                </div>
                <div className="absolute bottom-1 right-1 hidden rounded-xl border border-white/20 bg-white/10 px-3 py-2 text-xs font-semibold text-white/95 backdrop-blur-sm sm:block">A more organized school day</div>
              </div>
            </div>
          </motion.div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">A better rhythm</p>
          <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Everything your school day needs, in one place.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, copy, wide }, index) => (
              <article key={title} className={`group rounded-2xl border border-slate-700 bg-[#101729] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-1 hover:border-indigo-400/50 hover:bg-[#141d33] hover:shadow-[0_16px_34px_rgba(0,0,0,0.3)] sm:p-6 ${wide ? "md:col-span-2" : ""}`}>
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${["bg-indigo-400/15 text-indigo-200", "bg-sky-400/15 text-sky-200", "bg-amber-400/15 text-amber-200", "bg-emerald-400/15 text-emerald-200"][index]}`}><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-slate-800 bg-[#0b1020] py-16 lg:py-20">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">A simple flow</p>
            <h2 className="mt-2 max-w-2xl font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">From a change in the day to a clear plan.</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["01", "Log the absence", "Mark a teacher absent for the whole day or for specific periods."],
                ["02", "Run the solver", "Candidates are filtered by qualification, then ranked by subject, department and workload."],
                ["03", "Print and publish", "Unassigned periods are flagged for review; the noticeboard prints as one A4 page."],
              ].map(([step, title, copy]) => (
                <li key={step} className="relative overflow-hidden rounded-2xl border border-slate-700 bg-[#11182a] p-5 sm:p-6">
                  <span aria-hidden="true" className="absolute -right-3 -top-5 font-mono text-7xl font-bold text-indigo-300/10">{step}</span>
                  <span className="relative font-mono text-xs font-bold tracking-widest text-indigo-300">{step} / 03</span>
                  <h3 className="relative mt-3 text-base font-bold text-white">{title}</h3>
                  <p className="relative mt-1.5 text-sm leading-6 text-slate-300">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="stakeholders" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8 lg:py-20">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-indigo-300">One school, one shared plan</p>
          <h2 className="mt-2 font-display text-3xl font-bold tracking-tight text-white sm:text-4xl">Designed around the people who make school work.</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STAKEHOLDERS.map(({ icon: Icon, title, copy }, index) => (
              <article key={title} className="rounded-2xl border border-slate-700 bg-[#101729] p-5 shadow-[0_8px_24px_rgba(0,0,0,0.16)] transition duration-200 hover:-translate-y-1 hover:border-indigo-400/50 hover:bg-[#141d33] hover:shadow-[0_16px_34px_rgba(0,0,0,0.3)] sm:p-6">
                <div className={`grid h-11 w-11 place-items-center rounded-xl ${["bg-violet-400/15 text-violet-200", "bg-emerald-400/15 text-emerald-200", "bg-amber-400/15 text-amber-200"][index]}`}><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-base font-bold text-white">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-300">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-800 bg-[#080b17] py-6 text-center text-xs font-medium text-slate-400">© ClassSync · Built for K–12 schools</footer>
    </div>
  );
}
