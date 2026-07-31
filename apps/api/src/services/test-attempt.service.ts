import { randomInt } from "node:crypto";
import { Prisma } from "@prisma/client";
import type {
  AttemptResultResponseData,
  AttemptStateResponseData,
  SaveAnswerResponseData,
} from "@board-ranking/shared";
import { ConflictError, ForbiddenError, NotFoundError, ValidationError } from "../errors/AppError.js";
import { prisma } from "../lib/prisma.js";
import { logger } from "../lib/logger.js";
import { findQuestionById } from "../repositories/question.repository.js";
import {
  createQuestionVersion,
  findLatestQuestionVersion,
} from "../repositories/question-version.repository.js";
import {
  findChapterIdsBySubjectIds,
  findPublishedQuestionPoolByChapterIds,
  findPublishedQuestionPoolBySubjectIds,
  findPublishedQuestionPoolByTopicIds,
  findTestById,
  findTopicIdsByChapterIds,
} from "../repositories/test.repository.js";
import {
  claimAttemptForSubmission,
  countNonActiveAttempts,
  createAttempt,
  findActiveAttempt,
  findAttemptById,
  findMostRecentAttempt,
  findStudentAnswer,
  upsertStudentAnswer,
} from "../repositories/test-attempt.repository.js";
import {
  buildQuestionSnapshot,
  correctKeyFromSnapshot,
  isSnapshotCurrent,
  type QuestionSnapshot,
} from "../rules/question-version.rules.js";
import type { PoolQuestion } from "../rules/test-selection.rules.js";
import { buildOptionOrder, finalizeQuestionOrder, selectQuestionsForBlueprint } from "../rules/test-selection.rules.js";
import { POINTS_PER_CORRECT_ANSWER, scoreQuestions } from "../rules/test-scoring.rules.js";
import type { SaveAnswerInput, StartAttemptInput } from "../validators/test-engine.validators.js";
import { triggerAnalyticsUpdate } from "./analytics.service.js";
import { triggerRankingForAttempt } from "./ranking-calculation.service.js";
import { triggerGamificationUpdate } from "./gamification.service.js";

type TestWithScope = NonNullable<Awaited<ReturnType<typeof findTestById>>>;
type AttemptWithRelations = NonNullable<Awaited<ReturnType<typeof findAttemptById>>>;

// --- Paper generation ---

async function resolveScopePools(test: TestWithScope): Promise<{ topic: PoolQuestion[]; chapter: PoolQuestion[]; subject: PoolQuestion[] }> {
  const subjectIds = test.testSubjects.map((s) => s.subjectId);

  let chapterIds = test.testChapters.map((c) => c.chapterId);
  if (chapterIds.length === 0) {
    const chapters = await findChapterIdsBySubjectIds(subjectIds);
    chapterIds = chapters.map((c) => c.id);
  }

  let topicIds = test.testTopics.map((t) => t.topicId);
  if (topicIds.length === 0) {
    const topics = await findTopicIdsByChapterIds(chapterIds);
    topicIds = topics.map((t) => t.id);
  }

  const [topic, chapter, subject] = await Promise.all([
    findPublishedQuestionPoolByTopicIds(topicIds),
    findPublishedQuestionPoolByChapterIds(chapterIds),
    findPublishedQuestionPoolBySubjectIds(subjectIds),
  ]);
  return { topic, chapter, subject };
}

function countByDifficulty(pool: PoolQuestion[]): Record<string, number> {
  const counts: Record<string, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  for (const q of pool) counts[q.difficulty] = (counts[q.difficulty] ?? 0) + 1;
  return counts;
}

