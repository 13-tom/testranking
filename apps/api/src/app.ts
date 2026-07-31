import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";
import { subjectRouter } from "./routes/subject.routes.js";
import { chapterRouter } from "./routes/chapter.routes.js";
import { adminSubjectRouter } from "./routes/admin-subject.routes.js";
import { adminChapterRouter } from "./routes/admin-chapter.routes.js";
import { adminTopicRouter } from "./routes/admin-topic.routes.js";
import { adminQuestionRouter } from "./routes/admin-question.routes.js";
import { testRouter } from "./routes/test.routes.js";
import { adminTestRouter } from "./routes/admin-test.routes.js";
import { testAttemptRouter } from "./routes/test-attempt.routes.js";
import { analyticsRouter } from "./routes/analytics.routes.js";
import { analyticsDashboardRouter } from "./routes/analytics-dashboard.routes.js";
import { intelligenceRouter } from "./routes/intelligence.routes.js";
import { weaknessRouter } from "./routes/weakness.routes.js";
import { trendRouter } from "./routes/trend.routes.js";
import { recommendationRouter } from "./routes/recommendation.routes.js";
import { leaderboardRouter } from "./routes/leaderboard.routes.js";
import { studentRankRouter } from "./routes/student-rank.routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim().replace(/\/$/, "")),
    }),
  );
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api/v1/health", healthRouter);
  app.use("/api/v1/auth", authRouter);
  app.use("/api/v1/dashboard", dashboardRouter);
  app.use("/api/v1/subjects", subjectRouter);
  app.use("/api/v1/chapters", chapterRouter);
  app.use("/api/v1/admin/subjects", adminSubjectRouter);
  app.use("/api/v1/admin/chapters", adminChapterRouter);
  app.use("/api/v1/admin/topics", adminTopicRouter);
  app.use("/api/v1/admin/questions", adminQuestionRouter);
  app.use("/api/v1/tests", testRouter);
  app.use("/api/v1/admin/tests", adminTestRouter);
  app.use("/api/v1/attempts", testAttemptRouter);
  // Phase 5 (Analytics, BR-043)
  app.use("/api/v1/analytics", analyticsRouter);
  app.use("/api/v1/analytics-dashboard", analyticsDashboardRouter);
  app.use("/api/v1/intelligence", intelligenceRouter);
  app.use("/api/v1/weakness", weaknessRouter);
  app.use("/api/v1/trends", trendRouter);
  app.use("/api/v1/recommendations", recommendationRouter);
  // Phase 6 (Ranking, BR-029 through BR-036, BR-044)
  app.use("/api/v1/leaderboards", leaderboardRouter);
  app.use("/api/v1/students", studentRankRouter);

  app.use(errorHandler);

  return app;
}
