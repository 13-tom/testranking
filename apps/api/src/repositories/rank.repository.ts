// Phase 5 (Analytics, BR-043): Leaderboard/RankSnapshot don't exist yet
// (Phase 6, Ranking System). Every rank-dependent read in Modules 14/17/18
// goes through these two functions so activation is a one-file change once
// Phase 6 ships — they always return null today.

export async function getCurrentRank(_studentId: string): Promise<number | null> {
  return null;
}

export async function getTotalStudents(): Promise<number | null> {
  return null;
}
