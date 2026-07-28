# Board Ranking Database Blueprint v1.0

Version: 1.0

Status: Active

Owner: Backend Team

Project: Board Ranking

---

# 1. Purpose

This document defines the database architecture of Board Ranking.

Every database table, relationship, naming convention, index, and future migration must follow this blueprint.

The goal is:

• Clean Database
• Scalable
• Secure
• Easy to Maintain
• Easy to Extend

---

# 2. Database Technology

Database

PostgreSQL

ORM

Prisma

ID Strategy

UUID

Time Zone

UTC

Naming Convention

Tables

PascalCase

Columns

camelCase

Primary Key

id

Foreign Keys

tableNameId

Example

userId

schoolId

testId

---

# 3. Database Design Principles

Normalize data.

Avoid duplicate information.

Store relationships using IDs.

Never duplicate names across tables.

Never store calculated values unless required for performance.

Every table should have one clear responsibility.

---

# 4. Core Database Structure

Users

↓

StudentProfile

TeacherProfile

ParentProfile

↓

Schools

↓

Tests

↓

Questions

↓

TestAttempts

↓

Leaderboard

↓

Achievements

↓

Notifications

↓

Subscriptions

---

# 5. Users Table

Purpose

Authentication only.

Fields

id

phone

email

passwordHash (optional)

role

isVerified

createdAt

updatedAt

lastLogin

Rules

Never store XP here.

Never store Rank here.

Never store Class here.

---

# 6. StudentProfile

Purpose

Stores student information.

Fields

userId

fullName

class

schoolId

profileImage

studyPoints

studyLevel

studyStreak

longestStreak

profileCompletion

subscriptionPlan

createdAt

updatedAt

Rules

Every student has exactly one StudentProfile.

---

# 7. TeacherProfile

Fields

userId

fullName

schoolId

subject

teacherCode

verified

createdAt

---

# 8. ParentProfile

Fields

userId

fullName

linkedStudentId

notificationPreference

createdAt

---

# 9. Schools

Fields

id

schoolName

board

city

district

state

country

postalCode

createdAt

Store each school only once.

Students reference schoolId.

---

# 10. Boards

Master data: education boards (CBSE first; ICSE/state boards later).

Fields

id

name (unique — "CBSE", "ICSE", …)

isActive

createdAt

updatedAt

---

# 10a. Subjects

Fields

id

name

boardId (FK → Boards, ON DELETE RESTRICT)

class

description (optional)

displayOrder

isActive (soft delete — subjects are deactivated, never removed)

createdAt

updatedAt

Constraints

Unique: (boardId, class, name)

Unique (raw SQL, case-insensitive): (boardId, class, lower(name))

Indexes: (class), (boardId, class, isActive)

---

# 11. Chapters

Fields

id

subjectId (FK → Subjects, ON DELETE RESTRICT)

name

chapterNumber

description (optional)

displayOrder

isActive (soft delete — chapters are deactivated, never removed)

createdAt

updatedAt

Constraints

Unique: (subjectId, name), (subjectId, chapterNumber)

Unique (raw SQL, case-insensitive): (subjectId, lower(name))

Indexes: (subjectId, isActive)

---

# 11a. Topics

PRD ch.11 hierarchy: Class → Subject → Chapter → Topic → Question.
Questions link via Question.topicId (optional until the Question module enforces it).

Fields

id

chapterId (FK → Chapters, ON DELETE RESTRICT)

name

description (optional)

displayOrder

isActive (soft delete — topics are deactivated, never removed)

createdAt

updatedAt

Constraints

Unique: (chapterId, name)

Unique (raw SQL, case-insensitive): (chapterId, lower(name))

Visibility rule (F3, applies to all academic content): student-facing reads
only return records whose entire ancestor chain is active (topic AND chapter
AND subject). Admins read unrestricted. Standard for Question/Test modules.

Indexes: (chapterId, isActive)

---

# 12. Tests (Blueprint — Test Engine architecture)

A Test is the blueprint from which per-attempt papers (AttemptQuestion rows)
are generated — never a question list. Scope arrays hold IDs only; empty
chapterIds = all chapters of the subjects; empty topicIds = all topics of the
chapters. Content is resolved at generation time, then pinned per attempt.

Fields

id

name

description (optional)

boardId (FK → Boards) · class

scope via junction tables (see 12a) — TestSubject / TestChapter / TestTopic

questionCount

difficultyDistribution (Json — { EASY, MEDIUM, HARD } percentages, total 100)

questionTypeDistribution (Json — { MCQ: 100 } in Release 1)

positiveMarks · negativeMarks (per question / per wrong answer)

language

duration (minutes) · passingMarks

shuffleQuestions · shuffleOptions (randomization rules)

visibility (PUBLIC | PRIVATE)

category (CHAPTER | SUBJECT | FULL_SYLLABUS | MOCK | DAILY_CHALLENGE)

mode (PRACTICE | RANKED — PRACTICE forces rankingScope NONE)

startTime / endTime (optional availability window)

instructions (optional)

calculatorAllowed · reviewAllowed

resultPublishPolicy (IMMEDIATE | AFTER_END_TIME | MANUAL)

rankingScope (NONE | SCHOOL | DISTRICT | STATE | INDIA)

maxAttempts (≥1)

status (DRAFT → ACTIVE → ARCHIVED; ACTIVE is pool-gated)

isActive (soft delete)

createdBy · createdAt · updatedAt (optimistic-locking token)

Indexes: (status, isActive) · (boardId, class) · (category)

---

# 12a. TestSubject / TestChapter / TestTopic (blueprint scope junctions)

Normalized many-to-many scope: real foreign keys with ON DELETE RESTRICT —
master data referenced by any blueprint can never be hard-deleted, and a Test
with scope rows cannot be hard-deleted (tests are soft-deleted anyway).

Shape (each table)

testId + subjectId/chapterId/topicId — composite PRIMARY KEY (testId, xId):
duplicates structurally impossible; the PK btree serves "scope of test T".

Secondary index on subjectId/chapterId/topicId — serves the reverse lookup
("which tests cover subject X", the list filter).

Semantics: no chapter rows = all chapters of the subjects; no topic rows =
all topics of the chapters. The API contract still speaks id arrays — the
repository maps junction rows ↔ arrays (ordered ascending for deterministic
blueprint snapshots).

---

# 13. Questions (Question Bank — PRD ch.11 AQMS)

Topic-anchored: hierarchy is derived Question → Topic → Chapter → Subject → Board.
Options live in the Options module (Json options/correctAnswer columns arrive there).
Test linkage arrives as a join table with the Test module (bank questions are
reusable across many tests).

Fields

id

topicId (required FK → Topics, ON DELETE RESTRICT — one primary topic per question)

questionText

questionType (Release 1: "MCQ" only, validator-enforced)

image (optional)

explanation (optional)

difficulty (EASY | MEDIUM | HARD)

bloomLevel (optional — REMEMBER | UNDERSTAND | APPLY | ANALYZE; stored from R1, not student-facing)

timeLimitSeconds (optional per-question limit)

positiveMarks

negativeMarks (stored as magnitude, >= 0)

status (DRAFT | IN_REVIEW | APPROVED | PUBLISHED | REJECTED | ARCHIVED — only
PUBLISHED reaches students; transitions ONLY via editorial workflow endpoints,
never via PATCH. State machine: DRAFT→IN_REVIEW→APPROVED→PUBLISHED→ARCHIVED→DRAFT,
IN_REVIEW→REJECTED→DRAFT. Every transition is CAS-guarded, audited, versioned.)

language (ISO code, default "en")

source (optional — "NCERT Inspired", "Previous Year Board Paper", …)

tags (text[], lowercased — prepared for the Tags module)

isActive (soft delete — questions are deactivated, never removed)

createdAt

updatedAt

Indexes

(topicId, status, isActive) — canonical "published questions of a topic"

(status, isActive)

(difficulty)

tags — GIN (array containment)

Never duplicate questions unnecessarily.

---

# 13b. QuestionVersions

Immutable edit history (append-only, like AuditLog — no update/delete path
exists). Every meaningful edit (question PATCH, option create/update/delete/
reorder, restore) appends the full POST-EDIT state. Restores never overwrite:
restoring v2 creates a new version.

Fields

id

questionId (FK → Questions, ON DELETE RESTRICT)

version (monotonic per question, starts at 1)

snapshot (Json — question metadata incl. topicId/status/tags + full active
options set incl. isCorrect)

reason (optional, human-supplied — restores)

changeSummary (machine-generated description of the edit)

createdBy (admin userId)

createdAt

Constraints

Unique: (questionId, version) — race-proof monotonic counter

Indexes: (questionId, createdAt) — "version active at time T" lookups

Access: ADMIN only (snapshots contain answer keys).

---

# 13a. QuestionOptions

MCQ answers, owned by their question (FK CASCADE — questions are never
physically deleted). Soft delete = isActive.

Fields

id

questionId (FK → Questions)

optionKey (A–F)

optionText

optionImage (optional — Cloudinary URL, Image Upload module later)

explanation (optional — post-answer only, never sent to students pre-answer)

isCorrect

displayOrder

isActive

createdAt

updatedAt

Constraints (raw SQL — partial unique indexes, inexpressible in Prisma DSL)

UNIQUE (questionId, optionKey) WHERE isActive — keys unique among live options

UNIQUE (questionId) WHERE isCorrect AND isActive — at most ONE active correct
option per question, enforced by Postgres under any concurrency

Indexes: (questionId, isActive)

Rules: 2–6 active options; exactly one correct required to PUBLISH the
question (publish gate in question.service); deletes that would leave <2
active options or zero correct options are rejected with 409.

---

# 14. TestAttempts

Fields

id

studentId · testId

status (CREATED → STARTED → SUBMITTED | AUTO_SUBMITTED → EVALUATED → RANKED;
ABANDONED for stale CREATED rows — Test Engine architecture §1)

selectionAlgorithmVersion · selectionMeta (Json: seed, blueprintSnapshot,
driftPp, poolSizes) — the provenance triple; reproduces the paper forever

startedAt (nullable — stamped at CREATED→STARTED, when the clock starts)

