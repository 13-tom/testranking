import type { PriorityLevel, PriorityQueueResponseData, RevisionPlanResponseData, WeaknessEntry, WeaknessOverviewResponseData, WeaknessSubjectsResponseData } from "@board-ranking/shared";
import { findAllChapterAnalytics, findAllSubjectAnalytics, findAllTopicAnalytics } from "../repositories/weakness.repository.js";
import { paginateByCursor } from "../rules/pagination.rules.js";
import {
  computeAccuracyPenalty,
  computeKnowledgeGap,
  computeSpeedPenalty,
  computeSubjectMasteryPenalty,
  computeVolumePenalty,
  computeWeaknessReasons,
  computeWeaknessScore,
  classifyWeaknessPriority,
} from "../rules/weakness.rules.js";
import type { RevisionPlanQuery, WeaknessListQuery } from "../validators/weakness.validators.js";

async function buildAllWeaknessEntries(studentId: string): Promise<WeaknessEntry[]> {
  const [subjects, chapters, topics] = await Promise.all([
    findAllSubjectAnalytics(studentId),
    findAllChapterAnalytics(studentId),
    findAllTopicAnalytics(studentId),
  ]);

  const subjectEntries: WeaknessEntry[] = subjects.map((s) => {
    const masteryPenalty = computeSubjectMasteryPenalty(s.averageScore, s.bestScore);
    const score = computeWeaknessScore(computeAccuracyPenalty(s.accuracy), computeVolumePenalty(s.questionsSolved), computeSpeedPenalty(s.averageTimePerQuestion), masteryPenalty);
    const priority = classifyWeaknessPriority(score);
    return {
      entityType: "SUBJECT",
      id: s.subjectId,
      name: s.subject.name,
      weaknessScore: score,
      priority: priority.level,
      estimatedTimeMinutes: priority.estimatedTimeMinutes,
      reasons: computeWeaknessReasons(s.accuracy, s.questionsSolved, s.averageTimePerQuestion, masteryPenalty, s.attempts),
      knowledgeGap: computeKnowledgeGap(s.accuracy, s.questionsSolved),
    };
  });

  const chapterEntries: WeaknessEntry[] = chapters.map((c) => {
    const masteryPenalty = c.weaknessScore; // BR-043: DB column (100-accuracy) consumed as the masteryPenalty input, never re-exposed as "weaknessScore" here
    const score = computeWeaknessScore(computeAccuracyPenalty(c.accuracy), computeVolumePenalty(c.questionsSolved), computeSpeedPenalty(c.averageTimePerQuestion), masteryPenalty);
    const priority = classifyWeaknessPriority(score);
    return {
      entityType: "CHAPTER",
      id: c.chapterId,
      name: c.chapter.name,
      weaknessScore: score,
      priority: priority.level,
      estimatedTimeMinutes: priority.estimatedTimeMinutes,
      reasons: computeWeaknessReasons(c.accuracy, c.questionsSolved, c.averageTimePerQuestion, masteryPenalty, c.attempts),
      knowledgeGap: computeKnowledgeGap(c.accuracy, c.questionsSolved),
    };
  });

  const topicEntries: WeaknessEntry[] = topics.map((t) => {
    const masteryPenalty = 100 - t.masteryScore;
    const score = computeWeaknessScore(computeAccuracyPenalty(t.accuracy), computeVolumePenalty(t.questionsSolved), computeSpeedPenalty(t.averageTimePerQuestion), masteryPenalty);
    const priority = classifyWeaknessPriority(score);
    return {
      entityType: "TOPIC",
      id: t.topicId,
      name: t.topic.name,
      weaknessScore: score,
      priority: priority.level,
      estimatedTimeMinutes: priority.estimatedTimeMinutes,
      reasons: computeWeaknessReasons(t.accuracy, t.questionsSolved, t.averageTimePerQuestion, masteryPenalty, t.attempts),
      knowledgeGap: computeKnowledgeGap(t.accuracy, t.questionsSolved),
    };
  });

  return [...subjectEntries, ...chapterEntries, ...topicEntries];
}

export async function getWeaknessOverview(studentId: string): Promise<WeaknessOverviewResponseData> {
  const entries = await buildAllWeaknessEntries(studentId);
  const distribution: Record<PriorityLevel, number> = { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0, VERY_LOW: 0 };
  let totalRevisionEstimateMinutes = 0;
  for (const e of entries) {
    distribution[e.priority]++;
    if (e.priority === "CRITICAL" || e.priority === "HIGH") totalRevisionEstimateMinutes += e.estimatedTimeMinutes;
  }
  const topWeaknesses = entries.slice().sort((a, b) => b.weaknessScore - a.weaknessScore).slice(0, 5);
  return { distribution, topWeaknesses, totalRevisionEstimateMinutes };
}

export async function getWeaknessSubjects(studentId: string): Promise<WeaknessSubjectsResponseData> {
  const entries = await buildAllWeaknessEntries(studentId);
  return entries.filter((e) => e.entityType === "SUBJECT").sort((a, b) => b.weaknessScore - a.weaknessScore);
}

export async function getWeaknessChapters(studentId: string, query: WeaknessListQuery) {
  const entries = await buildAllWeaknessEntries(studentId);
  const sorted = entries.filter((e) => e.entityType === "CHAPTER").sort((a, b) => b.weaknessScore - a.weaknessScore);
  return paginateByCursor(sorted, query.cursor, query.limit ?? 10);
}

export async function getWeaknessTopics(studentId: string, query: WeaknessListQuery) {
  const entries = await buildAllWeaknessEntries(studentId);
  const sorted = entries.filter((e) => e.entityType === "TOPIC").sort((a, b) => b.weaknessScore - a.weaknessScore);
  return paginateByCursor(sorted, query.cursor, query.limit ?? 10);
}

// Docs: score ALL entities, filter to HIGH+CRITICAL, sort desc, return top N with position.
export async function getRevisionPlan(studentId: string, query: RevisionPlanQuery): Promise<RevisionPlanResponseData> {
  const entries = await buildAllWeaknessEntries(studentId);
  const filtered = entries.filter((e) => e.priority === "HIGH" || e.priority === "CRITICAL").sort((a, b) => b.weaknessScore - a.weaknessScore);
  const limit = query.limit ?? 10;
  return filtered.slice(0, limit).map((entry, index) => ({ ...entry, position: index + 1 }));
}

export async function getPriorityQueue(studentId: string, query: WeaknessListQuery): Promise<PriorityQueueResponseData> {
  const entries = await buildAllWeaknessEntries(studentId);
  const sorted = entries.slice().sort((a, b) => b.weaknessScore - a.weaknessScore);
  const withPosition = sorted.map((entry, index) => ({ ...entry, position: index + 1 }));
  return paginateByCursor(withPosition, query.cursor, query.limit ?? 10);
}
