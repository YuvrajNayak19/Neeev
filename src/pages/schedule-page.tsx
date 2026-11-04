import { Loader2, Printer, School } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { SiteFooter } from "@/components/public/site-footer";
import { SiteHeader } from "@/components/public/site-header";
import { SchoolPicker } from "@/components/app/school-picker";
import { SubjectLegend, TimetableGrid } from "@/components/app/timetable-grid";
import { EmptyState } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { getPublicClasses, getPublicTimetable, type PublicClassSection, type PublicSchool, type PublicTimetable } from "@/lib/auth-api";
import { currentPeriod, currentSchoolDate, schoolDayName } from "@/lib/school-time";

/** Read-only class timetable for students and parents. No sign-in needed. */
export function SchedulePage() {
  const [school, setSchool] = useState<PublicSchool | null>(null);
  const [classes, setClasses] = useState<PublicClassSection[]>([]);
  const [classId, setClassId] = useState("");
  const [timetable, setTimetable] = useState<PublicTimetable | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setClassId("");
    setTimetable(null);
    if (!school) { setClasses([]); return; }
    void getPublicClasses(school._id).then(setClasses).catch(() => setClasses([]));
  }, [school]);

  const selected = useMemo(() => classes.find((item) => item._id === classId), [classes, classId]);

  useEffect(() => {
    setTimetable(null);
    setError(null);
    if (!school || !selected) return;
    setLoading(true);
    getPublicTimetable(school._id, selected.grade, selected.section)
      .then(setTimetable)
      .catch((requestError: unknown) => setError(requestError instanceof Error ? requestError.message : "We couldn't load this timetable. Please try again."))
      .finally(() => setLoading(false));
  }, [school, selected]);

  const sortedClasses = useMemo(() => [...classes].sort((a, b) => a.grade - b.grade || a.section.localeCompare(b.section)), [classes]);
  const entries = (timetable?.entries ?? []).map((entry) => ({ day: entry.day, periodNumber: entry.periodNumber, subject: entry.subject, primary: entry.teacher }));
  const subjects = [...new Set(entries.map((entry) => entry.subject).filter(Boolean) as string[])].sort();
  const today = schoolDayName(currentSchoolDate());

  return (
    <div className="min-h-screen bg-cream">
      <SiteHeader />
      <main id="main" className="container max-w-6xl py-10 sm:py-14">
        <div className="no-print max-w-2xl">
          <p className="eyebrow">For students &amp; parents</p>
          <h1 className="mt-3 font-display text-display-md font-semibold text-ink">Find a class timetable</h1>
          <p className="mt-3 text-ink-muted">Pick your school and class to see the published weekly timetable. No sign-in needed.</p>
        </div>

        <section aria-label="Choose a class" className="no-print mt-8 grid gap-4 rounded-2xl border border-line bg-paper p-5 shadow-soft sm:grid-cols-[1.6fr_1fr] sm:p-6">
          <SchoolPicker value={school} onChange={setSchool} />
          <div className="space-y-2">
            <Label htmlFor="class-select">Class</Label>
            <Select value={classId} onValueChange={setClassId} disabled={!school || classes.length === 0}>
              <SelectTrigger id="class-select" aria-label="Class">
                <SelectValue placeholder={school ? "Choose a class" : "Choose a school first"} />
              </SelectTrigger>
              <SelectContent>
                {sortedClasses.map((item) => (
                  <SelectItem key={item._id} value={item._id}>Class {item.grade}-{item.section}{item.stream ? ` · ${item.stream}` : ""}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </section>

        <div className="mt-6">
          {loading ? (
            <div className="space-y-2 rounded-2xl border border-line bg-paper p-5" aria-busy="true">
              <p className="flex items-center gap-2 text-sm text-ink-muted"><Loader2 className="h-4 w-4 animate-spin" />Loading timetable…</p>
              <Skeleton className="h-10" /><Skeleton className="h-64" />
            </div>
          ) : error ? (
            <p role="alert" className="rounded-2xl border border-brick/20 bg-brick-bg px-4 py-3 text-sm text-brick">{error}</p>
          ) : !timetable ? (
            <EmptyState icon={School} title="Your timetable will appear here" description="Start typing your school's name, for example “Greenfield”, then choose your class." />
          ) : entries.length === 0 ? (
            <EmptyState title="Not published yet" description="Your school hasn't published a timetable for this class. Please check again later." />
          ) : (
            <section className="print-area rounded-2xl border border-line bg-paper p-4 shadow-soft sm:p-6">
              <div className="print-header"><strong>ClassSync · Class {timetable.class.grade}-{timetable.class.section}</strong><span>{school?.name}</span></div>
              <div className="no-print mb-4 flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-display text-2xl font-semibold text-ink">Class {timetable.class.grade}-{timetable.class.section}</h2>
                  <p className="text-sm text-ink-muted">{school?.name} · {school?.city}</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => window.print()}><Printer />Print</Button>
              </div>
              <TimetableGrid entries={entries} today={today} nowPeriod={currentPeriod()} caption={`Weekly timetable for class ${timetable.class.grade}-${timetable.class.section}`} />
              <div className="no-print mt-4 border-t border-line pt-4"><SubjectLegend subjects={subjects} /></div>
            </section>
          )}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
