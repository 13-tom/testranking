import { prisma } from "../lib/prisma.js";
import type { QuestionOptionCreateInput, QuestionOptionUpdateInput } from "../validators/question-bank.validators.js";

export function findActiveOptionsByQuestionId(questionId: string) {
  return prisma.questionOption.findMany({ where: { questionId, isActive: true } });
}

export function findOptionById(id: string) {
  return prisma.questionOption.findUnique({ where: { id } });
}

export function createOption(questionId: string, input: QuestionOptionCreateInput) {
  return prisma.questionOption.create({ data: { ...input, questionId } });
}

export function updateOption(id: string, input: QuestionOptionUpdateInput) {
  return prisma.questionOption.update({ where: { id }, data: input });
}
