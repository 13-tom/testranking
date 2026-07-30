import type {
  AccuracyTrendResponseData,
  MilestonesResponseData,
  MomentumResponseData,
  RankTrendResponseData,
  SpeedTrendResponseData,
  StudyTimeTrendResponseData,
  SubjectsTrendResponseData,
  TrendOverviewResponseData,
} from "@board-ranking/shared";
import { findAllProgressSnapshots, findAllSubjectAnalytics, findStudentAnalytics, findStudentProfileForDashboard, getCurrentRank } from "../repositories/trend.repository.js";
import {
  classifyAccuracyTrend,
  classifyMomentumLevel,
  classifyRankTrend,
  computeAccuracyTrendScore,
  computeConsistencyScore,
  computeDailyRate,
  computeDaysToNextMastery,
  computeDaysToTargetRank,
  computeFrequencyScore,
  computeMomentum,
  computeRankTrendScore,
  evaluateMilestones,
} from "../rules/trend.rules.js";
import type { TrendDateRangeQuery } from "../validators/trend.validators.js";

type Snapshot = { date: Date; accuracy: number; testsTaken: number };

function filterByRange(snapshots: Snapshot[], query: TrendDateRangeQuery): Snapshot[] {
  const from = query.from ? new Date(query.from) : undefined;
  const to = query.to ? new Date(query.to) : undefined;
  return snapshots.filter((s) => (!from || s.date >= from) && (!to || s.date <= to));
}

function splitHalves(snapshots: Snapshot[]): { olderHalf: Snapshot[]; recentHalf: Snapshot[]; daysBetweenMidpoints: number } {
  const half = Math.floor(snapshots.length / 2);
  const olderHalf = snapshots.slice(0, half);
  const recentHalf = snapshots.slice(half);
  const midpoint = (arr: Snapshot[]) => (arr.length > 0 ? arr[Math.floor(arr.length / 2)]!.date.getTime() : 0);
  const daysBetweenMidpoints = recentHalf.length > 0 && olderHalf.length > 0 ? (midpoint(recentHalf) - midpoint(olderHalf)) / (1000 * 60 * 60 * 24) : 0;
  return { olderHalf, recentHalf, daysBetweenMidpoints };
}

function avgAccuracy(snapshots: Snapshot[]): number {
  return snapshots.length > 0 ? snapshots.reduce((sum, s) => sum + s.accuracy, 0) / snapshots.length : 0;
}

export async function getTrendOverview(studentId: string, query: TrendDateRangeQuery): Promise<TrendOverviewResponseData> {
  const all = await findAllProgressSnapshots(studentId);
  const snapshots = filterByRange(all, query);
  const { olderHalf, recentHalf } = splitHalves(snapshots);
  const delta = avgAccuracy(recentHalf) - avgAccuracy(olderHalf);
  const accuracyTrend = classifyAccuracyTrend(delta, snapshots.length);
  const rankTrend = classifyRankTrend(null, snapshots.length); // rank always null — BR-043
  const accuracyTrendScore = computeAccuracyTrendScore(delta);
  const rankTrendScore = computeRankTrendScore(null);
  const profile = await findStudentProfileForDashboard(studentId);
  const frequencyScore = computeFrequencyScore(countTestsInLastDays(snapshots, 7));
  const consistencyScore = computeConsistencyScore(profile?.studyStreak ?? 0);
  const momentumScore = computeMomentum(accuracyTrendScore, rankTrendScore, frequencyScore, consistencyScore);

  return {
    accuracyTrend,
    rankTrend,
    momentum: { score: momentumScore, level: classifyMomentumLevel(momentumScore) },
    periodStart: snapshots[0]?.date.toISOString().slice(0, 10) ?? null,
    periodEnd: snapshots[snapshots.length - 1]?.date.toISOString().slice(0, 10) ?? null,
  };
}

function countTestsInLastDays(snapshots: Snapshot[], days: number): number {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const recentSnapshots = snapshots.filter((s) => s.date.getTime() >= cutoff);
  if (recentSnapshots.length === 0) return 0;
  const before = snapshots.filter((s) => s.date.getTime() < cutoff).sort((a, b) => b.date.getTime() - a.date.getTime())[0];
  const latest = recentSnapshots[recentSnapshots.length - 1]!;
  return latest.testsTaken - (before?.testsTaken ?? 0);
}

export async function getAccuracyTrend(studentId: string, query: TrendDateRangeQuery): Promise<AccuracyTrendResponseData> {
  const all = await findAllProgressSnapshots(studentId);
  const snapshots = filterByRange(all, query);
  const { olderHalf, recentHalf } = splitHalves(snapshots);
  const delta = avgAccuracy(recentHalf) - avgAccuracy(olderHalf);
  const classification = classifyAccuracyTrend(delta, snapshots.length);

  const dataPoints = snapshots.map((s) => ({ date: s.date.toISOString().slice(0, 10), value: s.accuracy }));
  const windowSize = 3;
  const movingAverage = dataPoints.map((_, i) => {
    const window = dataPoints.slice(Math.max(0, i - windowSize + 1), i + 1);
    const value = window.reduce((sum, p) => sum + p.value, 0) / window.length;
    return { date: dataPoints[i]!.date, value };
  });

  return { classification, dataPoints, movingAverage };
}

