import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/AppError.js";
import { verifyToken } from "../lib/jwt.js";

function extractToken(req: Request): string | undefined {
  const header = req.header("Authorization");
  return header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
}

// Student/public-facing routes: rejects a valid token that isn't a
// student-audience token (BR-046) — closes the gap where an admin JWT
// could otherwise pass every check here that only inspected `role`.
export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(new UnauthorizedError("Missing bearer token"));
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.aud !== "board-ranking-client") {
      next(new UnauthorizedError("Invalid or expired token"));
      return;
    }
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}

// Admin routes: replaces the old `authenticate + requireAdmin` pair with a
// single audience check (BR-046) — a student token is rejected outright
// rather than reaching a role check.
export function authenticateAdmin(req: Request, _res: Response, next: NextFunction): void {
  const token = extractToken(req);
  if (!token) {
    next(new UnauthorizedError("Missing bearer token"));
    return;
  }

  try {
    const payload = verifyToken(token);
    if (payload.aud !== "board-ranking-admin") {
      next(new UnauthorizedError("Invalid or expired token"));
      return;
    }
    req.user = payload;
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}
