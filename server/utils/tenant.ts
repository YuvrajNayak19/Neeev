import type { Request } from "express";

export function schoolScope(req: Request): { schoolId: string } {
  if (!req.user?.schoolId) throw new Error("Authenticated school context is required.");
  return { schoolId: req.user.schoolId };
}

export function scopedIdFilter(req: Request, id: string, field = "_id"): Record<string, unknown> {
  return { ...schoolScope(req), [field]: id };
}