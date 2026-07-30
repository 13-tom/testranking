// Phase 5 (Analytics, BR-043): in-memory cursor pagination over a
// student's own taxonomy-bounded lists (chapters/topics/weaknesses/
// recommendations — bounded by question-bank size, not attempt volume).
// No DB-level keyset pagination on non-unique computed columns, so no raw
// SQL is needed. Caller sorts deterministically first (score desc, id asc
// tiebreak) then slices here by cursor = last-seen id.

export function paginateByCursor<T extends { id: string }>(
  sortedItems: T[],
  cursor: string | undefined,
  limit: number,
): { items: T[]; nextCursor: string | null } {
  let startIndex = 0;
  if (cursor) {
    const idx = sortedItems.findIndex((item) => item.id === cursor);
    startIndex = idx >= 0 ? idx + 1 : 0;
  }
  const page = sortedItems.slice(startIndex, startIndex + limit);
  const nextCursor = startIndex + limit < sortedItems.length ? (page[page.length - 1]?.id ?? null) : null;
  return { items: page, nextCursor };
}
