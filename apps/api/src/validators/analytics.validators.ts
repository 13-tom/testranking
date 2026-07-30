import { z } from "zod";

export const progressQuerySchema = z.object({
  from: z.string().date().optional(),
  to: z.string().date().optional(),
  limit: z.coerce.number().int().min(1).max(365).optional(),
});
export type ProgressQuery = z.infer<typeof progressQuerySchema>;
