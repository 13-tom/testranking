// BR-008 reference code, format matched to docs/04_database.md's worked
// example ("10M0101" = Class 10, Mathematics, Chapter 01, Question 01 of
// that chapter). Pure function — the sequence number is resolved by the
// caller (service layer, via a repository count) since counting existing
// rows isn't pure.
export function buildReferenceCode(params: {
  classLevel: number;
  subjectName: string;
  chapterNumber: number;
  sequenceInChapter: number;
}): string {
  const classCode = String(params.classLevel).padStart(2, "0");
  const subjectCode = params.subjectName.trim().charAt(0).toUpperCase();
  const chapterCode = String(params.chapterNumber).padStart(2, "0");
  const sequenceCode = String(params.sequenceInChapter).padStart(2, "0");
  return `${classCode}${subjectCode}${chapterCode}${sequenceCode}`;
}

export type ActiveOption = { isCorrect: boolean; isActive: boolean };

export type PublishGateResult = { valid: true } | { valid: false; errors: string[] };

// docs/04_database.md §13/13a: 2-6 active options, exactly one correct,
// explanation required to publish. Pure/deterministic — Rules layer.
export function evaluatePublishGate(
  question: { explanation: string | null; questionType: string },
  options: ActiveOption[],
): PublishGateResult {
  const errors: string[] = [];
  const active = options.filter((o) => o.isActive);
  const correctCount = active.filter((o) => o.isCorrect).length;

  if (question.questionType !== "MCQ") {
    errors.push("Only MCQ questions are supported in Release 1");
  }
  if (!question.explanation || question.explanation.trim().length === 0) {
    errors.push("Questions without explanations cannot be published");
  }
  if (active.length < 2 || active.length > 6) {
    errors.push("A question must have between 2 and 6 active options");
  }
  if (correctCount !== 1) {
    errors.push("A question must have exactly one correct active option to be published");
  }

  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}

// Guards option soft-delete/deactivation: rejects an update that would
// drop below 2 active options or remove the only correct option.
export function assertOptionRemovalAllowed(
  currentActiveOptions: ActiveOption[],
  optionBeingRemoved: ActiveOption,
): PublishGateResult {
  const errors: string[] = [];
  const remaining = currentActiveOptions.filter((o) => o !== optionBeingRemoved);
  if (remaining.length < 2) {
    errors.push("Cannot leave a question with fewer than 2 active options");
  }
  if (optionBeingRemoved.isCorrect && !remaining.some((o) => o.isCorrect)) {
    errors.push("Cannot remove the only correct option");
  }
  return errors.length === 0 ? { valid: true } : { valid: false, errors };
}
