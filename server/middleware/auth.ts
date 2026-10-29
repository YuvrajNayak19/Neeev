import type { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";

import { env } from "../config/env";
import { User } from "../models/User";

export type AuthenticatedUser = {
  userId: string;
  schoolId: string;
  role?: string;
  status?: string;
};

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      schoolId?: string;
    }
  }
}

function getTokenFromRequest(req: Request): string | null {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) {
    return header.replace("Bearer ", "").trim();
  }

  if (typeof req.cookies?.token === "string") {
    return req.cookies.token;
  }

  return null;
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);

  if (!token) {
    res.status(401).json({ message: "Authentication required." });
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthenticatedUser;
    if (!decoded.userId || !decoded.schoolId) {
      res.status(401).json({ message: "Authentication token is missing school context." });
      return;
    }
    const account = await User.findOne({ _id: decoded.userId, schoolId: decoded.schoolId }).select("status").lean();
    if (!account) {
      res.status(401).json({ message: "Account is unavailable." });
      return;
    }
    if (account.status !== "ACTIVE") {
      res.status(403).json({ message: account.status === "PENDING" ? "Waiting for approval from your school." : "This account is not active." });
      return;
    }
    req.user = decoded;
    req.schoolId = decoded.schoolId;
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired token." });
  }
}

export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      res.status(401).json({ message: "Authentication required." });
      return;
    }

    if (!roles.includes(req.user.role ?? "")) {
      res.status(403).json({ message: "403 Unauthorized Access" });
      return;
    }

    next();
  };
}

export function optionalAuth(req: Request, _res: Response, next: NextFunction) {
  const token = getTokenFromRequest(req);

  if (!token) {
    next();
    return;
  }

  try {
    const decoded = jwt.verify(token, env.jwtSecret) as AuthenticatedUser;
    req.user = decoded;
    req.schoolId = decoded.schoolId ?? undefined;
  } catch {
    // ignore invalid token for optional auth flows
  }

  next();
}
