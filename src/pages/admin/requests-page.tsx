import { Check, ClipboardList, Loader2, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/app/app-shell";
import { RequestCard } from "@/components/app/request-card";
import { describeRequest } from "@/lib/format";
import { EmptyState, ErrorState, ListSkeleton } from "@/components/app/states";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { REQUEST_LABEL, useAllRequests, useDecideRequest, type RequestType, type SchoolRequest } from "@/lib/api";

type StatusFilter = "waiting" | "APPROVED" | "REJECTED" | "all";

export function RequestsPage() {
  const requests = useAllRequests();
  const [status, setStatus] = useState<StatusFilter>("waiting");
  const [type, setType] = useState<RequestType | "all">("all");
  const [deciding, setDeciding] = useState<{ item: SchoolRequest; decision: "APPROVED" | "REJECTED" } | null>(null);

  const all = requests.data ?? [];
  const count = (filter: StatusFilter) => all.filter((item) => matches(item, filter)).length;
  const list = all.filter((item) => matches(item, status) && (type === "all" || item.type === type));

  return (
    <>
      <PageHeader title="Requests" description="Leave, period swaps and extra periods asked for by teachers. Approved leave is added to absences automatically." />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Tabs value={status} onValueChange={(value) => setStatus(value as StatusFilter)}>
          <TabsList aria-label="Filter by status">
            <TabsTrigger value="waiting">Waiting {count("waiting") ? <span className="rounded-full bg-plum px-1.5 text-2xs text-cream">{count("waiting")}</span> : null}</TabsTrigger>
            <TabsTrigger value="APPROVED">Approved</TabsTrigger>
            <TabsTrigger value="REJECTED">Declined</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="w-full sm:w-52">
          <Label htmlFor="request-type" className="sr-only">Request type</Label>
          <Select value={type} onValueChange={(value) => setType(value as RequestType | "all")}>
            <SelectTrigger id="request-type" className="h-10"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All request types</SelectItem>
              {(Object.keys(REQUEST_LABEL) as RequestType[]).map((key) => <SelectItem key={key} value={key}>{REQUEST_LABEL[key]}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      {requests.isLoading ? <ListSkeleton rows={4} /> : requests.error ? <ErrorState error={requests.error} onRetry={() => void requests.refetch()} /> : list.length === 0 ? (
        <EmptyState icon={ClipboardList} title={status === "waiting" ? "No requests waiting" : "No requests here"} description={status === "waiting" ? "When a teacher asks for leave or a change, it shows up here for you to approve." : "Try another filter."} />
      ) : (
        <div className="space-y-3">
          {list.map((item) => (
            <RequestCard
              key={item.id}
              item={item}
              actions={item.status === "PENDING_ADMIN" ? (
                <>
                  <Button size="sm" onClick={() => setDeciding({ item, decision: "APPROVED" })}><Check />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => setDeciding({ item, decision: "REJECTED" })}><X />Decline</Button>
                </>
              ) : undefined}
            />
          ))}
        </div>
      )}

      <DecisionDialog state={deciding} onClose={() => setDeciding(null)} />
    </>
  );
}

function matches(item: SchoolRequest, filter: StatusFilter) {
  if (filter === "all") return true;
  if (filter === "waiting") return item.status === "PENDING_ADMIN" || item.status === "PENDING_COUNTERPART";
  return item.status === filter;
}

function DecisionDialog({ state, onClose }: { state: { item: SchoolRequest; decision: "APPROVED" | "REJECTED" } | null; onClose: () => void }) {
  const decide = useDecideRequest();
  const [note, setNote] = useState("");
  const approving = state?.decision === "APPROVED";

  const submit = () => {
    if (!state) return;
    decide.mutate(
      { id: state.item.id, decision: state.decision, note: note.trim() },
      {
        onSuccess: () => {
          toast.success(approving ? "Request approved" : "Request declined", { description: `${state.item.requester} has been told.${approving && state.item.type === "LEAVE_NOTICE" ? " Their absence is added and cover has been suggested." : ""}` });
          setNote("");
          onClose();
        },
        onError: (error) => toast.error(error.message),
      },
    );
  };

  return (
    <Dialog open={Boolean(state)} onOpenChange={(value) => { if (!value) { setNote(""); onClose(); } }}>
      <DialogContent>
        {state ? (
          <>
            <DialogHeader>
              <DialogTitle>{approving ? "Approve" : "Decline"} {state.item.requester}'s request?</DialogTitle>
              <DialogDescription>{REQUEST_LABEL[state.item.type]}: {describeRequest(state.item).toLowerCase()}.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <Label htmlFor="decision-note">Note to {state.item.requester.split(" ")[0]} <span className="font-normal text-ink-muted">({approving ? "optional" : "recommended"})</span></Label>
              <Textarea id="decision-note" value={note} onChange={(event) => setNote(event.target.value)} maxLength={1000} placeholder={approving ? "e.g. Approved. Please leave lesson notes with the office." : "e.g. The lab is booked that day. Could we try Saturday?"} />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button variant={approving ? "default" : "destructive"} disabled={decide.isPending} onClick={submit}>
                {decide.isPending ? <Loader2 className="animate-spin" /> : approving ? <Check /> : <X />}
                {approving ? "Approve" : "Decline"}
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
