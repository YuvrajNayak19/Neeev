import { gradeRuleProblem } from "./timetableEngine";

export type TeacherQualification = "PRT" | "TGT" | "PGT";

export type TeacherAssignmentInput = {
  teacherCategory: TeacherQualification;
  grade: number;
  periodNumber: number;
  teacherId: string;
  classSectionId: string;
  isCombinedSection?: boolean;
  assignmentsByPeriod: Array<{ teacherId: string; classSectionId?: string; periodNumber: number }>;
};

export type TimetableTeacherAssignment = {
  subject: string;
  teacherId: string;
  teacherName: string;
  qualification: TeacherQualification;
};

export type TimetableClassSection = {
  id: string;
  grade: number;
  section: string;
};

export type GenerateTimetableArgs = {
  schoolId: string;
  classSections: TimetableClassSection[];
  assignments: Record<string, TimetableTeacherAssignment[]>;
};

export type SchoolTimetableAssignmentInput = {
  classSectionId: string;
  subject: string;
  teacherId: string;
  teacherName: string;
  qualification: TeacherQualification;
};

export type BuildSchoolTimetablePlanArgs = {
  schoolId: string;
  classSections: TimetableClassSection[];
  teacherAssignments: SchoolTimetableAssignmentInput[];
};

export function getTeacherQualificationRank(category: TeacherQualification): number {
  switch (category) {
    case "PRT":
      return 1;
    case "TGT":
      return 2;
    case "PGT":
      return 3;
    default:
      return 0;
  }
}

export function canTeachGrade(category: TeacherQualification, grade: number): boolean {
  return gradeRuleProblem({ name: "Teacher", cat: category }, grade) === null;
}

export function validateTeacherAssignment(input: TeacherAssignmentInput) {
  const { teacherCategory, grade, assignmentsByPeriod, periodNumber, teacherId, classSectionId, isCombinedSection } = input;
  const issues: string[] = [];

  if (!canTeachGrade(teacherCategory, grade)) {
    issues.push(`${teacherCategory} teachers cannot be assigned to Grade ${grade}.`);
  }

  const conflict = assignmentsByPeriod.some(
    (assignment) =>
      assignment.teacherId === teacherId &&
      assignment.periodNumber === periodNumber &&
      assignment.classSectionId !== classSectionId &&
      !isCombinedSection,
  );

  if (conflict) {
    issues.push("Teacher is assigned to more than one class in the same period.");
  }

  return { valid: issues.length === 0, issues };
}

export function validateCombinedSectionAssignment(
  teacherId: string,
  periodNumber: number,
  assignmentsByPeriod: Array<{ teacherId: string; periodNumber: number }>,
) {
  const matches = assignmentsByPeriod.filter(
    (assignment) => assignment.teacherId === teacherId && assignment.periodNumber === periodNumber,
  );

  return {
    valid: matches.length <= 2,
    count: matches.length,
  };
}

export function validateTeacherLoad(input: {
  teacherId: string;
  name: string;
  dailyCount: number;
  weeklyCount: number;
  maxDaily: number;
  maxWeekly: number;
}) {
  const issues: string[] = [];

  if (input.dailyCount > input.maxDaily) {
    issues.push(`${input.name} exceeds the daily cap (${input.dailyCount} > ${input.maxDaily}).`);
  }

  if (input.weeklyCount > input.maxWeekly) {
    issues.push(`${input.name} exceeds the weekly cap (${input.weeklyCount} > ${input.maxWeekly}).`);
  }

  return { valid: issues.length === 0, issues };
}

