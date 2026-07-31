import type { AttemptResultQuestionView } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";
import { clsx } from "@/components/ui/clsx";

export function ResultQuestionReview({ questions }: { questions: AttemptResultQuestionView[] }) {
  return (
    <div className="flex flex-col gap-3">
      {questions.map((question) => (
        <Card key={question.questionId} className="flex flex-col gap-2">
          <div className="flex items-start justify-between gap-3">
            <span className="font-semibold">
              Question {question.displayOrder}: {question.questionText}
            </span>
            <span
              className={
                question.isCorrect
                  ? "shrink-0 text-sm font-medium text-emerald-600 dark:text-emerald-400"
                  : question.selectedOptionKey === null
                    ? "shrink-0 text-sm font-medium text-slate-500 dark:text-slate-400"
                    : "shrink-0 text-sm font-medium text-red-500"
              }
            >
              {question.isCorrect ? "Correct" : question.selectedOptionKey === null ? "Unanswered" : "Wrong"} ·{" "}
              {question.marksAwarded} marks
            </span>
          </div>

          <div className="flex flex-col gap-1">
            {question.options.map((option) => {
              const isYourAnswer = option.optionKey === question.selectedOptionKey;
              const isCorrectAnswer = option.optionKey === question.correctOptionKey;
              return (
                <div
                  key={option.optionKey}
                  className={clsx(
                    "flex items-center gap-2 rounded-md border p-2 text-sm",
                    isCorrectAnswer
                      ? "border-emerald-400 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950"
                      : isYourAnswer
                        ? "border-red-400 bg-red-50 dark:border-red-600 dark:bg-red-950"
                        : "border-slate-200 dark:border-slate-800",
                  )}
                >
                  <span className="font-medium">{option.optionKey}</span>
                  <span>{option.optionText}</span>
                  {isYourAnswer && <span className="ml-auto text-xs">Your answer</span>}
                  {isCorrectAnswer && !isYourAnswer && <span className="ml-auto text-xs">Correct answer</span>}
                </div>
              );
            })}
          </div>

          {question.explanation && (
            <p className="text-sm text-slate-500 dark:text-slate-400">{question.explanation}</p>
          )}
        </Card>
      ))}
    </div>
  );
}
