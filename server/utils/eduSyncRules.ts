import { gradeRuleProblem } from "../services/timetableEngine";

export type Qualification = "PRT" | "TGT" | "PGT";

export type TimetableEntry = {
  day: string;
  periodNumber: number;
  className: string;
  subject: string;
  teacherName: string;
  teacherQualification: Qualification;
};

export function canTeachGrade(qualification: Qualification, grade: number): boolean {
  return gradeRuleProblem({ name: "Teacher", cat: qualification }, grade) === null;
}

export function validateTeacherAssignment(qualification: Qualification, grade: number): { valid: boolean; message?: string } {
  if (canTeachGrade(qualification, grade)) {
    return { valid: true };
  }

  return {
    valid: false,
    message: `${qualification} is not valid for Grade ${grade}.`,
  };
}

export function getSubjectRule(subject: string) {
  const rules: Record<string, { weeklyPeriods: number; minPerDay: number; maxPerDay: number; priority: number; maxDaysPerWeek?: number }> = {
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

  return rules[subject] ?? { weeklyPeriods: 4, minPerDay: 1, maxPerDay: 2, priority: 3 };
}

export function validateTimetable(entries: TimetableEntry[]) {
  const teacherPeriods = new Map<string, number>();
  const teacherByDayPeriod = new Map<string, string>();
  const issues: string[] = [];

  for (const entry of entries) {
    const key = `${entry.day}-${entry.periodNumber}`;
    const teacherKey = `${entry.teacherName}-${entry.day}-${entry.periodNumber}`;
    if (teacherByDayPeriod.has(teacherKey)) {
      issues.push(`${entry.teacherName} is double-booked on ${entry.day} period ${entry.periodNumber}.`);
    }
    teacherByDayPeriod.set(teacherKey, entry.className);

    const teacherCount = teacherPeriods.get(entry.teacherName) ?? 0;
    teacherPeriods.set(entry.teacherName, teacherCount + 1);

    if (!canTeachGrade(entry.teacherQualification, Number(entry.className.split("-")[0]))) {
      issues.push(`${entry.teacherName} cannot teach ${entry.className} as a ${entry.teacherQualification}.`);
    }
  }

  const overloads = [...teacherPeriods.entries()].filter(([, count]) => count > 30);
  overloads.forEach(([name, count]) => issues.push(`${name} exceeds the weekly cap with ${count} periods.`));

  return { valid: issues.length === 0, issues };
}
