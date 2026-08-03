import { Router } from "express";
import { createChapter, updateChapter } from "../controllers/chapter.controller.js";
import { authenticateAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { chapterCreateSchema, chapterUpdateSchema } from "../validators/question-bank.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminChapterRouter = Router();

adminChapterRouter.post("/", authenticateAdmin, validateBody(chapterCreateSchema), asyncHandler(createChapter));
adminChapterRouter.patch("/:id", authenticateAdmin, validateBody(chapterUpdateSchema), asyncHandler(updateChapter));
