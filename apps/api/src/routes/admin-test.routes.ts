import { Router } from "express";
import {
  createTest,
  getAdminTestById,
  listAdminTests,
  publishTest,
  unpublishTest,
  updateTest,
} from "../controllers/test.controller.js";
import { authenticateAdmin } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { testCreateSchema, testUpdateSchema } from "../validators/test-engine.validators.js";
import { adminTestsQuerySchema } from "../validators/admin.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminTestRouter = Router();

adminTestRouter.get("/", authenticateAdmin, validateQuery(adminTestsQuerySchema), asyncHandler(listAdminTests));
adminTestRouter.post("/", authenticateAdmin, validateBody(testCreateSchema), asyncHandler(createTest));
adminTestRouter.get("/:id", authenticateAdmin, asyncHandler(getAdminTestById));
adminTestRouter.patch("/:id", authenticateAdmin, validateBody(testUpdateSchema), asyncHandler(updateTest));
adminTestRouter.patch("/:id/publish", authenticateAdmin, asyncHandler(publishTest));
adminTestRouter.patch("/:id/unpublish", authenticateAdmin, asyncHandler(unpublishTest));
