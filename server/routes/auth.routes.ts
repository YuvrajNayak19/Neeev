import { randomInt } from "node:crypto";
import type { Request, Response } from "express";
import { Router } from "express";
import rateLimit from "express-rate-limit";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { z } from "zod";

import { env } from "../config/env";
import { requireAuth, requireRole } from "../middleware/auth";
import { ClassSection, Otp, School, Student, Subject, Teacher, User } from "../models";
import { validateBody, validateQuery } from "../utils/validation";

export const authRoutes = Router();
const authRateLimit = rateLimit({ windowMs: 15 * 60_000, limit: 12, standardHeaders: true, legacyHeaders: false });
const emailSchema = z.string().trim().email().max(254).transform((value) => value.toLowerCase());
const passwordSchema = z.string().min(8).max(128);
const schoolIdSchema = z.string().regex(/^[a-f\d]{24}$/i, "Choose a registered school.");

const schoolRegistrationSchema = z.object({
  name: z.string().trim().min(2).max(160),
  board: z.enum(["CBSE", "ICSE", "State", "Other"]).default("Other"),
  state: z.string().trim().min(2).max(100),
  city: z.string().trim().min(2).max(100),
  schoolEmail: emailSchema,
  phone: z.string().trim().max(30).default(""),
  adminName: z.string().trim().min(2).max(120),
  adminEmail: emailSchema,
  password: passwordSchema,
  academicYear: z.string().trim().regex(/^\d{4}-\d{2,4}$/),
  classRange: z.tuple([z.number().int().min(6).max(12), z.number().int().min(6).max(12)]).refine(([start, end]) => start <= end),
  website: z.string().max(0).optional(),
});

const teacherRegistrationSchema = z.object({
  schoolId: schoolIdSchema,
  name: z.string().trim().min(2).max(120),
  email: emailSchema,
  password: passwordSchema,
  category: z.enum(["TGT", "PGT", "PRT"]),
  subjects: z.array(z.string().regex(/^[a-f\d]{24}$/i)).max(30).default([]),
});

const studentRegistrationSchema = z.object({
  schoolId: schoolIdSchema,
  classSectionId: z.string().regex(/^[a-f\d]{24}$/i),
  name: z.string().trim().min(2).max(120),
  admissionNumber: z.string().trim().min(1).max(40).transform((value) => value.toUpperCase()),
  password: passwordSchema,
});

const verifyOtpSchema = z.object({ email: emailSchema, code: z.string().regex(/^\d{6}$/) });
const publicSchoolsQuerySchema = z.object({ q: z.string().trim().max(100).default("") });
const publicSchoolIdParamsSchema = z.object({ id: schoolIdSchema });
const loginSchema = z.discriminatedUnion("role", [
  z.object({ role: z.enum(["admin", "teacher"]), identifier: emailSchema, password: passwordSchema }),
  z.object({ role: z.literal("student"), schoolId: schoolIdSchema, identifier: z.string().trim().min(1).max(40), password: passwordSchema }),
]);

type RegistrationPurpose = "REGISTER_SCHOOL" | "REGISTER_TEACHER" | "REGISTER_STUDENT";

function issueToken(user: { _id: unknown; schoolId: unknown; role: string }) {
  return jwt.sign(
    { userId: String(user._id), schoolId: String(user.schoolId), role: user.role },
    env.jwtSecret as jwt.Secret,
    { expiresIn: env.jwtExpiresIn as jwt.SignOptions["expiresIn"] },
  );
}

function setAuthCookie(res: Response, token: string) {
  res.cookie("token", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

async function issueOtp(email: string, purpose: RegistrationPurpose, payload: Record<string, unknown>) {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await Otp.deleteMany({ email, purpose });
  await Otp.create({ email, purpose, codeHash: await bcrypt.hash(code, 10), payload, expiresAt: new Date(Date.now() + 10 * 60_000) });
  if (process.env.NODE_ENV !== "production" || process.env.EMAIL_PROVIDER === "console") {
    console.info(`[EduSync OTP] ${email} (${purpose}): ${code}`);
  } else if (process.env.EMAIL_PROVIDER === "resend" && process.env.RESEND_API_KEY && process.env.EMAIL_FROM) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: process.env.EMAIL_FROM, to: [email], subject: "Your EduSync verification code", text: `Your verification code is ${code}. It expires in 10 minutes.` }),
    });
    if (!response.ok) throw new Error("The email provider could not send the verification code.");
  } else {
    throw new Error("Email delivery is not configured.");
  }
}

