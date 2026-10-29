import { generateSmartSubstitutions } from "../../lib/smart-substitutions";
import type { DailySubstitution, SmartSubstitutionInput, UserRole } from "../../types/school-domain";
import type { AuthContext } from "./master-timetable";

export interface SubstitutionRepository {
  getGenerationInput: (schoolId: string, date: string) => Promise<SmartSubstitutionInput>;
  replaceDailySubstitutions: (schoolId: string, date: string, substitutions: DailySubstitution[]) => Promise<void>;
}

const json = (body: unknown, status = 200): Response => Response.json(body, { status });
const canGenerate = (role: UserRole): boolean => role === "SUPER_ADMIN" || role === "SCHOOL_ADMIN";
const datePattern = /^\d{4}-\d{2}-\d{2}$/;

export async function generateSubstitutionsController(request: Request, context: AuthContext, repository: SubstitutionRepository): Promise<Response> {
  if (!canGenerate(context.role)) return json({ error: { code: "FORBIDDEN", message: "Only school administrators can generate substitutions." } }, 403);

  let body: { date?: unknown };
  try {
    body = await request.json() as { date?: unknown };
  } catch {
    return json({ error: { code: "INVALID_JSON", message: "Request body must be valid JSON." } }, 400);
  }

  if (typeof body.date !== "string" || !datePattern.test(body.date)) {
    return json({ error: { code: "VALIDATION_ERROR", message: "date must use YYYY-MM-DD format." } }, 422);
  }

  const input = await repository.getGenerationInput(context.schoolId, body.date);
  const result = generateSmartSubstitutions({ ...input, schoolId: context.schoolId, date: body.date });
  await repository.replaceDailySubstitutions(context.schoolId, body.date, result.substitutions);
  return json({ data: result });
}
