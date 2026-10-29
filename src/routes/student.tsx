import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Search } from "lucide-react";
import { useEffect, useMemo, useState, type FormEvent } from "react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  fetchStudentSubstitutions,
  verifyStudentAccess,
  type SubstitutionRecord,
} from "@/lib/cloud";

type StudentScheduleRow = {
  period: number;
  classSection: string;
  absentTeacherName: string;
  substituteId: string | null;
  substituteName: string;
  status: "assigned" | "overridden";
};

export const Route = createFileRoute("/student")({
  head: () => ({
    meta: [
      { title: "Student Noticeboard — Timely" },
      { name: "robots", content: "noindex, nofollow" },
      {
        name: "description",
        content: "Read-only daily substitution schedule for students.",
      },
    ],
  }),
  component: StudentNoticeboard,
});

function todayIso() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function StudentNoticeboard() {
  const [access, setAccess] = useState<{ schoolId: string; passcode: string } | null>(null);

  if (!access) {
    return <StudentAccessGate onVerified={setAccess} />;
  }

  return (
    <StudentSchedule
      schoolId={access.schoolId}
      passcode={access.passcode}
      onChangeSchool={() => setAccess(null)}
    />
  );
}

function StudentAccessGate({
  onVerified,
}: {
  onVerified: (access: { schoolId: string; passcode: string }) => void;
}) {
  const [schoolId, setSchoolId] = useState("");
  const [passcode, setPasscode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const normalizedSchoolId = schoolId.trim().toUpperCase();
      const valid = await verifyStudentAccess(normalizedSchoolId, passcode);
      if (!valid) {
        setError("That School ID and Student Passcode do not match.");
        return;
      }
      onVerified({ schoolId: normalizedSchoolId, passcode: passcode.trim() });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not verify access. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="student-portal flex min-h-screen items-center justify-center px-4 py-10">
      <section className="student-access-card panel w-full max-w-md px-5 py-6">
        <div className="mb-6 flex items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2">
            <Logo size="md" className="student-brand-logo" />
            <span className="text-lg font-semibold tracking-tight">Timely</span>
          </Link>
          <Link to="/" className="student-home-button">
            Back to homepage
          </Link>
        </div>
        <h1 className="text-xl font-semibold tracking-tight">Student Schedule Access</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Enter the School ID and Student Passcode provided by your school.
        </p>
        <form className="mt-5 space-y-4" onSubmit={(event) => void submit(event)}>
          <div className="space-y-1.5">
            <Label htmlFor="student-school-id">School ID</Label>
            <Input
              id="student-school-id"
              value={schoolId}
              onChange={(event) => setSchoolId(event.target.value.toUpperCase())}
              autoComplete="organization"
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="student-passcode">Student Passcode</Label>
            <Input
              id="student-passcode"
              type="password"
              value={passcode}
              onChange={(event) => setPasscode(event.target.value)}
              autoComplete="current-password"
              required
            />
          </div>
          {error && (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive"
            >
              {error}
            </p>
          )}
          <Button type="submit" className="w-full" disabled={busy}>
            {busy ? "Verifying..." : "View student schedule"}
          </Button>
        </form>
      </section>
    </main>
  );
}

