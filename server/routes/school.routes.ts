import type { Request, Response } from "express";
import { Router } from "express";
import mongoose from "mongoose";
import { z } from "zod";

import { PERIOD_SLOTS } from "../config/schedule";
import { requireAuth, requireRole } from "../middleware/auth";
import { Absence, ClassSection, DailySubstitution, Notice, Notification, Student, Subject, Teacher, TeacherAssignment, TimetableSlot, TimetableVersion } from "../models";
import { canTeachGrade } from "../services/timetableSolverService";
import { validateBody } from "../utils/validation";

/**
 * Read models for the ClassSync app screens: coverage board, substitute suggestions,
 * weekly timetables, notices and notifications. All queries are scoped to the caller's school.
 */
export const schoolRoutes = Router();
schoolRoutes.use(requireAuth);

const ADMIN = ["SCHOOL_ADMIN", "SUPER_ADMIN"];
const objectId = z.string().regex(/^[a-f\d]{24}$/i);
const dateSchema = z.string().date();
const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"] as const;
type WeekDay = "Monday" | "Tuesday" | "Wednesday" | "Thursday" | "Friday" | "Saturday";

const dayOf = (date: string) => DAY_NAMES[new Date(`${date}T12:00:00`).getDay()] as WeekDay | "Sunday";
const periodTime = new Map<number, string>(PERIOD_SLOTS.map((slot) => [slot.number, `${slot.start}–${slot.end}`]));
const label = (item?: { grade?: number; section?: string } | null) => (item?.grade ? `${item.grade}-${item.section}` : "");

async function publishedVersion(schoolId: string) {
  return TimetableVersion.findOne({ schoolId, status: "PUBLISHED" }).sort({ versionNumber: -1 }).lean();
}

/** Everything needed to reason about one school day. */
async function dayContext(schoolId: string, date: string) {
  const day = dayOf(date);
  const version = await publishedVersion(schoolId);
  const [slots, absences, rows, teachers, classes, subjects, assignments] = await Promise.all([
    version && day !== "Sunday" ? TimetableSlot.find({ schoolId, versionId: version._id, dayOfWeek: day }).lean() : Promise.resolve([]),
    Absence.find({ schoolId, date }).lean(),
    DailySubstitution.find({ schoolId, date }).sort({ periodNumber: 1 }).lean(),
    Teacher.find({ schoolId }).lean(),
    ClassSection.find({ schoolId }).lean(),
    Subject.find({ schoolId }).lean(),
    TeacherAssignment.find({ schoolId }).lean(),
  ]);
  const teacherById = new Map(teachers.map((item) => [String(item._id), item]));
  const classById = new Map(classes.map((item) => [String(item._id), item]));
  const subjectById = new Map(subjects.map((item) => [String(item._id), item]));
  return { day, slots, absences, rows, teachers, teacherById, classById, subjectById, assignments };
}

type Context = Awaited<ReturnType<typeof dayContext>>;

function absentPeriods(context: Context, teacherId: string): Set<number> | "all" | null {
  const absence = context.absences.find((item) => String(item.teacherId) === teacherId);
  if (!absence) return null;
  return absence.isFullDay ? "all" : new Set(absence.affectedPeriods);
}

function loadToday(context: Context, teacherId: string) {
  return context.slots.filter((slot) => String(slot.teacherId) === teacherId).length + context.rows.filter((row) => String(row.substituteTeacherId) === teacherId).length;
}

function rowStatus(row: Context["rows"][number]) {
  if (!row.substituteTeacherId) return "uncovered" as const;
  return row.status === "PUBLISHED" ? ("covered" as const) : ("suggested" as const);
}

