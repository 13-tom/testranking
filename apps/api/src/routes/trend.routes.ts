import { Router } from "express";
import {
  getAccuracyTrendHandler,
  getMilestonesHandler,
  getMomentumHandler,
  getRankTrendHandler,
  getSpeedTrendHandler,
  getStudyTimeTrendHandler,
  getSubjectsTrendHandler,
  getTrendOverviewHandler,
} from "../controllers/trend.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import { trendDateRangeQuerySchema } from "../validators/trend.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const trendRouter = Router();

trendRouter.use(authenticate);
trendRouter.get("/overview", validateQuery(trendDateRangeQuerySchema), asyncHandler(getTrendOverviewHandler));
trendRouter.get("/accuracy", validateQuery(trendDateRangeQuerySchema), asyncHandler(getAccuracyTrendHandler));
trendRouter.get("/rank", validateQuery(trendDateRangeQuerySchema), asyncHandler(getRankTrendHandler));
trendRouter.get("/speed", asyncHandler(getSpeedTrendHandler));
trendRouter.get("/study-time", validateQuery(trendDateRangeQuerySchema), asyncHandler(getStudyTimeTrendHandler));
trendRouter.get("/subjects", validateQuery(trendDateRangeQuerySchema), asyncHandler(getSubjectsTrendHandler));
trendRouter.get("/milestones", asyncHandler(getMilestonesHandler));
trendRouter.get("/momentum", asyncHandler(getMomentumHandler));
