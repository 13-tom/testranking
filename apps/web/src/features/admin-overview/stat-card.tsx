import { Card } from "@/components/ui/card";

export function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <Card className="flex flex-col gap-1">
      <span className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
    </Card>
  );
}