function presentRow(context: Context, row: Context["rows"][number]) {
  const schoolClass = context.classById.get(String(row.classSectionId));
  const absent = context.teacherById.get(String(row.absentTeacherId));
  const substitute = row.substituteTeacherId ? context.teacherById.get(String(row.substituteTeacherId)) : null;
  return {
    id: String(row._id),
    period: row.periodNumber,
    time: periodTime.get(row.periodNumber) ?? "",
    classId: String(row.classSectionId),
    className: label(schoolClass),
    subject: context.subjectById.get(String(row.subjectId))?.name ?? "",
    absentTeacher: { id: String(row.absentTeacherId), name: absent?.name ?? "" },
    substitute: substitute ? { id: String(substitute._id), name: substitute.name } : null,
    status: rowStatus(row),
    acknowledged: Boolean(row.acknowledgedAt),
    selfStudy: !row.substituteTeacherId && /self-study/i.test(row.reason),
  };
}

/** Free, eligible teachers for one uncovered period, best first, each with plain-language reasons. */
function rankCandidates(context: Context, row: Context["rows"][number]) {
  const schoolClass = context.classById.get(String(row.classSectionId));
  const subject = context.subjectById.get(String(row.subjectId));
  const classTeacherIds = new Set(context.assignments.filter((item) => String(item.classSectionId) === String(row.classSectionId)).map((item) => String(item.teacherId)));
  const period = row.periodNumber;
  return context.teachers
    .filter((teacher) => {
      const id = String(teacher._id);
      if (id === String(row.absentTeacherId) || id === String(row.substituteTeacherId)) return false;
      const away = absentPeriods(context, id);
      if (away === "all" || away?.has(period)) return false;
      if (context.slots.some((slot) => String(slot.teacherId) === id && slot.periodNumber === period)) return false;
      if (context.rows.some((other) => String(other._id) !== String(row._id) && String(other.substituteTeacherId) === id && other.periodNumber === period)) return false;
      if (schoolClass && !canTeachGrade(teacher.qualificationCategory, schoolClass.grade)) return false;
      return loadToday(context, id) < (teacher.maxPeriodsPerDay ?? 6);
    })
    .map((teacher) => {
      const id = String(teacher._id);
      const sameSubject = teacher.primarySubjects.some((item) => String(item) === String(row.subjectId));
      const knowsClass = classTeacherIds.has(id);
      const load = loadToday(context, id);
      const reasons = [`Free in period ${period}`];
      if (sameSubject) reasons.push(`Teaches ${subject?.name ?? "this subject"}`);
      if (knowsClass) reasons.push(`Already teaches ${label(schoolClass)}`);
      reasons.push(load <= 3 ? `Light day: ${load} periods` : `${load} periods today`);
      return { id, name: teacher.name, category: teacher.qualificationCategory, sameSubject, knowsClass, load, reasons, score: (sameSubject ? 50 : 0) + (knowsClass ? 25 : 0) + (6 - load) * 5 };
    })
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
}

async function notifyTeacher(schoolId: string, teacherId: string, message: string) {
  const teacher = await Teacher.findOne({ _id: teacherId, schoolId }).select("userId").lean();
  if (teacher?.userId) await Notification.create({ schoolId, userId: teacher.userId, type: "SUBSTITUTION", title: "New cover duty", message, link: "/teacher/dashboard" });
}

/* ------------------------------------------------------------------ coverage (admin) */

schoolRoutes.get("/coverage", requireRole(...ADMIN), async (req: Request, res: Response) => {
  const date = dateSchema.safeParse(req.query.date);
  if (!date.success) return res.status(400).json({ message: "Choose a valid date." });
  const context = await dayContext(req.user!.schoolId, date.data);
  const rows = context.rows.map((row) => presentRow(context, row));
  const absences = context.absences.map((absence) => {
    const teacher = context.teacherById.get(String(absence.teacherId));
    const affected = rows.filter((row) => row.absentTeacher.id === String(absence.teacherId));
    return {
      id: String(absence._id), teacherId: String(absence.teacherId), name: teacher?.name ?? "", category: teacher?.qualificationCategory ?? "",
      isFullDay: absence.isFullDay, periods: absence.affectedPeriods, reason: absence.reason,
      periodsToCover: affected.length, periodsCovered: affected.filter((row) => row.status === "covered").length,
    };
  });
  return res.json({
    date: date.data,
    day: context.day,
    rows,
    absences,
    totals: { periods: rows.length, covered: rows.filter((row) => row.status === "covered").length, suggested: rows.filter((row) => row.status === "suggested").length, uncovered: rows.filter((row) => row.status === "uncovered").length },
  });
});

