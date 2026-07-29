import type { Request, Response } from "express";
import type { AttemptResultResponseData, AttemptStateResponseData, ApiResponse, SaveAnswerResponseData } from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import {
  autoSubmitAttempt,
  getAttempt,
  getAttemptResult,
  saveAnswer,
  startAttempt,
  submitAttempt,
} from "../services/test-attempt.service.js";
import type { SaveAnswerInput, StartAttemptInput } from "../validators/test-engine.validators.js";

export async function postStartAttempt(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const data = await startAttempt(req.params.testId as string, req.user.sub, req.body as StartAttemptInput);
  const body: ApiResponse<AttemptStateResponseData> = { success: true, message: "", data };
  res.status(data.status === "STARTED" ? 201 : 200).json(body);
}

export async function getAttemptState(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const data = await getAttempt(req.params.attemptId as string, req.user.sub);
  const body: ApiResponse<AttemptStateResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function putAnswer(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const data = await saveAnswer(
    req.params.attemptId as string,
    req.user.sub,
    req.params.questionId as string,
    req.body as SaveAnswerInput,
  );
  const body: ApiResponse<SaveAnswerResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function postSubmit(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const data = await submitAttempt(req.params.attemptId as string, req.user.sub, "SUBMITTED");
  const body: ApiResponse<AttemptResultResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function postAutoSubmit(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const data = await autoSubmitAttempt(req.params.attemptId as string, req.user.sub);
  const body: ApiResponse<AttemptResultResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getResult(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const data = await getAttemptResult(req.params.attemptId as string, req.user.sub);
  const body: ApiResponse<AttemptResultResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
