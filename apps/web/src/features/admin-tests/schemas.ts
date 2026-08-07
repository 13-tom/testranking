import { z } from "zod";

export const testFormSchema = z
  .object({
    name: z.string().min(1, "Name is required"),
    boardId: z.string().uuid("Enter a valid board ID"),
    class: z.coerce.number().int().min(9).max(12),
    category: z.enum(["CHAPTER", "SUBJECT", "FULL_SYLLABUS", "MOCK", "DAILY_CHALLENGE"]),
    questionCount: z.coerce.number().int().positive("Must be a positive number"),
    duration: z.coerce.number().int().positive("Must be a positive number of minutes"),
    passingMarks: z.coerce.number().min(0),
    easyPercent: z.coerce.number().min(0).max(100),
    mediumPercent: z.coerce.number().min(0).max(100),
    hardPercent: z.coerce.number().min(0).max(100),
    subjectIds: z.array(z.string().uuid()).min(1, "Select at least one subject"),
  })
  .refine((values) => values.easyPercent + values.mediumPercent + values.hardPercent === 100, {
    message: "Difficulty distribution must add up to 100%",
    path: ["hardPercent"],
  });

export type TestFormValues = z.infer<typeof testFormSchema>;
