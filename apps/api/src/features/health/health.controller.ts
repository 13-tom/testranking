import type { Request, Response } from "express";
import type { ApiResponse, HealthResponseData } from "@board-ranking/shared";
import { prisma } from "../../lib/prisma.js";
import { redis } from "../../lib/redis.js";
import { logger } from "../../lib/logger.js";

async function checkDatabase(): Promise<"ok" | "error"> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return "ok";
  } catch (err) {
    logger.error({ err }, "Database health check failed");
    return "error";
  }
}

async function checkRedis(): Promise<"ok" | "error"> {
  try {
    await redis.ping();
    return "ok";
  } catch (err) {
    logger.error({ err }, "Redis health check failed");
    return "error";
  }
}

export async function getHealth(_req: Request, res: Response): Promise<void> {
  const [database, redisStatus] = await Promise.all([checkDatabase(), checkRedis()]);
  const status = database === "ok" && redisStatus === "ok" ? "ok" : "degraded";

  const body: ApiResponse<HealthResponseData> = {
    success: true,
    data: {
      status,
      database,
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    },
  };

  res.status(status === "ok" ? 200 : 503).json(body);
}
