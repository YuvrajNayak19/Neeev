import { Bell, CalendarDays, Clock3, UserRound } from "lucide-react";
import { SCHOOL_PERIODS, type ClassSection, type DailySubstitution, type MasterTimetable, type SchoolDay, type SchoolPeriod, type SchoolTeacher, type Subject } from "../../types/school-domain";
import { cn } from "../../lib/utils";

interface StudentClassScheduleViewProps {
  classSections: ClassSection[];
  selectedClassSectionId: string;
  date: string;
  dayOfWeek: SchoolDay;
  timetable: MasterTimetable[];
  substitutions: DailySubstitution[];
  subjects: Subject[];
  teachers: SchoolTeacher[];
  onClassChange: (classSectionId: string) => void;
}

export function StudentClassScheduleView({ classSections, selectedClassSectionId, date, dayOfWeek, timetable, substitutions, subjects, teachers, onClassChange }: StudentClassScheduleViewProps): JSX.Element {
  const selectedClass = classSections.find((classSection) => classSection.id === selectedClassSectionId);
  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const scheduleByPeriod = new Map(timetable.filter((cell) => cell.classSectionId === selectedClassSectionId && cell.dayOfWeek === dayOfWeek).map((cell) => [cell.period, cell]));
  const substitutionsByPeriod = new Map(substitutions.filter((substitution) => substitution.classSectionId === selectedClassSectionId && substitution.date === date).map((substitution) => [substitution.period, substitution]));

  return <main className="min-h-screen bg-slate-50 px-4 py-8 sm:px-7 lg:px-10"><div className="mx-auto max-w-5xl space-y-6"><header className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><div className="flex items-center gap-2 text-sm font-semibold text-blue-700"><CalendarDays size={16} /> Student timetable</div><h1 className="mt-2 font-['Outfit'] text-3xl font-bold tracking-tight text-slate-950">Class {selectedClass?.className ?? "-"}-{selectedClass?.section ?? "-"}</h1><p className="mt-1 text-sm text-slate-500">Live schedule for {date}. Changes from the school office appear here.</p></div><label className="relative"><span className="sr-only">Choose class section</span><select value={selectedClassSectionId} onChange={(event) => onClassChange(event.target.value)} className="rounded-lg border bg-white px-3 py-2.5 pr-9 text-sm font-semibold text-slate-700 outline-none focus:border-blue-500">{classSections.map((classSection) => <option key={classSection.id} value={classSection.id}>Class {classSection.className}-{classSection.section}</option>)}</select></label></header><div className="flex items-center gap-3 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900"><Bell size={17} /><span>Live updates are shown with a blue <strong>cover</strong> label.</span></div><section className="panel overflow-hidden"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-['Outfit'] text-lg font-bold text-slate-900">Today&apos;s classes</h2><p className="text-xs text-slate-500">Regular routine with approved substitutions.</p></div><div className="grid gap-3 p-4 sm:grid-cols-2">{SCHOOL_PERIODS.map((period) => { const cell = scheduleByPeriod.get(period); const substitution = substitutionsByPeriod.get(period); const subject = cell?.subjectId ? subjectById.get(cell.subjectId) : undefined; const teacher = cell?.assignedTeacherId ? teacherById.get(cell.assignedTeacherId) : undefined; const substitute = substitution?.substituteTeacherId ? teacherById.get(substitution.substituteTeacherId) : undefined; return <StudentPeriodCard key={period} period={period} cell={cell} substitution={substitution} subject={subject} teacher={teacher} substitute={substitute} />; })}</div></section></div></main>;
}

function StudentPeriodCard({ period, cell, substitution, subject, teacher, substitute }: { period: SchoolPeriod; cell: MasterTimetable | undefined; substitution: DailySubstitution | undefined; subject: Subject | undefined; teacher: SchoolTeacher | undefined; substitute: SchoolTeacher | undefined }): JSX.Element {
  const isFree = !cell?.subjectId;
  return <article className={cn("rounded-xl border p-4", isFree ? "border-dashed border-slate-200 bg-slate-50" : substitution?.status === "assigned" ? "border-blue-200 bg-blue-50/40" : "border-slate-200 bg-white")}><div className="flex items-center justify-between"><span className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.1em] text-slate-400"><Clock3 size={14} />Period {period}</span>{substitution && <span className="rounded-full bg-blue-100 px-2 py-1 text-[11px] font-bold text-blue-800">Cover</span>}</div>{isFree ? <p className="mt-5 text-sm font-semibold text-emerald-700">Free period</p> : <><h3 className="mt-4 text-base font-bold text-slate-900">{subject?.name ?? "Subject"}</h3><p className="mt-1 flex items-center gap-1.5 text-sm text-slate-600"><UserRound size={14} />{substitute?.name ?? teacher?.name ?? "Teacher pending"}</p>{substitute && <p className="mt-2 text-xs text-blue-800">Covering for {teacher?.name ?? "regular teacher"}</p>}{cell?.room && <p className="mt-2 text-xs text-slate-400">Room {cell.room}</p>}</>}</article>;
}