// Reuses the question's current QuestionVersion if the live Question +
// active Options haven't changed, else creates a new one. BR-042: this is
// the only place QuestionVersion rows get created — lazily, at generation
// time, never on every Question Bank edit.
async function ensureCurrentQuestionVersion(questionId: string): Promise<{ id: string; snapshot: QuestionSnapshot }> {
  const question = await findQuestionById(questionId);
  if (!question) {
    throw new NotFoundError(`Question ${questionId} not found`);
  }
  const activeOptions = question.options.filter((o) => o.isActive);
  const currentSnapshot = buildQuestionSnapshot(question, activeOptions);

  const latest = await findLatestQuestionVersion(questionId);
  if (latest && isSnapshotCurrent(latest.snapshot as unknown as QuestionSnapshot, currentSnapshot)) {
    return { id: latest.id, snapshot: latest.snapshot as unknown as QuestionSnapshot };
  }

  try {
    const created = await createQuestionVersion({
      question: { connect: { id: questionId } },
      version: (latest?.version ?? 0) + 1,
      snapshot: currentSnapshot as unknown as Prisma.InputJsonValue,
      changeSummary: "Auto-created for test attempt generation",
    });
    return { id: created.id, snapshot: currentSnapshot };
  } catch (err) {
    // Concurrent generation for another student racing on the same
    // question's first version — the loser reuses the winner's row.
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      const winner = await findLatestQuestionVersion(questionId);
      if (winner) return { id: winner.id, snapshot: winner.snapshot as unknown as QuestionSnapshot };
    }
    throw err;
  }
}

type GeneratedPaper = {
  attemptQuestions: Array<{ questionId: string; questionVersionId: string; displayOrder: number; optionOrder: string[] }>;
  selectionMeta: Record<string, unknown>;
};

async function generatePaper(test: TestWithScope): Promise<GeneratedPaper> {
  const pools = await resolveScopePools(test);
  const seed = randomInt(0, 2 ** 31);

  const selection = selectQuestionsForBlueprint(
    pools,
    test.questionCount,
    test.difficultyDistribution as Record<string, number>,
    seed,
  );
  if (!selection.ok) {
    throw new ConflictError(
      "Cannot generate a valid paper for this blueprint",
      selection.shortfalls.map((s) => `${s.difficulty}: requires ${s.required}, only ${s.available} available`),
    );
  }

  const orderedIds = finalizeQuestionOrder(selection.questionIds, test.shuffleQuestions, seed);

  const attemptQuestions: GeneratedPaper["attemptQuestions"] = [];
  for (let i = 0; i < orderedIds.length; i++) {
    const questionId = orderedIds[i] as string;
    const version = await ensureCurrentQuestionVersion(questionId);
    const optionKeys = version.snapshot.options.map((o) => o.optionKey);
    const optionOrder = buildOptionOrder(optionKeys, test.shuffleOptions, seed, questionId);
    attemptQuestions.push({ questionId, questionVersionId: version.id, displayOrder: i + 1, optionOrder });
  }

  return {
    attemptQuestions,
    selectionMeta: {
      seed,
      blueprintSnapshot: {
        questionCount: test.questionCount,
        difficultyDistribution: test.difficultyDistribution,
        shuffleQuestions: test.shuffleQuestions,
        shuffleOptions: test.shuffleOptions,
      },
      driftPp: selection.driftPp,
      poolSizes: { topic: countByDifficulty(pools.topic), chapter: countByDifficulty(pools.chapter), subject: countByDifficulty(pools.subject) },
      retakeMode: "NEW",
    },
  };
}

// --- Attempt lifecycle ---

