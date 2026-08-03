import type { Request, Response } from "express";
import type { AdminTest, AdminTestListResponseData, ApiResponse, TestDetailResponseData, TestListResponseData } from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import {
  createTest as createTestService,
  getAdminTest,
  getPublicTestById,
  listAdminTests as listAdminTestsService,
  listPublicTests,
  publishTest as publishTestService,
  unpublishTest as unpublishTestService,
  updateTest as updateTestService,
} from "../services/test.service.js";
import type { AdminTestsQuery } from "../validators/admin.validators.js";
import type { TestCreateInput, TestsQuery, TestUpdateInput } from "../validators/test-engine.validators.js";

export async function listTests(req: Request, res: Response): Promise<void> {
  const data = await listPublicTests(req.query as TestsQuery);
  const body: ApiResponse<TestListResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function getTest(req: Request, res: Response): Promise<void> {
  const data = await getPublicTestById(req.params.id as string);
  const body: ApiResponse<TestDetailResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function createTest(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const data = await createTestService(req.body as TestCreateInput, req.user.sub);
  const body: ApiResponse<AdminTest> = { success: true, message: "Test created", data };
  res.status(201).json(body);
}

export async function getAdminTestById(req: Request, res: Response): Promise<void> {
  const data = await getAdminTest(req.params.id as string);
  const body: ApiResponse<AdminTest> = { success: true, message: "", data };
  res.status(200).json(body);
}

export async function updateTest(req: Request, res: Response): Promise<void> {
  const data = await updateTestService(req.params.id as string, req.body as TestUpdateInput);
  const body: ApiResponse<AdminTest> = { success: true, message: "Test updated", data };
  res.status(200).json(body);
}

export async function publishTest(req: Request, res: Response): Promise<void> {
  const data = await publishTestService(req.params.id as string);
  const body: ApiResponse<AdminTest> = { success: true, message: "Test published", data };
  res.status(200).json(body);
}

export async function unpublishTest(req: Request, res: Response): Promise<void> {
  const data = await unpublishTestService(req.params.id as string);
  const body: ApiResponse<AdminTest> = { success: true, message: "Test unpublished", data };
  res.status(200).json(body);
}

export async function listAdminTests(req: Request, res: Response): Promise<void> {
  const data: AdminTestListResponseData = await listAdminTestsService(req.query as AdminTestsQuery);
  const body: ApiResponse<AdminTestListResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
