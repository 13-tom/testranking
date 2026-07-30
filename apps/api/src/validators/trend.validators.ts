import { z } from "zod";

export const trendDateRangeQuerySchema = z
  .object({ from: z.string().date().optional(), to: z.string().date().optional() })
  .refine((q) => !q.from || !q.to || q.from <= q.to, { message: "to must be after from" });
export type TrendDateRangeQuery = z.infer<typeof trendDateRangeQuerySchema>;
