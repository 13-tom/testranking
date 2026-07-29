import { Router } from "express";
import { getAttemptState, getResult, postAutoSubmit, postSubmit, putAnswer } from "../controllers/test-attempt.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { saveAnswerSchema } from "../validators/test-engine.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const testAttemptRouter = Router();

testAttemptRouter.get("/:attemptId", authenticate, asyncHandler(getAttemptState));
testAttemptRouter.put(
  "/:attemptId/answers/:questionId",
  authenticate,
  validateBody(saveAnswerSchema),
  asyncHandler(putAnswer),
);
testAttemptRouter.post("/:attemptId/submit", authenticate, asyncHandler(postSubmit));
testAttemptRouter.post("/:attemptId/auto-submit", authenticate, asyncHandler(postAutoSubmit));
testAttemptRouter.get("/:attemptId/result", authenticate, asyncHandler(getResult));
