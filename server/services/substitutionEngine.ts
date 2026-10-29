import { Absence, CalendarDay, ClassSection, DailySubstitution, Subject, Teacher, TeacherAssignment, TimetableSlot, TimetableVersion } from "../models";
import { pickBestSubstitute } from "./substitutionService";

export async function runSubstitutionDraft(schoolId: string, date: string, reset = false) {
  const holiday = await CalendarDay.findOne({ schoolId, date: { $lte: date }, $or: [{ endDate: null }, { endDate: { $gte: date } }] }).lean();
  if (holiday && holiday.type !== "WORKING") throw new Error(`Substitutions are blocked on ${holiday.name || "this non-working day"}.`);
  const dayIndex = new Date(`${date}T00:00:00`).getDay();
  if (dayIndex === 0) throw new Error("Substitutions are blocked on weekly off days.");
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  const [absences, slots, teachers, assignments, previous] = await Promise.all([
    Absence.find({ schoolId, date }).lean(),
    TimetableVersion.findOne({ schoolId, status: "PUBLISHED" }).sort({ versionNumber: -1 }).lean().then((version) => version ? TimetableSlot.find({ schoolId, versionId: version._id, dayOfWeek: dayName }).lean() : []),
    Teacher.find({ schoolId }).lean(),
    TeacherAssignment.find({ schoolId }).lean(),
    DailySubstitution.find({ schoolId, date }).lean(),
  ]);
  if (!absences.length) return [];
  const subjectIds = [...new Set(slots.map((slot) => String(slot.subjectId)))];
  const classes = await ClassSection.find({ schoolId, _id: { $in: slots.map((slot) => slot.classSectionId) } }).lean();
  const subjects = await Subject.find({ schoolId, _id: { $in: subjectIds } }).lean();
  const classMap = new Map(classes.map((entry) => [String(entry._id), entry]));
  const subjectMap = new Map(subjects.map((entry) => [String(entry._id), entry]));
  const absentTeachers = new Set(absences.map((absence) => String(absence.teacherId)));
  const coverCounts = new Map<string, number>();
  const assignedSlots = new Set<string>();
  const dailyLoads = new Map<string, number>();
  for (const slot of slots) dailyLoads.set(String(slot.teacherId), (dailyLoads.get(String(slot.teacherId)) ?? 0) + 1);
  for (const substitution of previous) {
    if (substitution.substituteTeacherId && (substitution.status === "PUBLISHED" || substitution.isManualOverride)) {
      const teacherId = String(substitution.substituteTeacherId);
      assignedSlots.add(`${teacherId}|${substitution.periodNumber}`);
      coverCounts.set(teacherId, (coverCounts.get(teacherId) ?? 0) + 1);
      dailyLoads.set(teacherId, (dailyLoads.get(teacherId) ?? 0) + 1);
    }
  }

  const outputs = [];
  for (const absence of absences) {
    const affected = absence.isFullDay
      ? [...new Set(slots.filter((slot) => String(slot.teacherId) === String(absence.teacherId)).map((slot) => slot.periodNumber))]
      : absence.affectedPeriods;
    for (const slot of slots.filter((entry) => String(entry.teacherId) === String(absence.teacherId) && affected.includes(entry.periodNumber))) {
      const existing = previous.find((entry) => String(entry.classSectionId) === String(slot.classSectionId) && entry.periodNumber === slot.periodNumber);
      if (existing?.isManualOverride && !reset) { outputs.push(existing); continue; }
      const schoolClass = classMap.get(String(slot.classSectionId));
      const subject = subjectMap.get(String(slot.subjectId));
      if (!schoolClass || !subject) continue;
      const classTeacherIds = new Set(assignments.filter((assignment) => String(assignment.classSectionId) === String(slot.classSectionId)).map((assignment) => String(assignment.teacherId)));
      const free = teachers.filter((teacher) => {
        const id = String(teacher._id);
        if (absentTeachers.has(id) || id === String(absence.teacherId)) return false;
        if (assignedSlots.has(`${id}|${slot.periodNumber}`)) return false;
        if (slots.some((other) => String(other.teacherId) === id && other.periodNumber === slot.periodNumber)) return false;
        const existingCover = previous.find((other) => String(other.substituteTeacherId) === id && other.periodNumber === slot.periodNumber && String(other.classSectionId) !== String(slot.classSectionId));
        if (existingCover && !reset) return false;
        const maxDaily = teacher.maxPeriodsPerDay ?? 6;
        return (dailyLoads.get(id) ?? 0) < maxDaily;
      });
      free.sort((left, right) => {
        const leftSpecialist = left.primarySubjects.some((item) => String(item) === String(slot.subjectId)) ? 0 : 1;
        const rightSpecialist = right.primarySubjects.some((item) => String(item) === String(slot.subjectId)) ? 0 : 1;
        if (leftSpecialist !== rightSpecialist) return leftSpecialist - rightSpecialist;
        const leftKnowsClass = classTeacherIds.has(String(left._id)) ? 0 : 1;
        const rightKnowsClass = classTeacherIds.has(String(right._id)) ? 0 : 1;
        if (leftKnowsClass !== rightKnowsClass) return leftKnowsClass - rightKnowsClass;
        return (dailyLoads.get(String(left._id)) ?? 0) - (dailyLoads.get(String(right._id)) ?? 0);
      });
      const selected = pickBestSubstitute(free.map((teacher) => ({
        id: String(teacher._id), name: teacher.name, qualificationCategory: teacher.qualificationCategory,
        subjectId: teacher.primarySubjects.some((item) => String(item) === String(slot.subjectId)) ? String(slot.subjectId) : undefined,
        currentLoadToday: dailyLoads.get(String(teacher._id)) ?? 0, isAvailable: true,
      })), { subjectId: String(slot.subjectId), grade: schoolClass.grade });
      const chosen = selected ? free.find((teacher) => String(teacher._id) === selected.candidate.id) : undefined;
      const created = await DailySubstitution.findOneAndUpdate(
        { schoolId, date, classSectionId: slot.classSectionId, periodNumber: slot.periodNumber },
        { $set: {
          absentTeacherId: slot.teacherId, subjectId: slot.subjectId,
          substituteTeacherId: chosen?._id ?? null, status: "DRAFT", matchTier: selected?.tier ?? 0,
          reason: chosen ? `Cover proposed for ${subject.name}` : "No free qualified teacher available. Class assigned to Self-Study",
          isManualOverride: false,
        } },
        { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
      );
      outputs.push(created);
      if (chosen) {
        const chosenId = String(chosen._id);
        assignedSlots.add(`${chosenId}|${slot.periodNumber}`);
        coverCounts.set(chosenId, (coverCounts.get(chosenId) ?? 0) + 1);
        dailyLoads.set(chosenId, (dailyLoads.get(chosenId) ?? 0) + 1);
      }
    }
  }
  return outputs;
}
