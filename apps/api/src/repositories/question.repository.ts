import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export function countQuestionsInChapter(chapterId: string) {
  return prisma.question.count({ where: { topic: { chapterId } } });
}

export function createQuestion(data: Prisma.QuestionCreateInput) {
  return prisma.question.create({ data, include: { options: true } });
}

export function findQuestionById(id: string) {
  return prisma.question.findUnique({ where: { id }, include: { options: true } });
}

export function updateQuestion(id: string, data: Prisma.QuestionUpdateInput) {
  return prisma.question.update({ where: { id }, data, include: { options: true } });
}
