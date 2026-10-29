import { ArrowRight, CalendarClock, GraduationCap, Printer, Shuffle, ShieldCheck, Users } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { LUNCH, PERIODS, SUBJECT_ACCENT, subjectCategory } from "../../lib/subject-style";

const MONDAY_10A = [
  { subject: "English", teacher: "Ms. Asha Verma", room: "R-101" },
  { subject: "Mathematics", teacher: "Mr. Ravi Kumar", room: "R-101" },
  { subject: "Physics", teacher: "Ms. Nisha Shah", room: "LAB-2" },
  { subject: "Social Science", teacher: "Mr. Rohan Das", room: "R-101" },
  { subject: "Chemistry", teacher: "Ms. Diya Kapoor", room: "LAB-1", cover: true },
  { subject: "Computer Science", teacher: "Mr. Mohan Roy", room: "IT-1" },
  { subject: "Physical Education", teacher: "Mr. Dev Anand", room: "GROUND" },
  { subject: "Hindi", teacher: "Ms. Kavya Das", room: "R-101" },
];

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

export function LandingPage(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-600 text-sm font-bold text-white">E</span>
            <span className="text-sm font-semibold tracking-tight">EduSync</span>
          </Link>
          <nav className="hidden items-center gap-7 text-sm text-slate-600 md:flex">
            <a href="#features" className="hover:text-slate-900">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900">How It Works</a>
            <a href="#stakeholders" className="hover:text-slate-900">Stakeholders</a>
          </nav>
          <div className="flex items-center gap-2">
            <Link to="/login" className="rounded-md px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-100">Sign In</Link>
            <Link to="/schedule" className="rounded-md bg-indigo-600 px-3.5 py-1.5 text-sm font-medium text-white hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20">View Schedule</Link>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 py-16 lg:grid-cols-[1fr_1.05fr] lg:py-24">
          <div>
            <span className="inline-flex items-center rounded-full border border-indigo-200 bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700">K-12 school operations · Grades 6-12</span>
            <h1 className="mt-5 text-4xl font-bold leading-[1.1] tracking-tight text-slate-900 sm:text-5xl">Timetables and substitutions, solved before the first bell.</h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-slate-600">EduSync generates a clash-free master timetable and covers absent teachers every morning in seconds, with every class, room and period in one live plan.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/login" className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-4 focus:ring-indigo-500/20">Sign In <ArrowRight className="h-4 w-4" /></Link>
              <Link to="/schedule" className="rounded-md border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50">View Schedule</Link>
            </div>
            <dl className="mt-10 grid max-w-md grid-cols-3 gap-6 border-t border-slate-200 pt-6">
              {[["0", "teacher clashes"], ["8", "periods / day"], ["20 min", "locked lunch"]].map(([value, label]) => (
                <div key={label}><dt className="font-mono text-xl font-semibold text-slate-900">{value}</dt><dd className="mt-0.5 text-xs text-slate-500">{label}</dd></div>
              ))}
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="flex items-start justify-between border-b border-slate-100 px-4 py-3">
              <div>
                <p className="text-xs font-medium text-slate-500">Live schedule</p>
                <p className="text-sm font-semibold">Class 10-A <span className="font-normal text-slate-400">· Monday</span></p>
              </div>
              <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">1 cover assigned</span>
            </div>
            <ul className="space-y-1 p-3">
              {PERIODS.map((period, index) => {
                const slot = MONDAY_10A[index];
                return (
                  <Fragment key={period.number}>
                    <li className={`grid grid-cols-[2.25rem_1fr_auto] items-center gap-3 rounded-md py-2 pl-3 pr-3 ${SUBJECT_ACCENT[subjectCategory(slot.subject)]}`}>
                      <span className="font-mono text-xs font-semibold text-slate-600">P{period.number}</span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-slate-900">
                          {slot.subject}
                          <span className="ml-2 text-xs font-normal text-slate-500">
                            {slot.cover ? <span className="rounded border border-emerald-200 bg-emerald-50 px-1.5 py-0.5 text-[11px] font-medium text-emerald-700">Cover · {slot.teacher}</span> : slot.teacher}
                          </span>
                        </p>
                        <p className="font-mono text-xs text-slate-500">{period.start} - {period.end}</p>
                      </div>
                      <span className="font-mono text-xs text-slate-500">{slot.room}</span>
                    </li>
                    {period.number === 4 ? (
                      <li className="flex items-center justify-between rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2">
                        <span className="text-xs font-semibold text-amber-800">Lunch Recess · 20 min</span>
                        <span className="font-mono text-xs text-amber-700">{LUNCH.start} - {LUNCH.end}</span>
                      </li>
                    ) : null}
                  </Fragment>
                );
              })}
            </ul>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Features</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Everything the front office does by hand, done for you</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {FEATURES.map(({ icon: Icon, title, copy, wide }) => (
              <article key={title} className={`rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm transition hover:border-indigo-200 ${wide ? "md:col-span-2" : ""}`}>
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="border-y border-slate-200/80 bg-white py-16">
          <div className="mx-auto max-w-7xl px-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">How It Works</p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight">From absence to notice in three steps</h2>
            <ol className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                ["01", "Log the absence", "Mark a teacher absent for the whole day or for specific periods."],
                ["02", "Run the solver", "Candidates are filtered by qualification, then ranked by subject, department and workload."],
                ["03", "Print and publish", "Unassigned periods are flagged for review; the noticeboard prints as one A4 page."],
              ].map(([step, title, copy]) => (
                <li key={step} className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-5">
                  <span className="font-mono text-xs font-semibold text-indigo-600">{step}</span>
                  <h3 className="mt-2 text-base font-semibold">{title}</h3>
                  <p className="mt-1.5 text-sm leading-6 text-slate-600">{copy}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        <section id="stakeholders" className="mx-auto max-w-7xl px-6 py-16">
          <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Stakeholders</p>
          <h2 className="mt-2 text-2xl font-bold tracking-tight">Built for everyone in the school</h2>
          <div className="mt-8 grid gap-4 md:grid-cols-3">
            {STAKEHOLDERS.map(({ icon: Icon, title, copy }) => (
              <article key={title} className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-sm">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><Icon className="h-5 w-5" /></div>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm leading-6 text-slate-600">{copy}</p>
              </article>
            ))}
          </div>
        </section>
      </main>
      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-500">© EduSync · Built for K-12 schools</footer>
    </div>
  );
}
