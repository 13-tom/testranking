import type { Milestone, MomentumLevel, TrendClassification } from "@board-ranking/shared";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// >+8=RAPIDLY_IMPROVING, >+3=IMPROVING, -3..+3=STABLE, <-3=DECLINING,
// <-8=RAPIDLY_DECLINING, <4 datapoints=INSUFFICIENT_DATA.
export function classifyAccuracyTrend(delta: number, dataPointCount: number): TrendClassification {
  if (dataPointCount < 4) return "INSUFFICIENT_DATA";
  if (delta > 8) return "RAPIDLY_IMPROVING";
  if (delta > 3) return "IMPROVING";
  if (delta < -8) return "RAPIDLY_DECLINING";
  if (delta < -3) return "DECLINING";
  return "STABLE";
}

// Inverted (lower rank number is better). BR-043 decision #11 adds the
// INSUFFICIENT_DATA row for consistency with accuracy trend — moot today
// since rank is always null until Phase 6 (Ranking).
export function classifyRankTrend(delta: number | null, dataPointCount: number): TrendClassification {
  if (delta === null || dataPointCount < 4) return "INSUFFICIENT_DATA";
  if (delta < -15) return "RAPIDLY_IMPROVING";
  if (delta < -5) return "IMPROVING";
  if (delta > 15) return "RAPIDLY_DECLINING";
  if (delta > 5) return "DECLINING";
  return "STABLE";
}

// BR-043 decision #6: linear, symmetric interpolation around the
// documented threshold anchors (docs give thresholds only, not a curve).
export function computeAccuracyTrendScore(delta: number): number {
  return clamp(50 + delta * 6.25, 0, 100);
}

export function computeRankTrendScore(delta: number | null): number {
  if (delta === null) return 50; // neutral — no rank data yet (Phase 6 gap)
  return clamp(50 - delta * 3.33, 0, 100);
}

// BR-043 decision #7: ceiling-anchored (docs only give the top anchor).
export function computeFrequencyScore(testsLast7Days: number): number {
  return Math.min(100, (testsLast7Days / 7) * 100);
}

export function computeConsistencyScore(studyStreak: number): number {
  return Math.min(100, (studyStreak / 14) * 100);
}

export function computeMomentum(accuracyTrendScore: number, rankTrendScore: number, frequencyScore: number, consistencyScore: number): number {
  return 0.35 * accuracyTrendScore + 0.25 * rankTrendScore + 0.25 * frequencyScore + 0.15 * consistencyScore;
}

// >=80=SURGING, >=60=STRONG, >=40=MODERATE, >=20=LOW, else STALLED.
export function classifyMomentumLevel(score: number): MomentumLevel {
  if (score >= 80) return "SURGING";
  if (score >= 60) return "STRONG";
  if (score >= 40) return "MODERATE";
  if (score >= 20) return "LOW";
  return "STALLED";
}

// BR-043 decision #8: dailyImprovementRate derived as delta-per-day over
// the two-halves split used for trend classification (docs reference the
// rate but never derive it).
export function computeDailyRate(recentHalfAvg: number, olderHalfAvg: number, daysBetweenHalfMidpoints: number): number {
  const days = Math.max(1, daysBetweenHalfMidpoints);
  return (recentHalfAvg - olderHalfAvg) / days;
}

// Forecast returns null unless the classification is IMPROVING/RAPIDLY_IMPROVING.
export function computeDaysToNextMastery(classification: TrendClassification, currentAccuracy: number, dailyImprovementRate: number): number | null {
  if (classification !== "IMPROVING" && classification !== "RAPIDLY_IMPROVING") return null;
  if (dailyImprovementRate <= 0) return null;
  return Math.max(0, (90 - currentAccuracy) / dailyImprovementRate);
}

export function computeDaysToTargetRank(classification: TrendClassification, currentRank: number | null, dailyRankImprovement: number): number | null {
  if (currentRank === null) return null; // Phase 6 gap — BR-043
  if (classification !== "IMPROVING" && classification !== "RAPIDLY_IMPROVING") return null;
  if (dailyRankImprovement <= 0) return null;
  return Math.max(0, (currentRank * 0.1) / dailyRankImprovement);
}

export type MilestoneInput = {
  bestPercentage: number;
  rank: number | null;
  questionsSolved: number;
  testsTaken: number;
  studyStreak: number;
  lastTestDate: Date | null;
};

// The 12 documented milestones (2 accuracy + 3 rank + 4 volume + 3 streak).
// achievedDate is approximated as the analytics' lastTestDate when
// achieved — there's no historical "first achieved on" ledger yet.
export function evaluateMilestones(input: MilestoneInput): Milestone[] {
  const achievedDate = input.lastTestDate ? input.lastTestDate.toISOString() : null;
  const build = (code: string, title: string, achieved: boolean, value: number | null): Milestone => ({
    code,
    title,
    achieved,
    achievedDate: achieved ? achievedDate : null,
    value,
  });

  return [
    build("ACCURACY_90", "90%+ Accuracy", input.bestPercentage >= 90, input.bestPercentage),
    build("ACCURACY_95", "95%+ Accuracy", input.bestPercentage >= 95, input.bestPercentage),
    build("RANK_TOP_100", "Top 100 Rank", input.rank !== null && input.rank <= 100, input.rank),
    build("RANK_TOP_50", "Top 50 Rank", input.rank !== null && input.rank <= 50, input.rank),
    build("RANK_TOP_10", "Top 10 Rank", input.rank !== null && input.rank <= 10, input.rank),
    build("VOLUME_100", "100+ Questions Solved", input.questionsSolved >= 100, input.questionsSolved),
    build("VOLUME_500", "500+ Questions Solved", input.questionsSolved >= 500, input.questionsSolved),
    build("TESTS_50", "50+ Tests Taken", input.testsTaken >= 50, input.testsTaken),
    build("TESTS_200", "200+ Tests Taken", input.testsTaken >= 200, input.testsTaken),
    build("STREAK_7", "7-Day Streak", input.studyStreak >= 7, input.studyStreak),
    build("STREAK_14", "14-Day Streak", input.studyStreak >= 14, input.studyStreak),
    build("STREAK_30", "30-Day Streak", input.studyStreak >= 30, input.studyStreak),
  ];
}
