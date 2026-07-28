export type Difficulty = "EASY" | "MEDIUM" | "HARD";
export type BloomLevel = "REMEMBER" | "UNDERSTAND" | "APPLY" | "ANALYZE";
export type QuestionStatus = "DRAFT" | "IN_REVIEW" | "APPROVED" | "PUBLISHED" | "REJECTED" | "ARCHIVED";
export type OptionKey = "A" | "B" | "C" | "D" | "E" | "F";

// --- Public DTOs (student/anonymous-facing, ancestor-chain-active only) ---

export type SubjectPublic = {
  id: string;
  name: string;
  boardId: string;
  class: number;
  description: string | null;
  displayOrder: number;
};

export type ChapterPublic = {
  id: string;
  subjectId: string;
  name: string;
  chapterNumber: number;
  description: string | null;
  displayOrder: number;
};

export type SubjectListResponseData = SubjectPublic[];
export type SubjectDetailResponseData = SubjectPublic;
export type ChapterListResponseData = ChapterPublic[];

// --- Admin DTOs (unrestricted, admin-only routes) ---

export type AdminSubjectInput = {
  name: string;
  boardId: string;
  class: number;
  description?: string;
  displayOrder?: number;
};

export type AdminSubjectUpdateInput = Partial<AdminSubjectInput> & { isActive?: boolean };

export type AdminChapterInput = {
  subjectId: string;
  name: string;
  chapterNumber: number;
  description?: string;
  displayOrder?: number;
};

export type AdminChapterUpdateInput = Partial<AdminChapterInput> & { isActive?: boolean };

export type AdminTopicInput = {
  chapterId: string;
  name: string;
  description?: string;
  displayOrder?: number;
};

export type AdminTopicUpdateInput = Partial<AdminTopicInput> & { isActive?: boolean };

export type AdminQuestionInput = {
  topicId: string;
  questionText: string;
  image?: string;
  explanation?: string;
  difficulty: Difficulty;
  bloomLevel?: BloomLevel;
  timeLimitSeconds?: number;
  positiveMarks: number;
  negativeMarks?: number;
  language?: string;
  source?: string;
  tags?: string[];
};

export type AdminQuestionUpdateInput = Partial<AdminQuestionInput> & {
  status?: QuestionStatus;
  isActive?: boolean;
};

export type AdminQuestionOptionInput = {
  optionKey: OptionKey;
  optionText: string;
  optionImage?: string;
  explanation?: string;
  isCorrect?: boolean;
  displayOrder?: number;
};

export type AdminQuestionOptionUpdateInput = Partial<AdminQuestionOptionInput> & { isActive?: boolean };

export type AdminQuestionOption = {
  id: string;
  optionKey: string;
  optionText: string;
  optionImage: string | null;
  explanation: string | null;
  isCorrect: boolean;
  displayOrder: number;
  isActive: boolean;
};

export type AdminQuestion = {
  id: string;
  referenceCode: string;
  topicId: string;
  questionText: string;
  questionType: "MCQ";
  image: string | null;
  explanation: string | null;
  difficulty: Difficulty;
  bloomLevel: BloomLevel | null;
  timeLimitSeconds: number | null;
  positiveMarks: number;
  negativeMarks: number;
  status: QuestionStatus;
  language: string;
  source: string | null;
  tags: string[];
  isActive: boolean;
  options: AdminQuestionOption[];
};

export type AdminSubject = SubjectPublic & { isActive: boolean };
export type AdminChapter = ChapterPublic & { isActive: boolean };
export type AdminTopic = {
  id: string;
  chapterId: string;
  name: string;
  description: string | null;
  displayOrder: number;
  isActive: boolean;
};
