import { z } from "zod";

const cursorPageSchema = {
  cursor: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
};

export const reviewQueueQuerySchema = z.object(cursorPageSchema);
export type ReviewQueueQuery = z.infer<typeof reviewQueueQuerySchema>;

export const bulkQuestionIdsSchema = z.object({
  questionIds: z.array(z.string().uuid()).min(1).max(100),
});
export type BulkQuestionIdsInput = z.infer<typeof bulkQuestionIdsSchema>;

export const adminStudentsQuerySchema = z.object({
  ...cursorPageSchema,
  search: z.string().trim().min(1).optional(),
  class: z.coerce.number().int().min(9).max(12).optional(),
  schoolId: z.string().uuid().optional(),
  isSuspended: z.coerce.boolean().optional(),
});
export type AdminStudentsQuery = z.infer<typeof adminStudentsQuerySchema>;

export const suspendStudentSchema = z.object({
  reason: z.string().trim().min(1),
});
export type SuspendStudentInput = z.infer<typeof suspendStudentSchema>;

export const grantPointsSchema = z.object({
  amount: z.number().int().positive(),
  reason: z.string().trim().min(1),
});
export type GrantPointsInput = z.infer<typeof grantPointsSchema>;

export const adminSchoolsQuerySchema = z.object({
  ...cursorPageSchema,
  search: z.string().trim().min(1).optional(),
  state: z.string().trim().min(1).optional(),
  district: z.string().trim().min(1).optional(),
  isActive: z.coerce.boolean().optional(),
});
export type AdminSchoolsQuery = z.infer<typeof adminSchoolsQuerySchema>;

const testStatusEnum = z.enum(["DRAFT", "ACTIVE", "ARCHIVED"]);

export const adminTestsQuerySchema = z.object({
  ...cursorPageSchema,
  status: testStatusEnum.optional(),
  class: z.coerce.number().int().min(9).max(12).optional(),
});
export type AdminTestsQuery = z.infer<typeof adminTestsQuerySchema>;
