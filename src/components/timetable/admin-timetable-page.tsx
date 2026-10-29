import {
  AlertTriangle,
  ArrowDownToLine,
  Bell,
  BookOpen,
  Building2,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Command,
  GraduationCap,
  LayoutGrid,
  LoaderCircle,
  LockKeyhole,
  MoreHorizontal,
  RefreshCw,
  Search,
  Settings2,
  Sparkles,
  Users,
  X,
} from "lucide-react";
import { Fragment, useEffect, useMemo, useRef, useState, type KeyboardEvent } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CommandMenu, CoverageRing, Dialog, MetricCard, TimetableCell } from "@/components/design-system/timetable-primitives";
import { BUSIEST_TEACHERS, createClassTenSeed, PERIOD_TIMES, SCHOOL_DAYS, type TimetableEntry } from "@/lib/timetable-seed";
import { cn } from "@/lib/utils";

type LoadState = "loading" | "ready" | "empty" | "error";
type ViewMode = "class" | "teacher" | "room";
type GenerationStep = "loading" | "placing" | "checking" | "saving" | "complete";

const generationSteps: { id: Exclude<GenerationStep, "complete">; label: string; detail: string }[] = [
  { id: "loading", label: "Loading school data", detail: "Checking classes, staff and subject rules" },
  { id: "placing", label: "Placing periods", detail: "Balancing the weekly teaching plan" },
  { id: "checking", label: "Checking clashes", detail: "Validating teacher and room availability" },
  { id: "saving", label: "Saving timetable", detail: "Preparing the schedule for review" },
];

const modeLabel: Record<ViewMode, string> = { class: "Class", teacher: "Teacher", room: "Room" };

