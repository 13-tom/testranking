import type { Request, Response } from "express";
import type { AnalyticsProgressResponseData, AnalyticsSubjectsResponseData, ApiResponse, StudentAnalyticsOverview, StudentChapterAnalyticsDetail, StudentSubjectAnalyticsDetail, StudentTopicAnalyticsDetail } from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import { getChapterDetail, getOverview, getProgress, getSubjectDetail, getSubjects, getTopicDetail } from "../services/analytics.service.js";
import type { ProgressQuery } from "../validators/analytics.validators.js";

function requireStudentId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function getAnalyticsOverview(req: Request, res: Response): Promise<void> {
  const data = await getOverview(requireStudentId(req));
  const body: ApiResponse<StudentAnalyticsOverview> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getAnalyticsSubjects(req: Request, res: Response): Promise<void> {
  const data = await getSubjects(requireStudentId(req));
  const body: ApiResponse<AnalyticsSubjectsResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getAnalyticsSubjectDetail(req: Request, res: Response): Promise<void> {
  const data = await getSubjectDetail(requireStudentId(req), req.params.subjectId as string);
  const body: ApiResponse<StudentSubjectAnalyticsDetail> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getAnalyticsChapterDetail(req: Request, res: Response): Promise<void> {
  const data = await getChapterDetail(requireStudentId(req), req.params.chapterId as string);
  const body: ApiResponse<StudentChapterAnalyticsDetail> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getAnalyticsTopicDetail(req: Request, res: Response): Promise<void> {
  const data = await getTopicDetail(requireStudentId(req), req.params.topicId as string);
  const body: ApiResponse<StudentTopicAnalyticsDetail> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getAnalyticsProgress(req: Request, res: Response): Promise<void> {
  const data = await getProgress(requireStudentId(req), req.query as ProgressQuery);
  const body: ApiResponse<AnalyticsProgressResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
