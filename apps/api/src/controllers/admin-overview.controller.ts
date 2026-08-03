import type { Request, Response } from "express";
import type { ApiResponse, PlatformOverviewResponseData } from "@board-ranking/shared";
import { getPlatformOverview } from "../services/admin-overview.service.js";

export async function getPlatformOverviewHandler(_req: Request, res: Response): Promise<void> {
  const data: PlatformOverviewResponseData = await getPlatformOverview();
  const body: ApiResponse<PlatformOverviewResponseData> = { success: true, message: "", data };
  res.status(200).json(body);
}
