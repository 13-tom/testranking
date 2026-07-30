import type {
  DifficultyEntry,
  ImprovementEntry,
  IntelligenceConsistencyResponseData,
  IntelligenceDifficultyResponseData,
  IntelligenceImprovementResponseData,
  IntelligenceLearningPatternsResponseData,
  IntelligenceMasteryResponseData,
  IntelligenceReadinessResponseData,
  MasteryEntry,
} from "@board-ranking/shared";
import {
  findAllChapterAnalytics,
  findAllProgressSnapshots,
  findAllSubjectAnalytics,
  findAllTopicAnalytics,
  findStudentAnalytics,
} from "../repositories/intelligence.repository.js";
import {
  classifyConsistency,
  classifyDifficulty,
  classifyLearningPattern,
  classifyMastery,
  classifyOverallImprovement,
  classifyPracticeFrequency,
  computeCoefficientOfVariation,
  computeDifficultyConfidence,
  computeOverallReadiness,
  computeSubjectImprovementIndicator,
  computeSubjectReadiness,
} from "../rules/intelligence.rules.js";
import type { ImprovementQuery, IntelligenceLimitQuery } from "../validators/intelligence.validators.js";

export async function getMastery(studentId: string, query: IntelligenceLimitQuery): Promise<IntelligenceMasteryResponseData> {
  const limit = query.limit ?? 20;
  const [subjects, chapters, topics] = await Promise.all([
    findAllSubjectAnalytics(studentId),
    findAllChapterAnalytics(studentId),
    findAllTopicAnalytics(studentId),
  ]);

  const toEntry = (entityType: MasteryEntry["entityType"], id: string, name: string, accuracy: number, questionsSolved: number): MasteryEntry => ({
    entityType,
    id,
    name,
    level: classifyMastery(accuracy, questionsSolved),
    accuracy,
    questionsSolved,
  });

  return {
    subjects: subjects
      .map((s) => toEntry("SUBJECT", s.subjectId, s.subject.name, s.accuracy, s.questionsSolved))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, limit),
    chapters: chapters
      .map((c) => toEntry("CHAPTER", c.chapterId, c.chapter.name, c.accuracy, c.questionsSolved))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, limit),
    topics: topics
      .map((t) => toEntry("TOPIC", t.topicId, t.topic.name, t.accuracy, t.questionsSolved))
      .sort((a, b) => b.accuracy - a.accuracy)
      .slice(0, limit),
  };
}

export async function getReadiness(studentId: string): Promise<IntelligenceReadinessResponseData> {
  const [overall, subjects, snapshots] = await Promise.all([
    findStudentAnalytics(studentId),
    findAllSubjectAnalytics(studentId),
    findAllProgressSnapshots(studentId),
  ]);

  const daysSinceLastTest = overall?.lastTestDate ? Math.floor((Date.now() - overall.lastTestDate.getTime()) / (1000 * 60 * 60 * 24)) : 999;
  const cv = computeCoefficientOfVariation(snapshots.map((s) => s.accuracy));
  const overallReadiness = overall ? computeOverallReadiness(overall.accuracy, overall.questionsSolved, daysSinceLastTest, cv) : 0;

  return {
    overall: overallReadiness,
    subjects: subjects.map((s) => ({
      subjectId: s.subjectId,
      subjectName: s.subject.name,
      readiness: computeSubjectReadiness(s.accuracy, s.questionsSolved, s.averageTimePerQuestion),
    })),
  };
}

export async function getImprovement(studentId: string, query: ImprovementQuery): Promise<IntelligenceImprovementResponseData> {
  const limit = query.limit ?? 5;
  const [overall, subjects, chapters, topics, snapshots] = await Promise.all([
    findStudentAnalytics(studentId),
    findAllSubjectAnalytics(studentId),
    findAllChapterAnalytics(studentId),
    findAllTopicAnalytics(studentId),
    findAllProgressSnapshots(studentId),
  ]);

  const half = Math.floor(snapshots.length / 2);
  const olderHalf = snapshots.slice(0, half);
  const recentHalf = snapshots.slice(half);
  const avg = (arr: { accuracy: number }[]) => (arr.length > 0 ? arr.reduce((sum, s) => sum + s.accuracy, 0) / arr.length : 0);
  const overallTrend = classifyOverallImprovement(avg(recentHalf), avg(olderHalf), snapshots.length);

  const overallAccuracy = overall?.accuracy ?? 0;
  const entries: ImprovementEntry[] = [
    ...subjects.map((s) => ({ entityType: "SUBJECT" as const, id: s.subjectId, name: s.subject.name, improvementIndicator: computeSubjectImprovementIndicator(s.bestScore, s.averageScore) })),
    ...chapters.map((c) => ({ entityType: "CHAPTER" as const, id: c.chapterId, name: c.chapter.name, improvementIndicator: c.accuracy - overallAccuracy })),
    ...topics.map((t) => ({ entityType: "TOPIC" as const, id: t.topicId, name: t.topic.name, improvementIndicator: t.masteryScore - overallAccuracy })),
  ];

  const improving = entries.filter((e) => e.improvementIndicator > 0).sort((a, b) => b.improvementIndicator - a.improvementIndicator).slice(0, limit);
  const declining = entries.filter((e) => e.improvementIndicator <= 0).sort((a, b) => a.improvementIndicator - b.improvementIndicator).slice(0, limit);

  return { overallTrend, improving, declining };
}