export async function startAttempt(testId: string, studentId: string, input: StartAttemptInput): Promise<AttemptStateResponseData> {
  const test = await findTestById(testId);
  if (!test || test.status !== "ACTIVE" || !test.isActive) {
    throw new NotFoundError("Test not found");
  }

  const existing = await findActiveAttempt(studentId, testId);
  if (existing) {
    const fresh = await ensureAttemptFreshRow(existing);
    if (fresh.status === "STARTED") {
      return toAttemptStateDto(fresh);
    }
    // fresh got closed by the lazy check — fall through to create a new one.
  }

  const retakeMode = input.retakeMode ?? "NEW";

  if (test.mode === "RANKED") {
    const nonActiveCount = await countNonActiveAttempts(studentId, testId);
    if (nonActiveCount >= test.maxAttempts) {
      throw new ConflictError(`Maximum attempts (${test.maxAttempts}) reached for this test`);
    }
  }

  let attemptQuestions: GeneratedPaper["attemptQuestions"];
  let selectionMeta: Record<string, unknown>;

  if (retakeMode === "SAME") {
    if (test.mode !== "PRACTICE") {
      throw new ValidationError("retakeMode 'SAME' is only allowed for Practice-mode tests");
    }
    const source = await findMostRecentAttempt(studentId, testId);
    if (!source) {
      throw new ConflictError("No previous attempt to repeat");
    }
    attemptQuestions = source.attemptQuestions
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map((aq) => ({
        questionId: aq.questionId,
        questionVersionId: aq.questionVersionId,
        displayOrder: aq.displayOrder,
        optionOrder: aq.optionOrder as string[],
      }));
    selectionMeta = { retakeMode: "SAME", sourceAttemptId: source.id };
  } else {
    const generated = await generatePaper(test);
    attemptQuestions = generated.attemptQuestions;
    selectionMeta = generated.selectionMeta;
  }

  const startedAt = new Date();
  const expiresAt = new Date(startedAt.getTime() + test.duration * 60_000);

  const attempt = await createAttempt(
    {
      student: { connect: { id: studentId } },
      test: { connect: { id: testId } },
      status: "STARTED",
      selectionMeta: selectionMeta as unknown as Prisma.InputJsonValue,
      startedAt,
      expiresAt,
    },
    attemptQuestions.map((aq) => ({
      questionId: aq.questionId,
      questionVersionId: aq.questionVersionId,
      displayOrder: aq.displayOrder,
      optionOrder: aq.optionOrder as unknown as Prisma.InputJsonValue,
    })),
  );

  return toAttemptStateDto(attempt);
}

export async function getAttempt(attemptId: string, studentId: string): Promise<AttemptStateResponseData> {
  const attempt = await loadOwnedAttempt(attemptId, studentId);
  const fresh = await ensureAttemptFreshRow(attempt);
  return toAttemptStateDto(fresh);
}

export async function saveAnswer(
  attemptId: string,
  studentId: string,
  questionId: string,
  input: SaveAnswerInput,
): Promise<SaveAnswerResponseData> {
  const attempt = await loadOwnedAttempt(attemptId, studentId);
  const fresh = await ensureAttemptFreshRow(attempt);
  if (fresh.status !== "STARTED") {
    throw new ConflictError("Attempt already ended");
  }

  const attemptQuestion = fresh.attemptQuestions.find((aq) => aq.questionId === questionId);
  if (!attemptQuestion) {
    throw new NotFoundError("Question is not part of this attempt");
  }

  const existingAnswer = await findStudentAnswer(attemptId, questionId);
  if (existingAnswer && input.answerSequence <= existingAnswer.answerSequence) {
    throw new ConflictError("Stale answer — a newer answer was already saved for this question");
  }

  try {
    const saved = await upsertStudentAnswer(attemptId, questionId, {
      questionVersionId: attemptQuestion.questionVersionId,
      selectedOptionKey: input.selectedOptionKey,
      answerSequence: input.answerSequence,
      clientRequestId: input.clientRequestId,
      markedForReview: input.markedForReview ?? false,
    });
    return {
      questionId: saved.questionId,
      selectedOptionKey: saved.selectedOptionKey,
      answerSequence: saved.answerSequence,
      markedForReview: saved.markedForReview,
      answeredAt: saved.answeredAt.toISOString(),
    };
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      throw new ConflictError("This answer submission has already been recorded");
    }
    throw err;
  }
}

