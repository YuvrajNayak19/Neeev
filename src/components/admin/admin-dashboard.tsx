import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Printer, UserCheck, UserX, Users } from "lucide-react";
import type { ReactNode } from "react";

type Teacher = { _id: string; qualificationCategory: "PRT" | "TGT" | "PGT" };
type Absence = { _id: string; teacherId: { _id?: string; name?: string } | string };
type Notice = { period: number; time: string; class: string; subject: string; absentTeacher: string; substitute: string; note: string; status: string };

async function api<T>(path: string): Promise<T> {
  const response = await fetch(`/api/v1${path}`, { credentials: "include" });
  const body = (await response.json().catch(() => ({}))) as T & { message?: string };
  if (!response.ok) throw new Error(body.message ?? "Request failed.");
  return body;
}

function todayIso(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function Card({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <section className={`rounded-xl border border-slate-200/80 bg-white p-4 shadow-sm ${className}`}>{children}</section>;
}

function CoverageRing({ percent }: { percent: number }) {
  const radius = 22;
  const circumference = 2 * Math.PI * radius;
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" role="img" aria-label={`${percent}% covered`}>
      <circle cx="28" cy="28" r={radius} fill="none" className="stroke-slate-100" strokeWidth="6" />
      <circle cx="28" cy="28" r={radius} fill="none" className="stroke-emerald-500" strokeWidth="6" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={circumference * (1 - percent / 100)} transform="rotate(-90 28 28)" />
    </svg>
  );
}

const statusClass = (assigned: boolean, published: boolean) =>
  !assigned ? "bg-rose-50 text-rose-700 border-rose-200" : published ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200";

export function AdminDashboardContent(): JSX.Element {
  const date = todayIso();
  const teachers = useQuery({ queryKey: ["teachers"], queryFn: () => api<{ teachers: Teacher[] }>("/teachers") });
  const absences = useQuery({ queryKey: ["absences", date], queryFn: () => api<{ absences: Absence[] }>(`/absences?date=${date}`) });
  const notices = useQuery({ queryKey: ["noticeboard", date], queryFn: () => api<{ notices: Notice[]; unassigned: number }>(`/substitutions/noticeboard?date=${date}`) });

  const roster = teachers.data?.teachers ?? [];
  const rows = notices.data?.notices ?? [];
  const unassigned = notices.data?.unassigned ?? 0;
  const covered = rows.length - unassigned;
  const percent = rows.length ? Math.round((covered / rows.length) * 100) : 100;
  const count = (category: Teacher["qualificationCategory"]) => roster.filter((teacher) => teacher.qualificationCategory === category).length;
  const loading = teachers.isLoading || absences.isLoading || notices.isLoading;
  const failed = teachers.error ?? absences.error ?? notices.error;

  return (
    <div className="space-y-4">
      {failed ? <p role="alert" className="rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{(failed as Error).message}</p> : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Card>
          <div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">Active faculty</p><Users className="h-4 w-4 text-slate-400" /></div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">{loading ? "–" : roster.length}</p>
          <div className="mt-2 flex gap-1.5 text-[11px] font-medium">
            <span className="rounded border border-sky-200 bg-sky-50 px-1.5 py-0.5 font-mono text-sky-700">TGT {count("TGT")}</span>
            <span className="rounded border border-violet-200 bg-violet-50 px-1.5 py-0.5 font-mono text-violet-700">PGT {count("PGT")}</span>
            {count("PRT") ? <span className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono text-slate-600">PRT {count("PRT")}</span> : null}
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">Absences today</p><UserX className="h-4 w-4 text-slate-400" /></div>
          <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">{loading ? "–" : absences.data?.absences.length ?? 0}</p>
          <p className="mt-2 text-xs text-slate-500">{rows.length} periods need cover</p>
        </Card>
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Coverage</p>
            <p className="mt-2 font-mono text-2xl font-semibold text-slate-900">{loading ? "–" : `${percent}%`}</p>
            <p className="mt-2 text-xs text-slate-500">{covered} of {rows.length} covered</p>
          </div>
          <CoverageRing percent={percent} />
        </Card>
        <Card className={unassigned ? "border-rose-200 bg-rose-50/40" : ""}>
          <div className="flex items-center justify-between"><p className="text-xs font-medium text-slate-500">Unassigned alerts</p>{unassigned ? <AlertTriangle className="h-4 w-4 text-rose-500" /> : <UserCheck className="h-4 w-4 text-emerald-500" />}</div>
          <p className={`mt-2 font-mono text-2xl font-semibold ${unassigned ? "text-rose-700" : "text-slate-900"}`}>{loading ? "–" : unassigned}</p>
          <p className="mt-2 text-xs text-slate-500">{unassigned ? "Needs manual review" : "All periods covered"}</p>
        </Card>
      </div>

      <Card className="print-area p-0">
        <div className="print-header"><strong>EduSync · Substitution notice</strong><span className="font-mono">{date}</span></div>
        <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
          <div><h2 className="text-sm font-semibold text-slate-900">Live coverage</h2><p className="font-mono text-xs text-slate-500">{date}</p></div>
          <button onClick={() => window.print()} className="no-print inline-flex items-center gap-1.5 rounded-md border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 hover:bg-slate-50"><Printer className="h-4 w-4" />Print noticeboard</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <tr><th className="px-3 py-2">Period</th><th className="px-3 py-2">Class</th><th className="px-3 py-2">Subject</th><th className="px-3 py-2">Absent</th><th className="px-3 py-2">Cover</th><th className="px-3 py-2">Status</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.length === 0 ? <tr><td colSpan={6} className="px-3 py-6 text-center text-sm text-slate-500">{loading ? "Loading…" : "No substitutions for today."}</td></tr> : null}
              {rows.map((row) => {
                const assigned = row.substitute !== "UNASSIGNED";
                return (
                  <tr key={`${row.period}-${row.class}`}>
                    <td className="px-3 py-2"><span className="font-mono text-xs font-semibold text-slate-700">P{row.period}</span><span className="ml-2 font-mono text-[11px] text-slate-400">{row.time}</span></td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-700">{row.class}</td>
                    <td className="px-3 py-2 text-slate-800">{row.subject}</td>
                    <td className="px-3 py-2 text-slate-600">{row.absentTeacher}</td>
                    <td className="px-3 py-2 text-slate-800">{assigned ? row.substitute : <span title={row.note}>—</span>}</td>
                    <td className="px-3 py-2"><span className={`rounded-full border px-2 py-0.5 text-xs font-medium ${statusClass(assigned, row.status === "PUBLISHED")}`}>{!assigned ? "Unassigned" : row.status === "PUBLISHED" ? "Covered" : "Pending review"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
