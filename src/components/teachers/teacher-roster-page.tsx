import * as Dialog from "@radix-ui/react-dialog";
import { Download, FileUp, Plus, Search, Upload, Users, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateTeacher, useTeachers } from "../../hooks/use-timely";
import type { CreateTeacherInput, Period, PeriodMap, TeacherCategory } from "../../types/domain";
import { CategoryBadge } from "../ui/status-badge";
import { cn, initials } from "../../lib/utils";

const periodMap = (): PeriodMap => ({ 1: false, 2: false, 3: false, 4: false, 5: false, 6: false, 7: false, 8: false });
const categories: TeacherCategory[] = ["PRT", "TGT", "PGT"];
const periodNumbers: Period[] = [1, 2, 3, 4, 5, 6, 7, 8];

function TeacherDialog({ children }: { children: React.ReactNode }): JSX.Element {
  const createTeacher = useCreateTeacher();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CreateTeacherInput>({ name: "", subject: "", category: "TGT", busyPeriods: periodMap() });
  const submit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!form.name.trim() || !form.subject.trim()) { toast.error("Name and subject are required"); return; }
    try { await createTeacher.mutateAsync({ ...form, name: form.name.trim(), subject: form.subject.trim() }); toast.success(`${form.name.trim()} joined the roster`); setForm({ name: "", subject: "", category: "TGT", busyPeriods: periodMap() }); setOpen(false); } catch { toast.error("Could not add the teacher. Please try again."); }
  };
  const togglePeriod = (period: Period): void => setForm((current) => ({ ...current, busyPeriods: { ...current.busyPeriods, [period]: !current.busyPeriods[period] } }));

  return <Dialog.Root open={open} onOpenChange={setOpen}><Dialog.Trigger asChild>{children}</Dialog.Trigger><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-slate-950/40 backdrop-blur-[2px]" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[92vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl sm:p-6"><div className="flex items-start justify-between gap-4"><div><Dialog.Title className="font-['Outfit'] text-xl font-bold text-slate-900">Add teacher</Dialog.Title><Dialog.Description className="mt-1 text-sm text-slate-500">Add their teaching details and fixed timetable availability.</Dialog.Description></div><Dialog.Close className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"><X size={19} /></Dialog.Close></div><form className="mt-6 space-y-5" onSubmit={submit}><div className="grid gap-4 sm:grid-cols-2"><label className="block text-sm font-semibold text-slate-700">Full name<input className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="e.g. Aarav Mehta" autoFocus /></label><label className="block text-sm font-semibold text-slate-700">Subject<input className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none placeholder:text-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" value={form.subject} onChange={(event) => setForm({ ...form, subject: event.target.value })} placeholder="e.g. Mathematics" /></label></div><label className="block text-sm font-semibold text-slate-700">Teacher category<select className="mt-1.5 w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as TeacherCategory })}>{categories.map((category) => <option key={category}>{category}</option>)}</select></label><fieldset><legend className="text-sm font-semibold text-slate-700">Fixed busy periods</legend><p className="mt-1 text-xs text-slate-400">Select the periods this teacher is already timetabled.</p><div className="mt-3 grid grid-cols-4 gap-2">{periodNumbers.map((period) => <button type="button" key={period} onClick={() => togglePeriod(period)} className={cn("rounded-lg border px-2 py-2.5 text-sm font-semibold", form.busyPeriods[period] ? "border-blue-600 bg-blue-600 text-white" : "bg-white text-slate-500 hover:border-blue-300")}>P{period}</button>)}</div></fieldset><div className="flex justify-end gap-3 border-t border-slate-100 pt-5"><Dialog.Close className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-100">Cancel</Dialog.Close><button disabled={createTeacher.isPending} className="rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-wait disabled:opacity-60">{createTeacher.isPending ? "Adding…" : "Add teacher"}</button></div></form></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

