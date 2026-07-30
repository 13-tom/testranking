import type { ContributingFactor, Goal, GoalTimeframe, PriorityLevel, RecommendationType, TrendClassification, WeekPlanDay } from "@board-ranking/shared";
import { computeVolumePenalty } from "./weakness.rules.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// BR-043 decision #9: docs give only 2 of 5 anchor points (IMPROVING=15,
// RAPIDLY_DECLINING=100); the rest are filled in symmetrically.
const TREND_FACTOR: Record<TrendClassification, number> = {
  RAPIDLY_IMPROVING: 0,
  IMPROVING: 15,
  STABLE: 50,
  DECLINING: 75,
  RAPIDLY_DECLINING: 100,
  INSUFFICIENT_DATA: 50,
};

export function computeTrendFactor(classification: TrendClassification): number {
  return TREND_FACTOR[classification];
}

// masteryGapFactor: gap to the 85% mastery threshold, scaled to 0-100.
export function computeMasteryGapFactor(masteryMetric: number): number {
  return clamp(((85 - masteryMetric) / 85) * 100, 0, 100);
}

// frequencyFactor: inverse of practice volume (15 questions = fully practiced).
export function computeFrequencyFactor(questionsSolved: number): number {
  return computeVolumePenalty(questionsSolved);
}

// consistencyFactor: inverse of attempt count (5 attempts = consistent).
export function computeConsistencyFactor(attempts: number): number {
  return clamp(100 - (attempts / 5) * 100, 0, 100);
}

export function computeRecommendationScore(
  weaknessFactor: number,
  trendFactor: number,
  readinessFactor: number,
  masteryGapFactor: number,
  frequencyFactor: number,
  consistencyFactor: number,
): number {
  return 0.3 * weaknessFactor + 0.2 * trendFactor + 0.15 * readinessFactor + 0.15 * masteryGapFactor + 0.1 * frequencyFactor + 0.1 * consistencyFactor;
}

// Same shape as Module 16's priority tiers, different (shorter) minutes.
export function classifyRecommendationPriority(score: number): { level: PriorityLevel; estimatedTimeMinutes: number } {
  if (score >= 80) return { level: "CRITICAL", estimatedTimeMinutes: 60 };
  if (score >= 60) return { level: "HIGH", estimatedTimeMinutes: 45 };
  if (score >= 40) return { level: "MEDIUM", estimatedTimeMinutes: 30 };
  if (score >= 20) return { level: "LOW", estimatedTimeMinutes: 20 };
  return { level: "VERY_LOW", estimatedTimeMinutes: 10 };
}

export type RecommendationEntityInput = {
  weaknessScore: number;
  trend: TrendClassification;
  masteryMetric: number; // accuracy for subject/chapter, masteryScore for topic
  questionsSolved: number;
  accuracy: number;
  attempts: number;
};

// The 6 documented recommendation types. Order matters where triggers
// overlap — BR-043's own interpretation: DECLINING_RECOVERY (urgent trend
// signal) first, then WEAKNESS_RECOVERY, PRACTICE_GAP, MASTERY_PUSH,
// STRENGTH_MAINTENANCE, falling back to REVISION as the catch-all for any
// previously-practiced entity that doesn't trigger a stronger signal.
export function determineRecommendationType(input: RecommendationEntityInput): RecommendationType {
  if (input.trend === "DECLINING" || input.trend === "RAPIDLY_DECLINING") return "DECLINING_RECOVERY";
  if (input.weaknessScore >= 60) return "WEAKNESS_RECOVERY";
  if (input.questionsSolved < 10) return "PRACTICE_GAP";
  if (input.masteryMetric >= 60 && input.masteryMetric <= 84) return "MASTERY_PUSH";
  if (input.weaknessScore < 20 && input.masteryMetric >= 85) return "STRENGTH_MAINTENANCE";
  return "REVISION";
}

export function buildContributingFactors(
  weaknessFactor: number,
  trendFactor: number,
  readinessFactor: number,
  masteryGapFactor: number,
  frequencyFactor: number,
  consistencyFactor: number,
): ContributingFactor[] {
  return [
    { code: "WEAKNESS", message: "Based on this area's weakness score", weight: 0.3, value: weaknessFactor },
    { code: "TREND", message: "Based on your recent performance trend", weight: 0.2, value: trendFactor },
    { code: "READINESS", message: "Based on how ready you are for this area", weight: 0.15, value: readinessFactor },
    { code: "MASTERY_GAP", message: "Based on the gap to full mastery", weight: 0.15, value: masteryGapFactor },
    { code: "FREQUENCY", message: "Based on how much you've practiced this area", weight: 0.1, value: frequencyFactor },
    { code: "CONSISTENCY", message: "Based on how many attempts you've made", weight: 0.1, value: consistencyFactor },
  ];
}

export function buildReasonSentence(type: RecommendationType, name: string): string {
  switch (type) {
    case "WEAKNESS_RECOVERY":
      return `${name} is one of your weakest areas — focused practice here will have the biggest impact.`;
    case "DECLINING_RECOVERY":
      return `Your performance in ${name} has been declining recently — revisit it before it slips further.`;
    case "MASTERY_PUSH":
      return `You're close to mastering ${name} — a bit more practice will push you over the threshold.`;
    case "PRACTICE_GAP":
      return `You haven't practiced ${name} much yet — build up your question volume here.`;
    case "REVISION":
      return `${name} could use a revision pass to keep your accuracy sharp.`;
    case "STRENGTH_MAINTENANCE":
      return `${name} is one of your strengths — light maintenance practice will keep it that way.`;
  }
}

