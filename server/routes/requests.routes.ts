import { Router } from "express";
import type { Request, Response } from "express";
import { z } from "zod";
import { CalendarDay, ClassSection, Notification, RequestModel, Subject, Teacher, TimetableOverride, TimetableSlot, User } from "../models";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody } from "../utils/validation";
import { canTeachGrade } from "../services/timetableSolverService";

export const requestsRoutes = Router();
requestsRoutes.use(requireAuth);
const requestInput = z.object({
  type: z.enum(["PERIOD_SWAP", "COMBINED_CLASS", "CONSECUTIVE_PERIODS", "EXTRA_PERIOD", "LEAVE_NOTICE"]),
  date: z.string().date(),
  counterpartId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  payload: z.object({
    classSectionId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    otherClassSectionId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    subjectId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    periodNumber: z.number().int().min(1).max(12).optional(),
    otherPeriodNumber: z.number().int().min(1).max(12).optional(),
    teacherId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
    reason: z.string().trim().max(500).optional(),
  }),
});

async function validateRequestTarget(schoolId: string, type: string, payload: z.infer<typeof requestInput>["payload"], date: string) {
  const holiday = await CalendarDay.findOne({ schoolId, date: { $lte: date }, $or: [{ endDate: null }, { endDate: { $gte: date } }] }).lean();
  if (holiday && holiday.type !== "WORKING") return `Requests are blocked on ${holiday.name || "this non-working day"}.`;
  if (date < new Date().toISOString().slice(0, 10)) return "Requests cannot target past dates.";
  if (["PERIOD_SWAP", "COMBINED_CLASS", "CONSECUTIVE_PERIODS", "EXTRA_PERIOD"].includes(type) && !payload.classSectionId) return "A class section is required for this request.";
  const classSection = payload.classSectionId ? await ClassSection.findOne({ _id: payload.classSectionId, schoolId }).lean() : null;
  if (payload.classSectionId && !classSection) return "The selected class is not in this school.";
  if (payload.otherClassSectionId) {
    const other = await ClassSection.findOne({ _id: payload.otherClassSectionId, schoolId }).lean();
    if (!other || classSection?.grade !== other.grade) return "Combined classes must be in the same grade and school.";
  }
  if (payload.subjectId) {
    const subject = await Subject.findOne({ _id: payload.subjectId, schoolId }).lean();
    if (!subject) return "The selected subject is not in this school.";
  }
  if (payload.teacherId) {
    const teacher = await Teacher.findOne({ _id: payload.teacherId, schoolId }).lean();
    if (!teacher || (classSection && !canTeachGrade(teacher.qualificationCategory, classSection.grade))) return "The selected teacher is not qualified for this class.";
  }
  return null;
}

requestsRoutes.post("/", requireRole("TEACHER"), validateBody(requestInput), async (req: Request, res: Response) => {
  const input = requestInput.parse(req.body);
  const problem = await validateRequestTarget(req.user!.schoolId, input.type, input.payload, input.date);
  if (problem) return res.status(400).json({ message: problem });
  const counterpartId = input.counterpartId;
  if (counterpartId && !(await User.exists({ _id: counterpartId, schoolId: req.user?.schoolId, role: "TEACHER", status: "ACTIVE" }))) return res.status(404).json({ message: "Counterpart teacher not found." });
  const impact = input.type === "LEAVE_NOTICE" ? ["Leave notice sent; the timetable is unchanged until an administrator marks an absence."] : ["Requested change is pending review; the master timetable will not change until approval."];
  const request = await RequestModel.create({ schoolId: req.user?.schoolId, requesterId: req.user?.userId, type: input.type, date: input.date, counterpartId: counterpartId ?? null, status: counterpartId ? "PENDING_COUNTERPART" : "PENDING_ADMIN", payload: input.payload, impact });
  return res.status(201).json({ request, impact });
});

requestsRoutes.get("/mine", requireRole("TEACHER"), async (req: Request, res: Response) => {
  const requests = await RequestModel.find({ schoolId: req.user?.schoolId, requesterId: req.user?.userId }).sort({ createdAt: -1 }).lean();
  return res.json({ requests });
});

requestsRoutes.get("/inbox", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), async (req: Request, res: Response) => {
  const requests = await RequestModel.find({ schoolId: req.user?.schoolId, status: { $in: ["PENDING_COUNTERPART", "PENDING_ADMIN"] } }).populate("requesterId counterpartId", "profile.name role").sort({ createdAt: 1 }).lean();
  return res.json({ requests });
});

requestsRoutes.post("/:id/accept", requireRole("TEACHER"), async (req: Request, res: Response) => {
  const request = await RequestModel.findOneAndUpdate({ _id: req.params.id, schoolId: req.user?.schoolId, counterpartId: req.user?.userId, status: "PENDING_COUNTERPART" }, { $set: { status: "PENDING_ADMIN", counterpartAcceptedAt: new Date() } }, { returnDocument: "after" }).lean();
  if (!request) return res.status(404).json({ message: "Request awaiting your acceptance was not found." });
  return res.json({ request });
});

const decisionSchema = z.object({ decision: z.enum(["APPROVED", "REJECTED"]), note: z.string().trim().max(1000).default("") });
requestsRoutes.post("/:id/decision", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(decisionSchema), async (req: Request, res: Response) => {
  const input = decisionSchema.parse(req.body);
  const request = await RequestModel.findOne({ _id: req.params.id, schoolId: req.user?.schoolId, status: "PENDING_ADMIN" });
  if (!request) return res.status(404).json({ message: "Request awaiting administrator review was not found." });
  if (input.decision === "APPROVED" && request.type !== "LEAVE_NOTICE") {
    const payload = request.payload as { classSectionId?: string; subjectId?: string; teacherId?: string; periodNumber?: number };
    const classSection = payload.classSectionId ? await ClassSection.findOne({ _id: payload.classSectionId, schoolId: req.user?.schoolId }).lean() : null;
    const teacher = payload.teacherId ? await Teacher.findOne({ _id: payload.teacherId, schoolId: req.user?.schoolId }).lean() : null;
    if (teacher && classSection && !canTeachGrade(teacher.qualificationCategory, classSection.grade)) return res.status(400).json({ message: "The requested teacher is not qualified for this class." });
    if (classSection && payload.periodNumber) {
      await TimetableOverride.create({ schoolId: request.schoolId, date: request.date, classSectionId: classSection._id, periodNumber: payload.periodNumber, subjectId: payload.subjectId ?? null, teacherId: teacher?._id ?? null, requestId: request._id, approvedBy: req.user?.userId });
    }
  }
  request.status = input.decision;
  request.decisionNote = input.note;
  request.decidedBy = req.user?.userId as never;
  await request.save();
  const requesterId = String(request.requesterId);
  await Notification.create({ schoolId: request.schoolId, userId: requesterId, type: "REQUEST_DECISION", title: "Request decision", message: `Your ${request.type.toLowerCase().replaceAll("_", " ")} was ${input.decision.toLowerCase()}.`, link: "/teacher/requests" });
  return res.json({ request });
});
