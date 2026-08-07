"use client";

import { useAdminAuth } from "@/store/admin-auth-context";

export function AdminHeader() {
  const { user } = useAdminAuth();

  return (
    <header className="flex items-center justify-between border-b border-slate-200 px-6 py-3 dark:border-slate-800">
      <span className="text-lg font-bold">Board Ranking Admin</span>

      {user && <span className="text-sm text-slate-600 dark:text-slate-400">{user.email}</span>}
    </header>
  );
}