export async function submitAttempt(
  attemptId: string,
  studentId: string,
  reason: "SUBMITTED" | "AUTO_SUBMITTED",
): Promise<AttemptResultResponseData> {
  const attempt = await loadOwnedAttempt(attemptId, studentId);

  if (attempt.status !== "STARTED") {
    // Already ended by a prior call (client submit vs. auto-submit race,
    // or a retried request) — idempotent no-op, return the persisted result.
    if (attempt.status === "EVALUATED") {
      return toResultDto(attempt);
    }
    throw new ConflictError("Attempt cannot be submitted from its current status");
  }

  const claimed = await claimAttemptForSubmission(attemptId, reason);
  if (claimed === 0) {
    const refetched = await findAttemptById(attemptId);
    if (!refetched || refetched.status === "STARTED") {
      throw new ConflictError("Attempt could not be submitted");
    }
    if (refetched.status !== "EVALUATED") {
      // Another request just claimed it (SUBMITTED/AUTO_SUBMITTED) and is
      // finishing evaluation right now — extremely narrow window; ask the
      // caller to retry the read rather than return a half-evaluated result.
      throw new ConflictError("Attempt submission is being finalized, please retry shortly");
    }
    return toResultDto(refetched);
  }

  const evaluated = await evaluateClaimedAttempt(attemptId, reason);
  return toResultDto(evaluated);
}

export async function autoSubmitAttempt(attemptId: string, studentId: string): Promise<AttemptResultResponseData> {
  return submitAttempt(attemptId, studentId, "AUTO_SUBMITTED");
}

export async function getAttemptResult(attemptId: string, studentId: string): Promise<AttemptResultResponseData> {
  const attempt = await loadOwnedAttempt(attemptId, studentId);
  const fresh = await ensureAttemptFreshRow(attempt);
  if (fresh.status !== "EVALUATED") {
    throw new ConflictError("Result not available yet");
  }

  // BR-028: only the IMMEDIATE resultPublishPolicy is enforced in this
  // phase — AFTER_END_TIME/MANUAL are documented as Sprint-6 work in the
  // source docs themselves. Left commented rather than faked:
  //
  // if (fresh.test.resultPublishPolicy === "AFTER_END_TIME" && fresh.test.endTime && fresh.test.endTime > new Date()) {
  //   throw new ConflictError("Results are published after the test window ends");
  // }
  // if (fresh.test.resultPublishPolicy === "MANUAL" && !fresh.test.resultsManuallyReleased) {
  //   throw new ConflictError("Results have not been released yet");
  // }

  return toResultDto(fresh);
}

// --- BR-027: lazy auto-submit-on-read (the working replacement for a
// background sweeper on this infra — see apps/api/src/jobs/attempt-sweeper.job.ts) ---

async function ensureAttemptFreshRow(attempt: AttemptWithRelations): Promise<AttemptWithRelations> {
  if (attempt.status === "STARTED" && attempt.expiresAt && attempt.expiresAt.getTime() <= Date.now()) {
    await submitAttempt(attempt.id, attempt.studentId, "AUTO_SUBMITTED").catch((err) => {
      logger.error({ err, attemptId: attempt.id }, "lazy auto-submit failed");
    });
    const refetched = await findAttemptById(attempt.id);
    if (refetched) return refetched;
  }
  return attempt;
}

async function loadOwnedAttempt(attemptId: string, studentId: string): Promise<AttemptWithRelations> {
  const attempt = await findAttemptById(attemptId);
  if (!attempt) {
    throw new NotFoundError("Attempt not found");
  }
  if (attempt.studentId !== studentId) {
    throw new ForbiddenError("This attempt does not belong to you");
  }
  return attempt;
}

// --- BR-026: the submission transaction (runs once the CAS claim is won) ---

