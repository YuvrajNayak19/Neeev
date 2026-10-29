import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";
import {
  CalendarCheck,
  Check,
  Download,
  Menu,
  Printer,
  Save,
  Shuffle,
  Trash2,
  Users,
  AlertTriangle,
  History,
  LogOut,
  Settings,
  UserRoundCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TeacherRoster } from "@/components/TeacherRoster";
import { AbsenteeTracker } from "@/components/AbsenteeTracker";
import { Logo } from "@/components/Logo";
import { OverrideDrawer } from "@/components/OverrideDrawer";
import { ExcelImporterModal } from "@/components/ExcelImporterModal";

import {
  generateSchedule,
  toCsv,
  type Absence,
  type Teacher,
} from "@/lib/substitution";
import { deleteSaved, loadSaved, saveSchedule, type SavedSchedule } from "@/lib/history";
import { cn } from "@/lib/utils";
import { dayIndexForDate } from "@/lib/timetableParser";
import { useAuth } from "@/hooks/use-auth";
import {
  fetchTeachers,
  syncTeachers as syncTeachersToCloud,
  fetchSavedDays,
  saveDay,
  deleteDay,
  fetchProfile,
  upsertProfile,
  saveSubstitutions,
} from "@/lib/cloud";
import { supabase } from "@/integrations/supabase/client";
import { AnimatePresence, motion } from "framer-motion";

export const Route = createFileRoute("/app")({
  head: () => ({
    meta: [
      { title: "Dashboard — Timely Substitution App" },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      {
        name: "description",
        content:
          "Manage the teacher schedule, log daily absences and auto-generate a fair substitution schedule you can print or export as CSV.",
      },
      { property: "og:title", content: "Timely Substitution App" },
      {
        property: "og:description",
        content:
          "Automated substitution scheduling for schools: schedule, absentee tracking and instant cover plans.",
      },
    ],
  }),
  component: Index,
});

type Tab = "roster" | "absentees" | "generator" | "history";

