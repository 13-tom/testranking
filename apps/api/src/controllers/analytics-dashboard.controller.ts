import type { Request, Response } from "express";
import type {
  AnalyticsDashboardChaptersResponseData,
  AnalyticsDashboardOverview,
  AnalyticsDashboardProgressResponseData,
  AnalyticsDashboardStrengths,
  AnalyticsDashboardSubjectsResponseData,
  AnalyticsDashboardSummary,
  AnalyticsDashboardTopicsResponseData,
  AnalyticsDashboardWeaknesses,
  ApiResponse,
} from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import {
  getDashboardChapters,
  getDashboardOverview,
  getDashboardProgress,
  getDashboardStrengths,
  getDashboardSubjects,
  getDashboardSummary,
  getDashboardTopics,
  getDashboardWeaknesses,
} from "../services/analytics-dashboard.service.js";
import type { ChaptersQuery, DashboardProgressQuery, TopNQuery, TopicsQuery } from "../validators/analytics-dashboard.validators.js";

function requireStudentId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function getOverviewHandler(req: Request, res: Response): Promise<void> {
  const data = await getDashboardOverview(requireStudentId(req));
  const body: ApiResponse<AnalyticsDashboardOverview> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getSubjectsHandler(req: Request, res: Response): Promise<void> {
  const data = await getDashboardSubjects(requireStudentId(req));
  const body: ApiResponse<AnalyticsDashboardSubjectsResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getChaptersHandler(req: Request, res: Response): Promise<void> {
  const data = await getDashboardChapters(requireStudentId(req), req.query as ChaptersQuery);
  const body: ApiResponse<AnalyticsDashboardChaptersResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getTopicsHandler(req: Request, res: Response): Promise<void> {
  const data = await getDashboardTopics(requireStudentId(req), req.query as TopicsQuery);
  const body: ApiResponse<AnalyticsDashboardTopicsResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getProgressHandler(req: Request, res: Response): Promise<void> {
  const data = await getDashboardProgress(requireStudentId(req), req.query as DashboardProgressQuery);
  const body: ApiResponse<AnalyticsDashboardProgressResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getStrengthsHandler(req: Request, res: Response): Promise<void> {
  const data = await getDashboardStrengths(requireStudentId(req), req.query as TopNQuery);
  const body: ApiResponse<AnalyticsDashboardStrengths> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getWeaknessesHandler(req: Request, res: Response): Promise<void> {
  const data = await getDashboardWeaknesses(requireStudentId(req), req.query as TopNQuery);
  const body: ApiResponse<AnalyticsDashboardWeaknesses> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getSummaryHandler(req: Request, res: Response): Promise<void> {
  const data = await getDashboardSummary(requireStudentId(req));
  const body: ApiResponse<AnalyticsDashboardSummary> = { success: true, message: "", data };
  res.status(200).json(body);
}