export async function getRankTrend(studentId: string, query: TrendDateRangeQuery): Promise<RankTrendResponseData> {
  const all = await findAllProgressSnapshots(studentId);
  const snapshots = filterByRange(all, query);
  // Rank is always null until Phase 6 (Ranking) exists — BR-043.
  return { classification: classifyRankTrend(null, snapshots.length), bestRank: null, worstRank: null, averageRank: null, dataPoints: [] };
}

export async function getSpeedTrend(studentId: string): Promise<SpeedTrendResponseData> {
  const subjects = await findAllSubjectAnalytics(studentId);
  return subjects.map((s) => ({ subjectId: s.subjectId, subjectName: s.subject.name, averageTimePerQuestion: s.averageTimePerQuestion }));
}

export async function getStudyTimeTrend(studentId: string, query: TrendDateRangeQuery): Promise<StudyTimeTrendResponseData> {
  const [overall, all] = await Promise.all([findStudentAnalytics(studentId), findAllProgressSnapshots(studentId)]);
  const snapshots = filterByRange(all, query);
  const testsLast7Days = countTestsInLastDays(snapshots, 7);
  const weeksActive = snapshots.length > 0 ? Math.max(1, (Date.now() - snapshots[0]!.date.getTime()) / (1000 * 60 * 60 * 24 * 7)) : 1;
  return {
    totalStudyTime: overall?.totalStudyTime ?? 0,
    testsLast7Days,
    averageSessionsPerWeek: (overall?.testsTaken ?? 0) / weeksActive,
  };
}

// BR-043: there's no per-subject-per-date time series in the schema
// (StudentProgressSnapshot is overall-only), so per-subject trend
// classification reuses the OVERALL accuracy trend classification for
// every subject — confidence scales with that subject's own practice
// volume, so a lightly-practiced subject's trend reads as low-confidence.
export async function getSubjectsTrend(studentId: string, query: TrendDateRangeQuery): Promise<SubjectsTrendResponseData> {
  const [subjects, all] = await Promise.all([findAllSubjectAnalytics(studentId), findAllProgressSnapshots(studentId)]);
  const snapshots = filterByRange(all, query);
  const { olderHalf, recentHalf } = splitHalves(snapshots);
  const delta = avgAccuracy(recentHalf) - avgAccuracy(olderHalf);
  const classification = classifyAccuracyTrend(delta, snapshots.length);
  return subjects.map((s) => ({
    subjectId: s.subjectId,
    subjectName: s.subject.name,
    classification,
    confidence: Math.min(100, (s.questionsSolved / 20) * 100),
  }));
}

export async function getMilestones(studentId: string): Promise<MilestonesResponseData> {
  const [overall, profile, rank] = await Promise.all([findStudentAnalytics(studentId), findStudentProfileForDashboard(studentId), getCurrentRank(studentId)]);
  return evaluateMilestones({
    bestPercentage: overall?.bestPercentage ?? 0,
    rank,
    questionsSolved: overall?.questionsSolved ?? 0,
    testsTaken: overall?.testsTaken ?? 0,
    studyStreak: profile?.studyStreak ?? 0,
    lastTestDate: overall?.lastTestDate ?? null,
  });
}

export async function getMomentum(studentId: string): Promise<MomentumResponseData> {
  const [overall, profile, all] = await Promise.all([findStudentAnalytics(studentId), findStudentProfileForDashboard(studentId), findAllProgressSnapshots(studentId)]);
  const { olderHalf, recentHalf, daysBetweenMidpoints } = splitHalves(all);
  const delta = avgAccuracy(recentHalf) - avgAccuracy(olderHalf);
  const classification = classifyAccuracyTrend(delta, all.length);

  const accuracyTrendScore = computeAccuracyTrendScore(delta);
  const rankTrendScore = computeRankTrendScore(null);
  const frequencyScore = computeFrequencyScore(countTestsInLastDays(all, 7));
  const consistencyScore = computeConsistencyScore(profile?.studyStreak ?? 0);
  const score = computeMomentum(accuracyTrendScore, rankTrendScore, frequencyScore, consistencyScore);

  const dailyRate = computeDailyRate(avgAccuracy(recentHalf), avgAccuracy(olderHalf), daysBetweenMidpoints);
  const daysToNextMastery = computeDaysToNextMastery(classification, overall?.accuracy ?? 0, dailyRate);
  const daysToTargetRank = computeDaysToTargetRank(classification, null, 0); // rank always null — BR-043

  return {
    score,
    level: classifyMomentumLevel(score),
    factors: { accuracyTrendScore, rankTrendScore, frequencyScore, consistencyScore },
    forecast: { daysToNextMastery, daysToTargetRank },
  };
}
