import { z } from "zod";

export const intelligenceLimitQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
});
export type IntelligenceLimitQuery = z.infer<typeof intelligenceLimitQuerySchema>;

export const improvementQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(20).optional(),
});
export type ImprovementQuery = z.infer<typeof improvementQuerySchema>;