export function buildExpectedBenefit(type: RecommendationType): string {
  switch (type) {
    case "WEAKNESS_RECOVERY":
      return "Should meaningfully raise your overall accuracy.";
    case "DECLINING_RECOVERY":
      return "Should stop the decline and stabilize your accuracy here.";
    case "MASTERY_PUSH":
      return "Should push this area to MASTER level.";
    case "PRACTICE_GAP":
      return "Builds a reliable accuracy signal for this area.";
    case "REVISION":
      return "Reinforces retention and prevents accuracy drift.";
    case "STRENGTH_MAINTENANCE":
      return "Maintains your current strength with minimal time investment.";
  }
}

export function suggestedActivityForType(type: RecommendationType): { activity: string; quantity: number } {
  switch (type) {
    case "PRACTICE_GAP":
      return { activity: "Practice Set", quantity: 15 };
    case "REVISION":
    case "STRENGTH_MAINTENANCE":
      return { activity: "Revision Practice", quantity: 10 };
    default:
      return { activity: "Focused Practice", quantity: 10 };
  }
}

// Revision trigger + urgency (feeds /recommendations/revision).
export function isRevisionCandidate(accuracy: number, questionsSolved: number, weaknessScore: number, attempts: number): boolean {
  return (accuracy < 70 && questionsSolved >= 5) || (weaknessScore >= 40 && attempts >= 3);
}

// BR-043 decision #10: volumeBonus is a small capped term so it can't
// dominate the accuracy/weakness terms.
export function computeRevisionUrgency(accuracy: number, weaknessScore: number, questionsSolved: number): number {
  const accuracyDeficit = Math.max(0, 70 - accuracy);
  const volumeBonus = Math.min(10, (questionsSolved / 50) * 10);
  return Math.min(100, accuracyDeficit * 0.6 + weaknessScore * 0.3 + volumeBonus);
}

export type PracticeCounts = { weakChapterCount: number; weakSubjectCount: number; overallAccuracy: number; testsTaken: number; questionsSolved: number };

export function buildPracticeSuggestions(counts: PracticeCounts): Array<{ activity: string; reason: string }> {
  const suggestions: Array<{ activity: string; reason: string }> = [];
  if (counts.weakChapterCount >= 3) suggestions.push({ activity: "Chapter Test", reason: "You have 3 or more weak chapters — a chapter test will target them directly." });
  if (counts.weakSubjectCount >= 2) suggestions.push({ activity: "Subject Test", reason: "You have 2 or more weak subjects — a subject test covers broader ground." });
  if (counts.overallAccuracy < 70) suggestions.push({ activity: "Mixed Practice", reason: "Your overall accuracy is below 70% — mixed practice builds broad-based improvement." });
  if (counts.testsTaken >= 5 && counts.questionsSolved >= 50) suggestions.push({ activity: "Mock Test", reason: "You have enough practice history for a realistic full-length mock test." });
  if (counts.questionsSolved >= 20) suggestions.push({ activity: "Speed Drill", reason: "You've built up enough volume to focus on speed." });
  suggestions.push({ activity: "Revision Practice", reason: "Regular revision keeps previously-learned material sharp." });
  return suggestions;
}

// Weekly scheduling themes — day order, theme, and focus-type match rules
// exactly as documented.
export const WEEK_THEMES: Array<{ day: WeekPlanDay["day"]; theme: string; focus: RecommendationType[] }> = [
  { day: "MON", theme: "Weakness Recovery", focus: ["WEAKNESS_RECOVERY", "DECLINING_RECOVERY"] },
  { day: "TUE", theme: "Balanced Practice", focus: ["PRACTICE_GAP", "MASTERY_PUSH"] },
  { day: "WED", theme: "Weakness Recovery", focus: ["WEAKNESS_RECOVERY", "DECLINING_RECOVERY"] },
  { day: "THU", theme: "Mixed Practice", focus: ["MASTERY_PUSH", "PRACTICE_GAP", "REVISION"] },
  { day: "FRI", theme: "Revision Day", focus: ["REVISION", "STRENGTH_MAINTENANCE"] },
  { day: "SAT", theme: "Deep Practice", focus: ["WEAKNESS_RECOVERY", "PRACTICE_GAP", "MASTERY_PUSH"] },
  { day: "SUN", theme: "Light Review", focus: ["REVISION", "STRENGTH_MAINTENANCE", "MASTERY_PUSH"] },
];

export type GoalDraft = { timeframe: GoalTimeframe; description: string; target: number; currentValue: number; requiredImprovement: number; explanation: string };

// Confidence/estimatedDays are our own reasonable heuristic (docs don't
// specify a formula) — bigger asks score lower confidence, and the
// estimate is capped at the timeframe's own nominal window.
export function finalizeGoal(draft: GoalDraft, timeframeDays: number): Goal {
  const confidence = clamp(100 - draft.requiredImprovement * 2, 5, 95);
  const estimatedDaysToComplete = draft.requiredImprovement > 0 ? Math.min(timeframeDays, Math.round(timeframeDays * (1 - confidence / 100) + timeframeDays * 0.3)) : 0;
  return { ...draft, confidence, estimatedDaysToComplete };
}
