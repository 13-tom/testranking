export type QuestionSnapshotOption = {
  optionKey: string;
  optionText: string;
  optionImage: string | null;
  isCorrect: boolean;
  displayOrder: number;
};

export type QuestionSnapshot = {
  questionText: string;
  questionType: string;
  difficulty: string;
  positiveMarks: number;
  negativeMarks: number;
  explanation: string | null;
  topicId: string;
  status: string;
  tags: string[];
  options: QuestionSnapshotOption[];
};

type SnapshotQuestionInput = {
  questionText: string;
  questionType: string;
  difficulty: string;
  positiveMarks: number;
  negativeMarks: number;
  explanation: string | null;
  topicId: string;
  status: string;
  tags: string[];
};

type SnapshotOptionInput = {
  optionKey: string;
  optionText: string;
  optionImage: string | null;
  isCorrect: boolean;
  displayOrder: number;
};

// BR-042: immutable point-in-time Question+Options snapshot, pure
// serializer. Options are sorted by optionKey for a stable, comparable
// shape (used by isSnapshotCurrent for reuse-detection).
export function buildQuestionSnapshot(question: SnapshotQuestionInput, activeOptions: SnapshotOptionInput[]): QuestionSnapshot {
  return {
    questionText: question.questionText,
    questionType: question.questionType,
    difficulty: question.difficulty,
    positiveMarks: question.positiveMarks,
    negativeMarks: question.negativeMarks,
    explanation: question.explanation,
    topicId: question.topicId,
    status: question.status,
    tags: [...question.tags].sort(),
    options: [...activeOptions]
      .sort((a, b) => a.optionKey.localeCompare(b.optionKey))
      .map((o) => ({
        optionKey: o.optionKey,
        optionText: o.optionText,
        optionImage: o.optionImage,
        isCorrect: o.isCorrect,
        displayOrder: o.displayOrder,
      })),
  };
}

// Reuse an existing QuestionVersion only if the live Question+active
// Options genuinely haven't changed since it was created.
export function isSnapshotCurrent(existing: QuestionSnapshot, current: QuestionSnapshot): boolean {
  return JSON.stringify(existing) === JSON.stringify(current);
}

export function correctKeyFromSnapshot(snapshot: QuestionSnapshot): string {
  const correct = snapshot.options.find((o) => o.isCorrect);
  if (!correct) {
    throw new Error("QuestionVersion snapshot has no correct option — data integrity violation");
  }
  return correct.optionKey;
}
