import { PrismaClient } from "@prisma/client";
import { buildReferenceCode, evaluatePublishGate } from "../src/rules/question-bank.rules.js";

const prisma = new PrismaClient();

type OptionSeed = {
  optionKey: "A" | "B" | "C" | "D";
  optionText: string;
  isCorrect: boolean;
};

type QuestionSeed = {
  questionText: string;
  difficulty: "EASY" | "MEDIUM" | "HARD";
  explanation: string;
  tags: string[];
  options: OptionSeed[];
};

type TopicSeed = {
  name: string;
  questions: QuestionSeed[];
};

type ChapterSeed = {
  name: string;
  chapterNumber: number;
  topics: TopicSeed[];
};

const CHAPTERS: ChapterSeed[] = [
  {
    name: "Real Numbers",
    chapterNumber: 1,
    topics: [
      {
        name: "Euclid's Division Lemma",
        questions: [
          {
            questionText:
              "Euclid's Division Lemma states that for positive integers a and b, there exist unique integers q and r such that a = bq + r, where:",
            difficulty: "EASY",
            explanation: "The lemma's remainder condition is 0 ≤ r < b by definition.",
            tags: ["euclid", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "0 < r < b", isCorrect: false },
              { optionKey: "B", optionText: "0 ≤ r < b", isCorrect: true },
              { optionKey: "C", optionText: "0 < r ≤ b", isCorrect: false },
              { optionKey: "D", optionText: "0 ≤ r ≤ b", isCorrect: false },
            ],
          },
          {
            questionText: "Using Euclid's division algorithm, find the HCF of 135 and 225.",
            difficulty: "MEDIUM",
            explanation: "225 = 135×1 + 90; 135 = 90×1 + 45; 90 = 45×2 + 0, so HCF = 45.",
            tags: ["euclid", "hcf", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "15", isCorrect: false },
              { optionKey: "B", optionText: "27", isCorrect: false },
              { optionKey: "C", optionText: "45", isCorrect: true },
              { optionKey: "D", optionText: "9", isCorrect: false },
            ],
          },
          {
            questionText:
              "The largest number which divides 70 and 125, leaving remainders 5 and 8 respectively, is:",
            difficulty: "HARD",
            explanation:
              "Subtract the remainders first: 70−5=65 and 125−8=117, then HCF(65,117)=13 via Euclid's algorithm.",
            tags: ["euclid", "hcf", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "13", isCorrect: true },
              { optionKey: "B", optionText: "65", isCorrect: false },
              { optionKey: "C", optionText: "875", isCorrect: false },
              { optionKey: "D", optionText: "1750", isCorrect: false },
            ],
          },
          {
            questionText: "For some integer q, every positive even integer is of the form:",
            difficulty: "EASY",
            explanation: "Even integers are exactly the multiples of 2, i.e. 2q for integer q.",
            tags: ["euclid", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "q", isCorrect: false },
              { optionKey: "B", optionText: "q + 1", isCorrect: false },
              { optionKey: "C", optionText: "2q", isCorrect: true },
              { optionKey: "D", optionText: "2q + 1", isCorrect: false },
            ],
          },
          {
            questionText: "Euclid's division algorithm is generally used to compute the:",
            difficulty: "EASY",
            explanation:
              "It is a systematic, repeated-division method for finding the HCF of two positive integers.",
            tags: ["euclid", "hcf", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "LCM", isCorrect: false },
              { optionKey: "B", optionText: "HCF", isCorrect: true },
              { optionKey: "C", optionText: "square root", isCorrect: false },
              { optionKey: "D", optionText: "cube root", isCorrect: false },
            ],
          },
        ],
      },
      {
        name: "Fundamental Theorem of Arithmetic",
        questions: [
          {
            questionText:
              "The Fundamental Theorem of Arithmetic states every composite number can be expressed as a product of primes, and this factorization is unique apart from:",
            difficulty: "EASY",
            explanation:
              "The theorem guarantees uniqueness of the prime factors themselves; only the order in which they're written can differ.",
            tags: ["fundamental-theorem", "prime-factorization", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "the order in which the prime factors occur", isCorrect: true },
              { optionKey: "B", optionText: "the number of prime factors", isCorrect: false },
              { optionKey: "C", optionText: "the sign of the prime factors", isCorrect: false },
              { optionKey: "D", optionText: "the value of the prime factors", isCorrect: false },
            ],
          },
          {
            questionText: "The prime factorization of 3825 is:",
            difficulty: "HARD",
            explanation: "3825 = 9×425 = 3²×425, and 425 = 25×17 = 5²×17, so 3825 = 3² × 5² × 17.",
            tags: ["fundamental-theorem", "prime-factorization", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "3² × 5² × 17", isCorrect: true },
              { optionKey: "B", optionText: "3 × 5² × 17²", isCorrect: false },
              { optionKey: "C", optionText: "3² × 5 × 17²", isCorrect: false },
              { optionKey: "D", optionText: "3³ × 5² × 17", isCorrect: false },
            ],
          },
          {
            questionText: "HCF × LCM of the two numbers 26 and 91 is:",
            difficulty: "MEDIUM",
            explanation:
              "For any two positive integers a, b: HCF(a,b) × LCM(a,b) = a×b = 26×91 = 2366.",
            tags: ["fundamental-theorem", "hcf-lcm", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "2366", isCorrect: true },
              { optionKey: "B", optionText: "2600", isCorrect: false },
              { optionKey: "C", optionText: "2266", isCorrect: false },
              { optionKey: "D", optionText: "2660", isCorrect: false },
            ],
          },
          {
            questionText: "If the HCF of two numbers is 5 and their product is 150, their LCM is:",
            difficulty: "EASY",
            explanation: "LCM = product ÷ HCF = 150 ÷ 5 = 30.",
            tags: ["fundamental-theorem", "hcf-lcm", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "30", isCorrect: true },
              { optionKey: "B", optionText: "750", isCorrect: false },
              { optionKey: "C", optionText: "5", isCorrect: false },
              { optionKey: "D", optionText: "145", isCorrect: false },
            ],
          },
          {
            questionText: "√2 is:",
            difficulty: "EASY",
            explanation:
              "Proved by contradiction using the Fundamental Theorem of Arithmetic: assuming √2 = p/q in lowest terms leads to both p and q being even, a contradiction. So √2 is irrational.",
            tags: ["fundamental-theorem", "irrational-numbers", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "a rational number", isCorrect: false },
              { optionKey: "B", optionText: "an irrational number", isCorrect: true },
              { optionKey: "C", optionText: "a natural number", isCorrect: false },
              { optionKey: "D", optionText: "a whole number", isCorrect: false },
            ],
          },
          {
            questionText: "The exponent of 2 in the prime factorization of 144 is:",
            difficulty: "MEDIUM",
            explanation: "144 = 16×9 = 2⁴×3², so the exponent of 2 is 4.",
            tags: ["fundamental-theorem", "prime-factorization", "real-numbers"],
            options: [
              { optionKey: "A", optionText: "2", isCorrect: false },
              { optionKey: "B", optionText: "3", isCorrect: false },
              { optionKey: "C", optionText: "4", isCorrect: true },
              { optionKey: "D", optionText: "5", isCorrect: false },
            ],
          },
        ],
      },
    ],
  },
  {
    name: "Polynomials",
    chapterNumber: 2,
    topics: [
      {
        name: "Zeroes of a Polynomial",
        questions: [
          {
            questionText: "The zero of the polynomial p(x) = 2x + 5 is:",
            difficulty: "EASY",
            explanation: "Setting 2x+5=0 gives x = −5/2.",
            tags: ["polynomials", "zeroes"],
            options: [
              { optionKey: "A", optionText: "5/2", isCorrect: false },
              { optionKey: "B", optionText: "−5/2", isCorrect: true },
              { optionKey: "C", optionText: "2/5", isCorrect: false },
              { optionKey: "D", optionText: "−2/5", isCorrect: false },
            ],
          },
          {
            questionText:
              "If one zero of the quadratic polynomial x² − 5x + 6 is 2, the other zero is:",
            difficulty: "MEDIUM",
            explanation:
              "Product of zeroes = constant/leading coefficient = 6; 6÷2 = 3 (sum 2+3=5 also matches the coefficient check).",
            tags: ["polynomials", "zeroes"],
            options: [
              { optionKey: "A", optionText: "2", isCorrect: false },
              { optionKey: "B", optionText: "3", isCorrect: true },
              { optionKey: "C", optionText: "−3", isCorrect: false },
              { optionKey: "D", optionText: "−2", isCorrect: false },
            ],
          },
          {
            questionText: "The number of zeroes a linear polynomial can have is:",
            difficulty: "EASY",
            explanation: "A linear polynomial (degree 1) has exactly one zero.",
            tags: ["polynomials", "zeroes"],
            options: [
              { optionKey: "A", optionText: "0", isCorrect: false },
              { optionKey: "B", optionText: "1", isCorrect: true },
              { optionKey: "C", optionText: "2", isCorrect: false },
              { optionKey: "D", optionText: "3", isCorrect: false },
            ],
          },
          {
            questionText: "The graph of a quadratic polynomial intersects the x-axis at most at:",
            difficulty: "EASY",
            explanation: "A quadratic (degree 2) polynomial has at most 2 real zeroes, so at most 2 x-intercepts.",
            tags: ["polynomials", "zeroes"],
            options: [
              { optionKey: "A", optionText: "1 point", isCorrect: false },
              { optionKey: "B", optionText: "2 points", isCorrect: true },
              { optionKey: "C", optionText: "3 points", isCorrect: false },
              { optionKey: "D", optionText: "4 points", isCorrect: false },
            ],
          },
        ],
      },
    ],
  },
];

