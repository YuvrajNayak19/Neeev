import { CalendarDays, ChevronDown, UserRound } from "lucide-react";
import { Fragment, useMemo } from "react";
import {
  SCHOOL_DAYS,
  SCHOOL_PERIODS,
  type ClassSection,
  type MasterTimetable,
  type SchoolDay,
  type SchoolPeriod,
  type SchoolTeacher,
  type Subject,
} from "../../types/school-domain";
import { cn } from "../../lib/utils";
import { LUNCH, PERIODS, SUBJECT_ACCENT, subjectCategory } from "../../lib/subject-style";

const dayNames: Record<SchoolDay, string> = { 1: "Mon", 2: "Tue", 3: "Wed", 4: "Thu", 5: "Fri", 6: "Sat" };

interface MasterTimetableGridProps {
  classSections: ClassSection[];
  teachers: SchoolTeacher[];
  subjects: Subject[];
  timetable: MasterTimetable[];
  selectedClassSectionId?: string;
  onClassSectionChange?: (classSectionId: string) => void;
  onCellSelect?: (cell: MasterTimetable | undefined, day: SchoolDay, period: SchoolPeriod) => void;
  compact?: boolean;
}

export function MasterTimetableGrid({
  classSections,
  teachers,
  subjects,
  timetable,
  selectedClassSectionId,
  onClassSectionChange,
  onCellSelect,
  compact = false,
}: MasterTimetableGridProps): JSX.Element {
  const selectedClass = selectedClassSectionId ?? classSections[0]?.id;
  const timetableByKey = useMemo(() => new Map(timetable.map((cell) => [`${cell.classSectionId}:${cell.dayOfWeek}:${cell.period}`, cell])), [timetable]);
  const teacherById = useMemo(() => new Map(teachers.map((teacher) => [teacher.id, teacher])), [teachers]);
  const subjectById = useMemo(() => new Map(subjects.map((subject) => [subject.id, subject])), [subjects]);

  return (
    <section className="print-area overflow-hidden rounded-xl border border-slate-200/80 bg-white shadow-sm" aria-label="Master weekly timetable">
      <div className="flex flex-col gap-3 border-b border-slate-100 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-50 text-indigo-600"><CalendarDays size={18} /></div>
          <div><h2 className="text-base font-semibold text-slate-900">Master weekly timetable</h2><p className="text-xs text-slate-500">The static routine used for daily substitutions.</p></div>
        </div>
        {classSections.length > 0 && (
          <label className="relative flex items-center gap-2 text-sm font-semibold text-slate-700">
            <span className="sr-only">Class and section</span>
            <select className="appearance-none rounded-lg border bg-white py-2 pl-3 pr-9 text-sm outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/20" value={selectedClass} onChange={(event) => onClassSectionChange?.(event.target.value)}>
              {classSections.map((classSection) => <option key={classSection.id} value={classSection.id}>Class {classSection.className}-{classSection.section}</option>)}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 text-slate-400" size={15} />
          </label>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className={cn("w-full min-w-[760px] table-fixed text-sm", compact && "min-w-[680px]")}>
          <thead><tr className="bg-slate-50/80"><th className="w-20 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Period</th>{SCHOOL_DAYS.map((day) => <th key={day} className="px-3 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">{dayNames[day]}</th>)}</tr></thead>
          <tbody className="divide-y divide-slate-100">
            {SCHOOL_PERIODS.map((period) => <Fragment key={period}><tr>
              <th scope="row" className="bg-slate-50/45 px-4 py-3 text-left align-top"><span className="font-mono text-xs font-semibold text-slate-700">P{period}</span><span className="block font-mono text-[11px] font-normal text-slate-400">{PERIODS[period - 1]?.start}</span></th>
              {SCHOOL_DAYS.map((day) => {
                const cell = timetableByKey.get(`${selectedClass}:${day}:${period}`);
                const subject = cell?.subjectId ? subjectById.get(cell.subjectId) : undefined;
                const teacher = cell?.assignedTeacherId ? teacherById.get(cell.assignedTeacherId) : undefined;
                return <td key={day} className="p-1.5 align-top">
                  <button type="button" title={cell && subject ? `${subject.name} · ${teacher?.name ?? "Unassigned"} · click to edit` : "Free period · click to assign"} className={cn("min-h-[76px] w-full rounded-md border p-2 text-left transition focus:outline-none focus:ring-4 focus:ring-indigo-500/20", cell && subject ? cn("border-slate-200 hover:border-indigo-300", SUBJECT_ACCENT[subjectCategory(subject.name)]) : "border-dashed border-slate-200 bg-slate-50/50 hover:border-indigo-300")} onClick={() => onCellSelect?.(cell, day, period)} aria-label={`${dayNames[day]} period ${period}${subject ? `, ${subject.name}` : ", free period"}`}>
                    {cell && subject ? <><p className="truncate text-sm font-medium text-slate-900">{subject.name}</p><p className="mt-1 flex items-center gap-1.5 truncate text-xs text-slate-500">{teacher ? <span className={cn("rounded border px-1 font-mono text-[10px] font-semibold", teacher.category === "PGT" ? "border-violet-200 bg-violet-50 text-violet-700" : "border-sky-200 bg-sky-50 text-sky-700")}>{teacher.category}</span> : <UserRound size={12} />}{teacher?.name ?? "Teacher unassigned"}</p>{cell.room && <p className="mt-1 font-mono text-[11px] text-slate-400">{cell.room}</p>}</> : <span className="flex h-full min-h-[42px] items-center justify-center text-xs text-slate-400">Free</span>}
                  </button>
                </td>;
              })}
            </tr>
            {period === 4 ? <tr><td colSpan={SCHOOL_DAYS.length + 1} className="border-y border-dashed border-amber-300 bg-amber-50 px-4 py-1.5 text-center text-xs font-semibold text-amber-800">Lunch Recess · 20 min <span className="ml-2 font-mono font-normal">{LUNCH.start} - {LUNCH.end}</span></td></tr> : null}
            </Fragment>)}
          </tbody>
        </table>
      </div>
    </section>
  );
}
