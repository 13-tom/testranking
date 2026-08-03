import { Router } from "express";
import { getPlatformOverviewHandler } from "../controllers/admin-overview.controller.js";
import { authenticateAdmin } from "../middleware/authenticate.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const adminOverviewRouter = Router();

adminOverviewRouter.get("/", authenticateAdmin, asyncHandler(getPlatformOverviewHandler));
