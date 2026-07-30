import { Router } from "express";
import {
  getChaptersHandler,
  getOverviewHandler,
  getProgressHandler,
  getStrengthsHandler,
  getSubjectsHandler,
  getSummaryHandler,
  getTopicsHandler,
  getWeaknessesHandler,
} from "../controllers/analytics-dashboard.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import { chaptersQuerySchema, dashboardProgressQuerySchema, topNQuerySchema, topicsQuerySchema } from "../validators/analytics-dashboard.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

// Phase 5 (Analytics, BR-043): Module 14 — mounted at
// /api/v1/analytics-dashboard, distinct from the existing Phase 2
// /api/v1/dashboard mount (see BR-043 for why).
export const analyticsDashboardRouter = Router();

analyticsDashboardRouter.use(authenticate);
analyticsDashboardRouter.get("/overview", asyncHandler(getOverviewHandler));
analyticsDashboardRouter.get("/subjects", asyncHandler(getSubjectsHandler));
analyticsDashboardRouter.get("/chapters", validateQuery(chaptersQuerySchema), asyncHandler(getChaptersHandler));
analyticsDashboardRouter.get("/topics", validateQuery(topicsQuerySchema), asyncHandler(getTopicsHandler));
analyticsDashboardRouter.get("/progress", validateQuery(dashboardProgressQuerySchema), asyncHandler(getProgressHandler));
analyticsDashboardRouter.get("/strengths", validateQuery(topNQuerySchema), asyncHandler(getStrengthsHandler));
analyticsDashboardRouter.get("/weaknesses", validateQuery(topNQuerySchema), asyncHandler(getWeaknessesHandler));
analyticsDashboardRouter.get("/summary", asyncHandler(getSummaryHandler));
