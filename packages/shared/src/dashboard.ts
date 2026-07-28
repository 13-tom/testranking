export type DashboardProfile = {
  fullName: string;
  avatarUrl: string | null;
  profileCompletion: number;
};

export type DashboardRank = {
  value: number;
  scope: "OVERALL" | "CLASS";
} | null;

export type DashboardRecentTest = {
  id: string;
  testName: string;
  date: string;
  score: number;
  accuracy: number;
};

export type DashboardRecommendedTest = {
  id: string;
  testName: string;
  reason: string;
} | null;

export type DashboardGoalType = "PROFILE_COMPLETION" | "STATIC";

export type DashboardGoal = {
  type: DashboardGoalType;
  title: string;
  description: string;
  progress: number | null;
  target: number | null;
};

export type DashboardResponseData = {
  profile: DashboardProfile;
  studyPoints: number;
  studyLevel: number;
  studyStreak: number;
  rank: DashboardRank;
  recentTests: DashboardRecentTest[];
  todaysGoal: DashboardGoal;
  recommendedTest: DashboardRecommendedTest;
};
