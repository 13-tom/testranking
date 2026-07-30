// Phase 5 (Analytics, BR-043) — shared classification enums, used across
// Modules 13-18, plus Module 13's own (analytics.*) DTOs.

export type MasteryLevel = "MASTER" | "PROFICIENT" | "DEVELOPING" | "BEGINNER";
export type PriorityLevel = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW" | "VERY_LOW";
export type TrendClassification =
  | "RAPIDLY_IMPROVING"
  | "IMPROVING"
  | "STABLE"
  | "DECLINING"
  | "RAPIDLY_DECLINING"
  | "INSUFFICIENT_DATA";
export type ConsistencyClassification = "VERY_CONSISTENT" | "CONSISTENT" | "VARIABLE" | "HIGHLY_VARIABLE" | "INSUFFICIENT_DATA";
export type DifficultyClassification = "EASY" | "MODERATE" | "CHALLENGING" | "DIFFICULT";
export type LearningPattern = "FAST_INACCURATE" | "SLOW_ACCURATE" | "EFFICIENT" | "STRUGGLING" | "BALANCED";
export type PracticeFrequency = "DEDICATED" | "MODERATE" | "LIGHT" | "MINIMAL";
export type MomentumLevel = "SURGING" | "STRONG" | "MODERATE" | "LOW" | "STALLED";

// --- Module 13: analytics.* ---

export type StudentAnalyticsOverview = {
  testsTaken: number;
  testsCompleted: number;
  questionsSolved: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageScore: number;
  averagePercentage: number;
  bestPercentage: number;
  bestScore: number;
  averageRank: number | null;
  bestRank: number | null;
  totalStudyTime: number;
  lastTestDate: string | null;
};

export type StudentSubjectAnalyticsSummary = {
  subjectId: string;
  subjectName: string;
  attempts: number;
  questionsSolved: number;
  accuracy: number;
  averageTimePerQuestion: number;
  bestScore: number;
  averageScore: number;
};

export type StudentSubjectAnalyticsDetail = StudentSubjectAnalyticsSummary & {
  correctAnswers: number;
  incorrectAnswers: number;
};

export type StudentChapterAnalyticsDetail = {
  chapterId: string;
  chapterName: string;
  subjectId: string;
  attempts: number;
  questionsSolved: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageTimePerQuestion: number;
  weaknessScore: number;
};

export type StudentTopicAnalyticsDetail = {
  topicId: string;
  topicName: string;
  chapterId: string;
  attempts: number;
  questionsSolved: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageTimePerQuestion: number;
  masteryScore: number;
};

export type ProgressSnapshotPoint = {
  date: string;
  rank: number | null;
  accuracy: number;
  averageScore: number;
  averagePercentage: number;
  studyPoints: number;
  testsTaken: number;
};

export type ProgressQuery = { from?: string; to?: string; limit?: number };
export type AnalyticsSubjectsResponseData = StudentSubjectAnalyticsSummary[];
export type AnalyticsProgressResponseData = ProgressSnapshotPoint[];
