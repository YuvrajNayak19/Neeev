import { AlertTriangle, Coffee, Repeat2 } from "lucide-react";
import { Fragment, useState } from "react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LUNCH, PERIODS, SCHOOL_DAYS, formatTime, periodTime, type SchoolDay } from "@/lib/school-time";
import { subjectClasses, subjectShort } from "@/lib/subject-style";
import { cn } from "@/lib/utils";

export type GridEntry = {
  day: string;
  periodNumber: number;
  subject?: string;
  /** Teacher (class view) or class label (teacher view). */
  primary?: string;
  room?: string;
  clash?: string;
  substitute?: string;
};

type Props = {
  entries: GridEntry[];
  /** What the second line of each cell shows. */
  secondaryLabel?: "Teacher" | "Class";
  today?: SchoolDay | null;
  nowPeriod?: number | null;
  emptyCellLabel?: string;
  caption: string;
};

function findEntry(entries: GridEntry[], day: string, period: number) {
  return entries.find((entry) => entry.day === day && entry.periodNumber === period);
}

function CellBody({ entry, compact }: { entry: GridEntry; compact?: boolean }) {
  return (
    <>
      <span className="flex items-start justify-between gap-1">
        <span className={cn("font-semibold leading-tight", compact ? "text-[13px]" : "text-sm")}>{compact ? subjectShort(entry.subject) : entry.subject}</span>
        {entry.clash ? <AlertTriangle aria-label="Clash" className="h-3.5 w-3.5 shrink-0 text-honey" /> : entry.substitute ? <Repeat2 aria-label="Substitute" className="h-3.5 w-3.5 shrink-0" /> : null}
      </span>
      {entry.substitute ? (
        <span className="mt-1 block truncate text-xs font-semibold">Sub: {entry.substitute}</span>
      ) : entry.primary ? (
        <span className="mt-1 block truncate text-xs opacity-85">{entry.primary}</span>
      ) : null}
      {entry.room && !compact ? <span className="mt-0.5 block truncate text-2xs opacity-70">Room {entry.room}</span> : null}
    </>
  );
}

function DetailLines({ entry, secondaryLabel }: { entry: GridEntry; secondaryLabel: string }) {
  return (
    <span className="block space-y-0.5">
      <span className="block font-semibold">{entry.subject} · {entry.day}, period {entry.periodNumber}</span>
      <span className="block opacity-80">{periodTime(entry.periodNumber)}</span>
      {entry.primary ? <span className="block">{secondaryLabel}: {entry.primary}</span> : null}
      {entry.room ? <span className="block">Room: {entry.room}</span> : null}
      {entry.substitute ? <span className="block">Substitute today: {entry.substitute}</span> : null}
      {entry.clash ? <span className="block text-peach-200">⚠ {entry.clash}</span> : null}
    </span>
  );
}

