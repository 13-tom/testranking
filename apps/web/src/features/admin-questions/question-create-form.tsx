"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createAdminQuestion } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TopicPicker } from "./topic-picker";
import { questionFormSchema, type QuestionFormValues } from "./schemas";

export function QuestionCreateForm() {
  const { token } = useAdminAuth();
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<QuestionFormValues>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: { topicId: "", difficulty: "EASY" },
  });

  async function onSubmit(values: QuestionFormValues) {
    setFormError(null);
    const res = await createAdminQuestion(token as string, values);
    if (res.success) {
      router.push(`/admin/questions/${res.data.id}`);
    } else {
      setFormError(res.message || "Could not create question");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <TopicPicker topicId={watch("topicId")} onChange={(topicId) => setValue("topicId", topicId, { shouldValidate: true })} />
      {errors.topicId && <p className="text-sm text-red-500">{errors.topicId.message}</p>}

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Question Text</label>
        <textarea
          {...register("questionText")}
          rows={3}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-white"
        />
        {errors.questionText && <p className="text-sm text-red-500">{errors.questionText.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Explanation</label>
        <textarea
          {...register("explanation")}
          rows={2}
          className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 dark:border-slate-700 dark:bg-slate-950 dark:text-white dark:focus:ring-white"
        />
        {errors.explanation && <p className="text-sm text-red-500">{errors.explanation.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Difficulty</label>
          <Select {...register("difficulty")}>
            <option value="EASY">Easy</option>
            <option value="MEDIUM">Medium</option>
            <option value="HARD">Hard</option>
          </Select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Positive Marks</label>
          <Input type="number" step="0.5" {...register("positiveMarks")} />
          {errors.positiveMarks && <p className="text-sm text-red-500">{errors.positiveMarks.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Negative Marks</label>
          <Input type="number" step="0.5" {...register("negativeMarks")} />
        </div>
      </div>

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Creating..." : "Create Question"}
      </Button>
    </form>
  );
}
