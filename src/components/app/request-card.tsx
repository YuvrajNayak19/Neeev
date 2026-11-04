import { CalendarDays, MessageSquareQuote } from "lucide-react";
import type { ReactNode } from "react";
import { Avatar } from "@/components/app/avatar";
import { RequestBadge } from "@/components/app/bits";
import { describeRequest, formatShortDate } from "@/lib/format";
import { REQUEST_LABEL, type SchoolRequest } from "@/lib/api";

export function RequestCard({ item, showRequester = true, actions }: { item: SchoolRequest; showRequester?: boolean; actions?: ReactNode }) {
  return (
    <article className="flex flex-col gap-4 rounded-2xl border border-line bg-paper p-4 shadow-soft sm:p-5 md:flex-row md:items-start">
      <div className="flex min-w-0 flex-1 gap-3.5">
        {showRequester ? <Avatar name={item.requester} /> : null}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            {showRequester ? <p className="font-semibold text-ink">{item.requester}</p> : null}
            <span className="rounded-md bg-peach-100 px-2 py-0.5 text-xs font-semibold text-ink">{REQUEST_LABEL[item.type]}</span>
            <RequestBadge status={item.status} />
          </div>
          <p className="mt-1.5 text-ink">{describeRequest(item)}</p>
          <p className="mt-1 flex items-center gap-1.5 text-sm text-ink-muted"><CalendarDays className="h-3.5 w-3.5" />{formatShortDate(item.date)}</p>
          {item.reason ? <p className="mt-2 rounded-xl bg-sand/60 px-3 py-2 text-sm italic text-ink-muted">“{item.reason}”</p> : null}
          {item.decisionNote ? (
            <p className="mt-2 flex items-start gap-2 text-sm text-ink-muted"><MessageSquareQuote className="mt-0.5 h-4 w-4 shrink-0 text-plum" /><span><span className="font-semibold text-ink">Office: </span>{item.decisionNote}</span></p>
          ) : null}
        </div>
      </div>
      {actions ? <div className="flex shrink-0 gap-2 md:flex-col md:items-stretch">{actions}</div> : null}
    </article>
  );
}
