// Phase 7 (Gamification, BR-045) — pure logic. Deliberately lean: no
// separate XP-transaction ledger or level-reference table (Sprint
// 8.1-8.6's documented scope) — level is computed on the fly from
// StudentProfile.studyPoints and persisted alongside it, same pattern as
// every other derived StudentProfile field in this codebase.

// Reuses docs/04_database.md §16g's cumulative XP curve
// (xpRequired(n) = 25n(n+1) - 50 for n >= 2) as a pure formula instead of
// a 100-row LevelDefinition reference table.
const MAX_LEVEL = 100;

function xpRequiredForLevel(level: number): number {
  return level <= 1 ? 0 : 25 * level * (level + 1) - 50;
}

export type StudyLevelInfo = { level: number; xpToNext: number; totalXpForNext: number };

export function computeStudyLevel(studyPoints: number): StudyLevelInfo {
  let level = 1;
  while (level < MAX_LEVEL && xpRequiredForLevel(level + 1) <= studyPoints) {
    level += 1;
  }
  if (level >= MAX_LEVEL) {
    return { level: MAX_LEVEL, xpToNext: 0, totalXpForNext: 0 };
  }
  const nextThreshold = xpRequiredForLevel(level + 1);
  return { level, xpToNext: nextThreshold - studyPoints, totalXpForNext: nextThreshold - xpRequiredForLevel(level) };
}

// No profile-edit endpoint exists yet (out of Phase 7 scope), so
// completion can only reflect what registration itself collects: the
// always-present required fields plus the optional schoolId. 100% is
// reachable today by registering with a school.
const BASE_PROFILE_COMPLETION = 70;
const SCHOOL_PROFILE_COMPLETION_BONUS = 30;

export function computeProfileCompletion(hasSchool: boolean): number {
  return hasSchool ? BASE_PROFILE_COMPLETION + SCHOOL_PROFILE_COMPLETION_BONUS : BASE_PROFILE_COMPLETION;
}

export function truncateToUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function daysBetweenUtcDays(earlier: Date, later: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.round((truncateToUtcDay(later).getTime() - truncateToUtcDay(earlier).getTime()) / msPerDay);
}

export type StreakUpdateResult = { streak: number; longestStreak: number; isNewDay: boolean };

// lastActivityDate is the most recent StudyStreakHistory row's date (null
// if the student has never studied). A same-day repeat is a no-op; a
// one-day gap extends the streak; any larger gap restarts it at 1.
export function evaluateStreakUpdate(
  lastActivityDate: Date | null,
  today: Date,
  currentStreak: number,
  longestStreak: number,
): StreakUpdateResult {
  if (lastActivityDate === null) {
    return { streak: 1, longestStreak: Math.max(longestStreak, 1), isNewDay: true };
  }
  const gap = daysBetweenUtcDays(lastActivityDate, today);
  if (gap === 0) {
    return { streak: currentStreak, longestStreak, isNewDay: false };
  }
  const streak = gap === 1 ? currentStreak + 1 : 1;
  return { streak, longestStreak: Math.max(longestStreak, streak), isNewDay: true };
}

export type AchievementCategory = "PROFILE" | "TESTS" | "ACCURACY" | "STREAK" | "STUDY_POINTS" | "RANK";

export type AchievementDefinition = {
  code: string;
  title: string;
  description: string;
  icon: string;
  category: AchievementCategory;
  studyPointsReward: number;
};

// A lean, self-contained starter set (not the full Sprint 8.3 badge
// catalogue) — one achievement per category, reusing round thresholds
// from the documented milestone/badge lists where sensible (STREAK_7/30,
// RANK_TOP_100, ACCURACY_90 mirror docs/05_API_Blueprint.md's own
// numbers) so they stay consistent with Phase 5's /trends/milestones.
export const ACHIEVEMENT_DEFINITIONS: AchievementDefinition[] = [
  { code: "PROFILE_COMPLETE", title: "All Set Up", description: "Complete your student profile.", icon: "🎯", category: "PROFILE", studyPointsReward: 50 },
  { code: "FIRST_TEST", title: "First Steps", description: "Complete your first test.", icon: "🥇", category: "TESTS", studyPointsReward: 25 },
  { code: "TESTS_10", title: "Getting Consistent", description: "Complete 10 tests.", icon: "📚", category: "TESTS", studyPointsReward: 50 },
  { code: "TESTS_50", title: "Dedicated Learner", description: "Complete 50 tests.", icon: "🏆", category: "TESTS", studyPointsReward: 100 },
  { code: "ACCURACY_90", title: "Sharp Shooter", description: "Score 90% or higher on a test.", icon: "🎯", category: "ACCURACY", studyPointsReward: 50 },
  { code: "PERFECT_SCORE", title: "Perfectionist", description: "Score a perfect 100% on a test.", icon: "💯", category: "ACCURACY", studyPointsReward: 100 },
  { code: "STREAK_7", title: "Week Warrior", description: "Maintain a 7-day study streak.", icon: "🔥", category: "STREAK", studyPointsReward: 75 },
  { code: "STREAK_30", title: "Unstoppable", description: "Maintain a 30-day study streak.", icon: "🔥", category: "STREAK", studyPointsReward: 200 },
  { code: "POINTS_500", title: "Point Collector", description: "Earn 500 Study Points.", icon: "⭐", category: "STUDY_POINTS", studyPointsReward: 25 },
  { code: "RANK_TOP_100", title: "Rising Star", description: "Reach the Top 100 India rank.", icon: "🚀", category: "RANK", studyPointsReward: 100 },
];

export type AchievementSnapshot = {
  testsTaken: number;
  bestPercentage: number;
  studyPoints: number;
  studyStreak: number;
  indiaRank: number | null;
  profileComplete: boolean;
};

const UNLOCK_RULES: Record<string, (snapshot: AchievementSnapshot) => boolean> = {
  PROFILE_COMPLETE: (s) => s.profileComplete,
  FIRST_TEST: (s) => s.testsTaken >= 1,
  TESTS_10: (s) => s.testsTaken >= 10,
  TESTS_50: (s) => s.testsTaken >= 50,
  ACCURACY_90: (s) => s.bestPercentage >= 90,
  PERFECT_SCORE: (s) => s.bestPercentage >= 100,
  STREAK_7: (s) => s.studyStreak >= 7,
  STREAK_30: (s) => s.studyStreak >= 30,
  POINTS_500: (s) => s.studyPoints >= 500,
  RANK_TOP_100: (s) => s.indiaRank !== null && s.indiaRank <= 100,
};

export function evaluateAchievementUnlocks(snapshot: AchievementSnapshot, alreadyEarnedCodes: ReadonlySet<string>): AchievementDefinition[] {
  return ACHIEVEMENT_DEFINITIONS.filter((def) => !alreadyEarnedCodes.has(def.code) && (UNLOCK_RULES[def.code]?.(snapshot) ?? false));
}
