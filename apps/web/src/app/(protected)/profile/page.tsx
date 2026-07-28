"use client";

import { useAuth } from "@/store/auth-context";
import { Card } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";

export default function ProfilePage() {
  const { user, studentProfile } = useAuth();

  if (!user || !studentProfile) {
    return null;
  }

  const fields = [
    { label: "Full name", value: studentProfile.fullName },
    { label: "Email", value: user.email },
    { label: "Class", value: `Class ${studentProfile.class}` },
    { label: "Study Points", value: studentProfile.studyPoints },
    { label: "Study Level", value: studentProfile.studyLevel },
    { label: "Study Streak", value: `${studentProfile.studyStreak} days` },
    { label: "Profile Completion", value: `${studentProfile.profileCompletion}%` },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4">
        <Avatar name={studentProfile.fullName} />
        <h1 className="text-xl font-bold">{studentProfile.fullName}</h1>
      </div>

      <Card className="flex flex-col divide-y divide-slate-200 dark:divide-slate-800">
        {fields.map((field) => (
          <div key={field.label} className="flex items-center justify-between py-2 text-sm">
            <span className="text-slate-500 dark:text-slate-400">{field.label}</span>
            <span className="font-medium">{field.value}</span>
          </div>
        ))}
      </Card>
    </div>
  );
}
