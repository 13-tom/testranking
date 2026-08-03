import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";
import type { PoolQuestion } from "../rules/test-selection.rules.js";

const TEST_SCOPE_INCLUDE = { testSubjects: true, testChapters: true, testTopics: true } as const;

export function findTestById(id: string) {
  return prisma.test.findUnique({ where: { id }, include: TEST_SCOPE_INCLUDE });
}

export function findPublicTests(filter: { class?: number; boardId?: string; category?: string; subjectId?: string }) {
  return prisma.test.findMany({
    where: {
      status: "ACTIVE",
      isActive: true,
      visibility: "PUBLIC",
      class: filter.class,
      boardId: filter.boardId,
      category: filter.category as Prisma.EnumTestCategoryFilter["equals"],
      testSubjects: filter.subjectId ? { some: { subjectId: filter.subjectId } } : undefined,
    },
    orderBy: { createdAt: "desc" },
  });
}

export function findActivePublicTestById(id: string) {
  return prisma.test.findFirst({ where: { id, status: "ACTIVE", isActive: true, visibility: "PUBLIC" } });
}

// Phase 9 (Admin Panel, BR-046): admin list, all statuses (not just
// ACTIVE/PUBLIC like findPublicTests) — cursor-paginated, newest first.
export function findAdminTests(
  filter: { status?: string; class?: number },
  cursor: { createdAt: Date; id: string } | null,
  limit: number,
) {
  return prisma.test.findMany({
    where: {
      status: filter.status as Prisma.EnumTestStatusFilter["equals"],
      class: filter.class,
      ...(cursor ? { OR: [{ createdAt: { lt: cursor.createdAt } }, { createdAt: cursor.createdAt, id: { lt: cursor.id } }] } : {}),
    },
    orderBy: [{ createdAt: "desc" }, { id: "desc" }],
    take: limit,
  });
}

export function createTest(
  data: Omit<Prisma.TestCreateInput, "testSubjects" | "testChapters" | "testTopics">,
  scope: { subjectIds: string[]; chapterIds: string[]; topicIds: string[] },
) {
  return prisma.test.create({
    data: {
      ...data,
      testSubjects: { create: scope.subjectIds.map((subjectId) => ({ subjectId })) },
      testChapters: { create: scope.chapterIds.map((chapterId) => ({ chapterId })) },
      testTopics: { create: scope.topicIds.map((topicId) => ({ topicId })) },
    },
    include: TEST_SCOPE_INCLUDE,
  });
}

export async function updateTest(
  id: string,
  data: Prisma.TestUpdateInput,
  scope?: { subjectIds: string[]; chapterIds: string[]; topicIds: string[] },
) {
  if (scope) {
    await prisma.$transaction([
      prisma.testSubject.deleteMany({ where: { testId: id } }),
      prisma.testChapter.deleteMany({ where: { testId: id } }),
      prisma.testTopic.deleteMany({ where: { testId: id } }),
      prisma.testSubject.createMany({ data: scope.subjectIds.map((subjectId) => ({ testId: id, subjectId })) }),
      prisma.testChapter.createMany({ data: scope.chapterIds.map((chapterId) => ({ testId: id, chapterId })) }),
      prisma.testTopic.createMany({ data: scope.topicIds.map((topicId) => ({ testId: id, topicId })) }),
    ]);
  }
  return prisma.test.update({ where: { id }, data, include: TEST_SCOPE_INCLUDE });
}

type QuestionPoolRow = {
  id: string;
  topicId: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  topic: { chapterId: string; chapter: { subjectId: string } };
};

function toPoolQuestions(rows: QuestionPoolRow[]): PoolQuestion[] {
  return rows.map((r) => ({
    questionId: r.id,
    topicId: r.topicId,
    chapterId: r.topic.chapterId,
    subjectId: r.topic.chapter.subjectId,
    difficulty: r.difficulty,
  }));
}

const POOL_SELECT = {
  id: true,
  topicId: true,
  difficulty: true,
  topic: { select: { chapterId: true, chapter: { select: { subjectId: true } } } },
} as const;

export async function findPublishedQuestionPoolByTopicIds(topicIds: string[]): Promise<PoolQuestion[]> {
  if (topicIds.length === 0) return [];
  const rows = await prisma.question.findMany({
    where: { topicId: { in: topicIds }, status: "PUBLISHED", isActive: true },
    select: POOL_SELECT,
  });
  return toPoolQuestions(rows);
}

export async function findPublishedQuestionPoolByChapterIds(chapterIds: string[]): Promise<PoolQuestion[]> {
  if (chapterIds.length === 0) return [];
  const rows = await prisma.question.findMany({
    where: { topic: { chapterId: { in: chapterIds } }, status: "PUBLISHED", isActive: true },
    select: POOL_SELECT,
  });
  return toPoolQuestions(rows);
}

export async function findPublishedQuestionPoolBySubjectIds(subjectIds: string[]): Promise<PoolQuestion[]> {
  if (subjectIds.length === 0) return [];
  const rows = await prisma.question.findMany({
    where: { topic: { chapter: { subjectId: { in: subjectIds } } }, status: "PUBLISHED", isActive: true },
    select: POOL_SELECT,
  });
  return toPoolQuestions(rows);
}

export function countTestsByStatus() {
  return prisma.test.groupBy({ by: ["status"], _count: { _all: true } });
}

export function findChapterIdsBySubjectIds(subjectIds: string[]) {
  return prisma.chapter.findMany({ where: { subjectId: { in: subjectIds } }, select: { id: true } });
}

export function findTopicIdsByChapterIds(chapterIds: string[]) {
  return prisma.topic.findMany({ where: { chapterId: { in: chapterIds } }, select: { id: true } });
}
