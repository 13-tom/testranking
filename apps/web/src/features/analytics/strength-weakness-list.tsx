import type { AnalyticsDashboardStrengths, StrengthWeaknessEntry } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";

export function StrengthWeaknessList({
  title,
  data,
  emptyMessage,
}: {
  title: string;
  data: AnalyticsDashboardStrengths;
  emptyMessage: string;
}) {
  const isEmpty = data.subjects.length === 0 && data.chapters.length === 0 && data.topics.length === 0;

  return (
    <Card className="flex flex-col gap-3">
      <span className="font-semibold">{title}</span>
      {isEmpty ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">{emptyMessage}</p>
      ) : (
        <div className="flex flex-col gap-3">
          <EntryGroup label="Subjects" entries={data.subjects} />
          <EntryGroup label="Chapters" entries={data.chapters} />
          <EntryGroup label="Topics" entries={data.topics} />
        </div>
      )}
    </Card>
  );
}

function EntryGroup({ label, entries }: { label: string; entries: StrengthWeaknessEntry[] }) {
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">{label}</span>
      <ul className="flex flex-col gap-1">
        {entries.map((entry) => (
          <li key={`${entry.type}-${entry.id}`} className="flex items-center justify-between text-sm">
            <span>{entry.name}</span>
            <span className="text-slate-500 dark:text-slate-400">{entry.score.toFixed(1)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