export function TeacherRosterPage(): JSX.Element {
  const { data: teachers = [], isLoading } = useTeachers();
  const createTeacher = useCreateTeacher();
  const uploadInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<"all" | TeacherCategory>("all");
  const [page, setPage] = useState(1);
  const perPage = 6;
  const filteredTeachers = useMemo(() => teachers.filter((teacher) => (category === "all" || teacher.category === category) && `${teacher.name} ${teacher.subject}`.toLowerCase().includes(search.toLowerCase())), [teachers, category, search]);
  const pageCount = Math.max(1, Math.ceil(filteredTeachers.length / perPage));
  const displayedTeachers = filteredTeachers.slice((page - 1) * perPage, page * perPage);
  const exportCsv = (): void => {
    const header = "name,subject,category,busyPeriods";
    const rows = teachers.map((teacher) => `${teacher.name},${teacher.subject},${teacher.category},${periodNumbers.filter((period) => teacher.busyPeriods[period]).join("|")}`);
    const url = URL.createObjectURL(new Blob([[header, ...rows].join("\n")], { type: "text/csv" }));
    const link = document.createElement("a"); link.href = url; link.download = "timely-teacher-roster.csv"; link.click(); URL.revokeObjectURL(url); toast.success("Roster CSV exported");
  };
  const importCsv = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (): Promise<void> => {
      const content = typeof reader.result === "string" ? reader.result : "";
      const rows = content.split(/\r?\n/).slice(1).filter(Boolean);
      let imported = 0;
      for (const row of rows) {
        const [name = "", subject = "", rawCategory = "", rawBusy = ""] = row.split(",").map((cell) => cell.trim());
        if (!name || !subject || !categories.includes(rawCategory as TeacherCategory)) continue;
        const busyPeriods = periodMap();
        rawBusy.split("|").forEach((value) => { const period = Number(value) as Period; if (periodNumbers.includes(period)) busyPeriods[period] = true; });
        await createTeacher.mutateAsync({ name, subject, category: rawCategory as TeacherCategory, busyPeriods }); imported += 1;
      }
      toast.success(imported ? `${imported} teachers imported` : "No valid rows found in CSV");
      if (uploadInput.current) uploadInput.current.value = "";
    };
    reader.readAsText(file);
  };

  return <section className="space-y-6"><div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-end"><div><p className="eyebrow">People & timetables</p><h1 className="mt-1 font-['Outfit'] text-3xl font-bold tracking-tight text-slate-950">Teacher roster</h1><p className="mt-1.5 text-sm text-slate-500">Manage staff profiles, categories, and timetable availability.</p></div><div className="flex flex-wrap gap-2"><input ref={uploadInput} type="file" accept=".csv,text/csv" className="hidden" onChange={importCsv} /><button className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={() => uploadInput.current?.click()} disabled={createTeacher.isPending}><FileUp size={16} />Import CSV</button><button className="inline-flex items-center gap-2 rounded-lg border bg-white px-3.5 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50" onClick={exportCsv}><Download size={16} />Export</button><TeacherDialog><button className="inline-flex items-center gap-2 rounded-lg bg-slate-900 px-3.5 py-2.5 text-sm font-semibold text-white hover:bg-slate-800"><Plus size={16} />Add teacher</button></TeacherDialog></div></div><div className="panel overflow-hidden"><div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row sm:items-center sm:justify-between"><label className="relative block w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={17} /><input className="w-full rounded-lg border bg-white py-2.5 pl-9 pr-3 text-sm outline-none placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10" value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Search teachers or subjects" /></label><select aria-label="Filter by category" className="rounded-lg border bg-white px-3 py-2.5 text-sm font-medium text-slate-600 outline-none focus:border-blue-500" value={category} onChange={(event) => { setCategory(event.target.value as "all" | TeacherCategory); setPage(1); }}><option value="all">All categories</option>{categories.map((item) => <option key={item} value={item}>{item}</option>)}</select></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-sm"><thead className="sticky top-0 bg-slate-50"><tr><th className="table-header px-5 py-3.5">Teacher</th><th className="table-header px-5 py-3.5">Subject</th><th className="table-header px-5 py-3.5">Category</th><th className="table-header px-5 py-3.5">Fixed busy periods</th><th className="table-header px-5 py-3.5 text-right">Availability</th></tr></thead><tbody className="divide-y divide-slate-100">{isLoading ? Array.from({ length: 6 }, (_, index) => <tr key={index}><td className="px-5 py-4"><div className="skeleton h-8 w-40" /></td><td className="px-5 py-4"><div className="skeleton h-5 w-24" /></td><td className="px-5 py-4"><div className="skeleton h-6 w-12" /></td><td className="px-5 py-4"><div className="skeleton h-5 w-36" /></td><td className="px-5 py-4"><div className="skeleton ml-auto h-5 w-10" /></td></tr>) : displayedTeachers.map((teacher) => { const busy = periodNumbers.filter((period) => teacher.busyPeriods[period]); return <tr key={teacher.id} className="hover:bg-slate-50/60"><td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="grid h-9 w-9 place-items-center rounded-full bg-blue-50 text-xs font-bold text-blue-700">{initials(teacher.name)}</div><p className="font-semibold text-slate-700">{teacher.name}</p></div></td><td className="px-5 py-3.5 text-slate-600">{teacher.subject}</td><td className="px-5 py-3.5"><CategoryBadge category={teacher.category} /></td><td className="px-5 py-3.5"><div className="flex gap-1">{busy.length ? busy.map((period) => <span key={period} className="rounded bg-slate-100 px-1.5 py-0.5 text-xs font-semibold text-slate-500">P{period}</span>) : <span className="text-xs text-slate-400">No fixed periods</span>}</div></td><td className="px-5 py-3.5 text-right text-sm font-semibold text-emerald-700">{8 - busy.length}/8 free</td></tr>; })}</tbody></table></div>{!isLoading && !displayedTeachers.length && <div className="flex flex-col items-center px-6 py-14 text-center"><div className="grid h-11 w-11 place-items-center rounded-xl bg-slate-100 text-slate-400"><Users size={20} /></div><p className="mt-3 font-semibold text-slate-700">No teachers found</p><p className="mt-1 text-sm text-slate-400">Try another search term or category.</p></div>}<div className="flex items-center justify-between border-t border-slate-100 px-5 py-3.5"><p className="text-sm text-slate-400">Showing {filteredTeachers.length ? (page - 1) * perPage + 1 : 0}–{Math.min(page * perPage, filteredTeachers.length)} of {filteredTeachers.length}</p><div className="flex items-center gap-2"><button className="rounded-md border px-2.5 py-1.5 text-sm font-semibold text-slate-500 disabled:opacity-40" disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</button><span className="text-sm text-slate-500">{page} / {pageCount}</span><button className="rounded-md border px-2.5 py-1.5 text-sm font-semibold text-slate-500 disabled:opacity-40" disabled={page === pageCount} onClick={() => setPage(page + 1)}>Next</button></div></div></div><p className="flex items-center gap-2 text-xs text-slate-400"><Upload size={14} />CSV columns: <code className="rounded bg-slate-100 px-1.5 py-0.5">name,subject,category,busyPeriods</code> (use <code className="rounded bg-slate-100 px-1.5 py-0.5">|</code> between busy periods).</p></section>;
}