async function requestRegistrationOtp(purpose: RegistrationPurpose, email: string, payload: Record<string, unknown>, res: Response) {
  try {
    await issueOtp(email, purpose, payload);
    return res.status(202).json({ message: "Verification code sent. It expires in 10 minutes." });
  } catch (error) {
    console.error("OTP delivery failed", error);
    return res.status(503).json({ message: error instanceof Error ? error.message : "Could not send verification code." });
  }
}

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

authRoutes.get("/public/schools", validateQuery(publicSchoolsQuerySchema), async (req: Request, res: Response) => {
  const query = String(req.query.q ?? "");
  const search = query ? new RegExp(escapeRegex(query), "i") : undefined;
  const filter = search ? { status: "ACTIVE" as const, $or: [{ name: search }, { city: search }, { state: search }] } : { status: "ACTIVE" as const };
  const schools = await School.find(filter).select("name city state code").sort({ name: 1 }).limit(10).lean();
  return res.json({ schools });
});

authRoutes.get("/public/schools/:id/classes", async (req: Request, res: Response) => {
  const parsed = publicSchoolIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid school id." });
  const classes = await ClassSection.find({ schoolId: parsed.data.id }).select("grade section stream").sort({ grade: 1, section: 1 }).lean();
  return res.json({ classes });
});

authRoutes.get("/public/schools/:id/subjects", async (req: Request, res: Response) => {
  const parsed = publicSchoolIdParamsSchema.safeParse(req.params);
  if (!parsed.success) return res.status(400).json({ message: "Invalid school id." });
  const school = await School.findOne({ _id: parsed.data.id, status: "ACTIVE" }).select("_id").lean();
  if (!school) return res.status(404).json({ message: "School not found." });
  const subjects = await Subject.find({ schoolId: school._id }).select("name code").sort({ name: 1 }).lean();
  return res.json({ subjects });
});

authRoutes.post("/register-school", authRateLimit, validateBody(schoolRegistrationSchema), async (req: Request, res: Response) => {
  const input = schoolRegistrationSchema.parse(req.body);
  if (input.website) return res.status(400).json({ message: "Registration could not be completed." });
  const existing = await User.findOne({ email: input.adminEmail }).lean();
  if (existing) return res.status(409).json({ message: "An account with that admin email already exists." });
  return requestRegistrationOtp("REGISTER_SCHOOL", input.adminEmail, input as unknown as Record<string, unknown>, res);
});

authRoutes.post("/register-teacher", authRateLimit, validateBody(teacherRegistrationSchema), async (req: Request, res: Response) => {
  const input = teacherRegistrationSchema.parse(req.body);
  const school = await School.findOne({ _id: input.schoolId, status: "ACTIVE" }).select("_id").lean();
  if (!school) return res.status(404).json({ message: "Choose an active school." });
  const duplicate = await User.findOne({ schoolId: school._id, email: input.email }).lean();
  if (duplicate?.status === "ACTIVE") return res.status(409).json({ message: "This email already has an account at this school." });
  return requestRegistrationOtp("REGISTER_TEACHER", input.email, input as unknown as Record<string, unknown>, res);
});

