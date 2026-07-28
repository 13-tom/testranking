import { z } from "zod";

const difficultyEnum = z.enum(["EASY", "MEDIUM", "HARD"]);
const bloomLevelEnum = z.enum(["REMEMBER", "UNDERSTAND", "APPLY", "ANALYZE"]);
const questionStatusEnum = z.enum(["DRAFT", "IN_REVIEW", "APPROVED", "PUBLISHED", "REJECTED", "ARCHIVED"]);
const optionKeyEnum = z.enum(["A", "B", "C", "D", "E", "F"]);

export const subjectCreateSchema = z.object({
  name: z.string().min(1),
  boardId: z.string().uuid(),
  class: z.number().int().min(9).max(12),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
});
export type SubjectCreateInput = z.infer<typeof subjectCreateSchema>;

export const subjectUpdateSchema = subjectCreateSchema.partial().extend({ isActive: z.boolean().optional() });
export type SubjectUpdateInput = z.infer<typeof subjectUpdateSchema>;

export const chapterCreateSchema = z.object({
  subjectId: z.string().uuid(),
  name: z.string().min(1),
  chapterNumber: z.number().int().positive(),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
});
export type ChapterCreateInput = z.infer<typeof chapterCreateSchema>;

export const chapterUpdateSchema = chapterCreateSchema.partial().extend({ isActive: z.boolean().optional() });
export type ChapterUpdateInput = z.infer<typeof chapterUpdateSchema>;

export const chaptersQuerySchema = z.object({
  class: z.coerce.number().int().min(9).max(12).optional(),
  subjectId: z.string().uuid().optional(),
});
export type ChaptersQuery = z.infer<typeof chaptersQuerySchema>;

export const topicCreateSchema = z.object({
  chapterId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().optional(),
  displayOrder: z.number().int().optional(),
});
export type TopicCreateInput = z.infer<typeof topicCreateSchema>;

export const topicUpdateSchema = topicCreateSchema.partial().extend({ isActive: z.boolean().optional() });
export type TopicUpdateInput = z.infer<typeof topicUpdateSchema>;

export const questionCreateSchema = z.object({
  topicId: z.string().uuid(),
  questionText: z.string().min(1),
  image: z.string().url().optional(),
  explanation: z.string().min(1).optional(),
  difficulty: difficultyEnum,
  bloomLevel: bloomLevelEnum.optional(),
  timeLimitSeconds: z.number().int().positive().optional(),
  positiveMarks: z.number().positive(),
  negativeMarks: z.number().min(0).optional(),
  language: z.string().min(2).max(5).optional(),
  source: z.string().optional(),
  tags: z.array(z.string().trim().toLowerCase().min(1)).optional(),
});
export type QuestionCreateInput = z.infer<typeof questionCreateSchema>;

export const questionUpdateSchema = questionCreateSchema
  .partial()
  .extend({ status: questionStatusEnum.optional(), isActive: z.boolean().optional() });
export type QuestionUpdateInput = z.infer<typeof questionUpdateSchema>;

export const questionOptionCreateSchema = z.object({
  optionKey: optionKeyEnum,
  optionText: z.string().min(1),
  optionImage: z.string().url().optional(),
  explanation: z.string().optional(),
  isCorrect: z.boolean().optional(),
  displayOrder: z.number().int().optional(),
});
export type QuestionOptionCreateInput = z.infer<typeof questionOptionCreateSchema>;

export const questionOptionUpdateSchema = questionOptionCreateSchema
  .partial()
  .extend({ isActive: z.boolean().optional() });
export type QuestionOptionUpdateInput = z.infer<typeof questionOptionUpdateSchema>;
