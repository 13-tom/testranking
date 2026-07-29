import { z } from "zod";

const testCategoryEnum = z.enum(["CHAPTER", "SUBJECT", "FULL_SYLLABUS", "MOCK", "DAILY_CHALLENGE"]);
const testModeEnum = z.enum(["PRACTICE", "RANKED"]);
const testVisibilityEnum = z.enum(["PUBLIC", "PRIVATE"]);
const resultPublishPolicyEnum = z.enum(["IMMEDIATE", "AFTER_END_TIME", "MANUAL"]);
const rankingScopeEnum = z.enum(["NONE", "SCHOOL", "DISTRICT", "STATE", "INDIA"]);

const difficultyDistributionSchema = z
  .object({ EASY: z.number().min(0).max(100), MEDIUM: z.number().min(0).max(100), HARD: z.number().min(0).max(100) })
  .refine((d) => d.EASY + d.MEDIUM + d.HARD === 100, {
    message: "difficultyDistribution percentages must sum to 100",
  });

export const testCreateSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().optional(),
  boardId: z.string().uuid(),
  class: z.number().int().min(9).max(12),
  questionCount: z.number().int().min(1).max(200),
  difficultyDistribution: difficultyDistributionSchema,
  questionTypeDistribution: z.record(z.number()).optional(),
  positiveMarks: z.number().min(1).max(10).optional(),
  negativeMarks: z.number().min(0).max(10).optional(),
  language: z.string().min(2).max(5).optional(),
  duration: z.number().int().min(1).max(600),
  passingMarks: z.number().min(0),
  shuffleQuestions: z.boolean().optional(),
  shuffleOptions: z.boolean().optional(),
  visibility: testVisibilityEnum.optional(),
  category: testCategoryEnum,
  mode: testModeEnum.optional(),
  startTime: z.string().datetime().optional(),
  endTime: z.string().datetime().optional(),
  instructions: z.string().max(5000).optional(),
  calculatorAllowed: z.boolean().optional(),
  reviewAllowed: z.boolean().optional(),
  resultPublishPolicy: resultPublishPolicyEnum.optional(),
  rankingScope: rankingScopeEnum.optional(),
  maxAttempts: z.number().int().min(1).optional(),
  subjectIds: z.array(z.string().uuid()).min(1).max(10),
  chapterIds: z.array(z.string().uuid()).optional(),
  topicIds: z.array(z.string().uuid()).optional(),
});
export type TestCreateInput = z.infer<typeof testCreateSchema>;

export const testUpdateSchema = testCreateSchema.partial().extend({ isActive: z.boolean().optional() });
export type TestUpdateInput = z.infer<typeof testUpdateSchema>;

export const startAttemptSchema = z.object({
  retakeMode: z.enum(["NEW", "SAME"]).optional(),
});
export type StartAttemptInput = z.infer<typeof startAttemptSchema>;

export const saveAnswerSchema = z.object({
  selectedOptionKey: z.string().nullable(),
  answerSequence: z.number().int().positive(),
  clientRequestId: z.string().uuid(),
  markedForReview: z.boolean().optional(),
});
export type SaveAnswerInput = z.infer<typeof saveAnswerSchema>;

export const testsQuerySchema = z.object({
  class: z.coerce.number().int().min(9).max(12).optional(),
  boardId: z.string().uuid().optional(),
  category: testCategoryEnum.optional(),
  subjectId: z.string().uuid().optional(),
});
export type TestsQuery = z.infer<typeof testsQuerySchema>;
