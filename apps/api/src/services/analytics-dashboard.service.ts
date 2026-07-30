import type {
  AnalyticsDashboardChaptersResponseData,
  AnalyticsDashboardOverview,
  AnalyticsDashboardStrengths,
  AnalyticsDashboardSubjectsResponseData,
  AnalyticsDashboardSummary,
  AnalyticsDashboardTopicsResponseData,
  AnalyticsDashboardWeaknesses,
} from "@board-ranking/shared";
import { findStudentProfileForDashboard } from "../repositories/analytics-dashboard.repository.js";
import {
  findAllChapterAnalytics,
  findAllProgressSnapshots,
  findAllSubjectAnalytics,
  findAllTopicAnalytics,
  findStudentAnalytics,
} from "../repositories/analytics.repository.js";
import { getCurrentRank, getTotalStudents } from "../repositories/rank.repository.js";
import { bucketProgressByInterval, classifyDashboardMastery } from "../rules/analytics-dashboard.rules.js";
import { paginateByCursor } from "../rules/pagination.rules.js";
import type { ChaptersQuery, DashboardProgressQuery, TopNQuery, TopicsQuery } from "../validators/analytics-dashboard.validators.js";

export async function getDashboardOverview(studentId: string): Promise<AnalyticsDashboardOverview> {
  const [analytics, profile, rank, totalStudents] = await Promise.all([
    findStudentAnalytics(studentId),
    findStudentProfileForDashboard(studentId),
    getCurrentRank(studentId),
    getTotalStudents(),
  ]);
  const percentile = rank !== null && totalStudents !== null && totalStudents > 0 ? Math.round(((totalStudents - rank) / totalStudents) * 100) : null;
  return {
    rank,
    percentile,
    accuracy: analytics?.accuracy ?? 0,
    averageScore: analytics?.averageScore ?? 0,
    bestScore: analytics?.bestScore ?? 0,
    studyPoints: profile?.studyPoints ?? 0,
    studyLevel: profile?.studyLevel ?? 1,
    studyStreak: profile?.studyStreak ?? 0,
  };
}

export async function getDashboardSubjects(studentId: string): Promise<AnalyticsDashboardSubjectsResponseData> {
  const rows = await findAllSubjectAnalytics(studentId);
  return rows
    .slice()
    .sort((a, b) => a.subject.displayOrder - b.subject.displayOrder)
    .map((r) => ({
      subjectId: r.subjectId,
      subjectName: r.subject.name,
      accuracy: r.accuracy,
      averageScore: r.averageScore,
      masteryStatus: classifyDashboardMastery(r.accuracy),
    }));
}

export async function getDashboardChapters(studentId: string, query: ChaptersQuery): Promise<AnalyticsDashboardChaptersResponseData> {
  const rows = await findAllChapterAnalytics(studentId);
  const sort = query.sort ?? "weakest";
  const items = rows
    .map((r) => ({
      id: r.id,
      chapterId: r.chapterId,
      chapterName: r.chapter.name,
      subjectId: r.chapter.subjectId,
      accuracy: r.accuracy,
      weaknessScore: r.weaknessScore,
      masteryStatus: classifyDashboardMastery(r.accuracy),
    }))
    .sort((a, b) => (sort === "weakest" ? b.weaknessScore - a.weaknessScore : a.weaknessScore - b.weaknessScore));
  return paginateByCursor(items, query.cursor, query.limit ?? 10);
}

export async function getDashboardTopics(studentId: string, query: TopicsQuery): Promise<AnalyticsDashboardTopicsResponseData> {
  const rows = await findAllTopicAnalytics(studentId);
  const sort = query.sort ?? "strongest";
  const items = rows
    .map((r) => ({
      id: r.id,
      topicId: r.topicId,
      topicName: r.topic.name,
      chapterId: r.topic.chapterId,
      accuracy: r.accuracy,
      masteryScore: r.masteryScore,
      masteryStatus: classifyDashboardMastery(r.masteryScore),
    }))
    .sort((a, b) => (sort === "strongest" ? b.masteryScore - a.masteryScore : a.masteryScore - b.masteryScore));
  return paginateByCursor(items, query.cursor, query.limit ?? 10);
}

