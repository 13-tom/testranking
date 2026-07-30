import type { Request, Response } from "express";
import type {
  AccuracyTrendResponseData,
  ApiResponse,
  MilestonesResponseData,
  MomentumResponseData,
  RankTrendResponseData,
  SpeedTrendResponseData,
  StudyTimeTrendResponseData,
  SubjectsTrendResponseData,
  TrendOverviewResponseData,
} from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import { getAccuracyTrend, getMilestones, getMomentum, getRankTrend, getSpeedTrend, getStudyTimeTrend, getSubjectsTrend, getTrendOverview } from "../services/trend.service.js";
import type { TrendDateRangeQuery } from "../validators/trend.validators.js";

function requireStudentId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function getTrendOverviewHandler(req: Request, res: Response): Promise<void> {
  const data = await getTrendOverview(requireStudentId(req), req.query as TrendDateRangeQuery);
  const body: ApiResponse<TrendOverviewResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getAccuracyTrendHandler(req: Request, res: Response): Promise<void> {
  const data = await getAccuracyTrend(requireStudentId(req), req.query as TrendDateRangeQuery);
  const body: ApiResponse<AccuracyTrendResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getRankTrendHandler(req: Request, res: Response): Promise<void> {
  const data = await getRankTrend(requireStudentId(req), req.query as TrendDateRangeQuery);
  const body: ApiResponse<RankTrendResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getSpeedTrendHandler(req: Request, res: Response): Promise<void> {
  const data = await getSpeedTrend(requireStudentId(req));
  const body: ApiResponse<SpeedTrendResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getStudyTimeTrendHandler(req: Request, res: Response): Promise<void> {
  const data = await getStudyTimeTrend(requireStudentId(req), req.query as TrendDateRangeQuery);
  const body: ApiResponse<StudyTimeTrendResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getSubjectsTrendHandler(req: Request, res: Response): Promise<void> {
  const data = await getSubjectsTrend(requireStudentId(req), req.query as TrendDateRangeQuery);
  const body: ApiResponse<SubjectsTrendResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getMilestonesHandler(req: Request, res: Response): Promise<void> {
  const data = await getMilestones(requireStudentId(req));
  const body: ApiResponse<MilestonesResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getMomentumHandler(req: Request, res: Response): Promise<void> {
  const data = await getMomentum(requireStudentId(req));
  const body: ApiResponse<MomentumResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
