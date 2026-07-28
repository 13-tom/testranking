"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/store/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerFormSchema, type RegisterFormValues } from "./schemas";

const CLASS_OPTIONS = [9, 10, 11, 12];

export function RegisterForm() {
  const { register: registerUser } = useAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormValues>({ resolver: zodResolver(registerFormSchema) });

  async function onSubmit(values: RegisterFormValues) {
    setFormError(null);
    const result = await registerUser(values);
    if (result.success) {
      router.push("/dashboard");
    } else {
      setFormError(result.message || "Could not create your account");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="fullName" className="text-sm font-medium">
          Full name
        </label>
        <Input id="fullName" autoComplete="name" {...register("fullName")} />
        {errors.fullName && <p className="text-sm text-red-500">{errors.fullName.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email && <p className="text-sm text-red-500">{errors.email.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
        {errors.password && <p className="text-sm text-red-500">{errors.password.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="class" className="text-sm font-medium">
          Class
        </label>
        <select
          id="class"
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-white"
          {...register("class")}
        >
          <option value="">Select class</option>
          {CLASS_OPTIONS.map((c) => (
            <option key={c} value={c}>
              Class {c}
            </option>
          ))}
        </select>
        {errors.class && <p className="text-sm text-red-500">{errors.class.message}</p>}
      </div>

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating account..." : "Create account"}
      </Button>
    </form>
  );
}
