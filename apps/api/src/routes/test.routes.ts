import { Router } from "express";
import { getTest, listTests } from "../controllers/test.controller.js";
import { postStartAttempt } from "../controllers/test-attempt.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import { startAttemptSchema, testsQuerySchema } from "../validators/test-engine.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const testRouter = Router();

testRouter.get("/", validateQuery(testsQuerySchema), asyncHandler(listTests));
testRouter.get("/:id", asyncHandler(getTest));
testRouter.post("/:testId/attempts", authenticate, validateBody(startAttemptSchema), asyncHandler(postStartAttempt));
