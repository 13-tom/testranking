"use client";

import { useEffect, useState } from "react";
import type { AdminQuestionOption, OptionKey } from "@board-ranking/shared";
import { createQuestionOption, updateQuestionOption } from "@/lib/api";
import { useAdminAuth } from "@/store/admin-auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

const OPTION_KEYS: OptionKey[] = ["A", "B", "C", "D", "E", "F"];

export function QuestionOptionsEditor({
  questionId,
  options,
  onChanged,
}: {
  questionId: string;
  options: AdminQuestionOption[];
  onChanged: () => void;
}) {
  const { token } = useAdminAuth();
  const usedKeys = new Set(options.map((o) => o.optionKey));
  const nextKey = OPTION_KEYS.find((k) => !usedKeys.has(k));

  const [optionKey, setOptionKey] = useState<OptionKey>(nextKey ?? "A");

  // Re-sync to the next free key whenever the option list changes (e.g.
  // after a successful add) — otherwise this would keep resubmitting the
  // key it was initialized with, which the backend rejects as a duplicate.
  useEffect(() => {
    if (nextKey) setOptionKey(nextKey);
  }, [nextKey]);
  const [optionText, setOptionText] = useState("");
  const [isCorrect, setIsCorrect] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function addOption() {
    if (!optionText.trim()) return;
    setIsSubmitting(true);
    setError(null);
    const res = await createQuestionOption(token as string, questionId, { optionKey, optionText, isCorrect });
    setIsSubmitting(false);
    if (res.success) {
      setOptionText("");
      setIsCorrect(false);
      onChanged();
    } else {
      setError(res.message || "Could not add option");
    }
  }

  async function toggleCorrect(option: AdminQuestionOption) {
    const res = await updateQuestionOption(token as string, questionId, option.id, { isCorrect: !option.isCorrect });
    if (res.success) onChanged();
  }

  return (
    <div className="flex flex-col gap-3">
      <ul className="flex flex-col gap-2">
        {options.map((option) => (
          <li key={option.id} className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 dark:border-slate-800">
            <span className="text-sm">
              <span className="font-medium">{option.optionKey}.</span> {option.optionText}
            </span>
            <div className="flex items-center gap-2">
              {option.isCorrect && <Badge tone="positive">Correct</Badge>}
              <Button type="button" variant="secondary" onClick={() => toggleCorrect(option)}>
                {option.isCorrect ? "Unmark" : "Mark correct"}
              </Button>
            </div>
          </li>
        ))}
      </ul>

      {nextKey && (
        <div className="flex flex-col gap-2 rounded-md border border-dashed border-slate-300 p-3 dark:border-slate-700">
          <div className="flex items-center gap-2">
            <Select value={optionKey} onChange={(e) => setOptionKey(e.target.value as OptionKey)} className="w-20">
              {OPTION_KEYS.filter((k) => !usedKeys.has(k)).map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
            <Input value={optionText} onChange={(e) => setOptionText(e.target.value)} placeholder="Option text" />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={isCorrect} onChange={(e) => setIsCorrect(e.target.checked)} />
            Correct answer
          </label>
          {error && <p className="text-sm text-red-500">{error}</p>}
          <Button type="button" variant="secondary" onClick={addOption} disabled={isSubmitting || !optionText.trim()}>
            {isSubmitting ? "Adding..." : "Add Option"}
          </Button>
        </div>
      )}
    </div>
  );
}
