import type { Request, Response } from "express";
import type { AdminQuestion, ApiResponse } from "@board-ranking/shared";
import { createQuestion as createQuestionService, getQuestion as getQuestionService, updateQuestion as updateQuestionService } from "../services/question.service.js";
import type { QuestionCreateInput, QuestionUpdateInput } from "../validators/question-bank.validators.js";

export async function createQuestion(req: Request, res: Response): Promise<void> {
  const data = await createQuestionService(req.body as QuestionCreateInput);
  const body: ApiResponse<AdminQuestion> = { success: true, message: "Question created", data };
  res.status(201).json(body);
}

export async function getQuestion(req: Request, res: Response): Promise<void> {
  const data = await getQuestionService(req.params.id as string);
  const body: ApiResponse<AdminQuestion> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function updateQuestion(req: Request, res: Response): Promise<void> {
  const data = await updateQuestionService(req.params.id as string, req.body as QuestionUpdateInput);
  const body: ApiResponse<AdminQuestion> = { success: true, message: "Question updated", data };
  res.status(200).json(body);
}
