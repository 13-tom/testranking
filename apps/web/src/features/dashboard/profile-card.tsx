import type { DashboardProfile } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

export function ProfileCard({ profile }: { profile: DashboardProfile }) {
  return (
    <Card className="flex items-center gap-4">
      <Avatar name={profile.fullName} src={profile.avatarUrl} />
      <div className="flex flex-1 flex-col gap-1">
        <span className="font-semibold">{profile.fullName}</span>
        <div className="h-2 w-full rounded-full bg-slate-200 dark:bg-slate-800">
          <div
            className="h-2 rounded-full bg-emerald-500"
            style={{ width: `${profile.profileCompletion}%` }}
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          Profile {profile.profileCompletion}% complete
        </span>
      </div>
    </Card>
  );
}
