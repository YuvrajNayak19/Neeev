import { AlertTriangle, Bell, Check, CheckCircle2, Clock, Megaphone, Sparkles, UserX } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { subjectClasses } from "@/lib/subject-style";

/*
 * Small, static mock-ups of real ClassSync screens for the landing page.
 * They are illustrations: wrapped in aria-hidden frames with a text description,
 * and their "buttons" are spans, so nothing on the page is a dead control.
 */

function Frame({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <figure className={cn("relative rounded-2xl border border-line bg-paper p-4 shadow-card sm:p-5", className)}>
      <figcaption className="sr-only">{label}</figcaption>
      <div aria-hidden="true">{children}</div>
    </figure>
  );
}

function Chip({ subject, children, className }: { subject: string; children?: ReactNode; className?: string }) {
  return <span className={cn("inline-flex items-center rounded-md px-2 py-0.5 text-xs font-semibold", subjectClasses(subject).cell, className)}>{children ?? subject}</span>;
}

function Initials({ name, tone = "peach" }: { name: string; tone?: "peach" | "blush" | "plum" | "sage" }) {
  const initials = name.replace(/^(Mr|Ms|Mrs|Dr)\.?\s+/i, "").split(" ").map((part) => part[0]).slice(0, 2).join("");
  const tones = { peach: "bg-peach-200 text-ink", blush: "bg-blush-200 text-ink", plum: "bg-plum-100 text-plum", sage: "bg-sage-bg text-sage" };
  return <span className={cn("grid h-8 w-8 shrink-0 place-items-center rounded-full text-xs font-bold", tones[tone])}>{initials}</span>;
}

/* ---------------------------------------------------------------- hero */