const NAV: { id: Tab; label: string; icon: typeof Users }[] = [
  { id: "roster", label: "Roster & Timetable", icon: Users },
  { id: "absentees", label: "Absence Logger", icon: CalendarCheck },
  { id: "generator", label: "Substitution Generator", icon: Shuffle },
  { id: "history", label: "Daily Schedule & History", icon: History },
];

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateLabel(date: string, weekday: "long" | "short" = "long") {
  return new Intl.DateTimeFormat("en-US", {
    timeZone: "UTC",
    weekday,
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(`${date}T00:00:00Z`));
}

function Index() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user, loading } = useAuth();
  const [tab, setTab] = useState<Tab>("generator");
  const [navOpen, setNavOpen] = useState(false);
  const [headerCompact, setHeaderCompact] = useState(false);
  const [overrideIndex, setOverrideIndex] = useState<number | null>(null);

  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [absences, setAbsences] = useState<Absence[]>([]);
  const [date, setDate] = useState(todayIso());
  const [schedule, setSchedule] = useState<ReturnType<typeof generateSchedule>>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [teachersLoaded, setTeachersLoaded] = useState(false);
  const [schoolId, setSchoolId] = useState("");
  const [syncError, setSyncError] = useState<string | null>(null);

  useEffect(() => {
    const updateHeader = () => setHeaderCompact(window.scrollY > 36);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);

  const activeAbsences = useMemo(() => {
    return absences.filter((absence) => absence.periods.length > 0);
  }, [absences]);

  const [saved, setSaved] = useState<SavedSchedule[]>([]);

  // Load data from cloud or localStorage based on authentication
  useEffect(() => {
    if (loading) return;

    const loadData = async () => {
      setTeachersLoaded(false);
      try {
        if (user) {
          // Ensure profile exists for new OAuth users
          const profile = await fetchProfile(user.id);
          if (!profile) {
            const meta = user.user_metadata as
              | { full_name?: string; school_id?: string; student_passcode?: string }
              | undefined;
            const fullName = meta?.full_name || user.email?.split("@")[0] || "User";
            await upsertProfile(user.id, {
              fullName,
              schoolName: "",
              schoolId: meta?.school_id ?? "",
              studentPasscode: meta?.student_passcode ?? "",
            });
            setSchoolId((meta?.school_id ?? "").trim().toUpperCase());
          } else {
            setSchoolId(profile.schoolId.trim().toUpperCase());
          }

          // Load from cloud for authenticated users
          const cloudTeachers = await fetchTeachers();
          setTeachers(cloudTeachers);
          setTeachersLoaded(true);

          const cloudSaved = await fetchSavedDays();
          setSaved(cloudSaved);
        } else {
          // Load from localStorage for unauthenticated users
          setTeachers([]);
          setSaved(loadSaved());
          setTeachersLoaded(true);
        }
        setDataLoaded(true);
      } catch (error) {
        console.error("Failed to load data:", error);
        if (user) {
          // Never show another session's local history as this account's data.
          setSyncError("Could not load your saved data. Please refresh the page.");
        } else {
          setSaved(loadSaved());
        }
        setDataLoaded(true);
      }
    };

    loadData();
  }, [user, loading]);

  // Sync teacher changes to cloud when authenticated
  useEffect(() => {
    if (!user || !dataLoaded || !teachersLoaded) return;

    const sync = async () => {
      try {
        await syncTeachersToCloud(user.id, teachers);
      } catch (error) {
        console.error("Failed to sync teachers:", error);
      }
    };

    sync();
  }, [teachers, user, dataLoaded, teachersLoaded]);

  const CurrentActiveAbsences = useMemo(
    () => absences.filter((a) => a.periods.length > 0),
    [absences],
  );

  const persistSchedule = async (rows: typeof schedule) => {
    if (!user) {
      setSaved(saveSchedule(date, rows));
      return;
    }
    if (!schoolId) {
      throw new Error("Your School ID is missing. Open Settings, save it, and generate the schedule again.");
    }
    await saveDay(user.id, date, rows);
    await saveSubstitutions(user.id, schoolId, date, rows);
    setSaved(await fetchSavedDays());
    await queryClient.invalidateQueries({ queryKey: ["substitutions"] });
  };

  useEffect(() => {
    if (!dataLoaded) return;
    const savedForDate = saved.find((entry) => entry.date === date);
    setSchedule(savedForDate?.rows ?? []);
  }, [dataLoaded, date, saved]);

  const generate = async () => {
    setSyncError(null);
    const rows = generateSchedule(
      teachers,
      activeAbsences,
      dayIndexForDate(new Date(`${date}T00:00:00`)) ?? 1,
    );
    setSchedule(rows);
    try {
      await persistSchedule(rows);
    } catch (error) {
      console.error("Failed to sync substitutions:", error);
      setSyncError(
        error instanceof Error
          ? `Schedule generated, but it could not be saved: ${error.message}`
          : "Schedule generated, but it could not be saved. Please try Save day again.",
      );
    }
  };

  const unassigned = schedule.filter((r) => !r.substituteId).length;
  const overrideRow = overrideIndex === null ? null : (schedule[overrideIndex] ?? null);

  const overrideAssignment = (index: number, teacherId: string) => {
    const substitute = teachers.find((teacher) => teacher.id === teacherId);
    if (!substitute) return;
    const updatedRows = schedule.map((row, rowIndex) =>
      rowIndex === index
        ? {
            ...row,
            substituteId: substitute.id,
            substituteName: substitute.name,
            substituteCategory: substitute.category,
            reason: "Manually overridden",
          }
        : row,
    );
    setSchedule(updatedRows);
    void persistSchedule(updatedRows).catch((error) => {
      console.error("Failed to sync substitutions:", error);
      setSyncError(
        error instanceof Error
          ? `Override updated, but it could not be saved: ${error.message}`
          : "Override updated, but it could not be saved.",
      );
    });
    setOverrideIndex(null);
  };

  const save = async () => {
    if (schedule.length === 0) return;
    try {
      if (user) {
        // Save to cloud for authenticated users
        await persistSchedule(schedule);
        setSyncError(null);
      } else {
        // Save to localStorage for unauthenticated users
        setSaved(saveSchedule(date, schedule));
      }
    } catch (error) {
      console.error("Failed to save schedule:", error);
      setSyncError(
        error instanceof Error
          ? `Schedule could not be saved: ${error.message}`
          : "Schedule could not be saved. Please try again.",
      );
    }
  };

  const restore = (entry: SavedSchedule) => {
    setDate(entry.date);
    setSchedule(entry.rows);
    setTab("history");
  };

  const deleteSchedule = async (date: string) => {
    try {
      if (user) {
        // Delete from cloud for authenticated users
        await deleteDay(user.id, date);
        const cloudSaved = await fetchSavedDays();
        setSaved(cloudSaved);
      } else {
        // Delete from localStorage for unauthenticated users
        setSaved(deleteSaved(date));
      }
    } catch (error) {
      console.error("Failed to delete schedule:", error);
      // Keep the list as it is; falling back to localStorage would show the wrong data.
      setSyncError(
        error instanceof Error
          ? `Could not delete the saved day: ${error.message}`
          : "Could not delete the saved day. Please try again.",
      );
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate({ to: "/", replace: true });
  };

  const downloadCsv = (rows = schedule, label = date) => {
    const blob = new Blob([toCsv(rows, label)], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `substitutions-${label}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dashboard-shell flex min-h-screen flex-col md:flex-row">
      <motion.aside
        initial={{ opacity: 0, x: -18 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="app-sidebar no-print sticky top-0 hidden h-screen w-60 shrink-0 flex-col px-4 py-6 text-foreground backdrop-blur-[12px] backdrop-saturate-[180%] md:flex"
      >
        <Link to="/" className="flex items-center gap-2 px-2">
          <Logo size="md" className="dashboard-brand-logo shrink-0" />
          <div>
            <p className="text-lg font-semibold tracking-tight text-sidebar-accent-foreground">
              Timely
            </p>
            <p className="text-xs text-sidebar-foreground/70">Substitution App · Home</p>
          </div>
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <motion.button
              key={item.id}
              onClick={() => setTab(item.id)}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                tab === item.id
                  ? "text-foreground font-semibold"
                  : "hover:bg-secondary/60",
              )}
            >
              {tab === item.id && (
                <motion.span
                  layoutId="desktop-active-nav"
                  className="sidebar-active-pill absolute inset-0 rounded-lg backdrop-blur-[10px] backdrop-saturate-[180%]"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <item.icon className="relative z-10 size-4" />
              <span className="relative z-10">{item.label}</span>
            </motion.button>
          ))}
        </nav>
        <div className="mt-auto space-y-2">
          <Link
            to="/student"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent/50"
          >
            <Users className="size-4" /> Student Portal
          </Link>
          <div className="rounded-lg border border-sidebar-border px-3 py-3 text-xs text-sidebar-foreground/70">
            Cover matched by department first, then by lightest substitution load.
          </div>
          {user && (
            <div className="space-y-1">
              <Link
                to="/settings"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent/50"
              >
                <Settings className="size-4" /> Settings
              </Link>
              <button
                onClick={() => void handleLogout()}
                className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-sidebar-foreground hover:bg-sidebar-accent/50 text-left"
              >
                <LogOut className="size-4" /> Sign out
              </button>
            </div>
          )}
        </div>
      </motion.aside>

      {/* Mobile top navbar */}
      <div className="glass-clear no-print sticky top-0 z-30 grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3 border-b border-sidebar-border bg-sidebar px-4 py-3 text-sidebar-foreground md:hidden">
        <Sheet open={navOpen} onOpenChange={setNavOpen}>
          <SheetTrigger asChild>
            <button
              aria-label="Open navigation"
              className="grid size-9 shrink-0 place-items-center rounded-lg bg-brand text-primary-foreground"
            >
              <Menu className="size-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="left"
            className="dashboard-mobile-sheet glass-regular glass-highlight w-64 border-sidebar-border bg-white/5 text-foreground backdrop-blur-[12px] backdrop-saturate-[180%]"
          >
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2 text-sidebar-accent-foreground">
                <Logo size="sm" className="dashboard-brand-logo" /> Timely
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-2 flex flex-col gap-1 px-2">
              {NAV.map((item) => (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    setTab(item.id);
                    setNavOpen(false);
                  }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "relative flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm",
                    tab === item.id
                      ? "text-foreground font-semibold"
                      : "hover:bg-secondary/60",
                  )}
                >
                  {tab === item.id && (
                    <motion.span
                      layoutId="mobile-active-nav"
                      className="sidebar-active-pill absolute inset-0 rounded-lg backdrop-blur-[10px] backdrop-saturate-[180%]"
                      transition={{ type: "spring", stiffness: 420, damping: 32 }}
                    />
                  )}
                  <item.icon className="relative z-10 size-4" />
                  <span className="relative z-10">{item.label}</span>
                </motion.button>
              ))}
              <Link
                to="/student"
                onClick={() => setNavOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-left text-sm hover:bg-secondary/60"
              >
                <Users className="size-4" /> Student Portal
              </Link>
            </nav>
          </SheetContent>
        </Sheet>
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <Logo size="sm" className="dashboard-brand-logo" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-accent-foreground">
              {NAV.find((n) => n.id === tab)?.label}
            </p>
            <p className="truncate text-xs text-sidebar-foreground/70">Timely · back to home</p>
          </div>
        </Link>
      </div>

      <main className="min-w-0 flex-1 px-4 py-6 sm:px-5 md:px-8">
        <header className={`app-page-header ${headerCompact ? "app-page-header-compact" : ""} mb-6 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:justify-between sm:gap-4`}>
          <div className="min-w-0">
            <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">
              {tab === "roster"
                ? "Roster & Timetable"
                : tab === "absentees"
                  ? "Absence Logger"
                  : tab === "generator"
                    ? "Substitution Generator"
                  : tab === "history"
                    ? "Daily Schedule & History"
                    : ""}
            </h1>

            <p className="text-sm text-muted-foreground">
              {formatDateLabel(date)}
            </p>
          </div>
        </header>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={tab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          >
        {tab === "roster" && (
          <div className="space-y-3">
            <div className="flex justify-end">
              <ExcelImporterModal onImport={(imported) => setTeachers((current) => [...current, ...imported])} />
            </div>
            <TeacherRoster teachers={teachers} onChange={setTeachers} date={date} />
          </div>
        )}

        {tab === "absentees" && (
          <AbsenteeTracker
            teachers={teachers}
            absences={absences}
            date={date}
            onDateChange={setDate}
            onChange={setAbsences}
          />
        )}

        {tab === "generator" && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Stat label="Teachers on schedule" value={teachers.length} />
              <Stat label="Absent today" value={activeAbsences.length} />
              <Stat
                label="Periods needing cover"
                value={activeAbsences.reduce((n, a) => n + a.periods.length, 0)}
              />
              <Stat label="Unassigned" value={unassigned} tone={unassigned ? "warn" : "ok"} />
            </div>
            <p className="text-sm text-muted-foreground">
              Matching hierarchy: same department first, then same or eligible category, then the
              lightest substitution load.
            </p>
            {activeAbsences.some((absence) => Object.values(absence.vacantClass ?? {}).some(Boolean)) && (
              <p className="text-sm text-muted-foreground">
                Coverage:{" "}
                {activeAbsences
                  .flatMap((absence) =>
                    absence.periods.map((period) => {
                      const classSection = absence.vacantClass?.[period];
                      return `P${period}${classSection ? ` — Class ${classSection}` : ""}`;
                    }),
                  )
                  .join(" · ")}
              </p>
            )}
          </div>
        )}

        {(tab === "generator" || tab === "history") && (
          <div className="space-y-6">
            <section className="panel data-panel print-area overflow-hidden p-0">
              <header className="flex flex-col gap-3 border-b border-border px-4 py-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5">
                <div className="min-w-0">
                  <h2 className="truncate text-base font-semibold">Daily Substitution Schedule</h2>
                  <p className="text-sm text-muted-foreground">
                    {schedule.length} assignments for {date}
                  </p>
                </div>
                <div className="no-print grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                  {tab === "generator" ? (
                    <Button onClick={generate} className="w-full sm:w-auto">
                      <Check className="size-4" /> Generate
                    </Button>
                  ) : (
                    <>
                      <Button
                        variant="outline"
                        onClick={save}
                        disabled={schedule.length === 0}
                        className="w-full sm:w-auto"
                      >
                        <Save /> Save day
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.print()}
                        className="w-full sm:w-auto"
                      >
                        <Printer /> Print / PDF
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => downloadCsv()}
                        className="w-full sm:w-auto"
                      >
                        <Download /> CSV
                      </Button>
                    </>
                  )}
                </div>
              </header>

              {syncError && (
                <p role="alert" className="border-b border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive sm:px-5">
                  {syncError}
                </p>
              )}

              {schedule.length === 0 ? (
                <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                  No absences selected yet. Add absentees, then press Generate.
                </p>
              ) : (
                <>
                  {/* Mobile: stacked cards */}
                  <ul className="divide-y divide-border lg:hidden">
                    {schedule.map((r, i) => (
                      <li
                        key={`m-${r.period}-${r.absentTeacherId}-${i}`}
                        className="space-y-2 px-4 py-4 text-sm"
                      >
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                          <div className="min-w-0">
                            <p className="truncate font-medium">{r.absentTeacherName}</p>
                            <p className="truncate text-xs text-muted-foreground">{r.subject}</p>
                          </div>
                          <span className="shrink-0 rounded-md bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                            P{r.period}
                            {r.classSection && r.classSection !== "Unassigned"
                              ? ` — Class ${r.classSection}`
                              : ""}
                          </span>
                        </div>
                        <div className="grid grid-cols-[auto_minmax(0,1fr)] gap-x-2 gap-y-1 text-xs">
                          <span className="text-muted-foreground">Substitute</span>
                          <span className={cn("min-w-0 break-words font-medium", !r.substituteId && "text-destructive")}>
                            {r.substituteName}
                          </span>
                          <Button size="sm" variant="ghost" className="col-span-2 justify-self-start" onClick={() => setOverrideIndex(i)}>
                            <UserRoundCheck /> Override
                          </Button>
                          <span className="text-muted-foreground">Basis</span>
                          <span className="min-w-0 break-words text-muted-foreground">
                            {r.reason}
                          </span>
                        </div>
                      </li>
                    ))}
                  </ul>

                  {/* Desktop: table */}
                  <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-muted/60 text-left text-xs uppercase tracking-wide text-muted-foreground">
                          <th className="px-5 py-3 font-medium">Period</th>
                          <th className="px-3 py-3 font-medium">Absent teacher</th>
                          <th className="px-3 py-3 font-medium">Subject</th>
                          <th className="px-3 py-3 font-medium">Substitute</th>
                          <th className="px-3 py-3 font-medium">Basis</th>
                          <th className="px-5 py-3 font-medium">Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {schedule.map((r, i) => (
                          <tr
                            key={`${r.period}-${r.absentTeacherId}-${i}`}
                            className={cn(
                              "border-t border-border odd:bg-background even:bg-muted/30",
                              !r.substituteId && "bg-destructive/10",
                            )}
                          >
                            <td className="px-5 py-3.5 font-medium text-primary">
                              P{r.period}
                              {r.classSection && r.classSection !== "Unassigned"
                                ? ` — Class ${r.classSection}`
                                : ""}
                            </td>
                            <td className="px-3 py-3.5">{r.absentTeacherName}</td>
                            <td className="px-3 py-3.5 text-muted-foreground">{r.subject}</td>
                            <td
                              className={cn(
                                "px-3 py-3.5 font-medium",
                                !r.substituteId && "text-destructive",
                              )}
                            >
                              {r.substituteName}
                            </td>
                            <td className="px-3 py-3.5 text-muted-foreground">{r.reason}</td>
                            <td className="px-5 py-3.5">
                              <Button size="sm" variant="ghost" onClick={() => setOverrideIndex(i)}>
                                <UserRoundCheck /> Override
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </section>

            {unassigned > 0 && (
              <p className="no-print flex items-center gap-2 text-sm text-muted-foreground">
                <AlertTriangle className="size-4 text-warning" />
                {unassigned} period(s) have no free teacher — free up a slot in the schedule.
              </p>
            )}
          </div>
        )}

        <OverrideDrawer
          open={overrideIndex !== null}
          onOpenChange={(open) => !open && setOverrideIndex(null)}
          row={overrideRow}
          teachers={teachers}
          absentTeacherIds={activeAbsences
            .filter((absence) => overrideRow?.period !== undefined && absence.periods.includes(overrideRow.period))
            .map((absence) => absence.teacherId)}
          onConfirm={(teacherId) =>
            overrideIndex !== null && overrideAssignment(overrideIndex, teacherId)
          }
        />

        {tab === "history" && (
          <section className="panel data-panel overflow-hidden p-0">
            <header className="border-b border-border px-5 py-4">
              <h2 className="text-base font-semibold">Saved Schedules</h2>
              <p className="text-sm text-muted-foreground">
                {user
                  ? "All your saved days are stored securely in the cloud. Open one to view or export it."
                  : "Previously saved days are kept on this device. Open one to view or export it."}
              </p>
            </header>
            {saved.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">
                Nothing saved yet — generate a schedule and press “Save day”.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {saved.map((s) => (
                  <li
                    key={s.date}
                    className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:px-5"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {formatDateLabel(s.date, "short")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {s.rows.length} assignments · saved {new Date(s.savedAt).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => restore(s)}
                        className="flex-1 sm:flex-none"
                      >
                        Open
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => downloadCsv(s.rows, s.date)}
                        className="flex-1 sm:flex-none"
                      >
                        <Download /> CSV
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void deleteSchedule(s.date)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}
          </motion.div>
        </AnimatePresence>

        <footer className="no-print mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <p>Timely Substitution App — Developed by Team Aeronics</p>
            <a
              href="mailto:developerstimely@gmail.com"
              className="transition-colors hover:text-foreground"
            >
              Support: developerstimely@gmail.com
            </a>
          </div>
        </footer>
      </main>
    </div>
  );
}

function Stat({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "ok" | "warn";
}) {
  return (
    <div
      className={cn(
        "panel data-panel px-5 py-4",
        tone === "warn" && "dashboard-unassigned-stat border-l-4 border-l-destructive",
      )}
    >
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <div className="mt-1 flex items-center gap-2">
        <p
          className={cn(
            "text-2xl font-semibold",
            tone === "ok" && "text-success",
          )}
        >
          {value}
        </p>
        {tone === "warn" && (
          <AlertTriangle className="size-5 text-foreground" aria-label="Needs attention" />
        )}
      </div>
    </div>
  );
}
