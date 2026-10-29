import type { Request, Response } from "express";
import { Router } from "express";
import { z } from "zod";

import { Absence, ClassSection, Subject, Teacher, TeacherAssignment } from "../models";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../utils/validation";

export const academicRoutes = Router();

academicRoutes.use(requireAuth);

academicRoutes.get("/dashboard/overview", async (req: Request, res: Response) => {
  const [classCount, teacherCount, subjectCount, absenceCount] = await Promise.all([
    ClassSection.countDocuments({ schoolId: req.user?.schoolId }),
    Teacher.countDocuments({ schoolId: req.user?.schoolId }),
    Subject.countDocuments({ schoolId: req.user?.schoolId }),
    Absence.countDocuments({ schoolId: req.user?.schoolId }),
  ]);

  return res.json({
    status: "ok",
    metrics: {
      classes: classCount,
      teachers: teacherCount,
      subjects: subjectCount,
      absences: absenceCount,
    },
    generatedAt: new Date().toISOString(),
  });
});

academicRoutes.get("/classes", async (req: Request, res: Response) => {
  const classes = await ClassSection.find({ schoolId: req.user?.schoolId }).lean();
  return res.json({ classes });
});

academicRoutes.post(
  "/classes",
  requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"),
  validateBody(z.object({
    grade: z.number().int().min(6).max(12),
    section: z.string().trim().min(1).max(12),
    stream: z.enum(["Science", "Commerce", "Humanities"]).nullable().optional(),
    roomNumber: z.string().trim().max(80).optional(),
  })),
  async (req: Request, res: Response) => {
    const created = await ClassSection.create({
      grade: req.body.grade,
      section: req.body.section,
      stream: req.body.grade >= 11 ? req.body.stream : null,
      roomNumber: req.body.roomNumber ?? "",
      schoolId: req.user?.schoolId,
    });

    return res.status(201).json({ classSection: created });
  },
);

academicRoutes.get("/teachers", async (req: Request, res: Response) => {
  const teachers = await Teacher.find({ schoolId: req.user?.schoolId }).lean();
  return res.json({ teachers });
});

academicRoutes.post(
  "/teachers",
  requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"),
  validateBody(z.object({
    name: z.string().trim().min(2).max(120),
    email: z.string().email().optional(),
    qualificationCategory: z.enum(["PRT", "TGT", "PGT"]),
    primarySubjects: z.array(z.string().regex(/^[a-f\d]{24}$/i)).default([]),
    maxPeriodsPerDay: z.number().int().min(1).max(10).default(6),
    maxPeriodsPerWeek: z.number().int().min(1).max(60).default(30),
  })),
  async (req: Request, res: Response) => {
    const subjectIds = req.body.primarySubjects as string[];
    const subjects = await Subject.countDocuments({ _id: { $in: subjectIds }, schoolId: req.user?.schoolId });
    if (subjects !== subjectIds.length) return res.status(400).json({ message: "Every subject must belong to this school." });
    const created = await Teacher.create({
      name: req.body.name,
      email: req.body.email,
      qualificationCategory: req.body.qualificationCategory,
      primarySubjects: subjectIds,
      maxPeriodsPerDay: req.body.maxPeriodsPerDay,
      maxPeriodsPerWeek: req.body.maxPeriodsPerWeek,
      schoolId: req.user?.schoolId,
    });

    return res.status(201).json({ teacher: created });
  },
);

academicRoutes.get("/subjects", async (req: Request, res: Response) => {
  const subjects = await Subject.find({ schoolId: req.user?.schoolId }).lean();
  return res.json({ subjects });
});

academicRoutes.post(
  "/subjects",
  requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"),
  validateBody(z.object({
    name: z.string().trim().min(2).max(100),
    code: z.string().trim().min(2).max(24),
    categoryRequired: z.enum(["PRT", "TGT", "PGT"]).default("TGT"),
    weeklyPeriods: z.number().int().min(1).max(48).optional(),
    grades: z.array(z.number().int().min(6).max(12)).default([]),
    streams: z.array(z.enum(["Science", "Commerce", "Humanities"])).default([]),
    minPerDay: z.number().int().min(0).max(8).optional(),
    maxPerDay: z.number().int().min(1).max(8).optional(),
    maxDaysPerWeek: z.number().int().min(1).max(6).optional(),
    priority: z.number().int().min(1).max(5).default(3),
    isLabDoublePeriod: z.boolean().default(false),
  })),
  async (req: Request, res: Response) => {
    const normalizedName = String(req.body.name).trim().toLowerCase();
    const created = await Subject.create({
      ...req.body,
      weeklyPeriods: req.body.weeklyPeriods ?? (normalizedName === "science" ? 6 : normalizedName === "computer" ? 2 : 4),
      minPerDay: req.body.minPerDay ?? (normalizedName === "science" ? 1 : 0),
      maxPerDay: req.body.maxPerDay ?? (normalizedName === "computer" ? 1 : 2),
      maxDaysPerWeek: req.body.maxDaysPerWeek ?? (normalizedName === "computer" ? 2 : 6),
      schoolId: req.user?.schoolId,
    });

    return res.status(201).json({ subject: created });
  },
);

const allocationSchema = z.object({
  classSectionId: z.string().regex(/^[a-f\d]{24}$/i),
  subjectId: z.string().regex(/^[a-f\d]{24}$/i),
  teacherId: z.string().regex(/^[a-f\d]{24}$/i),
  weeklyPeriodsNeeded: z.number().int().min(1).max(48).optional(),
  isForced: z.boolean().default(false),
});

academicRoutes.post("/allocations", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(allocationSchema), async (req: Request, res: Response) => {
  const { classSectionId, subjectId, teacherId, isForced } = req.body;
  const [classSection, subject, teacher] = await Promise.all([
    ClassSection.findOne({ _id: classSectionId, schoolId: req.user?.schoolId }).lean(),
    Subject.findOne({ _id: subjectId, schoolId: req.user?.schoolId }).lean(),
    Teacher.findOne({ _id: teacherId, schoolId: req.user?.schoolId }).lean(),
  ]);
  if (!classSection || !subject || !teacher) return res.status(404).json({ message: "Class, subject, and teacher must belong to this school." });
  const { validateTeacherAssignment } = await import("../services/timetableSolverService");
  const gradeCheck = validateTeacherAssignment({ teacherCategory: teacher.qualificationCategory, grade: classSection.grade, periodNumber: 1, teacherId, classSectionId, assignmentsByPeriod: [] });
  if (!gradeCheck.valid) return res.status(400).json({ message: gradeCheck.issues.join(" ") });
  const created = await TeacherAssignment.create({ ...req.body, schoolId: req.user?.schoolId });
  return res.status(201).json({ allocation: created, warning: isForced ? "Forced assignment recorded for administrator review." : undefined });
});

academicRoutes.get("/allocations", async (req: Request, res: Response) => {
  const allocations = await TeacherAssignment.find({ schoolId: req.user?.schoolId }).lean();
  return res.json({ allocations });
});
