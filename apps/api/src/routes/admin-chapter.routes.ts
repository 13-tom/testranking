import { Router } from "express";
import { createChapter, updateChapter } from "../controllers/chapter.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validate.js";
import { chapterCreateSchema, chapterUpdateSchema } from "../validators/question-bank.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminChapterRouter = Router();

adminChapterRouter.post("/", authenticate, requireAdmin, validateBody(chapterCreateSchema), asyncHandler(createChapter));
adminChapterRouter.patch("/:id", authenticate, requireAdmin, validateBody(chapterUpdateSchema), asyncHandler(updateChapter));
