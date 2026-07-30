// Phase 5 (Analytics, BR-043) — Module 17: trend.* (trend classification,
// momentum, milestones, forecast, mounted at /api/v1/trends).
import type { MomentumLevel, TrendClassification } from "./analytics.js";

export type TrendDateRangeQuery = { from?: string; to?: string };

export type TrendOverviewResponseData = {
  accuracyTrend: TrendClassification;
  rankTrend: TrendClassification;
  momentum: { score: number; level: MomentumLevel };
  periodStart: string | null;
  periodEnd: string | null;
};

export type TrendDataPoint = { date: string; value: number };

export type AccuracyTrendResponseData = {
  classification: TrendClassification;
  dataPoints: TrendDataPoint[];
  movingAverage: TrendDataPoint[];
};

export type RankTrendResponseData = {
  classification: TrendClassification;
  bestRank: number | null;
  worstRank: number | null;
  averageRank: number | null;
  dataPoints: TrendDataPoint[];
};

export type SpeedTrendEntry = { subjectId: string; subjectName: string; averageTimePerQuestion: number };
export type SpeedTrendResponseData = SpeedTrendEntry[];

export type StudyTimeTrendResponseData = {
  totalStudyTime: number;
  testsLast7Days: number;
  averageSessionsPerWeek: number;
};

export type SubjectTrendEntry = { subjectId: string; subjectName: string; classification: TrendClassification; confidence: number };
export type SubjectsTrendResponseData = SubjectTrendEntry[];

// The 12 documented milestones (4 categories: accuracy, rank, volume, streak) — see BR-043 for codes.
export type Milestone = {
  code: string;
  title: string;
  achieved: boolean;
  achievedDate: string | null;
  value: number | null;
};
export type MilestonesResponseData = Milestone[];

export type MomentumForecast = { daysToNextMastery: number | null; daysToTargetRank: number | null };

export type MomentumResponseData = {
  score: number;
  level: MomentumLevel;
  factors: {
    accuracyTrendScore: number;
    rankTrendScore: number;
    frequencyScore: number;
    consistencyScore: number;
  };
  forecast: MomentumForecast;
};
