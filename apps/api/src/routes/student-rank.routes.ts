import { Router } from "express";
import { getRankHistoryHandler, getStudentRanksHandler } from "../controllers/leaderboard.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const studentRankRouter = Router();

studentRankRouter.use(authenticate);
studentRankRouter.get("/:studentId/ranks", asyncHandler(getStudentRanksHandler));
studentRankRouter.get("/:studentId/rank-history", asyncHandler(getRankHistoryHandler));
