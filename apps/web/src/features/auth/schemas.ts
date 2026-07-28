import { z } from "zod";

export const loginFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});

export type LoginFormValues = z.infer<typeof loginFormSchema>;

export const registerFormSchema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  fullName: z.string().min(1, "Full name is required"),
  class: z.coerce.number().int().min(9).max(12),
});

export type RegisterFormValues = z.infer<typeof registerFormSchema>;
