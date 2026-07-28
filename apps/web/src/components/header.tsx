"use client";

import { useAuth } from "@/store/auth-context";
import { Avatar } from "@/components/ui/avatar";

export function Header() {
  const { user, studentProfile } = useAuth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3 dark:border-slate-800">
      <span className="text-lg font-bold">Board Ranking</span>

      <div className="flex items-center gap-4">
        <svg
          aria-label="Notifications"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="h-5 w-5 text-slate-500 dark:text-slate-400"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"
          />
        </svg>

        {studentProfile && (
          <span className="hidden text-sm text-slate-600 dark:text-slate-400 sm:inline">
            {studentProfile.studyPoints} SP · Level {studentProfile.studyLevel}
          </span>
        )}

        {user && studentProfile && <Avatar name={studentProfile.fullName} />}
      </div>
    </header>
  );
}