/** Weekly days × periods grid on wide screens; a day-by-day list on phones. */
export function TimetableGrid({ entries, secondaryLabel = "Teacher", today, nowPeriod, emptyCellLabel = "Free", caption }: Props) {
  const [mobileDay, setMobileDay] = useState<SchoolDay>(today ?? "Monday");

  return (
    <div>
      {/* Desktop / tablet grid */}
      <div className="hidden overflow-x-auto md:block print:block">
        <table className="w-full min-w-[760px] table-fixed border-separate border-spacing-1.5">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr>
              <th scope="col" className="w-[84px] px-2 pb-1 text-left text-xs font-semibold uppercase tracking-[0.08em] text-ink-muted">Period</th>
              {SCHOOL_DAYS.map((day) => (
                <th key={day} scope="col" className={cn("rounded-lg px-2 py-2 text-center text-sm font-semibold", day === today ? "bg-plum text-cream" : "text-ink")}>
                  {day.slice(0, 3)}
                  {day === today ? <span className="sr-only"> (today)</span> : null}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PERIODS.map((period) => (
              <Fragment key={period.number}>
                <tr>
                  <th scope="row" className={cn("rounded-lg px-2 text-left align-middle", nowPeriod === period.number && today ? "bg-peach-100" : "")}>
                    <span className="block text-sm font-bold text-ink">P{period.number}</span>
                    <span className="tabular block text-2xs text-ink-muted">{formatTime(period.start)}</span>
                  </th>
                  {SCHOOL_DAYS.map((day) => {
                    const entry = findEntry(entries, day, period.number);
                    const isNow = day === today && nowPeriod === period.number;
                    if (!entry) {
                      return (
                        <td key={day} className="h-[74px] rounded-xl border border-dashed border-line-strong/70 text-center align-middle text-xs text-ink-soft">
                          {emptyCellLabel}
                        </td>
                      );
                    }
                    return (
                      <td key={day} className="h-[74px] p-0 align-top">
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <button
                              type="button"
                              className={cn(
                                "block h-full w-full cursor-default rounded-xl px-2.5 py-2 text-left transition-shadow hover:shadow-soft focus-visible:shadow-focus",
                                subjectClasses(entry.subject).cell,
                                entry.clash && "ring-2 ring-honey",
                                entry.substitute && "ring-2 ring-plum/50",
                                isNow && "ring-2 ring-plum ring-offset-2 ring-offset-paper",
                              )}
                            >
                              <span className="sr-only">{day}, period {period.number}: </span>
                              <CellBody entry={entry} compact />
                            </button>
                          </TooltipTrigger>
                          <TooltipContent side="top">
                            <DetailLines entry={entry} secondaryLabel={secondaryLabel} />
                          </TooltipContent>
                        </Tooltip>
                      </td>
                    );
                  })}
                </tr>
                {period.number === LUNCH.afterPeriod ? (
                  <tr>
                    <td colSpan={7} className="rounded-lg bg-peach-50 py-1.5 text-center text-xs font-semibold text-ink-muted">
                      <Coffee className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-coral" />
                      Lunch · {formatTime(LUNCH.start)} – {formatTime(LUNCH.end)}
                    </td>
                  </tr>
                ) : null}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phone: one day at a time */}
      <div className="md:hidden print:hidden">
        <div role="tablist" aria-label="Choose a day" className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-3">
          {SCHOOL_DAYS.map((day) => (
            <button
              key={day}
              role="tab"
              type="button"
              aria-selected={mobileDay === day}
              onClick={() => setMobileDay(day)}
              className={cn(
                "shrink-0 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors",
                mobileDay === day ? "border-plum bg-plum text-cream" : "border-line-strong bg-paper text-ink-muted",
              )}
            >
              {day.slice(0, 3)}
              {day === today ? <span className="ml-1 text-2xs opacity-80">today</span> : null}
            </button>
          ))}
        </div>
        <ol className="space-y-2" aria-label={`${mobileDay} timetable`}>
          {PERIODS.map((period) => {
            const entry = findEntry(entries, mobileDay, period.number);
            return (
              <Fragment key={period.number}>
                <li className="flex gap-3">
                  <div className="w-14 shrink-0 pt-2.5 text-right">
                    <p className="text-sm font-bold text-ink">P{period.number}</p>
                    <p className="tabular text-2xs text-ink-muted">{formatTime(period.start)}</p>
                  </div>
                  {entry ? (
                    <div className={cn("min-w-0 flex-1 rounded-xl px-3.5 py-2.5", subjectClasses(entry.subject).cell, entry.clash && "ring-2 ring-honey", entry.substitute && "ring-2 ring-plum/50")}>
                      <CellBody entry={entry} />
                      {entry.clash ? <p className="mt-1 text-xs font-semibold">{entry.clash}</p> : null}
                    </div>
                  ) : (
                    <div className="flex-1 rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-sm text-ink-soft">{emptyCellLabel}</div>
                  )}
                </li>
                {period.number === LUNCH.afterPeriod ? (
                  <li className="ml-[4.25rem] rounded-xl bg-peach-50 px-3.5 py-2 text-xs font-semibold text-ink-muted">
                    <Coffee className="mr-1.5 inline h-3.5 w-3.5 -translate-y-px text-coral" />Lunch · {formatTime(LUNCH.start)} – {formatTime(LUNCH.end)}
                  </li>
                ) : null}
              </Fragment>
            );
          })}
        </ol>
      </div>
    </div>
  );
}

export function SubjectLegend({ subjects }: { subjects: string[] }) {
  return (
    <ul className="flex flex-wrap gap-x-4 gap-y-2" aria-label="Subject colours">
      {subjects.map((subject) => (
        <li key={subject} className="flex items-center gap-1.5 text-xs font-medium text-ink-muted">
          <span className={cn("h-2.5 w-2.5 rounded-full", subjectClasses(subject).dot)} />
          {subject}
        </li>
      ))}
    </ul>
  );
}
