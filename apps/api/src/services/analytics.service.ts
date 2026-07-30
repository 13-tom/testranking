import type { AnalyticsProgressResponseData, AnalyticsSubjectsResponseData, ProgressSnapshotPoint, StudentAnalyticsOverview, StudentChapterAnalyticsDetail, StudentSubjectAnalyticsDetail, StudentTopicAnalyticsDetail } from "@board-ranking/shared";
import { NotFoundError } from "../errors/AppError.js";
import { findEvaluatedAttemptsForAnalytics } from "../repositories/test-attempt.repository.js";
import {
  findChapterAnalyticsDetail,
  findProgressSnapshots,
  findStudentAnalytics,
  findSubjectAnalyticsDetail,
  findSubjectAnalyticsList,
  findTopicAnalyticsDetail,
  upsertChapterAnalytics,
  upsertProgressSnapshots,
  upsertStudentAnalytics,
  upsertSubjectAnalytics,
  upsertTopicAnalytics,
} from "../repositories/analytics.repository.js";
import { computeAnalyticsAggregation, type AnalyticsAttempt } from "../rules/analytics-aggregation.rules.js";
import type { ProgressQuery } from "../validators/analytics.validators.js";

// --- Writer (BR-043): fire-and-forget after each evaluated attempt ---

export async function triggerAnalyticsUpdate(studentId: string): Promise<void> {
  const rawAttempts = await findEvaluatedAttemptsForAnalytics(studentId);

  const attempts: AnalyticsAttempt[] = rawAttempts.map((a) => ({
    attemptId: a.id,
    score: a.score ?? 0,
    percentage: a.percentage ?? 0,
    timeTaken: a.timeTaken ?? 0,
    studyPointsEarned: a.studyPointsEarned ?? 0,
    submittedAt: a.submittedAt ?? a.updatedAt,
    attemptQuestions: a.attemptQuestions.map((aq) => ({
      questionId: aq.questionId,
      subjectId: aq.question.topic.chapter.subjectId,
      chapterId: aq.question.topic.chapterId,
      topicId: aq.question.topicId,
    })),
    studentAnswers: a.studentAnswers.map((sa) => ({
      questionId: sa.questionId,
      selectedOptionKey: sa.selectedOptionKey,
      isCorrect: sa.isCorrect,
      marksAwarded: sa.marksAwarded,
    })),
  }));

  const result = computeAnalyticsAggregation(attempts);

  await upsertStudentAnalytics(studentId, result.overall);
  await upsertSubjectAnalytics(studentId, result.subjects);
  await upsertChapterAnalytics(studentId, result.chapters);
  await upsertTopicAnalytics(studentId, result.topics);
  await upsertProgressSnapshots(studentId, result.snapshots);
}

// --- Module 13: analytics.* readers ---

export async function getOverview(studentId: string): Promise<StudentAnalyticsOverview> {
  const row = await findStudentAnalytics(studentId);
  if (!row) {
    return {
      testsTaken: 0,
      testsCompleted: 0,
      questionsSolved: 0,
      correctAnswers: 0,
      incorrectAnswers: 0,
      accuracy: 0,
      averageScore: 0,
      averagePercentage: 0,
      bestPercentage: 0,
      bestScore: 0,
      averageRank: null,
      bestRank: null,
      totalStudyTime: 0,
      lastTestDate: null,
    };
  }
  return {
    testsTaken: row.testsTaken,
    testsCompleted: row.testsCompleted,
    questionsSolved: row.questionsSolved,
    correctAnswers: row.correctAnswers,
    incorrectAnswers: row.incorrectAnswers,
    accuracy: row.accuracy,
    averageScore: row.averageScore,
    averagePercentage: row.averagePercentage,
    bestPercentage: row.bestPercentage,
    bestScore: row.bestScore,
    averageRank: row.averageRank,
    bestRank: row.bestRank,
    totalStudyTime: row.totalStudyTime,
    lastTestDate: row.lastTestDate ? row.lastTestDate.toISOString() : null,
  };
}

export async function getSubjects(studentId: string): Promise<AnalyticsSubjectsResponseData> {
  const rows = await findSubjectAnalyticsList(studentId);
  return rows.map((r) => ({
    subjectId: r.subjectId,
    subjectName: r.subject.name,
    attempts: r.attempts,
    questionsSolved: r.questionsSolved,
    accuracy: r.accuracy,
    averageTimePerQuestion: r.averageTimePerQuestion,
    bestScore: r.bestScore,
    averageScore: r.averageScore,
  }));
}

export async function getSubjectDetail(studentId: string, subjectId: string): Promise<StudentSubjectAnalyticsDetail> {
  const row = await findSubjectAnalyticsDetail(studentId, subjectId);
  if (!row) {
    throw new NotFoundError("No analytics found for this subject yet");
  }
  return {
    subjectId: row.subjectId,
    subjectName: row.subject.name,
    attempts: row.attempts,
    questionsSolved: row.questionsSolved,
    correctAnswers: row.correctAnswers,
    incorrectAnswers: row.incorrectAnswers,
    accuracy: row.accuracy,
    averageTimePerQuestion: row.averageTimePerQuestion,
    bestScore: row.bestScore,
    averageScore: row.averageScore,
  };
}

export async function getChapterDetail(studentId: string, chapterId: string): Promise<StudentChapterAnalyticsDetail> {
  const row = await findChapterAnalyticsDetail(studentId, chapterId);
  if (!row) {
    throw new NotFoundError("No analytics found for this chapter yet");
  }
  return {
    chapterId: row.chapterId,
    chapterName: row.chapter.name,
    subjectId: row.chapter.subjectId,
    attempts: row.attempts,
    questionsSolved: row.questionsSolved,
    correctAnswers: row.correctAnswers,
    incorrectAnswers: row.incorrectAnswers,
    accuracy: row.accuracy,
    averageTimePerQuestion: row.averageTimePerQuestion,
    weaknessScore: row.weaknessScore,
  };
}

export async function getTopicDetail(studentId: string, topicId: string): Promise<StudentTopicAnalyticsDetail> {
  const row = await findTopicAnalyticsDetail(studentId, topicId);
  if (!row) {
    throw new NotFoundError("No analytics found for this topic yet");
  }
  return {
    topicId: row.topicId,
    topicName: row.topic.name,
    chapterId: row.topic.chapterId,
    attempts: row.attempts,
    questionsSolved: row.questionsSolved,
    correctAnswers: row.correctAnswers,
    incorrectAnswers: row.incorrectAnswers,
    accuracy: row.accuracy,
    averageTimePerQuestion: row.averageTimePerQuestion,
    masteryScore: row.masteryScore,
  };
}

export async function getProgress(studentId: string, query: ProgressQuery): Promise<AnalyticsProgressResponseData> {
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;
  const rows = await findProgressSnapshots(studentId, from, to, query.limit ?? 90);
  return rows.map(toProgressPoint);
}

export function toProgressPoint(row: { date: Date; rank: number | null; accuracy: number; averageScore: number; averagePercentage: number; studyPoints: number; testsTaken: number }): ProgressSnapshotPoint {
  return {
    date: row.date.toISOString().slice(0, 10),
    rank: row.rank,
    accuracy: row.accuracy,
    averageScore: row.averageScore,
    averagePercentage: row.averagePercentage,
    studyPoints: row.studyPoints,
    testsTaken: row.testsTaken,
  };
}