schoolRoutes.get("/coverage/:id/candidates", requireRole(...ADMIN), async (req: Request, res: Response) => {
  const row = await DailySubstitution.findOne({ _id: req.params.id, schoolId: req.user?.schoolId }).lean();
  if (!row) return res.status(404).json({ message: "That period was not found." });
  const context = await dayContext(req.user!.schoolId, row.date);
  const current = context.rows.find((item) => String(item._id) === String(row._id)) ?? row;
  const candidates = rankCandidates(context, current).slice(0, 6);
  return res.json({ row: presentRow(context, current), candidates });
});

const assignSchema = z.object({ teacherId: objectId.nullable() });
schoolRoutes.post("/coverage/:id/assign", requireRole(...ADMIN), validateBody(assignSchema), async (req: Request, res: Response) => {
  const { teacherId } = assignSchema.parse(req.body);
  const row = await DailySubstitution.findOne({ _id: req.params.id, schoolId: req.user?.schoolId }).lean();
  if (!row) return res.status(404).json({ message: "That period was not found." });
  const context = await dayContext(req.user!.schoolId, row.date);
  if (teacherId) {
    const candidate = rankCandidates(context, row).find((item) => item.id === teacherId);
    if (!candidate) return res.status(409).json({ message: "That teacher isn't free or eligible for this period any more. Please pick another." });
  }
  const updated = await DailySubstitution.findOneAndUpdate(
    { _id: row._id, schoolId: req.user?.schoolId },
    { $set: { substituteTeacherId: teacherId ? new mongoose.Types.ObjectId(teacherId) : null, status: teacherId ? "PUBLISHED" : "DRAFT", isManualOverride: true, acknowledgedAt: null, reason: teacherId ? "Assigned by the school office" : "Class assigned to supervised self-study" } },
    { returnDocument: "after" },
  ).lean();
  if (teacherId && updated) {
    const className = label(context.classById.get(String(row.classSectionId)));
    const subject = context.subjectById.get(String(row.subjectId))?.name ?? "";
    await notifyTeacher(req.user!.schoolId, teacherId, `Please cover ${className} ${subject} in period ${row.periodNumber} (${periodTime.get(row.periodNumber)}).`);
  }
  const fresh = await dayContext(req.user!.schoolId, row.date);
  return res.json({ row: presentRow(fresh, fresh.rows.find((item) => String(item._id) === String(row._id))!) });
});

schoolRoutes.post("/coverage/:id/confirm", requireRole(...ADMIN), async (req: Request, res: Response) => {
  const row = await DailySubstitution.findOneAndUpdate({ _id: req.params.id, schoolId: req.user?.schoolId, substituteTeacherId: { $ne: null } }, { $set: { status: "PUBLISHED" } }, { returnDocument: "after" }).lean();
  if (!row) return res.status(404).json({ message: "There is no suggested substitute to confirm for this period." });
  const context = await dayContext(req.user!.schoolId, row.date);
  await notifyTeacher(req.user!.schoolId, String(row.substituteTeacherId), `Please cover ${label(context.classById.get(String(row.classSectionId)))} in period ${row.periodNumber} (${periodTime.get(row.periodNumber)}).`);
  return res.json({ row: presentRow(context, context.rows.find((item) => String(item._id) === String(row._id))!) });
});

/* ----------------------------------------------------------- teacher: today & duties */

