export const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export type Period = (typeof PERIODS)[number];

export const CATEGORIES = ["PRT", "TGT", "PGT"] as const;
export type Category = (typeof CATEGORIES)[number];

export type TimetablePeriod = {
  subject: string;
  classSection: string;
  isFree: boolean;
};

export type Teacher = {
  id: string;
  name: string;
  subject: string;
  category: Category;
  /** period -> true means BUSY (teaching), false/undefined means FREE */
  busy: Record<number, boolean>;
  timetable?: Record<number, TimetablePeriod>;
  weeklyTimetable?: Record<number, Record<number, TimetablePeriod>>;
};

export type Absence = {
  teacherId: string;
  periods: number[];
  vacantClass?: Record<number, string>;
};

function scheduleForPeriod(teacher: Teacher, period: number, day?: number): TimetablePeriod | undefined {
  return (day ? teacher.weeklyTimetable?.[period]?.[day] : undefined) ?? teacher.timetable?.[period];
}

function isAssigned(teacher: Teacher, period: number, day?: number): boolean {
  const slot = scheduleForPeriod(teacher, period, day);
  return slot ? !slot.isFree && Boolean(slot.classSection) : Boolean(teacher.busy[period]);
}

function isFreeForDay(teacher: Teacher, period: number, day?: number): boolean {
  const slot = scheduleForPeriod(teacher, period, day);
  return slot ? slot.isFree || !slot.classSection : !teacher.busy[period];
}

export type Assignment = {
  period: number;
  absentTeacherId: string;
  absentTeacherName: string;
  subject: string;
  classSection: string;
  absentCategory?: Category;
  substituteId: string | null;
  substituteName: string;
  substituteCategory?: Category;
  reason: string;
};

/**
 * Check if a substitute (with substituteCategory) can cover for an absent teacher (with absentCategory).
 * Eligibility follows the school coverage rules: PGT→PGT, TGT→PGT/TGT, PRT→TGT/PRT.
 */
function canSubstitute(substituteCategory: Category, absentCategory: Category): boolean {
  if (absentCategory === "PGT") return substituteCategory === "PGT";
  if (absentCategory === "TGT") return substituteCategory === "PGT" || substituteCategory === "TGT";
  return substituteCategory === "TGT" || substituteCategory === "PRT";
}

/**
 * Assign a free teacher to every absent period.
 * Priority: same subject first, then same/eligible category, then lowest substitution load today.
 */
export function generateSchedule(input: Teacher[], absences: Absence[], day?: number): Assignment[] {
  const teachers = input.map((t) => ({ ...t, busy: { ...t.busy } }));
  const load: Record<string, number> = {};
  const absentIds = new Set(absences.map((a) => a.teacherId));
  const byId = new Map(teachers.map((t) => [t.id, t]));
  const blocked = new Set<string>();

  const rows: { period: number; teacher: Teacher; vacantClass?: string | undefined }[] = [];
  for (const a of absences) {
    const t = byId.get(a.teacherId);
    if (!t) continue;
    for (const p of a.periods) {
      if (!isAssigned(t, p, day)) continue;
      const slot = scheduleForPeriod(t, p, day);
      rows.push({
        period: p,
        teacher: t,
        vacantClass: a.vacantClass?.[p] || slot?.classSection,
      });
    }
  }
  rows.sort((x, y) => x.period - y.period || x.teacher.name.localeCompare(y.teacher.name));

  return rows.map(({ period, teacher, vacantClass }) => {
    // Filter candidates: must be free, not absent, and able to substitute
    const candidates = teachers.filter(
      (c) =>
        c.id !== teacher.id &&
        !absentIds.has(c.id) &&
        !blocked.has(`${c.id}:${period}`) &&
        isFreeForDay(c, period, day) &&
        canSubstitute(c.category, teacher.category),
    );

    candidates.sort((c1, c2) => {
      // Priority 1: Same subject
      const s1 = c1.subject === teacher.subject ? 0 : 1;
      const s2 = c2.subject === teacher.subject ? 0 : 1;
      if (s1 !== s2) return s1 - s2;

      // Priority 2: Same category, when eligible
      const c1Category = c1.category === teacher.category ? 0 : 1;
      const c2Category = c2.category === teacher.category ? 0 : 1;
      if (c1Category !== c2Category) return c1Category - c2Category;

      // Priority 3: Lowest substitution load today
      const l1 = load[c1.id] ?? 0;
      const l2 = load[c2.id] ?? 0;
      if (l1 !== l2) return l1 - l2;
      
      // Priority 4: Alphabetical
      return c1.name.localeCompare(c2.name);
    });

    const pick = candidates[0];
    if (!pick) {
      return {
        period,
        absentTeacherId: teacher.id,
        absentTeacherName: teacher.name,
        subject: teacher.subject,
        classSection: vacantClass ?? teacher.timetable?.[period]?.classSection ?? "Unassigned",
        absentCategory: teacher.category,
        substituteId: null,
        substituteName: "— Unassigned —",
        reason: "No free teacher available in this period",
      };
    }

    load[pick.id] = (load[pick.id] ?? 0) + 1;
    blocked.add(`${pick.id}:${period}`);
    // block the substitute so they are not double-booked
    pick.busy = { ...pick.busy, [period]: true };
    if (pick.timetable?.[period]) {
      pick.timetable = {
        ...pick.timetable,
        [period]: { ...pick.timetable[period], isFree: false },
      };
    }

    return {
      period,
      absentTeacherId: teacher.id,
      absentTeacherName: teacher.name,
      subject: teacher.subject,
      classSection: vacantClass ?? teacher.timetable?.[period]?.classSection ?? "Unassigned",
      absentCategory: teacher.category,
      substituteId: pick.id,
      substituteName: pick.name,
      substituteCategory: pick.category,
      reason:
        pick.subject === teacher.subject
          ? `Same department (${pick.subject})`
          : `Free period · lowest load (${pick.subject})`,
    };
  });
}

export function toCsv(rows: Assignment[], dateLabel: string): string {
  const head = [
    "Date",
    "Period",
    "Absent Teacher",
    "Category",
    "Subject",
    "Class / Section",
    "Substitute",
    "Substitute Category",
    "Reason",
  ];
  const body = rows.map((r) => [
    dateLabel,
    `P${r.period}`,
    r.absentTeacherName,
    r.absentCategory ?? "",
    r.subject,
    r.classSection,
    r.substituteName,
    r.substituteCategory ?? "",
    r.reason,
  ]);
  return [head, ...body]
    .map((line) => line.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
    .join("\n");
}
