import type { Request, Response } from "express";
import type { AdminSchoolDetail, ApiResponse, SchoolListResponseData, SchoolStatsResponseData } from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import { activateSchool, archiveSchool, getSchoolDetail, getSchoolStats, listSchools } from "../services/admin-school.service.js";
import type { AdminSchoolsQuery } from "../validators/admin.validators.js";

function requireAdminId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function listSchoolsHandler(req: Request, res: Response): Promise<void> {
  const data: SchoolListResponseData = await listSchools(req.query as AdminSchoolsQuery);
  const body: ApiResponse<SchoolListResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getSchoolHandler(req: Request, res: Response): Promise<void> {
  const data: AdminSchoolDetail = await getSchoolDetail(req.params.id as string);
  const body: ApiResponse<AdminSchoolDetail> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getSchoolStatsHandler(req: Request, res: Response): Promise<void> {
  const data: SchoolStatsResponseData = await getSchoolStats(req.params.id as string);
  const body: ApiResponse<SchoolStatsResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function archiveSchoolHandler(req: Request, res: Response): Promise<void> {
  const data: AdminSchoolDetail = await archiveSchool(requireAdminId(req), req.params.id as string);
  const body: ApiResponse<AdminSchoolDetail> = { success: true, message: "School archived", data };
  res.status(200).json(body);
}

export async function activateSchoolHandler(req: Request, res: Response): Promise<void> {
  const data: AdminSchoolDetail = await activateSchool(requireAdminId(req), req.params.id as string);
  const body: ApiResponse<AdminSchoolDetail> = { success: true, message: "School activated", data };
  res.status(200).json(body);
}
