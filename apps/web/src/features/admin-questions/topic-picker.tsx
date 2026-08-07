"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchAdminChapters, fetchAdminSubjects, fetchAdminTopics } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Select } from "@/components/ui/select";

export function TopicPicker({ topicId, onChange }: { topicId: string; onChange: (topicId: string) => void }) {
  const { token } = useAdminAuth();
  const [subjectId, setSubjectId] = useState("");
  const [chapterId, setChapterId] = useState("");

  const subjectsQuery = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: () => fetchAdminSubjects(token as string),
    enabled: !!token,
  });
  const chaptersQuery = useQuery({
    queryKey: ["admin-chapters", subjectId],
    queryFn: () => fetchAdminChapters(token as string, subjectId),
    enabled: !!token && !!subjectId,
  });
  const topicsQuery = useQuery({
    queryKey: ["admin-topics", chapterId],
    queryFn: () => fetchAdminTopics(token as string, chapterId),
    enabled: !!token && !!chapterId,
  });

  const subjects = subjectsQuery.data?.success ? subjectsQuery.data.data : [];
  const chapters = chaptersQuery.data?.success ? chaptersQuery.data.data : [];
  const topics = topicsQuery.data?.success ? topicsQuery.data.data : [];

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Subject</label>
        <Select
          value={subjectId}
          onChange={(e) => {
            setSubjectId(e.target.value);
            setChapterId("");
            onChange("");
          }}
        >
          <option value="">Select subject</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} (Class {s.class})
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Chapter</label>
        <Select
          value={chapterId}
          disabled={!subjectId}
          onChange={(e) => {
            setChapterId(e.target.value);
            onChange("");
          }}
        >
          <option value="">Select chapter</option>
          {chapters.map((c) => (
            <option key={c.id} value={c.id}>
              {c.chapterNumber}. {c.name}
            </option>
          ))}
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label className="text-sm font-medium">Topic</label>
        <Select value={topicId} disabled={!chapterId} onChange={(e) => onChange(e.target.value)}>
          <option value="">Select topic</option>
          {topics.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
