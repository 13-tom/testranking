"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/store/admin-auth-context";
import { clsx } from "@/components/ui/clsx";

const NAV_ITEMS = [
  { href: "/admin", label: "Overview" },
  { href: "/admin/questions", label: "Questions" },
  { href: "/admin/students", label: "Students" },
  { href: "/admin/schools", label: "Schools" },
  { href: "/admin/tests", label: "Tests" },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { logout } = useAdminAuth();

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <nav className="flex w-48 shrink-0 flex-col gap-1 border-r border-slate-200 p-4 dark:border-slate-800">
      {NAV_ITEMS.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          className={clsx(
            "rounded-md px-3 py-2 text-sm font-medium",
            pathname === item.href
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800",
          )}
        >
          {item.label}
        </Link>
      ))}

      <button
        onClick={handleLogout}
        className="mt-4 rounded-md px-3 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
      >
        Logout
      </button>
    </nav>
  );
}
