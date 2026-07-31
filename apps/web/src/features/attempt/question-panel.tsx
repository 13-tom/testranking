import type { AttemptQuestionView } from "@board-ranking/shared";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { clsx } from "@/components/ui/clsx";

export function QuestionPanel({
  question,
  isSaving,
  onSelectOption,
  onToggleReview,
}: {
  question: AttemptQuestionView;
  isSaving: boolean;
  onSelectOption: (optionKey: string) => void;
  onToggleReview: () => void;
}) {
  return (
    <Card className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <span className="font-semibold">
          Question {question.displayOrder}
        </span>
        <Button variant="secondary" onClick={onToggleReview} disabled={isSaving}>
          {question.markedForReview ? "Unmark review" : "Mark for review"}
        </Button>
      </div>

      <p className="text-base">{question.questionText}</p>

      <div className="flex flex-col gap-2">
        {question.options.map((option) => {
          const isSelected = question.selectedOptionKey === option.optionKey;
          return (
            <button
              key={option.optionKey}
              type="button"
              disabled={isSaving}
              onClick={() => onSelectOption(option.optionKey)}
              className={clsx(
                "flex items-center gap-3 rounded-md border p-3 text-left text-sm",
                isSelected
                  ? "border-slate-900 bg-slate-100 dark:border-white dark:bg-slate-800"
                  : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900",
              )}
            >
              <span className="font-medium">{option.optionKey}</span>
              <span>{option.optionText}</span>
            </button>
          );
        })}
      </div>
    </Card>
  );
}
