// Phase 7 (Gamification, BR-045) — lean MVP read surface. studyPoints/
// studyLevel/studyStreak themselves already surface via DashboardResponseData
// (Phase 2) and PublicStudentProfile (Phase 1); these two DTOs cover the
// new Achievements and Streak Calendar reads.

export type AchievementItem = {
  code: string;
  title: string;
  description: string;
  icon: string;
  category: string;
  studyPointsReward: number;
  earned: boolean;
  earnedAt: string | null;
};

export type AchievementsResponseData = {
  items: AchievementItem[];
};

export type StreakHistoryPoint = {
  date: string;
  completed: boolean;
};

export type StreakResponseData = {
  currentStreak: number;
  longestStreak: number;
  history: StreakHistoryPoint[];
};
