import type { Request, Response } from "express";
import type { ApiResponse, DashboardResponseData } from "@board-ranking/shared";
import { UnauthorizedError } from "../errors/AppError.js";
import { getDashboard } from "../services/dashboard.service.js";

export async function dashboard(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new UnauthorizedError();
  }
  const data = await getDashboard(req.user.sub);
  const body: ApiResponse<DashboardResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
