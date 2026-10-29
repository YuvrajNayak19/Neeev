import { PERIODS, type Period, type Teacher, type TimetablePeriod } from "@/lib/substitution";

export type ParsedTimetableDay = {
  day: number;
  classSection: string;
  isBusy: boolean;
};

export type TeacherDaySchedule = Record<Period, TimetablePeriod>;

const DAYS = [1, 2, 3, 4, 5, 6] as const;

function emptyDays(): ParsedTimetableDay[] {
  return DAYS.map((day) => ({ day, classSection: "", isBusy: false }));
}

function normalizeClassSection(value: string) {
  return value.trim().replace(/\s+/g, " ").replace(/\s*\+\s*/g, "+").toUpperCase();
}

/**
 * Parses cells such as "XII G 1-6", "XI A 1-3", or "XII B 2,3".
 * Every result contains all Monday-Saturday slots so missing days remain free.
 */
export function parseTimetableCell(cellText: string): ParsedTimetableDay[] {
  const result = emptyDays();
  const lines = cellText.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return result;

  for (const line of lines) {
    // Class like "XII B", "XI A", "X D", "XII B+G" followed by a day range; annotations (NEEEV, R.N., SOL...) never match.
    const match = line.match(
      /^((?:XII|XI|IX|X|VIII|VII|VI)\s*[A-Z](?:\s*\+\s*[A-Z])*)\s+([1-6](?:\s*-\s*[1-6])?(?:\s*,\s*[1-6](?:\s*-\s*[1-6])?)*)$/i,
    );
    if (!match) continue;

    const classSection = normalizeClassSection(match[1] ?? "");
    const daySpec = (match[2] ?? "").replace(/\s/g, "");
    const days = new Set<number>();

    for (const part of daySpec.split(",")) {
      const [rawStart, rawEnd] = part.split("-").map(Number);
      const start = rawStart ?? 0;
      const end = rawEnd ?? start;
      for (let day = start; day <= end; day += 1) days.add(day);
    }

    for (const day of days) {
      const slot = result[day - 1];
      if (slot) {
        slot.classSection = classSection;
        slot.isBusy = true;
      }
    }
  }

  return result;
}

export function dayIndexForDate(targetDate: Date): number | null {
  const day = targetDate.getDay();
  return day === 0 ? null : day;
}

export function getTeacherScheduleForDay(
  teacher: Teacher,
  day: number | null,
): TeacherDaySchedule {
  return Object.fromEntries(
    PERIODS.map((period) => {
      const legacy = teacher.timetable?.[period];
      const weeklyPeriod = teacher.weeklyTimetable?.[period];
      const weekly = day ? weeklyPeriod?.[day] : undefined;
      // Once a period has weekly data, a missing day means Free (never fall back to the legacy single-day slot).
      if (weeklyPeriod && Object.keys(weeklyPeriod).length > 0) {
        return [period, weekly ?? { subject: teacher.subject, classSection: "", isFree: true }];
      }
      return [
        period,
        weekly ??
          legacy ?? {
            subject: teacher.subject,
            classSection: "",
            isFree: !teacher.busy[period],
          },
      ];
    }),
  ) as TeacherDaySchedule;
}

/**
 * Resolves a teacher's weekly timetable for a date. Sunday is an off day.
 */
export function getTeacherScheduleForDate(
  teacher: Teacher,
  targetDate: Date,
): TeacherDaySchedule {
  const day = dayIndexForDate(targetDate);
  return day === null
    ? Object.fromEntries(
        PERIODS.map((period) => [
          period,
          { subject: teacher.subject, classSection: "", isFree: true },
        ]),
      ) as TeacherDaySchedule
    : getTeacherScheduleForDay(teacher, day);
}
