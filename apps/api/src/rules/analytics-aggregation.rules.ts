// Phase 5 (Analytics, BR-043) — the aggregation writer's pure math. Takes
// a student's full set of EVALUATED attempts (with their pinned
// question hierarchy and answers) and computes every field for the 5
// analytics tables via one full recompute (idempotent — no deltas).
//
// BR-043: no per-question elapsed-time field exists anywhere in the
// schema, so averageTimePerQuestion is approximated as
// attempt.timeTaken / questionsInAttempt, evenly distributing
// whole-attempt time across its pinned questions.

export type AnalyticsAttemptQuestion = {
  questionId: string;
  subjectId: string;
  chapterId: string;
  topicId: string;
};

export type AnalyticsStudentAnswer = {
  questionId: string;
  selectedOptionKey: string | null;
  isCorrect: boolean | null;
  marksAwarded: number | null;
};

export type AnalyticsAttempt = {
  attemptId: string;
  score: number;
  percentage: number;
  timeTaken: number;
  studyPointsEarned: number;
  submittedAt: Date;
  attemptQuestions: AnalyticsAttemptQuestion[];
  studentAnswers: AnalyticsStudentAnswer[];
};

export type OverallAggregate = {
  testsTaken: number;
  testsCompleted: number;
  questionsSolved: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageScore: number;
  averagePercentage: number;
  bestPercentage: number;
  bestScore: number;
  totalStudyTime: number;
  lastTestDate: Date | null;
};

export type SubjectAggregate = {
  subjectId: string;
  attempts: number;
  questionsSolved: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageTimePerQuestion: number;
  bestScore: number;
  averageScore: number;
};

export type ChapterAggregate = {
  chapterId: string;
  attempts: number;
  questionsSolved: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageTimePerQuestion: number;
  weaknessScore: number;
};

export type TopicAggregate = {
  topicId: string;
  attempts: number;
  questionsSolved: number;
  correctAnswers: number;
  incorrectAnswers: number;
  accuracy: number;
  averageTimePerQuestion: number;
  masteryScore: number;
};

export type ProgressSnapshotAggregate = {
  date: Date;
  rank: null;
  accuracy: number;
  averageScore: number;
  averagePercentage: number;
  studyPoints: number;
  testsTaken: number;
};

export type AnalyticsAggregationResult = {
  overall: OverallAggregate;
  subjects: SubjectAggregate[];
  chapters: ChapterAggregate[];
  topics: TopicAggregate[];
  snapshots: ProgressSnapshotAggregate[];
};

