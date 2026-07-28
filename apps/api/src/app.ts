import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./routes/health.routes.js";
import { authRouter } from "./routes/auth.routes.js";
import { dashboardRouter } from "./routes/dashboard.routes.js";

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

  app.use(errorHandler);

  return app;
}
