import { Loader2, UserX } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { FormAlert } from "@/components/app/form-field";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMarkAbsent, useTeachers } from "@/lib/api";
import { PERIODS, formatTime } from "@/lib/school-time";
import { cn } from "@/lib/utils";

/** Marks a teacher absent for the day (or some periods). The server drafts cover straight away. */
export function MarkAbsentDialog({ date, absentIds = [], trigger }: { date: string; absentIds?: string[]; trigger?: ReactNode }) {
  const teachers = useTeachers();
  const markAbsent = useMarkAbsent();
  const [open, setOpen] = useState(false);
  const [teacherId, setTeacherId] = useState("");
  const [fullDay, setFullDay] = useState(true);
  const [periods, setPeriods] = useState<number[]>([]);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);

  const reset = () => { setTeacherId(""); setFullDay(true); setPeriods([]); setReason(""); setError(null); };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!teacherId) return setError("Choose the teacher who is absent.");
    if (!fullDay && periods.length === 0) return setError("Pick at least one period, or choose Full day.");
    try {
      await markAbsent.mutateAsync({ teacherId, date, isFullDay: fullDay, affectedPeriods: fullDay ? [] : periods, reason: reason.trim() });
      const name = teachers.data?.find((teacher) => teacher._id === teacherId)?.name ?? "Teacher";
      toast.success(`${name} marked absent`, { description: "Substitutes have been suggested for their periods." });
      setOpen(false);
      reset();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Could not mark the absence.");
    }
  };

  const available = (teachers.data ?? []).filter((teacher) => !absentIds.includes(teacher._id));

  return (
    <Dialog open={open} onOpenChange={(value) => { setOpen(value); if (!value) reset(); }}>
      <DialogTrigger asChild>{trigger ?? <Button><UserX />Mark a teacher absent</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Mark a teacher absent</DialogTitle>
          <DialogDescription>ClassSync will suggest a substitute for each of their periods.</DialogDescription>
        </DialogHeader>
        <form noValidate onSubmit={(event) => void submit(event)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="absent-teacher">Teacher</Label>
            <Select value={teacherId} onValueChange={setTeacherId}>
              <SelectTrigger id="absent-teacher"><SelectValue placeholder={teachers.isLoading ? "Loading teachers…" : "Choose a teacher"} /></SelectTrigger>
              <SelectContent>
                {available.map((teacher) => <SelectItem key={teacher._id} value={teacher._id}>{teacher.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          <fieldset className="space-y-2">
            <legend className="text-sm font-semibold text-ink">How long?</legend>
            <div className="grid grid-cols-2 gap-2">
              {[{ value: true, label: "Full day" }, { value: false, label: "Some periods" }].map((option) => (
                <button key={option.label} type="button" aria-pressed={fullDay === option.value} onClick={() => setFullDay(option.value)} className={cn("rounded-xl border px-3 py-2.5 text-sm font-semibold transition-colors", fullDay === option.value ? "border-plum bg-plum-50 text-plum" : "border-line-strong text-ink-muted hover:text-ink")}>
                  {option.label}
                </button>
              ))}
            </div>
            {!fullDay ? (
              <div className="grid grid-cols-4 gap-2 pt-1">
                {PERIODS.map((period) => {
                  const selected = periods.includes(period.number);
                  return (
                    <button
                      key={period.number}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => setPeriods((items) => (selected ? items.filter((item) => item !== period.number) : [...items, period.number].sort()))}
                      className={cn("rounded-lg border px-2 py-2 text-center transition-colors", selected ? "border-plum bg-plum text-cream" : "border-line-strong text-ink hover:border-plum/40")}
                    >
                      <span className="block text-sm font-bold">P{period.number}</span>
                      <span className={cn("block text-2xs", selected ? "text-cream/80" : "text-ink-muted")}>{formatTime(period.start)}</span>
                    </button>
                  );
                })}
              </div>
            ) : null}
          </fieldset>

          <div className="space-y-2">
            <Label htmlFor="absent-reason">Reason <span className="font-normal text-ink-muted">(optional)</span></Label>
            <Input id="absent-reason" value={reason} onChange={(event) => setReason(event.target.value)} placeholder="e.g. Fever, exam duty" maxLength={300} />
          </div>

          {error ? <FormAlert>{error}</FormAlert> : null}
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button type="submit" disabled={markAbsent.isPending}>{markAbsent.isPending ? <><Loader2 className="animate-spin" />Saving…</> : "Mark absent"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
