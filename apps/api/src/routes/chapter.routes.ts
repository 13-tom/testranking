import { Router } from "express";
import { listChapters } from "../controllers/chapter.controller.js";
import { validateQuery } from "../middleware/validate.js";
import { chaptersQuerySchema } from "../validators/question-bank.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const chapterRouter = Router();

chapterRouter.get("/", validateQuery(chaptersQuerySchema), asyncHandler(listChapters));
