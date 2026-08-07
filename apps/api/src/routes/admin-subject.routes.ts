import { Router } from "express";
import { createSubject, listAdminSubjectsHandler, updateSubject } from "../controllers/subject.controller.js";
import { authenticateAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { subjectCreateSchema, subjectUpdateSchema } from "../validators/question-bank.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminSubjectRouter = Router();

adminSubjectRouter.get("/", authenticateAdmin, asyncHandler(listAdminSubjectsHandler));
adminSubjectRouter.post("/", authenticateAdmin, validateBody(subjectCreateSchema), asyncHandler(createSubject));
adminSubjectRouter.patch("/:id", authenticateAdmin, validateBody(subjectUpdateSchema), asyncHandler(updateSubject));
