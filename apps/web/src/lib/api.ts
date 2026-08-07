import type {
  AchievementsResponseData,
  AdminChapterListResponseData,
  AdminQuestion,
  AdminQuestionInput,
  AdminQuestionOption,
  AdminQuestionOptionInput,
  AdminQuestionOptionUpdateInput,
  AdminQuestionUpdateInput,
  AdminSchoolDetail,
  AdminSchoolListQuery,
  AdminStudentDetail,
  AdminSubjectListResponseData,
  AdminTest,
  AdminTestInput,
  AdminTestListQuery,
  AdminTestListResponseData,
  AdminTestUpdateInput,
  AdminTopicListResponseData,
  AnalyticsDashboardStrengths,
  AnalyticsDashboardWeaknesses,
  AnalyticsProgressResponseData,
  ApiResponse,
  AttemptResultResponseData,
  AttemptStateResponseData,
  AuthResponseData,
  BulkModerationResultData,
  BulkQuestionModerationInput,
  DashboardResponseData,
  GrantPointsInput,
  HealthResponseData,
  LeaderboardMetadataResponseData,
  LeaderboardResponseData,
  LoginRequest,
  MeResponseData,
  PlatformOverviewResponseData,
  RankHistoryResponseData,
  RegisterRequest,
  ReviewQueueResponseData,
  SaveAnswerRequest,
  SaveAnswerResponseData,
  SchoolListResponseData,
  SchoolStatsResponseData,
  StartAttemptRequest,
  StreakResponseData,
  StudentAnalyticsOverview,
  StudentListResponseData,
  StudentRanksResponseData,
  SuspendStudentInput,
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

async function authPatchJson<T>(path: string, token: string, body?: unknown): Promise<ApiResponse<T>> {
  const res = await fetch(`${API_URL}${path}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body ?? {}),
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

export function fetchAchievements(token: string): Promise<ApiResponse<AchievementsResponseData>> {
  return getJson<AchievementsResponseData>("/api/v1/achievements", token);
}

export function fetchStreak(token: string): Promise<ApiResponse<StreakResponseData>> {
  return getJson<StreakResponseData>("/api/v1/streak", token);
}

// --- Admin (Phase 9, BR-046/BR-047) ---

export function fetchAdminOverview(token: string): Promise<ApiResponse<PlatformOverviewResponseData>> {
  return getJson<PlatformOverviewResponseData>("/api/v1/admin/overview", token);
}

export function fetchAdminSubjects(token: string): Promise<ApiResponse<AdminSubjectListResponseData>> {
  return getJson<AdminSubjectListResponseData>("/api/v1/admin/subjects", token);
}

export function fetchAdminChapters(token: string, subjectId?: string): Promise<ApiResponse<AdminChapterListResponseData>> {
  const qs = subjectId ? `?subjectId=${subjectId}` : "";
  return getJson<AdminChapterListResponseData>(`/api/v1/admin/chapters${qs}`, token);
}

export function fetchAdminTopics(token: string, chapterId?: string): Promise<ApiResponse<AdminTopicListResponseData>> {
  const qs = chapterId ? `?chapterId=${chapterId}` : "";
  return getJson<AdminTopicListResponseData>(`/api/v1/admin/topics${qs}`, token);
}

export function fetchReviewQueue(token: string, cursor?: string): Promise<ApiResponse<ReviewQueueResponseData>> {
  const qs = cursor ? `?cursor=${cursor}` : "";
  return getJson<ReviewQueueResponseData>(`/api/v1/admin/questions/review${qs}`, token);
}

export function bulkApproveQuestions(token: string, questionIds: string[]): Promise<ApiResponse<BulkModerationResultData>> {
  return authPostJson<BulkModerationResultData>("/api/v1/admin/questions/bulk-approve", token, { questionIds } satisfies BulkQuestionModerationInput);
}

export function bulkRejectQuestions(token: string, questionIds: string[]): Promise<ApiResponse<BulkModerationResultData>> {
  return authPostJson<BulkModerationResultData>("/api/v1/admin/questions/bulk-reject", token, { questionIds } satisfies BulkQuestionModerationInput);
}

export function bulkArchiveQuestions(token: string, questionIds: string[]): Promise<ApiResponse<BulkModerationResultData>> {
  return authPostJson<BulkModerationResultData>("/api/v1/admin/questions/bulk-archive", token, { questionIds } satisfies BulkQuestionModerationInput);
}

export function createAdminQuestion(token: string, body: AdminQuestionInput): Promise<ApiResponse<AdminQuestion>> {
  return authPostJson<AdminQuestion>("/api/v1/admin/questions", token, body);
}

export function fetchAdminQuestion(token: string, id: string): Promise<ApiResponse<AdminQuestion>> {
  return getJson<AdminQuestion>(`/api/v1/admin/questions/${id}`, token);
}

export function updateAdminQuestion(token: string, id: string, body: AdminQuestionUpdateInput): Promise<ApiResponse<AdminQuestion>> {
  return authPatchJson<AdminQuestion>(`/api/v1/admin/questions/${id}`, token, body);
}

export function approveQuestion(token: string, id: string): Promise<ApiResponse<AdminQuestion>> {
  return authPatchJson<AdminQuestion>(`/api/v1/admin/questions/${id}/approve`, token);
}

export function rejectQuestion(token: string, id: string): Promise<ApiResponse<AdminQuestion>> {
  return authPatchJson<AdminQuestion>(`/api/v1/admin/questions/${id}/reject`, token);
}

export function archiveQuestion(token: string, id: string): Promise<ApiResponse<AdminQuestion>> {
  return authPatchJson<AdminQuestion>(`/api/v1/admin/questions/${id}/archive`, token);
}

export function createQuestionOption(token: string, questionId: string, body: AdminQuestionOptionInput): Promise<ApiResponse<AdminQuestionOption>> {
  return authPostJson<AdminQuestionOption>(`/api/v1/admin/questions/${questionId}/options`, token, body);
}

export function updateQuestionOption(
  token: string,
  questionId: string,
  optionId: string,
  body: AdminQuestionOptionUpdateInput,
): Promise<ApiResponse<AdminQuestionOption>> {
  return authPatchJson<AdminQuestionOption>(`/api/v1/admin/questions/${questionId}/options/${optionId}`, token, body);
}

export function fetchAdminStudents(
  token: string,
  query: { cursor?: string; search?: string; class?: number; schoolId?: string; isSuspended?: boolean } = {},
): Promise<ApiResponse<StudentListResponseData>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return getJson<StudentListResponseData>(`/api/v1/admin/students${qs ? `?${qs}` : ""}`, token);
}

export function fetchAdminStudent(token: string, id: string): Promise<ApiResponse<AdminStudentDetail>> {
  return getJson<AdminStudentDetail>(`/api/v1/admin/students/${id}`, token);
}

export function suspendStudent(token: string, id: string, body: SuspendStudentInput): Promise<ApiResponse<AdminStudentDetail>> {
  return authPatchJson<AdminStudentDetail>(`/api/v1/admin/students/${id}/suspend`, token, body);
}

export function reactivateStudent(token: string, id: string): Promise<ApiResponse<AdminStudentDetail>> {
  return authPatchJson<AdminStudentDetail>(`/api/v1/admin/students/${id}/reactivate`, token);
}

export function grantStudentPoints(token: string, id: string, body: GrantPointsInput): Promise<ApiResponse<AdminStudentDetail>> {
  return authPostJson<AdminStudentDetail>(`/api/v1/admin/students/${id}/grant-points`, token, body);
}

export function fetchAdminSchools(token: string, query: AdminSchoolListQuery = {}): Promise<ApiResponse<SchoolListResponseData>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return getJson<SchoolListResponseData>(`/api/v1/admin/schools${qs ? `?${qs}` : ""}`, token);
}

export function fetchAdminSchool(token: string, id: string): Promise<ApiResponse<AdminSchoolDetail>> {
  return getJson<AdminSchoolDetail>(`/api/v1/admin/schools/${id}`, token);
}

export function fetchSchoolStats(token: string, id: string): Promise<ApiResponse<SchoolStatsResponseData>> {
  return getJson<SchoolStatsResponseData>(`/api/v1/admin/schools/${id}/stats`, token);
}

export function archiveSchool(token: string, id: string): Promise<ApiResponse<AdminSchoolDetail>> {
  return authPatchJson<AdminSchoolDetail>(`/api/v1/admin/schools/${id}/archive`, token);
}

export function activateSchool(token: string, id: string): Promise<ApiResponse<AdminSchoolDetail>> {
  return authPatchJson<AdminSchoolDetail>(`/api/v1/admin/schools/${id}/activate`, token);
}

export function fetchAdminTests(token: string, query: AdminTestListQuery = {}): Promise<ApiResponse<AdminTestListResponseData>> {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined) params.set(key, String(value));
  }
  const qs = params.toString();
  return getJson<AdminTestListResponseData>(`/api/v1/admin/tests${qs ? `?${qs}` : ""}`, token);
}

export function fetchAdminTestDetail(token: string, id: string): Promise<ApiResponse<AdminTest>> {
  return getJson<AdminTest>(`/api/v1/admin/tests/${id}`, token);
}

export function createAdminTest(token: string, body: AdminTestInput): Promise<ApiResponse<AdminTest>> {
  return authPostJson<AdminTest>("/api/v1/admin/tests", token, body);
}

export function updateAdminTest(token: string, id: string, body: AdminTestUpdateInput): Promise<ApiResponse<AdminTest>> {
  return authPatchJson<AdminTest>(`/api/v1/admin/tests/${id}`, token, body);
}

export function publishTest(token: string, id: string): Promise<ApiResponse<AdminTest>> {
  return authPatchJson<AdminTest>(`/api/v1/admin/tests/${id}/publish`, token);
}

export function unpublishTest(token: string, id: string): Promise<ApiResponse<AdminTest>> {
  return authPatchJson<AdminTest>(`/api/v1/admin/tests/${id}/unpublish`, token);
}
