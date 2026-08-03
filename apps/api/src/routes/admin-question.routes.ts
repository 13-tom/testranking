import { Router } from "express";
import { createQuestion, getQuestion, updateQuestion } from "../controllers/question.controller.js";
import { createOption, updateOption } from "../controllers/question-option.controller.js";
import {
  archiveQuestionHandler,
  approveQuestionHandler,
  bulkApproveQuestionsHandler,
  bulkArchiveQuestionsHandler,
  bulkRejectQuestionsHandler,
  getReviewQueueHandler,
  rejectQuestionHandler,
} from "../controllers/admin-question-moderation.controller.js";
import { authenticateAdmin } from "../middleware/authenticate.js";
import { validateBody, validateQuery } from "../middleware/validate.js";
import {
  questionCreateSchema,
  questionOptionCreateSchema,
  questionOptionUpdateSchema,
  questionUpdateSchema,
} from "../validators/question-bank.validators.js";
import { bulkQuestionIdsSchema, reviewQueueQuerySchema } from "../validators/admin.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminQuestionRouter = Router();

// Mounted before /:id so "review" isn't captured as an id param.
adminQuestionRouter.get("/review", authenticateAdmin, validateQuery(reviewQueueQuerySchema), asyncHandler(getReviewQueueHandler));
adminQuestionRouter.post("/bulk-approve", authenticateAdmin, validateBody(bulkQuestionIdsSchema), asyncHandler(bulkApproveQuestionsHandler));
adminQuestionRouter.post("/bulk-reject", authenticateAdmin, validateBody(bulkQuestionIdsSchema), asyncHandler(bulkRejectQuestionsHandler));
adminQuestionRouter.post("/bulk-archive", authenticateAdmin, validateBody(bulkQuestionIdsSchema), asyncHandler(bulkArchiveQuestionsHandler));

adminQuestionRouter.post("/", authenticateAdmin, validateBody(questionCreateSchema), asyncHandler(createQuestion));
adminQuestionRouter.get("/:id", authenticateAdmin, asyncHandler(getQuestion));
adminQuestionRouter.patch("/:id", authenticateAdmin, validateBody(questionUpdateSchema), asyncHandler(updateQuestion));
adminQuestionRouter.patch("/:id/approve", authenticateAdmin, asyncHandler(approveQuestionHandler));
adminQuestionRouter.patch("/:id/reject", authenticateAdmin, asyncHandler(rejectQuestionHandler));
adminQuestionRouter.patch("/:id/archive", authenticateAdmin, asyncHandler(archiveQuestionHandler));

adminQuestionRouter.post(
  "/:questionId/options",
  authenticateAdmin,
  validateBody(questionOptionCreateSchema),
  asyncHandler(createOption),
);
adminQuestionRouter.patch(
  "/:questionId/options/:optionId",
  authenticateAdmin,
  validateBody(questionOptionUpdateSchema),
  asyncHandler(updateOption),
);
