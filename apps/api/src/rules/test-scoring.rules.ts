// Release-1 default, not documented in the PRD/DB docs — our own concrete
// value for how many Study Points a correct answer earns. Revisit at
// Phase 8 (Gamification).
export const POINTS_PER_CORRECT_ANSWER = 10;

export type ScoredQuestion = { questionId: string; correctOptionKey: string };
export type AnswerInput = { questionId: string; selectedOptionKey: string | null };

export type PerQuestionResult = { questionId: string; isCorrect: boolean | null; marksAwarded: number };

export type ScoreResult = {
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  perQuestion: PerQuestionResult[];
};

// BR-026: the single source of truth for a persisted result. Reads only
// the pinned QuestionVersion snapshot's correct option (via the caller —
// this function is pure and takes already-resolved correctOptionKeys),
// never the live Question. BR-022/BR-012: backend-only, never trusts a
// frontend-submitted score.
export function scoreQuestions(
  questions: ScoredQuestion[],
  answers: AnswerInput[],
  positiveMarks: number,
  negativeMarks: number,
): ScoreResult {
  const answerByQuestion = new Map(answers.map((a) => [a.questionId, a.selectedOptionKey]));

  let correctCount = 0;
  let wrongCount = 0;
  let unansweredCount = 0;
  let score = 0;

  const perQuestion: PerQuestionResult[] = questions.map((q) => {
    const selected = answerByQuestion.get(q.questionId) ?? null;
    if (selected === null) {
      unansweredCount++;
      return { questionId: q.questionId, isCorrect: null, marksAwarded: 0 };
    }
    if (selected === q.correctOptionKey) {
      correctCount++;
      score += positiveMarks;
      return { questionId: q.questionId, isCorrect: true, marksAwarded: positiveMarks };
    }
    wrongCount++;
    score -= negativeMarks;
    return { questionId: q.questionId, isCorrect: false, marksAwarded: -negativeMarks };
  });

  const totalMarks = questions.length * positiveMarks;
  const percentage = totalMarks > 0 ? (score / totalMarks) * 100 : 0;
  const attempted = correctCount + wrongCount;
  const accuracy = attempted > 0 ? (correctCount / attempted) * 100 : 0;

  return { correctCount, wrongCount, unansweredCount, score, totalMarks, percentage, accuracy, perQuestion };
}
