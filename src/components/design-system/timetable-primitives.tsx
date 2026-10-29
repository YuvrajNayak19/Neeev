import { Command } from "cmdk";
import { ChevronRight, Clock3, LockKeyhole } from "lucide-react";
import { forwardRef, type ReactNode } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog as BaseDialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export type SubjectCategory = "stem" | "humanities" | "electives" | "sports";
export type TimetableCellVariant = "normal" | "cover" | "locked" | "forced" | "free" | "holiday";

export interface TimetableCellData {
  subject: string;
  teacher: string;
  qualification: "TGT" | "PGT";
  room: string;
  category: SubjectCategory;
  variant?: TimetableCellVariant;
  absentTeacher?: string;
  holidayName?: string;
  workload?: string;
  displayPrimary?: string;
  displaySecondary?: string;
  displayMeta?: string;
}

const categoryStyle: Record<SubjectCategory, string> = {
  stem: "border-l-sky-500 bg-sky-50/80 text-slate-900",
  humanities: "border-l-amber-500 bg-amber-50/80 text-slate-900",
  electives: "border-l-violet-500 bg-violet-50/80 text-slate-900",
  sports: "border-l-emerald-500 bg-emerald-50/80 text-slate-900",
};

export const TimetableCell = forwardRef<HTMLButtonElement, { data: TimetableCellData; className?: string } & React.ButtonHTMLAttributes<HTMLButtonElement>>(function TimetableCell({ data, className, ...props }, ref) {
  const variant = data.variant ?? "normal";
  const label = variant === "cover" ? `Cover. Sub for ${data.absentTeacher ?? "absent teacher"}` : variant === "holiday" ? `Holiday: ${data.holidayName ?? "School holiday"}` : `${data.subject}, ${data.teacher}, ${data.room}`;

  if (variant === "free") {
    return <button ref={ref} type="button" aria-label="Free period" className={cn("group flex h-full min-h-[76px] w-full items-center justify-center rounded-lg border border-dashed border-[#d6dbe4] bg-transparent text-[12px] text-[#596273] transition duration-200 hover:-translate-y-px hover:border-[#8f82dc] hover:bg-[#f7f5ff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7966dc] dark:border-[#404453] dark:text-[#b9bfcc] dark:hover:bg-[#232633]", className)} {...props}><span className="opacity-70 group-hover:opacity-100">Free</span></button>;
  }
  if (variant === "holiday") {
    return <div role="gridcell" aria-label={label} className={cn("flex min-h-[76px] h-full items-center justify-center rounded-lg border border-[#e8e0d2] bg-[repeating-linear-gradient(135deg,#fbf8f2,#fbf8f2_5px,#f3eee4_5px,#f3eee4_10px)] px-2 text-center text-[12px] font-medium text-[#645b4d] dark:border-[#5b5142] dark:bg-[repeating-linear-gradient(135deg,#28251f,#28251f_5px,#302c24_5px,#302c24_10px)] dark:text-[#d3c7b4]", className)}>{label}</div>;
  }

  return (
    <button ref={ref} type="button" role="gridcell" aria-label={label} title={`${data.teacher} · ${data.workload ?? "4 periods today"}`} className={cn("group relative flex h-full min-h-[76px] w-full flex-col items-start justify-center overflow-hidden rounded-lg border border-transparent border-l-[3px] px-2 py-1.5 text-left shadow-[0_1px_2px_rgba(20,25,40,0.04)] transition duration-200 hover:-translate-y-px hover:shadow-[0_4px_12px_rgba(20,25,40,0.10)] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#7966dc]", categoryStyle[data.category], variant === "cover" && "border-y border-r border-y-emerald-200 border-r-emerald-200 border-l-emerald-600 bg-emerald-50", variant === "forced" && "border-y border-r border-y-amber-300 border-r-amber-300 border-l-amber-600 bg-amber-50", variant === "locked" && "border-y border-r border-y-[#e3e5eb] border-r-[#e3e5eb] bg-[#f1f3f7]", "dark:border-y-[#343848] dark:border-r-[#343848] dark:text-[#f3f4f8] dark:bg-[#272b38]", className)} {...props}>
      <span className="flex w-full items-center justify-between gap-1">
        <span className="truncate text-[14px] font-semibold leading-4">{data.displayPrimary ?? data.subject}</span>
        {variant === "locked" ? <LockKeyhole className="size-3 shrink-0 text-[#697386]" /> : null}
        {variant === "cover" ? <Badge className="h-5 shrink-0 rounded-sm border-emerald-200 bg-white px-1 text-[12px] font-semibold text-emerald-800 hover:bg-white">Cover</Badge> : null}
        {variant === "forced" ? <Badge className="h-5 shrink-0 rounded-sm border-amber-300 bg-amber-100 px-1 text-[12px] font-semibold text-amber-900 hover:bg-amber-100">Forced</Badge> : null}
      </span>
      <span className="mt-1 flex max-w-full items-center gap-1 truncate text-[12px] leading-4 text-[#454e5e] dark:text-[#c3c8d3]">
        {variant === "cover" ? `Sub for ${data.absentTeacher ?? "teacher"}` : data.displaySecondary ?? data.teacher}
        <span className="shrink-0 rounded-sm border border-black/10 px-1 py-[1px] font-mono text-[11px] uppercase leading-3 dark:border-white/20">{data.qualification}</span>
      </span>
      <span className="mt-0.5 truncate font-mono text-[12px] leading-4 text-[#596273] dark:text-[#b9bfcc]">{data.displayMeta ?? data.room}</span>
    </button>
  );
});

