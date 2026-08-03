import { Prisma } from "@prisma/client";
import type { AdminTest, AdminTestListResponseData, TestDetailResponseData, TestListResponseData } from "@board-ranking/shared";
import { ConflictError, NotFoundError, ValidationError } from "../errors/AppError.js";
import {
  createTest as createTestRepo,
  findActivePublicTestById,
  findAdminTests,
  findPublicTests,
  findPublishedQuestionPoolBySubjectIds,
  findTestById,
  updateTest as updateTestRepo,
} from "../repositories/test.repository.js";
import { evaluatePoolGate } from "../rules/test-pool-gate.rules.js";
import { decodeAdminCursor, encodeAdminCursor, evaluateTestUnpublish } from "../rules/admin.rules.js";
import type { TestCreateInput, TestsQuery, TestUpdateInput } from "../validators/test-engine.validators.js";
import type { AdminTestsQuery } from "../validators/admin.validators.js";

export async function listPublicTests(filter: TestsQuery): Promise<TestListResponseData> {
  const tests = await findPublicTests(filter);
  return tests.map(toSummary);
}

export async function getPublicTestById(id: string): Promise<TestDetailResponseData> {
  const test = await findActivePublicTestById(id);
  if (!test) {
    throw new NotFoundError("Test not found");
  }
  return toSummary(test);
}

export async function createTest(input: TestCreateInput, createdBy: string): Promise<AdminTest> {
  try {
    const test = await createTestRepo(
      {
        name: input.name,
        description: input.description,
        board: { connect: { id: input.boardId } },
        class: input.class,
        questionCount: input.questionCount,
        difficultyDistribution: input.difficultyDistribution,
        questionTypeDistribution: input.questionTypeDistribution ?? { MCQ: 100 },
        positiveMarks: input.positiveMarks ?? 1,
        negativeMarks: input.negativeMarks ?? 0,
        language: input.language ?? "en",
        duration: input.duration,
        passingMarks: input.passingMarks,
        shuffleQuestions: input.shuffleQuestions ?? true,
        shuffleOptions: input.shuffleOptions ?? true,
        visibility: input.visibility ?? "PUBLIC",
        category: input.category,
        mode: input.mode ?? "PRACTICE",
        startTime: input.startTime,
        endTime: input.endTime,
        instructions: input.instructions,
        calculatorAllowed: input.calculatorAllowed ?? false,
        reviewAllowed: input.reviewAllowed ?? true,
        resultPublishPolicy: input.resultPublishPolicy ?? "IMMEDIATE",
        rankingScope: input.rankingScope ?? "NONE",
        maxAttempts: input.maxAttempts ?? 1,
        createdBy,
      },
      { subjectIds: input.subjectIds, chapterIds: input.chapterIds ?? [], topicIds: input.topicIds ?? [] },
    );
    return toAdminTest(test);
  } catch (err) {
    throw mapForeignKeyError(err);
  }
}

export async function updateTest(id: string, input: TestUpdateInput): Promise<AdminTest> {
  const existing = await findTestById(id);
  if (!existing) {
    throw new NotFoundError("Test not found");
  }

  const scope =
    input.subjectIds || input.chapterIds || input.topicIds
      ? {
          subjectIds: input.subjectIds ?? existing.testSubjects.map((s) => s.subjectId),
          chapterIds: input.chapterIds ?? existing.testChapters.map((c) => c.chapterId),
          topicIds: input.topicIds ?? existing.testTopics.map((t) => t.topicId),
        }
      : undefined;

  try {
    const test = await updateTestRepo(
      id,
      {
        name: input.name,
        description: input.description,
        board: input.boardId ? { connect: { id: input.boardId } } : undefined,
        class: input.class,
        questionCount: input.questionCount,
        difficultyDistribution: input.difficultyDistribution,
        questionTypeDistribution: input.questionTypeDistribution,
        positiveMarks: input.positiveMarks,
        negativeMarks: input.negativeMarks,
        language: input.language,
        duration: input.duration,
        passingMarks: input.passingMarks,
        shuffleQuestions: input.shuffleQuestions,
        shuffleOptions: input.shuffleOptions,
        visibility: input.visibility,
        category: input.category,
        mode: input.mode,
        startTime: input.startTime,
        endTime: input.endTime,
        instructions: input.instructions,
        calculatorAllowed: input.calculatorAllowed,
        reviewAllowed: input.reviewAllowed,
        resultPublishPolicy: input.resultPublishPolicy,
        rankingScope: input.rankingScope,
        maxAttempts: input.maxAttempts,
        isActive: input.isActive,
      },
      scope,
    );
    return toAdminTest(test);
  } catch (err) {
    throw mapForeignKeyError(err);
  }
}

export async function getAdminTest(id: string): Promise<AdminTest> {
  const test = await findTestById(id);
  if (!test) {
    throw new NotFoundError("Test not found");
  }
  return toAdminTest(test);
}