async function evaluateClaimedAttempt(attemptId: string, reason: "SUBMITTED" | "AUTO_SUBMITTED"): Promise<AttemptWithRelations> {
  const attempt = await findAttemptById(attemptId);
  if (!attempt || !attempt.startedAt) {
    throw new NotFoundError("Attempt not found");
  }
  const test = attempt.test;

  const scoredQuestions = attempt.attemptQuestions.map((aq) => ({
    questionId: aq.questionId,
    correctOptionKey: correctKeyFromSnapshot(aq.questionVersion.snapshot as unknown as QuestionSnapshot),
  }));
  const answers = attempt.studentAnswers.map((a) => ({ questionId: a.questionId, selectedOptionKey: a.selectedOptionKey }));

  const result = scoreQuestions(scoredQuestions, answers, test.positiveMarks, test.negativeMarks);
  const timeTaken = Math.round((Date.now() - attempt.startedAt.getTime()) / 1000);
  const studyPointsEarned = result.correctCount * POINTS_PER_CORRECT_ANSWER;
  // BR-045: Study Points reward learning engagement, not competitive
  // standing (BR-032 already separates the two) — PRACTICE-mode
  // submissions earn points too now. Phase 4 originally gated this to
  // RANKED only; that restriction was never recorded as a BR, so this
  // corrects an undocumented deviation rather than changing an approved
  // decision.

  await prisma.$transaction(async (tx) => {
    for (const pq of result.perQuestion) {
      await tx.studentAnswer.updateMany({
        where: { attemptId, questionId: pq.questionId },
        data: { isCorrect: pq.isCorrect, marksAwarded: pq.marksAwarded },
      });
    }

    await tx.testAttempt.update({
      where: { id: attemptId },
      data: {
        status: "EVALUATED",
        score: result.score,
        totalMarks: result.totalMarks,
        percentage: result.percentage,
        accuracy: result.accuracy,
        correctCount: result.correctCount,
        wrongCount: result.wrongCount,
        unansweredCount: result.unansweredCount,
        timeTaken,
        studyPointsEarned,
      },
    });

    if (studyPointsEarned > 0) {
      await tx.studentProfile.update({
        where: { userId: attempt.studentId },
        data: { studyPoints: { increment: studyPointsEarned } },
      });
    }

    await tx.auditLog.create({
      data: {
        userId: attempt.studentId,
        eventType: "TEST_SUBMITTED",
        entityType: "TestAttempt",
        entityId: attemptId,
        metadata: { testId: attempt.testId, reason, score: result.score, mode: test.mode },
      },
    });

  });

  // Phase 6 (Ranking, BR-034/BR-044) + Phase 5 (Analytics, BR-043):
  // fire-and-forget, outside this transaction — each opens its own
  // transaction once its own inputs are computed, and analytics tolerates
  // lag same as ranking does. Phase 7 (Gamification, BR-045) is chained
  // after both settle, since it reads the just-updated StudentAnalytics
  // row and the just-computed rank (Test Submission -> Evaluation ->
  // Ranking -> Analytics Aggregation -> Gamification Update -> Dashboard
  // Read).
  void Promise.allSettled([
    triggerRankingForAttempt(attemptId).catch((err) => logger.error({ err, attemptId }, "ranking calculation failed")),
    triggerAnalyticsUpdate(attempt.studentId).catch((err) =>
      logger.error({ err, studentId: attempt.studentId }, "analytics aggregation failed"),
    ),
  ]).then(() =>
    triggerGamificationUpdate(attempt.studentId).catch((err) =>
      logger.error({ err, studentId: attempt.studentId }, "gamification update failed"),
    ),
  );

  const evaluated = await findAttemptById(attemptId);
  if (!evaluated) {
    throw new NotFoundError("Attempt not found after evaluation");
  }
  return evaluated;
}

// --- DTO mapping ---

