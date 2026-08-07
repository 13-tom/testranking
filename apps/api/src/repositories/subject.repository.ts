import { prisma } from "../lib/prisma.js";
import type { SubjectCreateInput, SubjectUpdateInput } from "../validators/question-bank.validators.js";

export function findActiveSubjects() {
  return prisma.subject.findMany({
    where: { isActive: true, board: { isActive: true } },
    orderBy: { displayOrder: "asc" },
  });
}

export function findAllSubjects() {
  return prisma.subject.findMany({ orderBy: { displayOrder: "asc" } });
}

export function findActiveSubjectById(id: string) {
  return prisma.subject.findFirst({
    where: { id, isActive: true, board: { isActive: true } },
  });
}

export function findSubjectById(id: string) {
  return prisma.subject.findUnique({ where: { id } });
}

export function createSubject(input: SubjectCreateInput) {
  return prisma.subject.create({ data: input });
}

export function updateSubject(id: string, input: SubjectUpdateInput) {
  return prisma.subject.update({ where: { id }, data: input });
}
