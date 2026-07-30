import type { DashboardMasteryStatus } from "@board-ranking/shared";

// Module 14's own mastery bands — simpler and distinct from Module 15's
// MasteryLevel (MASTER/PROFICIENT/DEVELOPING/BEGINNER). See BR-043.
export function classifyDashboardMastery(score: number): DashboardMasteryStatus {
  if (score >= 80) return "MASTERED";
  if (score >= 60) return "PROFICIENT";
  if (score >= 40) return "DEVELOPING";
  return "NEEDS_WORK";
}

export type ProgressSnapshotLike = {
  date: Date;
  rank: number | null;
  accuracy: number;
  averageScore: number;
  averagePercentage: number;
  studyPoints: number;
  testsTaken: number;
};

function periodStart(date: Date, interval: "daily" | "weekly" | "monthly"): string {
  if (interval === "daily") return date.toISOString().slice(0, 10);
  if (interval === "monthly") return date.toISOString().slice(0, 7); // YYYY-MM
  // weekly: ISO week start (Monday), UTC
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = d.getUTCDay() || 7; // Sun=0 -> 7
  d.setUTCDate(d.getUTCDate() - (day - 1));
  return d.toISOString().slice(0, 10);
}

// Decision #18: snapshots are cumulative-as-of-date, so interval
// aggregation takes the LAST (max-date) snapshot within each period
// bucket, not an average.
export function bucketProgressByInterval(
  snapshots: ProgressSnapshotLike[],
  interval: "daily" | "weekly" | "monthly",
): Array<{ periodStart: string; snapshot: ProgressSnapshotLike }> {
  const buckets = new Map<string, ProgressSnapshotLike>();
  for (const snap of snapshots) {
    const key = periodStart(snap.date, interval);
    const existing = buckets.get(key);
    if (!existing || snap.date > existing.date) {
      buckets.set(key, snap);
    }
  }
  return Array.from(buckets.entries())
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([key, snapshot]) => ({ periodStart: key, snapshot }));
}
