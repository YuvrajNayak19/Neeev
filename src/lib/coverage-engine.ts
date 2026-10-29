import type { Absence, CoverageAssignment, Period, Schedule, Teacher, TeacherCategory, TimetableSlot } from "../types/domain";

const categoryRank: Record<TeacherCategory, number> = { PRT: 1, TGT: 2, PGT: 3 };

const isTeacherAbsentForPeriod = (teacherId: string, period: Period, absences: Absence[]): boolean =>
  absences.some((absence) => absence.teacherId === teacherId && absence.periods.includes(period));

const getSlot = (teacher: Teacher, period: Period): TimetableSlot | undefined => teacher.timetable?.[period];

const isBusyForPeriod = (teacher: Teacher, period: Period): boolean => {
  const slot = getSlot(teacher, period);
  return slot ? !slot.isFree && Boolean(slot.classSection) : teacher.busyPeriods[period];
};

export const generateCoverageSchedule = ({
  schoolId,
  date,
  teachers,
  absences,
  generatedBy,
}: {
  schoolId: string;
  date: string;
  teachers: Teacher[];
  absences: Absence[];
  generatedBy: string;
}): Schedule => {
  const loadByTeacher = new Map<string, number>();
  const teacherById = new Map(teachers.map((teacher) => [teacher.id, teacher]));
  const assignedPeriods = new Set<string>();
  const assignments: CoverageAssignment[] = [];

  const absentSlots = absences.flatMap((absence) => {
    const teacher = teacherById.get(absence.teacherId);
    if (!teacher) return [];
    return absence.periods.map((period) => ({ teacher, period }));
  }).sort((left, right) => left.period - right.period || left.teacher.name.localeCompare(right.teacher.name));

  for (const { teacher: absentTeacher, period } of absentSlots) {
    const eligibleTeachers = teachers.filter((candidate) =>
      candidate.id !== absentTeacher.id &&
      !isBusyForPeriod(candidate, period) &&
      !isTeacherAbsentForPeriod(candidate.id, period, absences) &&
      !assignedPeriods.has(`${candidate.id}:${period}`) &&
      categoryRank[candidate.category] >= categoryRank[absentTeacher.category],
    );

    eligibleTeachers.sort((first, second) => {
      const subjectDifference = Number(second.subject === absentTeacher.subject) - Number(first.subject === absentTeacher.subject);
      if (subjectDifference !== 0) return subjectDifference;
      const categoryDifference = Number(second.category === absentTeacher.category) - Number(first.category === absentTeacher.category);
      if (categoryDifference !== 0) return categoryDifference;
      const loadDifference = (loadByTeacher.get(first.id) ?? 0) - (loadByTeacher.get(second.id) ?? 0);
      if (loadDifference !== 0) return loadDifference;
      return first.name.localeCompare(second.name);
    });

    const candidate = eligibleTeachers[0];
    if (candidate) {
      loadByTeacher.set(candidate.id, (loadByTeacher.get(candidate.id) ?? 0) + 1);
      assignedPeriods.add(`${candidate.id}:${period}`);
      assignments.push({
        id: `${date}-${absentTeacher.id}-${period}`,
        absentTeacherId: absentTeacher.id,
        absentTeacherName: absentTeacher.name,
        classSubject: absentTeacher.subject,
        classSection: getSlot(absentTeacher, period)?.classSection ?? "Unassigned class",
        category: absentTeacher.category,
        period,
        coveringTeacherId: candidate.id,
        coveringTeacherName: candidate.name,
        status: "assigned",
      });
    } else {
      const rankEligible = teachers.some((candidate) =>
        candidate.id !== absentTeacher.id && categoryRank[candidate.category] >= categoryRank[absentTeacher.category],
      );
      assignments.push({
        id: `${date}-${absentTeacher.id}-${period}`,
        absentTeacherId: absentTeacher.id,
        absentTeacherName: absentTeacher.name,
        classSubject: absentTeacher.subject,
        classSection: getSlot(absentTeacher, period)?.classSection ?? "Unassigned class",
        category: absentTeacher.category,
        period,
        status: "unassigned",
        reason: rankEligible ? "All eligible teachers are unavailable for this period" : "No available teacher with matching rank",
      });
    }
  }

  return {
    id: `${schoolId}-${date}`,
    schoolId,
    date,
    assignments,
    generatedAt: new Date().toISOString(),
    generatedBy,
  };
};
