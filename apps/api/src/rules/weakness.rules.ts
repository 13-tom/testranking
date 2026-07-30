import type { KnowledgeGap, MasteryLevel, PriorityLevel, WeaknessReasonCode } from "@board-ranking/shared";
import { classifyMastery } from "./intelligence.rules.js";

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

export function computeAccuracyPenalty(accuracy: number): number {
  return 100 - accuracy;
}

export function computeVolumePenalty(questionsSolved: number): number {
  return Math.max(0, 100 - (questionsSolved / 15) * 100);
}

export function computeSpeedPenalty(averageTimePerQuestion: number): number {
  return clamp((averageTimePerQuestion - 45) * 1.5, 0, 100);
}

// Subject mastery penalty = 100 - (averageScore/bestScore*100) — gap
// between peak and average. Chapter/topic penalties are the caller's
// stored weaknessScore (=100-accuracy)/100-masteryScore respectively —
// see BR-043 re: the DB-column weaknessScore name collision.
export function computeSubjectMasteryPenalty(averageScore: number, bestScore: number): number {
  if (bestScore === 0) return 0;
  return 100 - (averageScore / bestScore) * 100;
}

export function computeWeaknessScore(accuracyPenalty: number, volumePenalty: number, speedPenalty: number, masteryPenalty: number): number {
  return 0.4 * accuracyPenalty + 0.25 * volumePenalty + 0.15 * speedPenalty + 0.2 * masteryPenalty;
}

// >=80=CRITICAL(150min), >=60=HIGH(90min), >=40=MEDIUM(45min), >=20=LOW(20min), else VERY_LOW(10min).
export function classifyWeaknessPriority(score: number): { level: PriorityLevel; estimatedTimeMinutes: number } {
  if (score >= 80) return { level: "CRITICAL", estimatedTimeMinutes: 150 };
  if (score >= 60) return { level: "HIGH", estimatedTimeMinutes: 90 };
  if (score >= 40) return { level: "MEDIUM", estimatedTimeMinutes: 45 };
  if (score >= 20) return { level: "LOW", estimatedTimeMinutes: 20 };
  return { level: "VERY_LOW", estimatedTimeMinutes: 10 };
}

// The 5 documented reason codes — fires when its penalty > 20% of max (BR-043).
export function computeWeaknessReasons(
  accuracy: number,
  questionsSolved: number,
  averageTimePerQuestion: number,
  masteryPenalty: number,
  attempts: number,
): WeaknessReasonCode[] {
  const reasons: WeaknessReasonCode[] = [];
  if (computeAccuracyPenalty(accuracy) > 20) reasons.push("LOW_ACCURACY");
  if (questionsSolved < 12) reasons.push("LOW_VOLUME");
  if (computeSpeedPenalty(averageTimePerQuestion) > 20) reasons.push("SLOW_SOLVING");
  if (masteryPenalty > 20) reasons.push("LOW_MASTERY");
  if (accuracy < 40 && attempts >= 10) reasons.push("DECLINING_PERFORMANCE");
  return reasons;
}

const MASTERY_ORDER: MasteryLevel[] = ["BEGINNER", "DEVELOPING", "PROFICIENT", "MASTER"];
const MASTERY_THRESHOLD: Record<MasteryLevel, number> = { BEGINNER: 0, DEVELOPING: 40, PROFICIENT: 65, MASTER: 85 };

export function computeKnowledgeGap(accuracy: number, questionsSolved: number): KnowledgeGap {
  const currentLevel = classifyMastery(accuracy, questionsSolved);
  const currentIndex = MASTERY_ORDER.indexOf(currentLevel);
  const targetLevel = MASTERY_ORDER[Math.min(currentIndex + 1, MASTERY_ORDER.length - 1)] as MasteryLevel;
  const gapScore = Math.max(0, MASTERY_THRESHOLD[targetLevel] - accuracy);
  const requiredImprovement =
    targetLevel === currentLevel
      ? "Already at the highest mastery level."
      : `Improve accuracy by ${gapScore.toFixed(1)} points to reach ${targetLevel}.`;
  return { currentLevel, targetLevel, gapScore, requiredImprovement };
}
