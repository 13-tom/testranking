// Phase 5 (Analytics, BR-043) — Module 14: analytics-dashboard.* (BFF
// composition layer, mounted at /api/v1/analytics-dashboard — a distinct
// mount from the existing Phase 2 /api/v1/dashboard, see BR-043).
import type { CursorPage } from "./pagination.js";

// Module 14's own mastery bands — deliberately simpler and distinct from
// Module 15's MasteryLevel (MASTER/PROFICIENT/DEVELOPING/BEGINNER). See BR-043.
export type DashboardMasteryStatus = "MASTERED" | "PROFICIENT" | "DEVELOPING" | "NEEDS_WORK";

export type AnalyticsDashboardOverview = {
  rank: number | null;
  percentile: number | null;
  accuracy: number;
  averageScore: number;
  bestScore: number;
  studyPoints: number;
  studyLevel: number;
  studyStreak: number;
};

export type AnalyticsDashboardSubject = {
  subjectId: string;
  subjectName: string;
  accuracy: number;
  averageScore: number;
  masteryStatus: DashboardMasteryStatus;
};

export type AnalyticsDashboardChapterItem = {
  chapterId: string;
  chapterName: string;
  subjectId: string;
  accuracy: number;
  weaknessScore: number;
  masteryStatus: DashboardMasteryStatus;
};

export type AnalyticsDashboardTopicItem = {
  topicId: string;
  topicName: string;
  chapterId: string;
  accuracy: number;
  masteryScore: number;
  masteryStatus: DashboardMasteryStatus;
};

export type AnalyticsDashboardProgressPoint = {
  periodStart: string;
  rank: number | null;
  accuracy: number;
  averageScore: number;
  averagePercentage: number;
  studyPoints: number;
  testsTaken: number;
};

export type StrengthWeaknessEntry = {
  type: "SUBJECT" | "CHAPTER" | "TOPIC";
  id: string;
  name: string;
  score: number; // accuracy for subjects, weaknessScore for chapters, masteryScore for topics
};

export type AnalyticsDashboardStrengths = {
  subjects: StrengthWeaknessEntry[];
  chapters: StrengthWeaknessEntry[];
  topics: StrengthWeaknessEntry[];
};

export type AnalyticsDashboardWeaknesses = AnalyticsDashboardStrengths;

export type AnalyticsDashboardSummary = {
  rank: number | null;
  accuracy: number;
  todayProgress: { testsTaken: number; accuracy: number } | null;
  bestSubject: { subjectId: string; subjectName: string; accuracy: number } | null;
  weakestSubject: { subjectId: string; subjectName: string; accuracy: number } | null;
  recommendedNextAction: string;
};

export type ChaptersQuery = { sort?: "weakest" | "strongest"; limit?: number; cursor?: string };
export type TopicsQuery = { sort?: "strongest" | "weakest"; limit?: number; cursor?: string };
export type DashboardProgressQuery = { from?: string; to?: string; interval?: "daily" | "weekly" | "monthly"; limit?: number };
export type TopNQuery = { limit?: number };

export type AnalyticsDashboardChaptersResponseData = CursorPage<AnalyticsDashboardChapterItem>;
export type AnalyticsDashboardTopicsResponseData = CursorPage<AnalyticsDashboardTopicItem>;
export type AnalyticsDashboardSubjectsResponseData = AnalyticsDashboardSubject[];
export type AnalyticsDashboardProgressResponseData = AnalyticsDashboardProgressPoint[];
