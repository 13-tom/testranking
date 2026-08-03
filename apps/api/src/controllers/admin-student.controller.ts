import type { Request, Response } from "express";
import type { AdminStudentDetail, ApiResponse, GrantPointsInput, StudentListResponseData, SuspendStudentInput } from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import { getStudentDetail, grantPoints, listStudents, reactivateStudent, suspendStudent } from "../services/admin-student.service.js";
import type { AdminStudentsQuery } from "../validators/admin.validators.js";

function requireAdminId(req: Request): string {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  return req.user.sub;
}

export async function listStudentsHandler(req: Request, res: Response): Promise<void> {
  const data: StudentListResponseData = await listStudents(req.query as AdminStudentsQuery);
  const body: ApiResponse<StudentListResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getStudentHandler(req: Request, res: Response): Promise<void> {
  const data: AdminStudentDetail = await getStudentDetail(req.params.id as string);
  const body: ApiResponse<AdminStudentDetail> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function suspendStudentHandler(req: Request, res: Response): Promise<void> {
  const data: AdminStudentDetail = await suspendStudent(requireAdminId(req), req.params.id as string, req.body as SuspendStudentInput);
  const body: ApiResponse<AdminStudentDetail> = { success: true, message: "Student suspended", data };
  res.status(200).json(body);
}

export async function reactivateStudentHandler(req: Request, res: Response): Promise<void> {
  const data: AdminStudentDetail = await reactivateStudent(requireAdminId(req), req.params.id as string);
  const body: ApiResponse<AdminStudentDetail> = { success: true, message: "Student reactivated", data };
  res.status(200).json(body);
}

export async function grantPointsHandler(req: Request, res: Response): Promise<void> {
  const data: AdminStudentDetail = await grantPoints(requireAdminId(req), req.params.id as string, req.body as GrantPointsInput);
  const body: ApiResponse<AdminStudentDetail> = { success: true, message: "Points granted", data };
  res.status(200).json(body);
}
