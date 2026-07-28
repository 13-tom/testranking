import Link from "next/link";
import { RegisterForm } from "@/features/auth/register-form";

export default function RegisterPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-6 py-12">
      <div className="flex flex-col gap-1 text-center">
        <h1 className="text-2xl font-bold">Create your account</h1>
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Join Board Ranking and start tracking your progress.
        </p>
      </div>

      <RegisterForm />

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="font-medium underline">
          Log in
        </Link>
      </p>
    </main>
  );
}
