import { z } from "zod";

export const todayQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(10).optional() });
export type TodayQuery = z.infer<typeof todayQuerySchema>;

export const weekQuerySchema = z.object({ maxPerDay: z.coerce.number().int().min(1).max(8).optional() });
export type WeekQuery = z.infer<typeof weekQuerySchema>;

export const recommendationListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().uuid().optional(),
});
export type RecommendationListQuery = z.infer<typeof recommendationListQuerySchema>;

export const practiceQuerySchema = z.object({ limit: z.coerce.number().int().min(1).max(10).optional() });
export type PracticeQuery = z.infer<typeof practiceQuerySchema>;

export const revisionQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).optional(),
  cursor: z.string().uuid().optional(),
});
export type RevisionQuery = z.infer<typeof revisionQuerySchema>;

export const goalsQuerySchema = z.object({ timeframe: z.enum(["SHORT_TERM", "MEDIUM_TERM", "LONG_TERM"]).optional() });
export type GoalsQuery = z.infer<typeof goalsQuerySchema>;
