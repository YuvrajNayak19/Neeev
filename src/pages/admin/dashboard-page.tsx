import { AlertCircle, ArrowRight, Check, ClipboardList, Loader2, MessageSquareHeart, Repeat2, UserCheck, UserPlus, UserX } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/app-shell";
import { Avatar } from "@/components/app/avatar";
import { Panel, StatCard } from "@/components/app/bits";
import { formatShortDate, greeting } from "@/lib/format";
import { MarkAbsentDialog } from "@/components/app/mark-absent-dialog";
import { NoticesPanel } from "@/components/app/notices-panel";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { REQUEST_LABEL, useAllRequests, useComplaints, useConfirmSubstitute, useCoverage, usePeople, type CoverageRow } from "@/lib/api";
import { PERIODS, currentPeriod, currentSchoolDate, formatLongDate, formatTime, toIsoDate } from "@/lib/school-time";
import { displayName, useMe } from "@/lib/session";
import { subjectClasses, subjectShort } from "@/lib/subject-style";
import { cn } from "@/lib/utils";

type Attention = { key: string; tone: "brick" | "honey" | "plum"; icon: typeof AlertCircle; title: ReactNode; detail: string; action: ReactNode };

export function AdminDashboardPage() {
  const me = useMe();
  const date = toIsoDate(currentSchoolDate());
  const coverage = useCoverage(date);
  const requests = useAllRequests();
  const people = usePeople();
  const complaints = useComplaints();
  const confirm = useConfirmSubstitute();

  const totals = coverage.data?.totals;
  const absences = coverage.data?.absences ?? [];
  const rows = coverage.data?.rows ?? [];
  const pendingRequests = (requests.data ?? []).filter((item) => item.status === "PENDING_ADMIN");
  const pendingPeople = (people.data ?? []).filter((item) => item.status === "PENDING");
  const openConcerns = (complaints.data ?? []).filter((item) => item.status === "OPEN");

  const attention: Attention[] = [
    ...rows.filter((row) => row.status === "uncovered" && !row.selfStudy).map((row) => ({
      key: row.id, tone: "brick" as const, icon: AlertCircle,
      title: <>{row.className} {row.subject} has no teacher in period {row.period}</>,
      detail: `${formatTime(row.time.split("–")[0])} · ${row.absentTeacher.name} is absent`,
      action: <Button asChild size="sm"><Link to={`/admin/substitutions?period=${row.id}`}>Find a substitute</Link></Button>,
    })),
    ...rows.filter((row) => row.status === "suggested").map((row) => ({
      key: row.id, tone: "honey" as const, icon: Repeat2,
      title: <>Confirm {row.substitute?.name} for {row.className} {row.subject}</>,
      detail: `Period ${row.period} · covering for ${row.absentTeacher.name}`,
      action: (
        <Button size="sm" variant="outline" disabled={confirm.isPending} onClick={() => confirm.mutate(row.id, { onSuccess: () => toast.success(`${row.substitute?.name} confirmed`, { description: `${row.className} · period ${row.period}. They've been notified.` }), onError: (error) => toast.error(error.message) })}>
          {confirm.isPending && confirm.variables === row.id ? <Loader2 className="animate-spin" /> : <Check />}Confirm
        </Button>
      ),
    })),
    ...(pendingRequests.length ? [{
      key: "requests", tone: "plum" as const, icon: ClipboardList,
      title: <>{pendingRequests.length} teacher request{pendingRequests.length > 1 ? "s" : ""} waiting</>,
      detail: pendingRequests.slice(0, 2).map((item) => `${item.requester}: ${REQUEST_LABEL[item.type].toLowerCase()} on ${formatShortDate(item.date)}`).join(" · "),
      action: <Button asChild size="sm" variant="outline"><Link to="/admin/requests">Review</Link></Button>,
    }] : []),
    ...(pendingPeople.length ? [{
      key: "people", tone: "plum" as const, icon: UserPlus,
      title: <>{pendingPeople.length} new sign-up{pendingPeople.length > 1 ? "s" : ""} to approve</>,
      detail: pendingPeople.slice(0, 3).map((item) => item.name).join(", "),
      action: <Button asChild size="sm" variant="outline"><Link to="/admin/accounts?status=PENDING">Review</Link></Button>,
    }] : []),
    ...(openConcerns.length ? [{
      key: "concerns", tone: "plum" as const, icon: MessageSquareHeart,
      title: <>{openConcerns.length} new student concern{openConcerns.length > 1 ? "s" : ""}</>,
      detail: "Not yet seen by the office",
      action: <Button asChild size="sm" variant="outline"><Link to="/admin/concerns">Read</Link></Button>,
    }] : []),
  ];

  const toneClass = { brick: "bg-brick-bg text-brick", honey: "bg-honey-bg text-honey", plum: "bg-plum-50 text-plum" };

  return (
    <>
      <PageHeader
        eyebrow={me.data?.school?.name ?? formatLongDate(currentSchoolDate())}
        title={`${greeting()}, ${displayName(me.data).split(" ")[0]}`}
        description={totals ? (totals.uncovered ? `${totals.uncovered} period${totals.uncovered > 1 ? "s" : ""} still need${totals.uncovered === 1 ? "s" : ""} a teacher today. Everything else is in hand.` : "Every period today has a teacher. Nice and calm.") : "Here's how your school day looks."}
        actions={<><MarkAbsentDialog date={date} absentIds={absences.map((item) => item.teacherId)} /><Button asChild variant="outline"><Link to="/admin/substitutions">Open substitutions<ArrowRight /></Link></Button></>}
      />

      {coverage.error ? <ErrorState error={coverage.error} onRetry={() => void coverage.refetch()} className="mb-6" /> : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard loading={coverage.isLoading} icon={UserX} tone="peach" label="Teachers absent today" value={absences.length} detail={absences.length ? absences.map((item) => item.name.split(" ")[0]).join(", ") : "Everyone is in today"} to="/admin/substitutions" />
        <StatCard loading={coverage.isLoading} icon={AlertCircle} tone={totals?.uncovered ? "brick" : "sage"} label="Periods uncovered" value={totals?.uncovered ?? 0} detail={totals ? `of ${totals.periods} that need cover today` : undefined} to="/admin/substitutions" />
        <StatCard loading={coverage.isLoading} icon={UserCheck} tone="sage" label="Substitutes assigned" value={totals?.covered ?? 0} detail={totals?.suggested ? `${totals.suggested} more waiting for your OK` : "All confirmed and notified"} to="/admin/substitutions" />
        <StatCard loading={requests.isLoading} icon={ClipboardList} tone="plum" label="Pending requests" value={pendingRequests.length} detail={pendingPeople.length ? `plus ${pendingPeople.length} sign-ups to approve` : "From teachers"} to="/admin/requests" />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <Panel title="Needs your attention" description="Sorted by what matters first this morning" bodyClassName="p-0">
          {coverage.isLoading || requests.isLoading ? <ListSkeleton className="p-5" rows={3} /> : attention.length === 0 ? (
            <EmptyState icon={Check} title="Nothing needs you right now" description="Every period is covered and there are no requests waiting." className="m-5" />
          ) : (
            <ul className="divide-y divide-line">
              {attention.map((item) => (
                <li key={item.key} className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
                  <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", toneClass[item.tone])}><item.icon className="h-[18px] w-[18px]" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-ink">{item.title}</p>
                    <p className="truncate text-sm text-ink-muted">{item.detail}</p>
                  </div>
                  <div className="shrink-0">{item.action}</div>
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Absent today" description={absences.length ? "Cover progress for each teacher" : undefined} action={<Link to="/admin/substitutions" className="text-sm font-semibold text-plum hover:underline">Manage</Link>}>
          {coverage.isLoading ? <ListSkeleton rows={3} /> : absences.length === 0 ? (
            <EmptyState icon={UserCheck} title="Everyone is in today" description="When a teacher is absent, mark it here and ClassSync suggests cover." className="py-8" />
          ) : (
            <ul className="space-y-4">
              {absences.map((absence) => {
                const percent = absence.periodsToCover ? Math.round((absence.periodsCovered / absence.periodsToCover) * 100) : 100;
                return (
                  <li key={absence.id} className="flex items-center gap-3">
                    <Avatar name={absence.name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="truncate font-semibold text-ink">{absence.name}</p>
                        <p className="tabular shrink-0 text-xs font-semibold text-ink-muted">{absence.periodsCovered}/{absence.periodsToCover} covered</p>
                      </div>
                      <p className="truncate text-xs text-ink-muted">{absence.isFullDay ? "Full day" : `Periods ${absence.periods.join(", ")}`}{absence.reason ? ` · ${absence.reason}` : ""}</p>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-sand" role="progressbar" aria-label={`${absence.name} cover progress`} aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                        <div className={cn("h-full rounded-full", percent === 100 ? "bg-sage" : "bg-plum")} style={{ width: `${percent}%` }} />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <CoverageBoard rows={rows} loading={coverage.isLoading} />
        <NoticesPanel canManage limit={3} />
      </div>
    </>
  );
}

function StatusDot({ status }: { status: CoverageRow["status"] }) {
  if (status === "covered") return <span title="Covered" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-sage-bg text-sage"><Check className="h-3.5 w-3.5" /></span>;
  if (status === "suggested") return <span title="Needs your OK" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-honey-bg text-honey"><Repeat2 className="h-3.5 w-3.5" /></span>;
  return <span title="No teacher yet" className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-brick-bg text-brick"><AlertCircle className="h-3.5 w-3.5" /></span>;
}

/** Today's cover laid out by period, like the staffroom whiteboard. */
function CoverageBoard({ rows, loading }: { rows: CoverageRow[]; loading: boolean }) {
  const now = currentPeriod();
  return (
    <Panel title="Today's coverage board" description="Every period that needs cover, by time of day" action={<Link to="/admin/substitutions" className="text-sm font-semibold text-plum hover:underline">Open board</Link>}>
      {loading ? <ListSkeleton rows={3} /> : rows.length === 0 ? (
        <EmptyState icon={Check} title="No cover needed today" description="Nobody is absent, so every class runs as planned." className="py-8" />
      ) : (
        <ol className="space-y-2.5">
          {PERIODS.filter((period) => rows.some((row) => row.period === period.number)).map((period) => (
            <li key={period.number} className="flex gap-3">
              <div className={cn("w-14 shrink-0 rounded-xl py-2 text-center", now === period.number ? "bg-plum text-cream" : "bg-sand/70 text-ink")}>
                <p className="text-sm font-bold">P{period.number}</p>
                <p className={cn("tabular text-2xs", now === period.number ? "text-cream/80" : "text-ink-muted")}>{formatTime(period.start)}</p>
              </div>
              <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2 2xl:grid-cols-3">
                {rows.filter((row) => row.period === period.number).map((row) => (
                  <Link key={row.id} to={`/admin/substitutions?period=${row.id}`} aria-label={`${row.className} ${row.subject}, period ${row.period}: ${row.substitute ? `${row.substitute.name} covering` : "needs a teacher"}`} className={cn("flex min-w-0 items-center gap-2.5 rounded-xl border p-2.5 transition-shadow hover:shadow-soft", row.status === "uncovered" ? "border-dashed border-brick/40 bg-brick-bg/40" : row.status === "suggested" ? "border-honey/30 bg-honey-bg/40" : "border-line bg-paper")}>
                    <span className={cn("shrink-0 rounded-md px-1.5 py-1 text-xs font-bold", subjectClasses(row.subject).cell)}>{row.className}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink">{subjectShort(row.subject)}</span>
                      <span className={cn("block truncate text-xs", row.status === "uncovered" ? "font-semibold text-brick" : "text-ink-muted")}>{row.substitute ? row.substitute.name : "Needs a teacher"}</span>
                    </span>
                    <StatusDot status={row.status} />
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}
