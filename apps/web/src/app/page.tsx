"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { fetchHealth } from "@/lib/api";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";

export default function LandingPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["health"],
    queryFn: fetchHealth,
    retry: false,
  });

  const status = isLoading
    ? "checking..."
    : isError || !data?.success
      ? "unreachable"
      : data.data.status;

  const dotColor =
    status === "ok" ? "bg-emerald-500" : status === "checking..." ? "bg-amber-400" : "bg-red-500";

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="flex w-full justify-end">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center gap-4"
      >
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Board Ranking</h1>
        <p className="max-w-md text-slate-600 dark:text-slate-400">
          India&apos;s competitive ranking platform for CBSE students.
        </p>
      </motion.div>

      <div className="flex items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm dark:border-slate-800">
        <span className={`h-2.5 w-2.5 rounded-full ${dotColor}`} />
        <span>API status: {status}</span>
      </div>

      <div className="flex items-center gap-3">
        <Link href="/login">
          <Button variant="secondary">Log in</Button>
        </Link>
        <Link href="/register">
          <Button>Create account</Button>
        </Link>
      </div>
    </main>
  );
}
