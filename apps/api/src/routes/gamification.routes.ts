import { Router } from "express";
import { getAchievementsHandler, getStreakHandler } from "../controllers/gamification.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const gamificationRouter = Router();

gamificationRouter.use(authenticate);
gamificationRouter.get("/achievements", asyncHandler(getAchievementsHandler));
gamificationRouter.get("/streak", asyncHandler(getStreakHandler));
