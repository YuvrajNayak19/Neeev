import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { Absence, CalendarDay, ClassSection, DailySubstitution, School, Subject, Teacher, TimetableSlot, TimetableVersion } from "../models";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody, validateQuery } from "../utils/validation";
import { runSubstitutionDraft } from "../services/substitutionEngine";
import { PERIOD_SLOTS } from "../config/schedule";
import { canTeachGrade } from "../services/timetableSolverService";

export const operationsRoutes = Router();
operationsRoutes.use(requireAuth);
const dateSchema = z.string().date();
const absenceSchema = z.object({ teacherId: z.string().regex(/^[a-f\d]{24}$/i), date: dateSchema, endDate: dateSchema.optional(), isFullDay: z.boolean().default(true), affectedPeriods: z.array(z.number().int().min(1).max(12)).default([]), reason: z.string().trim().max(300).default("") }).refine((item) => !item.endDate || item.endDate >= item.date);

operationsRoutes.get("/absences", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateQuery(z.object({ date: dateSchema.optional(), from: dateSchema.optional(), to: dateSchema.optional() })), async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = { schoolId: req.user?.schoolId };
  if (req.query.date) filter.date = req.query.date;
  if (req.query.from || req.query.to) filter.date = { ...(req.query.from ? { $gte: req.query.from } : {}), ...(req.query.to ? { $lte: req.query.to } : {}) };
  const absences = await Absence.find(filter).populate("teacherId", "name qualificationCategory").sort({ date: 1 }).lean();
  return res.json({ absences });
});

operationsRoutes.post("/absences", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(absenceSchema), async (req: Request, res: Response) => {
  const input = absenceSchema.parse(req.body);
  const teacher = await Teacher.findOne({ _id: input.teacherId, schoolId: req.user?.schoolId }).lean();
  if (!teacher) return res.status(404).json({ message: "Teacher not found in this school." });
  const school = await School.findById(req.user?.schoolId).select("settings.workingDays periodsPerDay").lean();
  const dates: string[] = [];
  for (const date = new Date(`${input.date}T12:00:00Z`); date <= new Date(`${input.endDate ?? input.date}T12:00:00Z`); date.setUTCDate(date.getUTCDate() + 1)) dates.push(date.toISOString().slice(0, 10));
  const saved = [];
  for (const date of dates) {
    const dayIndex = new Date(`${date}T12:00:00Z`).getUTCDay();
    const calendar = await CalendarDay.findOne({ schoolId: req.user?.schoolId, date: { $lte: date }, $or: [{ endDate: null }, { endDate: { $gte: date } }] }).lean();
    if ((calendar && calendar.type !== "WORKING") || !school?.settings?.workingDays.includes(dayIndex)) return res.status(400).json({ message: `Absences cannot be marked on ${date}; it is not a working day.` });
    const periods = input.isFullDay ? [] : input.affectedPeriods;
    const absence = await Absence.findOneAndUpdate(
      { schoolId: req.user?.schoolId, teacherId: teacher._id, date },
      { $set: { schoolId: req.user?.schoolId, teacherId: teacher._id, date, isFullDay: input.isFullDay, affectedPeriods: periods, reason: input.reason } },
      { upsert: true, returnDocument: "after", setDefaultsOnInsert: true },
    );
    saved.push(absence);
    const version = await TimetableVersion.findOne({ schoolId: req.user?.schoolId, status: "PUBLISHED" }).lean();
    if (version) {
      const dayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][dayIndex] as "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";
      const master = await TimetableSlot.find({ schoolId: req.user?.schoolId, versionId: version._id, dayOfWeek: dayName, teacherId: teacher._id }).lean();
      const effectivePeriods = input.isFullDay ? master.map((slot) => slot.periodNumber) : periods;
      const relevant = await Promise.all(master.filter((slot) => effectivePeriods.includes(slot.periodNumber)).map((slot) => Subject.findOne({ _id: slot.subjectId, schoolId: req.user?.schoolId }).select("name").lean()));
      void relevant;
      await runSubstitutionDraft(req.user!.schoolId, date);
    }
  }
  return res.status(201).json({ absences: saved });
});

operationsRoutes.delete("/absences/:id", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), async (req: Request, res: Response) => {
  const deleted = await Absence.findOneAndDelete({ _id: req.params.id, schoolId: req.user?.schoolId });
  if (!deleted) return res.status(404).json({ message: "Absence not found." });
  return res.json({ success: true });
});

operationsRoutes.post("/substitutions/run", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(z.object({ date: dateSchema, reset: z.boolean().default(false) })), async (req: Request, res: Response) => {
  const input = z.object({ date: dateSchema, reset: z.boolean().default(false) }).parse(req.body);
  try {
    const substitutions = await runSubstitutionDraft(req.user!.schoolId, input.date, input.reset);
    return res.json({ substitutions });
  } catch (error) {
    return res.status(400).json({ message: error instanceof Error ? error.message : "Could not run substitutions." });
  }
});

operationsRoutes.post("/substitutions/publish", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(z.object({ date: dateSchema })), async (req: Request, res: Response) => {
  const { date } = z.object({ date: dateSchema }).parse(req.body);
  const result = await DailySubstitution.updateMany({ schoolId: req.user?.schoolId, date, status: "DRAFT" }, { $set: { status: "PUBLISHED" } });
  return res.json({ published: result.modifiedCount });
});