expiresAt (startedAt + duration — the ONLY deadline authority)

sessionId (single-active-session claim; conflict protocol)

submittedAt · score · totalMarks · percentage · accuracy · correctCount ·
wrongCount · unansweredCount · timeTaken · studyPointsEarned
(the OFFICIAL persisted result — written exactly once inside the submission
transaction, Sprint 5.5. GET /result and GET /summary read these columns;
the scoring function is replay/validation tooling only, never re-run to
serve historical results)

createdAt · updatedAt

Constraints (raw SQL)

PARTIAL UNIQUE (studentId, testId) WHERE status IN ('CREATED','STARTED') —
at most ONE active attempt per student per test, DB-enforced under any
concurrency (double-click Start, two tabs, retries).

Indexes: (studentId, testId) · (testId) · (status, expiresAt — auto-submit
sweeper) · (submittedAt)

---

# 14a. AttemptQuestions (the frozen paper)

One row per question on a student's generated paper. Snapshot doctrine:
POINT to what the bank immortalized (questionVersionId → immutable
QuestionVersion), SNAPSHOT what the attempt invented (order, option order).

Fields

attemptId (FK → TestAttempts, CASCADE — owned rows)

questionId (FK → Questions, RESTRICT)

questionVersionId (FK → QuestionVersions, RESTRICT — scoring/rendering read
the pinned snapshot, never the live question)

displayOrder (1..n)

optionOrder (Json — ordered optionKeys, shuffled per blueprint)

Constraints

PRIMARY KEY (attemptId, questionId) — duplicate questions impossible

Unique (attemptId, displayOrder) — one question per paper position

Indexes: (questionId) · (questionVersionId)

---

# 15. StudentAnswers

One row per question per attempt (enforced by DB unique constraint). Supports
idempotent saves, stale-packet rejection, and Sprint 5.5 scoring/analytics.

Fields

id

attemptId (FK → TestAttempts, CASCADE — owned rows)

questionId (FK → Questions, RESTRICT)

questionVersionId (FK → QuestionVersions, RESTRICT — pins the exact version
shown to the student; scoring reads the correct answer from this snapshot, not
the live question)

selectedOptionKey (A–F option key; null = no answer currently selected / cleared)

answerSequence (CLIENT-GENERATED monotonic counter. Ownership rules:
  • Generated and incremented by the CLIENT — the server stores it, never
    assigns or adjusts it.
  • Incremented on every answer mutation: first save, every option change,
    every clear. Each distinct write action must carry a value strictly greater
    than the previous one for the same question.
  • Scoped to (attemptId, questionId) — each question on each attempt has its
    own independent counter. Counters for different questions or different
    attempts are completely independent; there is no global sequence.
  • Must be persisted for the entire lifetime of the attempt. Clients must NOT
    reset the counter to 0 (or any earlier value) after an app refresh,
    background kill, reconnect, or session resume. A reset makes every
    subsequent write look stale to the server (clientSequence ≤ stored) and
    the server will reject them all with 409 STALE_ANSWER.
  • Recommended client storage: per-question entry in localStorage or
    IndexedDB, keyed by (attemptId, questionId), written synchronously before
    the network request is sent.
  Server enforcement: rejects writes where clientSequence ≤ stored value, so
  a late-arriving network packet cannot overwrite a more recent accepted write)

clientRequestId (globally unique UUID per request; service returns the existing
row when the same token arrives twice — safe mobile retry after network timeout)

answeredAt (stamped on first selection and on every subsequent change; NOT
reset to null when the student clears their answer — cleared state is expressed
solely by selectedOptionKey = NULL; preserves last-interaction timestamp for
Sprint 5.5 per-question time analytics)

isCorrect · marksAwarded (nullable — NULL until the attempt is evaluated;
written exactly once by the Sprint 5.5 submission transaction. These persisted
values are the official per-question result: GET /result reads them instead of
re-running the scoring function. Never computed at answer-save time. Paper
questions with no StudentAnswer row are unanswered by definition — 0 marks)

updatedAt (platform-wide audit trail; auto-updated by Prisma)

Removed fields (were in original scaffold):

timeTaken — per-question time analytics deferred (derivable from answeredAt)

Constraints

UNIQUE (attemptId, questionId) — one answer row per question; safe upsert
semantics for network retries (DB-level backstop)

UNIQUE (clientRequestId) — global; Postgres allows multiple NULLs

Indexes: (attemptId)

---

# 16. Leaderboard

ALL_TIME rank cache ONLY — one row per student, overwritten by the ranking
calculation job (Sprint 6.2). Purpose: fast single-table reads for all-time
leaderboard queries on the four MVP scopes.

COLUMN CONTRACT — the four rank columns are FROZEN:
  schoolRank · districtRank · stateRank · indiaRank

Adding future scope columns (cityRank, friendsRank, …) is PROHIBITED.
The table would grow unboundedly as scope types multiply. Future scopes
(CITY, FRIENDS, CUSTOM) use RankSnapshot exclusively. See BR-029.

EVOLUTION PATH:
  MVP scopes (Sprint 6.1–6.2): SCHOOL · DISTRICT · STATE · NATIONAL
    → ALL_TIME cached here + all snapshots in RankSnapshot
  Future scopes (Sprint 6.3+): CITY · FRIENDS · CUSTOM
    → ALL_TIME served from RankSnapshot (latest published ALL_TIME snapshot
      per (scope, scopeId)); this table is not extended

Fields

id

studentId (@unique — one row per student forever)

period (string; always "ALL_TIME" in practice)

schoolRank · districtRank · stateRank · indiaRank
(nullable — null = not yet ranked; indiaRank maps to NATIONAL scope in API;
name is legacy and unchanged to avoid a migration)

studyPoints (synced from StudentProfile at calculation time)

updatedAt

Indexes: (schoolRank) · (districtRank) · (stateRank) · (indiaRank) · (studyPoints)

---

# 16a. RankSnapshot

The IMMUTABLE historical audit trail. One row per (studentId, scope, scopeId,
period, rankingVersion) tuple. Written by the ranking calculation job (Sprint
6.2), never updated. Historical ranks are preserved forever.

Used for: rank history · period-specific leaderboards · version corrections ·
seasonal leaderboards · all future scopes (CITY, FRIENDS, CUSTOM).

Fields

id

studentId (FK → StudentProfile, CASCADE)

scope — SCHOOL | DISTRICT | STATE | NATIONAL | CITY | FRIENDS | CUSTOM

scopeId — CANONICAL value per scope type:
  SCHOOL   → schools.id (UUID; validated against the schools table)
  DISTRICT → schools.district (exact string from School.district column;
             Sprint 6.2 calculation job sources this, not the caller)
  STATE    → schools.state (exact string from School.state; same pattern)
  NATIONAL → literal 'INDIA'
  CITY     → schools.city (Sprint 6.3+; same canonical-from-table pattern)
  FRIENDS / CUSTOM → owner-defined (form defined at Sprint 6.3+)
The canonical-string requirement prevents the same entity appearing under
multiple spellings (e.g. "Bangalore" vs "Bengaluru"). The calculation job is
the only writer and must read from School to source the canonical value.

rank (immutable after insert)

totalStudents (denominator for percentile; 0 = unknown)