export function MetricCard({ label, value, detail, icon, className }: { label: string; value: string; detail?: string; icon?: ReactNode; className?: string }) {
  return <section className={cn("rounded-xl border border-[#e5e7ed] bg-white p-4 dark:border-[#343848] dark:bg-[#20232d]", className)}><div className="flex items-center justify-between text-[12px] font-medium text-[#596273] dark:text-[#c3c8d3]"><span>{label}</span>{icon}</div><div className="mt-2 text-[24px] font-semibold leading-7 tracking-[-0.5px] text-[#171923] dark:text-white">{value}</div>{detail ? <p className="mt-1 text-[12px] text-[#596273] dark:text-[#b9bfcc]">{detail}</p> : null}</section>;
}

export function CoverageRing({ value, label = "Coverage" }: { value: number; label?: string }) {
  const safeValue = Math.max(0, Math.min(100, value));
  return <div className="relative grid size-[76px] shrink-0 place-items-center rounded-full" role="img" aria-label={`${label}: ${safeValue}%`} style={{ background: `conic-gradient(#442dc5 ${safeValue}%, #e9eaf0 ${safeValue}% 100%)` }}><div className="grid size-[60px] place-items-center rounded-full bg-white text-center dark:bg-[#20232d]"><span className="font-mono text-[14px] font-semibold text-[#272a36] dark:text-white">{safeValue}%</span></div></div>;
}

export function NowNextCard({ now, next }: { now: { period: string; time: string; subject: string; room: string }; next: { period: string; time: string; subject: string; room: string } }) {
  return <section className="rounded-xl border border-[#e5e7ed] bg-white p-4 dark:border-[#343848] dark:bg-[#20232d]"><div className="flex items-center gap-2 text-[12px] font-semibold"><Clock3 className="size-4 text-[#5140bd]" />Now & next</div><div className="mt-3 grid grid-cols-2 gap-3"><NowNextItem caption="Now" item={now} emphasis /><NowNextItem caption="Up next" item={next} /></div></section>;
}

function NowNextItem({ caption, item, emphasis }: { caption: string; item: { period: string; time: string; subject: string; room: string }; emphasis?: boolean }) {
  return <div className={cn("min-w-0 border-l-2 pl-2.5", emphasis ? "border-[#5945cf]" : "border-[#d9dde5]")}><div className="text-[12px] font-medium text-[#596273] dark:text-[#b9bfcc]">{caption} · {item.period}</div><div className="mt-1 truncate text-[14px] font-semibold">{item.subject}</div><div className="mt-1 truncate font-mono text-[12px] text-[#596273] dark:text-[#b9bfcc]">{item.time}</div><div className="truncate text-[12px] text-[#596273] dark:text-[#b9bfcc]">{item.room}</div></div>;
}

export function Drawer({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode }) {
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="right" className="w-full max-w-[420px] border-[#e5e7ed] bg-white p-5 text-[#171923] dark:border-[#343848] dark:bg-[#20232d] dark:text-white"><SheetHeader><SheetTitle>{title}</SheetTitle>{description ? <SheetDescription>{description}</SheetDescription> : null}</SheetHeader><div className="mt-5">{children}</div></SheetContent></Sheet>;
}

export function Dialog({ open, onOpenChange, title, description, children }: { open: boolean; onOpenChange: (open: boolean) => void; title: string; description?: string; children: ReactNode }) {
  return <BaseDialog open={open} onOpenChange={onOpenChange}><DialogContent className="border-[#e5e7ed] bg-white text-[#171923] dark:border-[#343848] dark:bg-[#20232d] dark:text-white"><DialogHeader><DialogTitle>{title}</DialogTitle>{description ? <DialogDescription>{description}</DialogDescription> : null}</DialogHeader>{children}</DialogContent></BaseDialog>;
}

export function Toast({ title, description }: { title: string; description?: string }) {
  return <Button variant="outline" className="h-9 rounded-lg border-[#dfe2e9] bg-white text-[12px]" onClick={() => toast(title, { description })}>Show toast</Button>;
}

export function CommandMenu({ open, onOpenChange, items }: { open: boolean; onOpenChange: (open: boolean) => void; items: Array<{ label: string; detail?: string; onSelect: () => void }> }) {
  return <BaseDialog open={open} onOpenChange={onOpenChange}><DialogContent className="gap-0 overflow-hidden border-[#e5e7ed] bg-white p-0 dark:border-[#343848] dark:bg-[#20232d]"><Command className="[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:text-[#596273]"><Command.Input placeholder="Search actions…" className="h-11 w-full border-b border-[#e5e7ed] bg-transparent px-4 text-[14px] outline-none placeholder:text-[#697386] dark:border-[#343848]" /><Command.List className="max-h-72 overflow-y-auto p-1.5"><Command.Empty className="px-3 py-6 text-center text-[12px] text-[#596273]">No matching actions.</Command.Empty><Command.Group heading="Actions">{items.map((item) => <Command.Item key={item.label} value={item.label} onSelect={() => { item.onSelect(); onOpenChange(false); }} className="flex cursor-pointer items-center justify-between rounded-md px-3 py-2.5 text-[13px] aria-selected:bg-[#f1efff] aria-selected:text-[#302184] dark:aria-selected:bg-[#2c2940]"><span>{item.label}{item.detail ? <span className="ml-2 text-[12px] text-[#596273]">{item.detail}</span> : null}</span><ChevronRight className="size-4" /></Command.Item>)}</Command.Group></Command.List></Command></DialogContent></BaseDialog>;
}