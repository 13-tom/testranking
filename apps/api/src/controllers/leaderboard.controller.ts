import type { Request, Response } from "express";
import type {
  ApiResponse,
  LeaderboardMetadataResponseData,
  LeaderboardResponseData,
  RankHistoryResponseData,
  StudentRanksResponseData,
} from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import {
  getLeaderboardMetadata,
  getNationalScopeOnly,
  getRankHistory,
  getScopedLeaderboard,
  getStudentRanks,
} from "../services/leaderboard.service.js";
import type { LeaderboardPageQuery } from "../validators/leaderboard.validators.js";

function requireUser(req: Request): { sub: string; role: string } {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user;
}

export function getLeaderboardMetadataHandler(_req: Request, res: Response): void {
  const data: LeaderboardMetadataResponseData = getLeaderboardMetadata();
  const body: ApiResponse<LeaderboardMetadataResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getNationalLeaderboardHandler(req: Request, res: Response): Promise<void> {
  const scope = req.params.scope as string;
  getNationalScopeOnly(scope);
  const data = await getScopedLeaderboard(scope, undefined, req.query as LeaderboardPageQuery);
  const body: ApiResponse<LeaderboardResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getScopedLeaderboardHandler(req: Request, res: Response): Promise<void> {
  const data = await getScopedLeaderboard(req.params.scope as string, req.params.scopeId, req.query as LeaderboardPageQuery);
  const body: ApiResponse<LeaderboardResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getStudentRanksHandler(req: Request, res: Response): Promise<void> {
  requireUser(req);
  const data: StudentRanksResponseData = await getStudentRanks(req.params.studentId as string);
  const body: ApiResponse<StudentRanksResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getRankHistoryHandler(req: Request, res: Response): Promise<void> {
  const caller = requireUser(req);
  const data = await getRankHistory(req.params.studentId as string, caller.sub, caller.role);
  const body: ApiResponse<RankHistoryResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