export async function getConsistency(studentId: string): Promise<IntelligenceConsistencyResponseData> {
  const [subjects, chapters, topics, snapshots] = await Promise.all([
    findAllSubjectAnalytics(studentId),
    findAllChapterAnalytics(studentId),
    findAllTopicAnalytics(studentId),
    findAllProgressSnapshots(studentId),
  ]);

  return {
    temporal: classifyConsistency(computeCoefficientOfVariation(snapshots.map((s) => s.accuracy)), snapshots.length),
    crossSubject: classifyConsistency(computeCoefficientOfVariation(subjects.map((s) => s.accuracy)), subjects.length),
    crossChapter: classifyConsistency(computeCoefficientOfVariation(chapters.map((c) => c.accuracy)), chapters.length),
    crossTopic: classifyConsistency(computeCoefficientOfVariation(topics.map((t) => t.accuracy)), topics.length),
  };
}

export async function getDifficulty(studentId: string, query: IntelligenceLimitQuery): Promise<IntelligenceDifficultyResponseData> {
  const limit = query.limit ?? 20;
  const [subjects, chapters, topics] = await Promise.all([
    findAllSubjectAnalytics(studentId),
    findAllChapterAnalytics(studentId),
    findAllTopicAnalytics(studentId),
  ]);

  const toEntry = (entityType: DifficultyEntry["entityType"], id: string, name: string, accuracy: number, avgTime: number, questionsSolved: number): DifficultyEntry => ({
    entityType,
    id,
    name,
    classification: classifyDifficulty(accuracy, avgTime),
    confidence: computeDifficultyConfidence(questionsSolved),
  });

  const entries = [
    ...subjects.map((s) => toEntry("SUBJECT", s.subjectId, s.subject.name, s.accuracy, s.averageTimePerQuestion, s.questionsSolved)),
    ...chapters.map((c) => toEntry("CHAPTER", c.chapterId, c.chapter.name, c.accuracy, c.averageTimePerQuestion, c.questionsSolved)),
    ...topics.map((t) => toEntry("TOPIC", t.topicId, t.topic.name, t.accuracy, t.averageTimePerQuestion, t.questionsSolved)),
  ];
  return entries.slice(0, limit);
}

export async function getLearningPatterns(studentId: string): Promise<IntelligenceLearningPatternsResponseData> {
  const [overall, subjects] = await Promise.all([findStudentAnalytics(studentId), findAllSubjectAnalytics(studentId)]);

  // BR-043: StudentAnalytics has no averageTimePerQuestion column — derive
  // an overall figure as the questionsSolved-weighted mean across subjects.
  const totalSolved = subjects.reduce((sum, s) => sum + s.questionsSolved, 0);
  const averageTimePerQuestion = totalSolved > 0 ? subjects.reduce((sum, s) => sum + s.averageTimePerQuestion * s.questionsSolved, 0) / totalSolved : 0;
  const accuracy = overall?.accuracy ?? 0;
  const questionsSolved = overall?.questionsSolved ?? 0;

  const pattern = classifyLearningPattern(averageTimePerQuestion, accuracy);
  const practiceFrequency = classifyPracticeFrequency(questionsSolved);

  const insights: string[] = [];
  if (pattern === "FAST_INACCURATE") insights.push("You're answering quickly but missing many questions — slow down and re-read each question.");
  if (pattern === "SLOW_ACCURATE") insights.push("You're accurate but taking longer than average — practice more to build speed.");
  if (pattern === "EFFICIENT") insights.push("You're both fast and accurate — great pace, keep it up.");
  if (pattern === "STRUGGLING") insights.push("Both speed and accuracy need work — consider revisiting fundamentals before more practice.");
  if (practiceFrequency === "MINIMAL" || practiceFrequency === "LIGHT") insights.push("Increasing your practice volume will improve the reliability of these insights.");

  return { pattern, practiceFrequency, averageTimePerQuestion, accuracy, insights };
}
