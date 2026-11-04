import { AlertTriangle, CalendarX2, Printer, ShieldCheck } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/app-shell";
import { EmptyState, ErrorState } from "@/components/app/states";
import { SubjectLegend, TimetableGrid } from "@/components/app/timetable-grid";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useClasses, useTeachers, useWeek } from "@/lib/api";
import { currentPeriod, currentSchoolDate, schoolDayName, toIsoDate } from "@/lib/school-time";

type Mode = "class" | "teacher";

export function TimetablePage() {
  const classes = useClasses();
  const teachers = useTeachers();
  const [mode, setMode] = useState<Mode>("class");
  const [classId, setClassId] = useState("");
  const [teacherId, setTeacherId] = useState("");
  const date = toIsoDate(currentSchoolDate());

  useEffect(() => { if (!classId && classes.data?.length) setClassId(classes.data[0]._id); }, [classes.data, classId]);
  useEffect(() => { if (!teacherId && teachers.data?.length) setTeacherId(teachers.data[0]._id); }, [teachers.data, teacherId]);

  const week = useWeek(mode === "class" ? { classId } : { teacherId }, date);
  const entries = useMemo(() => (week.data?.entries ?? []).map((entry) => ({
    day: entry.day, periodNumber: entry.periodNumber, subject: entry.subject, room: entry.room, clash: entry.clash, substitute: mode === "class" ? entry.substitute : undefined,
    primary: mode === "class" ? entry.teacher : `Class ${entry.className}`,
  })), [week.data, mode]);
  const subjects = [...new Set(entries.map((entry) => entry.subject).filter(Boolean) as string[])].sort();

  const selectedLabel = mode === "class"
    ? (() => { const item = classes.data?.find((entry) => entry._id === classId); return item ? `Class ${item.grade}-${item.section}` : ""; })()
    : teachers.data?.find((entry) => entry._id === teacherId)?.name ?? "";
  const load = mode === "teacher" ? entries.length : null;

  return (
    <>
      <PageHeader
        eyebrow="Published timetable"
        title="Timetable"
        description="The week at a glance for any class or teacher. Hover or focus a period for details."
        actions={entries.length ? <Button variant="outline" onClick={() => window.print()}><Printer />Print</Button> : null}
      />

      <section className="print-area rounded-2xl border border-line bg-paper p-4 shadow-soft sm:p-6">
        <div className="print-header"><strong>ClassSync · {selectedLabel}</strong><span>Weekly timetable</span></div>
        <div className="no-print flex flex-col gap-4 border-b border-line pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">View by</p>
              <Tabs value={mode} onValueChange={(value) => setMode(value as Mode)}>
                <TabsList>
                  <TabsTrigger value="class">Class</TabsTrigger>
                  <TabsTrigger value="teacher">Teacher</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            <div className="w-full space-y-2 sm:w-64">
              <Label htmlFor="timetable-target">{mode === "class" ? "Class" : "Teacher"}</Label>
              {mode === "class" ? (
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger id="timetable-target"><SelectValue placeholder="Choose a class" /></SelectTrigger>
                  <SelectContent>{(classes.data ?? []).map((item) => <SelectItem key={item._id} value={item._id}>Class {item.grade}-{item.section}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Select value={teacherId} onValueChange={setTeacherId}>
                  <SelectTrigger id="timetable-target"><SelectValue placeholder="Choose a teacher" /></SelectTrigger>
                  <SelectContent>{(teachers.data ?? []).map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              )}
            </div>
          </div>
          {week.data?.published ? (
            week.data.clashes ? (
              <Badge variant="warning" className="h-fit self-start py-1.5 lg:self-auto"><AlertTriangle className="h-3.5 w-3.5" />{week.data.clashes} clash{week.data.clashes > 1 ? "es" : ""} found in the school timetable</Badge>
            ) : (
              <Badge variant="success" className="h-fit self-start py-1.5 lg:self-auto"><ShieldCheck className="h-3.5 w-3.5" />No clashes · {week.data.checked} periods checked</Badge>
            )
          ) : null}
        </div>

        <div className="pt-5">
          {week.isLoading || classes.isLoading ? (
            <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-[420px]" /></div>
          ) : week.error ? (
            <ErrorState error={week.error} onRetry={() => void week.refetch()} />
          ) : !week.data?.published ? (
            <EmptyState icon={CalendarX2} title="No timetable published yet" description="Once your timetable is generated and published, every class and teacher will appear here." />
          ) : entries.length === 0 ? (
            <EmptyState icon={CalendarX2} title={`Nothing scheduled for ${selectedLabel}`} description={mode === "teacher" ? "This teacher has no classes in the published timetable." : "This class has no periods in the published timetable."} />
          ) : (
            <>
              <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
                <h2 className="font-display text-2xl font-semibold text-ink">{selectedLabel}</h2>
                {load !== null ? <p className="text-sm text-ink-muted"><span className="font-semibold text-ink">{load}</span> periods a week · {48 - load} free</p> : null}
              </div>
              <TimetableGrid entries={entries} secondaryLabel={mode === "class" ? "Teacher" : "Class"} today={schoolDayName(currentSchoolDate())} nowPeriod={currentPeriod()} caption={`Weekly timetable for ${selectedLabel}`} />
              <div className="no-print mt-5 border-t border-line pt-4"><SubjectLegend subjects={subjects} /></div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
