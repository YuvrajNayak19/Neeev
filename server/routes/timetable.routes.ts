import mongoose from "mongoose";
import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";

import { ClassSection, MasterTimetable, Subject, Teacher, TeacherAssignment, TimetableSlot, TimetableVersion } from "../models";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody, validateQuery } from "../utils/validation";
import { PERIOD_SLOTS } from "../config/schedule";
import { getEffectiveTimetable } from "../services/effectiveTimetable";
import { solve, validateTimetable, type CoreAssignment, type CoreClass, type CoreInput, type CoreSlot, type CoreSubject, type CoreTeacher } from "../services/timetableEngine";

export const timetableRoutes = Router();

const publicQuerySchema = z.object({
  schoolId: z.string().regex(/^[a-f\d]{24}$/i),
  grade: z.coerce.number().int().min(6).max(12),
  section: z.string().regex(/^[A-Za-z0-9]{1,5}$/),
});

// Read-only student-portal view of the published timetable for one class; registered before the auth wall.
timetableRoutes.get("/public", validateQuery(publicQuerySchema), async (req: Request, res: Response) => {
  const { schoolId, grade, section } = publicQuerySchema.parse(req.query);
  const schoolClass = await ClassSection.findOne({ schoolId, grade, section: new RegExp(`^${section}$`, "i") }).lean();
  if (!schoolClass) return res.status(404).json({ message: "Class not found." });
  const version = await TimetableVersion.findOne({ schoolId, status: "PUBLISHED" }).sort({ versionNumber: -1 }).lean();
  if (!version) return res.json({ class: { grade, section: schoolClass.section }, periods: PERIOD_SLOTS, entries: [] });
  const slots = await TimetableSlot.find({ schoolId, versionId: version._id, classSectionId: schoolClass._id }).lean();
  const [subjects, teachers] = await Promise.all([
    Subject.find({ schoolId, _id: { $in: slots.map((slot) => slot.subjectId) } }).select("name").lean(),
    Teacher.find({ schoolId, _id: { $in: slots.map((slot) => slot.teacherId) } }).select("name").lean(),
  ]);
  const subjectName = new Map(subjects.map((item) => [String(item._id), item.name]));
  const teacherName = new Map(teachers.map((item) => [String(item._id), item.name]));
  const entries = slots.map((slot) => ({ day: slot.dayOfWeek, periodNumber: slot.periodNumber, subject: subjectName.get(String(slot.subjectId)), teacher: teacherName.get(String(slot.teacherId)) }));
  return res.json({ class: { grade, section: schoolClass.section }, periods: PERIOD_SLOTS, lunch: { start: "11:00", end: "11:20" }, entries });
});

// Everything below this line requires authentication.
timetableRoutes.use(requireAuth);

