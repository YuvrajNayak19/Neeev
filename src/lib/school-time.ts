/** Bell schedule used across the app (matches server/config/schedule.ts). */
export const PERIODS = [
  { number: 1, start: "08:20", end: "09:00" },
  { number: 2, start: "09:00", end: "09:40" },
  { number: 3, start: "09:40", end: "10:20" },
  { number: 4, start: "10:20", end: "11:00" },
  { number: 5, start: "11:20", end: "12:00" },
  { number: 6, start: "12:00", end: "12:40" },
  { number: 7, start: "12:40", end: "13:20" },
  { number: 8, start: "13:20", end: "14:00" },
] as const;

export const LUNCH = { afterPeriod: 4, start: "11:00", end: "11:20" } as const;
export const SCHOOL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export type SchoolDay = (typeof SCHOOL_DAYS)[number];

/** "13:20" → "1:20 pm" */
export function formatTime(value: string): string {
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours >= 12 ? "pm" : "am";
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

export function periodTime(number: number): string {
  const period = PERIODS.find((item) => item.number === number);
  return period ? `${formatTime(period.start)} – ${formatTime(period.end)}` : "";
}

export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

/** The school day to show: today, or the next Monday when today is Sunday. */
export function currentSchoolDate(now = new Date()): Date {
  const date = new Date(now);
  if (date.getDay() === 0) date.setDate(date.getDate() + 1);
  return date;
}

export function schoolDayName(date: Date): SchoolDay {
  return (["Sunday", ...SCHOOL_DAYS] as const)[date.getDay()] as SchoolDay;
}

/** The period running right now, if any (used to highlight "now" on timetables). */
export function currentPeriod(now = new Date()): number | null {
  const minutes = now.getHours() * 60 + now.getMinutes();
  for (const period of PERIODS) {
    const [sh, sm] = period.start.split(":").map(Number);
    const [eh, em] = period.end.split(":").map(Number);
    if (minutes >= sh * 60 + sm && minutes < eh * 60 + em) return period.number;
  }
  return null;
}

export function formatLongDate(date: Date): string {
  return date.toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
}
