import { Router } from "express";
import { createTopic, updateTopic } from "../controllers/topic.controller.js";
import { authenticateAdmin } from "../middleware/authenticate.js";
import { validateBody } from "../middleware/validate.js";
import { topicCreateSchema, topicUpdateSchema } from "../validators/question-bank.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminTopicRouter = Router();

adminTopicRouter.post("/", authenticateAdmin, validateBody(topicCreateSchema), asyncHandler(createTopic));
adminTopicRouter.patch("/:id", authenticateAdmin, validateBody(topicUpdateSchema), asyncHandler(updateTopic));
