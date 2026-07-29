import { Router } from "express";
import { createTest, getAdminTestById, publishTest, updateTest } from "../controllers/test.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validate.js";
import { testCreateSchema, testUpdateSchema } from "../validators/test-engine.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminTestRouter = Router();

adminTestRouter.post("/", authenticate, requireAdmin, validateBody(testCreateSchema), asyncHandler(createTest));
adminTestRouter.get("/:id", authenticate, requireAdmin, asyncHandler(getAdminTestById));
adminTestRouter.patch("/:id", authenticate, requireAdmin, validateBody(testUpdateSchema), asyncHandler(updateTest));
adminTestRouter.patch("/:id/publish", authenticate, requireAdmin, asyncHandler(publishTest));
