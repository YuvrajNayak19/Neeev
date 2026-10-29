import { ArrowLeft, Loader2, Printer } from "lucide-react";
import { Fragment, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getPublicClasses, getPublicTimetable, searchSchools, type PublicClassSection, type PublicSchool, type PublicTimetable } from "../../lib/auth-api";
import { LUNCH, PERIODS, SUBJECT_ACCENT, subjectCategory } from "../../lib/subject-style";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const fieldClass = "mt-1 w-full rounded-md border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20 disabled:bg-slate-50 disabled:text-slate-400";

export function SchedulePortalPage(): JSX.Element {
  const [query, setQuery] = useState("");
  const [schools, setSchools] = useState<PublicSchool[]>([]);
  const [school, setSchool] = useState<PublicSchool | null>(null);
  const [classes, setClasses] = useState<PublicClassSection[]>([]);
  const [grade, setGrade] = useState<number | "">("");
  const [section, setSection] = useState("");
  const [timetable, setTimetable] = useState<PublicTimetable | null>(null);
  const [day, setDay] = useState(() => Math.min(Math.max(new Date().getDay() - 1, 0), 5));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (school || query.trim().length < 2) { setSchools([]); return; }
    const handle = window.setTimeout(() => { void searchSchools(query.trim()).then(setSchools).catch(() => setSchools([])); }, 250);
    return () => window.clearTimeout(handle);
  }, [query, school]);

  useEffect(() => {
    setGrade(""); setSection(""); setTimetable(null);
    if (!school) { setClasses([]); return; }
    void getPublicClasses(school._id).then(setClasses).catch(() => setClasses([]));
  }, [school]);

  const grades = useMemo(() => [...new Set(classes.map((item) => item.grade))].sort((a, b) => a - b), [classes]);
  const sections = useMemo(() => classes.filter((item) => item.grade === grade).map((item) => item.section).sort(), [classes, grade]);

  useEffect(() => {
    setTimetable(null); setError(null);
    if (!school || grade === "" || !section) return;
    setLoading(true);
    getPublicTimetable(school._id, grade, section)
      .then(setTimetable)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "Could not load the schedule."))
      .finally(() => setLoading(false));
  }, [school, grade, section]);

  const entry = (dayName: string, period: number) => timetable?.entries.find((item) => item.day === dayName && item.periodNumber === period);

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-3">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold"><span className="grid h-7 w-7 place-items-center rounded-lg bg-indigo-600 text-xs font-bold text-white">E</span>EduSync</Link>
          <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Home</Link>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-5 px-6 py-8">
        <div className="no-print">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Class schedule</h1>
          <p className="mt-1 text-sm text-slate-600">Read-only timetable for students and parents. No sign-in needed.</p>
        </div>

        <section className="no-print grid gap-3 rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm sm:grid-cols-3">
          <label className="relative text-xs font-medium text-slate-600">School
            <input value={query} onChange={(event) => { setQuery(event.target.value); setSchool(null); }} placeholder="Search school or city" className={fieldClass} />
            {schools.length > 0 ? (
              <div className="absolute z-10 mt-1 max-h-48 w-full overflow-auto rounded-md border border-slate-200 bg-white shadow-md">
                {schools.map((item) => (
                  <button type="button" key={item._id} onClick={() => { setSchool(item); setQuery(`${item.name} · ${item.city}`); setSchools([]); }} className="block w-full px-3 py-2 text-left text-sm font-normal text-slate-800 hover:bg-slate-50">
                    {item.name}<span className="ml-2 text-xs text-slate-500">{item.city}</span>
                  </button>
                ))}
              </div>
            ) : null}
          </label>
          <label className="text-xs font-medium text-slate-600">Select Grade (6 to 12)
            <select className={fieldClass} disabled={!school} value={grade} onChange={(event) => { setGrade(event.target.value ? Number(event.target.value) : ""); setSection(""); }}>
              <option value="">Grade</option>
              {grades.map((item) => <option key={item} value={item}>Grade {item}</option>)}
            </select>
          </label>
          <label className="text-xs font-medium text-slate-600">Select Section
            <select className={fieldClass} disabled={grade === ""} value={section} onChange={(event) => setSection(event.target.value)}>
              <option value="">Section</option>
              {sections.map((item) => <option key={item} value={item}>Section {item}</option>)}
            </select>
          </label>
        </section>

        {loading ? <p className="flex items-center gap-2 text-sm text-slate-500"><Loader2 className="h-4 w-4 animate-spin" />Loading schedule…</p> : null}
        {error ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p> : null}
        {!timetable && !loading && !error ? <p className="no-print rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Pick a school, grade and section to see the timetable.</p> : null}
        {timetable && timetable.entries.length === 0 ? <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">No timetable has been published for this class yet.</p> : null}

        {timetable && timetable.entries.length > 0 ? (
          <section className="print-area rounded-xl border border-slate-200/80 bg-white shadow-sm">
            <div className="print-header"><strong>EduSync · Class {timetable.class.grade}-{timetable.class.section} weekly timetable</strong><span>{school?.name}</span></div>
            <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-3">
              <div role="tablist" aria-label="Day" className="flex gap-1 overflow-x-auto md:invisible">
                {DAYS.map((name, index) => (
                  <button key={name} role="tab" aria-selected={day === index} onClick={() => setDay(index)} className={`rounded-md px-3 py-1.5 text-sm font-medium ${day === index ? "bg-indigo-600 text-white" : "text-slate-600 hover:bg-slate-100"}`}>{name.slice(0, 3)}</button>
                ))}
              </div>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><Printer className="h-4 w-4" />Print</button>
            </div>

            <ul className="no-print space-y-1.5 p-3 md:hidden">
              {PERIODS.map((period) => {
                const item = entry(DAYS[day], period.number);
                return (
                  <Fragment key={period.number}>
                    <li className={`rounded-md py-2 pl-3 pr-3 ${SUBJECT_ACCENT[subjectCategory(item?.subject)]}`}>
                      <div className="flex items-center justify-between"><span className="font-mono text-xs font-semibold text-slate-600">P{period.number}</span><span className="font-mono text-xs text-slate-500">{period.start} - {period.end}</span></div>
                      <p className="mt-1 text-sm font-medium text-slate-900">{item?.subject ?? "Free period"}</p>
                      {item?.teacher ? <p className="text-xs text-slate-500">{item.teacher}</p> : null}
                    </li>
                    {period.number === 4 ? <li className="rounded-md border border-dashed border-amber-300 bg-amber-50 px-3 py-2 text-xs font-semibold text-amber-800">Lunch Recess <span className="ml-1 font-mono font-normal">{LUNCH.start} - {LUNCH.end}</span></li> : null}
                  </Fragment>
                );
              })}
            </ul>

            <div className="hidden overflow-x-auto md:block print:block">
              <table className="w-full min-w-[720px] text-sm">
                <thead>
                  <tr className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
                    <th className="px-3 py-2">Period</th>
                    {DAYS.map((name) => <th key={name} className="px-3 py-2">{name.slice(0, 3)}</th>)}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {PERIODS.map((period) => (
                    <Fragment key={period.number}>
                      <tr>
                        <th scope="row" className="px-3 py-2 text-left align-top"><span className="font-mono text-xs font-semibold text-slate-700">P{period.number}</span><span className="block font-mono text-[11px] font-normal text-slate-400">{period.start}</span></th>
                        {DAYS.map((name) => {
                          const item = entry(name, period.number);
                          return (
                            <td key={name} className="p-1.5 align-top">
                              <div className={`min-h-[52px] rounded-md py-1.5 pl-2.5 pr-2 ${SUBJECT_ACCENT[subjectCategory(item?.subject)]}`}>
                                <p className="font-medium text-slate-900">{item?.subject ?? "—"}</p>
                                {item?.teacher ? <p className="text-xs text-slate-500">{item.teacher}</p> : null}
                              </div>
                            </td>
                          );
                        })}
                      </tr>
                      {period.number === 4 ? <tr><td colSpan={7} className="bg-amber-50 px-3 py-1.5 text-center text-xs font-semibold text-amber-800">Lunch Recess · <span className="font-mono font-normal">{LUNCH.start} - {LUNCH.end}</span></td></tr> : null}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ) : null}
      </main>
    </div>
  );
}
