import type { Request, Response } from "express";
import type {
  ApiResponse,
  IntelligenceConsistencyResponseData,
  IntelligenceDifficultyResponseData,
  IntelligenceImprovementResponseData,
  IntelligenceLearningPatternsResponseData,
  IntelligenceMasteryResponseData,
  IntelligenceReadinessResponseData,
} from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import { getConsistency, getDifficulty, getImprovement, getLearningPatterns, getMastery, getReadiness } from "../services/intelligence.service.js";
import type { ImprovementQuery, IntelligenceLimitQuery } from "../validators/intelligence.validators.js";

function requireStudentId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function getMasteryHandler(req: Request, res: Response): Promise<void> {
  const data = await getMastery(requireStudentId(req), req.query as IntelligenceLimitQuery);
  const body: ApiResponse<IntelligenceMasteryResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getReadinessHandler(req: Request, res: Response): Promise<void> {
  const data = await getReadiness(requireStudentId(req));
  const body: ApiResponse<IntelligenceReadinessResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getImprovementHandler(req: Request, res: Response): Promise<void> {
  const data = await getImprovement(requireStudentId(req), req.query as ImprovementQuery);
  const body: ApiResponse<IntelligenceImprovementResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getConsistencyHandler(req: Request, res: Response): Promise<void> {
  const data = await getConsistency(requireStudentId(req));
  const body: ApiResponse<IntelligenceConsistencyResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getDifficultyHandler(req: Request, res: Response): Promise<void> {
  const data = await getDifficulty(requireStudentId(req), req.query as IntelligenceLimitQuery);
  const body: ApiResponse<IntelligenceDifficultyResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getLearningPatternsHandler(req: Request, res: Response): Promise<void> {
  const data = await getLearningPatterns(requireStudentId(req));
  const body: ApiResponse<IntelligenceLearningPatternsResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
