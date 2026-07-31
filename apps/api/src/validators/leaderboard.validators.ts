import { z } from "zod";

export const leaderboardPageQuerySchema = z.object({
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
export type LeaderboardPageQuery = z.infer<typeof leaderboardPageQuerySchema>;
