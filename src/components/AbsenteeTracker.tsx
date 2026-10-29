import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { PERIODS, type Absence, type Period, type Teacher } from "@/lib/substitution";
import { cn } from "@/lib/utils";
import { dayIndexForDate, getTeacherScheduleForDay } from "@/lib/timetableParser";

type Props = {
  teachers: Teacher[];
  absences: Absence[];
  date: string;
  onDateChange: (d: string) => void;
  onChange: (a: Absence[]) => void;
};

export function AbsenteeTracker({ teachers, absences, date, onDateChange, onChange }: Props) {
  const get = (id: string) => absences.find((a) => a.teacherId === id);
  const scheduleDate = useMemo(() => new Date(`${date}T00:00:00`), [date]);
  const [selectedDay, setSelectedDay] = useState<number>(dayIndexForDate(scheduleDate) ?? 1);

  useEffect(() => {
    setSelectedDay(dayIndexForDate(scheduleDate) ?? 1);
  }, [scheduleDate]);

  const toggleTeacher = (t: Teacher) => {
    if (get(t.id)) {
      onChange(absences.filter((a) => a.teacherId !== t.id));
    } else {
      const daySchedule = getTeacherScheduleForDay(t, selectedDay);
      const busyPeriods = PERIODS.filter((p) => !daySchedule[p].isFree);
      onChange([
        ...absences,
        {
          teacherId: t.id,
          periods: busyPeriods,
          vacantClass: Object.fromEntries(
            busyPeriods.map((period) => [period, daySchedule[period].classSection || "Unassigned"]),
          ),
        },
      ]);
    }
  };

  const togglePeriod = (id: string, period: number) => {
    onChange(
      absences.map((a) =>
        a.teacherId === id
          ? {
              ...a,
              periods: a.periods.includes(period)
                ? a.periods.filter((p) => p !== period)
                : [...a.periods, period].sort((x, y) => x - y),
              vacantClass: a.periods.includes(period)
                ? Object.fromEntries(
                    Object.entries(a.vacantClass ?? {}).filter(([key]) => Number(key) !== period),
                  )
                : {
                    ...(a.vacantClass ?? {}),
                    [period]: (() => {
                      const teacher = teachers.find((candidate) => candidate.id === id);
                      return teacher
                        ? getTeacherScheduleForDay(teacher, selectedDay)[period as Period]?.classSection ||
                            "Unassigned"
                        : "Unassigned";
                    })(),
                  },
            }
          : a,
      ),
    );
  };

  return (
    <section className="panel overflow-hidden">
      <header className="flex flex-col gap-4 border-b border-border px-4 py-4 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Daily Absentee Tracker</h2>
          <p className="text-sm text-muted-foreground">
            Tick absent teachers, then choose the periods they will miss.
          </p>
        </div>
        <div className="flex items-end gap-2">
          <label className="text-xs font-medium text-muted-foreground">
            Date
            <Input
              type="date"
              value={date}
              onChange={(e) => onDateChange(e.target.value)}
              className="mt-1 h-9 w-[9.5rem]"
            />
          </label>
          <label className="text-xs font-medium text-muted-foreground">
            Active day
            <select
              value={selectedDay}
              onChange={(event) => setSelectedDay(Number(event.target.value))}
              className="mt-1 h-9 rounded-md border border-border bg-background px-2 text-sm text-foreground"
            >
              {[1, 2, 3, 4, 5, 6].map((day) => (
                <option key={day} value={day}>
                  Day {day}
                </option>
              ))}
            </select>
          </label>
          <Button variant="outline" size="sm" onClick={() => onChange([])}>
            Clear all
          </Button>
        </div>
      </header>

      <ul className="divide-y divide-border">
        {teachers.map((t) => {
          const absence = get(t.id);
          const daySchedule = getTeacherScheduleForDay(t, selectedDay);
          return (
            <li
              key={t.id}
              className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4 sm:gap-y-2 sm:px-5"
            >
              <label className="flex min-w-0 items-center gap-3 sm:min-w-56">
                <Checkbox checked={!!absence} onCheckedChange={() => toggleTeacher(t)} />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{t.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{t.subject}</span>
                </span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 sm:flex sm:flex-wrap">

                {PERIODS.map((p) => {
                  const assigned = !daySchedule[p].isFree && Boolean(daySchedule[p].classSection);
                  const selected = absence?.periods.includes(p);
                  return (
                    <button
                      key={p}
                      type="button"
                      data-availability={assigned ? "busy" : "free"}
                      data-selected={selected ? "true" : "false"}
                      disabled={!absence}
                      onClick={() => togglePeriod(t.id, p)}
                      title={
                        selected
                          ? `Period ${p}${daySchedule[p].classSection ? ` — Class ${daySchedule[p].classSection}` : " — Free"} — selected as missed`
                          : assigned
                            ? `Period ${p} — Class ${daySchedule[p].classSection} — not selected as missed`
                            : `Period ${p} — Free — not selected as missed`
                      }
                      className={cn(
                        "h-10 w-full rounded-md sm:w-12 border-2 text-xs font-semibold transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-muted/50 text-muted-foreground",
                        !absence && "opacity-40",
                        !assigned && "border-dashed opacity-70",
                        absence && !selected && "hover:border-primary/40",
                      )}
                    >
                      <span className="leading-tight">
                        <span className="block">P{p}</span>
                        <span className="block max-w-20 truncate text-[10px] font-normal">
                          {daySchedule[p].isFree ? "Free" : daySchedule[p].classSection || "Busy"}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