function StudentSchedule({
  schoolId,
  passcode,
  onChangeSchool,
}: {
  schoolId: string;
  passcode: string;
  onChangeSchool: () => void;
}) {
  const [date, setDate] = useState(todayIso);
  const [query, setQuery] = useState("");
  const [classFilter, setClassFilter] = useState("all");
  const [headerCompact, setHeaderCompact] = useState(false);

  useEffect(() => {
    const updateHeader = () => setHeaderCompact(window.scrollY > 36);
    updateHeader();
    window.addEventListener("scroll", updateHeader, { passive: true });
    return () => window.removeEventListener("scroll", updateHeader);
  }, []);
  const { data: substitutions = [], isLoading } = useQuery<SubstitutionRecord[]>({
    queryKey: ["substitutions", schoolId, date],
    queryFn: () => fetchStudentSubstitutions(schoolId, passcode, date),
    enabled: Boolean(schoolId && date),
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const schedule = useMemo(
    () =>
      substitutions
        .map((substitution) => ({
          period: substitution.period,
          classSection: substitution.className,
          absentTeacherName: substitution.originalTeacherName,
          substituteId: substitution.substituteTeacherId,
          substituteName: substitution.substituteTeacherName,
          status: substitution.status,
        }))
        .sort((a, b) => a.period - b.period),
    [substitutions],
  );
  const filteredSchedule = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return schedule.filter(
      (row) =>
        (classFilter === "all" || row.classSection === classFilter) &&
        [row.absentTeacherName, row.substituteName, row.classSection, `p${row.period}`]
          .join(" ")
          .toLowerCase()
          .includes(normalizedQuery),
    );
  }, [classFilter, query, schedule]);
  const classes = useMemo(
    () => [...new Set(schedule.map((row) => row.classSection).filter(Boolean))].sort(),
    [schedule],
  );

  return (
    <main className="student-portal min-h-screen px-4 py-6 text-foreground sm:px-6 sm:py-10">
      <div className="mx-auto max-w-5xl">
        <header className={`app-page-header ${headerCompact ? "app-page-header-compact" : ""} mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between`}>
          <div className="flex items-start gap-3">
            <Logo size="md" className="student-brand-logo" />
            <div>
              <p className="text-lg font-semibold tracking-tight">Timely — Student Noticeboard</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full border border-primary/15 bg-white/30 px-2.5 py-1 font-medium text-foreground backdrop-blur-md">
                  Read-Only View
                </span>
                <span className="text-foreground/70">School ID: {schoolId}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-sm font-medium">
            <button
              type="button"
              onClick={onChangeSchool}
              className="text-accent-sky underline-offset-4 hover:underline"
            >
              Change school
            </button>
            <Link to="/" className="student-home-button">
              Back to homepage
            </Link>
          </div>
        </header>

        <section className="glass-regular mb-6 rounded-2xl border border-primary/15 p-4 shadow-sm backdrop-blur-[10px] backdrop-saturate-[180%] sm:p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-foreground/80">
              Date
              <span className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                <input
                  type="date"
                  value={date}
                  onChange={(event) => setDate(event.target.value)}
                  className="h-10 w-full rounded-xl border border-primary/15 bg-white/60 pl-10 pr-3 text-sm text-primary outline-none ring-primary/30 transition focus:ring-2"
                />
              </span>
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-foreground/80">
              Class / Section
              <select
                value={classFilter}
                onChange={(event) => setClassFilter(event.target.value)}
                className="h-10 w-full rounded-xl border border-primary/15 bg-white/60 px-3 text-sm text-primary outline-none ring-primary/30 transition focus:ring-2"
              >
                <option value="all">All Classes (Whole School)</option>
                {classes.map((classSection) => (
                  <option key={classSection} value={classSection}>
                    {classSection}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex min-w-0 flex-col gap-2 text-sm font-medium text-foreground/80">
              Search schedule
              <span className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-primary" />
                <input
                  type="search"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search class, subject, or teacher"
                  className="h-10 w-full rounded-xl border border-primary/15 bg-white/60 pl-10 pr-3 text-sm text-primary outline-none placeholder:text-foreground/50 ring-primary/30 transition focus:ring-2"
                />
              </span>
            </label>
          </div>
        </section>

        <section aria-live="polite" className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Today&apos;s substitutions
            </h1>
            <p className="text-sm text-foreground/70">
              {filteredSchedule.length} of {schedule.length} periods
            </p>
          </div>

          {isLoading || schedule.length === 0 ? (
            <div className="glass-regular rounded-2xl border border-primary/15 px-5 py-10 text-center text-sm text-foreground/70 shadow-sm backdrop-blur-[10px] backdrop-saturate-[180%]">
              No substitution
            </div>
          ) : (
            filteredSchedule.map((row) => (
              <ScheduleCard key={`${row.period}-${row.classSection}`} row={row} />
            ))
          )}
        </section>
      </div>
    </main>
  );
}

function ScheduleCard({ row }: { row: StudentScheduleRow }) {
  const hasSubstitute = Boolean(row.substituteId);

  return (
    <article className="glass-regular rounded-2xl border border-primary/15 p-4 shadow-sm backdrop-blur-[10px] backdrop-saturate-[180%] sm:p-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="shrink-0 rounded-xl bg-accent px-3 py-2 text-sm font-bold text-primary">
            P{row.period}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">
              P{row.period} · {row.classSection}
            </p>
            <p className="mt-1 text-sm text-foreground/70">
              Regular teacher: {row.absentTeacherName}
            </p>
          </div>
        </div>
        <div className="min-w-0 sm:text-right">
          <p className="text-xs font-medium uppercase tracking-wide text-foreground/60">
            {hasSubstitute ? `Substituted: ${row.substituteName}` : "Substitute teacher"}
          </p>
          <span
            className={`mt-1 inline-flex max-w-full rounded-full px-3 py-1.5 text-sm font-semibold ${
              hasSubstitute
                ? "border border-emerald-200 bg-emerald-100/80 text-emerald-900"
                : "border border-primary/15 bg-white/60 text-foreground/70"
            }`}
          >
            <span className="truncate">
              {hasSubstitute ? row.substituteName : "No substitute assigned"}
            </span>
          </span>
        </div>
      </div>
    </article>
  );
}