studyPoints (student's points at snapshot time; immutable)

period — ALL_TIME | WEEKLY_YYYY_WNN | MONTHLY_YYYY_MM | YEARLY_YYYY

academicYear — "YYYY-YY" (April–March, e.g. "2026-27")

rankingVersion — monotonically increasing within (scope, scopeId, period, academicYear):
  • Version 1 = first correct calculation for a given combination
  • Incremented only when a verified bug in the prior calculation is corrected
    (not for routine new-period runs, which start a new period at version 1)
  • Old versions are never deleted — retained for audit
  • API always serves the highest published version for a given combination

testId (nullable — null for overall studyPoints ranking;
set for per-test leaderboards Sprint 6.3+; no FK until that sprint)

isPublished — false = calculated but admin-only; true = visible to students

computedAt (immutable: when this snapshot was produced)

publishedAt (null until published; set atomically with isPublished)

Indexes: (studentId, scope, period, computedAt) · (scope, scopeId, period, rankingVersion, rank) · (isPublished, computedAt)

---

# 16b. StudentAnalytics (Sprint 7.1)

Pre-computed overall analytics — one row per student. Sole writer: `analytics.service.triggerAnalyticsUpdate()`.

Fields: id, studentId (unique FK → StudentProfile, onDelete Restrict), testsTaken, testsCompleted, questionsSolved, correctAnswers, incorrectAnswers, accuracy (Float, 0–100), averageScore (Float), averagePercentage (Float, 0–100), bestPercentage (Float), bestScore (Float), averageRank (Int, nullable), bestRank (Int, nullable), totalStudyTime (Int, seconds), lastTestDate (DateTime, nullable), createdAt, updatedAt

Indexes: (studentId) unique

---

# 16c. StudentSubjectAnalytics (Sprint 7.1)

Per-subject analytics — one row per (student, subject). Sole writer: `analytics.service.triggerAnalyticsUpdate()`.

Fields: id, studentId (FK → StudentProfile, onDelete Restrict), subjectId (FK → Subject, onDelete Restrict), attempts, questionsSolved, correctAnswers, incorrectAnswers, accuracy (Float, 0–100), averageTimePerQuestion (Float, seconds), bestScore (Float), averageScore (Float), createdAt, updatedAt

Indexes: (studentId, subjectId) unique

---

# 16d. StudentChapterAnalytics (Sprint 7.1)

Per-chapter analytics — one row per (student, chapter). Sole writer: `analytics.service.triggerAnalyticsUpdate()`.

Fields: id, studentId (FK → StudentProfile, onDelete Restrict), chapterId (FK → Chapter, onDelete Restrict), attempts, questionsSolved, correctAnswers, incorrectAnswers, accuracy (Float, 0–100), averageTimePerQuestion (Float, seconds), weaknessScore (Float, 0–100; higher = weaker; formula: 100 - accuracy), createdAt, updatedAt

Indexes: (studentId, chapterId) unique · (studentId, weaknessScore) for weakest-chapters query

---

# 16e. StudentTopicAnalytics (Sprint 7.1)

Per-topic analytics — one row per (student, topic). Sole writer: `analytics.service.triggerAnalyticsUpdate()`.

Fields: id, studentId (FK → StudentProfile, onDelete Restrict), topicId (FK → Topic, onDelete Restrict), attempts, questionsSolved, correctAnswers, incorrectAnswers, accuracy (Float, 0–100), averageTimePerQuestion (Float, seconds), masteryScore (Float, 0–100; formula: accuracy × min(1, questionsSolved / 10)), createdAt, updatedAt

Indexes: (studentId, topicId) unique · (studentId, masteryScore) for strongest-topics query

---

# 16f. StudentProgressSnapshot (Sprint 7.1)

Append-only daily progress snapshots for charting. One row per (student, date). If multiple tests complete on the same day, the latest recompute wins. Sole writer: `analytics.service.triggerAnalyticsUpdate()`.

Fields: id, studentId (FK → StudentProfile, onDelete Restrict), date (DateTime, truncated to day), rank (Int, nullable — current India rank at snapshot time), accuracy (Float), averageScore (Float), averagePercentage (Float), studyPoints (Float), testsTaken (Int), createdAt, updatedAt

Indexes: (studentId, date) unique · (studentId, date ASC) for time-series queries

---

# 17. Achievements

Fields

id

title

description

icon

category

studyPointsReward

---

# 18. StudentAchievements

Fields

studentId

achievementId

earnedAt

Many-to-Many Relationship.

---

# 19. StudyStreakHistory

Fields

studentId

date

completed

Used for streak calendar.

---

# 20. Notifications

Fields

id

userId

title

body

type

read

createdAt

---

# 21. Subscription

Fields

id

studentId

plan

status

startDate

endDate

paymentId

---

# 22. Payments

Fields

id

studentId

gateway

amount

currency

status

transactionId

createdAt

---

# 23. Files

Fields

id

ownerId

url

type

uploadedAt

Used for

Profile Images

Question Images

Documents

---

# 24. AuditLogs

Purpose

Track important events.

Examples

Login

Profile Update

Payment

Role Change

Suspicious Activity

---

# 25. Relationships

Users

1 → 1 StudentProfile

Users

1 → 1 TeacherProfile

Users

1 → 1 ParentProfile

School

1 → Many Students

Subject

1 → Many Chapters

Chapter

1 → Many Tests

Test

1 → Many Questions

Student

1 → Many TestAttempts

Attempt

1 → Many StudentAnswers

Student

Many → Many Achievements

---

# 26. Index Strategy

Index

phone

email

schoolId

subjectId

chapterId

testId

studentId

createdAt

Indexes should support search performance.

---

# 27. Security Rules

Never expose IDs unnecessarily.

Always validate ownership.

Students may access only their own attempts.

Teachers only their assigned students.

Parents only linked children.

Admins have controlled access.

---

# 28. Migration Rules

Never modify production tables directly.

Use Prisma Migrations.

Every migration must be reversible.

Backup before major migrations.

---

# 29. Future Expansion

Database should support future modules without redesign.

Future Tables

Friendships

Challenges

School Battles

AI Recommendations

Question Reports

Bookmarks

Discussion

Offline Orders

Referral System

Coupons

Events

Certificates

Exam Predictions

---

# 30. Data Retention

Never delete important academic history.

Use soft delete where appropriate.

Archive inactive data instead of deleting.

Maintain historical rankings.

---

# 31. AI Rules

AI must never invent tables.

AI must never duplicate data.

AI must always follow relationships.

AI must explain database changes before implementing them.

Never modify schema without approval.

---

# 32. Database Review Checklist

Before creating any new table verify

✓ Can an existing table solve this?

✓ Is duplication avoided?

✓ Is normalization maintained?

✓ Are relationships correct?

✓ Are indexes required?

✓ Is security considered?

✓ Will this scale?

✓ Is Prisma migration required?

✓ Is naming consistent?

---

# 16g. XP & Level Engine (Sprint 8.1)

## XpTransaction (append-only audit log)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile | |
| source | String | XP source code (REGISTRATION, DAILY_LOGIN, etc.) |
| reason | String | Human-readable explanation |
| xpAwarded | Int | Amount awarded (can be negative for future corrections) |
| previousXp | Int | XP before this transaction |
| newXp | Int | XP after this transaction |
| referenceId | String | Dedup key (attemptId, date, "ONCE", milestoneCode) |
| createdAt | DateTime | Immutable timestamp |

**Constraints:**
- Unique: `(studentId, source, referenceId)` — prevents duplicate awards
- Index: `(studentId, createdAt)` — history queries
- Index: `(studentId, source)` — source filtering
- NEVER updated, NEVER deleted

## StudentLevel (persisted state)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile (unique) | |
| currentXp | Int | Total lifetime XP |
| currentLevel | Int | Current level (1-100) |
| xpToNext | Int | XP remaining to next level |
| totalXpForNext | Int | Total XP increment for next level (display) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Why persisted:** Never compute current XP from transactions during reads. Transactions remain audit history.

## LevelDefinition (reference table)

| Column | Type | Notes |
|---|---|---|
| level | Int PK | 1 through 100 |
| xpRequired | Int | Cumulative XP to reach this level |
| title | String | Display name (Beginner, Learner, etc.) |

**Formula:** `xpRequired(n) = 25 × n × (n+1) − 50` for n ≥ 2, 0 for n = 1.

---

# 16h. Coins & Economy Engine (Sprint 8.2)

## CoinTransaction (append-only audit log)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile | |
| type | String | "EARN" or "SPEND" |
| source | String | Source/sink code |
| reason | String | Human-readable explanation |
| amount | Int | Coins moved (always positive; type determines direction) |
| previousBalance | Int | Balance before this transaction |
| newBalance | Int | Balance after this transaction |
| referenceId | String | Dedup key |
| createdAt | DateTime | Immutable timestamp |

**Constraints:**
- Unique: `(studentId, type, source, referenceId)` — prevents duplicates
- Index: `(studentId, createdAt)` — history queries
- Index: `(studentId, type)` — filter by earn/spend
- Index: `(studentId, source)` — source filtering
- NEVER updated, NEVER deleted

## StudentWallet (persisted state)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile (unique) | |
| currentBalance | Int | Current coins (NEVER negative) |
| lifetimeEarned | Int | Total coins earned ever |
| lifetimeSpent | Int | Total coins spent ever |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Why persisted:** Balance never computed from transactions. Transactions are audit history only.

---

# 16i. Badges & Achievement Engine (Sprint 8.3)

## BadgeDefinition (seed data — admin-managed)

| Column | Type | Notes |
|---|---|---|
| code | String PK | e.g. "FIRST_TEST", "STREAK_7" |
| name | String | Display name |
| description | String | Short description |
| category | String | PERFORMANCE / RANKING / CONSISTENCY / PARTICIPATION / MASTERY / SPEED / PRACTICE / MILESTONES / SPECIAL |
| tier | String | BRONZE / SILVER / GOLD / PLATINUM / DIAMOND |
| icon | String | Icon identifier or URL |
| unlockRule | String | Machine-readable rule key matching badge.rules.ts UNLOCK_RULES |
| xpReward | Int | XP awarded on first unlock (0 = no XP) |
| coinReward | Int | Coins awarded on first unlock (0 = no coins) |
| isVisible | Boolean | false = hidden until earned (surprise badge) |

- Index: `(category)` — category filtering
- Index: `(tier)` — tier filtering

## StudentBadge (append-only, one row per earned badge per student)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile | |
| badgeCode | String FK → BadgeDefinition.code | |
| unlockedAt | DateTime | Immutable timestamp of first earn |
| source | String | Event that triggered unlock (e.g. "ATTEMPT_EVALUATED") |
| referenceId | String | Audit link (attemptId, date string, "ONCE", etc.) |

**Constraints:**
- Unique: `(studentId, badgeCode)` — each badge earned once only
- Index: `(studentId, unlockedAt)` — chronological history queries
- NEVER updated, NEVER deleted

## AchievementDefinition (seed data — progress-tracked milestones)

| Column | Type | Notes |
|---|---|---|
| code | String PK | e.g. "ACH_TESTS_10", "ACH_STREAK_30" |
| name | String | Display name |
| description | String | |
| metric | String | Analytics field to track (e.g. "testsTaken", "accuracy") |
| target | Int | Numeric threshold for completion |
| category | String | Same categories as BadgeDefinition |
| xpReward | Int | XP on completion |
| coinReward | Int | Coins on completion |

- Index: `(category)` — grouping queries

## StudentAchievementProgress (upserted — live progress state)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile | |
| achievementCode | String FK → AchievementDefinition.code | |
| currentProgress | Int | Latest value of tracked metric (capped at target) |
| target | Int | Copied from definition at insert time |
| completed | Boolean | true when currentProgress >= target |
| completedAt | DateTime? | null until completed |
| updatedAt | DateTime | Updated on each evaluation run |

**Constraints:**
- Unique: `(studentId, achievementCode)` — one progress row per achievement per student
- Index: `(studentId, completed)` — filter completed/pending achievements

**Why upserted (not append-only):** Progress is a snapshot of current state. Only `completed` and `completedAt` are immutable once set to true.

---

# 16j. Daily Missions & Streak Engine (Sprint 8.4)

## MissionDefinition (seed data — defines all possible missions)

| Column | Type | Notes |
|---|---|---|
| code | String PK | e.g. "DAILY_LOGIN", "WEEKLY_10_TESTS" |
| name | String | Display name |
| description | String | Human-readable goal |
| missionType | String | "DAILY" or "WEEKLY" |
| category | String | DAILY / WEEKLY / PRACTICE / REVISION / ACCURACY / SPEED / CONSISTENCY / RANKING / ENGAGEMENT |
| difficulty | String | EASY / MEDIUM / HARD / EPIC |
| metric | String | Trackable event key (see mission.rules.ts METRIC_AGGREGATION) |
| target | Int | Numeric completion threshold |
| xpReward | Int | XP on completion |
| coinReward | Int | Coins on completion |
| resetFrequency | String | "DAILY" or "WEEKLY" (mirrors missionType) |
| isActive | Boolean | false = retired, never assigned again |

- Index: `(missionType, isActive)` — fast lookup on lazy assignment

## StudentMission (one row per student per mission per period)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile | |
| missionCode | String FK → MissionDefinition.code | |
| assignedDate | Date (@db.Date, UTC) | Today for DAILY; Monday for WEEKLY |
| status | String | "ACTIVE" / "COMPLETED" / "EXPIRED" |
| claimed | Boolean | true once XP + Coin rewards have been issued |
| completedAt | DateTime? | Immutable once set |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Constraints:**
- Unique: `(studentId, missionCode, assignedDate)` — idempotent assignment
- Index: `(studentId, assignedDate)` — period reads
- Index: `(studentId, status)` — filter ACTIVE missions
- Status only advances: ACTIVE → COMPLETED or EXPIRED (never backwards)
- Rows are NEVER deleted

## MissionProgress (1:1 with StudentMission)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentMissionId | String (unique FK → StudentMission.id) | |
| currentProgress | Int | Latest progress value (capped at target on completion) |
| target | Int | Copied from MissionDefinition at assignment time |
| updatedAt | DateTime | Updated on each progress event |

**Why 1:1 not inlined:** Allows atomic progress updates independent of mission status changes. Easier to read/write separately from StudentMission lifecycle fields.

## StudentStreak (one row per student per streak type — persisted state)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile | |
| streakType | String | "LOGIN" / "STUDY" / "TEST" / "RECOMMENDATION" / "REVISION" |
| currentStreak | Int | Current consecutive days (resets on gap) |
| longestStreak | Int | All-time maximum streak |
| lastActivityDate | Date? (@db.Date, UTC) | UTC date of most recent qualifying activity |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Constraints:**
- Unique: `(studentId, streakType)` — one row per type per student
- Index: `(studentId)` — all streaks for a student
- NEVER computed from raw history — always updated incrementally on activity
- `currentStreak` resets to 1 if `lastActivityDate < yesterday UTC`

---

# 16k. Rewards & Claim System (Sprint 8.5)

## RewardDefinition (seed data — defines all claimable reward templates)

| Column | Type | Notes |
|---|---|---|
| code | String PK | e.g. "MISSION_BUNDLE_SMALL", "BADGE_REWARD_GOLD" |
| name | String | Display name |
| description | String | Human-readable description |
| rewardType | String | XP / COINS / BADGE / BUNDLE / AVATAR / THEME / PROFILE_FRAME / TITLE / COUPON / COSMETIC |
| source | String | MISSION / BADGE_UNLOCK / ACHIEVEMENT / STREAK / SPECIAL_EVENT / ADMIN / REFERRAL / TOURNAMENT |
| xpAmount | Int | Default XP; may be overridden per-instance |
| coinAmount | Int | Default coins; may be overridden per-instance |
| badgeCode | String? | Loose reference (no FK) — badge to unlock on claim |
| itemCode | String? | Cosmetic item code for AVATAR/THEME/PROFILE_FRAME rewards |
| isClaimable | Boolean | false = auto-applied (future) |
| expiresAfterDays | Int? | null = never expires |
| isActive | Boolean | false = retired, no longer issued |

- Index: `(rewardType, isActive)` — filter by type
- Index: `(source, isActive)` — filter by source

## StudentReward (one row per reward event per student)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile | |
| rewardCode | String FK → RewardDefinition.code | |
| status | String | "AVAILABLE" / "CLAIMED" / "EXPIRED" |
| sourceReference | String | Dedup key: missionId, badgeCode, eventCode, etc. |
| earnedAt | DateTime | When the reward was issued |
| expiresAt | DateTime? | null if definition.expiresAfterDays is null |
| xpAmount | Int? | Per-instance override (null = use definition) |
| coinAmount | Int? | Per-instance override (null = use definition) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Constraints:**
- Unique: `(studentId, rewardCode, sourceReference)` — idempotent creation
- Index: `(studentId, status)` — pending/history reads
- Index: `(studentId, earnedAt)` — chronological ordering
- Status only advances: AVAILABLE → CLAIMED or EXPIRED (never backwards)
- `expireStudentRewards` lazily marks AVAILABLE rows with `expiresAt < now` as EXPIRED

## RewardClaim (append-only — one per claimed StudentReward)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentRewardId | String (unique FK → StudentReward.id) | 1:1 — impossible to claim twice |
| claimedAt | DateTime | |
| claimMethod | String | "MANUAL" / "AUTO" / "CLAIM_ALL" |
| previousState | String | Always "AVAILABLE" (audit trail) |
| newState | String | Always "CLAIMED" (audit trail) |

**Design notes:**
- `badgeCode` on `RewardDefinition` is stored as a plain `String?` (no formal FK to `BadgeDefinition.code`) to avoid adding a back-relation to the frozen Sprint 8.3 model. The service layer validates badge codes programmatically.
- XP/Coin engine calls happen BEFORE the DB transaction so retries after transaction failure are no-ops (referenceIds `REWARD_<id>_XP` and `REWARD_<id>_COINS` are globally unique).
- `$transaction([rewardClaim.create, studentReward.update])` ensures atomicity — both commit or both roll back.

# 16l. Gamification Dashboard Aggregation (Sprint 8.6)

## Design: Read-Only BFF Layer

The Gamification Dashboard is a Backend-for-Frontend (BFF) aggregation layer. It reads from pre-computed gamification state tables only. **No new database tables are introduced.**

## Read sources

| Data | Table | Notes |
|---|---|---|
| Level + XP | `StudentLevel`, `XpTransaction` | currentXp, currentLevel, xpToNext |
| Coins | `StudentWallet` | currentBalance, lifetimeEarned, lifetimeSpent |
| XP rank | `StudentLevel` (count query) | students with currentXp > me |
| Coin rank | `StudentWallet` (count query) | students with lifetimeEarned > me |
| Badges | `StudentBadge`, `BadgeDefinition` | earned + definitions for progress |
| Achievements | `StudentAchievementProgress`, `AchievementDefinition` | progress rows |
| Missions | `StudentMission`, `MissionProgress`, `MissionDefinition` | current period only |
| Streaks | `StudentStreak` | all 5 streak types |
| Rewards | `StudentReward`, `RewardClaim`, `RewardDefinition` | pending + recent claims |
| Activity | `XpTransaction`, `CoinTransaction`, `StudentBadge`, `StudentMission`, `StudentReward`, `StudentAchievementProgress` | 6 parallel streams |

## Guarantees

- No writes: zero `INSERT`, `UPDATE`, or `DELETE` in this module
- No N+1: all sub-queries batched with `Promise.all()`
- No raw scan: `TestAttempt`, `AttemptQuestion`, `StudentAnswer` never queried
- No recalculation: scores, XP, and coins are never re-derived from raw events
- At most 2 sequential DB round trips per dashboard request (core data, then ranks)

---

# 17. Arena Foundation (Sprint 9.1)

## ArenaMatch

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| matchCode | String (unique) | 8-char uppercase alphanumeric — human-friendly |
| matchType | String | FRIEND / PRIVATE / PUBLIC / SCHOOL / DISTRICT / STATE / NATIONAL / TOURNAMENT |
| status | String | CREATED / INVITED / WAITING / ACTIVE / COMPLETED / CANCELLED / EXPIRED |
| visibility | String | PRIVATE / PUBLIC / INVITE_ONLY |
| createdBy | UUID FK → StudentProfile | Match creator |
| createdAt | DateTime | |
| scheduledStart | DateTime? | Optional future start time |
| startedAt | DateTime? | Set when ACTIVE |
| endedAt | DateTime? | Set when COMPLETED |
| expiresAt | DateTime? | 48h from creation; or scheduledStart + 30min |
| winnerId | String? | studentId of winner — set when COMPLETED |
| rankingEnabled | Boolean | true = affects leaderboard ranking |
| rewardEnabled | Boolean | true = awards XP/Coins on completion |
| metadata | Json? | Flexible per-mode config |

- Index: `(createdBy)`, `(status)`, `(createdAt)`

## ArenaParticipant

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| matchId | UUID FK → ArenaMatch (cascade) | |
| studentId | UUID FK → StudentProfile | |
| joinedAt | DateTime | When the row was created |
| acceptedAt | DateTime? | When invite was accepted |
| completedAt | DateTime? | When participant finished playing |
| finalScore | Int? | Set on FINISHED |
| correctAnswers | Int? | |
| wrongAnswers | Int? | |
| accuracy | Float? | 0.0–100.0 percentage |
| averageSpeed | Float? | Average seconds per question |
| rank | Int? | Final rank within the match |
| status | String | INVITED / ACCEPTED / READY / PLAYING / FINISHED / LEFT / DISQUALIFIED |

**Constraints:**
- Unique: `(matchId, studentId)` — one participation per student per match
- Index: `(studentId)`, `(matchId, status)`

## ArenaInvite

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| matchId | UUID FK → ArenaMatch (cascade) | |
| senderId | UUID FK → StudentProfile (named "ArenaInviteSender") | Match creator |
| receiverId | UUID FK → StudentProfile (named "ArenaInviteReceiver") | Invited student |
| inviteCode | String (unique) | 10-char uppercase alphanumeric — deep-link invite |
| status | String | PENDING / ACCEPTED / DECLINED / EXPIRED / CANCELLED |
| createdAt | DateTime | |
| acceptedAt | DateTime? | |
| expiresAt | DateTime | 24h from creation; or scheduledStart − 30min (min 5 min from now) |

**Constraints:**
- Index: `(matchId)`, `(receiverId, status)`, `(senderId)`
- `onDelete: Cascade` on matchId — invites deleted with match

## ArenaResult (append-only — immutable)

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| matchId | UUID FK → ArenaMatch | |
| studentId | UUID FK → StudentProfile | |
| position | Int | 1 = first place |
| score | Int | |
| accuracy | Float | 0.0–100.0 percentage |
| speed | Float | Average seconds per question |
| xpEarned | Int | XP awarded for this match (default 0) |
| coinsEarned | Int | Coins awarded for this match (default 0) |
| ratingChange | Int | Rating delta (default 0) |
| createdAt | DateTime | |

**Constraints:**
- Unique: `(matchId, studentId)` — one result per student per match; DB-enforces immutability
- Index: `(studentId)`, `(matchId)`
- No update path in the service or repository

## State transition diagram

```
ArenaMatch:
  CREATED → INVITED → WAITING → ACTIVE → COMPLETED
       ↘        ↘        ↘
         CANCELLED (creator cancels)
  Any non-terminal → EXPIRED (expiresAt passes)

ArenaParticipant:
  INVITED → ACCEPTED → READY → PLAYING → FINISHED
       ↘
       LEFT (declined or abandoned)
  Any → DISQUALIFIED

ArenaInvite:
  PENDING → ACCEPTED
  PENDING → DECLINED
  PENDING → CANCELLED (match cancelled)
  PENDING → EXPIRED (expiresAt < now)
```

## Design notes

- `matchCode` and `inviteCode` generated via `crypto.randomBytes` in `arena.rules.ts`; unique constraints with service-level retry (max 3 attempts) prevent collision
- Named relations on StudentProfile for ArenaInvite (ArenaInviteSender / ArenaInviteReceiver) — required because StudentProfile has two foreign keys into ArenaInvite
- `ArenaResult` uses a `@@unique([matchId, studentId])` constraint instead of a flag so no service code path can update it

---

# 19. Competition Engine (Sprint 9.3)

## Competition

One row per competition event. Admin-created. Reuses Arena Foundation for match execution.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| competitionCode | String UNIQUE | 8-char uppercase alphanumeric code |
| name | String | Display name |
| description | String? | |
| competitionType | String | SCHOOL \| DISTRICT \| STATE \| NATIONAL \| PUBLIC |
| visibility | String | PUBLIC \| PRIVATE \| INVITE_ONLY |
| status | String | See lifecycle below |
| boardId | UUID? FK → Board | Optional scope filter |
| academicYear | String? | "YYYY-YY" format (no FK — plain string per RankSnapshot pattern) |
| class | Int? | 9–12; null = all classes |
| subjectId | UUID? FK → Subject | Optional scope filter |
| chapterId | UUID? FK → Chapter | Optional scope filter |
| schoolId | UUID? FK → School | Required for SCHOOL type |
| districtId | String? | Plain string matching School.district; required for DISTRICT type |
| stateId | String? | Plain string matching School.state; required for STATE type |
| startsAt | DateTime | |
| endsAt | DateTime | |
| registrationStartsAt | DateTime | Must be < registrationEndsAt < startsAt < endsAt |
| registrationEndsAt | DateTime | |
| maxParticipants | Int? | null = unlimited |
| rankingEnabled | Boolean | default true |
| rewardEnabled | Boolean | default true |
| metadata | Json? | Extensible payload |
| createdBy | UUID FK → User | Admin who created the competition |
| createdAt | DateTime | |
| updatedAt | DateTime | @updatedAt |

Indexes: `competitionCode`, `(competitionType, status)`, `status`, `schoolId`, `districtId`, `stateId`, `startsAt`

## CompetitionRegistration

One row per (competition, student) pair. `@@unique([competitionId, studentId])` prevents duplicates.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| competitionId | UUID FK → Competition | |
| studentId | UUID FK → StudentProfile | |
| arenaMatchId | UUID? FK → ArenaMatch | Null until competition goes ACTIVE |
| registeredAt | DateTime | @default(now()) |
| approvedAt | DateTime? | Set when eligibility validates (auto on register) |
| status | String | REGISTERED \| APPROVED \| REJECTED \| CANCELLED \| COMPLETED |
| finalRank | Int? | Set when competition COMPLETES (from ArenaResult.position) |
| score | Int? | Set when competition COMPLETES (from ArenaResult.score) |

Indexes: `(studentId, status)`, `(competitionId, status)`, `(competitionId, finalRank)`

## CompetitionLeaderboardSnapshot

Immutable. Created by `buildLeaderboardSnapshot()` on competition COMPLETED, and optionally during ACTIVE. Never updated.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| competitionId | UUID FK → Competition | |
| snapshotTime | DateTime | When snapshot was computed |
| totalParticipants | Int | Count of approved participants at snapshot time |
| top100 | Json | Array of `{rank, studentId, score, accuracy, speed}` — ordered by rank ASC |
| createdAt | DateTime | @default(now()) |

Index: `(competitionId, snapshotTime)`

## Back-relations added to existing models

**User**: `competitions Competition[]`
**Board**: `competitions Competition[]`
**Subject**: `competitions Competition[]`
**Chapter**: `competitions Competition[]`
**School**: `competitions Competition[]`
**StudentProfile**: `competitionRegistrations CompetitionRegistration[]`
**ArenaMatch**: `competitionRegistrations CompetitionRegistration[]`

## Competition status lifecycle

```
DRAFT → REGISTRATION_OPEN  [openRegistration()]
      → REGISTRATION_CLOSED [closeRegistration()]
      → READY               [markReady()]
      → ACTIVE              [startCompetition() — creates ArenaMatch + participants]
      → COMPLETED           [completeCompetition() — finalizes results + creates snapshot]
      → ARCHIVED            [archiveCompetition()]
Any non-terminal → CANCELLED [cancelCompetition() — cancels all REGISTERED/APPROVED registrations]
```

## Registration lifecycle

```
(none) → APPROVED   [registerForCompetition() — eligibility validated, auto-approved]
APPROVED → CANCELLED [cancelMyRegistration() — only before ACTIVE]
APPROVED → COMPLETED [completeCompetition() — finalRank + score set from ArenaResult]
APPROVED → REJECTED  [internal admin override]
```

## Eligibility rules

| Competition type | Eligibility condition |
|---|---|
| SCHOOL | `student.schoolId === competition.schoolId` |
| DISTRICT | `student.school.district === competition.districtId` |
| STATE | `student.school.state === competition.stateId` |
| NATIONAL | Any student |
| PUBLIC | Any student |
| All types | If `competition.class` is set: `student.class === competition.class` |

## Design notes

- **Arena Foundation reuse**: When `startCompetition()` runs, one `ArenaMatch` is created with `matchType = competition.competitionType`. All APPROVED registrations are linked as `ArenaParticipant` rows. This satisfies the "must reuse ArenaMatch and ArenaParticipant" requirement without modifying Sprint 9.1 source files.
- **ArenaMatch creator constraint**: `ArenaMatch.createdBy` is a FK → StudentProfile (from Sprint 9.1 design). For competitions, the first approved participant's studentId is used as the creator — this is pragmatic since competitions are admin-initiated but ArenaMatch requires a student creator.
- **Leaderboard read policy**: `GET /leaderboard` always reads from the latest `CompetitionLeaderboardSnapshot`. Never rebuilds from raw `ArenaResult` during reads (snapshot is the source of truth for leaderboard queries).
- **Duplicate registrations**: Impossible via `@@unique([competitionId, studentId])` DB constraint, backed by service-level pre-check.
- **academicYear as plain string**: No AcademicYear model exists. Stored as "YYYY-YY" string, consistent with `RankSnapshot.academicYear`.

---

# 18. Friend Battles & Private Challenge Engine (Sprint 9.2)

## FriendRelationship

One row per directed pair. Bidirectional duplicates prevented by a DB-level functional unique index (not a simple @@unique — see Design notes).

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| senderId | UUID FK → StudentProfile | Who sent the request |
| receiverId | UUID FK → StudentProfile | Who received the request |
| status | String | PENDING \| ACCEPTED \| BLOCKED \| REMOVED |
| createdAt | DateTime | |
| acceptedAt | DateTime? | Null until accepted |
| blockedAt | DateTime? | Null until blocked |

Indexes: `(senderId, status)`, `(receiverId, status)`

## BattleStatistics

One row per student, created lazily. Updated atomically after every completed FRIEND match.

| Column | Type | Notes |
|---|---|---|
| studentId | UUID PK FK → StudentProfile | |
| totalBattles | Int | |
| wins | Int | |
| losses | Int | |
| draws | Int | |
| currentWinStreak | Int | Reset to 0 on loss/draw |
| bestWinStreak | Int | Monotonically increasing |
| averageAccuracy | Float | Rolling average (0–100) |
| averageSpeed | Float | Rolling average (seconds per question) |
| totalXPWon | Int | Sum of xpEarned from RANKED wins |
| totalCoinsWon | Int | Sum of coinsEarned from RANKED wins |
| updatedAt | DateTime | @updatedAt |

## BattleRematch

Request from any participant to replay a completed FRIEND battle.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| originalMatchId | UUID FK → ArenaMatch | The completed match |
| newMatchId | UUID? FK → ArenaMatch | Null until accepted; new match created on accept |
| requestedBy | UUID FK → StudentProfile | Who requested the rematch |
| requestedTo | UUID FK → StudentProfile | Who must respond |
| status | String | PENDING \| ACCEPTED \| DECLINED \| EXPIRED |
| createdAt | DateTime | |
| acceptedAt | DateTime? | |
| expiresAt | DateTime | 24h from creation |

Indexes: `(originalMatchId)`, `(requestedBy)`, `(requestedTo, status)`

## Back-relations added to existing models

**StudentProfile** (Sprint 9.2 additions):
- `battleStatistics BattleStatistics?`
- `friendsSent FriendRelationship[] @relation("FriendRequestSender")`
- `friendsReceived FriendRelationship[] @relation("FriendRequestReceiver")`
- `rematchesRequested BattleRematch[] @relation("BattleRematchRequester")`
- `rematchesReceived BattleRematch[] @relation("BattleRematchRequestee")`

**ArenaMatch** (Sprint 9.2 additions):
- `rematchOriginals BattleRematch[] @relation("BattleRematchOriginal")`
- `rematchNews BattleRematch[] @relation("BattleRematchNew")`

## Design notes

- **Bidirectional uniqueness**: `@@unique([senderId, receiverId])` alone would allow (A,B) and (B,A) to coexist. A functional unique index on `LEAST(senderId, receiverId), GREATEST(senderId, receiverId) WHERE status != 'REMOVED'` in `prisma/raw-indexes.sql` is the DB backstop. Service pre-checks via `findFriendshipBetween` (queries both directions with OR) provide clean error messages.
- **battleType dimension**: Stored in `ArenaMatch.metadata.battleType` (CASUAL \| RANKED \| PRACTICE) as JSON, not a separate column, to avoid schema proliferation for a battle-layer concern.
- **Named relations on ArenaMatch**: `BattleRematch` has two FKs to `ArenaMatch` (originalMatchId, newMatchId) requiring named relations `"BattleRematchOriginal"` / `"BattleRematchNew"`.
- **Named relations on StudentProfile**: Four FKs to `StudentProfile` on `FriendRelationship` and `BattleRematch` require named relations `"FriendRequestSender"`, `"FriendRequestReceiver"`, `"BattleRematchRequester"`, `"BattleRematchRequestee"`.
- **BattleStatistics isolation**: `recordBattleResult()` in `battle.service.ts` is the sole writer; it upserts the row on first write, then updates in-place.
- **XP/Coin rewards for RANKED wins**: `awardXp(source='MILESTONE_ACHIEVED')` + `earnCoins(source='SPECIAL_EVENT')` — reuses frozen Sprint 8.1/8.2 sources.

---

# 20. Tournament Engine (Sprint 9.4)

Tournament models sit atop the Arena Foundation (Sprint 9.1). `TournamentMatch.arenaMatchId` links to `ArenaMatch` for actual match execution. No separate registration model — presence of a `TournamentStanding` row means registered.

## Tournament

```
Tournament {
  id                   UUID PK
  competitionId        UUID? FK → Competition (optional — competition can spawn a tournament bracket)
  tournamentCode       String UNIQUE  // 8-char uppercase alphanumeric; no ambiguous chars (0,O,1,I)
  name                 String
  format               String         // KNOCKOUT | ROUND_ROBIN | LEAGUE | SWISS_FOUNDATION
  status               String         // DRAFT | REGISTRATION_OPEN | REGISTRATION_CLOSED | READY | ACTIVE | COMPLETED | ARCHIVED | CANCELLED
  currentRound         Int DEFAULT 0
  totalRounds          Int?           // null for KNOCKOUT (determined by participant count at start)
  maxParticipants      Int?
  registrationStartsAt DateTime?
  registrationEndsAt   DateTime?
  startsAt             DateTime
  endsAt               DateTime
  createdBy            String FK → User.id  // admin
  createdAt            DateTime
  updatedAt            DateTime
}
```

## TournamentRound

```
TournamentRound {
  id           UUID PK
  tournamentId UUID FK → Tournament
  roundNumber  Int                   // 1-based
  status       String                // PENDING | ACTIVE | COMPLETED
  startsAt     DateTime?
  endsAt       DateTime?
  createdAt    DateTime
  @@unique([tournamentId, roundNumber])
}
```

## TournamentMatch

```
TournamentMatch {
  id             UUID PK
  roundId        UUID FK → TournamentRound
  arenaMatchId   UUID? FK → ArenaMatch  // null until round starts
  participantOne String                  // studentId (denormalised plain string)
  participantTwo String?                 // studentId; null = bye
  winnerId       String?                 // studentId; null until COMPLETED or WALKOVER
  status         String                  // SCHEDULED | ACTIVE | COMPLETED | WALKOVER | CANCELLED
  scheduledAt    DateTime?
  completedAt    DateTime?
}
```

## TournamentStanding

```
TournamentStanding {
  id           UUID PK
  tournamentId UUID FK → Tournament
  studentId    UUID FK → StudentProfile
  played       Int DEFAULT 0
  wins         Int DEFAULT 0
  losses       Int DEFAULT 0
  draws        Int DEFAULT 0
  points       Int DEFAULT 0   // win=3, draw=1, loss=0
  rank         Int?            // null until first round completes; recomputed after each round
  updatedAt    DateTime
  @@unique([tournamentId, studentId])
}
```

## Back-relations added to existing models

| Model | Back-relation added |
|---|---|
| Competition | `tournaments Tournament[]` |
| User | `tournaments Tournament[]` |
| ArenaMatch | `tournamentMatches TournamentMatch[]` |
| StudentProfile | `tournamentStandings TournamentStanding[]` |

## Tournament status lifecycle

```
DRAFT → REGISTRATION_OPEN → REGISTRATION_CLOSED → READY → ACTIVE → COMPLETED → ARCHIVED
Any non-terminal → CANCELLED
```

## Bracket generation rules

| Format | Algorithm | Total rounds |
|---|---|---|
| KNOCKOUT | Sort by studentId, pair consecutively; odd = last gets bye (auto-WALKOVER) | ceil(log2(n)) |
| ROUND_ROBIN | Circle method — fix position 0, rotate rest clockwise each round | n-1 (even) or n (odd) |
| LEAGUE | Same as ROUND_ROBIN | Same |
| SWISS_FOUNDATION | Same as KNOCKOUT bracket, no elimination | ceil(log2(n)) |

## Design notes

- **Registration = TournamentStanding row**: No separate TournamentRegistration model. Creating a TournamentStanding row (stats all zero) is the registration act. Deletion = cancellation.
- **participantOne/participantTwo as plain strings**: FK to StudentProfile would create a cycle through TournamentRound → TournamentMatch → StudentProfile → TournamentStanding → Tournament. Plain strings avoid the cycle; the service resolves standing updates via `tournamentId + studentId` composite key.
- **arenaMatchId null until round starts**: The round is created (PENDING) with matches in SCHEDULED state. When the round goes ACTIVE, ArenaMatch rows are created and `arenaMatchId` is set.
- **Bye handling**: `participantTwo = null` signals a bye. Service auto-resolves as WALKOVER immediately on bracket creation for KNOCKOUT; standings update: `played += 1, wins += 1, points += 3` for the bye recipient.
- **Rank recomputation**: `recomputeRanks()` runs after every `recordMatchResult()` call — sorts standings by `points DESC, wins DESC, id ASC` and writes 1-based rank. No read-time computation.
- **Arena dashboard**: Not a DB model — a read-only BFF service that aggregates `BattleStatistics`, `TournamentStanding`, and `CompetitionRegistration` into a single dashboard response. Arena Rating = `1000 + (tournamentPoints × 10) + (battleWins × 5)` — derived, not persisted.

---

# 21. Notification Platform (Sprint 10.1)

Foundation notification infrastructure. Every future module (Auth, Tests, Rankings, Gamification, Arena, Payments) uses these tables to store and deliver notifications. Notification rows are immutable except for `status`, `readAt`, and `archivedAt`. DeliveryLog rows are append-only — each retry creates a new row.

## Notification

```
Notification {
  id           UUID PK
  userId       String FK → User.id (Cascade)
  type         String          // TEST | RESULT | RANKING | GAMIFICATION | ARENA | COMPETITION | PAYMENT | SECURITY | SYSTEM | ANNOUNCEMENT
  category     String?         // optional sub-category (e.g. "badge", "streak")
  priority     String          // LOW | NORMAL | HIGH | CRITICAL  (@default NORMAL)
  title        String
  message      String
  data         Json?           // arbitrary payload for deep-linking / rendering
  status       String          // PENDING | QUEUED | SENT | DELIVERED | READ | FAILED | CANCELLED  (@default PENDING)
  scheduledFor DateTime?       // null = deliver immediately
  expiresAt    DateTime?
  readAt       DateTime?       // set once on first read
  archivedAt   DateTime?       // soft-archive; excluded from default list queries
  createdAt    DateTime
}
```

Indexes: `(userId, status)`, `(userId, createdAt)`, `(userId, type)`, `(status, scheduledFor)`, `priority`

## NotificationTemplate

```
NotificationTemplate {
  id              UUID PK
  code            String UNIQUE     // machine key: "OTP_SENT", "TEST_RESULT", etc.
  name            String
  titleTemplate   String            // "Your OTP is {{otp}}"
  messageTemplate String
  defaultChannel  String            // preferred channel
  variables       Json?             // string[] — lists required template variable names
  isActive        Boolean
  createdAt       DateTime
  updatedAt       DateTime
}
```

## NotificationPreference

```
NotificationPreference {
  userId          String @id FK → User.id  // 1:1 with User (PK = FK)
  inAppEnabled    Boolean @default(true)
  pushEnabled     Boolean @default(true)
  emailEnabled    Boolean @default(false)
  smsEnabled      Boolean @default(false)
  whatsappEnabled Boolean @default(false)
  quietHoursStart Int?    // UTC hour 0–23; null = no quiet hours
  quietHoursEnd   Int?    // UTC hour 0–23; null = no quiet hours
  createdAt       DateTime
  updatedAt       DateTime
}
```

## NotificationDeliveryLog

```
NotificationDeliveryLog {
  id                UUID PK
  notificationId    UUID FK → Notification.id (Cascade)
  channel           String     // IN_APP | PUSH | EMAIL | SMS | WHATSAPP
  provider          String     // mock | firebase | twilio | msg91 | sendgrid | whatsapp-business
  status            String     // PENDING | SENT | DELIVERED | FAILED
  attempt           Int        // 1-based counter
  providerMessageId String?    // provider's own message ID for webhook reconciliation
  errorMessage      String?
  sentAt            DateTime?
  deliveredAt       DateTime?
  createdAt         DateTime
}
```

Indexes: `(notificationId, attempt)`, `(notificationId, status)`, `(channel, status)`

## Back-relation added to existing models

| Model | Back-relation added |
|---|---|
| User | `notificationPreference NotificationPreference?` |

## Design notes

- **Notification is immutable**: only `status`, `readAt`, and `archivedAt` change after creation. `title`, `message`, `data`, `type` are fixed.
- **DeliveryLog is append-only**: never update existing rows. Each retry attempt inserts a new row with incremented `attempt`.
- **CRITICAL priority**: bypasses quiet hours AND channel preferences — always delivered regardless of user settings.
- **IN_APP channel**: the notification row itself is the in-app notification. The mock adapter is a no-op; it exists only for delivery log consistency.
- **Quiet hours**: UTC hour comparison handles overnight windows (e.g. 22–06) — computed in `notification.rules.ts::isQuietHour()`.
- **Preferences are lazy**: row is not created until the user first updates preferences. `getPreferences()` returns defaults without writing if no row exists.
- **Archived notifications**: `archivedAt != null` rows are excluded from all default list queries. Hard-delete is only permitted after archiving (service-enforced).
- **Template variables**: `variables Json?` documents required placeholder names. `renderTemplate()` throws 400 if any declared variable is missing from the provided vars map.

---

# 32. Event Engine (Sprint 10.2)

## DomainEvent

Append-only log of domain events emitted by any business module.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| eventType | String | DomainEventType literal |
| aggregateType | String | e.g. "User", "TestAttempt", "ArenaMatch" |
| aggregateId | UUID | Root aggregate's id |
| payload | Json | Arbitrary event data; includes `targetUserId` for routing |
| status | String | PENDING → PROCESSING → PROCESSED \| FAILED \| CANCELLED |
| processedAt | DateTime? | Set when status transitions to PROCESSED |
| retryCount | Int | Incremented on each FAILED → re-queue cycle |
| createdAt | DateTime | |

**Indexes**: `eventType`, `status`, `(aggregateType, aggregateId)`, `(status, createdAt)`

**Status lifecycle**:

```
PENDING → PROCESSING → PROCESSED   (happy path)
                     → FAILED       (adapter error)
PENDING → CANCELLED                 (admin cancels before processing)
```

PROCESSED and CANCELLED events are **immutable** — never re-queued.

---

# 33. Announcement Center (Sprint 10.2)

## Announcement

Admin-created broadcasts with audience-based recipient resolution.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| title | String | |
| message | String | |
| type | String | GLOBAL \| BOARD \| CLASS \| SCHOOL \| DISTRICT \| STATE \| COMPETITION \| SYSTEM \| MAINTENANCE |
| priority | String | LOW \| NORMAL \| HIGH \| CRITICAL |
| targetAudience | String | ALL \| BOARD \| CLASS \| SCHOOL \| DISTRICT \| STATE |
| boardId | UUID? | FK → Board.id; used when targetAudience = BOARD |
| academicYearId | String? | Plain string; future AcademicYear FK |
| class | String? | Matches StudentProfile.class (stored as string) |
| schoolId | UUID? | FK → School.id; used when targetAudience = SCHOOL |
| districtId | String? | Matches School.district string |
| stateId | String? | Matches School.state string |
| scheduledFor | DateTime? | null = publish immediately on admin action |
| expiresAt | DateTime? | null = never expires |
| status | String | DRAFT \| SCHEDULED \| PUBLISHED \| EXPIRED \| CANCELLED |
| createdBy | UUID | FK → User.id (admin only; Restrict delete) |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations**: `board Board?`, `school School?`, `creator User`, `recipients AnnouncementRecipient[]`

**Indexes**: `type`, `status`, `(status, scheduledFor)`, `(status, expiresAt)`, `createdBy`

**Status lifecycle**:

```
DRAFT → SCHEDULED     (admin sets scheduledFor in future)
DRAFT → PUBLISHED     (admin publishes immediately)
SCHEDULED → PUBLISHED (admin publishes or scheduled job fires)
PUBLISHED → EXPIRED   (expiresAt reached)
DRAFT | SCHEDULED → CANCELLED
```

Only DRAFT and SCHEDULED announcements may be edited or cancelled.
Only DRAFT and CANCELLED announcements may be deleted.

## AnnouncementRecipient

One row per (announcement × user). Created in bulk on publish via `createMany`.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| announcementId | UUID | FK → Announcement.id (Cascade) |
| userId | UUID | FK → User.id (Cascade) |
| readAt | DateTime? | Set by student when they open the announcement |
| dismissedAt | DateTime? | Set by student on dismiss; excluded from feed thereafter |
| createdAt | DateTime | |

**Unique**: `(announcementId, userId)` — one row per user per announcement

**Indexes**: `announcementId`, `(userId, readAt)`, `(userId, dismissedAt)`, `(userId, createdAt)`

## Audience resolution

`resolveAudience()` in `announcement.repository.ts` maps `targetAudience` to userId list:

| targetAudience | Resolution |
|---|---|
| ALL | All StudentProfile.userId |
| SCHOOL | StudentProfile WHERE schoolId = announcement.schoolId |
| CLASS | StudentProfile WHERE class = parseInt(announcement.class) |
| BOARD | Board lookup → School.board match → StudentProfile join |
| DISTRICT | School WHERE district = districtId → StudentProfile join |
| STATE | School WHERE state = stateId → StudentProfile join |

**Back-relations added to existing models**:
- `User`: `announcementsCreated Announcement[]`, `announcementRecipients AnnouncementRecipient[]`
- `Board`: `announcements Announcement[]`
- `School`: `announcements Announcement[]`

## Design notes

- **Bulk creation**: `createRecipients()` uses `createMany` with `skipDuplicates: true`
- **Expired filter**: `findMyAnnouncements()` filters `expiresAt > now()` server-side
- **Dismissed filter**: dismissed rows are excluded from the student feed (`dismissedAt: null`)
- **Event integration**: `publishAnnouncement()` calls `emitEvent('ANNOUNCEMENT_CREATED')` per recipient so the notification engine creates an in-app notification for each

---

# 34. Admin Platform — RBAC Foundation (Sprint 12.1)

## AdminRole

Granular roles for admin users. Distinct from the `User.role` enum (STUDENT | TEACHER | ADMIN) — that field controls API access; AdminRole controls fine-grained permissions within the admin surface.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| name | String UNIQUE | UPPER_SNAKE_CASE; e.g. SUPER_ADMIN, CONTENT_MANAGER |
| description | String? | |
| isSystem | Boolean | System roles cannot be deleted; `SUPER_ADMIN` is seeded with isSystem=true |
| createdAt | DateTime | |
| updatedAt | DateTime | |

**Relations**: `permissions RolePermission[]`, `admins User[]`

**Indexes**: `name`

**Added to User**: `adminRoleId String?`, `adminRole AdminRole?`, `adminAuditLogs AdminAuditLog[]`, `@@index([adminRoleId])`

## AdminPermission

Immutable permission catalog seeded at deploy time. Never updated by user action.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| code | String UNIQUE | Machine key: `QUESTION_CREATE`, `TEST_PUBLISH`, etc. |
| module | String | QUESTION \| TEST \| STUDENT \| COMPETITION \| NOTIFICATION \| SYSTEM |
| action | String | CREATE \| UPDATE \| DELETE \| VIEW \| MANAGE \| SEND |
| description | String? | Human-readable explanation |
| createdAt | DateTime | |

**Seeded permission codes**:
- `QUESTION_CREATE` `QUESTION_UPDATE` `QUESTION_DELETE`
- `TEST_CREATE` `TEST_PUBLISH`
- `STUDENT_VIEW` `STUDENT_SUSPEND`
- `COMPETITION_MANAGE`
- `NOTIFICATION_SEND`
- `SYSTEM_SETTINGS`

## RolePermission

Many-to-many join. Composite PK `(roleId, permissionId)` — no synthetic UUID.

| Column | Type | Notes |
|---|---|---|
| roleId | UUID | FK → AdminRole.id (Cascade) |
| permissionId | UUID | FK → AdminPermission.id (Cascade) |
| createdAt | DateTime | |

**`replaceRolePermissions()`** runs atomically: `deleteMany` + `createMany` in one `$transaction`.

## AdminAuditLog

Append-only admin write audit trail. Never update or delete.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| adminId | UUID | FK → User.id (Restrict) |
| action | String | ADMIN_LOGIN · ADMIN_LOGOUT · ROLE_CREATED · ROLE_UPDATED · ROLE_DELETED · PERMISSIONS_REPLACED |
| module | String | AUTH \| ROLE \| PERMISSION \| AUDIT \| DASHBOARD |
| entityType | String? | e.g. "AdminRole", "AdminPermission" |
| entityId | UUID? | UUID of the affected row |
| beforeData | Json? | State before the change (null for creates) |
| afterData | Json? | State after the change (null for deletes) |
| ipAddress | String? | |
| userAgent | String? | |
| createdAt | DateTime | |

**Indexes**: `adminId`, `module`, `action`, `createdAt`, `(entityType, entityId)`

## RBAC Architecture

```
Admin User (User.role = ADMIN)
  └─ AdminRole (User.adminRoleId)
       └─ RolePermission[]
            └─ AdminPermission (code, module, action)
```

**Permission evaluation** (in `admin.rules.ts`):
1. Load admin's permission codes via `repo.getAdminPermissions(adminId)`
2. Check SUPER_ADMIN bypass: if `adminRole.isSystem = true`, skip all permission checks
3. Otherwise call `assertPermission(codes, roleName, 'QUESTION_CREATE')` — throws 403 on failure

## Admin JWT Isolation

Admin tokens carry `audience: 'board-ranking-admin'`. Student tokens carry `audience: 'board-ranking-client'`. `verifyAdminAccessToken()` rejects tokens with any other audience, so a stolen student token cannot access admin endpoints even with the same signing secret.

- `signAdminAccessToken` / `signAdminRefreshToken` — in `utils/admin-jwt.util.ts`
- `authenticateAdmin` middleware — validates audience + checks `role = 'ADMIN'`
- Admin refresh token lives in `adminRefreshToken` HttpOnly cookie (separate from student `refreshToken`)

## Design notes

- **System roles**: `isSystem = true` → rejected by `assertNotSystemRole()` in rules.ts before any delete/update
- **Audit every write**: every service write calls `audit()` which calls `repo.createAuditLog()` — never skip
- **Permission catalog is seeded**: `AdminPermission` rows are created at deploy time; admins never create new permission codes
- **Single role per admin (Phase 1)**: `User.adminRoleId` is a single FK; multi-role support can be added later with a join table without breaking Phase 1 assignments

---

# 35. Content & Academic Management (Sprint 12.2)

Sprint 12.2 adds no new database tables. All content management operations are performed on existing tables using the admin orchestration layer (admin-content.service → existing repositories → Prisma).

## Admin Orchestration Architecture

```
Admin Routes (/admin/*)
  → authenticateAdmin (validates audience: 'board-ranking-admin')
  → Admin Content Controller (req/res only)
  → Admin Content Service (RBAC + lifecycle guards + audit)
      → assertPermission (admin.rules.ts — SUPER_ADMIN bypass)
      → Existing repositories (board, subject, chapter, question, test, competition, announcement)
      → Admin Content Repository (Board CRUD, bulk question ops, competition clone/update, content overview)
      → Admin Repository (createAuditLog)
```

Every write operation records an `AdminAuditLog` row with before/after data, adminId, action, and IP/UA.

## Content Lifecycle Policies

### Question Moderation Lifecycle

```
DRAFT → IN_REVIEW → APPROVED → PUBLISHED → ARCHIVED
                  ↘ REJECTED → DRAFT (re-edit and resubmit)
APPROVED → ARCHIVED (admin force-archive)
```

- `DRAFT`: editable; student-created or admin-created
- `IN_REVIEW`: locked from student edits; awaiting admin review
- `APPROVED`: question pool eligible; awaiting inclusion in a test blueprint
- `PUBLISHED`: pinned in at least one live test via `QuestionVersion` snapshot; immutable
- `REJECTED`: returned to `DRAFT` so author can fix and resubmit
- `ARCHIVED`: removed from all pools; never served to students

**Single-question operations** (`/questions/:id/approve|reject|archive`) delegate to `question-workflow.service` (CAS + immutable QuestionVersion capture).

**Bulk operations** (`/questions/bulk-approve|reject|archive`) use `prisma.question.updateMany` directly — per-row CAS is impractical at bulk scale; covered by `AdminAuditLog`.

### Test Publishing Lifecycle

```
DRAFT → ACTIVE (publish) → DRAFT (unpublish)
DRAFT | ACTIVE → ARCHIVED
```

- Only `DRAFT` tests can be edited or published
- Publish triggers the pool gate inside `test.service.updateTest` (validates question pool size and difficulty distribution)
- Unpublish sets status back to `DRAFT`
- `cloneTest` (duplicate) creates a new `DRAFT` test with the same blueprint

### Competition Publishing Lifecycle

```
DRAFT → REGISTRATION_OPEN (publish) → ... → ACTIVE → COMPLETED → ARCHIVED
DRAFT | REGISTRATION_OPEN | REGISTRATION_CLOSED | READY → CANCELLED
```

- Only `DRAFT` competitions can be edited
- Publish sets status to `REGISTRATION_OPEN` (opening the entry window)
- Cancel: `updateCompetitionStatus(CANCELLED)` + `cancelAllRegistrations()` in one operation
- Clone: 3-attempt code-collision retry with `generateCompetitionCode()`

### Announcement Publishing Lifecycle

```
DRAFT → SCHEDULED (scheduledFor set) | PUBLISHED (no scheduledFor) → EXPIRED | CANCELLED
```

- Only `DRAFT` announcements can be edited
- Publish delegates to `announcement.service.publishAnnouncement` — resolves target audience, creates `NotificationRecipient` rows, emits domain event
- Cancel delegates to `announcement.service.cancelAnnouncement`

### Archive Policy

| Resource | Archive condition | Effect |
|---|---|---|
| Board | Admin explicit archive (`isActive: false`) | Children (subjects/chapters/topics) get 404 via `visibleOnlyFor()` |
| Subject | Admin explicit archive (`isActive: false`) | Children cascade 404 |
| Chapter | Admin explicit archive (`isActive: false`) | Children cascade 404 |
| Question | Status → `ARCHIVED` | Excluded from all pools; never served |
| Test | Status → `ARCHIVED` | No new attempts; historical results preserved |

## Admin Content Permission Codes

New codes added in Sprint 12.2 (stored as `AdminPermission.code` rows in the database):

| Code | Grants access to |
|---|---|
| `BOARD_MANAGE` | Create, update, archive/restore boards, subjects, chapters |
| `QUESTION_REVIEW` | View question moderation queue; list all question statuses |
| `QUESTION_APPROVE` | Approve, reject, archive questions (single and bulk) |
| `ANNOUNCEMENT_PUBLISH` | Publish and cancel announcements |

Codes inherited from Sprint 12.1 (already seeded):

| Code | Used in Sprint 12.2 for |
|---|---|
| `TEST_PUBLISH` | Create, update, publish, unpublish, archive, duplicate tests |
| `COMPETITION_MANAGE` | Create, update, publish, cancel, clone competitions |

## Content Overview Query (GET /admin/content/overview)

9 aggregate counts fetched in parallel via `Promise.all` — single DB round-trip:

| Field | Source |
|---|---|
| `totalBoards` | `board.count()` |
| `totalSubjects` | `subject.count({ isActive: true })` |
| `totalQuestions` | `question.count({ isActive: true })` |
| `draftQuestions` | `question.count({ status: DRAFT, isActive: true })` |
| `approvedQuestions` | `question.count({ status: APPROVED, isActive: true })` |
| `publishedTests` | `test.count({ status: ACTIVE, isActive: true })` |
| `scheduledTests` | `test.count({ status: DRAFT, startTime > now, isActive: true })` |
| `activeCompetitions` | `competition.count({ status: ACTIVE })` |
| `scheduledAnnouncements` | `announcement.count({ status: SCHEDULED })` |

---

# 36. Operations & Analytics (Sprint 12.3)

## Schema Additions

### StudentProfile — Suspension Fields

Three new columns added to support soft suspension (never hard-delete):

| Column | Type | Default | Notes |
|---|---|---|---|
| `isSuspended` | Boolean | `false` | Set to `true` on suspension |
| `suspendedAt` | DateTime? | null | Timestamp of most recent suspension |
| `suspendedReason` | String? | null | Admin-provided reason; cleared on reactivation |

Suspension lifecycle:
```
active (isSuspended=false)
  → SUSPEND (reason required) → suspended (isSuspended=true, suspendedAt set)
  → REACTIVATE              → active (fields cleared)
```

Students are never hard-deleted. Suspension blocks login at the application layer only — DB rows remain intact for audit purposes.

### School — isActive Field

Added `isActive Boolean @default(true)` to `School`. Matches the pattern already in use by `Board`, `Subject`, and `Chapter`. Setting `isActive: false` soft-archives the school.

**Merge operation**: When two duplicate schools are merged, all `StudentProfile.schoolId` FKs pointing to the source school are bulk-updated to the target school, and the source school is set `isActive: false`. This is done in a single `$transaction` to ensure atomicity.

## SystemSetting

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| key | String (unique) | UPPER_SNAKE_CASE enforced at service layer |
| value | Json | Arbitrary JSON — platform config values |
| description | String? | Human-readable note about what the setting controls |
| isPublic | Boolean | `true` = may be exposed to non-admin endpoints (future use) |
| updatedBy | UUID FK → User.id | Admin who last set the value |
| createdAt | DateTime | |
| updatedAt | DateTime | Auto-updated on every upsert |

**Design notes:**
- `upsert` semantics: writing an existing key replaces the value (no separate PUT/POST distinction)
- Only SUPER_ADMIN may write (enforced by `assertSuperAdmin` in service)
- Reads are available to any authenticated admin with `SYSTEM_SETTINGS` permission

## SupportNote

Append-only notes on a student's support timeline.

| Column | Type | Notes |
|---|---|---|
| id | UUID PK | |
| studentId | UUID FK → StudentProfile.id (Restrict) | |
| adminId | UUID FK → User.id (Restrict) | Admin who wrote the note |
| note | String | Up to 2000 chars |
| createdAt | DateTime | Never updated |

**Design notes:**
- Immutable after creation — no UPDATE or DELETE ever touches this table
- Ordered by `createdAt DESC` for the support timeline feed
- Index: `(studentId, createdAt)` for efficient per-student timeline queries

## Operations Permission Codes (Sprint 12.3)

New codes (in addition to the Sprint 12.1 + 12.2 codes):

| Code | Module | Grants access to |
|---|---|---|
| `SCHOOL_MANAGE` | SCHOOL | School list, view, stats, activate/archive/merge |
| `ANALYTICS_VIEW` | ANALYTICS | Platform analytics dashboard |
| `SUPPORT_VIEW` | SUPPORT | Support timeline, add notes |

Codes reused from Sprint 12.1:

| Code | Used in Sprint 12.3 for |
|---|---|
| `STUDENT_VIEW` | List and view student profiles |
| `STUDENT_SUSPEND` | Suspend and reactivate students |
| `COMPETITION_MANAGE` | Competition and Arena operations |
| `NOTIFICATION_SEND` | Notification operations and retry |
| `SYSTEM_SETTINGS` | Read global settings |

SUPER_ADMIN only (no permission code — `assertSuperAdmin` guard):
- Grant XP / Grant Coins
- Reset study streak
- Force-close Arena match
- Retry failed match events
- Merge schools
- Write system settings (upsert)

## Operations Overview Query (GET /admin/operations/overview)

12 aggregate counts fetched in parallel — single DB round-trip:

| Field | Source |
|---|---|
| `students.total` | `studentProfile.count()` |
| `students.suspended` | `studentProfile.count({ isSuspended: true })` |
| `schools.total` | `school.count()` |
| `schools.active` | `school.count({ isActive: true })` |
| `tests.attemptedToday` | `testAttempt.count({ submittedAt >= today })` |
| `tests.active` | `test.count({ status: ACTIVE, isActive: true })` |
| `arena.activeMatches` | `arenaMatch.count({ status: ACTIVE })` |
| `competitions.active` | `competition.count({ status: ACTIVE })` |
| `competitions.total` | `competition.count()` |
| `notifications.failed` | `notificationDeliveryLog.count({ status: FAILED })` |
| `notifications.pending` | `notificationDeliveryLog.count({ status: PENDING })` |
| `settings.total` | `systemSetting.count()` |

---

# 37. Golden Rule

The database is the foundation of Board Ranking.

Every table should have one responsibility.

Every relationship should be intentional.

Every migration should be carefully planned.

Design today for the product we want in five years, while keeping today's implementation as simple as possible.