schoolRoutes.get("/my-day", requireRole("TEACHER"), async (req: Request, res: Response) => {
  const date = dateSchema.safeParse(req.query.date);
  if (!date.success) return res.status(400).json({ message: "Choose a valid date." });
  const teacher = await Teacher.findOne({ schoolId: req.user?.schoolId, userId: req.user?.userId }).lean();
  if (!teacher) return res.status(404).json({ message: "Your teacher profile isn't set up yet. Please ask the school office." });
  const context = await dayContext(req.user!.schoolId, date.data);
  const id = String(teacher._id);
  const away = absentPeriods(context, id);
  const classes = context.slots.filter((slot) => String(slot.teacherId) === id).map((slot) => ({
    period: slot.periodNumber, time: periodTime.get(slot.periodNumber) ?? "", className: label(context.classById.get(String(slot.classSectionId))),
    subject: context.subjectById.get(String(slot.subjectId))?.name ?? "", room: slot.room, kind: "class" as const,
    onLeave: away === "all" || Boolean(away?.has(slot.periodNumber)),
  }));
  const duties = context.rows.filter((row) => String(row.substituteTeacherId) === id && row.status === "PUBLISHED").map((row) => ({
    id: String(row._id), period: row.periodNumber, time: periodTime.get(row.periodNumber) ?? "", className: label(context.classById.get(String(row.classSectionId))),
    subject: context.subjectById.get(String(row.subjectId))?.name ?? "", coveringFor: context.teacherById.get(String(row.absentTeacherId))?.name ?? "", acknowledged: Boolean(row.acknowledgedAt), kind: "duty" as const,
  }));
  return res.json({ date: date.data, day: context.day, teacher: { id, name: teacher.name }, onLeave: away !== null, classes, duties });
});

/* ------------------------------------------------------------------ weekly timetable */

schoolRoutes.get("/week", async (req: Request, res: Response) => {
  const query = z.object({ classId: objectId.optional(), teacherId: objectId.optional(), date: dateSchema.optional() }).safeParse(req.query);
  if (!query.success || Boolean(query.data.classId) === Boolean(query.data.teacherId)) return res.status(400).json({ message: "Choose one class or one teacher." });
  const schoolId = req.user!.schoolId;
  let { classId } = query.data;
  const { teacherId } = query.data;

  // Students may only see their own class; teachers may see any class or teacher in their school.
  if (req.user?.role === "STUDENT") {
    const student = await Student.findOne({ schoolId, userId: req.user.userId }).lean();
    if (!student || (classId && classId !== String(student.classSectionId)) || teacherId) return res.status(403).json({ message: "Students can only view their own class." });
    classId = String(student.classSectionId);
  }

  const version = await publishedVersion(schoolId);
  if (!version) return res.json({ entries: [], clashes: 0, checked: 0, published: false });
  const [all, teachers, classes, subjects] = await Promise.all([
    TimetableSlot.find({ schoolId, versionId: version._id }).lean(),
    Teacher.find({ schoolId }).select("name").lean(),
    ClassSection.find({ schoolId }).lean(),
    Subject.find({ schoolId }).select("name").lean(),
  ]);
  const teacherName = new Map(teachers.map((item) => [String(item._id), item.name]));
  const classById = new Map(classes.map((item) => [String(item._id), item]));
  const subjectName = new Map(subjects.map((item) => [String(item._id), item.name]));

  // Clash check across the whole published week: one teacher in two classes at once.
  const byTeacherSlot = new Map<string, typeof all>();
  for (const slot of all) {
    const key = `${slot.teacherId}|${slot.dayOfWeek}|${slot.periodNumber}`;
    byTeacherSlot.set(key, [...(byTeacherSlot.get(key) ?? []), slot]);
  }
  const clashText = (slot: (typeof all)[number]) => {
    const group = byTeacherSlot.get(`${slot.teacherId}|${slot.dayOfWeek}|${slot.periodNumber}`) ?? [];
    if (group.length < 2) return undefined;
    return `${teacherName.get(String(slot.teacherId))} is also booked in ${group.filter((other) => String(other._id) !== String(slot._id)).map((other) => label(classById.get(String(other.classSectionId)))).join(", ")}`;
  };
  const clashes = [...byTeacherSlot.values()].filter((group) => group.length > 1).length;

  const selected = all.filter((slot) => (classId ? String(slot.classSectionId) === classId : String(slot.teacherId) === teacherId));

  // Optional overlay of today's confirmed substitutions.
  const substitutes = new Map<string, string>();
  if (query.data.date) {
    const rows = await DailySubstitution.find({ schoolId, date: query.data.date, status: "PUBLISHED", ...(classId ? { classSectionId: classId } : { absentTeacherId: teacherId }) }).lean();
    const day = dayOf(query.data.date);
    rows.forEach((row) => row.substituteTeacherId && substitutes.set(`${row.classSectionId}|${day}|${row.periodNumber}`, teacherName.get(String(row.substituteTeacherId)) ?? ""));
  }

  const entries = selected.map((slot) => ({
    day: slot.dayOfWeek,
    periodNumber: slot.periodNumber,
    subject: subjectName.get(String(slot.subjectId)) ?? "",
    teacher: teacherName.get(String(slot.teacherId)) ?? "",
    teacherId: String(slot.teacherId),
    className: label(classById.get(String(slot.classSectionId))),
    room: slot.room || classById.get(String(slot.classSectionId))?.roomNumber || "",
    clash: clashText(slot),
    substitute: substitutes.get(`${slot.classSectionId}|${slot.dayOfWeek}|${slot.periodNumber}`),
  }));
  return res.json({ entries, clashes, checked: all.length, published: true, publishedAt: version.publishedAt });
});