async function main() {
  const board = await prisma.board.upsert({
    where: { name: "CBSE" },
    update: {},
    create: { name: "CBSE" },
  });

  const subject = await prisma.subject.upsert({
    where: { boardId_class_name: { boardId: board.id, class: 10, name: "Mathematics" } },
    update: {},
    create: {
      boardId: board.id,
      class: 10,
      name: "Mathematics",
      description: "CBSE Class 10 Mathematics",
      displayOrder: 1,
    },
  });

  let questionsCreated = 0;
  let questionsSkipped = 0;

  for (const chapterSeed of CHAPTERS) {
    const chapter = await prisma.chapter.upsert({
      where: { subjectId_name: { subjectId: subject.id, name: chapterSeed.name } },
      update: {},
      create: {
        subjectId: subject.id,
        name: chapterSeed.name,
        chapterNumber: chapterSeed.chapterNumber,
        displayOrder: chapterSeed.chapterNumber,
      },
    });

    let sequenceInChapter = 0;

    for (const topicSeed of chapterSeed.topics) {
      const topic = await prisma.topic.upsert({
        where: { chapterId_name: { chapterId: chapter.id, name: topicSeed.name } },
        update: {},
        create: { chapterId: chapter.id, name: topicSeed.name },
      });

      for (const questionSeed of topicSeed.questions) {
        sequenceInChapter += 1;
        const referenceCode = buildReferenceCode({
          classLevel: subject.class,
          subjectName: subject.name,
          chapterNumber: chapter.chapterNumber,
          sequenceInChapter,
        });

        const existing = await prisma.question.findUnique({ where: { referenceCode } });
        if (existing) {
          questionsSkipped += 1;
          continue;
        }

        const gate = evaluatePublishGate(
          { explanation: questionSeed.explanation, questionType: "MCQ" },
          questionSeed.options.map((o) => ({ isCorrect: o.isCorrect, isActive: true })),
        );
        if (!gate.valid) {
          throw new Error(`Seed question "${referenceCode}" fails the publish gate: ${gate.errors.join("; ")}`);
        }

        await prisma.question.create({
          data: {
            referenceCode,
            topicId: topic.id,
            questionText: questionSeed.questionText,
            difficulty: questionSeed.difficulty,
            explanation: questionSeed.explanation,
            positiveMarks: 1,
            negativeMarks: 0.25,
            tags: questionSeed.tags,
            status: "PUBLISHED",
            options: {
              create: questionSeed.options.map((o, i) => ({
                optionKey: o.optionKey,
                optionText: o.optionText,
                isCorrect: o.isCorrect,
                displayOrder: i,
              })),
            },
          },
        });
        questionsCreated += 1;
      }
    }
  }

  // Seed one real, published Test so the frontend has something to take
  // immediately after seeding — no manual curl needed. Bypasses the admin
  // API (same as the rest of this script), so the pool-gate check is
  // satisfied by hand: 10 questions at EASY:60/MEDIUM:30/HARD:10 requires
  // 6 EASY + 3 MEDIUM + 1 HARD, comfortably within the seeded 15-question
  // pool (10 EASY / 5 MEDIUM / 3 HARD across all chapters).
  const SEED_TEST_NAME = "CBSE Class 10 Mathematics — Full Practice Test";
  const existingTest = await prisma.test.findFirst({ where: { name: SEED_TEST_NAME } });
  let testSeeded = false;
  if (!existingTest) {
    const admin = await prisma.user.upsert({
      where: { email: "admin@boardranking.com" },
      update: {},
      create: { email: "admin@boardranking.com", passwordHash: "not-used-seed-only", role: "ADMIN" },
    });

    await prisma.test.create({
      data: {
        name: SEED_TEST_NAME,
        description: "A full-length practice test covering all seeded Class 10 Mathematics chapters.",
        boardId: board.id,
        class: 10,
        questionCount: 10,
        difficultyDistribution: { EASY: 60, MEDIUM: 30, HARD: 10 },
        duration: 30,
        passingMarks: 4,
        category: "SUBJECT",
        mode: "PRACTICE",
        status: "ACTIVE",
        createdBy: admin.id,
        testSubjects: { create: [{ subjectId: subject.id }] },
      },
    });
    testSeeded = true;
  }

  // eslint-disable-next-line no-console -- CLI script summary output, not debug scratch logging
  console.log(
    `Seed complete: ${questionsCreated} question(s) created, ${questionsSkipped} already present. Test ${testSeeded ? "created" : "already present"}.`,
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
