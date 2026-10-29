import { CalendarDay, DailySubstitution, TimetableOverride, TimetableSlot, TimetableVersion } from "../models";

export type EffectiveTimetableTarget = { classId: string } | { teacherId: string };

export async function getEffectiveTimetable(schoolId: string, date: string, target: EffectiveTimetableTarget) {
  const calendar = await CalendarDay.findOne({ schoolId, date: { $lte: date }, $or: [{ endDate: null }, { endDate: { $gte: date } }] }).lean();
  if (calendar && calendar.type !== "WORKING") {
    return { date, holiday: { name: calendar.name, type: calendar.type }, entries: [] };
  }
  const dayIndex = new Date(`${date}T00:00:00`).getDay();
  const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex];
  if (dayName === "Sunday") return { date, holiday: { name: "Weekly off", type: "WEEKLY_OFF" }, entries: [] };
  const version = await TimetableVersion.findOne({ schoolId, status: "PUBLISHED" }).sort({ versionNumber: -1 }).lean();
  if (!version) return { date, holiday: null, entries: [] };
  const selector: { classSectionId?: string; teacherId?: string } = "classId" in target ? { classSectionId: target.classId } : { teacherId: target.teacherId };
  const weekDay = dayName as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
  const [master, overrides, substitutions] = await Promise.all([
    TimetableSlot.find({ schoolId, versionId: version._id, dayOfWeek: weekDay, ...selector }).populate("classSectionId subjectId teacherId").lean(),
    TimetableOverride.find({ schoolId, date, ...( "classId" in target ? { classSectionId: target.classId } : { teacherId: target.teacherId }) }).populate("classSectionId subjectId teacherId").lean(),
    DailySubstitution.find({ schoolId, date, status: "PUBLISHED", ...( "classId" in target ? { classSectionId: target.classId } : { substituteTeacherId: target.teacherId }) }).populate("classSectionId subjectId absentTeacherId substituteTeacherId").lean(),
  ]);
  return { date, holiday: null, versionId: version._id, entries: master, overrides, substitutions };
}
