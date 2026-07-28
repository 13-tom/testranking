import type {
  ApiResponse,
  AuthResponseData,
  DashboardResponseData,
  HealthResponseData,
  LoginRequest,
  MeResponseData,
  RegisterRequest,
} from "@board-ranking/shared";

const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

async function postJson<T>(path: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return (await res.json()) as ApiResponse<T>;
}

async function getJson<T>(path: string, token: string): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  });
  return (await res.json()) as ApiResponse<T>;
}

export async function fetchHealth(): Promise<ApiResponse<HealthResponseData>> {
  const res = await fetch(`${API_URL}/api/v1/health`, { cache: "no-store" });
  return (await res.json()) as ApiResponse<HealthResponseData>;
}

export function login(body: LoginRequest): Promise<ApiResponse<AuthResponseData>> {
  return postJson<AuthResponseData>("/api/v1/auth/login", body);
}

export function register(body: RegisterRequest): Promise<ApiResponse<AuthResponseData>> {
  return postJson<AuthResponseData>("/api/v1/auth/register", body);
}

export function fetchMe(token: string): Promise<ApiResponse<MeResponseData>> {
  return getJson<MeResponseData>("/api/v1/auth/me", token);
}

export function fetchDashboard(token: string): Promise<ApiResponse<DashboardResponseData>> {
  return getJson<DashboardResponseData>("/api/v1/dashboard", token);
}
