import { Card } from "@/components/ui/card";

type StatsRowProps = {
  studyPoints: number;
  studyLevel: number;
  studyStreak: number;
};

export function StatsRow({ studyPoints, studyLevel, studyStreak }: StatsRowProps) {
  const stats = [
    { label: "Study Points", value: studyPoints },
    { label: "Study Level", value: studyLevel },
    { label: "Study Streak", value: `${studyStreak} days` },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.label} className="flex flex-col gap-1">
          <span className="text-xs text-slate-500 dark:text-slate-400">{stat.label}</span>
          <span className="text-2xl font-bold">{stat.value}</span>
        </Card>
      ))}
    </div>
  );
}
