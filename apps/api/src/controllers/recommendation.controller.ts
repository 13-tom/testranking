import type { Request, Response } from "express";
import type {
  ApiResponse,
  ChaptersRecommendationResponseData,
  GoalsResponseData,
  PracticeResponseData,
  RecommendationSummaryResponseData,
  RevisionResponseData,
  TodayPlanResponseData,
  TopicsRecommendationResponseData,
  WeekPlanResponseData,
} from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import {
  getChaptersRecommendations,
  getGoals,
  getPracticeSuggestions,
  getRecommendationSummary,
  getRevisionQueue,
  getTodayPlan,
  getTopicsRecommendations,
  getWeekPlan,
} from "../services/recommendation.service.js";
import type { GoalsQuery, PracticeQuery, RecommendationListQuery, RevisionQuery, TodayQuery, WeekQuery } from "../validators/recommendation.validators.js";

function requireStudentId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function getTodayHandler(req: Request, res: Response): Promise<void> {
  const data = await getTodayPlan(requireStudentId(req), req.query as TodayQuery);
  const body: ApiResponse<TodayPlanResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getWeekHandler(req: Request, res: Response): Promise<void> {
  const data = await getWeekPlan(requireStudentId(req), req.query as WeekQuery);
  const body: ApiResponse<WeekPlanResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getChaptersHandler(req: Request, res: Response): Promise<void> {
  const data = await getChaptersRecommendations(requireStudentId(req), req.query as RecommendationListQuery);
  const body: ApiResponse<ChaptersRecommendationResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getTopicsHandler(req: Request, res: Response): Promise<void> {
  const data = await getTopicsRecommendations(requireStudentId(req), req.query as RecommendationListQuery);
  const body: ApiResponse<TopicsRecommendationResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getPracticeHandler(req: Request, res: Response): Promise<void> {
  const data = await getPracticeSuggestions(requireStudentId(req), req.query as PracticeQuery);
  const body: ApiResponse<PracticeResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getRevisionHandler(req: Request, res: Response): Promise<void> {
  const data = await getRevisionQueue(requireStudentId(req), req.query as RevisionQuery);
  const body: ApiResponse<RevisionResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getGoalsHandler(req: Request, res: Response): Promise<void> {
  const data = await getGoals(requireStudentId(req), req.query as GoalsQuery);
  const body: ApiResponse<GoalsResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getSummaryHandler(req: Request, res: Response): Promise<void> {
  const data = await getRecommendationSummary(requireStudentId(req));
  const body: ApiResponse<RecommendationSummaryResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
