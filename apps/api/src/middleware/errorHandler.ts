import type { ErrorRequestHandler } from "express";
import type { ApiResponse } from "@board-ranking/shared";
import { AppError } from "../errors/AppError.js";
import { logger } from "../lib/logger.js";

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof AppError) {
    const body: ApiResponse<never> = {
      success: false,
      message: err.message,
      errors: err.details ?? [],
    };
    res.status(err.statusCode).json(body);
    return;
  }

  logger.error({ err }, "Unhandled error");
  const body: ApiResponse<never> = {
    success: false,
    message: "Internal server error",
    errors: [],
  };
  res.status(500).json(body);
};
