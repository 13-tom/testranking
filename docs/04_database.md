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

# 12. Tests

Fields

id

title

class

subjectId

chapterId

difficulty

duration

totalMarks

status

createdBy

createdAt

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

studentId

testId

startedAt

submittedAt

score

percentage

accuracy

timeTaken

studyPointsEarned

createdAt

Purpose

Stores one completed attempt.

---

# 15. StudentAnswers

Fields

id

attemptId

questionId

selectedAnswer

isCorrect

timeTaken

Allows complete review later.

---

# 16. Leaderboard

Fields

id

studentId

period

schoolRank

districtRank

stateRank

indiaRank

studyPoints

updatedAt

Purpose

Stores cached ranking information.

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

# 33. Golden Rule

The database is the foundation of Board Ranking.

Every table should have one responsibility.

Every relationship should be intentional.

Every migration should be carefully planned.

Design today for the product we want in five years, while keeping today's implementation as simple as possible.
