import { Router } from "express";
import {
  getAnalyticsChapterDetail,
  getAnalyticsOverview,
  getAnalyticsProgress,
  getAnalyticsSubjectDetail,
  getAnalyticsSubjects,
  getAnalyticsTopicDetail,
} from "../controllers/analytics.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import { progressQuerySchema } from "../validators/analytics.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.get("/overview", asyncHandler(getAnalyticsOverview));
analyticsRouter.get("/subjects", asyncHandler(getAnalyticsSubjects));
analyticsRouter.get("/subjects/:subjectId", asyncHandler(getAnalyticsSubjectDetail));
analyticsRouter.get("/chapters/:chapterId", asyncHandler(getAnalyticsChapterDetail));
analyticsRouter.get("/topics/:topicId", asyncHandler(getAnalyticsTopicDetail));
analyticsRouter.get("/progress", validateQuery(progressQuerySchema), asyncHandler(getAnalyticsProgress));