operationsRoutes.patch("/substitutions/:id/seen", requireRole("TEACHER"), async (req: Request, res: Response) => {
  const teacher = await Teacher.findOne({ schoolId: req.user?.schoolId, userId: req.user?.userId }).select("_id").lean();
  if (!teacher) return res.status(404).json({ message: "Teacher profile not found." });
  const updated = await DailySubstitution.findOneAndUpdate({ _id: req.params.id, schoolId: req.user?.schoolId, substituteTeacherId: teacher._id, status: "PUBLISHED" }, { $set: { acknowledgedAt: new Date() } }, { returnDocument: "after" }).lean();
  if (!updated) return res.status(404).json({ message: "Published duty not found." });
  return res.json({ substitution: updated });
});

operationsRoutes.patch("/substitutions/:id", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(z.object({ substituteTeacherId: z.string().regex(/^[a-f\d]{24}$/i).nullable() })), async (req: Request, res: Response) => {
  const { substituteTeacherId } = z.object({ substituteTeacherId: z.string().regex(/^[a-f\d]{24}$/i).nullable() }).parse(req.body);
  const substitution = await DailySubstitution.findOne({ _id: req.params.id, schoolId: req.user?.schoolId }).lean();
  if (!substitution) return res.status(404).json({ message: "Substitution not found." });
  let substitute = null;
  if (substituteTeacherId) {
    const [teacher, schoolClass, subject, busy, absence] = await Promise.all([
      Teacher.findOne({ _id: substituteTeacherId, schoolId: req.user?.schoolId }).lean(),
      ClassSection.findOne({ _id: substitution.classSectionId, schoolId: req.user?.schoolId }).lean(),
      Subject.findOne({ _id: substitution.subjectId, schoolId: req.user?.schoolId }).lean(),
      TimetableSlot.findOne({ schoolId: req.user?.schoolId, teacherId: substituteTeacherId, periodNumber: substitution.periodNumber }).lean(),
      Absence.findOne({ schoolId: req.user?.schoolId, teacherId: substituteTeacherId, date: substitution.date }).lean(),
    ]);
    if (!teacher || !schoolClass || !subject || !canTeachGrade(teacher.qualificationCategory, schoolClass.grade)) return res.status(400).json({ message: "This teacher is not qualified for the class." });
    if (busy || absence) return res.status(409).json({ message: "This teacher is not free for that period." });
    substitute = teacher;
  }
  substitution.substituteTeacherId = substitute?._id ?? null;
  substitution.isManualOverride = true;
  substitution.reason = substitute ? "Manually overridden by school administrator" : "No free qualified teacher available. Class assigned to Self-Study";
  const updated = await DailySubstitution.findOneAndUpdate({ _id: substitution._id, schoolId: req.user?.schoolId }, { $set: { substituteTeacherId: substitution.substituteTeacherId, isManualOverride: true, reason: substitution.reason, status: "DRAFT" } }, { returnDocument: "after" }).lean();
  return res.json({ substitution: updated });
});

operationsRoutes.get("/substitutions", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN", "TEACHER"), validateQuery(z.object({ date: dateSchema })), async (req: Request, res: Response) => {
  const filter: Record<string, unknown> = { schoolId: req.user?.schoolId, date: req.query.date };
  if (req.user?.role === "TEACHER") {
    const teacher = await Teacher.findOne({ schoolId: req.user.schoolId, userId: req.user.userId }).select("_id").lean();
    if (!teacher) return res.status(404).json({ message: "Teacher profile not found." });
    filter.status = "PUBLISHED";
    filter.$or = [{ substituteTeacherId: teacher._id }, { absentTeacherId: teacher._id }];
  }
  const substitutions = await DailySubstitution.find(filter).sort({ periodNumber: 1 }).lean();
  return res.json({ substitutions });
});

operationsRoutes.get("/substitutions/noticeboard", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateQuery(z.object({ date: dateSchema })), async (req: Request, res: Response) => {
  const schoolId = req.user?.schoolId;
  const date = String(req.query.date);
  const rows = await DailySubstitution.find({ schoolId, date }).sort({ periodNumber: 1 }).lean();
  const ids = (field: "absentTeacherId" | "substituteTeacherId") => rows.flatMap((row) => (row[field] ? [row[field]!] : []));
  const [teachers, classes, subjects] = await Promise.all([
    Teacher.find({ schoolId, _id: { $in: [...ids("absentTeacherId"), ...ids("substituteTeacherId")] } }).select("name").lean(),
    ClassSection.find({ schoolId, _id: { $in: rows.map((row) => row.classSectionId) } }).lean(),
    Subject.find({ schoolId, _id: { $in: rows.map((row) => row.subjectId) } }).select("name").lean(),
  ]);
  const teacherName = new Map(teachers.map((item) => [String(item._id), item.name]));
  const className = new Map(classes.map((item) => [String(item._id), `${item.grade}-${item.section}`]));
  const subjectName = new Map(subjects.map((item) => [String(item._id), item.name]));
  const times = new Map<number, string>(PERIOD_SLOTS.map((slot) => [slot.number, `${slot.start}-${slot.end}`]));
  const notices = rows.map((row) => ({
    period: row.periodNumber,
    time: times.get(row.periodNumber) ?? "",
    class: className.get(String(row.classSectionId)) ?? "",
    subject: subjectName.get(String(row.subjectId)) ?? "",
    absentTeacher: teacherName.get(String(row.absentTeacherId)) ?? "",
    substitute: row.substituteTeacherId ? teacherName.get(String(row.substituteTeacherId)) ?? "" : "UNASSIGNED",
    note: row.substituteTeacherId ? "" : row.reason,
    status: row.status,
  }));
  return res.json({ date, notices, unassigned: notices.filter((notice) => notice.substitute === "UNASSIGNED").length });
});
