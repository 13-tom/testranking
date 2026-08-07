import { z } from "zod";

export const questionFormSchema = z.object({
  topicId: z.string().uuid("Select a subject, chapter, and topic"),
  questionText: z.string().min(1, "Question text is required"),
  difficulty: z.enum(["EASY", "MEDIUM", "HARD"]),
  explanation: z.string().min(1, "Explanation is required"),
  positiveMarks: z.coerce.number().positive("Must be positive"),
  negativeMarks: z.coerce.number().min(0).optional(),
});

export type QuestionFormValues = z.infer<typeof questionFormSchema>;
