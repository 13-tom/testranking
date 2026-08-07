import { prisma } from "../lib/prisma.js";
import type { ChapterCreateInput, ChaptersQuery, ChapterUpdateInput } from "../validators/question-bank.validators.js";

export function findActiveChapters(filter: ChaptersQuery) {
  return prisma.chapter.findMany({
    where: {
      isActive: true,
      subjectId: filter.subjectId,
      subject: {
        isActive: true,
        board: { isActive: true },
        class: filter.class,
      },
    },
    orderBy: { displayOrder: "asc" },
  });
}

export function findChapterById(id: string) {
  return prisma.chapter.findUnique({ where: { id } });
}

export function findAllChapters(filter: { subjectId?: string }) {
  return prisma.chapter.findMany({
    where: filter.subjectId ? { subjectId: filter.subjectId } : {},
    orderBy: { displayOrder: "asc" },
  });
}

export function createChapter(input: ChapterCreateInput) {
  return prisma.chapter.create({ data: input });
}

export function updateChapter(id: string, input: ChapterUpdateInput) {
  return prisma.chapter.update({ where: { id }, data: input });
}
