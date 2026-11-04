import { CalendarDays, Clock, Coffee, MapPin, Repeat2, Sun } from "lucide-react";
import { Fragment } from "react";
import { Link } from "react-router-dom";
import { PageHeader } from "@/components/app/app-shell";
import { Panel } from "@/components/app/bits";
import { greeting } from "@/lib/format";
import { NoticesPanel } from "@/components/app/notices-panel";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { SubjectLegend, TimetableGrid } from "@/components/app/timetable-grid";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useWeek } from "@/lib/api";
import { LUNCH, PERIODS, currentPeriod, currentSchoolDate, formatLongDate, formatTime, schoolDayName, schoolDayPhase, toIsoDate } from "@/lib/school-time";
import { displayName, useMe } from "@/lib/session";
import { subjectClasses } from "@/lib/subject-style";
import { cn } from "@/lib/utils";

function useMyClass() {
  const me = useMe();
  const section = me.data?.student?.classSectionId ?? null;
  return { me, classId: section?._id, label: section ? `${section.grade}-${section.section}` : "" };
}

export function StudentTodayPage() {
  const { me, classId, label } = useMyClass();
  const date = toIsoDate(currentSchoolDate());
  const dayName = schoolDayName(currentSchoolDate());
  const week = useWeek({ classId }, date);
  const now = currentPeriod();
  const today = (week.data?.entries ?? []).filter((entry) => entry.day === dayName).sort((a, b) => a.periodNumber - b.periodNumber);
  const changes = today.filter((entry) => entry.substitute);
  const phase = new Date().getDay() === 0 ? "before" : schoolDayPhase();
  const upcoming = phase === "after" ? null : today.find((entry) => (now ? entry.periodNumber >= now : true)) ?? null;
  const upcomingTime = upcoming ? PERIODS.find((period) => period.number === upcoming.periodNumber) : null;

  return (
    <>
      <PageHeader eyebrow={`${formatLongDate(currentSchoolDate())}${label ? ` · Class ${label}` : ""}`} title={`${greeting()}, ${displayName(me.data).split(" ")[0]}`} description={changes.length ? `${changes.length} of your classes ${changes.length > 1 ? "have" : "has"} a substitute teacher today.` : "Your classes for today, in order."} />

      {week.isLoading || me.isLoading ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]"><Skeleton className="h-[420px]" /><Skeleton className="h-64" /></div>
      ) : week.error ? (
        <ErrorState error={week.error} onRetry={() => void week.refetch()} />
      ) : !classId ? (
        <EmptyState icon={CalendarDays} title="You're not in a class yet" description="Ask your class teacher to add you to your section." />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className="space-y-6">
            {upcoming && upcomingTime ? (
              <section aria-label="Next class" className={cn("relative overflow-hidden rounded-3xl p-6", subjectClasses(upcoming.subject).cell)}>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] opacity-80">{now === upcoming.periodNumber ? "Happening now" : "Up next"} · Period {upcoming.periodNumber}</p>
                <p className="mt-2 font-display text-3xl font-semibold">{upcoming.subject}</p>
                <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm font-medium">
                  <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{formatTime(upcomingTime.start)} – {formatTime(upcomingTime.end)}</span>
                  <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{upcoming.room}</span>
                </p>
                <p className="mt-3 text-sm">{upcoming.substitute ? <><span className="rounded-full bg-paper px-2 py-0.5 text-xs font-semibold text-plum">Substitute</span> {upcoming.substitute} is taking this class</> : <>with {upcoming.teacher}</>}</p>
              </section>
            ) : phase === "after" && today.length ? (
              <section aria-label="School day finished" className="flex items-center gap-4 rounded-3xl bg-peach-100 p-6">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-paper text-plum"><Sun className="h-5 w-5" /></span>
                <div>
                  <p className="font-display text-xl font-semibold text-ink">That's it for today</p>
                  <p className="text-sm text-ink-muted">Classes finished at {formatTime(PERIODS[PERIODS.length - 1].end)}. Here's how today went.</p>
                </div>
              </section>
            ) : null}

            <Panel title="Today's classes" action={<Link to="/student/weekly" className="text-sm font-semibold text-plum hover:underline">Whole week</Link>}>
              {today.length === 0 ? (
                <EmptyState icon={Sun} title="No classes today" description="Enjoy the day off." className="py-8" />
              ) : (
                <ol className="space-y-2">
                  {today.map((entry) => {
                    const period = PERIODS.find((item) => item.number === entry.periodNumber)!;
                    const isNow = now === entry.periodNumber;
                    return (
                      <Fragment key={entry.periodNumber}>
                        <li className="flex gap-3">
                          <div className={cn("w-14 shrink-0 rounded-xl py-2 text-center", isNow ? "bg-plum text-cream" : "text-ink")}>
                            <p className="text-sm font-bold">P{entry.periodNumber}</p>
                            <p className={cn("tabular text-2xs", isNow ? "text-cream/80" : "text-ink-muted")}>{formatTime(period.start)}</p>
                          </div>
                          <div className={cn("flex min-w-0 flex-1 items-center gap-3 rounded-xl px-3.5 py-2.5", subjectClasses(entry.subject).cell, entry.substitute && "ring-2 ring-plum/40")}>
                            <div className="min-w-0 flex-1">
                              <p className="font-semibold">{entry.subject}</p>
                              <p className="truncate text-xs opacity-85">{entry.substitute ? `Substitute: ${entry.substitute}` : entry.teacher} · {entry.room}</p>
                            </div>
                            {entry.substitute ? <Repeat2 aria-label="Substitute teacher" className="h-4 w-4 shrink-0" /> : null}
                          </div>
                        </li>
                        {entry.periodNumber === LUNCH.afterPeriod ? <li className="ml-[4.25rem] rounded-xl bg-peach-50 px-3.5 py-2 text-xs font-semibold text-ink-muted"><Coffee className="mr-1.5 inline h-3.5 w-3.5 text-coral" />Lunch · {formatTime(LUNCH.start)} – {formatTime(LUNCH.end)}</li> : null}
                      </Fragment>
                    );
                  })}
                </ol>
              )}
            </Panel>
          </div>
          <NoticesPanel />
        </div>
      )}
    </>
  );
}