export async function getDashboardProgress(studentId: string, query: DashboardProgressQuery) {
  const all = await findAllProgressSnapshots(studentId);
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;
  const filtered = all.filter((s) => (!from || s.date >= from) && (!to || s.date <= to)).slice(-(query.limit ?? 90));
  const bucketed = bucketProgressByInterval(filtered, query.interval ?? "daily");
  return bucketed.map(({ periodStart, snapshot }) => ({
    periodStart,
    rank: snapshot.rank,
    accuracy: snapshot.accuracy,
    averageScore: snapshot.averageScore,
    averagePercentage: snapshot.averagePercentage,
    studyPoints: snapshot.studyPoints,
    testsTaken: snapshot.testsTaken,
  }));
}

async function buildStrengthWeaknessLists(studentId: string, limit: number, direction: "best" | "worst"): Promise<AnalyticsDashboardStrengths> {
  const [subjects, chapters, topics] = await Promise.all([
    findAllSubjectAnalytics(studentId),
    findAllChapterAnalytics(studentId),
    findAllTopicAnalytics(studentId),
  ]);

  const sortedSubjects = subjects.slice().sort((a, b) => (direction === "best" ? b.accuracy - a.accuracy : a.accuracy - b.accuracy));
  const sortedChapters = chapters.slice().sort((a, b) => (direction === "best" ? a.weaknessScore - b.weaknessScore : b.weaknessScore - a.weaknessScore));
  const sortedTopics = topics.slice().sort((a, b) => (direction === "best" ? b.masteryScore - a.masteryScore : a.masteryScore - b.masteryScore));

  return {
    subjects: sortedSubjects.slice(0, limit).map((s) => ({ type: "SUBJECT" as const, id: s.subjectId, name: s.subject.name, score: s.accuracy })),
    chapters: sortedChapters.slice(0, limit).map((c) => ({ type: "CHAPTER" as const, id: c.chapterId, name: c.chapter.name, score: c.weaknessScore })),
    topics: sortedTopics.slice(0, limit).map((t) => ({ type: "TOPIC" as const, id: t.topicId, name: t.topic.name, score: t.masteryScore })),
  };
}

export function getDashboardStrengths(studentId: string, query: TopNQuery): Promise<AnalyticsDashboardStrengths> {
  return buildStrengthWeaknessLists(studentId, query.limit ?? 5, "best");
}

export function getDashboardWeaknesses(studentId: string, query: TopNQuery): Promise<AnalyticsDashboardWeaknesses> {
  return buildStrengthWeaknessLists(studentId, query.limit ?? 5, "worst");
}

export async function getDashboardSummary(studentId: string): Promise<AnalyticsDashboardSummary> {
  const [analytics, rank, subjects, snapshots] = await Promise.all([
    findStudentAnalytics(studentId),
    getCurrentRank(studentId),
    findAllSubjectAnalytics(studentId),
    findAllProgressSnapshots(studentId),
  ]);

  const sortedByAccuracy = subjects.slice().sort((a, b) => b.accuracy - a.accuracy);
  const best = sortedByAccuracy[0];
  const weakest = sortedByAccuracy[sortedByAccuracy.length - 1];

  const todayKey = new Date().toISOString().slice(0, 10);
  const todaySnapshot = snapshots.find((s) => s.date.toISOString().slice(0, 10) === todayKey);
  const previousSnapshot = snapshots
    .filter((s) => s.date.toISOString().slice(0, 10) < todayKey)
    .sort((a, b) => b.date.getTime() - a.date.getTime())[0];

  const todayProgress = todaySnapshot
    ? { testsTaken: todaySnapshot.testsTaken - (previousSnapshot?.testsTaken ?? 0), accuracy: todaySnapshot.accuracy }
    : null;

  const recommendedNextAction =
    !analytics || analytics.testsTaken === 0
      ? "Take your first test to unlock personalized recommendations."
      : "Check your Recommendations page for today's suggested practice.";

  return {
    rank,
    accuracy: analytics?.accuracy ?? 0,
    todayProgress,
    bestSubject: best ? { subjectId: best.subjectId, subjectName: best.subject.name, accuracy: best.accuracy } : null,
    weakestSubject: weakest && weakest.subjectId !== best?.subjectId ? { subjectId: weakest.subjectId, subjectName: weakest.subject.name, accuracy: weakest.accuracy } : null,
    recommendedNextAction,
  };
}
