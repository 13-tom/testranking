// Phase 5 (Analytics, BR-043) — Module 18: recommendation.* (rule-based
// study recommendations, mounted at /api/v1/recommendations).
import type { CursorPage } from "./pagination.js";
import type { PriorityLevel } from "./analytics.js";

// The 6 documented recommendation types (BR-043 — complete list).
export type RecommendationType =
  | "WEAKNESS_RECOVERY"
  | "DECLINING_RECOVERY"
  | "MASTERY_PUSH"
  | "PRACTICE_GAP"
  | "REVISION"
  | "STRENGTH_MAINTENANCE";

export type ContributingFactor = { code: string; message: string; weight: number; value: number };

export type RecommendationItem = {
  entityType: "SUBJECT" | "CHAPTER" | "TOPIC";
  id: string;
  name: string;
  type: RecommendationType;
  score: number;
  priority: PriorityLevel;
  estimatedTimeMinutes: number;
  reason: string;
  contributingFactors: ContributingFactor[];
  expectedBenefit: string;
  suggestedActivity: string;
  suggestedQuantity: number;
};

export type TodayQuery = { limit?: number };
export type TodayPlanResponseData = RecommendationItem[];

export type WeekQuery = { maxPerDay?: number };
export type WeekPlanDay = { day: "MON" | "TUE" | "WED" | "THU" | "FRI" | "SAT" | "SUN"; theme: string; items: RecommendationItem[] };
export type WeekPlanResponseData = WeekPlanDay[];

export type RecommendationListQuery = { limit?: number; cursor?: string };
export type ChaptersRecommendationResponseData = CursorPage<RecommendationItem>;
export type TopicsRecommendationResponseData = CursorPage<RecommendationItem>;

export type PracticeQuery = { limit?: number };
export type PracticeSuggestion = { activity: string; reason: string };
export type PracticeResponseData = PracticeSuggestion[];

export type RevisionQuery = { limit?: number; cursor?: string };
export type RevisionResponseData = CursorPage<RecommendationItem>;

export type GoalTimeframe = "SHORT_TERM" | "MEDIUM_TERM" | "LONG_TERM";
export type GoalsQuery = { timeframe?: GoalTimeframe };
export type Goal = {
  timeframe: GoalTimeframe;
  description: string;
  target: number;
  currentValue: number;
  requiredImprovement: number;
  estimatedDaysToComplete: number | null;
  confidence: number;
  explanation: string;
};
export type GoalsResponseData = Goal[];

export type RecommendationSummaryResponseData = {
  topItem: RecommendationItem | null;
  totalItemsToday: number;
};