function toAttemptStateDto(attempt: AttemptWithRelations): AttemptStateResponseData {
  const answersByQuestion = new Map(attempt.studentAnswers.map((a) => [a.questionId, a]));
  const now = Date.now();
  const remainingSeconds = attempt.expiresAt ? Math.max(0, Math.round((attempt.expiresAt.getTime() - now) / 1000)) : null;

  let answeredCount = 0;
  let markedForReviewCount = 0;

  const questions = attempt.attemptQuestions
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((aq) => {
      const snapshot = aq.questionVersion.snapshot as unknown as QuestionSnapshot;
      const answer = answersByQuestion.get(aq.questionId);
      if (answer?.selectedOptionKey) answeredCount++;
      if (answer?.markedForReview) markedForReviewCount++;

      const optionOrder = aq.optionOrder as string[];
      const optionsByKey = new Map(snapshot.options.map((o) => [o.optionKey, o]));
      const options = optionOrder
        .map((key) => optionsByKey.get(key))
        .filter((o): o is NonNullable<typeof o> => Boolean(o))
        .map((o) => ({ optionKey: o.optionKey, optionText: o.optionText, optionImage: o.optionImage }));

      return {
        questionId: aq.questionId,
        displayOrder: aq.displayOrder,
        questionText: snapshot.questionText,
        image: aq.question.image,
        difficulty: snapshot.difficulty as "EASY" | "MEDIUM" | "HARD",
        timeLimitSeconds: aq.question.timeLimitSeconds,
        options,
        selectedOptionKey: answer?.selectedOptionKey ?? null,
        markedForReview: answer?.markedForReview ?? false,
        answerSequence: answer?.answerSequence ?? 0,
      };
    });

  return {
    attemptId: attempt.id,
    testId: attempt.testId,
    testName: attempt.test.name,
    status: attempt.status,
    startedAt: attempt.startedAt ? attempt.startedAt.toISOString() : null,
    expiresAt: attempt.expiresAt ? attempt.expiresAt.toISOString() : null,
    remainingSeconds,
    duration: attempt.test.duration,
    totalQuestions: attempt.attemptQuestions.length,
    answeredCount,
    notAnsweredCount: attempt.attemptQuestions.length - answeredCount,
    markedForReviewCount,
    questions,
  };
}

function toResultDto(attempt: AttemptWithRelations): AttemptResultResponseData {
  const answersByQuestion = new Map(attempt.studentAnswers.map((a) => [a.questionId, a]));

  const questions = attempt.attemptQuestions
    .sort((a, b) => a.displayOrder - b.displayOrder)
    .map((aq) => {
      const snapshot = aq.questionVersion.snapshot as unknown as QuestionSnapshot;
      const answer = answersByQuestion.get(aq.questionId);
      const correctOptionKey = correctKeyFromSnapshot(snapshot);

      const optionOrder = aq.optionOrder as string[];
      const optionsByKey = new Map(snapshot.options.map((o) => [o.optionKey, o]));
      const options = optionOrder
        .map((key) => optionsByKey.get(key))
        .filter((o): o is NonNullable<typeof o> => Boolean(o))
        .map((o) => ({ optionKey: o.optionKey, optionText: o.optionText, optionImage: o.optionImage }));

      return {
        questionId: aq.questionId,
        displayOrder: aq.displayOrder,
        questionText: snapshot.questionText,
        selectedOptionKey: answer?.selectedOptionKey ?? null,
        correctOptionKey,
        isCorrect: answer?.isCorrect ?? null,
        marksAwarded: answer?.marksAwarded ?? 0,
        options,
        explanation: snapshot.explanation,
      };
    });

  const passingMarks = attempt.test.passingMarks;
  const score = attempt.score ?? 0;

  return {
    attemptId: attempt.id,
    testId: attempt.testId,
    testName: attempt.test.name,
    status: attempt.status,
    score,
    totalMarks: attempt.totalMarks ?? 0,
    percentage: attempt.percentage ?? 0,
    accuracy: attempt.accuracy ?? 0,
    correctCount: attempt.correctCount ?? 0,
    wrongCount: attempt.wrongCount ?? 0,
    unansweredCount: attempt.unansweredCount ?? 0,
    timeTaken: attempt.timeTaken ?? 0,
    studyPointsEarned: attempt.studyPointsEarned ?? 0,
    passingMarks,
    passed: score >= passingMarks,
    submittedAt: attempt.submittedAt ? attempt.submittedAt.toISOString() : new Date().toISOString(),
    questions,
  };
}
