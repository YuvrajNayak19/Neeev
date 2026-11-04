import { CalendarCheck2, CalendarDays, Check, ClipboardList, Coffee, Loader2, Plus, Repeat2, Sun } from "lucide-react";
import { Fragment, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/app-shell";
import { Panel, StatCard } from "@/components/app/bits";
import { greeting } from "@/lib/format";
import { FormAlert } from "@/components/app/form-field";
import { NoticesPanel } from "@/components/app/notices-panel";
import { RequestCard } from "@/components/app/request-card";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { SubjectLegend, TimetableGrid } from "@/components/app/timetable-grid";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { REQUEST_LABEL, useAcknowledgeDuty, useClasses, useCreateRequest, useMyDay, useMyRequests, useSubjects, useWeek, type RequestType } from "@/lib/api";
import { LUNCH, PERIODS, currentPeriod, currentSchoolDate, formatLongDate, formatTime, schoolDayName, toIsoDate } from "@/lib/school-time";
import { displayName, useMe } from "@/lib/session";
import { subjectClasses } from "@/lib/subject-style";
import { cn } from "@/lib/utils";

/* ---------------------------------------------------------------------- my day */

export function TeacherDashboardPage() {
  const me = useMe();
  const date = toIsoDate(currentSchoolDate());
  const day = useMyDay(date);
  const acknowledge = useAcknowledgeDuty();
  const requests = useMyRequests();
  const now = currentPeriod();

  const classes = day.data?.classes ?? [];
  const duties = day.data?.duties ?? [];
  const pending = (requests.data ?? []).filter((item) => item.status === "PENDING_ADMIN" || item.status === "PENDING_COUNTERPART").length;
  const busy = new Set([...classes.map((item) => item.period), ...duties.map((item) => item.period)]);
  const nextPeriod = now ? PERIODS.find((period) => period.number >= now && busy.has(period.number))?.number : undefined;

  return (
    <>
      <PageHeader
        eyebrow={formatLongDate(currentSchoolDate())}
        title={`${greeting()}, ${displayName(me.data).split(" ")[0]}`}
        description={day.data?.onLeave ? "You're marked on leave today. Rest well; your classes are being covered." : duties.length ? `You have ${duties.length} cover dut${duties.length > 1 ? "ies" : "y"} today on top of your ${classes.length} classes.` : `You have ${classes.length} classes today and no cover duties.`}
        actions={<NewRequestDialog />}
      />

      <div className="grid gap-4 sm:grid-cols-3">
        <StatCard loading={day.isLoading} icon={CalendarCheck2} tone="peach" label="Classes today" value={classes.length} detail={`${PERIODS.length - busy.size} free periods`} />
        <StatCard loading={day.isLoading} icon={Repeat2} tone={duties.length ? "plum" : "sage"} label="Cover duties" value={duties.length} detail={duties.length ? duties.map((duty) => `P${duty.period} ${duty.className}`).join(", ") : "Nothing extra today"} />
        <StatCard loading={requests.isLoading} icon={ClipboardList} tone="honey" label="Requests waiting" value={pending} detail="Waiting for the office" to="/teacher/requests" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <Panel title="Today's schedule" description="Your classes and cover duties, in order" action={<Link to="/teacher/routine" className="text-sm font-semibold text-plum hover:underline">Weekly routine</Link>}>
          {day.isLoading ? <ListSkeleton rows={5} /> : day.error ? <ErrorState error={day.error} onRetry={() => void day.refetch()} /> : day.data?.day === "Sunday" ? (
            <EmptyState icon={Sun} title="No school today" description="Enjoy your Sunday." />
          ) : (
            <ol className="space-y-2">
              {PERIODS.map((period) => {
                const lesson = classes.find((item) => item.period === period.number);
                const duty = duties.find((item) => item.period === period.number);
                const isNow = now === period.number;
                return (
                  <Fragment key={period.number}>
                    <li className="flex gap-3">
                      <div className={cn("w-14 shrink-0 rounded-xl py-2 text-center", isNow ? "bg-plum text-cream" : "text-ink")}>
                        <p className="text-sm font-bold">P{period.number}</p>
                        <p className={cn("tabular text-2xs", isNow ? "text-cream/80" : "text-ink-muted")}>{formatTime(period.start)}</p>
                      </div>
                      {duty ? (
                        <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-xl border border-plum/30 bg-plum-50 px-3.5 py-2.5 sm:flex-row sm:items-center">
                          <div className="min-w-0 flex-1">
                            <p className="flex items-center gap-2 font-semibold text-ink"><Repeat2 className="h-4 w-4 text-plum" />Cover: {duty.className} · {duty.subject}</p>
                            <p className="text-xs text-ink-muted">For {duty.coveringFor} · Room {duty.className}</p>
                          </div>
                          {duty.acknowledged ? (
                            <span className="inline-flex items-center gap-1 text-xs font-semibold text-sage"><Check className="h-3.5 w-3.5" />Acknowledged</span>
                          ) : (
                            <Button size="sm" disabled={acknowledge.isPending} onClick={() => acknowledge.mutate(duty.id, { onSuccess: () => toast.success("Thanks! The office knows you've got it."), onError: (error) => toast.error(error.message) })}>
                              <Check />Got it
                            </Button>
                          )}
                        </div>
                      ) : lesson ? (
                        <div className={cn("min-w-0 flex-1 rounded-xl px-3.5 py-2.5", subjectClasses(lesson.subject).cell, lesson.onLeave && "opacity-50", nextPeriod === period.number && !isNow && "ring-2 ring-plum/40")}>
                          <p className="font-semibold">{lesson.className} · {lesson.subject}</p>
                          <p className="text-xs opacity-80">{/^\d/.test(lesson.room) ? `Room ${lesson.room}` : lesson.room}{lesson.onLeave ? " · being covered" : ""}{nextPeriod === period.number && !isNow ? " · up next" : ""}</p>
                        </div>
                      ) : (
                        <div className="flex-1 rounded-xl border border-dashed border-line-strong px-3.5 py-3 text-sm text-ink-soft">Free period</div>
                      )}
                    </li>
                    {period.number === LUNCH.afterPeriod ? <li className="ml-[4.25rem] rounded-xl bg-peach-50 px-3.5 py-2 text-xs font-semibold text-ink-muted"><Coffee className="mr-1.5 inline h-3.5 w-3.5 text-coral" />Lunch · {formatTime(LUNCH.start)} – {formatTime(LUNCH.end)}</li> : null}
                  </Fragment>
                );
              })}
            </ol>
          )}
        </Panel>
        <NoticesPanel />
      </div>
    </>
  );
}

/* --------------------------------------------------------------------- routine */

export function TeacherRoutinePage() {
  const me = useMe();
  const teacherId = me.data?.teacher?._id;
  const week = useWeek({ teacherId });
  const entries = (week.data?.entries ?? []).map((entry) => ({ day: entry.day, periodNumber: entry.periodNumber, subject: entry.subject, primary: `Class ${entry.className}`, room: entry.room }));
  const subjects = [...new Set(entries.map((entry) => entry.subject).filter(Boolean) as string[])];

  return (
    <>
      <PageHeader title="Weekly routine" description={entries.length ? `${entries.length} periods a week · ${48 - entries.length} free` : "Your published timetable for the week."} actions={entries.length ? <Button variant="outline" onClick={() => window.print()}>Print</Button> : null} />
      <section className="print-area rounded-2xl border border-line bg-paper p-4 shadow-soft sm:p-6">
        <div className="print-header"><strong>ClassSync · {displayName(me.data)}</strong><span>Weekly routine</span></div>
        {!teacherId && !me.isLoading ? (
          <EmptyState icon={CalendarDays} title="Your teacher profile isn't linked yet" description="Ask your school office to link your account to your timetable." />
        ) : week.isLoading || me.isLoading ? (
          <div className="space-y-2"><Skeleton className="h-10" /><Skeleton className="h-[420px]" /></div>
        ) : week.error ? (
          <ErrorState error={week.error} onRetry={() => void week.refetch()} />
        ) : entries.length === 0 ? (
          <EmptyState icon={CalendarDays} title="No classes in the timetable yet" description="Once the office publishes the timetable, your week appears here." />
        ) : (
          <>
            <TimetableGrid entries={entries} secondaryLabel="Class" today={schoolDayName(currentSchoolDate())} nowPeriod={currentPeriod()} caption="Your weekly routine" />
            <div className="no-print mt-5 border-t border-line pt-4"><SubjectLegend subjects={subjects} /></div>
          </>
        )}
      </section>
    </>
  );
}

/* -------------------------------------------------------------------- requests */

export function TeacherRequestsPage() {
  const requests = useMyRequests();
  return (
    <>
      <PageHeader title="My requests" description="Ask the office for leave, a period swap or an extra period. You'll be notified of the decision." actions={<NewRequestDialog />} />
      {requests.isLoading ? <ListSkeleton rows={3} /> : requests.error ? <ErrorState error={requests.error} onRetry={() => void requests.refetch()} /> : (requests.data ?? []).length === 0 ? (
        <EmptyState icon={ClipboardList} title="No requests yet" description="Need a day off or want to swap a period? Start a new request." action={<NewRequestDialog />} />
      ) : (
        <div className="space-y-3">{(requests.data ?? []).map((item) => <RequestCard key={item.id} item={item} showRequester={false} />)}</div>
      )}
    </>
  );
}

const TEACHER_TYPES: RequestType[] = ["LEAVE_NOTICE", "PERIOD_SWAP", "EXTRA_PERIOD"];

function NewRequestDialog() {
  const classes = useClasses();
  const subjects = useSubjects();
  const create = useCreateRequest();
  const tomorrow = toIsoDate(new Date(Date.now() + 86_400_000));
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<RequestType>("LEAVE_NOTICE");
  const [date, setDate] = useState(tomorrow);
  const [classId, setClassId] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [period, setPeriod] = useState("");
  const [otherPeriod, setOtherPeriod] = useState("");
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setType("LEAVE_NOTICE"); setDate(tomorrow); setClassId(""); setSubjectId(""); setPeriod(""); setOtherPeriod(""); setReason(""); setError(null); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!date || date < toIsoDate(new Date())) return setError("Choose today or a later date.");
    if (type !== "LEAVE_NOTICE" && !classId) return setError("Choose the class.");
    if (type !== "LEAVE_NOTICE" && !period) return setError("Choose the period.");
    if (type === "PERIOD_SWAP" && (!otherPeriod || otherPeriod === period)) return setError("Choose a different period to swap with.");
    if (reason.trim().length < 3) return setError("Add a short reason so the office understands.");
    const payload: Record<string, unknown> = { reason: reason.trim() };
    if (type !== "LEAVE_NOTICE") { payload.classSectionId = classId; payload.periodNumber = Number(period); }
    if (type === "PERIOD_SWAP") payload.otherPeriodNumber = Number(otherPeriod);
    if (type === "EXTRA_PERIOD" && subjectId) payload.subjectId = subjectId;
    try {
      await create.mutateAsync({ type, date, payload });
      toast.success("Request sent", { description: "The school office will review it." });
      setOpen(false);
      reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send the request.");
    }
  };

  const periodSelect = (id: string, value: string, onChange: (value: string) => void, label: string) => (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id}><SelectValue placeholder="Period" /></SelectTrigger>
        <SelectContent>{PERIODS.map((item) => <SelectItem key={item.number} value={String(item.number)}>Period {item.number} · {formatTime(item.start)}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
      <DialogTrigger asChild><Button><Plus />New request</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New request</DialogTitle>
          <DialogDescription>Nothing changes until the office approves it.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="grid grid-cols-3 gap-2">
            {TEACHER_TYPES.map((value) => (
              <button key={value} type="button" aria-pressed={type === value} onClick={() => setType(value)} className={cn("rounded-xl border px-2 py-2.5 text-sm font-semibold", type === value ? "border-plum bg-plum-50 text-plum" : "border-line-strong text-ink-muted")}>
                {REQUEST_LABEL[value]}
              </button>
            ))}
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="request-date">Date</Label>
              <Input id="request-date" type="date" min={toIsoDate(new Date())} value={date} onChange={(event) => setDate(event.target.value)} />
            </div>
            {type !== "LEAVE_NOTICE" ? (
              <div className="space-y-2">
                <Label htmlFor="request-class">Class</Label>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger id="request-class"><SelectValue placeholder="Choose class" /></SelectTrigger>
                  <SelectContent>{(classes.data ?? []).map((item) => <SelectItem key={item._id} value={item._id}>{item.grade}-{item.section}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : null}
          </div>
          {type === "PERIOD_SWAP" ? (
            <div className="grid gap-4 sm:grid-cols-2">{periodSelect("swap-from", period, setPeriod, "Move period")}{periodSelect("swap-to", otherPeriod, setOtherPeriod, "Swap with")}</div>
          ) : type === "EXTRA_PERIOD" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="request-subject">Subject</Label>
                <Select value={subjectId} onValueChange={setSubjectId}>
                  <SelectTrigger id="request-subject"><SelectValue placeholder="Subject" /></SelectTrigger>
                  <SelectContent>{(subjects.data ?? []).map((item) => <SelectItem key={item._id} value={item._id}>{item.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              {periodSelect("extra-period", period, setPeriod, "Period")}
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="request-reason">Reason</Label>
            <Textarea id="request-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={500} placeholder={type === "LEAVE_NOTICE" ? "e.g. Family function in Jaipur" : "e.g. Revision before the unit test"} />
          </div>
          {error ? <FormAlert>{error}</FormAlert> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? <><Loader2 className="animate-spin" />Sending…</> : "Send request"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