function truncateToUtcDay(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

type EntityAcc = { attemptIds: Set<string>; correctAnswers: number; incorrectAnswers: number; timeSum: number; timeWeight: number };
type DayBucket = { testsTaken: number; scoreSum: number; percentageSum: number; correctAnswers: number; incorrectAnswers: number; studyPoints: number };

function emptyEntityAcc(): EntityAcc {
  return { attemptIds: new Set(), correctAnswers: 0, incorrectAnswers: 0, timeSum: 0, timeWeight: 0 };
}

export function computeAnalyticsAggregation(attempts: AnalyticsAttempt[]): AnalyticsAggregationResult {
  if (attempts.length === 0) {
    return {
      overall: {
        testsTaken: 0,
        testsCompleted: 0,
        questionsSolved: 0,
        correctAnswers: 0,
        incorrectAnswers: 0,
        accuracy: 0,
        averageScore: 0,
        averagePercentage: 0,
        bestPercentage: 0,
        bestScore: 0,
        totalStudyTime: 0,
        lastTestDate: null,
      },
      subjects: [],
      chapters: [],
      topics: [],
      snapshots: [],
    };
  }

  let overallCorrect = 0;
  let overallIncorrect = 0;
  let totalStudyTime = 0;
  let sumScore = 0;
  let sumPercentage = 0;
  let bestScore = -Infinity;
  let bestPercentage = -Infinity;
  let lastTestDate: Date | null = null;

  const subjectAcc = new Map<string, EntityAcc & { scores: number[] }>();
  const chapterAcc = new Map<string, EntityAcc>();
  const topicAcc = new Map<string, EntityAcc>();
  const dayBuckets = new Map<number, DayBucket>();

  for (const attempt of attempts) {
    totalStudyTime += attempt.timeTaken;
    sumScore += attempt.score;
    sumPercentage += attempt.percentage;
    bestScore = Math.max(bestScore, attempt.score);
    bestPercentage = Math.max(bestPercentage, attempt.percentage);
    if (!lastTestDate || attempt.submittedAt > lastTestDate) lastTestDate = attempt.submittedAt;

    const hierarchyByQuestion = new Map(attempt.attemptQuestions.map((aq) => [aq.questionId, aq]));
    const questionsInAttempt = attempt.attemptQuestions.length;
    const perQuestionTime = questionsInAttempt > 0 ? attempt.timeTaken / questionsInAttempt : 0;

    const touchedSubjects = new Set<string>();
    const touchedChapters = new Set<string>();
    const touchedTopics = new Set<string>();

    for (const aq of attempt.attemptQuestions) {
      touchedSubjects.add(aq.subjectId);
      touchedChapters.add(aq.chapterId);
      touchedTopics.add(aq.topicId);

      const sAcc = subjectAcc.get(aq.subjectId) ?? { ...emptyEntityAcc(), scores: [] };
      sAcc.timeSum += perQuestionTime;
      sAcc.timeWeight += 1;
      subjectAcc.set(aq.subjectId, sAcc);

      const cAcc = chapterAcc.get(aq.chapterId) ?? emptyEntityAcc();
      cAcc.timeSum += perQuestionTime;
      cAcc.timeWeight += 1;
      chapterAcc.set(aq.chapterId, cAcc);

      const tAcc = topicAcc.get(aq.topicId) ?? emptyEntityAcc();
      tAcc.timeSum += perQuestionTime;
      tAcc.timeWeight += 1;
      topicAcc.set(aq.topicId, tAcc);
    }
    for (const subjectId of touchedSubjects) subjectAcc.get(subjectId)!.attemptIds.add(attempt.attemptId);
    for (const chapterId of touchedChapters) chapterAcc.get(chapterId)!.attemptIds.add(attempt.attemptId);
    for (const topicId of touchedTopics) topicAcc.get(topicId)!.attemptIds.add(attempt.attemptId);

    // Decision #16: per-attempt subject score = sum of marksAwarded for
    // this attempt's answers resolving to that subject.
    const subjectScoreThisAttempt = new Map<string, number>();
    let attemptCorrect = 0;
    let attemptIncorrect = 0;

    for (const answer of attempt.studentAnswers) {
      if (answer.selectedOptionKey === null) continue; // unanswered — no correctness signal
      const hierarchy = hierarchyByQuestion.get(answer.questionId);
      if (!hierarchy) continue; // defensive — every answer references a pinned question

      const isCorrect = answer.isCorrect === true;
      if (isCorrect) {
        overallCorrect++;
        attemptCorrect++;
      } else {
        overallIncorrect++;
        attemptIncorrect++;
      }

      const sAcc = subjectAcc.get(hierarchy.subjectId)!;
      const cAcc = chapterAcc.get(hierarchy.chapterId)!;
      const tAcc = topicAcc.get(hierarchy.topicId)!;
      if (isCorrect) {
        sAcc.correctAnswers++;
        cAcc.correctAnswers++;
        tAcc.correctAnswers++;
      } else {
        sAcc.incorrectAnswers++;
        cAcc.incorrectAnswers++;
        tAcc.incorrectAnswers++;
      }

      subjectScoreThisAttempt.set(hierarchy.subjectId, (subjectScoreThisAttempt.get(hierarchy.subjectId) ?? 0) + (answer.marksAwarded ?? 0));
    }

    for (const [subjectId, subjectScore] of subjectScoreThisAttempt) {
      subjectAcc.get(subjectId)!.scores.push(subjectScore);
    }

    const day = truncateToUtcDay(attempt.submittedAt).getTime();
    const bucket = dayBuckets.get(day) ?? { testsTaken: 0, scoreSum: 0, percentageSum: 0, correctAnswers: 0, incorrectAnswers: 0, studyPoints: 0 };
    bucket.testsTaken += 1;
    bucket.scoreSum += attempt.score;
    bucket.percentageSum += attempt.percentage;
    bucket.studyPoints += attempt.studyPointsEarned;
    bucket.correctAnswers += attemptCorrect;
    bucket.incorrectAnswers += attemptIncorrect;
    dayBuckets.set(day, bucket);
  }

  const totalAttempted = overallCorrect + overallIncorrect;
  const overall: OverallAggregate = {
    testsTaken: attempts.length,
    testsCompleted: attempts.length,
    questionsSolved: totalAttempted,
    correctAnswers: overallCorrect,
    incorrectAnswers: overallIncorrect,
    accuracy: totalAttempted > 0 ? (overallCorrect / totalAttempted) * 100 : 0,
    averageScore: sumScore / attempts.length,
    averagePercentage: sumPercentage / attempts.length,
    bestScore,
    bestPercentage,
    totalStudyTime,
    lastTestDate,
  };

  const subjects: SubjectAggregate[] = Array.from(subjectAcc.entries()).map(([subjectId, acc]) => {
    const attempted = acc.correctAnswers + acc.incorrectAnswers;
    return {
      subjectId,
      attempts: acc.attemptIds.size,
      questionsSolved: attempted,
      correctAnswers: acc.correctAnswers,
      incorrectAnswers: acc.incorrectAnswers,
      accuracy: attempted > 0 ? (acc.correctAnswers / attempted) * 100 : 0,
      averageTimePerQuestion: acc.timeWeight > 0 ? acc.timeSum / acc.timeWeight : 0,
      bestScore: acc.scores.length > 0 ? Math.max(...acc.scores) : 0,
      averageScore: acc.scores.length > 0 ? acc.scores.reduce((a, b) => a + b, 0) / acc.scores.length : 0,
    };
  });

  const chapters: ChapterAggregate[] = Array.from(chapterAcc.entries()).map(([chapterId, acc]) => {
    const attempted = acc.correctAnswers + acc.incorrectAnswers;
    const accuracy = attempted > 0 ? (acc.correctAnswers / attempted) * 100 : 0;
    return {
      chapterId,
      attempts: acc.attemptIds.size,
      questionsSolved: attempted,
      correctAnswers: acc.correctAnswers,
      incorrectAnswers: acc.incorrectAnswers,
      accuracy,
      averageTimePerQuestion: acc.timeWeight > 0 ? acc.timeSum / acc.timeWeight : 0,
      weaknessScore: 100 - accuracy,
    };
  });

  const topics: TopicAggregate[] = Array.from(topicAcc.entries()).map(([topicId, acc]) => {
    const attempted = acc.correctAnswers + acc.incorrectAnswers;
    const accuracy = attempted > 0 ? (acc.correctAnswers / attempted) * 100 : 0;
    return {
      topicId,
      attempts: acc.attemptIds.size,
      questionsSolved: attempted,
      correctAnswers: acc.correctAnswers,
      incorrectAnswers: acc.incorrectAnswers,
      accuracy,
      averageTimePerQuestion: acc.timeWeight > 0 ? acc.timeSum / acc.timeWeight : 0,
      masteryScore: accuracy * Math.min(1, attempted / 10),
    };
  });

  // Decision #17: snapshots are cumulative-as-of-date, not single-day
  // stats — walk buckets in date order accumulating running totals.
  const sortedDays = Array.from(dayBuckets.keys()).sort((a, b) => a - b);
  let cumTestsTaken = 0;
  let cumScoreSum = 0;
  let cumPercentageSum = 0;
  let cumCorrect = 0;
  let cumIncorrect = 0;
  let cumStudyPoints = 0;
  const snapshots: ProgressSnapshotAggregate[] = sortedDays.map((day) => {
    const bucket = dayBuckets.get(day)!;
    cumTestsTaken += bucket.testsTaken;
    cumScoreSum += bucket.scoreSum;
    cumPercentageSum += bucket.percentageSum;
    cumCorrect += bucket.correctAnswers;
    cumIncorrect += bucket.incorrectAnswers;
    cumStudyPoints += bucket.studyPoints;
    const cumAttempted = cumCorrect + cumIncorrect;
    return {
      date: new Date(day),
      rank: null,
      accuracy: cumAttempted > 0 ? (cumCorrect / cumAttempted) * 100 : 0,
      averageScore: cumTestsTaken > 0 ? cumScoreSum / cumTestsTaken : 0,
      averagePercentage: cumTestsTaken > 0 ? cumPercentageSum / cumTestsTaken : 0,
      studyPoints: cumStudyPoints,
      testsTaken: cumTestsTaken,
    };
  });

  return { overall, subjects, chapters, topics, snapshots };
}