timetableRoutes.post(
  "/generate",
  requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"),
  async (req: Request, res: Response) => {
    const schoolId = req.user?.schoolId;
    if (!schoolId) {
      return res.status(400).json({ message: "School context is required to generate a timetable." });
    }

    const [classSections, teacherRecords, subjectRecords, teacherAssignments, existingSlots] = await Promise.all([
      ClassSection.find({ schoolId }).lean(),
      Teacher.find({ schoolId }).lean(),
      Subject.find({ schoolId }).lean(),
      TeacherAssignment.find({ schoolId }).lean(),
      MasterTimetable.find({ schoolId }).lean(),
    ]);

    if (!classSections.length) {
      return res.status(404).json({ message: "No classes found for this school." });
    }

    if (!subjectRecords.length) {
      return res.status(400).json({ message: "Create subjects and teacher assignments before generating a timetable." });
    }

    const dayNames = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const coreClasses: CoreClass[] = classSections.map((schoolClass) => ({
      id: String(schoolClass._id), grade: Number(schoolClass.grade), label: `${schoolClass.grade}-${schoolClass.section}`,
      stream: schoolClass.stream ? String(schoolClass.stream) : undefined,
    }));
    const classById = new Map(coreClasses.map((schoolClass) => [schoolClass.id, schoolClass]));
    const subjectById = new Map(subjectRecords.map((subject) => [String(subject._id), subject]));
    const teacherById = new Map<string, CoreTeacher>(teacherRecords.map((teacher) => [String(teacher._id), {
      id: String(teacher._id), name: String(teacher.name), cat: teacher.qualificationCategory,
      subjectIds: [], maxPerDay: Number(teacher.maxPeriodsPerDay), maxPerWeek: Number(teacher.maxPeriodsPerWeek),
    }]));
    const assignmentByPair = new Map<string, { teacherId: string; weekly: number; forced: boolean }>();
    for (const record of teacherAssignments) {
      const classId = String(record.classSectionId);
      const subjectId = String(record.subjectId);
      const teacherId = String(record.teacherId);
      if (!classById.has(classId) || !subjectById.has(subjectId) || !teacherById.has(teacherId)) continue;
      assignmentByPair.set(`${classId}|${subjectId}`, {
        teacherId,
        weekly: record.weeklyPeriodsNeeded == null ? Number(subjectById.get(subjectId)?.weeklyPeriods ?? 4) : Number(record.weeklyPeriodsNeeded),
        forced: !!record.isForced,
      });
    }

    const coreSubjects: CoreSubject[] = [];
    const subjectIdByCoreId = new Map<string, string>();
    const coreSubjectId = (classId: string, subjectId: string): string => `${classId}|${subjectId}`;
    for (const schoolClass of coreClasses) {
      for (const [actualId, record] of subjectById) {
        const grades = (record.grades ?? []).map(Number);
        const streams = (record.streams ?? []).map(String);
        if ((grades.length && !grades.includes(schoolClass.grade)) || (streams.length && (!schoolClass.stream || !streams.includes(schoolClass.stream)))) continue;
        const coreId = coreSubjectId(schoolClass.id, actualId);
        const assignment = assignmentByPair.get(`${schoolClass.id}|${actualId}`);
        coreSubjects.push({
          id: coreId, name: String(record.name), cat: record.categoryRequired, weekly: assignment?.weekly ?? Number(record.weeklyPeriods ?? 4),
          minPerDay: Number(record.minPerDay ?? (String(record.name).trim().toLowerCase() === "science" ? 1 : 0)),
          maxPerDay: Number(record.maxPerDay ?? (String(record.name).trim().toLowerCase() === "computer" ? 1 : 2)),
          maxDaysPerWeek: Number(record.maxDaysPerWeek ?? (String(record.name).trim().toLowerCase() === "computer" ? 2 : 6)),
          priority: Number(record.priority), doublePeriod: !!record.isLabDoublePeriod, grades, streams, classIds: [schoolClass.id],
        });
        subjectIdByCoreId.set(coreId, actualId);
        if (assignment) teacherById.get(assignment.teacherId)?.subjectIds.push(coreId);
      }
    }

    const coreAssignments: CoreAssignment[] = [];
    for (const [pair, assignment] of assignmentByPair) {
      const [classId, actualSubjectId] = pair.split("|");
      coreAssignments.push({ classId, subjectId: coreSubjectId(classId, actualSubjectId), teacherId: assignment.teacherId, isForced: assignment.forced });
    }
    const coreIdByPair = new Map(coreSubjects.map((subject) => [subject.id, subject.id]));
    const locked: CoreSlot[] = existingSlots.filter((slot) => slot.isLocked).flatMap((slot) => {
      const classId = String(slot.classSectionId), actualSubjectId = String(slot.subjectId);
      const subjectId = coreIdByPair.get(coreSubjectId(classId, actualSubjectId));
      const day = dayNames.indexOf(String(slot.dayOfWeek));
      if (!subjectId || day < 0) return [];
      return [{ classId, subjectId, teacherId: String(slot.teacherId), day, period: Number(slot.periodNumber), isLocked: true }];
    });
    const engineInput: CoreInput = { classes: coreClasses, subjects: coreSubjects, teachers: [...teacherById.values()], assignments: coreAssignments, locked };
    const solved = solve(engineInput);
    const validationErrors = solved.ok ? validateTimetable(engineInput, solved.slots) : [];
    if (!solved.ok || validationErrors.length) {
      return res.status(409).json({
        message: "The timetable could not be generated under the current school constraints.",
        errors: [...solved.errors, ...validationErrors], attempts: solved.attempts, steps: solved.steps,
      });
    }

    const schoolObjectId = new mongoose.Types.ObjectId(String(schoolId));
    const priorVersions = await TimetableVersion.find({ schoolId: schoolObjectId }).select("versionNumber").lean();
    const version = await TimetableVersion.create({
      schoolId: schoolObjectId,
      versionNumber: priorVersions.reduce((maximum, item) => Math.max(maximum, item.versionNumber), 0) + 1,
      status: "DRAFT",
      source: "GENERATED",
      createdBy: new mongoose.Types.ObjectId(req.user!.userId),
    });
    const documents = solved.slots.map((slot) => ({
      schoolId: schoolObjectId,
      versionId: version._id,
      classSectionId: new mongoose.Types.ObjectId(slot.classId),
      dayOfWeek: dayNames[slot.day],
      periodNumber: slot.period,
      subjectId: new mongoose.Types.ObjectId(subjectIdByCoreId.get(slot.subjectId)!),
      teacherId: new mongoose.Types.ObjectId(slot.teacherId),
      isLocked: !!slot.isLocked,
      isForced: !!slot.isForced,
    }));
    if (documents.length) await TimetableSlot.insertMany(documents);

    const classLabels = new Map(coreClasses.map((schoolClass) => [schoolClass.id, schoolClass.label]));
    const responseEntries = solved.slots.map((slot) => {
      const record = subjectById.get(subjectIdByCoreId.get(slot.subjectId)!);
      const teacher = teacherById.get(slot.teacherId)!;
      return {
        classSectionId: slot.classId, className: classLabels.get(slot.classId), day: dayNames[slot.day], periodNumber: slot.period,
        subject: record?.name, teacherId: slot.teacherId, teacherName: teacher.name, qualification: teacher.cat,
        isLocked: !!slot.isLocked, isForced: !!slot.isForced,
      };
    });
    return res.json({
      timetable: { schoolId: String(schoolId), versionId: String(version._id), status: version.status, generatedAt: new Date().toISOString(), entries: responseEntries,
        validation: { passed: true, checks: ["Qualification and fixed-assignment rules validated", "Class and teacher clashes checked", "Teacher and subject loads checked", "Independent validation passed"], issues: [] } },
      generatedAt: new Date().toISOString(), attempts: solved.attempts, steps: solved.steps, durationMs: solved.ms,
    });
  },
);

