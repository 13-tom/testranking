import { Router } from "express";
import {
  activateSchoolHandler,
  archiveSchoolHandler,
  getSchoolHandler,
  getSchoolStatsHandler,
  listSchoolsHandler,
} from "../controllers/admin-school.controller.js";
import { authenticateAdmin } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import { adminSchoolsQuerySchema } from "../validators/admin.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminSchoolRouter = Router();

adminSchoolRouter.get("/", authenticateAdmin, validateQuery(adminSchoolsQuerySchema), asyncHandler(listSchoolsHandler));
adminSchoolRouter.get("/:id", authenticateAdmin, asyncHandler(getSchoolHandler));
adminSchoolRouter.get("/:id/stats", authenticateAdmin, asyncHandler(getSchoolStatsHandler));
adminSchoolRouter.patch("/:id/archive", authenticateAdmin, asyncHandler(archiveSchoolHandler));
adminSchoolRouter.patch("/:id/activate", authenticateAdmin, asyncHandler(activateSchoolHandler));
