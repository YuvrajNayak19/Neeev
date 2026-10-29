import { useEffect, useState } from "react";
import { Pencil, Plus, Trash2, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PERIODS, CATEGORIES, type Teacher } from "@/lib/substitution";
import { TimetableImport } from "@/components/TimetableImport";
import { cn } from "@/lib/utils";
import { inferTeacherCategoryFromClasses } from "@/lib/inferCategory";
import { dayIndexForDate, getTeacherScheduleForDay } from "@/lib/timetableParser";

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat"] as const;

type Props = {
  teachers: Teacher[];
  onChange: (teachers: Teacher[]) => void;
  date: string;
};

export function TeacherRoster({ teachers, onChange, date }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Teacher | null>(null);
  const [categoryOverridden, setCategoryOverridden] = useState(false);
  const [newTeacherIds, setNewTeacherIds] = useState<Set<string>>(() => new Set());
  const [selectedDay, setSelectedDay] = useState<number>(
    () => dayIndexForDate(new Date(`${date}T00:00:00`)) ?? 1,
  );

  useEffect(() => {
    setSelectedDay(dayIndexForDate(new Date(`${date}T00:00:00`)) ?? 1);
  }, [date]);

  const startEdit = (t: Teacher) => {
    setEditingId(t.id);
    setDraft({ ...t, busy: { ...t.busy } });
    setCategoryOverridden(false);
  };

  const save = () => {
    if (!draft) return;
    onChange(
      teachers.map((t) =>
        t.id === draft.id
          ? {
              ...draft,
              category:
                  categoryOverridden || !newTeacherIds.has(draft.id)
                  ? draft.category
                  : inferTeacherCategoryFromClasses(
                      Object.values(draft.timetable ?? {}).map((period) => period.classSection),
                    ),
              timetable: Object.fromEntries(
                PERIODS.map((period) => [
                  period,
                  {
                    subject: draft.subject,
                    classSection: draft.timetable?.[period]?.classSection ?? "Unassigned",
                    isFree: !draft.busy[period],
                  },
                ]),
              ),
            }
          : t,
      ),
    );
    setEditingId(null);
    setDraft(null);
    setCategoryOverridden(false);
  };

  const cancel = () => {
    setEditingId(null);
    setDraft(null);
    setCategoryOverridden(false);
  };

  const addTeacher = () => {
    const t: Teacher = {
      id: `t${Date.now()}`,
      name: "New Teacher",
      subject: "General",
      category: "TGT",
      busy: {},
    };
    onChange([...teachers, t]);
    setNewTeacherIds((ids) => new Set(ids).add(t.id));
    startEdit(t);
  };

  const remove = (id: string) => {
    onChange(teachers.filter((t) => t.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateSlotClass = (period: number, classSection: string) => {
    if (!draft) return;
    const normalizedClass = classSection.trim();
    setDraft({
      ...draft,
      busy: { ...draft.busy, [period]: Boolean(normalizedClass) },
      timetable: {
        ...(draft.timetable ?? {}),
        [period]: {
          subject: draft.subject,
          classSection: normalizedClass,
          isFree: !normalizedClass,
        },
      },
    });
  };

  const slotClass = (busy: boolean, editing: boolean) =>
    cn(
      "inline-flex h-9 w-full min-w-14 items-center justify-center rounded-md border-2 text-xs font-semibold transition-colors sm:w-14",
      busy
        ? "border-primary bg-primary text-primary-foreground"
        : "border-secondary bg-secondary text-secondary-foreground",
      editing ? "cursor-pointer hover:opacity-80" : "cursor-default",
    );
  const dailySchedule = (teacher: Teacher) => getTeacherScheduleForDay(teacher, selectedDay);

  return (
    <section className="panel overflow-hidden">
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 border-b border-border px-4 py-4 sm:flex sm:flex-wrap sm:justify-between sm:px-5">
        <div className="min-w-0">
          <h2 className="text-base font-semibold">Teacher Schedule</h2>
          <p className="text-sm text-muted-foreground">
            {teachers.length} teachers · enter a class for each assigned period
          </p>
        </div>
        <div className="col-span-2 flex flex-wrap gap-1 sm:order-last sm:col-span-1" role="group" aria-label="Select day">
          {DAY_LABELS.map((label, i) => (
            <Button
              key={label}
              size="sm"
              variant={selectedDay === i + 1 ? "default" : "outline"}
              onClick={() => setSelectedDay(i + 1)}
            >
              Day {i + 1} · {label}
            </Button>
          ))}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <TimetableImport teachers={teachers} onChange={onChange} />
          <Button onClick={addTeacher} size="sm" className="shrink-0">
            <Plus /> <span className="hidden sm:inline">Add teacher</span>
            <span className="sm:hidden">Add</span>
          </Button>
        </div>
      </header>

      {/* Mobile: stacked cards */}
      <ul className="divide-y divide-border lg:hidden">
        {teachers.map((t) => {
          const editing = editingId === t.id && draft;
          const row = editing ? draft! : t;
          const daySchedule = dailySchedule(row);
          const classSections = [...new Set(
            PERIODS.map((period) => daySchedule[period].classSection).filter(Boolean),
          )];
          return (
            <li key={t.id} className="px-4 py-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                <div className="min-w-0 space-y-2">
                  {editing ? (
                    <>
                      <Input
                        value={row.name}
                        onChange={(e) => setDraft({ ...row, name: e.target.value })}
                        className="h-8"
                        placeholder="Name"
                      />
                      <Input
                        value={row.subject}
                        onChange={(e) => setDraft({ ...row, subject: e.target.value })}
                        className="h-8"
                        placeholder="Subject"
                      />
                      <div className="flex gap-1.5">
                        {CATEGORIES.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => {
                              setCategoryOverridden(true);
                              setDraft({ ...row, category: cat });
                            }}
                            className={cn(
                              "flex-1 rounded px-2 py-1.5 text-xs font-semibold transition-colors",
                              row.category === cat
                                ? "bg-primary text-primary-foreground"
                                : "border border-border bg-muted text-muted-foreground hover:bg-muted/80",
                            )}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <p className="truncate font-medium">{row.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm text-muted-foreground">{row.subject}</p>
                        <span className="shrink-0 rounded-full bg-secondary/50 px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                          {row.category}
                        </span>
                        {classSections.length > 0 && (
                          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            {classSections.join(", ")}
                          </span>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <div className="flex shrink-0 gap-1">
                  {editing ? (
                    <>
                      <Button size="icon" variant="ghost" onClick={save} aria-label="Save">
                        <Check />
                      </Button>
                      <Button size="icon" variant="ghost" onClick={cancel} aria-label="Cancel">
                        <X />
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => startEdit(t)}
                        aria-label={`Edit ${t.name}`}
                      >
                        <Pencil />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => remove(t.id)}
                        aria-label={`Remove ${t.name}`}
                      >
                        <Trash2 className="text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="mt-3 grid grid-cols-4 gap-1.5 sm:grid-cols-8">
                {PERIODS.map((p) => (
                  <div key={p} className="text-center">
                    <p className="mb-1 text-[10px] uppercase tracking-wide text-primary">P{p}</p>
                    {editing ? (
                      <Input
                        value={row.busy[p] ? row.timetable?.[p]?.classSection ?? "" : ""}
                        onChange={(event) => updateSlotClass(p, event.target.value)}
                        className="h-9 min-w-14 px-1 text-center text-xs"
                        placeholder="Free"
                        aria-label={`Class assigned to period ${p}`}
                      />
                    ) : (
                      <span
                        data-availability={dailySchedule(row)[p].isFree ? "free" : "busy"}
                        className={slotClass(!dailySchedule(row)[p].isFree, false)}
                      >
                        {dailySchedule(row)[p].isFree
                          ? "Free"
                          : dailySchedule(row)[p].classSection || "Busy"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ul>

      {/* Desktop: table */}
      <div className="hidden max-h-[calc(100vh-13rem)] overflow-auto lg:block">
        <table className="w-full min-w-[880px] text-sm">
          <thead>
            <tr className="bg-muted/95 text-left text-xs uppercase tracking-wide text-muted-foreground">
              <th className="sticky top-0 z-10 bg-muted/95 px-5 py-3 font-medium">Teacher</th>
              <th className="sticky top-0 z-10 bg-muted/95 px-3 py-3 font-medium">Subject</th>
              {PERIODS.map((p) => (
                <th
                  key={p}
                  className="sticky top-0 z-10 bg-muted/95 px-2 py-3 text-center font-medium text-primary"
                >
                  P{p}
                </th>
              ))}
              <th className="sticky top-0 z-10 bg-muted/95 px-5 py-3 text-right font-medium">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {teachers.map((t) => {
              const editing = editingId === t.id && draft;
              const row = editing ? draft! : t;
              const daySchedule = dailySchedule(row);
              const classSections = [...new Set(
                PERIODS.map((period) => daySchedule[period].classSection).filter(Boolean),
              )];
              return (
                <tr
                  key={t.id}
                  className="border-t border-border align-middle odd:bg-background even:bg-muted/30"
                >
                  <td className="px-5 py-3.5">
                    {editing ? (
                      <Input
                        value={row.name}
                        onChange={(e) => setDraft({ ...row, name: e.target.value })}
                        className="h-8 w-40"
                      />
                    ) : (
                      <span className="font-medium">{row.name}</span>
                    )}
                  </td>
                  <td className="px-3 py-3.5">
                    {editing ? (
                      <div className="flex flex-col gap-2">
                        <Input
                          value={row.subject}
                          onChange={(e) => setDraft({ ...row, subject: e.target.value })}
                          className="h-8 w-36"
                          placeholder="Subject"
                        />
                        <div className="flex gap-1">
                          {CATEGORIES.map((cat) => (
                            <button
                              key={cat}
                              type="button"
                              onClick={() => {
                                setCategoryOverridden(true);
                                setDraft({ ...row, category: cat });
                              }}
                              className={cn(
                                "flex-1 rounded px-1.5 py-1 text-xs font-semibold transition-colors",
                                row.category === cat
                                  ? "bg-primary text-primary-foreground"
                                  : "border border-border bg-muted text-muted-foreground hover:bg-muted/80",
                              )}
                            >
                              {cat}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-muted-foreground">{row.subject}</span>
                        <span className="shrink-0 rounded-full bg-secondary/50 px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
                          {row.category}
                        </span>
                        {classSections.length > 0 && (
                          <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-xs font-semibold text-muted-foreground">
                            {classSections.join(", ")}
                          </span>
                        )}
                      </div>
                    )}
                  </td>
                  {PERIODS.map((p) => (
                    <td key={p} className="px-2 py-3.5 text-center">
                      {editing ? (
                        <Input
                          value={row.busy[p] ? row.timetable?.[p]?.classSection ?? "" : ""}
                          onChange={(event) => updateSlotClass(p, event.target.value)}
                          className="h-9 w-20 px-1 text-center text-xs"
                          placeholder="Free"
                          aria-label={`Class assigned to period ${p}`}
                        />
                      ) : (
                        <span
                          data-availability={daySchedule[p].isFree ? "free" : "busy"}
                          className={slotClass(!daySchedule[p].isFree, false)}
                        >
                          {daySchedule[p].isFree ? "Free" : daySchedule[p].classSection || "Busy"}
                        </span>
                      )}
                    </td>
                  ))}
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex justify-end gap-1">
                      {editing ? (
                        <>
                          <Button size="icon" variant="ghost" onClick={save} aria-label="Save">
                            <Check />
                          </Button>
                          <Button size="icon" variant="ghost" onClick={cancel} aria-label="Cancel">
                            <X />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => startEdit(t)}
                            aria-label={`Edit ${t.name}`}
                          >
                            <Pencil />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => remove(t.id)}
                            aria-label={`Remove ${t.name}`}
                          >
                            <Trash2 className="text-destructive" />
                          </Button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
