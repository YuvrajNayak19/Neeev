import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { CoverageStatus, RequestStatus } from "@/lib/api";
import { cn } from "@/lib/utils";

type Tone = "plum" | "brick" | "sage" | "honey" | "peach";
const TONE: Record<Tone, string> = {
  plum: "bg-plum-50 text-plum",
  brick: "bg-brick-bg text-brick",
  sage: "bg-sage-bg text-sage",
  honey: "bg-honey-bg text-honey",
  peach: "bg-peach-100 text-ink",
};

export function StatCard({ label, value, detail, icon: Icon, tone = "plum", to, loading }: { label: string; value: ReactNode; detail?: ReactNode; icon: LucideIcon; tone?: Tone; to?: string; loading?: boolean }) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-sm font-semibold text-ink-muted">{label}</p>
        <span className={cn("grid h-9 w-9 shrink-0 place-items-center rounded-xl", TONE[tone])}><Icon className="h-[18px] w-[18px]" /></span>
      </div>
      {loading ? <Skeleton className="mt-3 h-9 w-16" /> : <p className="tabular mt-2 font-display text-[2.4rem] font-semibold leading-none text-ink">{value}</p>}
      {detail ? <p className="mt-2.5 text-[13px] leading-snug text-ink-muted">{detail}</p> : null}
    </>
  );
  const className = "block min-w-0 rounded-2xl border border-line bg-paper p-5 shadow-soft transition-[box-shadow,border-color]";
  return to ? <Link to={to} className={cn(className, "hover:border-plum/25 hover:shadow-lift")}>{body}</Link> : <div className={className}>{body}</div>;
}

export function CoverageBadge({ status, selfStudy }: { status: CoverageStatus; selfStudy?: boolean }) {
  if (status === "covered") return <Badge variant="success" dot>Covered</Badge>;
  if (status === "suggested") return <Badge variant="warning" dot>Needs your OK</Badge>;
  if (selfStudy) return <Badge variant="secondary" dot>Self-study</Badge>;
  return <Badge variant="destructive" dot>No teacher yet</Badge>;
}

export function RequestBadge({ status }: { status: RequestStatus }) {
  if (status === "APPROVED") return <Badge variant="success" dot>Approved</Badge>;
  if (status === "REJECTED") return <Badge variant="destructive" dot>Declined</Badge>;
  if (status === "PENDING_COUNTERPART") return <Badge variant="secondary" dot>Waiting for colleague</Badge>;
  return <Badge variant="warning" dot>Waiting for review</Badge>;
}

export function Panel({ title, description, action, children, className, bodyClassName }: { title: string; description?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return (
    <section className={cn("min-w-0 rounded-2xl border border-line bg-paper shadow-soft", className)}>
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line px-5 py-4">
        <div>
          <h2 className="text-base font-semibold text-ink">{title}</h2>
          {description ? <p className="mt-0.5 text-sm text-ink-muted">{description}</p> : null}
        </div>
        {action}
      </div>
      <div className={cn("p-5", bodyClassName)}>{children}</div>
    </section>
  );
}
