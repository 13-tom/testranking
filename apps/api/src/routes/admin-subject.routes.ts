import { Router } from "express";
import { createSubject, updateSubject } from "../controllers/subject.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validate.js";
import { subjectCreateSchema, subjectUpdateSchema } from "../validators/question-bank.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminSubjectRouter = Router();

adminSubjectRouter.post("/", authenticate, requireAdmin, validateBody(subjectCreateSchema), asyncHandler(createSubject));
adminSubjectRouter.patch("/:id", authenticate, requireAdmin, validateBody(subjectUpdateSchema), asyncHandler(updateSubject));
