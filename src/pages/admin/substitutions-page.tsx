import { BookOpen, Check, Loader2, Printer, Sparkles, UserCheck, UserX, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/app-shell";
import { Avatar } from "@/components/app/avatar";
import { CoverageBadge, Panel } from "@/components/app/bits";
import { MarkAbsentDialog } from "@/components/app/mark-absent-dialog";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAssignSubstitute, useCandidates, useConfirmSubstitute, useCoverage, useRemoveAbsence, type CoverageRow } from "@/lib/api";
import { currentSchoolDate, formatLongDate, formatTime, toIsoDate } from "@/lib/school-time";
import { subjectClasses } from "@/lib/subject-style";
import { cn } from "@/lib/utils";

type Filter = "all" | "uncovered" | "suggested" | "covered";

export function SubstitutionsPage() {
  const date = toIsoDate(currentSchoolDate());
  const coverage = useCoverage(date);
  const removeAbsence = useRemoveAbsence();
  const [params, setParams] = useSearchParams();
  const [filter, setFilter] = useState<Filter>("all");
  const openId = params.get("period");

  const rows = useMemo(() => coverage.data?.rows ?? [], [coverage.data]);
  const visible = rows.filter((row) => filter === "all" || row.status === filter);
  const totals = coverage.data?.totals;
  const openRow = rows.find((row) => row.id === openId) ?? null;
  const absences = coverage.data?.absences ?? [];

  const open = (row: CoverageRow) => setParams({ period: row.id }, { replace: true });
  const close = () => setParams({}, { replace: true });

  return (
    <>
      <PageHeader
        eyebrow={formatLongDate(currentSchoolDate())}
        title="Substitutions"
        description="Who's away, which periods need a teacher, and the best person to cover each one."
        actions={<>
          <MarkAbsentDialog date={date} absentIds={absences.map((item) => item.teacherId)} />
          {rows.length ? <Button variant="outline" onClick={() => window.print()}><Printer />Print for staffroom</Button> : null}
        </>}
      />

      {coverage.error ? <ErrorState error={coverage.error} onRetry={() => void coverage.refetch()} /> : (
        <div className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)]">
          <Panel title="Absent today" description={absences.length ? `${absences.length} teacher${absences.length > 1 ? "s" : ""}` : undefined} className="no-print h-fit">
            {coverage.isLoading ? <ListSkeleton rows={3} /> : absences.length === 0 ? (
              <EmptyState icon={UserCheck} title="Everyone is in" description="Mark an absence and cover is suggested right away." className="py-8" />
            ) : (
              <ul className="space-y-3">
                {absences.map((absence) => (
                  <li key={absence.id} className="flex items-center gap-3 rounded-xl border border-line p-3">
                    <Avatar name={absence.name} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-semibold text-ink">{absence.name}</p>
                      <p className="truncate text-xs text-ink-muted">{absence.isFullDay ? "Full day" : `P${absence.periods.join(", P")}`}{absence.reason ? ` · ${absence.reason}` : ""}</p>
                      <p className="mt-1 text-xs font-semibold text-ink-muted">{absence.periodsCovered} of {absence.periodsToCover} periods covered</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`${absence.name} is back: remove absence`}
                      title="Teacher is back"
                      disabled={removeAbsence.isPending}
                      onClick={() => removeAbsence.mutate(absence.id, { onSuccess: () => toast.success(`${absence.name} marked as present`), onError: (error) => toast.error(error.message) })}
                    >
                      <X />
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <section className="print-area min-w-0 rounded-2xl border border-line bg-paper shadow-soft">
            <div className="print-header"><strong>ClassSync · Substitution notice</strong><span>{formatLongDate(currentSchoolDate())}</span></div>
            <div className="no-print flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
              <div>
                <h2 className="text-base font-semibold text-ink">Periods that need cover</h2>
                <p className="text-sm text-ink-muted">{totals ? `${totals.covered} covered · ${totals.suggested} waiting for your OK · ${totals.uncovered} without a teacher` : "Loading…"}</p>
              </div>
              <Tabs value={filter} onValueChange={(value) => setFilter(value as Filter)}>
                <TabsList aria-label="Filter periods">
                  <TabsTrigger value="all">All {totals ? <span className="text-ink-muted">{totals.periods}</span> : null}</TabsTrigger>
                  <TabsTrigger value="uncovered">No teacher {totals?.uncovered ? <span className="rounded-full bg-brick px-1.5 text-2xs text-cream">{totals.uncovered}</span> : null}</TabsTrigger>
                  <TabsTrigger value="suggested">Needs OK</TabsTrigger>
                  <TabsTrigger value="covered">Covered</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {coverage.isLoading ? <ListSkeleton className="p-5" rows={5} /> : rows.length === 0 ? (
              <EmptyState icon={Check} title="No cover needed today" description="When you mark a teacher absent, their periods appear here with suggested substitutes." className="m-5" />
            ) : visible.length === 0 ? (
              <EmptyState icon={Check} title="Nothing in this list" description="Try another filter." className="m-5" />
            ) : (
              <ul className="divide-y divide-line">
                {visible.map((row) => <CoverRow key={row.id} row={row} onOpen={() => open(row)} />)}
              </ul>
            )}
            <table className="hidden print:table">
              <thead><tr><th>Period</th><th>Time</th><th>Class</th><th>Subject</th><th>Absent</th><th>Covered by</th></tr></thead>
              <tbody>{rows.map((row) => <tr key={row.id}><td>P{row.period}</td><td>{row.time}</td><td>{row.className}</td><td>{row.subject}</td><td>{row.absentTeacher.name}</td><td>{row.substitute?.name ?? (row.selfStudy ? "Self-study" : "—")}</td></tr>)}</tbody>
            </table>
          </section>
        </div>
      )}

      <SuggestionsDialog row={openRow} onClose={close} />
    </>
  );
}

function CoverRow({ row, onOpen }: { row: CoverageRow; onOpen: () => void }) {
  const confirm = useConfirmSubstitute();
  return (
    <li className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center">
      <div className="flex min-w-0 flex-1 items-center gap-4">
        <div className="w-16 shrink-0 text-center">
          <p className="font-bold text-ink">P{row.period}</p>
          <p className="tabular whitespace-nowrap text-2xs text-ink-muted">{formatTime(row.time.split("–")[0])}</p>
        </div>
        <div className="min-w-0">
          <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
            {row.className}
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", subjectClasses(row.subject).cell)}>{row.subject}</span>
          </p>
          <p className="mt-0.5 truncate text-sm text-ink-muted">
            {row.substitute ? <><span className="font-semibold text-ink">{row.substitute.name}</span> covering for {row.absentTeacher.name}</> : <>{row.absentTeacher.name} is absent{row.selfStudy ? " · supervised self-study" : ""}</>}
          </p>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-2 pl-20 md:pl-0">
        <CoverageBadge status={row.status} selfStudy={row.selfStudy} />
        {row.status === "suggested" ? (
          <Button size="sm" disabled={confirm.isPending} onClick={() => confirm.mutate(row.id, { onSuccess: () => toast.success(`${row.substitute?.name} confirmed for ${row.className}`, { description: "They've been notified." }), onError: (error) => toast.error(error.message) })}>
            {confirm.isPending ? <Loader2 className="animate-spin" /> : <Check />}Confirm
          </Button>
        ) : null}
        <Button size="sm" variant={row.status === "uncovered" ? "default" : "outline"} onClick={onOpen}>
          {row.status === "uncovered" ? "Find a substitute" : "Change"}
        </Button>
      </div>
    </li>
  );
}

function SuggestionsDialog({ row, onClose }: { row: CoverageRow | null; onClose: () => void }) {
  const candidates = useCandidates(row?.id ?? null);
  const assign = useAssignSubstitute();
  const list = candidates.data?.candidates ?? [];

  const choose = (teacherId: string | null, name?: string) => {
    if (!row) return;
    assign.mutate(
      { rowId: row.id, teacherId },
      {
        onSuccess: () => {
          toast.success(teacherId ? `${name} will cover ${row.className}` : `${row.className} set to self-study`, { description: teacherId ? `Period ${row.period} · ${row.subject}. ${name?.split(" ")[0]} has been notified.` : `Period ${row.period}. A staff member should look in on the class.` });
          onClose();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog open={Boolean(row)} onOpenChange={(value) => !value && onClose()}>
      <DialogContent className="max-w-xl">
        {row ? (
          <>
            <DialogHeader>
              <DialogTitle>Cover {row.className} · {row.subject}</DialogTitle>
              <DialogDescription>Period {row.period}, {row.time.split("–").map(formatTime).join(" – ")} · {row.absentTeacher.name} is absent. Best match first.</DialogDescription>
            </DialogHeader>
            {candidates.isLoading ? <ListSkeleton rows={3} /> : candidates.error ? <ErrorState error={candidates.error} onRetry={() => void candidates.refetch()} /> : list.length === 0 ? (
              <EmptyState icon={UserX} title="Nobody is free this period" description="Every eligible teacher is teaching or away. You can set the class to supervised self-study." className="py-8" />
            ) : (
              <ul className="space-y-2.5">
                {list.map((candidate, index) => (
                  <li key={candidate.id} className={cn("flex flex-col gap-3 rounded-2xl border p-3.5 sm:flex-row sm:items-center", index === 0 ? "border-plum/30 bg-plum-50/60" : "border-line")}>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={candidate.name} />
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-2 font-semibold text-ink">
                          {candidate.name}
                          {index === 0 ? <Badge className="bg-plum text-cream"><Sparkles className="h-3 w-3" />Best match</Badge> : null}
                          <span className="text-xs font-medium text-ink-muted">{candidate.category}</span>
                        </p>
                        <p className="mt-1 flex flex-wrap gap-1.5">
                          {candidate.reasons.map((reason) => <span key={reason} className="rounded-md bg-sand px-2 py-0.5 text-xs font-medium text-ink-muted">{reason}</span>)}
                        </p>
                      </div>
                    </div>
                    <Button size="sm" variant={index === 0 ? "default" : "outline"} disabled={assign.isPending || row.substitute?.id === candidate.id} onClick={() => choose(candidate.id, candidate.name)} className="shrink-0">
                      {assign.isPending && assign.variables?.teacherId === candidate.id ? <Loader2 className="animate-spin" /> : <UserCheck />}Assign
                    </Button>
                  </li>
                ))}
              </ul>
            )}
            <div className="flex flex-col-reverse gap-2 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-xs text-ink-muted">Only teachers who are free, present and eligible for class {row.className.split("-")[0]} are shown.</p>
              {!row.selfStudy ? <Button variant="ghost" size="sm" disabled={assign.isPending} onClick={() => choose(null)}><BookOpen />Set to self-study</Button> : null}
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
