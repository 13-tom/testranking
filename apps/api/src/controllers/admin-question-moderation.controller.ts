import type { Request, Response } from "express";
import type { ApiResponse, BulkModerationResultData, BulkQuestionModerationInput, ReviewQueueResponseData } from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import {
  approveQuestion,
  archiveQuestion,
  bulkApproveQuestions,
  bulkArchiveQuestions,
  bulkRejectQuestions,
  getReviewQueue,
  rejectQuestion,
} from "../services/admin-question-moderation.service.js";
import type { ReviewQueueQuery } from "../validators/admin.validators.js";

function requireAdminId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function getReviewQueueHandler(req: Request, res: Response): Promise<void> {
  const data: ReviewQueueResponseData = await getReviewQueue(req.query as ReviewQueueQuery);
  const body: ApiResponse<ReviewQueueResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function approveQuestionHandler(req: Request, res: Response): Promise<void> {
  await approveQuestion(requireAdminId(req), req.params.id as string);
  const body: ApiResponse<null> = { success: true, message: "Question approved", data: null };
  res.status(200).json(body);
}

export async function rejectQuestionHandler(req: Request, res: Response): Promise<void> {
  await rejectQuestion(requireAdminId(req), req.params.id as string);
  const body: ApiResponse<null> = { success: true, message: "Question rejected", data: null };
  res.status(200).json(body);
}

export async function archiveQuestionHandler(req: Request, res: Response): Promise<void> {
  await archiveQuestion(requireAdminId(req), req.params.id as string);
  const body: ApiResponse<null> = { success: true, message: "Question archived", data: null };
  res.status(200).json(body);
}

export async function bulkApproveQuestionsHandler(req: Request, res: Response): Promise<void> {
  const data: BulkModerationResultData = await bulkApproveQuestions(requireAdminId(req), req.body as BulkQuestionModerationInput);
  const body: ApiResponse<BulkModerationResultData> = { success: true, message: "Questions approved", data };
  res.status(200).json(body);
}

export async function bulkRejectQuestionsHandler(req: Request, res: Response): Promise<void> {
  const data: BulkModerationResultData = await bulkRejectQuestions(requireAdminId(req), req.body as BulkQuestionModerationInput);
  const body: ApiResponse<BulkModerationResultData> = { success: true, message: "Questions rejected", data };
  res.status(200).json(body);
}

export async function bulkArchiveQuestionsHandler(req: Request, res: Response): Promise<void> {
  const data: BulkModerationResultData = await bulkArchiveQuestions(requireAdminId(req), req.body as BulkQuestionModerationInput);
  const body: ApiResponse<BulkModerationResultData> = { success: true, message: "Questions archived", data };
  res.status(200).json(body);
}
