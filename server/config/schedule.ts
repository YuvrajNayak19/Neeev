export const SCHOOL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;

export const PERIOD_SLOTS = [
  { number: 1, start: "08:20", end: "09:00" },
  { number: 2, start: "09:00", end: "09:40" },
  { number: 3, start: "09:40", end: "10:20" },
  { number: 4, start: "10:20", end: "11:00" },
  { number: 5, start: "11:20", end: "12:00" },
  { number: 6, start: "12:00", end: "12:40" },
  { number: 7, start: "12:40", end: "13:20" },
  { number: 8, start: "13:20", end: "14:00" },
] as const;

export const SCHOOL_RULES = {
  maxPeriodsPerDay: 6,
  maxPeriodsPerWeek: 30,
  gradeRange: { min: 6, max: 12 },
  prtMaxGrade: 8,
  tgtMaxGrade: 10,
  mission: "Timetables and substitutions, solved before the first bell.",
} as const;

export const SUBJECT_RULES: Record<string, { weeklyPeriods: number; minPerDay: number; maxPerDay: number; maxDaysPerWeek?: number; priority: number }> = {
  English: { weeklyPeriods: 6, minPerDay: 1, maxPerDay: 2, priority: 5 },
  Hindi: { weeklyPeriods: 5, minPerDay: 1, maxPerDay: 2, priority: 4 },
  Maths: { weeklyPeriods: 7, minPerDay: 1, maxPerDay: 2, priority: 5 },
  Science: { weeklyPeriods: 9, minPerDay: 1, maxPerDay: 2, maxDaysPerWeek: 5, priority: 5 },
  Social: { weeklyPeriods: 6, minPerDay: 1, maxPerDay: 2, priority: 4 },
  Computer: { weeklyPeriods: 2, minPerDay: 1, maxPerDay: 1, maxDaysPerWeek: 2, priority: 3 },
  Physics: { weeklyPeriods: 5, minPerDay: 1, maxPerDay: 2, priority: 5 },
  Chemistry: { weeklyPeriods: 5, minPerDay: 1, maxPerDay: 2, priority: 5 },
  Biology: { weeklyPeriods: 5, minPerDay: 1, maxPerDay: 2, priority: 5 },
  Economics: { weeklyPeriods: 4, minPerDay: 1, maxPerDay: 2, priority: 3 },
  PhysicalEducation: { weeklyPeriods: 3, minPerDay: 1, maxPerDay: 1, priority: 2 },
  Art: { weeklyPeriods: 3, minPerDay: 1, maxPerDay: 1, priority: 2 },
  Library: { weeklyPeriods: 2, minPerDay: 1, maxPerDay: 1, priority: 1 },
};

export const DEFAULT_CLASS_NAMES = [
  "6-A",
  "6-B",
  "7-A",
  "7-B",
  "8-A",
  "8-B",
  "9-A",
  "9-B",
  "9-C",
  "10-A",
  "10-B",
  "10-C",
  "11-A",
  "11-B",
  "12-A",
  "12-B",
] as const;
