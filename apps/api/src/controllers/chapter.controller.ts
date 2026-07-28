import type { Request, Response } from "express";
import type { AdminChapter, ApiResponse, ChapterListResponseData } from "@board-ranking/shared";
import { createChapter as createChapterService, listPublicChapters, updateChapter as updateChapterService } from "../services/chapter.service.js";
import type { ChapterCreateInput, ChaptersQuery, ChapterUpdateInput } from "../validators/question-bank.validators.js";

export async function listChapters(req: Request, res: Response): Promise<void> {
  const data = await listPublicChapters(req.query as ChaptersQuery);
  const body: ApiResponse<ChapterListResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function createChapter(req: Request, res: Response): Promise<void> {
  const data = await createChapterService(req.body as ChapterCreateInput);
  const body: ApiResponse<AdminChapter> = { success: true, message: "Chapter created", data };
  res.status(201).json(body);
}

export async function updateChapter(req: Request, res: Response): Promise<void> {
  const data = await updateChapterService(req.params.id as string, req.body as ChapterUpdateInput);
  const body: ApiResponse<AdminChapter> = { success: true, message: "Chapter updated", data };
  res.status(200).json(body);
}
