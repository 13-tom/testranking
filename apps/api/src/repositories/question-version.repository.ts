import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

export function findLatestQuestionVersion(questionId: string) {
  return prisma.questionVersion.findFirst({
    where: { questionId },
    orderBy: { version: "desc" },
  });
}

export function createQuestionVersion(data: Prisma.QuestionVersionCreateInput) {
  return prisma.questionVersion.create({ data });
}

export function findQuestionVersionById(id: string) {
  return prisma.questionVersion.findUniqueOrThrow({ where: { id } });
}
