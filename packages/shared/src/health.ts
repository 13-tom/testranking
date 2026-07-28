export type HealthStatus = "ok" | "degraded";

export type HealthResponseData = {
  status: HealthStatus;
  database: "ok" | "error";
  redis: "ok" | "error";
  timestamp: string;
};