// DRAFT -> ACTIVE pool gate: docs/04_database.md / docs/05_API_Blueprint.md
// both assert a gate exists ("validates question pool size and difficulty
// distribution") without giving an exact formula — apps/api/src/rules/
// test-pool-gate.rules.ts::evaluatePoolGate is our concrete definition of
// it. Checked against the widest (subject-tier) pool, since that's the
// ceiling the generation algorithm can ultimately draw from.
export async function publishTest(id: string): Promise<AdminTest> {
  const test = await findTestById(id);
  if (!test) {
    throw new NotFoundError("Test not found");
  }
  if (test.status !== "DRAFT") {
    throw new ConflictError("Only a DRAFT test can be published");
  }

  const subjectIds = test.testSubjects.map((s) => s.subjectId);
  const pool = await findPublishedQuestionPoolBySubjectIds(subjectIds);
  const poolCounts = { EASY: 0, MEDIUM: 0, HARD: 0 };
  for (const q of pool) {
    poolCounts[q.difficulty] += 1;
  }

  const gate = evaluatePoolGate(test.questionCount, test.difficultyDistribution as Record<string, number>, poolCounts);
  if (!gate.valid) {
    throw new ConflictError("Question pool cannot satisfy this blueprint", gate.errors);
  }

  const updated = await updateTestRepo(id, { status: "ACTIVE" });
  return toAdminTest(updated);
}

const DEFAULT_ADMIN_TEST_LIMIT = 20;

export async function listAdminTests(query: AdminTestsQuery): Promise<AdminTestListResponseData> {
  const limit = query.limit ?? DEFAULT_ADMIN_TEST_LIMIT;
  const cursor = decodeAdminCursor(query.cursor);
  const rows = await findAdminTests({ status: query.status, class: query.class }, cursor, limit);

  const items = rows.map(toSummary);
  const last = rows[rows.length - 1];
  const nextCursor = rows.length === limit && last ? encodeAdminCursor({ createdAt: last.createdAt, id: last.id }) : null;

  return { items, nextCursor };
}

// ACTIVE -> DRAFT: the inverse of publishTest's DRAFT -> ACTIVE pool-gate
// check (BR-046) — no gate needed going backwards, only a status guard.
export async function unpublishTest(id: string): Promise<AdminTest> {
  const test = await findTestById(id);
  if (!test) {
    throw new NotFoundError("Test not found");
  }
  const evaluation = evaluateTestUnpublish(test.status);
  if (!evaluation.valid) {
    throw new ConflictError(evaluation.error ?? "Invalid test status transition");
  }
  const updated = await updateTestRepo(id, { status: "DRAFT" });
  return toAdminTest(updated);
}

function mapForeignKeyError(err: unknown): unknown {
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2003") {
    return new ValidationError("Invalid boardId, subjectId, chapterId, or topicId reference");
  }
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
    return new ConflictError("A conflicting test already exists");
  }
  return err;
}

type TestRow = {
  id: string;
  name: string;
  description: string | null;
  boardId: string;
  class: number;
  category: string;
  mode: string;
  duration: number;
  questionCount: number;
  positiveMarks: number;
  negativeMarks: number;
  passingMarks: number;
  visibility: string;
  status: string;
  startTime: Date | null;
  endTime: Date | null;
  maxAttempts: number;
  instructions: string | null;
  calculatorAllowed: boolean;
  reviewAllowed: boolean;
};

function toSummary(test: TestRow) {
  return {
    id: test.id,
    name: test.name,
    description: test.description,
    boardId: test.boardId,
    class: test.class,
    category: test.category as AdminTest["category"],
    mode: test.mode as AdminTest["mode"],
    duration: test.duration,
    questionCount: test.questionCount,
    positiveMarks: test.positiveMarks,
    negativeMarks: test.negativeMarks,
    passingMarks: test.passingMarks,
    visibility: test.visibility as AdminTest["visibility"],
    status: test.status as AdminTest["status"],
    startTime: test.startTime ? test.startTime.toISOString() : null,
    endTime: test.endTime ? test.endTime.toISOString() : null,
    maxAttempts: test.maxAttempts,
    instructions: test.instructions,
    calculatorAllowed: test.calculatorAllowed,
    reviewAllowed: test.reviewAllowed,
  };
}

type AdminTestRow = TestRow & {
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
  testSubjects: Array<{ subjectId: string }>;
  testChapters: Array<{ chapterId: string }>;
  testTopics: Array<{ topicId: string }>;
  difficultyDistribution: Prisma.JsonValue;
  questionTypeDistribution: Prisma.JsonValue;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  language: string;
  rankingScope: string;
  resultPublishPolicy: string;
};

function toAdminTest(test: AdminTestRow): AdminTest {
  return {
    ...toSummary(test),
    createdBy: test.createdBy,
    createdAt: test.createdAt.toISOString(),
    updatedAt: test.updatedAt.toISOString(),
    isActive: test.isActive,
    subjectIds: test.testSubjects.map((s) => s.subjectId),
    chapterIds: test.testChapters.map((c) => c.chapterId),
    topicIds: test.testTopics.map((t) => t.topicId),
    difficultyDistribution: test.difficultyDistribution as Record<string, number>,
    questionTypeDistribution: test.questionTypeDistribution as Record<string, number>,
    shuffleQuestions: test.shuffleQuestions,
    shuffleOptions: test.shuffleOptions,
    language: test.language,
    rankingScope: test.rankingScope as AdminTest["rankingScope"],
    resultPublishPolicy: test.resultPublishPolicy as AdminTest["resultPublishPolicy"],
  };
}
