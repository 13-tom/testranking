import express from "express";
import cors from "cors";
import { env } from "./config/env.js";
import { requestLogger } from "./middleware/requestLogger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { healthRouter } from "./features/health/health.routes.js";

export function createApp() {
  const app = express();

  app.use(cors({ origin: env.CORS_ORIGIN.split(",") }));
  app.use(express.json());
  app.use(requestLogger);

  app.use("/api/v1/health", healthRouter);

  app.use(errorHandler);

  return app;
}
