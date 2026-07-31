import { clsx } from "@/components/ui/clsx";

export type NavigatorQuestion = {
  questionId: string;
  displayOrder: number;
  selectedOptionKey: string | null;
  markedForReview: boolean;
};

export function QuestionNavigator({
  questions,
  currentIndex,
  onSelect,
}: {
  questions: NavigatorQuestion[];
  currentIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div className="grid grid-cols-5 gap-2 sm:grid-cols-6">
      {questions.map((question, index) => {
        const isCurrent = index === currentIndex;
        const isAnswered = question.selectedOptionKey !== null;
        return (
          <button
            key={question.questionId}
            type="button"
            onClick={() => onSelect(index)}
            aria-current={isCurrent}
            className={clsx(
              "flex h-9 w-9 items-center justify-center rounded-md border text-sm font-medium",
              isCurrent
                ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-white dark:text-slate-900"
                : question.markedForReview
                  ? "border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-950 dark:text-amber-300"
                  : isAnswered
                    ? "border-emerald-400 bg-emerald-50 text-emerald-700 dark:border-emerald-600 dark:bg-emerald-950 dark:text-emerald-300"
                    : "border-slate-300 text-slate-700 dark:border-slate-700 dark:text-slate-300",
            )}
          >
            {question.displayOrder}
          </button>
        );
      })}
    </div>
  );
}
