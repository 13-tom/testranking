import { Router } from "express";
import { createQuestion, getQuestion, updateQuestion } from "../controllers/question.controller.js";
import { createOption, updateOption } from "../controllers/question-option.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validate.js";
import {
  questionCreateSchema,
  questionOptionCreateSchema,
  questionOptionUpdateSchema,
  questionUpdateSchema,
} from "../validators/question-bank.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminQuestionRouter = Router();

adminQuestionRouter.post("/", authenticate, requireAdmin, validateBody(questionCreateSchema), asyncHandler(createQuestion));
adminQuestionRouter.get("/:id", authenticate, requireAdmin, asyncHandler(getQuestion));
adminQuestionRouter.patch("/:id", authenticate, requireAdmin, validateBody(questionUpdateSchema), asyncHandler(updateQuestion));

adminQuestionRouter.post(
  "/:questionId/options",
  authenticate,
  requireAdmin,
  validateBody(questionOptionCreateSchema),
  asyncHandler(createOption),
);
adminQuestionRouter.patch(
  "/:questionId/options/:optionId",
  authenticate,
  requireAdmin,
  validateBody(questionOptionUpdateSchema),
  asyncHandler(updateOption),
);
