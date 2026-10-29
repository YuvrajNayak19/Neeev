import type { MasterTimetable, SchoolDay, SchoolPeriod, UserRole } from "../../types/school-domain";

export interface AuthContext {
  userId: string;
  schoolId: string;
  role: UserRole;
}

export interface MasterTimetableRepository {
  create: (entry: MasterTimetable) => Promise<MasterTimetable>;
  findByClassSlot: (schoolId: string, classSectionId: string, dayOfWeek: SchoolDay, period: SchoolPeriod) => Promise<MasterTimetable | undefined>;
  findByTeacherSlot: (schoolId: string, assignedTeacherId: string, dayOfWeek: SchoolDay, period: SchoolPeriod) => Promise<MasterTimetable | undefined>;
}

type CreateTimetableBody = Omit<MasterTimetable, "id" | "schoolId">;

const json = (body: unknown, status = 200): Response => Response.json(body, { status });
const isAdmin = (role: UserRole): boolean => role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN";
const isDay = (value: unknown): value is SchoolDay => typeof value === "number" && value >= 1 && value <= 6 && Number.isInteger(value);
const isPeriod = (value: unknown): value is SchoolPeriod => typeof value === "number" && value >= 1 && value <= 8 && Number.isInteger(value);

export async function createMasterTimetableController(request: Request, context: AuthContext, repository: MasterTimetableRepository): Promise<Response> {
  if (!isAdmin(context.role)) return json({ error: { code: "FORBIDDEN", message: "Only school administrators can edit the master timetable." } }, 403);

  let body: Partial<CreateTimetableBody>;
  try {
    body = await request.json() as Partial<CreateTimetableBody>;
  } catch {
    return json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, 400);
  }

  if (typeof body.classSectionId !== "string" || !isDay(body.dayOfWeek) || !isPeriod(body.period)) {
    return json({ error: { code: "VALIDATION_ERROR", message: "classSectionId, dayOfWeek, and period are required." } }, 422);
  }

  if (body.assignedTeacherId !== undefined && typeof body.assignedTeacherId !== "string") {
    return json({ error: { code: "VALIDATION_ERROR", message: "assignedTeacherId must be a string when provided." } }, 422);
  }

  const [classConflict, teacherConflict] = await Promise.all([
    repository.findByClassSlot(context.schoolId, body.classSectionId, body.dayOfWeek, body.period),
    body.assignedTeacherId ? repository.findByTeacherSlot(context.schoolId, body.assignedTeacherId, body.dayOfWeek, body.period) : Promise.resolve(undefined),
  ]);
  if (classConflict) return json({ error: { code: "CLASS_SLOT_CONFLICT", message: "This class already has a timetable entry in that period." } }, 409);
  if (teacherConflict) return json({ error: { code: "TEACHER_SLOT_CONFLICT", message: "This teacher is already assigned in that period." } }, 409);

  const entry: MasterTimetable = {
    id: crypto.randomUUID(),
    schoolId: context.schoolId,
    classSectionId: body.classSectionId,
    dayOfWeek: body.dayOfWeek,
    period: body.period,
    subjectId: body.subjectId,
    assignedTeacherId: body.assignedTeacherId,
    room: body.room,
  };
  const created = await repository.create(entry);
  return json({ data: created }, 201);
}
