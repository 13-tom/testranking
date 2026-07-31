import { Router } from "express";
import { getLeaderboardMetadataHandler, getNationalLeaderboardHandler, getScopedLeaderboardHandler } from "../controllers/leaderboard.controller.js";
import { authenticate } from "../middleware/authenticate.js";
import { validateQuery } from "../middleware/validate.js";
import { leaderboardPageQuerySchema } from "../validators/leaderboard.validators.js";
import { asyncHandler } from "../lib/asyncHandler.js";

export const leaderboardRouter = Router();

leaderboardRouter.use(authenticate);
leaderboardRouter.get("/", asyncHandler(getLeaderboardMetadataHandler));
leaderboardRouter.get("/:scope", validateQuery(leaderboardPageQuerySchema), asyncHandler(getNationalLeaderboardHandler));
leaderboardRouter.get("/:scope/:scopeId", validateQuery(leaderboardPageQuerySchema), asyncHandler(getScopedLeaderboardHandler));
