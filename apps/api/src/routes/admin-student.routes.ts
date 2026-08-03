import { Router } from "express";
import {
  getStudentHandler,
  grantPointsHandler,
  listStudentsHandler,
  reactivateStudentHandler,
  suspendStudentHandler,
} from "../controllers/admin-student.controller.js";
import { authenticateAdmin } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { adminStudentsQuerySchema, grantPointsSchema, suspendStudentSchema } from "../validators/admin.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminStudentRouter = Router();

adminStudentRouter.get("/", authenticateAdmin, validateQuery(adminStudentsQuerySchema), asyncHandler(listStudentsHandler));
adminStudentRouter.get("/:id", authenticateAdmin, asyncHandler(getStudentHandler));
adminStudentRouter.patch("/:id/suspend", authenticateAdmin, validateBody(suspendStudentSchema), asyncHandler(suspendStudentHandler));
adminStudentRouter.patch("/:id/reactivate", authenticateAdmin, asyncHandler(reactivateStudentHandler));
adminStudentRouter.post("/:id/grant-points", authenticateAdmin, validateBody(grantPointsSchema), asyncHandler(grantPointsHandler));
