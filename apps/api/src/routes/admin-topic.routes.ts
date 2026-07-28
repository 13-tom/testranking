import { Router } from "express";
import { createTopic, updateTopic } from "../controllers/topic.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import { validateBody } from "../middleware/validate.js";
import { topicCreateSchema, topicUpdateSchema } from "../validators/question-bank.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminTopicRouter = Router();

adminTopicRouter.post("/", authenticate, requireAdmin, validateBody(topicCreateSchema), asyncHandler(createTopic));
adminTopicRouter.patch("/:id", authenticate, requireAdmin, validateBody(topicUpdateSchema), asyncHandler(updateTopic));
