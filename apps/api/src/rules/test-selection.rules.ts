import { mulberry32, seededShuffle } from "./random.rules.js";

export type PoolQuestion = {
  questionId: string;
  topicId: string;
  chapterId: string;
  subjectId: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
};

export type SelectionShortfall = { difficulty: string; required: number; available: number };

export type SelectionResult =
  | { ok: true; questionIds: string[]; driftPp: number }
  | { ok: false; shortfalls: SelectionShortfall[] };

const DIFFICULTIES = ["EASY", "MEDIUM", "HARD"] as const;
type DifficultyKey = (typeof DIFFICULTIES)[number];

// Reallocation preference when a bucket can't be filled: pull from the
// adjacent difficulty first (EASY<->MEDIUM<->HARD), matching PRD Ch12
// Phase 4 §9's documented fallback intent of a graceful, bounded drift
// rather than an arbitrary substitution.
const ADJACENCY: Record<DifficultyKey, DifficultyKey[]> = {
  EASY: ["MEDIUM", "HARD"],
  MEDIUM: ["EASY", "HARD"],
  HARD: ["MEDIUM", "EASY"],
};

function computeTargets(questionCount: number, distribution: Record<string, number>): Record<DifficultyKey, number> {
  const raw: Record<DifficultyKey, number> = { EASY: 0, MEDIUM: 0, HARD: 0 };
  let assigned = 0;
  for (const d of DIFFICULTIES) {
    const pct = distribution[d] ?? 0;
    const value = Math.round((questionCount * pct) / 100);
    raw[d] = value;
    assigned += value;
  }
  const drift = questionCount - assigned;
  if (drift !== 0) {
    const largest = DIFFICULTIES.reduce((a, b) => (raw[a] >= raw[b] ? a : b));
    raw[largest] += drift;
  }
  return raw;
}

// Pulls up to `need` questions of one difficulty from a pool, round-robin
// across topics (seeded shuffle of topic order + within each topic) so a
// single topic doesn't dominate the paper. Never mutates the input pool.
function pullFromTier(
  pool: PoolQuestion[],
  difficulty: DifficultyKey,
  need: number,
  alreadySelected: Set<string>,
  rng: () => number,
): string[] {
  if (need <= 0) return [];
  const candidates = pool.filter((q) => q.difficulty === difficulty && !alreadySelected.has(q.questionId));
  if (candidates.length === 0) return [];

  const byTopic = new Map<string, PoolQuestion[]>();
  for (const c of candidates) {
    const arr = byTopic.get(c.topicId) ?? [];
    arr.push(c);
    byTopic.set(c.topicId, arr);
  }

  const topicIds = seededShuffle([...byTopic.keys()], rng);
  const groups = new Map<string, PoolQuestion[]>();
  for (const t of topicIds) {
    groups.set(t, seededShuffle(byTopic.get(t) as PoolQuestion[], rng));
  }

  const picked: string[] = [];
  let madeProgress = true;
  while (picked.length < need && madeProgress) {
    madeProgress = false;
    for (const t of topicIds) {
      if (picked.length >= need) break;
      const group = groups.get(t) as PoolQuestion[];
      const next = group.shift();
      if (next) {
        picked.push(next.questionId);
        madeProgress = true;
      }
    }
  }
  return picked;
}

// docs/04_database.md §12/§14, PRD Ch12 Phase 3-4 (Assessment Generation
// Engine / Intelligent Question Selection Engine). Widens topic -> chapter
// -> subject to fill each difficulty bucket, then reallocates any
// remaining shortfall from adjacent-difficulty surplus, then throws
// (returns ok:false) rather than silently producing a short paper — "the
// engine must never silently produce an invalid assessment."
export function selectQuestionsForBlueprint(
  poolByTier: { topic: PoolQuestion[]; chapter: PoolQuestion[]; subject: PoolQuestion[] },
  questionCount: number,
  difficultyDistribution: Record<string, number>,
  seed: number,
): SelectionResult {
  const rng = mulberry32(seed);
  const targets = computeTargets(questionCount, difficultyDistribution);
  const selectedIds = new Set<string>();
  const selectedByDifficulty: Record<DifficultyKey, string[]> = { EASY: [], MEDIUM: [], HARD: [] };

  for (const pool of [poolByTier.topic, poolByTier.chapter, poolByTier.subject]) {
    for (const d of DIFFICULTIES) {
      const need = targets[d] - selectedByDifficulty[d].length;
      if (need <= 0) continue;
      const picked = pullFromTier(pool, d, need, selectedIds, rng);
      picked.forEach((id) => selectedIds.add(id));
      selectedByDifficulty[d].push(...picked);
    }
  }

  const remaining = questionCount - selectedIds.size;
  if (remaining > 0) {
    const shortDifficulties = DIFFICULTIES.filter((d) => selectedByDifficulty[d].length < targets[d]);
    const priorityOrder: DifficultyKey[] = [];
    for (const short of shortDifficulties) {
      for (const adj of ADJACENCY[short]) {
        if (!priorityOrder.includes(adj)) priorityOrder.push(adj);
      }
    }
    for (const d of DIFFICULTIES) {
      if (!priorityOrder.includes(d)) priorityOrder.push(d);
    }

    let stillNeed = remaining;
    for (const d of priorityOrder) {
      if (stillNeed <= 0) break;
      const picked = pullFromTier(poolByTier.subject, d, stillNeed, selectedIds, rng);
      picked.forEach((id) => selectedIds.add(id));
      selectedByDifficulty[d].push(...picked);
      stillNeed -= picked.length;
    }
  }

  if (selectedIds.size < questionCount) {
    const shortfalls: SelectionShortfall[] = DIFFICULTIES.filter(
      (d) => selectedByDifficulty[d].length < targets[d],
    ).map((d) => ({ difficulty: d, required: targets[d], available: selectedByDifficulty[d].length }));
    if (shortfalls.length === 0) {
      shortfalls.push({ difficulty: "TOTAL", required: questionCount, available: selectedIds.size });
    }
    return { ok: false, shortfalls };
  }

  let driftPp = 0;
  for (const d of DIFFICULTIES) {
    const requestedPct = difficultyDistribution[d] ?? 0;
    const actualPct = questionCount > 0 ? (selectedByDifficulty[d].length / questionCount) * 100 : 0;
    driftPp = Math.max(driftPp, Math.abs(actualPct - requestedPct));
  }

  const orderedByDifficulty = DIFFICULTIES.flatMap((d) => [...selectedByDifficulty[d]].sort()).slice(
    0,
    questionCount,
  );

  return { ok: true, questionIds: orderedByDifficulty, driftPp };
}

// Final display order: shuffled if the blueprint asks for it, else the
// deterministic difficulty-grouped order selectQuestionsForBlueprint
// already produced.
export function finalizeQuestionOrder(questionIds: string[], shuffleQuestions: boolean, seed: number): string[] {
  if (!shuffleQuestions) return questionIds;
  return seededShuffle(questionIds, mulberry32(seed + 1));
}

// Per-question option display order (independent-looking permutation per
// question by mixing the question id into the seed).
export function buildOptionOrder(optionKeys: string[], shuffleOptions: boolean, seed: number, questionId: string): string[] {
  if (!shuffleOptions) return [...optionKeys].sort();
  let mix = seed;
  for (let i = 0; i < questionId.length; i++) {
    mix = (mix * 31 + questionId.charCodeAt(i)) | 0;
  }
  return seededShuffle(optionKeys, mulberry32(mix));
}
