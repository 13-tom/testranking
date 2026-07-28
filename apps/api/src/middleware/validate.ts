import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";
import { ValidationError } from "../errors/AppError.js";

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      next(new ValidationError("Invalid request body", details));
      return;
    }
    req.body = result.data;
    next();
  };
}

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const details = result.error.issues.map((issue) => `${issue.path.join(".")}: ${issue.message}`);
      next(new ValidationError("Invalid query parameters", details));
      return;
    }
    // Zod's parsed output isn't structurally ParsedQs, but Express only
    // reads req.query as a plain object at runtime.
    req.query = result.data as unknown as Request["query"];
    next();
  };
}
