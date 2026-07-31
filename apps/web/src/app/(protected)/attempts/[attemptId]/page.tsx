"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import type { AttemptQuestionView } from "@board-ranking/shared";
import { autoSubmitAttempt, fetchAttempt, saveAnswer, submitAttempt } from "@/lib/api";
import { useAuth } from "@/store/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { QuestionNavigator } from "@/features/attempt/question-navigator";
import { QuestionPanel } from "@/features/attempt/question-panel";
import { AttemptTimer } from "@/features/attempt/attempt-timer";

export default function AttemptPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { token } = useAuth();
  const router = useRouter();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["attempt", attemptId],
    queryFn: () => fetchAttempt(token as string, attemptId),
    enabled: !!token,
  });

  const [questions, setQuestions] = useState<AttemptQuestionView[] | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const answerSequenceRef = useRef(0);
  const hasInitializedRef = useRef(false);
  const hasAutoSubmittedRef = useRef(false);

  useEffect(() => {
    if (!data?.success || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    if (data.data.status !== "STARTED") {
      router.replace(`/attempts/${attemptId}/result`);
      return;
    }

    setQuestions(data.data.questions);
    answerSequenceRef.current = data.data.questions.reduce((max, q) => Math.max(max, q.answerSequence), 0);
  }, [data, attemptId, router]);

  if (isLoading || (data?.success && !questions && data.data.status === "STARTED")) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (isError || !data?.success) {
    return <p className="text-sm text-red-500">Could not load this attempt. Please try again.</p>;
  }

  if (!questions) {
    return <Skeleton className="h-96 w-full" />;
  }

  const attempt = data.data;
  const currentQuestion = questions[currentIndex];
  const answeredCount = questions.filter((q) => q.selectedOptionKey !== null).length;

  async function persistAnswer(questionId: string, selectedOptionKey: string | null, markedForReview: boolean) {
    setIsSaving(true);
    setSaveError(null);
    const sequence = ++answerSequenceRef.current;
    const res = await saveAnswer(token as string, attemptId, questionId, {
      selectedOptionKey,
      answerSequence: sequence,
      clientRequestId: crypto.randomUUID(),
      markedForReview,
    });
    setIsSaving(false);
    if (!res.success) {
      setSaveError(res.message || "Could not save your answer. Please try again.");
    }
  }

  function handleSelectOption(optionKey: string) {
    if (!currentQuestion) return;
    setQuestions((prev) =>
      prev!.map((q) => (q.questionId === currentQuestion.questionId ? { ...q, selectedOptionKey: optionKey } : q)),
    );
    void persistAnswer(currentQuestion.questionId, optionKey, currentQuestion.markedForReview);
  }

  function handleToggleReview() {
    if (!currentQuestion) return;
    const nextMarked = !currentQuestion.markedForReview;
    setQuestions((prev) =>
      prev!.map((q) => (q.questionId === currentQuestion.questionId ? { ...q, markedForReview: nextMarked } : q)),
    );
    void persistAnswer(currentQuestion.questionId, currentQuestion.selectedOptionKey, nextMarked);
  }

  async function handleSubmit() {
    setIsSubmitting(true);
    const res = await submitAttempt(token as string, attemptId);
    if (res.success) {
      router.push(`/attempts/${attemptId}/result`);
    } else {
      setIsSubmitting(false);
      setSaveError(res.message || "Could not submit your attempt. Please try again.");
    }
  }

  function handleExpire() {
    if (hasAutoSubmittedRef.current) return;
    hasAutoSubmittedRef.current = true;
    void autoSubmitAttempt(token as string, attemptId).finally(() => {
      router.push(`/attempts/${attemptId}/result`);
    });
  }

  return (
    <div className="flex flex-col gap-4">
      <Card className="flex items-center justify-between">
        <div>
          <span className="font-semibold">{attempt.testName}</span>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {answeredCount} of {questions.length} answered
          </p>
        </div>
        {attempt.expiresAt && <AttemptTimer expiresAt={attempt.expiresAt} onExpire={handleExpire} />}
      </Card>

      <QuestionNavigator questions={questions} currentIndex={currentIndex} onSelect={setCurrentIndex} />

      {currentQuestion && (
        <QuestionPanel
          question={currentQuestion}
          isSaving={isSaving}
          onSelectOption={handleSelectOption}
          onToggleReview={handleToggleReview}
        />
      )}

      {saveError && <p className="text-sm text-red-500">{saveError}</p>}

      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <Button
            variant="secondary"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
          >
            Previous
          </Button>
          <Button
            variant="secondary"
            disabled={currentIndex === questions.length - 1}
            onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
          >
            Next
          </Button>
        </div>
        <Button onClick={handleSubmit} disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit Test"}
        </Button>
      </div>
    </div>
  );
}
