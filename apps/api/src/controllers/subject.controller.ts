import type { Request, Response } from "express";
import type { AdminSubject, ApiResponse, SubjectDetailResponseData, SubjectListResponseData } from "@board-ranking/shared";
import { createSubject as createSubjectService, getPublicSubjectById, listPublicSubjects, updateSubject as updateSubjectService } from "../services/subject.service.js";
import type { SubjectCreateInput, SubjectUpdateInput } from "../validators/question-bank.validators.js";

export async function listSubjects(_req: Request, res: Response): Promise<void> {
  const data = await listPublicSubjects();
  const body: ApiResponse<SubjectListResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getSubject(req: Request, res: Response): Promise<void> {
  const data = await getPublicSubjectById(req.params.id as string);
  const body: ApiResponse<SubjectDetailResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function createSubject(req: Request, res: Response): Promise<void> {
  const data = await createSubjectService(req.body as SubjectCreateInput);
  const body: ApiResponse<AdminSubject> = { success: true, message: "Subject created", data };
  res.status(201).json(body);
}

export async function updateSubject(req: Request, res: Response): Promise<void> {
  const data = await updateSubjectService(req.params.id as string, req.body as SubjectUpdateInput);
  const body: ApiResponse<AdminSubject> = { success: true, message: "Subject updated", data };
  res.status(200).json(body);
}
