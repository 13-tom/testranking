// Phase 5 (Analytics, BR-043) — Module 16: weakness.* (weighted weakness
// scoring + revision queue, mounted at /api/v1/weakness).
import type { CursorPage } from "./pagination.js";
import type { MasteryLevel, PriorityLevel } from "./analytics.js";

// The 5 documented reason codes (BR-043 — complete, exhaustive list).
export type WeaknessReasonCode = "LOW_ACCURACY" | "LOW_VOLUME" | "SLOW_SOLVING" | "LOW_MASTERY" | "DECLINING_PERFORMANCE";

export type KnowledgeGap = {
  currentLevel: MasteryLevel;
  targetLevel: MasteryLevel;
  gapScore: number;
  requiredImprovement: string;
};

export type WeaknessEntry = {
  entityType: "SUBJECT" | "CHAPTER" | "TOPIC";
  id: string;
  name: string;
  weaknessScore: number; // Module 16's composite — see BR-043 re: the DB-column name collision
  priority: PriorityLevel;
  estimatedTimeMinutes: number;
  reasons: WeaknessReasonCode[];
  knowledgeGap: KnowledgeGap;
};

export type WeaknessOverviewResponseData = {
  distribution: Record<PriorityLevel, number>;
  topWeaknesses: WeaknessEntry[];
  totalRevisionEstimateMinutes: number;
};

export type WeaknessSubjectsResponseData = WeaknessEntry[];

export type RevisionPlanItem = WeaknessEntry & { position: number };
export type RevisionPlanResponseData = RevisionPlanItem[];

export type PriorityQueueItem = WeaknessEntry & { position: number };
export type PriorityQueueResponseData = CursorPage<PriorityQueueItem>;

export type WeaknessListQuery = { limit?: number; cursor?: string };
export type RevisionPlanQuery = { limit?: number };