authRoutes.post("/register-student", authRateLimit, validateBody(studentRegistrationSchema), async (req: Request, res: Response) => {
  const input = studentRegistrationSchema.parse(req.body);
  const [school, classSection] = await Promise.all([
    School.findOne({ _id: input.schoolId, status: "ACTIVE" }).select("_id").lean(),
    ClassSection.findOne({ _id: input.classSectionId, schoolId: input.schoolId }).select("_id").lean(),
  ]);
  if (!school || !classSection) return res.status(404).json({ message: "Choose a class in the selected school." });
  const duplicate = await Student.findOne({ schoolId: school._id, admissionNumber: input.admissionNumber }).lean();
  if (duplicate) return res.status(409).json({ message: "That admission number is already registered at this school." });
  const user = await User.create({
    schoolId: school._id, admissionNumber: input.admissionNumber,
    passwordHash: await bcrypt.hash(input.password, 12), role: "STUDENT", status: "PENDING",
    profile: { name: input.name },
  });
  await Student.create({ schoolId: school._id, userId: user._id, classSectionId: classSection._id, name: input.name, admissionNumber: input.admissionNumber });
  return res.status(201).json({ user: { id: user._id, role: user.role, status: user.status } });
});

authRoutes.post("/verify-otp", authRateLimit, validateBody(verifyOtpSchema), async (req: Request, res: Response) => {
  const { email, code } = verifyOtpSchema.parse(req.body);
  const otp = await Otp.findOne({ email, expiresAt: { $gt: new Date() } }).sort({ createdAt: -1 });
  if (!otp || otp.attempts >= 5) return res.status(400).json({ message: "Verification code is invalid or expired." });
  const matches = await bcrypt.compare(code, otp.codeHash);
  if (!matches) {
    otp.attempts += 1;
    await otp.save();
    return res.status(400).json({ message: "Verification code is invalid or expired." });
  }

  const payload = otp.payload as Record<string, unknown>;
  let userId: unknown;
  let userSchoolId: unknown;
  let userRole = "";
  let userStatus = "";
  if (otp.purpose === "REGISTER_SCHOOL") {
    const schoolInput = schoolRegistrationSchema.parse(payload);
    const schoolCode = await generateSchoolCode();
    const school = await School.create({
      name: schoolInput.name, code: schoolCode, academicYear: schoolInput.academicYear,
      board: schoolInput.board, state: schoolInput.state, city: schoolInput.city,
      email: schoolInput.schoolEmail, phone: schoolInput.phone, status: "ACTIVE",
  classRange: schoolInput.classRange,
    });
    const user = await User.create({
      schoolId: school._id, email: schoolInput.adminEmail, passwordHash: await bcrypt.hash(schoolInput.password, 12),
      role: "SUPER_ADMIN", status: "ACTIVE", emailVerifiedAt: new Date(), profile: { name: schoolInput.adminName },
    });
    userId = user._id;
    userSchoolId = user.schoolId;
    userRole = user.role;
    userStatus = user.status;
  } else if (otp.purpose === "REGISTER_TEACHER") {
    const teacherInput = teacherRegistrationSchema.parse(payload);
    const passwordHash = await bcrypt.hash(teacherInput.password, 12);
    const user = await User.findOneAndUpdate(
      { schoolId: teacherInput.schoolId, email: teacherInput.email },
      { $set: { passwordHash, role: "TEACHER", status: "PENDING", emailVerifiedAt: new Date(), profile: { name: teacherInput.name } } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
    if (!user) return res.status(500).json({ message: "Could not create teacher account." });
    userId = user._id;
    userSchoolId = user.schoolId;
    userRole = user.role;
    userStatus = user.status;
    await Teacher.findOneAndUpdate(
      { schoolId: teacherInput.schoolId, email: teacherInput.email },
      { $set: { userId: user._id, name: teacherInput.name, email: teacherInput.email, qualificationCategory: teacherInput.category, primarySubjects: teacherInput.subjects } },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  } else {
    return res.status(400).json({ message: "Student registration does not use email verification." });
  }
  await Otp.deleteOne({ _id: otp._id });
  if (userStatus === "ACTIVE") setAuthCookie(res, issueToken({ _id: userId, schoolId: userSchoolId, role: userRole }));
  const schoolCode = otp.purpose === "REGISTER_SCHOOL" ? (await School.findById(userSchoolId).select("code").lean())?.code : undefined;
  return res.status(201).json({ user: { id: userId, schoolId: userSchoolId, role: userRole, status: userStatus }, schoolCode });
});

authRoutes.post("/login", authRateLimit, validateBody(loginSchema), async (req: Request, res: Response) => {
  const input = loginSchema.parse(req.body);
  const user = input.role === "student"
    ? await User.findOne({ schoolId: input.schoolId, role: "STUDENT", admissionNumber: input.identifier.toUpperCase() }).lean()
    : await User.findOne({ email: input.identifier, role: input.role === "admin" ? { $in: ["SUPER_ADMIN", "SCHOOL_ADMIN"] } : "TEACHER" }).lean();
  if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) return res.status(401).json({ message: "Invalid credentials." });
  if (user.status === "PENDING") return res.status(403).json({ code: "PENDING_APPROVAL", message: "Waiting for approval from your school." });
  if (user.status !== "ACTIVE") return res.status(403).json({ message: "This account is not active." });
  setAuthCookie(res, issueToken(user));
  return res.json({ user: { id: user._id, schoolId: user.schoolId, role: user.role, email: user.email, admissionNumber: user.admissionNumber, mustChangePassword: user.mustChangePassword } });
});

const approvalSchema = z.object({ status: z.enum(["ACTIVE", "SUSPENDED"]) });
authRoutes.patch("/admin/approvals/:id", requireAuth, requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(approvalSchema), async (req: Request, res: Response) => {
  const result = approvalSchema.parse(req.body);
  const target = await User.findOneAndUpdate(
    { _id: req.params.id, schoolId: req.user?.schoolId, status: "PENDING" },
    { $set: { status: result.status } }, { new: true },
  ).select("_id role status profile admissionNumber").lean();
  if (!target) return res.status(404).json({ message: "Pending account not found." });
  return res.json({ user: target });
});

const bulkApprovalSchema = z.object({ ids: z.array(z.string().regex(/^[a-f\d]{24}$/i)).min(1).max(500) });
authRoutes.post("/admin/approvals/bulk", requireAuth, requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(bulkApprovalSchema), async (req: Request, res: Response) => {
  const result = bulkApprovalSchema.parse(req.body);
  const updated = await User.updateMany({ _id: { $in: result.ids }, schoolId: req.user?.schoolId, role: "STUDENT", status: "PENDING" }, { $set: { status: "ACTIVE" } });
  return res.json({ approved: updated.modifiedCount });
});

// Re-issues the session cookie for a token that expired within the last 30 days, provided the account is still active.
authRoutes.post("/refresh", authRateLimit, async (req: Request, res: Response) => {
  const token = typeof req.cookies?.token === "string" ? req.cookies.token : req.headers.authorization?.replace(/^Bearer\s+/i, "");
  if (!token) return res.status(401).json({ message: "Authentication required." });
  try {
    const decoded = jwt.verify(token, env.jwtSecret, { ignoreExpiration: true }) as jwt.JwtPayload;
    if (!decoded.userId || !decoded.schoolId || !decoded.exp || Date.now() / 1000 - decoded.exp > 30 * 86_400) return res.status(401).json({ message: "Session expired. Please sign in again." });
    const user = await User.findOne({ _id: decoded.userId, schoolId: decoded.schoolId, status: "ACTIVE" }).select("schoolId role").lean();
    if (!user) return res.status(401).json({ message: "Account is unavailable." });
    setAuthCookie(res, issueToken(user));
    return res.json({ success: true });
  } catch {
    return res.status(401).json({ message: "Invalid session." });
  }
});

authRoutes.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie("token", { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/" });
  return res.json({ success: true });
});

authRoutes.get("/me", requireAuth, async (req: Request, res: Response) => {
  const user = await User.findOne({ _id: req.user?.userId, schoolId: req.user?.schoolId }).select("-passwordHash").lean();
  if (!user) return res.status(404).json({ message: "User not found." });
  return res.json({ user });
});

async function generateSchoolCode(): Promise<string> {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = Array.from({ length: 6 }, () => alphabet[randomInt(alphabet.length)]).join("");
    if (!(await School.exists({ code: candidate }))) return candidate;
  }
  throw new Error("Could not allocate a unique school code. Please retry.");
}