export function HeroCoverageCard() {
  const rows = [
    { period: "P1", time: "8:20", cls: "8-A", subject: "Mathematics", cover: "Arjun Rao", reason: "Free · teaches Maths", state: "done" as const },
    { period: "P2", time: "9:00", cls: "9-B", subject: "English", cover: "Fatima Khan", reason: "Free · knows 9-B", state: "suggested" as const },
    { period: "P3", time: "9:40", cls: "6-A", subject: "Science", cover: "Priya Menon", reason: "Free · lightest day", state: "done" as const },
  ];
  return (
    <Frame label="Example ClassSync coverage card: Kavita Iyer is absent and her three periods have substitutes assigned or suggested." className="w-full max-w-[460px] p-0 sm:p-0">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3.5 sm:px-5">
        <div>
          <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Wednesday · Coverage</p>
          <p className="mt-0.5 font-display text-lg font-semibold text-ink">Kavita Iyer is on leave</p>
        </div>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-sage-bg px-2.5 py-1 text-xs font-semibold text-sage">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-sage" /> Live
        </span>
      </div>
      <ul className="divide-y divide-line">
        {rows.map((row) => (
          <li key={row.period} className="flex items-center gap-3 px-4 py-3 sm:px-5">
            <div className="w-10 shrink-0 text-center">
              <p className="text-sm font-bold text-ink">{row.period}</p>
              <p className="tabular text-2xs text-ink-muted">{row.time}</p>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-sm font-semibold text-ink">{row.cls}</span>
                <Chip subject={row.subject} />
              </div>
              <p className="mt-1 truncate text-xs text-ink-muted">
                <span className="font-semibold text-ink">{row.cover}</span> · {row.reason}
              </p>
            </div>
            {row.state === "done" ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-sage-bg px-2.5 py-1 text-xs font-semibold text-sage"><Check className="h-3.5 w-3.5" />Assigned</span>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-plum px-3 py-1.5 text-xs font-semibold text-cream shadow-soft">Assign</span>
            )}
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between gap-3 rounded-b-2xl bg-peach-50 px-4 py-3 sm:px-5">
        <p className="text-xs text-ink-muted"><span className="font-semibold text-ink">11 of 12</span> periods covered today</p>
        <div className="h-1.5 w-28 overflow-hidden rounded-full bg-peach-200"><div className="h-full w-[92%] rounded-full bg-plum" /></div>
      </div>
    </Frame>
  );
}

export function HeroClashToast() {
  return (
    <div aria-hidden="true" className="flex max-w-[260px] items-start gap-2.5 rounded-xl border border-line bg-paper p-3 shadow-lift">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-honey-bg text-honey"><AlertTriangle className="h-3.5 w-3.5" /></span>
      <div>
        <p className="text-xs font-semibold text-ink">Clash caught before publishing</p>
        <p className="mt-0.5 text-2xs leading-4 text-ink-muted">Mr. Rao can't be in 7-B and 8-A at period 4.</p>
      </div>
    </div>
  );
}

export function HeroNotifyToast() {
  return (
    <div aria-hidden="true" className="flex max-w-[240px] items-start gap-2.5 rounded-xl border border-line bg-paper p-3 shadow-lift">
      <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-plum-50 text-plum"><Bell className="h-3.5 w-3.5" /></span>
      <div>
        <p className="text-xs font-semibold text-ink">Fatima Khan was notified</p>
        <p className="mt-0.5 text-2xs leading-4 text-ink-muted">9-B English, period 2 · Room 9-B</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------ features */

export function TimetablePreview() {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri"];
  const grid = [
    ["English", "Mathematics", "Science", "Hindi", "Social Science"],
    ["Mathematics", "Science", "English", "Mathematics", "Hindi"],
    ["Science", "Hindi", "Mathematics", "English", "Computer"],
    ["Social Science", "English", "Physical Education", "Science", "Mathematics"],
  ];
  return (
    <Frame label="Example weekly timetable for class 8-A with one clash flagged on Wednesday, period 3.">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold text-ink">Class 8-A · Week plan</p>
        <span className="rounded-full bg-honey-bg px-2.5 py-0.5 text-2xs font-semibold text-honey">1 clash to fix</span>
      </div>
      <div className="grid grid-cols-[28px_repeat(5,minmax(0,1fr))] gap-1 text-2xs">
        <span />
        {days.map((day) => <span key={day} className="pb-1 text-center font-semibold text-ink-muted">{day}</span>)}
        {grid.map((row, rowIndex) => (
          <Row key={rowIndex} index={rowIndex} row={row} />
        ))}
      </div>
    </Frame>
  );
}

function Row({ row, index }: { row: string[]; index: number }) {
  return (
    <>
      <span className="grid place-items-center font-semibold text-ink-muted">P{index + 1}</span>
      {row.map((subject, column) => {
        const clash = index === 2 && column === 2;
        return (
          <span key={column} className={cn("relative truncate rounded-md px-1.5 py-2 text-center font-semibold", subjectClasses(subject).cell, clash && "ring-2 ring-honey ring-offset-1 ring-offset-paper")}>
            {subject === "Mathematics" ? "Maths" : subject === "Social Science" ? "SST" : subject === "Physical Education" ? "PE" : subject}
            {clash ? <span className="absolute -right-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-honey text-[9px] text-cream">!</span> : null}
          </span>
        );
      })}
    </>
  );
}

export function SubstitutePreview() {
  const options = [
    { name: "Arjun Rao", why: ["Free in P2", "Teaches Maths"], load: "3 periods today", best: true },
    { name: "Neha Kapoor", why: ["Free in P2", "Knows 8-A"], load: "4 periods today" },
    { name: "Imran Qureshi", why: ["Free in P2"], load: "2 periods today" },
  ];
  return (
    <Frame label="Example substitute suggestions for 8-A Maths in period 2, ranked by subject match, familiarity with the class and workload.">
      <div className="mb-3 flex items-center gap-2.5 rounded-xl bg-brick-bg/70 px-3 py-2.5">
        <UserX className="h-4 w-4 text-brick" />
        <p className="text-xs text-ink"><span className="font-semibold">8-A · Maths · Period 2</span> needs cover</p>
      </div>
      <ul className="space-y-2">
        {options.map((option, index) => (
          <li key={option.name} className={cn("flex items-center gap-3 rounded-xl border p-2.5", option.best ? "border-plum/30 bg-plum-50/60" : "border-line")}>
            <Initials name={option.name} tone={index === 0 ? "plum" : "peach"} />
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-sm font-semibold text-ink">
                {option.name}
                {option.best ? <span className="inline-flex items-center gap-0.5 rounded-full bg-plum px-1.5 py-px text-[10px] font-semibold text-cream"><Sparkles className="h-2.5 w-2.5" />Best</span> : null}
              </p>
              <p className="mt-0.5 flex flex-wrap gap-1">
                {option.why.map((reason) => <span key={reason} className="rounded bg-sand px-1.5 py-px text-[10px] font-medium text-ink-muted">{reason}</span>)}
                <span className="px-0.5 text-[10px] text-ink-muted">{option.load}</span>
              </p>
            </div>
            {index === 0 ? <span className="rounded-full bg-plum px-3 py-1.5 text-xs font-semibold text-cream">Assign</span> : <span className="rounded-full border border-line-strong px-3 py-1.5 text-xs font-semibold text-ink">Assign</span>}
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function AbsencePreview() {
  const rows = [
    { name: "Kavita Iyer", detail: "Full day · Fever", tone: "blush" as const },
    { name: "Rahul Bhatt", detail: "Periods 1–4 · Board duty", tone: "peach" as const },
    { name: "Sunita Verma", detail: "Full day · Family function", tone: "sage" as const },
  ];
  return (
    <Frame label="Example list of three teachers marked absent today with the reason and periods affected.">
      <p className="mb-3 text-sm font-semibold text-ink">Absent today</p>
      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li key={row.name} className="flex items-center gap-3">
            <Initials name={row.name} tone={row.tone} />
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">{row.name}</p>
              <p className="text-xs text-ink-muted">{row.detail}</p>
            </div>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function CoverageBoardPreview() {
  const cells = ["ok", "ok", "ok", "wait", "ok", "ok", "ok", "ok", "gap", "ok", "ok", "ok"] as const;
  return (
    <Frame label="Example live coverage board: 10 periods covered, 1 awaiting confirmation and 1 still uncovered.">
      <div className="flex items-center gap-4">
        <div className="relative h-16 w-16 shrink-0">
          <svg viewBox="0 0 36 36" className="h-16 w-16 -rotate-90">
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--peach-100))" strokeWidth="4" />
            <circle cx="18" cy="18" r="15" fill="none" stroke="rgb(var(--plum))" strokeWidth="4" strokeLinecap="round" strokeDasharray="94.2" strokeDashoffset="15.7" />
          </svg>
          <span className="absolute inset-0 grid place-items-center text-sm font-bold text-ink">83%</span>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">10 of 12 covered</p>
          <p className="text-xs text-ink-muted">1 waiting · 1 needs a teacher</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-6 gap-1.5">
        {cells.map((state, index) => (
          <span key={index} className={cn("h-6 rounded-md", state === "ok" ? "bg-sage-bg" : state === "wait" ? "bg-honey-bg" : "border-2 border-dashed border-brick/50 bg-brick-bg/50")} />
        ))}
      </div>
    </Frame>
  );
}

export function RequestsPreview() {
  const items = [
    { who: "Neha Kapoor", what: "Swap P3 with P6 on Friday", status: "Waiting", tone: "bg-honey-bg text-honey" },
    { who: "Deepak Chauhan", what: "Leave notice · 12 Nov", status: "Approved", tone: "bg-sage-bg text-sage" },
  ];
  return (
    <Frame label="Example request list with a period swap waiting for approval and an approved leave notice.">
      <p className="mb-3 text-sm font-semibold text-ink">Requests</p>
      <ul className="space-y-2">
        {items.map((item) => (
          <li key={item.who} className="rounded-xl border border-line p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-sm font-semibold text-ink">{item.who}</p>
              <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", item.tone)}>{item.status}</span>
            </div>
            <p className="mt-0.5 text-xs text-ink-muted">{item.what}</p>
          </li>
        ))}
      </ul>
    </Frame>
  );
}

export function NoticePreview() {
  return (
    <Frame label="Example school notice about an assembly change, and a student concern about a broken fan marked as seen.">
      <div className="rounded-xl bg-peach-50 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-plum"><Megaphone className="h-3.5 w-3.5" />Notice · All staff</p>
        <p className="mt-1 text-sm font-semibold text-ink">Assembly moves to the hall on Friday</p>
      </div>
      <div className="mt-2 rounded-xl bg-blush-100 p-3">
        <p className="flex items-center gap-1.5 text-xs font-semibold text-plum"><Megaphone className="h-3.5 w-3.5" />Notice · Classes 9 &amp; 10</p>
        <p className="mt-1 text-sm font-semibold text-ink">Pre-board timetable is now published</p>
      </div>
      <div className="mt-2 flex items-start gap-2.5 rounded-xl border border-line p-3">
        <CheckCircle2 className="mt-0.5 h-4 w-4 text-sage" />
        <div>
          <p className="text-sm font-semibold text-ink">Fan not working in 7-B</p>
          <p className="text-xs text-ink-muted">Raised by a student · Seen by office</p>
        </div>
      </div>
    </Frame>
  );
}

export function StudentPreview() {
  const rows = [
    { period: "P1", subject: "English", teacher: "Neha Kapoor" },
    { period: "P2", subject: "Mathematics", teacher: "Arjun Rao", changed: true },
    { period: "P3", subject: "Science", teacher: "Priya Menon" },
  ];
  return (
    <Frame label="Example student phone view of today's timetable for 8-A, showing a substitute teacher in period 2." className="mx-auto w-full max-w-[250px] shrink-0 rounded-[28px] sm:w-[250px] border-[6px] border-ink/90 p-3 sm:p-3.5">
      <div className="mx-auto mb-3 h-1.5 w-14 rounded-full bg-ink/15" />
      <p className="text-2xs font-semibold uppercase tracking-[0.12em] text-ink-muted">Today · 8-A</p>
      <p className="font-display text-base font-semibold text-ink">Good morning, Aarohi</p>
      <ul className="mt-3 space-y-1.5">
        {rows.map((row) => (
          <li key={row.period} className={cn("rounded-xl p-2.5", subjectClasses(row.subject).cell)}>
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold">{row.period} · {row.subject === "Mathematics" ? "Maths" : row.subject}</p>
              {row.changed ? <span className="rounded-full bg-paper px-1.5 py-px text-[10px] font-semibold text-plum">Substitute</span> : null}
            </div>
            <p className="mt-0.5 text-[11px] opacity-80">{row.teacher}</p>
          </li>
        ))}
      </ul>
      <p className="mt-3 flex items-center gap-1 text-[11px] text-ink-muted"><Clock className="h-3 w-3" />Lunch at 11:00 am</p>
    </Frame>
  );
}

