import { AlertTriangle, CheckCircle2, ClipboardList, RefreshCw, UserRoundX } from "lucide-react";
import type { DailySubstitution, SchoolAbsence, SchoolTeacher } from "../../types/school-domain";
import { cn } from "../../lib/utils";

interface DailyAbsenceAndSubDashboardProps {
  date: string;
  teachers: SchoolTeacher[];
  absences: SchoolAbsence[];
  substitutions: DailySubstitution[];
  isGenerating?: boolean;
  onGenerate: () => void;
  onLogAbsence?: () => void;
  onOverride?: (substitution: DailySubstitution) => void;
}

export function DailyAbsenceAndSubDashboard({ date, teachers, absences, substitutions, isGenerating = false, onGenerate, onLogAbsence, onOverride }: DailyAbsenceAndSubDashboardProps): JSX.Element {
  const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const assigned = substitutions.filter((substitution) => substitution.status === "assigned").length;
  const unassigned = substitutions.length - assigned;
  const coverageRate = substitutions.length === 0 ? 100 : Math.round((assigned / substitutions.length) * 100);

  return <section className="space-y-5" aria-label="Daily absence and substitution operations">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><p className="eyebrow">Daily operations</p><h1 className="mt-1 font-['Outfit'] text-3xl font-bold tracking-tight text-slate-950">Substitution command center</h1><p className="mt-1.5 text-sm text-slate-500">{date} · Review absences, generate cover, and resolve exceptions.</p></div><div className="flex gap-2"><button type="button" onClick={onLogAbsence} className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"><UserRoundX size={16} /> Log absence</button><button type="button" onClick={onGenerate} disabled={isGenerating} className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-wait disabled:opacity-60"><RefreshCw size={16} className={cn(isGenerating && "animate-spin")} /> {isGenerating ? "Generating..." : "Generate cover"}</button></div></div>
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4"><StatCard label="Absent today" value={absences.length} icon={<UserRoundX size={18} />} tone="amber" /><StatCard label="Periods to cover" value={substitutions.length} icon={<ClipboardList size={18} />} tone="blue" /><StatCard label="Assigned" value={assigned} icon={<CheckCircle2 size={18} />} tone="emerald" /><StatCard label="Readiness" value={`${coverageRate}%`} icon={<AlertTriangle size={18} />} tone={unassigned ? "rose" : "emerald"} /></div>
    <section className="panel overflow-hidden"><div className="flex items-center justify-between border-b border-slate-100 px-5 py-4"><div><h2 className="font-['Outfit'] text-lg font-bold text-slate-900">Live substitution plan</h2><p className="text-xs text-slate-500">Every row maps to a real class timetable slot.</p></div>{unassigned > 0 && <span className="rounded-full bg-rose-50 px-2.5 py-1 text-xs font-semibold text-rose-700">{unassigned} need attention</span>}</div><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm"><thead className="bg-slate-50/70"><tr><th className="table-header px-5 py-3">Period</th><th className="table-header px-5 py-3">Class / subject</th><th className="table-header px-5 py-3">Regular teacher</th><th className="table-header px-5 py-3">Cover teacher</th><th className="table-header px-5 py-3">Decision</th><th className="table-header px-5 py-3">Action</th></tr></thead><tbody className="divide-y divide-slate-100">{substitutions.map((substitution) => { const regular = teacherById.get(substitution.regularTeacherId); const substitute = substitution.substituteTeacherId ? teacherById.get(substitution.substituteTeacherId) : undefined; return <tr key={substitution.id}><td className="px-5 py-4 font-bold text-slate-700">P{substitution.period}</td><td className="px-5 py-4"><p className="font-semibold text-slate-800">{substitution.classSectionId}</p><p className="text-xs text-slate-500">{substitution.subjectId ?? "Subject pending"}</p></td><td className="px-5 py-4 text-slate-600">{regular?.name ?? substitution.regularTeacherId}</td><td className="px-5 py-4 font-medium text-slate-700">{substitute?.name ?? "Unassigned"}</td><td className="px-5 py-4"><span className={cn("inline-flex rounded-full px-2.5 py-1 text-xs font-semibold", substitution.status === "assigned" ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700")}>{substitution.status}</span><p className="mt-1 max-w-[240px] text-xs text-slate-400">{substitution.matchReason}</p></td><td className="px-5 py-4">{onOverride && <button type="button" className="text-xs font-semibold text-blue-700 hover:text-blue-900" onClick={() => onOverride(substitution)}>Override</button>}</td></tr>; })}</tbody></table>{substitutions.length === 0 && <div className="px-6 py-12 text-center text-sm text-slate-500">No generated substitutions for this date.</div>}</div></section>
  </section>;
}

function StatCard({ label, value, icon, tone }: { label: string; value: number | string; icon: React.ReactNode; tone: "amber" | "blue" | "emerald" | "rose" }): JSX.Element {
  const styles = { amber: "bg-amber-50 text-amber-700", blue: "bg-blue-50 text-blue-700", emerald: "bg-emerald-50 text-emerald-700", rose: "bg-rose-50 text-rose-700" };
  return <article className="panel p-4"><div className="flex items-start justify-between"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 font-['Outfit'] text-3xl font-bold text-slate-900">{value}</p></div><div className={cn("grid h-9 w-9 place-items-center rounded-xl", styles[tone])}>{icon}</div></div></article>;
}
