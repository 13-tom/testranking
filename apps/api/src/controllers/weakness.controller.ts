import type { Request, Response } from "express";
import type { ApiResponse, PriorityQueueResponseData, RevisionPlanResponseData, WeaknessOverviewResponseData, WeaknessSubjectsResponseData } from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import { getPriorityQueue, getRevisionPlan, getWeaknessChapters, getWeaknessOverview, getWeaknessSubjects, getWeaknessTopics } from "../services/weakness.service.js";
import type { RevisionPlanQuery, WeaknessListQuery } from "../validators/weakness.validators.js";

function requireStudentId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function getWeaknessOverviewHandler(req: Request, res: Response): Promise<void> {
  const data = await getWeaknessOverview(requireStudentId(req));
  const body: ApiResponse<WeaknessOverviewResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getWeaknessSubjectsHandler(req: Request, res: Response): Promise<void> {
  const data = await getWeaknessSubjects(requireStudentId(req));
  const body: ApiResponse<WeaknessSubjectsResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getWeaknessChaptersHandler(req: Request, res: Response): Promise<void> {
  const data = await getWeaknessChapters(requireStudentId(req), req.query as WeaknessListQuery);
  const body: ApiResponse<typeof data> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getWeaknessTopicsHandler(req: Request, res: Response): Promise<void> {
  const data = await getWeaknessTopics(requireStudentId(req), req.query as WeaknessListQuery);
  const body: ApiResponse<typeof data> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getRevisionPlanHandler(req: Request, res: Response): Promise<void> {
  const data = await getRevisionPlan(requireStudentId(req), req.query as RevisionPlanQuery);
  const body: ApiResponse<RevisionPlanResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getPriorityQueueHandler(req: Request, res: Response): Promise<void> {
  const data = await getPriorityQueue(requireStudentId(req), req.query as WeaknessListQuery);
  const body: ApiResponse<PriorityQueueResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
