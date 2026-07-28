import type { NextFunction, Request, Response } from "express";
import { UnauthorizedError } from "../errors/AppError.js";
import { verifyToken } from "../lib/jwt.js";

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.header("Authorization");
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;

  if (!token) {
    next(new UnauthorizedError("Missing bearer token"));
    return;
  }

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(new UnauthorizedError("Invalid or expired token"));
  }
}