/* --------------------------------------------------------------------------- notices */

schoolRoutes.get("/notices", async (req: Request, res: Response) => {
  const audience: Array<"ALL" | "STAFF" | "STUDENTS"> = req.user?.role === "STUDENT" ? ["ALL", "STUDENTS"] : req.user?.role === "TEACHER" ? ["ALL", "STAFF"] : ["ALL", "STAFF", "STUDENTS"];
  const notices = await Notice.find({ schoolId: req.user?.schoolId, audience: { $in: audience } }).sort({ createdAt: -1 }).limit(20).lean();
  return res.json({ notices: notices.map((notice) => ({ id: String(notice._id), title: notice.title, body: notice.body, audience: notice.audience, createdAt: notice.createdAt })) });
});

const noticeSchema = z.object({ title: z.string().trim().min(3).max(140), body: z.string().trim().max(1000).default(""), audience: z.enum(["ALL", "STAFF", "STUDENTS"]).default("ALL") });
schoolRoutes.post("/notices", requireRole(...ADMIN), validateBody(noticeSchema), async (req: Request, res: Response) => {
  const input = noticeSchema.parse(req.body);
  const notice = await Notice.create({ ...input, schoolId: req.user?.schoolId, createdBy: req.user?.userId });
  return res.status(201).json({ notice: { id: String(notice._id), title: notice.title, body: notice.body, audience: notice.audience, createdAt: notice.createdAt } });
});

schoolRoutes.delete("/notices/:id", requireRole(...ADMIN), async (req: Request, res: Response) => {
  const deleted = await Notice.findOneAndDelete({ _id: req.params.id, schoolId: req.user?.schoolId });
  if (!deleted) return res.status(404).json({ message: "Notice not found." });
  return res.json({ success: true });
});

/* --------------------------------------------------------------------- notifications */

schoolRoutes.get("/notifications", async (req: Request, res: Response) => {
  const items = await Notification.find({ schoolId: req.user?.schoolId, userId: req.user?.userId }).sort({ createdAt: -1 }).limit(15).lean();
  return res.json({
    notifications: items.map((item) => ({ id: String(item._id), title: item.title, message: item.message, link: item.link, read: Boolean(item.readAt), createdAt: item.createdAt })),
    unread: items.filter((item) => !item.readAt).length,
  });
});

schoolRoutes.post("/notifications/read", async (req: Request, res: Response) => {
  await Notification.updateMany({ schoolId: req.user?.schoolId, userId: req.user?.userId, readAt: null }, { $set: { readAt: new Date() } });
  return res.json({ success: true });
});
