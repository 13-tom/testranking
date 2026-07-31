import type { Request, Response } from "express";
import type { AchievementsResponseData, ApiResponse, StreakResponseData } from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import { getAchievements, getStreak } from "../services/gamification.service.js";

function requireStudentId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function getAchievementsHandler(req: Request, res: Response): Promise<void> {
  const data: AchievementsResponseData = await getAchievements(requireStudentId(req));
  const body: ApiResponse<AchievementsResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getStreakHandler(req: Request, res: Response): Promise<void> {
  const data: StreakResponseData = await getStreak(requireStudentId(req));
  const body: ApiResponse<StreakResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
