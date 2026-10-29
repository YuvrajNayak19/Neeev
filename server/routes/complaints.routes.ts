import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { Complaint, ComplaintCounter, Student } from "../models";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../utils/validation";

export const complaintsRoutes = Router();
complaintsRoutes.use(requireAuth);
const seriousCategories = ["BULLYING", "HARASSMENT", "SAFETY", "TEACHER_CONDUCT"] as const;
const normalCategories = ["HYGIENE", "FACILITIES", "TIMETABLE", "ACADEMICS"] as const;
const complaintSchema = z.object({ category: z.enum([...normalCategories, ...seriousCategories]), message: z.string().trim().min(5).max(4000), place: z.string().trim().max(120).optional(), anonymous: z.boolean().default(false) });

complaintsRoutes.post("/", requireRole("STUDENT"), validateBody(complaintSchema), async (req: Request, res: Response) => {
  const input = complaintSchema.parse(req.body);
  const student = await Student.findOne({ schoolId: req.user?.schoolId, userId: req.user?.userId }).lean();
  if (!student) return res.status(404).json({ message: "Student profile not found." });
  const serious = (seriousCategories as readonly string[]).includes(input.category);
  const anonymous = serious && input.anonymous;
  const day = new Date().toISOString().slice(0, 10);
  const counter = await ComplaintCounter.findOneAndUpdate(
    { schoolId: student.schoolId, studentId: student._id, day },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date(Date.now() + 48 * 60 * 60_000) } },
    { upsert: true, new: true },
  );
  if (counter.count > 3) {
    await ComplaintCounter.updateOne({ _id: counter._id }, { $inc: { count: -1 } });
    return res.status(429).json({ message: "You can submit up to three complaints per day." });
  }
  const complaint = await Complaint.create({
    schoolId: student.schoolId,
    studentId: anonymous ? null : student._id,
    classSectionId: student.classSectionId,
    category: input.category,
    serious,
    anonymous,
    place: input.place ?? "",
    message: input.message,
  });
  return res.status(201).json({ complaint: { id: complaint._id, category: complaint.category, status: complaint.status, anonymous: complaint.anonymous } });
});

complaintsRoutes.get("/mine", requireRole("STUDENT"), async (req: Request, res: Response) => {
  const student = await Student.findOne({ schoolId: req.user?.schoolId, userId: req.user?.userId }).select("_id").lean();
  if (!student) return res.status(404).json({ message: "Student profile not found." });
  const complaints = await Complaint.find({ schoolId: req.user?.schoolId, studentId: student._id, anonymous: false }).select("category serious status resolutionNote createdAt").sort({ createdAt: -1 }).lean();
  return res.json({ complaints });
});

complaintsRoutes.get("/", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), async (req: Request, res: Response) => {
  const filter = req.user?.role === "SUPER_ADMIN" ? { schoolId: req.user.schoolId } : { schoolId: req.user?.schoolId, serious: false };
  const complaints = await Complaint.find(filter).populate("studentId", "name admissionNumber").populate("classSectionId", "grade section").sort({ createdAt: -1 }).lean();
  return res.json({ complaints });
});

const statusSchema = z.object({ status: z.enum(["SEEN", "RESOLVED"]), resolutionNote: z.string().trim().max(1000).optional() });
complaintsRoutes.patch("/:id", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(statusSchema), async (req: Request, res: Response) => {
  const input = statusSchema.parse(req.body);
  const visibility = req.user?.role === "SUPER_ADMIN" ? {} : { serious: false };
  const complaint = await Complaint.findOneAndUpdate({ _id: req.params.id, schoolId: req.user?.schoolId, ...visibility }, { $set: { status: input.status, resolutionNote: input.resolutionNote ?? "" } }, { new: true }).lean();
  if (!complaint) return res.status(404).json({ message: "Complaint not found." });
  return res.json({ complaint });
});

