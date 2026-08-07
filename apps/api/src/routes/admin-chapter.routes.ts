import { Router } from "express";
import { createChapter, listAdminChaptersHandler, updateChapter } from "../controllers/chapter.controller.js";
import { authenticateAdmin } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { chapterCreateSchema, chaptersQuerySchema, chapterUpdateSchema } from "../validators/question-bank.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminChapterRouter = Router();

adminChapterRouter.get("/", authenticateAdmin, validateQuery(chaptersQuerySchema), asyncHandler(listAdminChaptersHandler));
adminChapterRouter.post("/", authenticateAdmin, validateBody(chapterCreateSchema), asyncHandler(createChapter));
adminChapterRouter.patch("/:id", authenticateAdmin, validateBody(chapterUpdateSchema), asyncHandler(updateChapter));
