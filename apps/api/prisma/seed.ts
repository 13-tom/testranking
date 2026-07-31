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

type SubjectSeed = {
  class: number;
  subjectName: string;
  subjectDescription: string;
  chapters: ChapterSeed[];
  // Matches this subject's own question-pool composition exactly (see the
  // per-subject counts noted alongside each SUBJECTS entry below), so the
  // publish-gate check always passes without over/under-provisioning.
  testDifficultyDistribution: { EASY: number; MEDIUM: number; HARD: number };
};

// One subject per CBSE class (9-12), each with its own real NCERT-aligned
// chapters/topics/questions. Reference codes never collide across classes
// (BR-008 encodes the class digit), so every class-subject combination
// below is independent even where chapter/topic names repeat a pattern.
const SUBJECTS: SubjectSeed[] = [
  {
    class: 9,
    subjectName: "Mathematics",
    subjectDescription: "CBSE Class 9 Mathematics",
    // Pool: 6 EASY / 3 MEDIUM / 1 HARD (10 total).
    testDifficultyDistribution: { EASY: 60, MEDIUM: 30, HARD: 10 },
    chapters: [
      {
        name: "Number Systems",
        chapterNumber: 1,
        topics: [
          {
            name: "Rational and Irrational Numbers",
            questions: [
              {
                questionText: "√4 is a:",
                difficulty: "EASY",
                explanation: "√4 = 2, and 2 can be written as 2/1, so it is rational.",
                tags: ["number-systems", "rational-numbers"],
                options: [
                  { optionKey: "A", optionText: "irrational number", isCorrect: false },
                  { optionKey: "B", optionText: "rational number", isCorrect: true },
                  { optionKey: "C", optionText: "not a real number", isCorrect: false },
                  { optionKey: "D", optionText: "a negative number", isCorrect: false },
                ],
              },
              {
                questionText: "Which of the following is an irrational number?",
                difficulty: "EASY",
                explanation: "0.101001000100001... is non-terminating and non-repeating, so it is irrational.",
                tags: ["number-systems", "irrational-numbers"],
                options: [
                  { optionKey: "A", optionText: "0.101001000100001...", isCorrect: true },
                  { optionKey: "B", optionText: "22/7", isCorrect: false },
                  { optionKey: "C", optionText: "0", isCorrect: false },
                  { optionKey: "D", optionText: "−5", isCorrect: false },
                ],
              },
              {
                questionText: "The decimal expansion of a rational number is:",
                difficulty: "MEDIUM",
                explanation: "A rational number's decimal expansion either terminates or repeats.",
                tags: ["number-systems", "rational-numbers"],
                options: [
                  { optionKey: "A", optionText: "always terminating", isCorrect: false },
                  { optionKey: "B", optionText: "always non-terminating non-repeating", isCorrect: false },
                  { optionKey: "C", optionText: "either terminating or non-terminating repeating", isCorrect: true },
                  { optionKey: "D", optionText: "always irrational", isCorrect: false },
                ],
              },
            ],
          },
          {
            name: "Laws of Exponents",
            questions: [
              {
                questionText: "The value of 2^(1/2) × 2^(1/2) is:",
                difficulty: "EASY",
                explanation: "Adding exponents of the same base: 2^(1/2 + 1/2) = 2^1 = 2.",
                tags: ["number-systems", "exponents"],
                options: [
                  { optionKey: "A", optionText: "2", isCorrect: true },
                  { optionKey: "B", optionText: "4", isCorrect: false },
                  { optionKey: "C", optionText: "1", isCorrect: false },
                  { optionKey: "D", optionText: "1/2", isCorrect: false },
                ],
              },
              {
                questionText: "If x = 2 + √3, the value of 1/x is:",
                difficulty: "HARD",
                explanation: "Rationalizing: 1/(2+√3) × (2−√3)/(2−√3) = (2−√3)/(4−3) = 2−√3.",
                tags: ["number-systems", "rationalization"],
                options: [
                  { optionKey: "A", optionText: "2 − √3", isCorrect: true },
                  { optionKey: "B", optionText: "2 + √3", isCorrect: false },
                  { optionKey: "C", optionText: "√3 − 2", isCorrect: false },
                  { optionKey: "D", optionText: "−2 − √3", isCorrect: false },
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
            name: "Degree and Zeroes of Polynomials",
            questions: [
              {
                questionText: "The degree of the polynomial 4x³ − 2x² + 7 is:",
                difficulty: "EASY",
                explanation: "The degree is the highest power of x present, which is 3.",
                tags: ["polynomials", "degree"],
                options: [
                  { optionKey: "A", optionText: "2", isCorrect: false },
                  { optionKey: "B", optionText: "3", isCorrect: true },
                  { optionKey: "C", optionText: "7", isCorrect: false },
                  { optionKey: "D", optionText: "4", isCorrect: false },
                ],
              },
              {
                questionText: "A polynomial of degree 1 is called a:",
                difficulty: "EASY",
                explanation: "Degree-1 polynomials (like ax+b) are called linear polynomials.",
                tags: ["polynomials", "degree"],
                options: [
                  { optionKey: "A", optionText: "constant polynomial", isCorrect: false },
                  { optionKey: "B", optionText: "linear polynomial", isCorrect: true },
                  { optionKey: "C", optionText: "quadratic polynomial", isCorrect: false },
                  { optionKey: "D", optionText: "cubic polynomial", isCorrect: false },
                ],
              },
              {
                questionText: "The zero of the polynomial p(x) = x − 5 is:",
                difficulty: "EASY",
                explanation: "Setting x−5=0 gives x=5.",
                tags: ["polynomials", "zeroes"],
                options: [
                  { optionKey: "A", optionText: "−5", isCorrect: false },
                  { optionKey: "B", optionText: "0", isCorrect: false },
                  { optionKey: "C", optionText: "5", isCorrect: true },
                  { optionKey: "D", optionText: "1/5", isCorrect: false },
                ],
              },
            ],
          },
          {
            name: "Factorization of Polynomials",
            questions: [
              {
                questionText: "Using the Factor Theorem, (x−1) is a factor of p(x) = x² − 1 because:",
                difficulty: "MEDIUM",
                explanation: "p(1) = 1² − 1 = 0, so by the Factor Theorem (x−1) is a factor.",
                tags: ["polynomials", "factor-theorem"],
                options: [
                  { optionKey: "A", optionText: "p(1) = 0", isCorrect: true },
                  { optionKey: "B", optionText: "p(−1) = 0", isCorrect: false },
                  { optionKey: "C", optionText: "p(0) = 1", isCorrect: false },
                  { optionKey: "D", optionText: "p(1) = 1", isCorrect: false },
                ],
              },
              {
                questionText: "Factorize: x² + 5x + 6",
                difficulty: "MEDIUM",
                explanation: "We need two numbers multiplying to 6 and summing to 5: 2 and 3, giving (x+2)(x+3).",
                tags: ["polynomials", "factorization"],
                options: [
                  { optionKey: "A", optionText: "(x+2)(x+3)", isCorrect: true },
                  { optionKey: "B", optionText: "(x+1)(x+6)", isCorrect: false },
                  { optionKey: "C", optionText: "(x−2)(x−3)", isCorrect: false },
                  { optionKey: "D", optionText: "(x+6)(x−1)", isCorrect: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    class: 10,
    subjectName: "Mathematics",
    subjectDescription: "CBSE Class 10 Mathematics",
    // Pool: 10 EASY / 5 MEDIUM / 3 HARD (18 total, unchanged from before).
    testDifficultyDistribution: { EASY: 60, MEDIUM: 30, HARD: 10 },
    chapters: [
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
    ],
  },
  {
    class: 11,
    subjectName: "Mathematics",
    subjectDescription: "CBSE Class 11 Mathematics",
    // Pool: 6 EASY / 3 MEDIUM / 1 HARD (10 total).
    testDifficultyDistribution: { EASY: 60, MEDIUM: 30, HARD: 10 },
    chapters: [
      {
        name: "Sets",
        chapterNumber: 1,
        topics: [
          {
            name: "Types of Sets",
            questions: [
              {
                questionText: "A set containing no element is called:",
                difficulty: "EASY",
                explanation: "A set with no elements is called the empty set (or null set), denoted ∅.",
                tags: ["sets", "types-of-sets"],
                options: [
                  { optionKey: "A", optionText: "singleton set", isCorrect: false },
                  { optionKey: "B", optionText: "empty set", isCorrect: true },
                  { optionKey: "C", optionText: "universal set", isCorrect: false },
                  { optionKey: "D", optionText: "power set", isCorrect: false },
                ],
              },
              {
                questionText: "The set {x : x is a natural number and x < 1} is:",
                difficulty: "EASY",
                explanation: "No natural number (1, 2, 3, ...) is less than 1, so this set has no elements.",
                tags: ["sets", "types-of-sets"],
                options: [
                  { optionKey: "A", optionText: "{0}", isCorrect: false },
                  { optionKey: "B", optionText: "{1}", isCorrect: false },
                  { optionKey: "C", optionText: "the empty set", isCorrect: true },
                  { optionKey: "D", optionText: "{1, 2}", isCorrect: false },
                ],
              },
              {
                questionText: "If A = {1, 2, 3}, the number of subsets of A is:",
                difficulty: "MEDIUM",
                explanation: "A set with n elements has 2ⁿ subsets; here 2³ = 8.",
                tags: ["sets", "subsets"],
                options: [
                  { optionKey: "A", optionText: "6", isCorrect: false },
                  { optionKey: "B", optionText: "8", isCorrect: true },
                  { optionKey: "C", optionText: "9", isCorrect: false },
                  { optionKey: "D", optionText: "3", isCorrect: false },
                ],
              },
            ],
          },
          {
            name: "Operations on Sets",
            questions: [
              {
                questionText: "If A = {1, 2, 3} and B = {2, 3, 4}, then A ∩ B is:",
                difficulty: "EASY",
                explanation: "The intersection contains elements common to both sets: 2 and 3.",
                tags: ["sets", "intersection"],
                options: [
                  { optionKey: "A", optionText: "{1, 2, 3, 4}", isCorrect: false },
                  { optionKey: "B", optionText: "{2, 3}", isCorrect: true },
                  { optionKey: "C", optionText: "{1, 4}", isCorrect: false },
                  { optionKey: "D", optionText: "{1, 2, 3}", isCorrect: false },
                ],
              },
              {
                questionText: "If A = {1, 2, 3, 4} and B = {3, 4, 5, 6}, then A − B is:",
                difficulty: "HARD",
                explanation: "A − B keeps elements of A that are not in B: 1 and 2 remain, since 3 and 4 are in B.",
                tags: ["sets", "set-difference"],
                options: [
                  { optionKey: "A", optionText: "{1, 2}", isCorrect: true },
                  { optionKey: "B", optionText: "{3, 4}", isCorrect: false },
                  { optionKey: "C", optionText: "{5, 6}", isCorrect: false },
                  { optionKey: "D", optionText: "{1, 2, 3, 4, 5, 6}", isCorrect: false },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Relations and Functions",
        chapterNumber: 2,
        topics: [
          {
            name: "Cartesian Product",
            questions: [
              {
                questionText: "If A = {1, 2} and B = {3, 4}, the number of elements in A × B is:",
                difficulty: "EASY",
                explanation: "n(A × B) = n(A) × n(B) = 2 × 2 = 4.",
                tags: ["relations", "cartesian-product"],
                options: [
                  { optionKey: "A", optionText: "2", isCorrect: false },
                  { optionKey: "B", optionText: "4", isCorrect: true },
                  { optionKey: "C", optionText: "6", isCorrect: false },
                  { optionKey: "D", optionText: "8", isCorrect: false },
                ],
              },
              {
                questionText: "If A = {1, 2} and B = {3, 4}, which of the following is an element of A × B?",
                difficulty: "MEDIUM",
                explanation: "In A × B, the first coordinate comes from A and the second from B, so (1, 3) qualifies.",
                tags: ["relations", "cartesian-product"],
                options: [
                  { optionKey: "A", optionText: "(1, 3)", isCorrect: true },
                  { optionKey: "B", optionText: "(3, 1)", isCorrect: false },
                  { optionKey: "C", optionText: "(1, 1)", isCorrect: false },
                  { optionKey: "D", optionText: "(3, 3)", isCorrect: false },
                ],
              },
              {
                questionText: "If n(A) = 3 and n(B) = 4, then n(A × B) is:",
                difficulty: "EASY",
                explanation: "n(A × B) = n(A) × n(B) = 3 × 4 = 12.",
                tags: ["relations", "cartesian-product"],
                options: [
                  { optionKey: "A", optionText: "7", isCorrect: false },
                  { optionKey: "B", optionText: "12", isCorrect: true },
                  { optionKey: "C", optionText: "1", isCorrect: false },
                  { optionKey: "D", optionText: "81", isCorrect: false },
                ],
              },
            ],
          },
          {
            name: "Functions",
            questions: [
              {
                questionText: "A relation f from A to B is called a function if:",
                difficulty: "MEDIUM",
                explanation: "A function requires every element of the domain A to map to exactly one element of B.",
                tags: ["functions", "relations"],
                options: [
                  { optionKey: "A", optionText: "every element of A has exactly one image in B", isCorrect: true },
                  { optionKey: "B", optionText: "every element of B has an image in A", isCorrect: false },
                  { optionKey: "C", optionText: "A and B have the same number of elements", isCorrect: false },
                  { optionKey: "D", optionText: "f is a subset of B × A", isCorrect: false },
                ],
              },
              {
                questionText: "If f(x) = 2x + 3, then f(2) is:",
                difficulty: "EASY",
                explanation: "f(2) = 2×2 + 3 = 4 + 3 = 7.",
                tags: ["functions"],
                options: [
                  { optionKey: "A", optionText: "5", isCorrect: false },
                  { optionKey: "B", optionText: "7", isCorrect: true },
                  { optionKey: "C", optionText: "8", isCorrect: false },
                  { optionKey: "D", optionText: "4", isCorrect: false },
                ],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    class: 12,
    subjectName: "Mathematics",
    subjectDescription: "CBSE Class 12 Mathematics",
    // Pool: 5 EASY / 3 MEDIUM / 2 HARD (10 total).
    testDifficultyDistribution: { EASY: 50, MEDIUM: 30, HARD: 20 },
    chapters: [
      {
        name: "Relations and Functions",
        chapterNumber: 1,
        topics: [
          {
            name: "Types of Relations",
            questions: [
              {
                questionText: "A relation R on set A is called reflexive if:",
                difficulty: "EASY",
                explanation: "Reflexive means every element relates to itself: (a, a) ∈ R for every a ∈ A.",
                tags: ["relations", "types-of-relations"],
                options: [
                  { optionKey: "A", optionText: "(a, a) ∈ R for every a ∈ A", isCorrect: true },
                  { optionKey: "B", optionText: "(a, b) ∈ R implies (b, a) ∈ R", isCorrect: false },
                  { optionKey: "C", optionText: "R is empty", isCorrect: false },
                  { optionKey: "D", optionText: "R = A × A", isCorrect: false },
                ],
              },
              {
                questionText: "A relation R is symmetric if:",
                difficulty: "MEDIUM",
                explanation: "Symmetric means whenever (a, b) is in R, (b, a) must also be in R.",
                tags: ["relations", "types-of-relations"],
                options: [
                  { optionKey: "A", optionText: "(a, a) ∈ R for every a", isCorrect: false },
                  { optionKey: "B", optionText: "(a, b) ∈ R implies (b, a) ∈ R", isCorrect: true },
                  { optionKey: "C", optionText: "(a, b), (b, c) ∈ R implies (a, c) ∈ R", isCorrect: false },
                  { optionKey: "D", optionText: "R is a function", isCorrect: false },
                ],
              },
              {
                questionText: "A relation that is reflexive, symmetric, and transitive is called:",
                difficulty: "EASY",
                explanation: "A relation satisfying all three properties is called an equivalence relation.",
                tags: ["relations", "equivalence-relations"],
                options: [
                  { optionKey: "A", optionText: "an equivalence relation", isCorrect: true },
                  { optionKey: "B", optionText: "a function", isCorrect: false },
                  { optionKey: "C", optionText: "an empty relation", isCorrect: false },
                  { optionKey: "D", optionText: "a universal relation", isCorrect: false },
                ],
              },
            ],
          },
          {
            name: "Types of Functions",
            questions: [
              {
                questionText: "A function f: A → B is one-one (injective) if:",
                difficulty: "EASY",
                explanation: "Injective means no two distinct elements of A map to the same element of B.",
                tags: ["functions", "types-of-functions"],
                options: [
                  { optionKey: "A", optionText: "distinct elements of A have distinct images in B", isCorrect: true },
                  { optionKey: "B", optionText: "every element of B has a pre-image", isCorrect: false },
                  { optionKey: "C", optionText: "A and B have the same cardinality", isCorrect: false },
                  { optionKey: "D", optionText: "f is invertible", isCorrect: false },
                ],
              },
              {
                questionText: "A function f: A → B is invertible if and only if f is:",
                difficulty: "HARD",
                explanation: "A function has an inverse exactly when it is bijective — both one-one and onto.",
                tags: ["functions", "invertible-functions"],
                options: [
                  { optionKey: "A", optionText: "bijective", isCorrect: true },
                  { optionKey: "B", optionText: "only one-one", isCorrect: false },
                  { optionKey: "C", optionText: "only onto", isCorrect: false },
                  { optionKey: "D", optionText: "a constant function", isCorrect: false },
                ],
              },
            ],
          },
        ],
      },
      {
        name: "Matrices",
        chapterNumber: 2,
        topics: [
          {
            name: "Order and Types of Matrices",
            questions: [
              {
                questionText: "A matrix having m rows and n columns is said to be of order:",
                difficulty: "EASY",
                explanation: "By convention, a matrix's order is written as (number of rows) × (number of columns).",
                tags: ["matrices", "order"],
                options: [
                  { optionKey: "A", optionText: "m × n", isCorrect: true },
                  { optionKey: "B", optionText: "n × m", isCorrect: false },
                  { optionKey: "C", optionText: "m + n", isCorrect: false },
                  { optionKey: "D", optionText: "mn", isCorrect: false },
                ],
              },
              {
                questionText: "A square matrix in which all non-diagonal elements are zero is called a:",
                difficulty: "EASY",
                explanation: "This describes a diagonal matrix.",
                tags: ["matrices", "types-of-matrices"],
                options: [
                  { optionKey: "A", optionText: "diagonal matrix", isCorrect: true },
                  { optionKey: "B", optionText: "identity matrix", isCorrect: false },
                  { optionKey: "C", optionText: "zero matrix", isCorrect: false },
                  { optionKey: "D", optionText: "symmetric matrix", isCorrect: false },
                ],
              },
              {
                questionText: "The order of the matrix [[1,2,3],[4,5,6]] is:",
                difficulty: "MEDIUM",
                explanation: "The matrix has 2 rows and 3 columns, so its order is 2 × 3.",
                tags: ["matrices", "order"],
                options: [
                  { optionKey: "A", optionText: "3 × 2", isCorrect: false },
                  { optionKey: "B", optionText: "2 × 3", isCorrect: true },
                  { optionKey: "C", optionText: "6 × 1", isCorrect: false },
                  { optionKey: "D", optionText: "2 × 2", isCorrect: false },
                ],
              },
            ],
          },
          {
            name: "Operations on Matrices",
            questions: [
              {
                questionText: "Two matrices can be added only if they have:",
                difficulty: "MEDIUM",
                explanation: "Matrix addition is defined element-wise, so both matrices must share the same order.",
                tags: ["matrices", "addition"],
                options: [
                  { optionKey: "A", optionText: "the same order", isCorrect: true },
                  { optionKey: "B", optionText: "the same number of rows only", isCorrect: false },
                  { optionKey: "C", optionText: "equal determinants", isCorrect: false },
                  { optionKey: "D", optionText: "at least one common element", isCorrect: false },
                ],
              },
              {
                questionText: "If A is a matrix of order 2×3 and B is a matrix of order 3×2, then AB is a matrix of order:",
                difficulty: "HARD",
                explanation: "For AB to be defined, A's columns (3) must match B's rows (3); the result takes A's rows and B's columns: 2×2.",
                tags: ["matrices", "multiplication"],
                options: [
                  { optionKey: "A", optionText: "2 × 2", isCorrect: true },
                  { optionKey: "B", optionText: "3 × 3", isCorrect: false },
                  { optionKey: "C", optionText: "2 × 3", isCorrect: false },
                  { optionKey: "D", optionText: "3 × 2", isCorrect: false },
                ],
              },
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

  const admin = await prisma.user.upsert({
    where: { email: "admin@boardranking.com" },
    update: {},
    create: { email: "admin@boardranking.com", passwordHash: "not-used-seed-only", role: "ADMIN" },
  });

  let questionsCreated = 0;
  let questionsSkipped = 0;
  let testsCreated = 0;
  let testsSkipped = 0;

  for (const subjectSeed of SUBJECTS) {
    const subject = await prisma.subject.upsert({
      where: { boardId_class_name: { boardId: board.id, class: subjectSeed.class, name: subjectSeed.subjectName } },
      update: {},
      create: {
        boardId: board.id,
        class: subjectSeed.class,
        name: subjectSeed.subjectName,
        description: subjectSeed.subjectDescription,
        displayOrder: 1,
      },
    });

    for (const chapterSeed of subjectSeed.chapters) {
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

    // Seed one real, published Test per class so the frontend has
    // something to take immediately after seeding — no manual curl
    // needed. Bypasses the admin API (same as the rest of this script),
    // so the pool-gate check is satisfied by hand: each subject's
    // testDifficultyDistribution is set to match its own question pool's
    // actual composition exactly (see the comment above each SUBJECTS
    // entry), so the gate always passes without over/under-provisioning.
    const testName = `CBSE Class ${subjectSeed.class} ${subjectSeed.subjectName} — Full Practice Test`;
    const existingTest = await prisma.test.findFirst({ where: { name: testName } });
    if (existingTest) {
      testsSkipped += 1;
      continue;
    }

    await prisma.test.create({
      data: {
        name: testName,
        description: `A full-length practice test covering all seeded Class ${subjectSeed.class} ${subjectSeed.subjectName} chapters.`,
        boardId: board.id,
        class: subjectSeed.class,
        questionCount: 10,
        difficultyDistribution: subjectSeed.testDifficultyDistribution,
        duration: 30,
        passingMarks: 4,
        category: "SUBJECT",
        mode: "PRACTICE",
        status: "ACTIVE",
        createdBy: admin.id,
        testSubjects: { create: [{ subjectId: subject.id }] },
      },
    });
    testsCreated += 1;
  }

  // eslint-disable-next-line no-console -- CLI script summary output, not debug scratch logging
  console.log(
    `Seed complete: ${questionsCreated} question(s) created, ${questionsSkipped} already present. ` +
      `${testsCreated} test(s) created, ${testsSkipped} already present.`,
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
