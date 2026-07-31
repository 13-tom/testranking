import type {
  AnalyticsDashboardStrengths,
  AnalyticsDashboardWeaknesses,
  AnalyticsProgressResponseData,
  ApiResponse,
  AttemptResultResponseData,
  AttemptStateResponseData,
  AuthResponseData,
  DashboardResponseData,
  HealthResponseData,
  LeaderboardMetadataResponseData,
  LeaderboardResponseData,
  LoginRequest,
  MeResponseData,
  RankHistoryResponseData,
  RegisterRequest,
  SaveAnswerRequest,
  SaveAnswerResponseData,
  StartAttemptRequest,
  StudentAnalyticsOverview,
  StudentRanksResponseData,
  TestDetailResponseData,
  TestListResponseData,
  TodayPlanResponseData,
  TrendOverviewResponseData,
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

async function authPostJson<T>(path: string, token: string, body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
  });
  return (await res.json()) as ApiResponse<T>;
}

async function authPutJson<T>(path: string, token: string, body: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
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

export function fetchTests(token: string, query: { class?: number } = {}): Promise<ApiResponse<TestListResponseData>> {
  const params = new URLSearchParams();
  if (query.class !== undefined) params.set("class", String(query.class));
  const qs = params.toString();
  return getJson<TestListResponseData>(`/api/v1/tests${qs ? `?${qs}` : ""}`, token);
}

export function fetchTestDetail(token: string, testId: string): Promise<ApiResponse<TestDetailResponseData>> {
  return getJson<TestDetailResponseData>(`/api/v1/tests/${testId}`, token);
}

export function startAttempt(token: string, testId: string, body: StartAttemptRequest = {}): Promise<ApiResponse<AttemptStateResponseData>> {
  return authPostJson<AttemptStateResponseData>(`/api/v1/tests/${testId}/attempts`, token, body);
}

export function fetchAttempt(token: string, attemptId: string): Promise<ApiResponse<AttemptStateResponseData>> {
  return getJson<AttemptStateResponseData>(`/api/v1/attempts/${attemptId}`, token);
}

export function saveAnswer(
  token: string,
  attemptId: string,
  questionId: string,
  body: SaveAnswerRequest,
): Promise<ApiResponse<SaveAnswerResponseData>> {
  return authPutJson<SaveAnswerResponseData>(`/api/v1/attempts/${attemptId}/answers/${questionId}`, token, body);
}

export function submitAttempt(token: string, attemptId: string): Promise<ApiResponse<AttemptResultResponseData>> {
  return authPostJson<AttemptResultResponseData>(`/api/v1/attempts/${attemptId}/submit`, token);
}

export function autoSubmitAttempt(token: string, attemptId: string): Promise<ApiResponse<AttemptResultResponseData>> {
  return authPostJson<AttemptResultResponseData>(`/api/v1/attempts/${attemptId}/auto-submit`, token);
}

export function fetchAttemptResult(token: string, attemptId: string): Promise<ApiResponse<AttemptResultResponseData>> {
  return getJson<AttemptResultResponseData>(`/api/v1/attempts/${attemptId}/result`, token);
}

export function fetchAnalyticsOverview(token: string): Promise<ApiResponse<StudentAnalyticsOverview>> {
  return getJson<StudentAnalyticsOverview>("/api/v1/analytics/overview", token);
}

export function fetchStrengths(token: string): Promise<ApiResponse<AnalyticsDashboardStrengths>> {
  return getJson<AnalyticsDashboardStrengths>("/api/v1/analytics-dashboard/strengths", token);
}

export function fetchWeaknesses(token: string): Promise<ApiResponse<AnalyticsDashboardWeaknesses>> {
  return getJson<AnalyticsDashboardWeaknesses>("/api/v1/analytics-dashboard/weaknesses", token);
}

export function fetchProgress(token: string): Promise<ApiResponse<AnalyticsProgressResponseData>> {
  return getJson<AnalyticsProgressResponseData>("/api/v1/analytics/progress", token);
}

export function fetchTrendOverview(token: string): Promise<ApiResponse<TrendOverviewResponseData>> {
  return getJson<TrendOverviewResponseData>("/api/v1/trends/overview", token);
}

export function fetchTodayRecommendations(token: string): Promise<ApiResponse<TodayPlanResponseData>> {
  return getJson<TodayPlanResponseData>("/api/v1/recommendations/today", token);
}

export function fetchLeaderboardMetadata(token: string): Promise<ApiResponse<LeaderboardMetadataResponseData>> {
  return getJson<LeaderboardMetadataResponseData>("/api/v1/leaderboards", token);
}

export function fetchLeaderboard(
  token: string,
  scope: string,
  scopeId: string,
  cursor?: string,
): Promise<ApiResponse<LeaderboardResponseData>> {
  const params = new URLSearchParams();
  if (cursor) params.set("cursor", cursor);
  const qs = params.toString();
  return getJson<LeaderboardResponseData>(`/api/v1/leaderboards/${scope}/${scopeId}${qs ? `?${qs}` : ""}`, token);
}

export function fetchStudentRanks(token: string, studentId: string): Promise<ApiResponse<StudentRanksResponseData>> {
  return getJson<StudentRanksResponseData>(`/api/v1/students/${studentId}/ranks`, token);
}

export function fetchRankHistory(token: string, studentId: string): Promise<ApiResponse<RankHistoryResponseData>> {
  return getJson<RankHistoryResponseData>(`/api/v1/students/${studentId}/rank-history`, token);
}
