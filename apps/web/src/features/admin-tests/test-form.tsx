"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQuery } from "@tanstack/react-query";
import type { AdminTestInput } from "@board-ranking/shared";
import { fetchAdminSubjects } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { testFormSchema, type TestFormValues } from "./schemas";

export function TestForm({
  defaultValues,
  onSubmit,
  submitLabel,
}: {
  defaultValues?: Partial<TestFormValues>;
  onSubmit: (input: AdminTestInput) => Promise<{ success: boolean; message: string }>;
  submitLabel: string;
}) {
  const { token } = useAdminAuth();
  const [formError, setFormError] = useState<string | null>(null);

  const subjectsQuery = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: () => fetchAdminSubjects(token as string),
    enabled: !!token,
  });
  const subjects = subjectsQuery.data?.success ? subjectsQuery.data.data : [];

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TestFormValues>({
    resolver: zodResolver(testFormSchema),
    defaultValues: {
      category: "CHAPTER",
      easyPercent: 50,
      mediumPercent: 30,
      hardPercent: 20,
      subjectIds: [],
      ...defaultValues,
    },
  });

  const selectedSubjectIds = watch("subjectIds");

  function toggleSubject(id: string) {
    const next = selectedSubjectIds.includes(id) ? selectedSubjectIds.filter((s) => s !== id) : [...selectedSubjectIds, id];
    setValue("subjectIds", next, { shouldValidate: true });
  }

  async function submit(values: TestFormValues) {
    setFormError(null);
    const input: AdminTestInput = {
      name: values.name,
      boardId: values.boardId,
      class: values.class,
      category: values.category,
      questionCount: values.questionCount,
      duration: values.duration,
      passingMarks: values.passingMarks,
      difficultyDistribution: { EASY: values.easyPercent, MEDIUM: values.mediumPercent, HARD: values.hardPercent },
      subjectIds: values.subjectIds,
    };
    const result = await onSubmit(input);
    if (!result.success) {
      setFormError(result.message || "Could not save test");
    }
  }

  return (
    <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Name</label>
        <Input {...register("name")} />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Board ID</label>
          <Input {...register("boardId")} placeholder="Board UUID" />
          {errors.boardId && <p className="text-sm text-red-500">{errors.boardId.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Class</label>
          <Input type="number" min={9} max={12} {...register("class")} />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Category</label>
          <Select {...register("category")}>
            <option value="CHAPTER">Chapter</option>
            <option value="SUBJECT">Subject</option>
            <option value="FULL_SYLLABUS">Full Syllabus</option>
            <option value="MOCK">Mock</option>
            <option value="DAILY_CHALLENGE">Daily Challenge</option>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Question Count</label>
          <Input type="number" {...register("questionCount")} />
          {errors.questionCount && <p className="text-sm text-red-500">{errors.questionCount.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Duration (minutes)</label>
          <Input type="number" {...register("duration")} />
          {errors.duration && <p className="text-sm text-red-500">{errors.duration.message}</p>}
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium">Passing Marks</label>
          <Input type="number" step="0.5" {...register("passingMarks")} />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Difficulty Distribution (%)</label>
        <div className="grid grid-cols-3 gap-3">
          <Input type="number" placeholder="Easy" {...register("easyPercent")} />
          <Input type="number" placeholder="Medium" {...register("mediumPercent")} />
          <Input type="number" placeholder="Hard" {...register("hardPercent")} />
        </div>
        {errors.hardPercent && <p className="text-sm text-red-500">{errors.hardPercent.message}</p>}
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Subjects</label>
        <div className="flex flex-wrap gap-3 rounded-md border border-slate-200 p-3 dark:border-slate-800">
          {subjects.map((subject) => (
            <label key={subject.id} className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={selectedSubjectIds.includes(subject.id)} onChange={() => toggleSubject(subject.id)} />
              {subject.name} (Class {subject.class})
            </label>
          ))}
          {subjects.length === 0 && <span className="text-sm text-slate-500 dark:text-slate-400">No subjects found.</span>}
        </div>
        {errors.subjectIds && <p className="text-sm text-red-500">{errors.subjectIds.message}</p>}
      </div>

      {formError && <p className="text-sm text-red-500">{formError}</p>}

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Saving..." : submitLabel}
      </Button>
    </form>
  );
}
