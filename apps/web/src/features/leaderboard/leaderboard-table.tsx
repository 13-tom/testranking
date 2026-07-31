import type { LeaderboardEntry } from "@board-ranking/shared";
import { clsx } from "@/components/ui/clsx";

export function LeaderboardTable({ entries, currentStudentId }: { entries: LeaderboardEntry[]; currentStudentId: string }) {
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">No one has been ranked here yet.</p>;
  }

  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="border-b border-slate-200 text-xs uppercase text-slate-500 dark:border-slate-800 dark:text-slate-400">
          <th className="py-2 pr-2">Rank</th>
          <th className="py-2 pr-2">Student</th>
          <th className="py-2 pr-2">Class</th>
          <th className="py-2 pr-2">Study Points</th>
        </tr>
      </thead>
      <tbody>
        {entries.map((entry) => {
          const isMe = entry.studentId === currentStudentId;
          return (
            <tr
              key={entry.studentId}
              className={clsx("border-b border-slate-100 dark:border-slate-800", isMe && "bg-slate-100 dark:bg-slate-800")}
            >
              <td className="py-2 pr-2 font-semibold">#{entry.rank}</td>
              <td className="py-2 pr-2">
                <div>
                  {entry.studentName}
                  {isMe && <span className="ml-1 text-xs text-slate-500 dark:text-slate-400">(You)</span>}
                </div>
                {entry.schoolName && <div className="text-xs text-slate-500 dark:text-slate-400">{entry.schoolName}</div>}
              </td>
              <td className="py-2 pr-2">Class {entry.class}</td>
              <td className="py-2 pr-2">{entry.studyPoints}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
