export type TestCategory = "CHAPTER" | "SUBJECT" | "FULL_SYLLABUS" | "MOCK" | "DAILY_CHALLENGE";
export type TestMode = "PRACTICE" | "RANKED";
export type TestVisibility = "PUBLIC" | "PRIVATE";
export type TestStatus = "DRAFT" | "ACTIVE" | "ARCHIVED";
export type ResultPublishPolicy = "IMMEDIATE" | "AFTER_END_TIME" | "MANUAL";
export type RankingScope = "NONE" | "SCHOOL" | "DISTRICT" | "STATE" | "INDIA";
export type AttemptStatus =
  | "CREATED"
  | "STARTED"
  | "SUBMITTED"
  | "AUTO_SUBMITTED"
  | "EVALUATED"
  | "RANKED"
  | "ABANDONED";

// --- Test blueprint DTOs ---

export type TestSummary = {
  id: string;
  name: string;
  description: string | null;
  boardId: string;
  class: number;
  category: TestCategory;
  mode: TestMode;
  duration: number;
  questionCount: number;
  positiveMarks: number;
  negativeMarks: number;
  passingMarks: number;
  visibility: TestVisibility;
  status: TestStatus;
  startTime: string | null;
  endTime: string | null;
  maxAttempts: number;
  instructions: string | null;
  calculatorAllowed: boolean;
  reviewAllowed: boolean;
};

export type TestListResponseData = TestSummary[];
export type TestDetailResponseData = TestSummary;

export type AdminTestInput = {
  name: string;
  description?: string;
  boardId: string;
  class: number;
  questionCount: number;
  difficultyDistribution: { EASY: number; MEDIUM: number; HARD: number };
  questionTypeDistribution?: Record<string, number>;
  positiveMarks?: number;
  negativeMarks?: number;
  language?: string;
  duration: number;
  passingMarks: number;
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  visibility?: TestVisibility;
  category: TestCategory;
  mode?: TestMode;
  startTime?: string;
  endTime?: string;
  instructions?: string;
  calculatorAllowed?: boolean;
  reviewAllowed?: boolean;
  resultPublishPolicy?: ResultPublishPolicy;
  rankingScope?: RankingScope;
  maxAttempts?: number;
  subjectIds: string[];
  chapterIds?: string[];
  topicIds?: string[];
};

export type AdminTestUpdateInput = Partial<AdminTestInput> & { isActive?: boolean };

export type AdminTest = TestSummary & {
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  subjectIds: string[];
  chapterIds: string[];
  topicIds: string[];
  difficultyDistribution: Record<string, number>;
  questionTypeDistribution: Record<string, number>;
  shuffleQuestions: boolean;
  shuffleOptions: boolean;
  language: string;
  rankingScope: RankingScope;
  resultPublishPolicy: ResultPublishPolicy;
};

// --- Attempt DTOs ---

export type AttemptQuestionOptionView = {
  optionKey: string;
  optionText: string;
  optionImage: string | null;
};

export type AttemptQuestionView = {
  questionId: string;
  displayOrder: number;
  questionText: string;
  image: string | null;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  timeLimitSeconds: number | null;
  options: AttemptQuestionOptionView[];
  selectedOptionKey: string | null;
  markedForReview: boolean;
  answerSequence: number;
};

export type AttemptStateResponseData = {
  attemptId: string;
  testId: string;
  testName: string;
  status: AttemptStatus;
  startedAt: string | null;
  expiresAt: string | null;
  remainingSeconds: number | null;
  duration: number;
  totalQuestions: number;
  answeredCount: number;
  notAnsweredCount: number;
  markedForReviewCount: number;
  questions: AttemptQuestionView[];
};

export type StartAttemptRequest = { retakeMode?: "NEW" | "SAME" };

export type SaveAnswerRequest = {
  selectedOptionKey: string | null;
  answerSequence: number;
  clientRequestId: string;
  markedForReview?: boolean;
};

export type SaveAnswerResponseData = {
  questionId: string;
  selectedOptionKey: string | null;
  answerSequence: number;
  markedForReview: boolean;
  answeredAt: string;
};

export type AttemptResultQuestionView = {
  questionId: string;
  displayOrder: number;
  questionText: string;
  selectedOptionKey: string | null;
  correctOptionKey: string;
  isCorrect: boolean | null;
  marksAwarded: number;
  options: AttemptQuestionOptionView[];
  explanation: string | null;
};

export type AttemptResultResponseData = {
  attemptId: string;
  testId: string;
  testName: string;
  status: AttemptStatus;
  score: number;
  totalMarks: number;
  percentage: number;
  accuracy: number;
  correctCount: number;
  wrongCount: number;
  unansweredCount: number;
  timeTaken: number;
  studyPointsEarned: number;
  passingMarks: number;
  passed: boolean;
  submittedAt: string;
  questions: AttemptResultQuestionView[];
};
