import { Router } from "express";
import {
  getChaptersHandler,
  getGoalsHandler,
  getPracticeHandler,
  getRevisionHandler,
  getSummaryHandler,
  getTodayHandler,
  getTopicsHandler,
  getWeekHandler,
} from "../controllers/recommendation.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import {
  goalsQuerySchema,
  practiceQuerySchema,
  recommendationListQuerySchema,
  revisionQuerySchema,
  todayQuerySchema,
  weekQuerySchema,
} from "../validators/recommendation.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const recommendationRouter = Router();

recommendationRouter.use(authenticate);
recommendationRouter.get("/today", validateQuery(todayQuerySchema), asyncHandler(getTodayHandler));
recommendationRouter.get("/week", validateQuery(weekQuerySchema), asyncHandler(getWeekHandler));
recommendationRouter.get("/chapters", validateQuery(recommendationListQuerySchema), asyncHandler(getChaptersHandler));
recommendationRouter.get("/topics", validateQuery(recommendationListQuerySchema), asyncHandler(getTopicsHandler));
recommendationRouter.get("/practice", validateQuery(practiceQuerySchema), asyncHandler(getPracticeHandler));
recommendationRouter.get("/revision", validateQuery(revisionQuerySchema), asyncHandler(getRevisionHandler));
recommendationRouter.get("/goals", validateQuery(goalsQuerySchema), asyncHandler(getGoalsHandler));
recommendationRouter.get("/summary", asyncHandler(getSummaryHandler));
