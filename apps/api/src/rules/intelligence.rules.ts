import type { ConsistencyClassification, DifficultyClassification, LearningPattern, MasteryLevel, PracticeFrequency, TrendClassification } from "@board-ranking/shared";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

// MASTER(acc>=85 & solved>=10), PROFICIENT(acc>=65 & solved>=5),
// DEVELOPING(acc>=40 & solved>=1), else BEGINNER.
export function classifyMastery(accuracy: number, questionsSolved: number): MasteryLevel {
  if (accuracy >= 85 && questionsSolved >= 10) return "MASTER";
  if (accuracy >= 65 && questionsSolved >= 5) return "PROFICIENT";
  if (accuracy >= 40 && questionsSolved >= 1) return "DEVELOPING";
  return "BEGINNER";
}

export function computeCoefficientOfVariation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  if (mean === 0) return 0;
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
  return Math.sqrt(variance) / mean;
}

// Overall readiness = accuracy*0.4 + volumeScore*0.3 + recencyScore*0.2 + consistencyBonus*0.1
export function computeOverallReadiness(accuracy: number, questionsSolved: number, daysSinceLastTest: number, cv: number): number {
  const volumeScore = Math.min(100, (questionsSolved / 20) * 100);
  const recencyScore = clamp(100 - daysSinceLastTest * 2, 0, 100);
  const consistencyBonus = cv < 0.15 ? 100 : cv < 0.3 ? 50 : 0;
  return accuracy * 0.4 + volumeScore * 0.3 + recencyScore * 0.2 + consistencyBonus * 0.1;
}

// Per-subject readiness = accuracy*0.5 + volumeScore*0.3 + speedScore*0.2
export function computeSubjectReadiness(accuracy: number, questionsSolved: number, averageTimePerQuestion: number): number {
  const volumeScore = Math.min(100, (questionsSolved / 15) * 100);
  const speedScore = clamp(100 - (averageTimePerQuestion - 30) * 0.8, 0, 100);
  return accuracy * 0.5 + volumeScore * 0.3 + speedScore * 0.2;
}

// Overall improvement: split into two halves, compare avg accuracy.
// delta>2=IMPROVING, <-2=DECLINING, else STABLE. Min 4 snapshots required.
// (A simpler 3-state classifier than Module 17's 6-state trend — BR-043.)
export function classifyOverallImprovement(recentHalfAvgAccuracy: number, olderHalfAvgAccuracy: number, snapshotCount: number): TrendClassification {
  if (snapshotCount < 4) return "INSUFFICIENT_DATA";
  const delta = recentHalfAvgAccuracy - olderHalfAvgAccuracy;
  if (delta > 2) return "IMPROVING";
  if (delta < -2) return "DECLINING";
  return "STABLE";
}

export function computeSubjectImprovementIndicator(bestScore: number, averageScore: number): number {
  if (averageScore === 0) return 0;
  return ((bestScore - averageScore) / averageScore) * 100;
}

// <3 points=INSUFFICIENT_DATA; cv<0.10=VERY_CONSISTENT; cv<0.20=CONSISTENT;
// cv<0.35=VARIABLE; else HIGHLY_VARIABLE.
export function classifyConsistency(cv: number, dataPointCount: number): ConsistencyClassification {
  if (dataPointCount < 3) return "INSUFFICIENT_DATA";
  if (cv < 0.1) return "VERY_CONSISTENT";
  if (cv < 0.2) return "CONSISTENT";
  if (cv < 0.35) return "VARIABLE";
  return "HIGHLY_VARIABLE";
}

// acc>=80 & avgTime<=60s=EASY; acc>=60 OR(acc>=50 & avgTime<=90s)=MODERATE;
// acc>=35=CHALLENGING; else DIFFICULT.
export function classifyDifficulty(accuracy: number, averageTimePerQuestion: number): DifficultyClassification {
  if (accuracy >= 80 && averageTimePerQuestion <= 60) return "EASY";
  if (accuracy >= 60 || (accuracy >= 50 && averageTimePerQuestion <= 90)) return "MODERATE";
  if (accuracy >= 35) return "CHALLENGING";
  return "DIFFICULT";
}

export function computeDifficultyConfidence(questionsSolved: number): number {
  return Math.min(100, (questionsSolved / 20) * 100);
}

// avgTime<30s & acc<50%=FAST_INACCURATE; avgTime>90s & acc>=70%=SLOW_ACCURATE;
// avgTime<=60s & acc>=75%=EFFICIENT; avgTime>90s & acc<50%=STRUGGLING; else BALANCED.
export function classifyLearningPattern(averageTimePerQuestion: number, accuracy: number): LearningPattern {
  if (averageTimePerQuestion < 30 && accuracy < 50) return "FAST_INACCURATE";
  if (averageTimePerQuestion > 90 && accuracy >= 70) return "SLOW_ACCURATE";
  if (averageTimePerQuestion <= 60 && accuracy >= 75) return "EFFICIENT";
  if (averageTimePerQuestion > 90 && accuracy < 50) return "STRUGGLING";
  return "BALANCED";
}

// DEDICATED(>=100q), MODERATE(>=30), LIGHT(>=10), else MINIMAL.
export function classifyPracticeFrequency(questionsSolved: number): PracticeFrequency {
  if (questionsSolved >= 100) return "DEDICATED";
  if (questionsSolved >= 30) return "MODERATE";
  if (questionsSolved >= 10) return "LIGHT";
  return "MINIMAL";
}