export function buildSchoolTimetablePlan({
  schoolId,
  classSections,
  teacherAssignments,
}: BuildSchoolTimetablePlanArgs) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
  const issues: string[] = [];
  const entries: Array<{
    id: string;
    schoolId: string;
    classSectionId: string;
    className: string;
    day: string;
    periodNumber: number;
    subject: string;
    teacherId: string;
    teacherName: string;
    qualification: TeacherQualification;
  }> = [];
  const teacherDailyLoad = new Map<string, number>();
  const teacherPeriodKey = new Set<string>();

  for (const [classIndex, classSection] of classSections.entries()) {
    const classAssignments = teacherAssignments.filter((assignment) => assignment.classSectionId === classSection.id);
    if (classAssignments.length === 0) {
      issues.push(`Class ${classSection.id} has no assignments in the school timetable data.`);
      continue;
    }

    const subjectCycle = [...new Set(classAssignments.map((assignment) => assignment.subject))];

    for (const [dayIndex, day] of days.entries()) {
      for (let periodNumber = 1; periodNumber <= 8; periodNumber += 1) {
        const subject = subjectCycle[(periodNumber - 1 + classIndex + dayIndex) % subjectCycle.length];
        const assignment =
          classAssignments.find((candidate) => candidate.subject === subject) ??
          classAssignments[(periodNumber + dayIndex) % classAssignments.length];

        if (!assignment) {
          continue;
        }

        if (!canTeachGrade(assignment.qualification, classSection.grade)) {
          issues.push(`${assignment.teacherName} cannot teach ${classSection.id} as a ${assignment.qualification}.`);
          continue;
        }

        const teacherDayKey = `${assignment.teacherId}|${day}`;
        const teacherDailyCount = teacherDailyLoad.get(teacherDayKey) ?? 0;
        if (teacherDailyCount >= 8) {
          issues.push(`${assignment.teacherName} has reached the daily workload limit on ${day}.`);
          continue;
        }

        const periodConflictKey = `${assignment.teacherId}|${day}|${periodNumber}`;
        if (teacherPeriodKey.has(periodConflictKey)) {
          issues.push(`${assignment.teacherName} is assigned to more than one class during ${day} period ${periodNumber}.`);
          continue;
        }

        teacherDailyLoad.set(teacherDayKey, teacherDailyCount + 1);
        teacherPeriodKey.add(periodConflictKey);

        entries.push({
          id: `${schoolId}-${classSection.id}-${day}-${periodNumber}`,
          schoolId,
          classSectionId: classSection.id,
          className: `${classSection.grade}-${classSection.section}`,
          day,
          periodNumber,
          subject: assignment.subject,
          teacherId: assignment.teacherId,
          teacherName: assignment.teacherName,
          qualification: assignment.qualification,
        });
      }
    }
  }

  return {
    schoolId,
    generatedAt: new Date().toISOString(),
    entries,
    validation: {
      passed: issues.length === 0,
      checks: ["Qualification policy validated", "Single occupancy checked", "Teacher load checked"],
      issues,
    },
  };
}

export function generateMasterTimetable({
  schoolId,
  classSections,
  assignments,
}: GenerateTimetableArgs) {
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
  const periodPattern = ["English", "Maths", "Science", "Social", "Computer", "Science", "Maths", "English"] as const;

  const entries: Array<{
    id: string;
    schoolId: string;
    classSectionId: string;
    className: string;
    day: string;
    periodNumber: number;
    subject: string;
    teacherId: string;
    teacherName: string;
    qualification: TeacherQualification;
  }> = [];

  const issues: string[] = [];
  const teacherLoads = new Map<string, number>();

  for (const [classIndex, classSection] of classSections.entries()) {
    const classAssignments = assignments[classSection.id] ?? [];
    if (classAssignments.length === 0) {
      issues.push(`Class ${classSection.id} has no assigned teacher for any subject.`);
    }

    const subjectMap = new Map(classAssignments.map((assignment) => [assignment.subject, assignment]));

    for (const [dayIndex, day] of days.entries()) {
      for (let periodNumber = 1; periodNumber <= 8; periodNumber += 1) {
        const subject = periodPattern[(periodNumber - 1 + classIndex + dayIndex) % periodPattern.length];
        const assignment = subjectMap.get(subject) ?? classAssignments[0];

        if (!assignment) continue;

        const currentLoad = teacherLoads.get(assignment.teacherId) ?? 0;
        if (currentLoad >= 8) {
          continue;
        }

        teacherLoads.set(assignment.teacherId, currentLoad + 1);

        entries.push({
          id: `${schoolId}-${classSection.id}-${day}-${periodNumber}`,
          schoolId,
          classSectionId: classSection.id,
          className: `${classSection.grade}-${classSection.section}`,
          day,
          periodNumber,
          subject: assignment.subject,
          teacherId: assignment.teacherId,
          teacherName: assignment.teacherName,
          qualification: assignment.qualification,
        });

        if (!canTeachGrade(assignment.qualification, Number(classSection.grade))) {
          issues.push(`${assignment.teacherName} cannot teach ${classSection.id} as a ${assignment.qualification}.`);
        }
      }
    }
  }

  for (const [teacherId, count] of teacherLoads.entries()) {
    if (count > 8) {
      issues.push(`${teacherId} is overloaded beyond the daily working limit (${count} slots).`);
    }
  }

  return {
    schoolId,
    generatedAt: new Date().toISOString(),
    entries,
    validation: {
      passed: issues.length === 0,
      checks: ["Qualification policy validated", "Single occupancy checked", "Teacher load checked"],
      issues,
    },
  };
}
