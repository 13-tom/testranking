export type PoolCounts = Record<"EASY" | "MEDIUM" | "HARD", number>;

export type PoolGateShortfall = { difficulty: string; required: number; available: number };

export type PoolGateResult = { valid: true } | { valid: false; errors: string[]; shortfalls: PoolGateShortfall[] };

// Publish-time gate (DRAFT -> ACTIVE, PATCH /admin/tests/:id/publish):
// for each difficulty bucket in the blueprint's distribution, the scoped
// published question pool must cover at least the rounded-up share of
// questionCount. No exact formula is given in docs/04_database.md /
// docs/05_API_Blueprint.md beyond "validates question pool size and
// difficulty distribution" — this ceil-based per-bucket check is our
// own concrete definition of that gate.
export function evaluatePoolGate(
  questionCount: number,
  difficultyDistribution: Record<string, number>,
  poolCounts: PoolCounts,
): PoolGateResult {
  const shortfalls: PoolGateShortfall[] = [];
  for (const [difficulty, percent] of Object.entries(difficultyDistribution)) {
    const required = Math.ceil((questionCount * percent) / 100);
    const available = poolCounts[difficulty as keyof PoolCounts] ?? 0;
    if (available < required) {
      shortfalls.push({ difficulty, required, available });
    }
  }
  if (shortfalls.length === 0) {
    return { valid: true };
  }
  return {
    valid: false,
    errors: shortfalls.map((s) => `${s.difficulty}: requires ${s.required}, only ${s.available} available in scope`),
    shortfalls,
  };
}
