import type {
  DailySubstitution,
  MasterTimetable,
  SchoolDay,
  SchoolPeriod,
  SmartSubstitutionInput,
  SmartSubstitutionResult,
  Subject,
  TeacherAssignment,
  SchoolTeacher,
} from "../types/school-domain";

const categoryRank: Record<SchoolTeacher["category"], number> = { PRT: 1, TGT: 2, PGT: 3 };

const getSchoolDay = (date: string): SchoolDay | null => {
  const parsed = new Date(`${date}T12:00:00Z`);
  const day = parsed.getUTCDay();
  return day === 0 ? null : (day as SchoolDay);
};

const hasAbsence = (teacherId: string, period: SchoolPeriod, input: SmartSubstitutionInput): boolean =>
  input.absences.some((absence) => absence.teacherId === teacherId && absence.periods.includes(period));

const slotFor = (timetable: MasterTimetable[], teacherId: string, day: SchoolDay, period: SchoolPeriod): MasterTimetable | undefined =>
  timetable.find((slot) => slot.assignedTeacherId === teacherId && slot.dayOfWeek === day && slot.period === period);

const subjectFor = (subjects: Subject[], subjectId: string | undefined): Subject | undefined =>
  subjectId ? subjects.find((subject) => subject.id === subjectId) : undefined;

const teachesSubjectToAnotherSection = (
  teacherId: string,
  subjectId: string | undefined,
  absentClassId: string,
  assignments: TeacherAssignment[],
): boolean => Boolean(subjectId && assignments.some((assignment) =>
  assignment.teacherId === teacherId &&
  assignment.subjectId === subjectId &&
  assignment.classSectionId !== absentClassId,
));

const matchTier = (
  candidate: SchoolTeacher,
  absentTeacher: SchoolTeacher,
  subjectId: string | undefined,
  absentClassId: string,
  assignments: TeacherAssignment[],
): number => {
  if (teachesSubjectToAnotherSection(candidate.id, subjectId, absentClassId, assignments)) return 1;
  if (subjectId && candidate.primarySubjects.includes(subjectId)) return 2;
  if (candidate.category === absentTeacher.category) return 3;
  return 4;
};

const reasonFor = (
  candidate: SchoolTeacher,
  tier: number,
  subject: Subject | undefined,
  load: number,
): string => {
  if (tier === 1) return `Subject specialist for ${subject?.name ?? "this subject"}; ${load} coverages before this assignment`;
  if (tier === 2) return `Primary ${subject?.name ?? "subject"} teacher; ${load} coverages before this assignment`;
  if (tier === 3) return `Same ${candidate.category} category; ${load} coverages before this assignment`;
  return `Eligible seniority fallback; ${load} coverages before this assignment`;
};

export function generateSmartSubstitutions(input: SmartSubstitutionInput): SmartSubstitutionResult {
  const day = getSchoolDay(input.date);
  const teacherById = new Map(input.teachers.map((teacher) => [teacher.id, teacher]));
  const sectionById = new Set(input.classSections.map((section) => section.id));
  const loadByTeacher = new Map<string, number>();
  const reserved = new Set<string>();
  const substitutions: DailySubstitution[] = [];

  if (!day) return { schoolId: input.schoolId, date: input.date, substitutions, generatedAt: new Date().toISOString() };

  const absenceSlots = input.absences.flatMap((absence) => absence.periods.map((period) => ({ absence, period }))).sort((a, b) => a.period - b.period || a.absence.teacherId.localeCompare(b.absence.teacherId));

  for (const { absence, period } of absenceSlots) {
    const absentTeacher = teacherById.get(absence.teacherId);
    if (!absentTeacher) continue;

    const affectedSlots = input.masterTimetable.filter((slot) =>
      slot.dayOfWeek === day && slot.period === period && slot.assignedTeacherId === absentTeacher.id,
    );
    const timetableSlot = affectedSlots[0];
    if (!timetableSlot || !timetableSlot.classSectionId || !sectionById.has(timetableSlot.classSectionId)) {
      substitutions.push({
        id: `${input.date}-${absence.teacherId}-${period}-unassigned`,
        schoolId: input.schoolId,
        date: input.date,
        period,
        classSectionId: timetableSlot?.classSectionId ?? "unknown-class",
        subjectId: timetableSlot?.subjectId,
        regularTeacherId: absentTeacher.id,
        status: "unassigned",
        matchReason: `No master timetable slot found for ${absentTeacher.name} in Period ${period}`,
      });
      continue;
    }

    const subject = subjectFor(input.subjects, timetableSlot.subjectId);
    const candidates = input.teachers
      .filter((candidate) => {
        const hasClass = Boolean(slotFor(input.masterTimetable, candidate.id, day, period));
        return candidate.id !== absentTeacher.id &&
          !hasAbsence(candidate.id, period, input) &&
          !hasClass &&
          !reserved.has(`${candidate.id}:${period}`) &&
          categoryRank[candidate.category] >= categoryRank[absentTeacher.category];
      })
      .map((candidate) => ({
        candidate,
        tier: matchTier(candidate, absentTeacher, timetableSlot.subjectId, timetableSlot.classSectionId, input.assignments),
        load: loadByTeacher.get(candidate.id) ?? 0,
      }))
      .sort((a, b) => a.tier - b.tier || a.load - b.load || a.candidate.name.localeCompare(b.candidate.name));

    const selected = candidates[0];
    if (!selected) {
      const subjectName = subject?.name ?? "subject specialist";
      substitutions.push({
        id: `${input.date}-${absence.teacherId}-${period}`,
        schoolId: input.schoolId,
        date: input.date,
        period,
        classSectionId: timetableSlot.classSectionId,
        subjectId: timetableSlot.subjectId,
        regularTeacherId: absentTeacher.id,
        status: "unassigned",
        matchReason: `No available ${subjectName} or senior teacher free during Period ${period}`,
      });
      continue;
    }

    const selectedLoad = selected.load + 1;
    loadByTeacher.set(selected.candidate.id, selectedLoad);
    reserved.add(`${selected.candidate.id}:${period}`);
    substitutions.push({
      id: `${input.date}-${absence.teacherId}-${period}`,
      schoolId: input.schoolId,
      date: input.date,
      period,
      classSectionId: timetableSlot.classSectionId,
      subjectId: timetableSlot.subjectId,
      regularTeacherId: absentTeacher.id,
      substituteTeacherId: selected.candidate.id,
      status: "assigned",
      matchReason: reasonFor(selected.candidate, selected.tier, subject, selected.load),
    });
  }

  return { schoolId: input.schoolId, date: input.date, substitutions, generatedAt: new Date().toISOString() };
}
