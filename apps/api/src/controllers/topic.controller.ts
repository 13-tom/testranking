import type { Request, Response } from "express";
import type { AdminTopic, ApiResponse } from "@board-ranking/shared";
import { createTopic as createTopicService, updateTopic as updateTopicService } from "../services/topic.service.js";
import type { TopicCreateInput, TopicUpdateInput } from "../validators/question-bank.validators.js";

export async function createTopic(req: Request, res: Response): Promise<void> {
  const data = await createTopicService(req.body as TopicCreateInput);
  const body: ApiResponse<AdminTopic> = { success: true, message: "Topic created", data };
  res.status(201).json(body);
}

export async function updateTopic(req: Request, res: Response): Promise<void> {
  const data = await updateTopicService(req.params.id as string, req.body as TopicUpdateInput);
  const body: ApiResponse<AdminTopic> = { success: true, message: "Topic updated", data };
  res.status(200).json(body);
}