export function AdminTimetablePage() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [view, setView] = useState<ViewMode>("class");
  const [weekOffset, setWeekOffset] = useState(0);
  const [selectedDay, setSelectedDay] = useState(todaySchoolDayIndex());
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [generationStep, setGenerationStep] = useState<GenerationStep>("loading");
  const [isGenerating, setIsGenerating] = useState(false);
  const [cellsAnimating, setCellsAnimating] = useState(false);
  const [animationKey, setAnimationKey] = useState(0);
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const generationTimers = useRef<number[]>([]);

  useEffect(() => {
    document.title = "Timetable | EduSync";
    let active = true;
    const timer = window.setTimeout(() => {
      if (!active) return;
      try {
        setEntries(createClassTenSeed());
        setLoadState("ready");
      } catch {
        setLoadState("error");
      }
    }, 420);
    return () => {
      active = false;
      window.clearTimeout(timer);
      generationTimers.current.forEach(window.clearTimeout);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent | globalThis.KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        window.dispatchEvent(new Event("edusync-open-command"));
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  const [isCommandOpen, setIsCommandOpen] = useState(false);
  useEffect(() => {
    const open = () => setIsCommandOpen(true);
    window.addEventListener("edusync-open-command", open);
    return () => window.removeEventListener("edusync-open-command", open);
  }, []);

  const bySlot = useMemo(() => new Map(entries.map((entry) => [`${entry.dayIndex}:${entry.period}`, entry])), [entries]);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const currentPeriod = getCurrentPeriod();
  const currentDayIndex = todaySchoolDayIndex();

  const loadSchedule = () => {
    setLoadState("loading");
    window.setTimeout(() => {
      try {
        setEntries(createClassTenSeed());
        setLoadState("ready");
      } catch {
        setLoadState("error");
      }
    }, 400);
  };

  const startGeneration = () => {
    generationTimers.current.forEach(window.clearTimeout);
    generationTimers.current = [];
    setIsGenerating(true);
    setGenerationStep("loading");
    setIsGenerateOpen(true);
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    generationSteps.forEach((step, index) => {
      const timer = window.setTimeout(() => {
        setGenerationStep(step.id);
        if (index === generationSteps.length - 1) {
          setEntries(createClassTenSeed());
          setLoadState("ready");
          setAnimationKey((key) => key + 1);
          setCellsAnimating(true);
          generationTimers.current.push(window.setTimeout(() => setCellsAnimating(false), 48 * 30 + 200));
          setGenerationStep("complete");
          setIsGenerating(false);
        }
      }, reducedMotion ? index * 120 : index * 580);
      generationTimers.current.push(timer);
    });
  };

  const focusCell = (dayIndex: number, period: number) => {
    const visibleDay = window.innerWidth < 1024 ? selectedDay : dayIndex;
    const cellIndex = window.innerWidth < 1024 ? period - 1 : (period - 1) * SCHOOL_DAYS.length + dayIndex;
    cellRefs.current[visibleDay === dayIndex || window.innerWidth >= 1024 ? cellIndex : period - 1]?.focus();
  };

  const onGridCellKeyDown = (event: KeyboardEvent<HTMLButtonElement>, dayIndex: number, period: number) => {
    let nextDay = dayIndex;
    let nextPeriod = period;
    if (event.key === "ArrowRight") nextDay = (dayIndex + 1) % SCHOOL_DAYS.length;
    else if (event.key === "ArrowLeft") nextDay = (dayIndex + SCHOOL_DAYS.length - 1) % SCHOOL_DAYS.length;
    else if (event.key === "ArrowDown") nextPeriod = Math.min(8, period + 1);
    else if (event.key === "ArrowUp") nextPeriod = Math.max(1, period - 1);
    else return;
    event.preventDefault();
    if (window.innerWidth < 1024 && nextDay !== selectedDay) {
      setSelectedDay(nextDay);
      window.setTimeout(() => focusCell(nextDay, nextPeriod), 0);
    } else {
      focusCell(nextDay, nextPeriod);
    }
  };

  const entryForView = (entry: TimetableEntry): TimetableEntry => {
    if (view === "teacher") return { ...entry, displayPrimary: entry.teacher, displaySecondary: entry.subject, displayMeta: entry.room };
    if (view === "room") return { ...entry, displayPrimary: entry.room, displaySecondary: `${entry.teacher} · ${entry.subject}`, displayMeta: `P${entry.period}` };
    return entry;
  };

  return (
    <main className="edusync-timetable min-h-screen bg-[#f5f6f8] text-[#171923]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col bg-[#030416] px-3 py-4 text-white lg:flex">
          <div className="mb-8 flex items-center gap-3 px-2.5">
            <div className="grid size-8 place-items-center rounded-[9px] bg-[#644fe0]"><GraduationCap className="size-[18px]" /></div>
            <div><div className="text-[15px] font-semibold">EduSync</div><div className="mt-0.5 text-[12px] text-[#b9bdce]">Greenfield Public School</div></div>
            <ChevronDown className="ml-auto size-4 text-[#a6abc0]" />
          </div>
          <div className="mb-2 px-2.5 font-mono text-[11px] uppercase text-[#b0b5c8]">School workspace</div>
          <nav className="space-y-1" aria-label="Admin navigation">
            <SideNavItem icon={LayoutGrid} label="Overview" />
            <SideNavItem icon={CalendarDays} label="Timetable" active />
            <SideNavItem icon={RefreshCw} label="Substitutions" count="3" />
            <SideNavItem icon={Users} label="Teachers" />
            <SideNavItem icon={BookOpen} label="Classes & subjects" />
            <SideNavItem icon={Bell} label="Requests" />
          </nav>
          <div className="mt-8 mb-2 px-2.5 font-mono text-[11px] uppercase text-[#b0b5c8]">Manage</div>
          <nav className="space-y-1" aria-label="School management">
            <SideNavItem icon={Building2} label="Rooms & facilities" />
            <SideNavItem icon={Settings2} label="School settings" />
          </nav>
          <div className="mt-auto rounded-xl border border-white/10 bg-white/[0.04] p-3">
            <div className="flex items-center gap-2"><span className="size-2 rounded-full bg-[#40c994]" /><span className="text-[12px] font-medium">All systems normal</span></div>
            <div className="mt-3 flex items-center gap-2.5 border-t border-white/10 pt-3">
              <Avatar className="size-8"><AvatarFallback className="bg-[#dcd6ff] text-[12px] font-semibold text-[#34239b]">AD</AvatarFallback></Avatar>
              <div><div className="text-[12px] font-semibold">Ananya Desai</div><div className="mt-0.5 text-[12px] text-[#b9bdce]">School admin</div></div>
              <MoreHorizontal className="ml-auto size-4 text-[#b9bdce]" />
            </div>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-30 flex h-[56px] items-center justify-between border-b border-[#e3e5eb] bg-white/95 px-4 backdrop-blur sm:px-6 lg:px-8">
            <div className="flex min-w-0 items-center gap-2 text-[12px]">
              <span className="font-semibold text-[#292d3a] lg:hidden">EduSync</span>
              <span className="hidden text-[#596273] lg:inline">Workspace</span><span className="text-[#a0a6b2]">/</span><span className="hidden text-[#596273] sm:inline">Academic</span><span className="hidden text-[#a0a6b2] sm:inline">/</span><span className="truncate font-medium text-[#292d3a]">Timetable</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Button variant="ghost" size="icon" className="size-9 rounded-lg text-[#596273] hover:bg-[#f1f3f7]" aria-label="Search" onClick={() => setIsCommandOpen(true)}><Search /></Button>
              <Button variant="ghost" size="icon" className="relative size-9 rounded-lg text-[#596273] hover:bg-[#f1f3f7]" aria-label="Notifications"><Bell /><span className="absolute right-2 top-2 size-1.5 rounded-full bg-[#c84646] ring-2 ring-white" /></Button>
              <Avatar className="ml-1 size-8"><AvatarFallback className="bg-[#e9e6ff] text-[12px] font-semibold text-[#442dc5]">AD</AvatarFallback></Avatar>
            </div>
          </header>

          <div className="mx-auto max-w-[1600px] px-4 pb-8 sm:px-6 lg:px-7">
            <section className="border-b border-[#e3e5eb] py-5">
              <div className="flex flex-col justify-between gap-4 xl:flex-row xl:items-end">
                <div className="flex items-start justify-between gap-3">
                  <div><div className="mb-1 font-mono text-[11px] uppercase text-[#596273]">Academic year 2026–27</div><h1 className="text-[24px] font-semibold leading-8 tracking-[-0.5px]">Master timetable</h1><p className="mt-1 text-[12px] text-[#596273]">Review class coverage and make changes to the weekly routine.</p></div>
                  <Button variant="outline" size="icon" className="mt-1 size-9 shrink-0 rounded-lg border-[#dfe2e9] bg-white text-[#596273] xl:hidden" aria-label="More timetable actions"><MoreHorizontal /></Button>
                </div>
                <Button onClick={startGeneration} disabled={isGenerating || loadState === "loading"} className="h-10 w-full gap-2 rounded-lg bg-[#442dc5] px-4 text-[14px] font-semibold text-white shadow-[0_3px_8px_rgba(68,45,197,0.16)] hover:bg-[#3822b2] sm:w-auto"><Sparkles className="size-4" />Auto-generate timetable</Button>
              </div>

              <div className="mt-5 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <Select defaultValue="10-a"><SelectTrigger aria-label="Select class" className="h-9 w-full rounded-lg border-[#dfe2e9] bg-white text-[14px] font-medium sm:w-[190px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="10-a">Class 10-A</SelectItem><SelectItem value="10-b">Class 10-B</SelectItem><SelectItem value="9-a">Class 9-A</SelectItem><SelectItem value="9-b">Class 9-B</SelectItem></SelectContent></Select>
                  <Tabs value={view} onValueChange={(value) => setView(value as ViewMode)}><TabsList className="h-9 w-full justify-start rounded-lg bg-[#eceef3] p-1 sm:w-auto"><TabsTrigger value="class" className="h-7 flex-1 rounded-md px-3 text-[12px] data-[state=active]:bg-white data-[state=active]:text-[#34239b] data-[state=active]:shadow-sm sm:flex-none">Class</TabsTrigger><TabsTrigger value="teacher" className="h-7 flex-1 rounded-md px-3 text-[12px] data-[state=active]:bg-white data-[state=active]:text-[#34239b] data-[state=active]:shadow-sm sm:flex-none">Teacher</TabsTrigger><TabsTrigger value="room" className="h-7 flex-1 rounded-md px-3 text-[12px] data-[state=active]:bg-white data-[state=active]:text-[#34239b] data-[state=active]:shadow-sm sm:flex-none">Room</TabsTrigger></TabsList></Tabs>
                </div>
                <div className="flex items-center justify-between gap-2 sm:justify-start">
                  <div className="inline-flex h-9 items-center rounded-lg border border-[#e1e4eb] bg-white p-0.5">
                    <Button variant="ghost" size="icon" className="size-8 rounded-md text-[#596273]" aria-label="Previous week" onClick={() => setWeekOffset((week) => week - 1)}><ChevronLeft /></Button>
                    <span className="min-w-[132px] px-1 text-center text-[12px] font-medium text-[#343847]">{formatWeekLabel(weekDates[0], weekDates[5])}</span>
                    <Button variant="ghost" size="icon" className="size-8 rounded-md text-[#596273]" aria-label="Next week" onClick={() => setWeekOffset((week) => week + 1)}><ChevronRight /></Button>
                  </div>
                  <Button variant="outline" className="hidden h-9 gap-1.5 rounded-lg border-[#e1e4eb] bg-white px-3 text-[12px] text-[#454c5b] sm:inline-flex"><ArrowDownToLine className="size-4" />Export</Button>
                  <Button variant="outline" size="icon" className="size-9 rounded-lg border-[#e1e4eb] bg-white text-[#596273] sm:hidden" aria-label="Export timetable"><ArrowDownToLine /></Button>
                </div>
              </div>
            </section>

            <div className="mt-5 grid items-start gap-5 min-[1400px]:grid-cols-[minmax(0,1fr)_320px]">
              <section className="min-w-0" aria-label="Weekly schedule">
                {loadState === "loading" ? <TimetableSkeleton /> : loadState === "error" ? <ErrorState onRetry={loadSchedule} /> : loadState === "empty" ? <EmptyState onGenerate={startGeneration} /> : (
                  <>
                    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2"><h2 className="text-[14px] font-semibold">Class 10-A</h2><Badge variant="outline" className="h-5 rounded-full border-[#dfe2e9] bg-white px-2 text-[12px] font-medium text-[#596273]">48 periods</Badge></div>
                      <div className="flex items-center gap-3 text-[12px] text-[#596273]"><span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-sm bg-sky-500" />STEM</span><span className="hidden items-center gap-1.5 sm:inline-flex"><span className="size-2 rounded-sm bg-amber-500" />Humanities</span><span className="hidden items-center gap-1.5 md:inline-flex"><span className="size-2 rounded-sm bg-violet-500" />Electives</span><span className="hidden items-center gap-1.5 md:inline-flex"><span className="size-2 rounded-sm bg-emerald-600" />Sports</span></div>
                    </div>
                    <div className="mb-3 flex gap-1 overflow-x-auto rounded-lg border border-[#e3e5eb] bg-white p-1 lg:hidden" role="tablist" aria-label="Select a school day">
                      {SCHOOL_DAYS.map((day, dayIndex) => <button key={day} type="button" role="tab" aria-selected={selectedDay === dayIndex} onClick={() => setSelectedDay(dayIndex)} className={cn("flex min-w-[52px] flex-1 flex-col items-center rounded-md px-2 py-1.5 text-[12px] transition-colors", selectedDay === dayIndex ? "bg-[#f0edff] font-semibold text-[#442dc5]" : "text-[#596273] hover:bg-[#f7f7fa]")}><span>{day.slice(0, 3)}</span><span className="mt-0.5 font-mono text-[12px]">{weekDates[dayIndex].getDate()}</span></button>)}
                    </div>

                    <div className="hidden min-w-0 overflow-x-auto rounded-xl border border-[#e2e5eb] bg-white p-2 lg:block">
                      <div className="min-w-[820px]" role="grid" aria-label="Class 10-A weekly timetable" aria-rowcount={10} aria-colcount={7}>
                        <div className="grid grid-cols-[70px_repeat(6,minmax(0,1fr))] gap-1" role="row">
                          <div role="columnheader" className="flex h-[52px] items-center px-2 font-mono text-[11px] uppercase text-[#596273]">Period</div>
                          {SCHOOL_DAYS.map((day, dayIndex) => <div key={day} role="columnheader" className={cn("flex h-[52px] flex-col justify-center rounded-lg px-2", dayIndex === currentDayIndex ? "bg-[#f3f1ff]" : "")}><span className={cn("text-[12px] font-semibold", dayIndex === currentDayIndex ? "text-[#442dc5]" : "text-[#343847]")}>{day.slice(0, 3)}{dayIndex === currentDayIndex ? <span className="ml-1.5 size-1.5 inline-block rounded-full bg-[#5945cf] align-middle" /> : null}</span><span className="mt-0.5 font-mono text-[12px] text-[#596273]">{formatShortDate(weekDates[dayIndex])}{dayIndex === currentDayIndex ? " · Today" : ""}</span></div>)}
                        </div>
                        {Array.from({ length: 8 }, (_, periodIndex) => {
                          const period = periodIndex + 1;
                          return <Fragment key={period}>
                            {period === 5 ? <div role="row" className="my-1 grid grid-cols-[70px_repeat(6,minmax(0,1fr))] gap-1"><div role="rowheader" className="flex h-7 items-center justify-center font-mono text-[11px] uppercase text-[#596273]">11:00</div><div role="gridcell" className="col-span-6 flex h-7 items-center justify-center rounded-md border border-dashed border-[#e4e6ec] bg-[#f7f8fa] text-[12px] font-medium text-[#596273]">Lunch break <span className="ml-2 font-mono text-[12px]">11:00–11:20 AM</span></div></div> : null}
                            <div role="row" className="grid grid-cols-[70px_repeat(6,minmax(0,1fr))] gap-1">
                              <div role="rowheader" className="flex min-h-[84px] flex-col justify-center rounded-lg bg-[#f7f8fa] px-2"><span className="font-mono text-[12px] font-semibold text-[#343847]">P{period}</span><span className="mt-1 font-mono text-[12px] text-[#596273]">{PERIOD_TIMES[periodIndex].start}</span><span className="font-mono text-[12px] text-[#596273]">{PERIOD_TIMES[periodIndex].end}</span></div>
                              {SCHOOL_DAYS.map((day, dayIndex) => {
                                const entry = bySlot.get(`${dayIndex}:${period}`);
                                const cellIndex = periodIndex * SCHOOL_DAYS.length + dayIndex;
                                const isCurrent = dayIndex === currentDayIndex && period === currentPeriod;
                                if (!entry) return <div key={day} role="gridcell" aria-label={`${day} period ${period} unavailable`} className="min-h-[84px] rounded-lg bg-[#fafaff]" />;
                                const visibleEntry = entryForView(entry);
                                return <div key={day} className={cn("relative min-h-[84px] rounded-lg p-0.5", dayIndex === currentDayIndex && "bg-[#f8f7ff]", cellsAnimating && "timetable-cell-enter")} style={{ animationDelay: cellsAnimating ? `${cellIndex * 30}ms` : undefined, animationDuration: "200ms" }}>
                                  {isCurrent ? <span className="absolute -left-1.5 top-1/2 z-10 size-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#5945cf] shadow-[0_0_0_2px_#5945cf]" aria-label="Current period" /> : null}
                                  <TimetableCell ref={(node) => { cellRefs.current[cellIndex] = node; }} data={visibleEntry} className="min-h-[80px]" onKeyDown={(event) => onGridCellKeyDown(event, dayIndex, period)} />
                                </div>;
                              })}
                            </div>
                          </Fragment>;
                        })}
                      </div>
                    </div>

                    <div className="space-y-2 lg:hidden" role="grid" aria-label={`${SCHOOL_DAYS[selectedDay]} timetable for Class 10-A`}>
                      {Array.from({ length: 8 }, (_, periodIndex) => {
                        const period = periodIndex + 1;
                        const entry = bySlot.get(`${selectedDay}:${period}`);
                        const isCurrent = selectedDay === currentDayIndex && period === currentPeriod;
                        const cellIndex = period - 1;
                        return <Fragment key={period}>
                          {period === 5 ? <div className="flex items-center justify-center gap-2 py-1 text-[12px] font-medium text-[#596273]"><span className="h-px flex-1 bg-[#e0e3ea]" />Lunch · 11:00–11:20 AM<span className="h-px flex-1 bg-[#e0e3ea]" /></div> : null}
                          <div role="row" className="grid grid-cols-[76px_minmax(0,1fr)] items-stretch gap-2">
                            <div role="rowheader" className="flex flex-col justify-center rounded-lg bg-white px-2.5"><span className="font-mono text-[12px] font-semibold">P{period}</span><span className="mt-1 font-mono text-[12px] text-[#596273]">{PERIOD_TIMES[periodIndex].start}</span><span className="font-mono text-[12px] text-[#596273]">{PERIOD_TIMES[periodIndex].end}</span></div>
                            {entry ? <div className={cn("relative rounded-lg", cellsAnimating && "timetable-cell-enter")} style={{ animationDelay: cellsAnimating ? `${cellIndex * 30}ms` : undefined }}><TimetableCell ref={(node) => { cellRefs.current[cellIndex] = node; }} data={entryForView(entry)} className="min-h-[82px]" onKeyDown={(event) => onGridCellKeyDown(event, selectedDay, period)} />{isCurrent ? <span className="absolute -left-1.5 top-1/2 z-10 size-2.5 -translate-y-1/2 rounded-full border-2 border-white bg-[#5945cf] shadow-[0_0_0_2px_#5945cf]" aria-label="Current period" /> : null}</div> : <div role="gridcell" aria-label={`${SCHOOL_DAYS[selectedDay]} period ${period} unavailable`} />}
                          </div>
                        </Fragment>;
                      })}
                    </div>
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-[#e3e5eb] pt-3 text-[12px] text-[#596273]"><span className="inline-flex items-center gap-1.5"><LockKeyhole className="size-3.5" /> Locked periods are preserved during generation</span><button type="button" className="inline-flex items-center gap-1 font-medium text-[#5140bd] hover:text-[#34239b]">View timetable rules <ChevronRight className="size-3.5" /></button></div>
                  </>
                )}
              </section>

              <aside className="min-w-0 border-t border-[#e3e5eb] pt-4 min-[1400px]:sticky min-[1400px]:top-[76px] min-[1400px]:border-l min-[1400px]:border-t-0 min-[1400px]:pl-5 min-[1400px]:pt-0" aria-label="Week summary">
                <div className="mb-4 flex items-center justify-between"><div><h2 className="text-[14px] font-semibold">Week summary</h2><p className="mt-1 text-[12px] text-[#596273]">Class 10-A · {formatWeekLabel(weekDates[0], weekDates[5])}</p></div><Button variant="ghost" size="icon" className="size-8 rounded-lg text-[#596273]" aria-label="Summary options"><MoreHorizontal /></Button></div>
                <div className="grid grid-cols-2 gap-2.5">
                  <MetricCard label="Periods placed" value="48/48" detail="100% scheduled" />
                  <MetricCard label="Clashes" value="0" detail="No conflicts found" />
                </div>
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-[#e3e5eb] bg-white p-3.5"><CoverageRing value={100} label="Periods scheduled" /><div><div className="text-[12px] font-medium text-[#596273]">Schedule coverage</div><div className="mt-1 text-[18px] font-semibold">Complete</div><div className="mt-1 text-[12px] text-[#596273]">All 48 periods are placed</div></div></div>
                <div className="mt-3 flex items-center justify-between border-y border-[#e3e5eb] py-3"><div><div className="text-[12px] font-medium text-[#596273]">Last generated</div><div className="mt-1 text-[14px] font-semibold">Today, 08:14 AM</div></div><div className="text-right"><div className="text-[12px] text-[#596273]">Generation time</div><div className="mt-1 font-mono text-[14px] font-semibold">2.4s</div></div></div>
                <div className="mt-4"><div className="mb-3 flex items-center justify-between"><h3 className="text-[13px] font-semibold">Teacher workload</h3><button className="text-[12px] font-medium text-[#5140bd] hover:text-[#34239b]">View all</button></div><p className="mb-3 text-[12px] text-[#596273]">5 busiest teachers this week</p><div className="space-y-3">{BUSIEST_TEACHERS.map((teacher) => <div key={teacher.name}><div className="mb-1 flex items-center justify-between gap-2"><div className="min-w-0"><div className="truncate text-[12px] font-medium">{teacher.name}</div><div className="truncate text-[12px] text-[#596273]">{teacher.subject}</div></div><span className="shrink-0 font-mono text-[12px] text-[#454c5b]">{teacher.periods}/{teacher.capacity}</span></div><div className="h-1.5 overflow-hidden rounded-full bg-[#e9eaf0]"><div className={cn("h-full rounded-full", teacher.periods >= 26 ? "bg-[#644fe0]" : "bg-[#988ae9]")} style={{ width: `${Math.round((teacher.periods / teacher.capacity) * 100)}%` }} /></div></div>)}</div></div>
                <div className="mt-5 rounded-xl border border-[#ece8ff] bg-[#f5f3ff] p-3"><div className="flex items-center gap-2 text-[12px] font-semibold text-[#34239b]"><Sparkles className="size-4" />Generation health</div><p className="mt-1.5 text-[12px] leading-5 text-[#5140bd]">All subject and qualification rules passed. TGT assignments stay within grades 6–10.</p></div>
              </aside>
            </div>
            <footer className="mt-7 flex flex-col gap-1 border-t border-[#e3e5eb] pt-3 text-[12px] text-[#596273] sm:flex-row sm:items-center sm:justify-between"><span>Last synced just now</span><span className="inline-flex items-center gap-1.5"><span className="size-1.5 rounded-full bg-[#18845b]" />Changes saved automatically</span></footer>
          </div>
        </div>
      </div>

      <Dialog open={isGenerateOpen} onOpenChange={(open) => { if (!isGenerating) setIsGenerateOpen(open); }} title={generationStep === "complete" ? "Timetable generated" : "Generating timetable"} description={generationStep === "complete" ? "Your weekly schedule passed all checks and is ready to review." : "EduSync is building a balanced, clash-free school week."}>
        <div className="space-y-1">
          {generationSteps.map((step) => {
            const stepIndex = generationSteps.findIndex((item) => item.id === step.id);
            const currentIndex = generationSteps.findIndex((item) => item.id === generationStep);
            const complete = generationStep === "complete" || stepIndex < currentIndex;
            const active = generationStep === step.id;
            return <div key={step.id} className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5", active && "bg-[#f5f3ff]")}><span className={cn("grid size-7 shrink-0 place-items-center rounded-full", complete ? "bg-[#eaf7f0] text-[#18704f]" : active ? "bg-[#e7e3ff] text-[#442dc5]" : "bg-[#f1f3f7] text-[#596273]")}>{complete ? <Check className="size-4" /> : active ? <LoaderCircle className="size-4 animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}</span><div className="min-w-0 flex-1"><div className="text-[14px] font-medium">{step.label}</div><div className="mt-0.5 text-[12px] text-[#596273]">{step.detail}</div></div>{complete ? <CheckCircle2 className="size-4 text-[#18845b]" /> : null}</div>;
          })}
        </div>
        {generationStep === "complete" ? <div className="flex justify-end border-t border-[#e5e7ed] pt-3"><Button className="h-9 rounded-lg bg-[#442dc5] px-4 text-[12px]" onClick={() => setIsGenerateOpen(false)}>Review timetable</Button></div> : <div className="pt-2"><div className="h-1.5 overflow-hidden rounded-full bg-[#eceef3]"><div className="h-full rounded-full bg-[#5540c9] transition-all duration-200" style={{ width: `${Math.max(8, ((generationSteps.findIndex((step) => step.id === generationStep) + 1) / generationSteps.length) * 100)}%` }} /></div><p className="mt-2 text-right font-mono text-[12px] text-[#596273]">{generationStep === "loading" ? "Step 1 of 4" : `Step ${generationSteps.findIndex((step) => step.id === generationStep) + 1} of 4`}</p></div>}
      </Dialog>
      <CommandMenu open={isCommandOpen} onOpenChange={setIsCommandOpen} items={[{ label: "Auto-generate timetable", detail: "Start a new schedule", onSelect: startGeneration }, { label: "Export current timetable", detail: "Download a copy", onSelect: () => window.dispatchEvent(new Event("edusync-export")) }, { label: "Switch view", detail: modeLabel[view], onSelect: () => setView(view === "class" ? "teacher" : view === "teacher" ? "room" : "class") }]} />
      <span className="sr-only" aria-live="polite">{animationKey ? "Timetable generation complete. Cells updated." : ""}</span>
    </main>
  );
}

function SideNavItem({ icon: Icon, label, active, count }: { icon: typeof CalendarDays; label: string; active?: boolean; count?: string }) {
  return <a href="#" onClick={(event) => event.preventDefault()} aria-current={active ? "page" : undefined} className={cn("flex h-9 items-center gap-2.5 rounded-lg px-2.5 text-[14px] font-medium transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9a8cff]", active ? "bg-white/10 text-white" : "text-[#d2d5e0] hover:bg-white/[0.06] hover:text-white")}><Icon className="size-4 shrink-0" strokeWidth={1.9} />{label}{count ? <span className="ml-auto grid min-w-5 place-items-center rounded-full bg-[#4738a6] px-1 text-[12px] text-white">{count}</span> : null}</a>;
}

function TimetableSkeleton() {
  return <div className="animate-pulse" aria-label="Loading timetable"><div className="mb-3 flex items-center justify-between"><div className="h-4 w-32 rounded bg-[#e2e5eb]" /><div className="h-4 w-40 rounded bg-[#e2e5eb]" /></div><div className="hidden rounded-xl border border-[#e2e5eb] bg-white p-2 lg:block"><div className="grid grid-cols-7 gap-1">{Array.from({ length: 63 }, (_, index) => <div key={index} className={cn("min-h-[64px] rounded-lg bg-[#f1f3f7]", index < 7 && "min-h-[44px] bg-[#e8eaf0]")} />)}</div></div><div className="space-y-2 lg:hidden">{Array.from({ length: 8 }, (_, index) => <div key={index} className="h-[82px] rounded-lg bg-[#e8eaf0]" />)}</div></div>;
}

function EmptyState({ onGenerate }: { onGenerate: () => void }) {
  return <div className="grid min-h-[380px] place-items-center rounded-xl border border-dashed border-[#cfd3dd] bg-white px-5 text-center"><div className="max-w-sm"><div className="mx-auto grid size-12 place-items-center rounded-xl bg-[#f0edff] text-[#5140bd]"><CalendarDays className="size-6" /></div><h2 className="mt-4 text-[18px] font-semibold">No timetable yet</h2><p className="mt-2 text-[14px] leading-5 text-[#596273]">Generate a weekly schedule for Class 10-A using your school’s subject and teacher assignments.</p><Button className="mt-4 h-10 rounded-lg bg-[#442dc5] px-4 text-[14px]" onClick={onGenerate}><Sparkles className="size-4" />Generate timetable</Button></div></div>;
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return <div className="grid min-h-[380px] place-items-center rounded-xl border border-[#efd1d1] bg-white px-5 text-center"><div className="max-w-sm"><div className="mx-auto grid size-12 place-items-center rounded-xl bg-[#fff1f1] text-[#a43232]"><AlertTriangle className="size-6" /></div><h2 className="mt-4 text-[18px] font-semibold">Timetable could not load</h2><p className="mt-2 text-[14px] leading-5 text-[#596273]">Your saved schedule is unchanged. Retry loading the timetable.</p><Button variant="outline" className="mt-4 h-9 rounded-lg border-[#e1e4eb] bg-white text-[12px]" onClick={onRetry}><RefreshCw className="size-4" />Try again</Button></div></div>;
}

function todaySchoolDayIndex(): number {
  const weekday = new Date().getDay();
  return weekday === 0 ? 0 : Math.min(5, weekday - 1);
}

function getCurrentPeriod(): number {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const minutes = [500, 540, 580, 620, 680, 720, 760, 800];
  const actual = minutes.findIndex((start, index) => currentMinutes >= start && currentMinutes < start + 40);
  return actual >= 0 ? actual + 1 : 3;
}

function getWeekDates(offset: number): Date[] {
  const today = new Date();
  const mondayOffset = (today.getDay() + 6) % 7;
  const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset + offset * 7);
  return SCHOOL_DAYS.map((_, index) => new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index));
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat("en-IN", { day: "2-digit", month: "short" }).format(date);
}

function formatWeekLabel(start: Date, end: Date): string {
  const firstMonth = new Intl.DateTimeFormat("en-IN", { month: "short" }).format(start);
  const lastMonth = new Intl.DateTimeFormat("en-IN", { month: "short" }).format(end);
  const year = end.getFullYear();
  return firstMonth === lastMonth ? `${firstMonth} ${start.getDate()}–${end.getDate()}, ${year}` : `${firstMonth} ${start.getDate()} – ${lastMonth} ${end.getDate()}, ${year}`;
}