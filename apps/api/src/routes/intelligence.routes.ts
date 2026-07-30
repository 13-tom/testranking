import { Router } from "express";
import {
  getConsistencyHandler,
  getDifficultyHandler,
  getImprovementHandler,
  getLearningPatternsHandler,
  getMasteryHandler,
  getReadinessHandler,
} from "../controllers/intelligence.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import { improvementQuerySchema, intelligenceLimitQuerySchema } from "../validators/intelligence.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const intelligenceRouter = Router();

intelligenceRouter.use(authenticate);
intelligenceRouter.get("/mastery", validateQuery(intelligenceLimitQuerySchema), asyncHandler(getMasteryHandler));
intelligenceRouter.get("/readiness", asyncHandler(getReadinessHandler));
intelligenceRouter.get("/improvement", validateQuery(improvementQuerySchema), asyncHandler(getImprovementHandler));
intelligenceRouter.get("/consistency", asyncHandler(getConsistencyHandler));
intelligenceRouter.get("/difficulty", validateQuery(intelligenceLimitQuerySchema), asyncHandler(getDifficultyHandler));
intelligenceRouter.get("/learning-patterns", asyncHandler(getLearningPatternsHandler));
