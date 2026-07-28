import { Prisma } from "@prisma/client";
import type { AdminTopic } from "@board-ranking/shared";
import { ConflictError, NotFoundError } from "../errors/AppError.js";
import {
  createTopic as createTopicRepo,
  findTopicById,
  updateTopic as updateTopicRepo,
} from "../repositories/topic.repository.js";
import type { TopicCreateInput, TopicUpdateInput } from "../validators/question-bank.validators.js";

export async function createTopic(input: TopicCreateInput): Promise<AdminTopic> {
  try {
    const topic = await createTopicRepo(input);
    return topic;
  } catch (err) {
    throw mapConflict(err, "A topic with this name already exists for this chapter");
  }
}

export async function updateTopic(id: string, input: TopicUpdateInput): Promise<AdminTopic> {
  const existing = await findTopicById(id);
  if (!existing) {
    throw new NotFoundError("Topic not found");
  }
  try {
    return await updateTopicRepo(id, input);
  } catch (err) {
    throw mapConflict(err, "A topic with this name already exists for this chapter");
  }
}

function mapConflict(err: unknown, message: string): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return new ConflictError(message);
  }
  return err;
}
