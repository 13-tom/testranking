import { z } from "zod";

export const chaptersQuerySchema = z.object({
  sort: z.enum(["weakest", "strongest"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().uuid().optional(),
});
export type ChaptersQuery = z.infer<typeof chaptersQuerySchema>;

export const topicsQuerySchema = z.object({
  sort: z.enum(["strongest", "weakest"]).optional(),
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().uuid().optional(),
});
export type TopicsQuery = z.infer<typeof topicsQuerySchema>;

export const dashboardProgressQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  interval: z.enum(["daily", "weekly", "monthly"]).optional(),
  limit: z.coerce.number().int().min(1).max(365).optional(),
});
export type DashboardProgressQuery = z.infer<typeof dashboardProgressQuerySchema>;

export const topNQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});
export type TopNQuery = z.infer<typeof topNQuerySchema>;