const publishSchema = z.object({ versionId: z.string().regex(/^[a-f\d]{24}$/i) });
timetableRoutes.post("/publish", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(publishSchema), async (req: Request, res: Response) => {
  const { versionId } = publishSchema.parse(req.body);
  const version = await TimetableVersion.findOne({ _id: versionId, schoolId: req.user?.schoolId, status: "DRAFT" });
  if (!version) return res.status(404).json({ message: "Draft timetable version not found." });
  await TimetableVersion.updateMany({ schoolId: version.schoolId, status: "PUBLISHED" }, { $set: { status: "ARCHIVED" } });
  version.status = "PUBLISHED";
  version.publishedAt = new Date();
  await version.save();
  return res.json({ version });
});

const restoreSchema = z.object({ versionId: z.string().regex(/^[a-f\d]{24}$/i) });
timetableRoutes.post("/restore", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(restoreSchema), async (req: Request, res: Response) => {
  const { versionId } = restoreSchema.parse(req.body);
  const version = await TimetableVersion.findOne({ _id: versionId, schoolId: req.user?.schoolId, status: "ARCHIVED" });
  if (!version) return res.status(404).json({ message: "Archived timetable version not found." });
  await TimetableVersion.updateMany({ schoolId: version.schoolId, status: "PUBLISHED" }, { $set: { status: "ARCHIVED" } });
  version.status = "PUBLISHED";
  version.publishedAt = new Date();
  await version.save();
  return res.json({ version });
});

timetableRoutes.get("/versions", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), async (req: Request, res: Response) => {
  const versions = await TimetableVersion.find({ schoolId: req.user?.schoolId }).sort({ versionNumber: -1 }).lean();
  return res.json({ versions });
});

timetableRoutes.get("/class/:classSectionId", async (req: Request, res: Response) => {
  if (req.query.date) {
    const date = z.string().date().safeParse(req.query.date);
    if (!date.success) return res.status(400).json({ message: "A valid date is required." });
    const result = await getEffectiveTimetable(req.user!.schoolId, date.data, { classId: String(req.params.classSectionId) });
    return res.json(result);
  }
  const version = await TimetableVersion.findOne({ schoolId: req.user?.schoolId, status: "PUBLISHED" }).sort({ versionNumber: -1 }).lean();
  const entries = version ? await TimetableSlot.find({ schoolId: req.user?.schoolId, versionId: version._id, classSectionId: req.params.classSectionId }).lean() : [];
  return res.json({ entries });
});

timetableRoutes.get("/teacher/:teacherId", async (req: Request, res: Response) => {
  const version = await TimetableVersion.findOne({ schoolId: req.user?.schoolId, status: "PUBLISHED" }).sort({ versionNumber: -1 }).lean();
  const entries = version ? await TimetableSlot.find({ schoolId: req.user?.schoolId, versionId: version._id, teacherId: req.params.teacherId }).lean() : [];
  return res.json({ entries });
});

timetableRoutes.get("/effective", async (req: Request, res: Response) => {
  const parsed = z.object({ date: z.string().date(), classId: z.string().regex(/^[a-f\d]{24}$/i).optional(), teacherId: z.string().regex(/^[a-f\d]{24}$/i).optional() }).refine((value) => Boolean(value.classId) !== Boolean(value.teacherId)).safeParse(req.query);
  if (!parsed.success) return res.status(400).json({ message: "Provide a date and exactly one classId or teacherId." });
  const target = parsed.data.classId ? { classId: parsed.data.classId } : { teacherId: parsed.data.teacherId! };
  const result = await getEffectiveTimetable(req.user!.schoolId, parsed.data.date, target);
  return res.json(result);
});
