import { Router } from "express";
import {
  getPriorityQueueHandler,
  getRevisionPlanHandler,
  getWeaknessChaptersHandler,
  getWeaknessOverviewHandler,
  getWeaknessSubjectsHandler,
  getWeaknessTopicsHandler,
} from "../controllers/weakness.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import { revisionPlanQuerySchema, weaknessListQuerySchema } from "../validators/weakness.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const weaknessRouter = Router();

weaknessRouter.use(authenticate);
weaknessRouter.get("/overview", asyncHandler(getWeaknessOverviewHandler));
weaknessRouter.get("/subjects", asyncHandler(getWeaknessSubjectsHandler));
weaknessRouter.get("/chapters", validateQuery(weaknessListQuerySchema), asyncHandler(getWeaknessChaptersHandler));
weaknessRouter.get("/topics", validateQuery(weaknessListQuerySchema), asyncHandler(getWeaknessTopicsHandler));
weaknessRouter.get("/revision-plan", validateQuery(revisionPlanQuerySchema), asyncHandler(getRevisionPlanHandler));
weaknessRouter.get("/priority-queue", validateQuery(weaknessListQuerySchema), asyncHandler(getPriorityQueueHandler));
