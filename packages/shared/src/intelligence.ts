// Phase 5 (Analytics, BR-043) — Module 15: intelligence.* (deterministic
// classification layer, mounted at /api/v1/intelligence).
import type { ConsistencyClassification, DifficultyClassification, MasteryLevel, PracticeFrequency, TrendClassification } from "./analytics.js";

export type MasteryEntry = {
  entityType: "SUBJECT" | "CHAPTER" | "TOPIC";
  id: string;
  name: string;
  level: MasteryLevel;
  accuracy: number;
  questionsSolved: number;
};

export type IntelligenceMasteryResponseData = {
  subjects: MasteryEntry[];
  chapters: MasteryEntry[];
  topics: MasteryEntry[];
};

export type SubjectReadiness = { subjectId: string; subjectName: string; readiness: number };

export type IntelligenceReadinessResponseData = {
  overall: number;
  subjects: SubjectReadiness[];
};

export type ImprovementEntry = { entityType: "SUBJECT" | "CHAPTER" | "TOPIC"; id: string; name: string; improvementIndicator: number };

export type IntelligenceImprovementResponseData = {
  overallTrend: TrendClassification;
  improving: ImprovementEntry[];
  declining: ImprovementEntry[];
};

export type IntelligenceConsistencyResponseData = {
  temporal: ConsistencyClassification;
  crossSubject: ConsistencyClassification;
  crossChapter: ConsistencyClassification;
  crossTopic: ConsistencyClassification;
};

export type DifficultyEntry = {
  entityType: "SUBJECT" | "CHAPTER" | "TOPIC";
  id: string;
  name: string;
  classification: DifficultyClassification;
  confidence: number;
};

export type IntelligenceDifficultyResponseData = DifficultyEntry[];

export type IntelligenceLearningPatternsResponseData = {
  pattern: "FAST_INACCURATE" | "SLOW_ACCURATE" | "EFFICIENT" | "STRUGGLING" | "BALANCED";
  practiceFrequency: PracticeFrequency;
  averageTimePerQuestion: number;
  accuracy: number;
  insights: string[];
};

export type IntelligenceLimitQuery = { limit?: number };
