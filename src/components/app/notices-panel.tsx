import { Loader2, Megaphone, Plus, Trash2 } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Panel } from "@/components/app/bits";
import { timeAgo } from "@/lib/format";
import { FormAlert } from "@/components/app/form-field";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useCreateNotice, useDeleteNotice, useNotices, type Notice } from "@/lib/api";
import { cn } from "@/lib/utils";

const AUDIENCE: Record<Notice["audience"], string> = { ALL: "Everyone", STAFF: "Staff", STUDENTS: "Students" };

function PostNoticeDialog() {
  const create = useCreateNotice();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [audience, setAudience] = useState<Notice["audience"]>("ALL");
  const [error, setError] = useState<string | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (title.trim().length < 3) return setError("Give the notice a short title (at least 3 letters).");
    try {
      await create.mutateAsync({ title: title.trim(), body: body.trim(), audience });
      toast.success("Notice posted", { description: `Visible to ${AUDIENCE[audience].toLowerCase()}.` });
      setOpen(false);
      setTitle(""); setBody(""); setAudience("ALL"); setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not post the notice.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button size="sm" variant="soft"><Plus />Post a notice</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Post a notice</DialogTitle>
          <DialogDescription>It appears on dashboards straight away.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="notice-title">Title</Label>
            <Input id="notice-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="e.g. School closes early on Friday" maxLength={140} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notice-body">Details <span className="font-normal text-ink-muted">(optional)</span></Label>
            <Textarea id="notice-body" value={body} onChange={(event) => setBody(event.target.value)} maxLength={1000} />
          </div>
          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink">Who should see it?</legend>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(AUDIENCE) as Notice["audience"][]).map((value) => (
                <button key={value} type="button" aria-pressed={audience === value} onClick={() => setAudience(value)} className={cn("rounded-xl border px-3 py-2 text-sm font-semibold", audience === value ? "border-plum bg-plum-50 text-plum" : "border-line-strong text-ink-muted")}>
                  {AUDIENCE[value]}
                </button>
              ))}
            </div>
          </fieldset>
          {error ? <FormAlert>{error}</FormAlert> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={create.isPending}>{create.isPending ? <><Loader2 className="animate-spin" />Posting…</> : "Post notice"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export function NoticesPanel({ canManage = false, limit = 4, className }: { canManage?: boolean; limit?: number; className?: string }) {
  const notices = useNotices();
  const remove = useDeleteNotice();
  const items = (notices.data ?? []).slice(0, limit);
  return (
    <Panel title="Notices" description={canManage ? "What staff and students see" : "From your school office"} action={canManage ? <PostNoticeDialog /> : undefined} className={className}>
      {notices.isLoading ? <ListSkeleton rows={2} /> : notices.error ? <ErrorState error={notices.error} onRetry={() => void notices.refetch()} /> : items.length === 0 ? (
        <EmptyState icon={Megaphone} title="No notices yet" description={canManage ? "Post one to let everyone know about changes." : "Nothing new from the office."} className="py-8" />
      ) : (
        <ul className="space-y-3">
          {items.map((notice, index) => (
            <li key={notice.id} className={cn("group relative rounded-xl p-3.5", index % 2 === 0 ? "bg-peach-50" : "bg-blush-100/70")}>
              <div className="flex items-center gap-2">
                <Megaphone className="h-3.5 w-3.5 text-plum" />
                {canManage ? <Badge variant="outline" className="py-0 text-2xs">{AUDIENCE[notice.audience]}</Badge> : null}
                <span className="text-xs text-ink-muted">{timeAgo(notice.createdAt)}</span>
              </div>
              <p className="mt-1.5 pr-8 font-semibold text-ink">{notice.title}</p>
              {notice.body ? <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{notice.body}</p> : null}
              {canManage ? (
                <button
                  type="button"
                  aria-label={`Remove notice: ${notice.title}`}
                  onClick={() => remove.mutate(notice.id, { onSuccess: () => toast.success("Notice removed") })}
                  className="absolute right-2 top-2 grid h-8 w-8 place-items-center rounded-full text-ink-muted opacity-70 hover:bg-paper hover:text-brick group-hover:opacity-100"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
