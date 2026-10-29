import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, ClipboardList, Users } from "lucide-react";
import { useAbsences, useSchedule, useStats } from "../../hooks/use-timely";
import { displayDate, relativeGreeting } from "../../lib/date";
import { StatusBadge } from "../ui/status-badge";
import type { AppPage } from "../layout/app-shell";

interface DashboardPageProps {
  date: string;
  onNavigate: (page: AppPage) => void;
  userName: string;
}

function StatCard({ label, value, description, icon: Icon, tone }: { label: string; value: string | number; description: string; icon: typeof Users; tone: "blue" | "amber" | "rose" | "violet" }): JSX.Element {
  const tones = {
    blue: "bg-blue-50 text-blue-600",
    amber: "bg-amber-50 text-amber-600",
    rose: "bg-rose-50 text-rose-600",
    violet: "bg-violet-50 text-violet-600",
  };
  return <article className="panel p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-medium text-slate-500">{label}</p><p className="mt-2 font-['Outfit'] text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-2 text-xs text-slate-400">{description}</p></div><div className={`grid h-10 w-10 place-items-center rounded-xl ${tones[tone]}`}><Icon size={20} /></div></div></article>;
}

export function DashboardPage({ date, onNavigate, userName }: DashboardPageProps): JSX.Element {
  const { data: stats, isLoading: statsLoading } = useStats(date);
  const { data: schedule, isLoading: scheduleLoading } = useSchedule(date);
  const { data: absences } = useAbsences(date);
  const assignments = schedule?.assignments ?? [];
  const assigned = assignments.filter((assignment) => assignment.status === "assigned").length;
  const coverageRate = assignments.length ? Math.round((assigned / assignments.length) * 100) : 100;
  const isLoading = statsLoading || scheduleLoading;

  return <section className="space-y-7">
    <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div><p className="eyebrow">Daily command center</p><h1 className="mt-1 font-['Outfit'] text-3xl font-bold tracking-tight text-slate-950">{relativeGreeting()}, {userName}</h1><p className="mt-1.5 text-sm text-slate-500">Here’s the operational picture for {displayDate(date)}.</p></div>
      <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-slate-900/10 hover:bg-slate-800" onClick={() => onNavigate("absences")}><ClipboardList size={17} />Log an absence</button>
    </div>

    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {isLoading ? Array.from({ length: 4 }, (_, index) => <div key={index} className="panel h-[142px] p-5"><div className="skeleton h-4 w-24" /><div className="skeleton mt-4 h-8 w-12" /><div className="skeleton mt-4 h-3 w-32" /></div>) : <>
        <StatCard label="Total teachers" value={stats?.totalTeachers ?? 0} description="Active roster members" icon={Users} tone="blue" />
        <StatCard label="Today’s absences" value={stats?.todayAbsences ?? 0} description="Teachers reported away" icon={CalendarClock} tone="amber" />
        <StatCard label="Coverage required" value={stats?.coverageRequired ?? 0} description="Periods needing cover" icon={ClipboardList} tone="violet" />
        <StatCard label="Unassigned" value={stats?.unassignedCoverages ?? 0} description="Needs admin review" icon={AlertTriangle} tone="rose" />
      </>}
    </div>

    <div className="grid gap-5 xl:grid-cols-[1.55fr_0.9fr]">
      <section className="panel overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4 sm:px-6"><div><h2 className="font-['Outfit'] text-lg font-bold text-slate-900">Coverage at a glance</h2><p className="mt-0.5 text-sm text-slate-500">Generated assignments for today’s absent periods</p></div><button className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-700 hover:text-blue-800" onClick={() => onNavigate("coverage")}>Open board <ArrowRight size={15} /></button></div>
        {!schedule && !scheduleLoading ? <div className="flex min-h-[260px] flex-col items-center justify-center px-6 text-center"><div className="grid h-12 w-12 place-items-center rounded-2xl bg-blue-50 text-blue-600"><ClipboardList size={23} /></div><h3 className="mt-4 font-semibold text-slate-800">No plan generated yet</h3><p className="mt-1 max-w-sm text-sm leading-6 text-slate-500">Log absences, then generate a balanced coverage plan for the day.</p><button className="mt-4 text-sm font-semibold text-blue-700 hover:text-blue-800" onClick={() => onNavigate("coverage")}>Go to daily coverage</button></div> : <div className="overflow-x-auto"><table className="w-full min-w-[550px] text-sm"><thead className="bg-slate-50/70"><tr><th className="table-header px-5 py-3 sm:px-6">Period</th><th className="table-header px-5 py-3">Absent teacher</th><th className="table-header px-5 py-3">Coverage</th><th className="table-header px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100">{assignments.slice(0, 5).map((assignment) => <tr key={assignment.id}><td className="px-5 py-3.5 font-semibold text-slate-700 sm:px-6">P{assignment.period}</td><td className="px-5 py-3.5"><p className="font-medium text-slate-700">{assignment.absentTeacherName}</p><p className="text-xs text-slate-400">{assignment.classSubject}</p></td><td className="px-5 py-3.5 text-slate-600">{assignment.coveringTeacherName ?? "—"}</td><td className="px-5 py-3.5"><StatusBadge status={assignment.status} /></td></tr>)}</tbody></table>{assignments.length > 5 && <div className="border-t border-slate-100 px-6 py-3 text-center text-sm text-slate-400">+ {assignments.length - 5} more assignments on the coverage board</div>}</div>}
      </section>

      <aside className="panel p-5 sm:p-6"><div className="flex items-center gap-2"><div className="grid h-8 w-8 place-items-center rounded-lg bg-emerald-50 text-emerald-600"><CheckCircle2 size={17} /></div><div><h2 className="font-['Outfit'] font-bold text-slate-900">Readiness score</h2><p className="text-xs text-slate-400">Live schedule health</p></div></div><div className="mt-7 flex items-end gap-4"><div className="relative grid h-[118px] w-[118px] place-items-center rounded-full" style={{ background: `conic-gradient(#2563eb ${coverageRate * 3.6}deg, #e2e8f0 0deg)` }}><div className="grid h-[92px] w-[92px] place-items-center rounded-full bg-white"><div className="text-center"><p className="font-['Outfit'] text-2xl font-bold text-slate-900">{coverageRate}%</p><p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">covered</p></div></div></div><p className="max-w-[160px] pb-2 text-sm leading-6 text-slate-500">{assignments.length ? `${assigned} of ${assignments.length} required periods have a qualified teacher.` : "Your schedule is clear. New absences will appear here."}</p></div><div className="mt-7 border-t border-slate-100 pt-4"><p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Logged today</p>{absences?.length ? <div className="mt-3 space-y-3">{absences.slice(0, 3).map((absence) => <div key={absence.id} className="flex items-center justify-between text-sm"><span className="font-medium text-slate-700">{absence.teacherId}</span><span className="rounded-md bg-amber-50 px-2 py-1 text-xs font-semibold text-amber-700">{absence.periods.length} periods</span></div>)}</div> : <p className="mt-3 text-sm text-slate-400">No absences logged for this date.</p>}</div></aside>
    </div>
  </section>;
}
