import type { ApiResponse, HealthResponseData } from "@board-ranking/shared";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

export async function fetchHealth(): Promise<ApiResponse<HealthResponseData>> {
  const res = await fetch(`${API_URL}/api/v1/health`, { cache: "no-store" });
  return (await res.json()) as ApiResponse<HealthResponseData>;
}
