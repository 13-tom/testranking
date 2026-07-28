import { Router } from "express";
import { dashboard } from "../controllers/dashboard.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const dashboardRouter = Router();

dashboardRouter.get("/", authenticate, asyncHandler(dashboard));
