import { CheckCircle2, Eye, Loader2, Lock, MapPin, MessageSquareHeart, Send } from "lucide-react";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/app-shell";
import { Panel } from "@/components/app/bits";
import { timeAgo } from "@/lib/format";
import { FormAlert } from "@/components/app/form-field";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { COMPLAINT_LABEL, useComplaints, useCreateComplaint, useMyComplaints, useUpdateComplaint, type Complaint, type ComplaintCategory } from "@/lib/api";
import { cn } from "@/lib/utils";

const SERIOUS: ComplaintCategory[] = ["BULLYING", "HARASSMENT", "SAFETY", "TEACHER_CONDUCT"];

function ConcernStatus({ status }: { status: Complaint["status"] }) {
  if (status === "RESOLVED") return <Badge variant="success" dot>Resolved</Badge>;
  if (status === "SEEN") return <Badge variant="default" dot>Seen by office</Badge>;
  return <Badge variant="warning" dot>New</Badge>;
}

/* ------------------------------------------------------------------- admin view */

export function AdminConcernsPage() {
  const complaints = useComplaints();
  const update = useUpdateComplaint();
  const [filter, setFilter] = useState<"OPEN" | "SEEN" | "RESOLVED" | "all">("OPEN");
  const [resolving, setResolving] = useState<Complaint | null>(null);
  const [note, setNote] = useState("");

  const all = complaints.data ?? [];
  const list = all.filter((item) => filter === "all" || item.status === filter);
  const openCount = all.filter((item) => item.status === "OPEN").length;

  const markSeen = (item: Complaint) => update.mutate({ id: item._id, status: "SEEN" }, { onSuccess: () => toast.success("Marked as seen", { description: "The student can see that the office has read it." }), onError: (error) => toast.error(error.message) });
  const resolve = () => {
    if (!resolving) return;
    update.mutate({ id: resolving._id, status: "RESOLVED", resolutionNote: note.trim() }, {
      onSuccess: () => { toast.success("Concern resolved"); setResolving(null); setNote(""); },
      onError: (error) => toast.error(error.message),
    });
  };

  return (
    <>
      <PageHeader title="Student concerns" description="Things students have raised about facilities, studies or the timetable. Serious matters such as bullying go only to senior administrators." />
      <Tabs value={filter} onValueChange={(value) => setFilter(value as typeof filter)} className="mb-5">
        <TabsList aria-label="Filter concerns">
          <TabsTrigger value="OPEN">New {openCount ? <span className="rounded-full bg-plum px-1.5 text-2xs text-cream">{openCount}</span> : null}</TabsTrigger>
          <TabsTrigger value="SEEN">Seen</TabsTrigger>
          <TabsTrigger value="RESOLVED">Resolved</TabsTrigger>
          <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
      </Tabs>
      {complaints.isLoading ? <ListSkeleton rows={3} /> : complaints.error ? <ErrorState error={complaints.error} onRetry={() => void complaints.refetch()} /> : list.length === 0 ? (
        <EmptyState icon={MessageSquareHeart} title={filter === "OPEN" ? "No new concerns" : "Nothing here"} description="When students raise something, it appears here." />
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {list.map((item) => (
            <article key={item._id} className="flex flex-col rounded-2xl border border-line bg-paper p-5 shadow-soft">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-md bg-peach-100 px-2 py-0.5 text-xs font-semibold text-ink">{COMPLAINT_LABEL[item.category]}</span>
                <ConcernStatus status={item.status} />
                <span className="ml-auto text-xs text-ink-muted">{timeAgo(item.createdAt)}</span>
              </div>
              <p className="mt-3 leading-relaxed text-ink">{item.message}</p>
              <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                <span>{item.anonymous ? "Anonymous student" : item.studentId?.name ?? "Student"}{item.classSectionId?.grade ? ` · ${item.classSectionId.grade}-${item.classSectionId.section}` : ""}</span>
                {item.place ? <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{item.place}</span> : null}
              </p>
              {item.resolutionNote ? <p className="mt-3 rounded-xl bg-sage-bg/70 px-3 py-2 text-sm text-ink"><span className="font-semibold">Office note: </span>{item.resolutionNote}</p> : null}
              {item.status !== "RESOLVED" ? (
                <div className="mt-4 flex gap-2 border-t border-line pt-4">
                  {item.status === "OPEN" ? <Button size="sm" variant="outline" onClick={() => markSeen(item)} disabled={update.isPending}><Eye />Mark as seen</Button> : null}
                  <Button size="sm" onClick={() => { setResolving(item); setNote(""); }}><CheckCircle2 />Resolve</Button>
                </div>
              ) : null}
            </article>
          ))}
        </div>
      )}
      <Dialog open={Boolean(resolving)} onOpenChange={(value) => !value && setResolving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Resolve this concern</DialogTitle>
            <DialogDescription>Tell the student what was done. They'll see your note.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="resolution-note">What was done?</Label>
            <Textarea id="resolution-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder="e.g. The electrician fixed the fan this morning." />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setResolving(null)}>Cancel</Button>
            <Button onClick={resolve} disabled={update.isPending}>{update.isPending ? <Loader2 className="animate-spin" /> : <CheckCircle2 />}Mark resolved</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

/* ----------------------------------------------------------------- student view */

export function StudentConcernsPage() {
  const mine = useMyComplaints();
  const create = useCreateComplaint();
  const [category, setCategory] = useState<ComplaintCategory | "">("");
  const [place, setPlace] = useState("");
  const [message, setMessage] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const serious = category !== "" && SERIOUS.includes(category);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!category) return setError("Choose what your concern is about.");
    if (message.trim().length < 5) return setError("Tell us a little more (at least a few words).");
    try {
      await create.mutateAsync({ category, message: message.trim(), place: place.trim() || undefined, anonymous: serious && anonymous });
      toast.success("Sent to your school office", { description: serious ? "A senior administrator will look into it carefully." : "You'll see here when it has been read." });
      setCategory(""); setPlace(""); setMessage(""); setAnonymous(false);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not send your concern.");
    }
  };

  return (
    <>
      <PageHeader title="Raise a concern" description="Something not right at school? Tell the office. You can raise up to three concerns a day." />
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Panel title="Tell us what's wrong">
          <form noValidate onSubmit={(event) => void submit(event)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="concern-category">It's about…</Label>
              <Select value={category} onValueChange={(value) => setCategory(value as ComplaintCategory)}>
                <SelectTrigger id="concern-category"><SelectValue placeholder="Choose a topic" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(COMPLAINT_LABEL) as ComplaintCategory[]).map((key) => <SelectItem key={key} value={key}>{COMPLAINT_LABEL[key]}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="concern-place">Where? <span className="font-normal text-ink-muted">(optional)</span></Label>
              <Input id="concern-place" value={place} onChange={(event) => setPlace(event.target.value)} placeholder="e.g. Classroom 8-A, school bus" maxLength={120} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="concern-message">What happened?</Label>
              <Textarea id="concern-message" value={message} onChange={(event) => setMessage(event.target.value)} maxLength={4000} placeholder="Describe it in your own words." />
            </div>
            {serious ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-plum/20 bg-plum-50/60 p-3.5">
                <input type="checkbox" checked={anonymous} onChange={(event) => setAnonymous(event.target.checked)} className="mt-1 h-4 w-4 accent-[rgb(var(--plum))]" />
                <span>
                  <span className="flex items-center gap-1.5 text-sm font-semibold text-ink"><Lock className="h-3.5 w-3.5 text-plum" />Send without my name</span>
                  <span className="block text-xs text-ink-muted">Only a senior administrator reads serious concerns. Anonymous ones won't appear in your history below.</span>
                </span>
              </label>
            ) : null}
            {error ? <FormAlert>{error}</FormAlert> : null}
            <Button type="submit" disabled={create.isPending}>{create.isPending ? <><Loader2 className="animate-spin" />Sending…</> : <><Send />Send to office</>}</Button>
          </form>
        </Panel>

        <Panel title="What you've raised" description="Track what the office has done">
          {mine.isLoading ? <ListSkeleton rows={2} /> : mine.error ? <ErrorState error={mine.error} onRetry={() => void mine.refetch()} /> : (mine.data ?? []).length === 0 ? (
            <EmptyState icon={MessageSquareHeart} title="Nothing raised yet" description="Concerns you send will show up here with their status." className="py-8" />
          ) : (
            <ul className="space-y-3">
              {(mine.data ?? []).map((item) => (
                <li key={item._id} className={cn("rounded-xl border border-line p-3.5", item.status === "RESOLVED" && "bg-sage-bg/40")}>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-ink">{COMPLAINT_LABEL[item.category]}</span>
                    <ConcernStatus status={item.status} />
                    <span className="ml-auto text-xs text-ink-muted">{timeAgo(item.createdAt)}</span>
                  </div>
                  {item.resolutionNote ? <p className="mt-1.5 text-sm text-ink-muted"><span className="font-semibold text-ink">Office: </span>{item.resolutionNote}</p> : null}
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  );
}
