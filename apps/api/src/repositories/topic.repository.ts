import { prisma } from "../lib/prisma.js";
import type { TopicCreateInput, TopicUpdateInput } from "../validators/question-bank.validators.js";

export function findTopicById(id: string) {
  return prisma.topic.findUnique({ where: { id } });
}

export function findAllTopics(filter: { chapterId?: string }) {
  return prisma.topic.findMany({
    where: filter.chapterId ? { chapterId: filter.chapterId } : {},
    orderBy: { displayOrder: "asc" },
  });
}

export function findTopicWithHierarchyById(id: string) {
  return prisma.topic.findUnique({
    where: { id },
    include: { chapter: { include: { subject: true } } },
  });
}

export function createTopic(input: TopicCreateInput) {
  return prisma.topic.create({ data: input });
}

export function updateTopic(id: string, input: TopicUpdateInput) {
  return prisma.topic.update({ where: { id }, data: input });
}
