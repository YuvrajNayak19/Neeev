export type SubjectCategory = "stem" | "humanities" | "elective" | "pe" | "other";

const STEM = /math|science|physics|chemistry|biology/i;
const HUMANITIES = /english|hindi|history|social|geography|civics|economics/i;
const ELECTIVE = /computer|\bit\b|informatics/i;
const PE = /physical|\bpe\b|sport|yoga/i;

export function subjectCategory(name?: string | null): SubjectCategory {
  if (!name) return "other";
  if (PE.test(name)) return "pe";
  if (ELECTIVE.test(name)) return "elective";
  if (STEM.test(name)) return "stem";
  if (HUMANITIES.test(name)) return "humanities";
  return "other";
}

/** Left-border accent + faint tint per subject family. */
export const SUBJECT_ACCENT: Record<SubjectCategory, string> = {
  stem: "border-l-4 border-l-sky-500 bg-sky-50/30",
  humanities: "border-l-4 border-l-amber-500 bg-amber-50/30",
  elective: "border-l-4 border-l-violet-500 bg-violet-50/30",
  pe: "border-l-4 border-l-emerald-500 bg-emerald-50/30",
  other: "border-l-4 border-l-slate-300 bg-slate-50/40",
};

export const PERIODS = [
  { number: 1, start: "08:20 AM", end: "09:00 AM" },
  { number: 2, start: "09:00 AM", end: "09:40 AM" },
  { number: 3, start: "09:40 AM", end: "10:20 AM" },
  { number: 4, start: "10:20 AM", end: "11:00 AM" },
  { number: 5, start: "11:20 AM", end: "12:00 PM" },
  { number: 6, start: "12:00 PM", end: "12:40 PM" },
  { number: 7, start: "12:40 PM", end: "01:20 PM" },
  { number: 8, start: "01:20 PM", end: "02:00 PM" },
] as const;

export const LUNCH = { start: "11:00 AM", end: "11:20 AM" } as const;