export function StudentWeeklyPage() {
  const { classId, label, me } = useMyClass();
  const week = useWeek({ classId }, toIsoDate(currentSchoolDate()));
  const entries = (week.data?.entries ?? []).map((entry) => ({ day: entry.day, periodNumber: entry.periodNumber, subject: entry.subject, primary: entry.teacher, room: entry.room, substitute: entry.substitute }));
  const subjects = [...new Set(entries.map((entry) => entry.subject).filter(Boolean) as string[])].sort();
  return (
    <>
      <PageHeader title={label ? `Class ${label} timetable` : "Weekly timetable"} description="The whole week. Substitutes for today are marked." actions={entries.length ? <Button variant="outline" onClick={() => window.print()}>Print</Button> : null} />
      <section className="print-area rounded-2xl border border-line bg-paper p-4 shadow-soft sm:p-6">
        <div className="print-header"><strong>ClassSync · Class {label}</strong><span>Weekly timetable</span></div>
        {week.isLoading || me.isLoading ? <ListSkeleton rows={6} /> : week.error ? <ErrorState error={week.error} onRetry={() => void week.refetch()} /> : entries.length === 0 ? (
          <EmptyState icon={CalendarDays} title="Not published yet" description="Your school hasn't published the timetable for your class." />
        ) : (
          <>
            <TimetableGrid entries={entries} today={schoolDayName(currentSchoolDate())} nowPeriod={currentPeriod()} caption={`Weekly timetable for class ${label}`} />
            <div className="no-print mt-5 border-t border-line pt-4"><SubjectLegend subjects={subjects} /></div>
          </>
        )}
      </section>
    </>
  );
}
