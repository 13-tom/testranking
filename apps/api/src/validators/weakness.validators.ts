import { z } from "zod";

export const weaknessListQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).optional(),
  cursor: z.string().uuid().optional(),
});
export type WeaknessListQuery = z.infer<typeof weaknessListQuerySchema>;

export const revisionPlanQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(30).optional(),
});
export type RevisionPlanQuery = z.infer<typeof revisionPlanQuerySchema>;
