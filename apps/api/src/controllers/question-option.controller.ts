import type { Request, Response } from "express";
import type { AdminQuestionOption, ApiResponse } from "@board-ranking/shared";
import { createOption as createOptionService, updateOption as updateOptionService } from "../services/question-option.service.js";
import type { QuestionOptionCreateInput, QuestionOptionUpdateInput } from "../validators/question-bank.validators.js";

export async function createOption(req: Request, res: Response): Promise<void> {
  const data = await createOptionService(req.params.questionId as string, req.body as QuestionOptionCreateInput);
  const body: ApiResponse<AdminQuestionOption> = { success: true, message: "Option created", data };
  res.status(201).json(body);
}

export async function updateOption(req: Request, res: Response): Promise<void> {
  const data = await updateOptionService(
    req.params.questionId as string,
    req.params.optionId as string,
    req.body as QuestionOptionUpdateInput,
  );
  const body: ApiResponse<AdminQuestionOption> = { success: true, message: "Option updated", data };
  res.status(200).json(body);
}
