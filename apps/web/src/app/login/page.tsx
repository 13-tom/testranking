import Link from "next/link";
import { LoginForm } from "@/features/auth/login-form";

export default function LoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Log in</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">Welcome back to Board Ranking.</p>
      </div>

      <LoginForm />

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="font-medium underline">
          Create one
        </Link>
      </p>
    </main>
  );
}
