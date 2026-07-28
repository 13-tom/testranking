import type { NextFunction, Request, Response } from "express";
import { ForbiddenError } from "../errors/AppError.js";

// Composes after `authenticate` — relies on req.user already being set.
// Reuses the existing single JWT (no separate Admin JWT audience/token
// system — that's Phase 9 scope per CLAUDE.md's scope-discipline rule).
export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (req.user?.role !== "ADMIN") {
    next(new ForbiddenError("Admin access required"));
    return;
  }
  next();
}
