import { Router } from "express";
import type { Request, Response } from "express";
import { readFile } from "node:fs/promises";
import { z } from "zod";
import { CalendarDay, School } from "../models";
import { requireAuth, requireRole } from "../middleware/auth";
import { validateBody, validateQuery } from "../utils/validation";

export const calendarRoutes = Router();
calendarRoutes.use(requireAuth);

const rangeQuery = z.object({ from: z.string().date(), to: z.string().date() }).refine(({ from, to }) => from <= to);
calendarRoutes.get("/", validateQuery(rangeQuery), async (req: Request, res: Response) => {
  const { from, to } = rangeQuery.parse(req.query);
  const [days, school] = await Promise.all([
    CalendarDay.find({ schoolId: req.user?.schoolId, date: { $lte: to }, $or: [{ endDate: null }, { endDate: { $gte: from } }] }).sort({ date: 1 }).lean(),
    School.findById(req.user?.schoolId).select("settings.workingDays settings.alternateSaturdayOff").lean(),
  ]);
  return res.json({ days, settings: school?.settings ?? null });
});

const calendarBaseInput = z.object({
  date: z.string().date(),
  endDate: z.string().date().nullable().optional(),
  type: z.enum(["SCHOOL_OFF", "PUBLIC_HOLIDAY", "HALF_DAY", "WORKING"]),
  name: z.string().trim().min(1).max(120),
  halfDayPeriods: z.number().int().min(1).max(12).optional(),
  state: z.string().trim().max(100).optional(),
});
const calendarInput = calendarBaseInput.refine((value) => !value.endDate || value.endDate >= value.date, { path: ["endDate"], message: "End date must not be before start date." });

calendarRoutes.post("/", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(calendarInput), async (req: Request, res: Response) => {
  const input = calendarInput.parse(req.body);
  const day = await CalendarDay.create({ ...input, schoolId: req.user?.schoolId, source: "ADMIN", needsConfirmation: false });
  return res.status(201).json({ day });
});

calendarRoutes.patch("/:id", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(calendarBaseInput.partial()), async (req: Request, res: Response) => {
  const input = calendarBaseInput.partial().parse(req.body);
  const day = await CalendarDay.findOneAndUpdate({ _id: req.params.id, schoolId: req.user?.schoolId }, { $set: input }, { returnDocument: "after", runValidators: true }).lean();
  if (!day) return res.status(404).json({ message: "Calendar entry not found." });
  return res.json({ day });
});

calendarRoutes.delete("/:id", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), async (req: Request, res: Response) => {
  const deleted = await CalendarDay.findOneAndDelete({ _id: req.params.id, schoolId: req.user?.schoolId });
  if (!deleted) return res.status(404).json({ message: "Calendar entry not found." });
  return res.json({ success: true });
});

calendarRoutes.post("/sync-holidays", requireRole("SCHOOL_ADMIN", "SUPER_ADMIN"), validateBody(z.object({ year: z.number().int().min(2020).max(2100), state: z.string().trim().max(100).optional() })), async (req: Request, res: Response) => {
  const input = z.object({ year: z.number().int().min(2020).max(2100), state: z.string().trim().max(100).optional() }).parse(req.body);
  const seedPath = new URL("../../data/holidays-seed.json", import.meta.url);
  const seed = JSON.parse(await readFile(seedPath, "utf8")) as Array<{ month: number; day: number; name: string }>;
  const days = await Promise.all(seed.map(({ month, day, name }) => CalendarDay.findOneAndUpdate(
    { schoolId: req.user?.schoolId, date: `${input.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, name },
    { $setOnInsert: { schoolId: req.user?.schoolId, date: `${input.year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`, type: "PUBLIC_HOLIDAY", name, source: "IMPORTED", needsConfirmation: false, state: input.state ?? "" } },
    { upsert: true, returnDocument: "after" },
  )));
  return res.json({ days, source: "bundled-national-holidays", needsExternalProvider: Boolean(process.env.HOLIDAY_API_KEY && process.env.HOLIDAY_PROVIDER) });
});
