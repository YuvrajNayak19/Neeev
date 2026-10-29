import type { SubjectCategory, TimetableCellData } from "@/components/design-system/timetable-primitives";

export const SCHOOL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
export const PERIOD_TIMES = [
  { start: "08:20 AM", end: "09:00 AM" },
  { start: "09:00 AM", end: "09:40 AM" },
  { start: "09:40 AM", end: "10:20 AM" },
  { start: "10:20 AM", end: "11:00 AM" },
  { start: "11:20 AM", end: "12:00 PM" },
  { start: "12:00 PM", end: "12:40 PM" },
  { start: "12:40 PM", end: "01:20 PM" },
  { start: "01:20 PM", end: "02:00 PM" },
] as const;

export interface TimetableEntry extends TimetableCellData {
  dayIndex: number;
  period: number;
  coverTeacher?: string;
}

const SUBJECTS: Record<string, { category: SubjectCategory; teacher: string; qualification: "TGT" | "PGT"; room: string }> = {
  English: { category: "humanities", teacher: "Riya Sen", qualification: "TGT", room: "Room 14" },
  Mathematics: { category: "stem", teacher: "Vikram Singh", qualification: "PGT", room: "Room 14" },
  Science: { category: "stem", teacher: "Nisha Shah", qualification: "PGT", room: "Science Lab" },
  "Social Science": { category: "humanities", teacher: "Aarav Mehta", qualification: "TGT", room: "Room 12" },
  Hindi: { category: "humanities", teacher: "Meera Nair", qualification: "TGT", room: "Room 14" },
  Art: { category: "electives", teacher: "Kavya Das", qualification: "TGT", room: "Art Studio" },
  "Physical Education": { category: "sports", teacher: "Kabir Joshi", qualification: "TGT", room: "Sports Ground" },
  Computer: { category: "electives", teacher: "Karan Das", qualification: "PGT", room: "Computer Lab" },
};

const WEEK: readonly (readonly string[])[] = [
  ["English", "Mathematics", "Science", "Hindi", "Social Science", "Mathematics", "Physical Education", "English"],
  ["Mathematics", "English", "Science", "Social Science", "Hindi", "Art", "Mathematics", "Physical Education"],
  ["English", "Science", "Mathematics", "Hindi", "Social Science", "Computer", "Physical Education", "Mathematics"],
  ["Hindi", "Mathematics", "Science", "English", "Social Science", "Art", "Physical Education", "Mathematics"],
  ["English", "Social Science", "Science", "Mathematics", "Hindi", "Physical Education", "Art", "English"],
  ["Mathematics", "English", "Science", "Social Science", "Hindi", "Computer", "Physical Education", "Mathematics"],
];

export function createClassTenSeed(): TimetableEntry[] {
  return WEEK.flatMap((day, dayIndex) => day.map((subject, periodIndex) => {
    const details = SUBJECTS[subject];
    const period = periodIndex + 1;
    const isCover = dayIndex === 3 && period === 3;
    const variant = dayIndex === 0 && period === 1 ? "locked" : dayIndex === 2 && period === 7 ? "forced" : isCover ? "cover" : "normal";
    return {
      ...details,
      dayIndex,
      period,
      subject,
      teacher: isCover ? "Riya Sen" : details.teacher,
      variant,
      absentTeacher: isCover ? details.teacher : undefined,
      coverTeacher: isCover ? "Riya Sen" : undefined,
      workload: `${[5, 6, 5, 4, 6, 4, 3][dayIndex]} periods assigned today`,
    };
  }));
}

export const BUSIEST_TEACHERS = [
  { name: "Vikram Singh", subject: "Mathematics", periods: 28, capacity: 30, initials: "VS" },
  { name: "Nisha Shah", subject: "Science", periods: 26, capacity: 30, initials: "NS" },
  { name: "Riya Sen", subject: "English", periods: 24, capacity: 30, initials: "RS" },
  { name: "Aarav Mehta", subject: "Social Science", periods: 22, capacity: 30, initials: "AM" },
  { name: "Meera Nair", subject: "Hindi", periods: 20, capacity: 30, initials: "MN" },
] as const;