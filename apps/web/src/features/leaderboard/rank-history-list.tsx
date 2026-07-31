import type { RankHistoryEntry, RankScope } from "@board-ranking/shared";

const SCOPE_LABEL: Record<RankScope, string> = {
  SCHOOL: "School",
  DISTRICT: "District",
  STATE: "State",
  NATIONAL: "National",
};

export function RankHistoryList({ items }: { items: RankHistoryEntry[] }) {
  if (items.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No rank history yet — take a ranked test to appear here.</p>;
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, index) => (
        <li
          key={`${item.scope}-${item.scopeId}-${item.computedAt}-${index}`}
          className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm dark:border-slate-800"
        >
          <span className="font-medium">{SCOPE_LABEL[item.scope]}</span>
          <span>
            #{item.rank} of {item.totalStudents}
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">{new Date(item.computedAt).toLocaleDateString()}</span>
        </li>
      ))}
    </ul>
  );
}
