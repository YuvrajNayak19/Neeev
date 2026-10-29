import { CalendarDays, ChevronLeft, ChevronRight, ClipboardList, History, LayoutGrid, LayoutDashboard, Menu, School, Users, X } from "lucide-react";
import { useState } from "react";
import type { DashboardStats, SchoolSession } from "../../types/domain";
import { cn, initials } from "../../lib/utils";
import { displayDate } from "../../lib/date";

export type AppPage = "overview" | "teachers" | "absences" | "coverage" | "history" | "timetable";

interface AppShellProps {
  activePage: AppPage;
  onPageChange: (page: AppPage) => void;
  selectedDate: string;
  onDateChange: (date: string) => void;
  session: SchoolSession;
  stats?: DashboardStats;
  children: React.ReactNode;
}

const navigation: { page: AppPage; label: string; icon: typeof LayoutDashboard }[] = [
  { page: "overview", label: "Overview", icon: LayoutDashboard },
  { page: "teachers", label: "Teacher roster", icon: Users },
  { page: "absences", label: "Absence log", icon: ClipboardList },
  { page: "coverage", label: "Daily coverage", icon: CalendarDays },
  { page: "history", label: "Schedule history", icon: History },
  { page: "timetable", label: "Timetable workspace", icon: LayoutGrid },
];

function Sidebar({ activePage, onPageChange, collapsed, onToggle, mobile = false }: Pick<AppShellProps, "activePage" | "onPageChange"> & { collapsed: boolean; onToggle: () => void; mobile?: boolean }): JSX.Element {
  return <aside className={cn("flex h-full flex-col bg-slate-950 px-3 py-5", mobile ? "w-[280px]" : collapsed ? "w-[76px]" : "w-[254px]")}>
    <div className={cn("mb-8 flex items-center", collapsed && !mobile ? "justify-center" : "justify-between px-1")}>
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-500 text-white shadow-lg shadow-blue-500/20"><School size={21} strokeWidth={2.4} /></div>
        {(!collapsed || mobile) && <div><p className="font-['Outfit'] text-lg font-bold tracking-tight text-white">Timely</p><p className="text-[10px] font-bold uppercase tracking-[0.14em] text-slate-500">School operations</p></div>}
      </div>
      {mobile && <button aria-label="Close navigation" className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white" onClick={onToggle}><X size={19} /></button>}
    </div>

    <nav className="space-y-1">
      {navigation.map(({ page, label, icon: Icon }) => <button key={page} onClick={() => onPageChange(page)} className={cn("nav-item", activePage === page && "nav-item-active", collapsed && !mobile && "justify-center px-0")} title={collapsed && !mobile ? label : undefined}><Icon size={19} strokeWidth={2} /><span className={cn("whitespace-nowrap", collapsed && !mobile && "sr-only")}>{label}</span></button>)}
    </nav>

    <div className={cn("mt-auto rounded-xl border border-white/10 bg-white/[0.045] p-3", collapsed && !mobile && "border-0 bg-transparent p-0")}>
      {(!collapsed || mobile) ? <><p className="text-xs font-semibold text-white">Need a hand?</p><p className="mt-1 text-xs leading-5 text-slate-500">Use the daily coverage board to publish schedules.</p></> : <button className="grid h-10 w-full place-items-center rounded-xl text-slate-400 hover:bg-white/10"><CalendarDays size={18} /></button>}
    </div>
  </aside>;
}

export function AppShell({ activePage, onPageChange, selectedDate, onDateChange, session, stats, children }: AppShellProps): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const visibleStats = stats ?? { totalTeachers: 0, todayAbsences: 0, coverageRequired: 0, unassignedCoverages: 0 };

  const changePage = (page: AppPage): void => { onPageChange(page); setMobileOpen(false); };

  return <div className="min-h-screen bg-slate-50 lg:flex">
    <div className="no-print fixed inset-y-0 left-0 z-30 hidden lg:block"><Sidebar activePage={activePage} onPageChange={changePage} collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} /></div>
    {mobileOpen && <div className="no-print fixed inset-0 z-50 lg:hidden"><button aria-label="Close navigation overlay" className="absolute inset-0 h-full w-full bg-slate-950/45" onClick={() => setMobileOpen(false)} /><div className="relative h-full shadow-2xl"><Sidebar activePage={activePage} onPageChange={changePage} collapsed={false} mobile onToggle={() => setMobileOpen(false)} /></div></div>}

    <div className={cn("min-w-0 flex-1 transition-[margin] duration-200", collapsed ? "lg:ml-[76px]" : "lg:ml-[254px]")}>
      <header className="no-print sticky top-0 z-20 border-b border-slate-200/80 bg-slate-50/90 px-4 py-3 backdrop-blur-xl sm:px-7 lg:px-10">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <button aria-label="Open navigation" className="rounded-lg p-2 text-slate-500 hover:bg-white lg:hidden" onClick={() => setMobileOpen(true)}><Menu size={21} /></button>
            <button aria-label="Collapse navigation" className="hidden rounded-lg p-2 text-slate-500 hover:bg-white lg:block" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}</button>
            <div className="hidden min-w-0 sm:block"><p className="truncate text-sm font-bold text-slate-800">{session.schoolName}</p><p className="truncate text-xs text-slate-400">Academic operations workspace</p></div>
          </div>
          <div className="flex items-center gap-2.5 sm:gap-4">
            <label className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-sm font-medium text-slate-600 shadow-sm"><CalendarDays size={16} className="text-blue-600" /><input aria-label="Active date" className="w-[115px] bg-transparent text-xs outline-none sm:w-[132px] sm:text-sm" type="date" value={selectedDate} onChange={(event) => onDateChange(event.target.value)} /></label>
            <div className="hidden items-center gap-2 border-l border-slate-200 pl-4 sm:flex"><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">{initials(session.userName)}</div><div className="hidden xl:block"><p className="text-sm font-semibold text-slate-800">{session.userName}</p><p className="text-[11px] capitalize text-slate-400">{session.role}</p></div></div>
          </div>
        </div>
      </header>
      <main className="px-4 py-6 sm:px-7 lg:px-10 lg:py-8">{children}</main>
      <footer className="no-print px-4 pb-6 text-center text-xs text-slate-400 sm:px-7 lg:px-10">Operating plan for {displayDate(selectedDate, { weekday: undefined })} · {visibleStats.coverageRequired} coverage {visibleStats.coverageRequired === 1 ? "slot" : "slots"}</footer>
    </div>
  </div>;
}
