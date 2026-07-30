import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

const ATTEMPT_INCLUDE = {
  test: true,
  attemptQuestions: { include: { question: true, questionVersion: true }, orderBy: { displayOrder: "asc" as const } },
  studentAnswers: true,
} as const;

export function findAttemptById(id: string) {
  return prisma.testAttempt.findUnique({ where: { id }, include: ATTEMPT_INCLUDE });
}

export function findActiveAttempt(studentId: string, testId: string) {
  return prisma.testAttempt.findFirst({
    where: { studentId, testId, status: { in: ["CREATED", "STARTED"] } },
    include: ATTEMPT_INCLUDE,
  });
}

export function countNonActiveAttempts(studentId: string, testId: string) {
  return prisma.testAttempt.count({
    where: { studentId, testId, status: { in: ["SUBMITTED", "AUTO_SUBMITTED", "EVALUATED"] } },
  });
}

// Source attempt for a "Practice Again" (retakeMode: 'SAME') request —
// most recent attempt regardless of status.
export function findMostRecentAttempt(studentId: string, testId: string) {
  return prisma.testAttempt.findFirst({
    where: { studentId, testId },
    orderBy: { createdAt: "desc" },
    include: ATTEMPT_INCLUDE,
  });
}

export function createAttempt(
  data: Prisma.TestAttemptCreateInput,
  attemptQuestions: Array<{ questionId: string; questionVersionId: string; displayOrder: number; optionOrder: Prisma.InputJsonValue }>,
) {
  return prisma.testAttempt.create({
    data: {
      ...data,
      attemptQuestions: { create: attemptQuestions },
    },
    include: ATTEMPT_INCLUDE,
  });
}

// BR-026's CAS claim: zero rows updated means another request already
// claimed this attempt for submission — the caller treats that as an
// idempotent no-op and re-reads the persisted result.
export async function claimAttemptForSubmission(attemptId: string, reason: "SUBMITTED" | "AUTO_SUBMITTED"): Promise<number> {
  // id is a Prisma String/@default(uuid()) column, i.e. plain TEXT — no
  // ::uuid cast on the parameter (Postgres has no text = uuid operator).
  return prisma.$executeRaw`
    UPDATE test_attempts
    SET status = ${reason}::"AttemptStatus", "submittedAt" = now(), "updatedAt" = now()
    WHERE id = ${attemptId} AND status = 'STARTED'
  `;
}

// Evaluation itself (scoring writes, attempt->EVALUATED, Study Points
// credit, AuditLog entry) runs inside one prisma.$transaction in
// test-attempt.service.ts, not through repository functions here — it
// must all commit or roll back together (BR-026).

export function upsertStudentAnswer(
  attemptId: string,
  questionId: string,
  data: {
    questionVersionId: string;
    selectedOptionKey: string | null;
    answerSequence: number;
    clientRequestId: string;
    markedForReview: boolean;
  },
) {
  return prisma.studentAnswer.upsert({
    where: { attemptId_questionId: { attemptId, questionId } },
    create: { attemptId, questionId, ...data },
    update: {
      selectedOptionKey: data.selectedOptionKey,
      answerSequence: data.answerSequence,
      clientRequestId: data.clientRequestId,
      markedForReview: data.markedForReview,
      answeredAt: new Date(),
    },
  });
}

export function findStudentAnswer(attemptId: string, questionId: string) {
  return prisma.studentAnswer.findUnique({ where: { attemptId_questionId: { attemptId, questionId } } });
}

export function findRecentEvaluatedAttempts(studentId: string, limit = 5) {
  return prisma.testAttempt.findMany({
    where: { studentId, status: "EVALUATED" },
    orderBy: { submittedAt: "desc" },
    take: limit,
    include: { test: { select: { name: true } } },
  });
}

export function findChapterTestAccuracyByStudent(studentId: string) {
  return prisma.testAttempt.findMany({
    where: { studentId, status: "EVALUATED", test: { category: "CHAPTER" } },
    orderBy: { submittedAt: "desc" },
    include: { test: { select: { id: true, name: true } } },
  });
}

// Phase 5 (Analytics, BR-043): full read source for the aggregation
// writer. Includes the pinned question -> topic -> chapter -> subject
// hierarchy (needed to bucket StudentAnswers into per-subject/chapter/
// topic accumulators) alongside each attempt's own aggregate fields
// (score, timeTaken, studyPointsEarned, ...).
export function findEvaluatedAttemptsForAnalytics(studentId: string) {
  return prisma.testAttempt.findMany({
    where: { studentId, status: "EVALUATED" },
    include: {
      attemptQuestions: {
        include: {
          question: {
            include: { topic: { include: { chapter: { include: { subject: true } } } } },
          },
        },
      },
      studentAnswers: true,
    },
    orderBy: { submittedAt: "asc" },
  });
}

// BR-001: Release 1 is CBSE-only, so scoping by board is unnecessary
// complexity for now — just match the student's class.
export function findFirstUnattemptedChapterTest(classLevel: number, studentId: string) {
  return prisma.test.findFirst({
    where: {
      category: "CHAPTER",
      status: "ACTIVE",
      isActive: true,
      class: classLevel,
      attempts: { none: { studentId } },
    },
    orderBy: { createdAt: "asc" },
  });
}

