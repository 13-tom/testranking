# Chapter 11.1 – Introduction to the Academic Question Management System (AQMS)

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Module:** Academic Question Management System (AQMS)

**Version:** 1.0

---

# 1. Introduction

The Academic Question Management System (AQMS) is the foundation of Board Ranking.

Every assessment, every test, every result, every ranking, and every student analysis begins with one thing:

**A high-quality question.**

Because of this, the Question Bank is considered the most valuable academic asset of the platform.

Unlike ordinary databases that simply store questions, AQMS is designed to manage the complete lifecycle of every academic question—from creation to archival—while maintaining quality, consistency, traceability, and scalability.

---

# 2. Purpose

The purpose of AQMS is to provide a centralized system for creating, organizing, validating, publishing, and maintaining questions.

The system ensures that every question available to students follows the same academic and technical standards.

AQMS is not just a storage system.

It is an academic management system.

---

# 3. Why AQMS Exists

Without a structured Question Management System, large educational platforms eventually face problems such as:

* Duplicate questions
* Inconsistent difficulty
* Incorrect answers
* Poor explanations
* Unorganized question collections
* Difficult maintenance
* Slow searching
* Low student trust

AQMS is designed to eliminate these problems before they occur.

---

# 4. Core Objectives

AQMS has six primary objectives.

### Objective 1

Maintain a high-quality academic Question Bank.

---

### Objective 2

Ensure every question follows a standardized structure.

---

### Objective 3

Prevent duplicate and low-quality questions.

---

### Objective 4

Support automatic test generation.

---

### Objective 5

Provide accurate data for analytics and rankings.

---

### Objective 6

Support future expansion without redesigning the system.

---

# 5. Guiding Principles

The Academic Question Management System follows these principles:

Quality before Quantity

One Question = One Concept

Questions are Never Deleted

Every Change is Traceable

Every Question has an Explanation

Every Question has an Owner

Consistency Across the Entire Platform

---

# 6. Role in Board Ranking

AQMS serves as the data source for multiple platform modules.

```text
Academic Question Management System

↓

Test Engine

↓

Evaluation Engine

↓

Analytics Engine

↓

Ranking Engine

↓

Study Points Engine

↓

Student Dashboard
```

Every module depends on AQMS.

If AQMS fails, the platform cannot function correctly.

---

# 7. MVP Scope

Release 1 supports:

* Multiple Choice Questions (MCQs)
* Four options
* One correct answer
* Explanation
* Difficulty level
* Subject mapping
* Chapter mapping
* Topic mapping
* Question Reference Code
* Duplicate detection
* Admin-only management

This focused scope ensures quality and faster delivery.

---

# 8. Out of Scope

The following features are intentionally excluded from Release 1:

* Image-based questions
* Audio questions
* Video questions
* Mathematical equation editor
* Multiple correct answers
* Fill in the blanks
* Match the following
* Case-study questions
* Coding questions
* Teacher-created questions
* AI-generated questions

The system architecture, however, should remain flexible enough to support these features in future releases.

---

# 9. Academic Standards

Every published question must satisfy the following requirements:

* Academically correct
* Curriculum aligned
* Grammatically correct
* Easy to understand
* Free from ambiguity
* Reviewed before publication
* Supported by a correct explanation

Question quality is considered more important than the total number of questions available.

---

# 10. Long-Term Vision

The long-term objective of AQMS is to become an intelligent academic repository.

Future versions will analyze:

* Average accuracy
* Average solving time
* Difficulty based on real student performance
* Frequently reported questions
* Learning outcomes
* Concept mastery
* Recommendation quality

Over time, every student interaction will improve the overall quality of the Question Bank.

---

# 11. Success Criteria

AQMS will be considered successful if it enables the platform to:

* Manage millions of questions efficiently.
* Generate high-quality tests automatically.
* Prevent duplicate content.
* Maintain academic consistency.
* Support accurate student analytics.
* Scale without major architectural changes.

---

# CTO Statement

The value of Board Ranking does not come from its user interface alone.

Its true value lies in the quality, organization, and intelligence of its Question Bank.

The Academic Question Management System is not just another backend module—it is the academic foundation of the entire platform.

Every future feature, from adaptive learning to AI-powered recommendations, will rely on the quality of the decisions made in this system.

For this reason, AQMS must always be designed with long-term scalability, academic integrity, and maintainability as its highest priorities.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 2 – Question Identity & Classification System

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

Every question inside Board Ranking must have a unique identity.

As the platform grows from hundreds of questions to hundreds of thousands or even millions, the system must still be able to:

* Find questions instantly.
* Prevent duplicates.
* Organize questions logically.
* Generate tests automatically.
* Support future AI features.
* Track question history.

This phase defines how every question is identified and classified.

---

# 2. Identity Philosophy

A question is not just text.

A question is an academic asset.

Every academic asset must have:

* Identity
* Classification
* Ownership
* History
* Status
* Traceability

Without these, long-term maintenance becomes impossible.

---

# 3. Two-Identity System

Every question will have **two IDs**.

## Identity 1 — Internal ID

Type:

UUID

Example:

```text
550e8400-e29b-41d4-a716-446655440000
```

Purpose:

* Primary Key
* Database Relationships
* Internal APIs
* Never changes
* Never visible to students

---

## Identity 2 — Question Reference Code

Example:

```text
10M0101
```

Purpose:

* Admin Panel
* Reports
* Manual search
* Academic reference
* Bulk uploads

Students never see this code.

---

# 4. Question Reference Code Standard

Structure

```text
CC S CC QQ
```

Meaning

CC

↓

Class

S

↓

Subject Code

CC

↓

Chapter Number

QQ

↓

Question Number

---

Example

```text
10M0101
```

Breakdown

10

↓

Class 10

M

↓

Mathematics

01

↓

Chapter 1

01

↓

Question 1

---

Another Example

```text
09S0318
```

Meaning

Class 9

Science

Chapter 3

Question 18

---

# 5. Subject Codes

Official subject codes

| Subject          | Code |
| ---------------- | ---- |
| Mathematics      | M    |
| Science          | S    |
| English          | E    |
| Social Science   | SS   |
| Physics          | P    |
| Chemistry        | C    |
| Biology          | B    |
| Computer Science | CS   |

Future subjects receive new unique codes.

Subject codes never change.

---

# 6. Academic Hierarchy

Every question belongs to exactly one academic path.

```text
Class

↓

Subject

↓

Chapter

↓

Topic

↓

Question
```

Example

```text
Class 10

↓

Mathematics

↓

Chapter 5

↓

Arithmetic Progression

↓

Question
```

This hierarchy is the foundation of analytics and automatic test generation.

---

# 7. Topic Classification

Each chapter is divided into topics.

Example

Chapter

↓

Arithmetic Progression

Topics

↓

Introduction

↓

Nth Term

↓

Common Difference

↓

Applications

↓

Questions

This allows more accurate recommendations in future versions.

---

# 8. Question Type

Release 1 supports only one type.

MCQ

Future architecture supports:

* Multiple Correct
* Integer
* Fill Blank
* Assertion–Reason
* Match the Following
* Case Study
* Numerical

These remain disabled during MVP.

---

# 9. Difficulty Levels

Every question has one difficulty.

Allowed values:

Easy

Medium

Hard

No custom difficulty levels are allowed.

Difficulty is assigned by Admin during review.

Future versions may adjust difficulty using real student performance.

---

# 10. Bloom's Taxonomy (Academic Level)

Every question should optionally be mapped to a learning level.

Release 1 stores the field but does not expose it to students.

Levels:

Remember

Understand

Apply

Analyze

Future levels such as Evaluate and Create can be added later if required.

This prepares the platform for advanced analytics without increasing MVP complexity.

---

# 11. Question Status

Every question always has one status.

Allowed values:

Draft

Pending Review

Approved

Published

Inactive

Archived

Only Published questions may appear in student tests.

---

# 12. Ownership Metadata

Every question stores:

Created By

Created Date

Last Updated By

Last Updated Date

Approved By

Approved Date

Published By

Published Date

Archived By

Archived Date

Every modification is traceable.

---

# 13. Question Tags

Tags improve search and organization.

Examples

NCERT

Previous Year

Board Important

Formula Based

Conceptual

Application Based

Revision

High Weightage

Frequently Asked

Future AI tags may be added automatically.

---

# 14. Searchable Attributes

The Question Bank can search by:

* UUID
* Question Reference Code
* Subject
* Chapter
* Topic
* Difficulty
* Status
* Tags
* Keyword
* Created By
* Date
* Source

This enables fast administration even with millions of questions.

---

# 15. Academic Source

Every question records its origin.

Examples:

Internal Team

NCERT Inspired

Previous Year Board Paper

Licensed Content

Future Teacher Submission

Future AI Assisted Draft

This improves transparency and content management.

---

# 16. Business Rules

* One UUID per question.
* One Question Reference Code per published question.
* One question belongs to one chapter in Release 1.
* One question belongs to one primary topic in Release 1.
* Students never see Question Reference Codes.
* UUIDs are immutable.
* Question Reference Codes remain stable after publication.

---

# 17. Future Expansion

The identity system is designed to support:

* Multiple Boards
* Multiple Languages
* International Curriculum
* AI-generated Questions
* Teacher Contributions
* Multimedia Questions

No structural redesign should be required.

---

# 18. Success Criteria

The Question Identity & Classification System is successful if:

* Every question is uniquely identifiable.
* Questions are easy to search.
* Automatic test generation is reliable.
* Analytics can identify chapter and topic performance.
* Future expansion is possible without changing existing IDs.

---

# CTO Decisions

### Decision AQMS-001

Every question has two identifiers:

* Internal UUID
* Public Question Reference Code

Status:

Approved

---

### Decision AQMS-002

Students never see Question Reference Codes.

Only administrators can view and search using them.

Status:

Approved

---

### Decision AQMS-003

Release 1 supports only one academic hierarchy:

Class → Subject → Chapter → Topic → Question

Status:

Approved

---

### Decision AQMS-004

Bloom's Taxonomy field is stored in the database from Release 1 but is not used in the student interface.

Status:

Approved

---

# CTO Statement

A great Question Bank is not measured by the number of questions it contains.

It is measured by how well those questions are organized.

A well-designed identity and classification system allows Board Ranking to scale from a few hundred questions to millions without losing consistency, searchability, or academic integrity.

Every future engine—Test Generation, Analytics, Rankings, Adaptive Learning, and AI Recommendations—will depend on the decisions made in this phase.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 3 – Question Structure & Version Control

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

Every question stored inside Board Ranking follows one standardized structure.

This standard ensures:

* Consistency
* Easy maintenance
* Better analytics
* Automatic test generation
* Future AI compatibility

Regardless of who creates the question, every question must follow the exact same format.

---

# 2. Question Philosophy

One Question

↓

One Concept

↓

One Correct Answer

↓

One Learning Objective

↓

One Explanation

Questions should measure knowledge, not confuse students.

---

# 3. Standard Question Structure

Every question contains the following sections.

## Identity

* UUID
* Question Reference Code
* Version

---

## Academic Information

* Class
* Subject
* Chapter
* Topic
* Difficulty
* Bloom's Level
* Tags

---

## Question Content

* Question Statement
* Option A
* Option B
* Option C
* Option D
* Correct Answer
* Explanation

---

## Metadata

* Status
* Source
* Created By
* Created Date
* Updated By
* Updated Date
* Published By
* Published Date

---

## Statistics (Future)

* Times Attempted
* Correct Attempts
* Wrong Attempts
* Average Accuracy
* Average Time
* Report Count

These fields remain inactive in MVP but are reserved for future analytics.

---

# 4. Question Statement Rules

The question statement must:

* Be grammatically correct.
* Be easy to read.
* Test one concept only.
* Avoid ambiguity.
* Match the selected chapter.
* Match the selected topic.

The statement should not contain unnecessary information.

---

# 5. Option Rules

Every MCQ contains exactly four options.

Option A

Option B

Option C

Option D

Rules:

* Options should be mutually exclusive.
* Only one option is correct.
* Options should have similar length where practical.
* Avoid obvious incorrect choices.
* Avoid clues in wording.

---

# 6. Correct Answer

Exactly one correct answer is allowed.

Allowed values:

A

B

C

D

The backend validates that the selected answer exists.

---

# 7. Explanation

Every published question must include an explanation.

Explanation should:

* Explain why the answer is correct.
* Clarify common misconceptions where helpful.
* Use simple language appropriate for the class level.
* Be academically accurate.

Questions without explanations cannot be published.

---

# 8. Version Control

Every question has an internal version.

Examples:

Version 1

↓

Version 2

↓

Version 3

The public Question Reference Code remains unchanged.

Example:

Public Code

10M0101

Internal Versions

v1

v2

v3

---

# 9. When Does the Version Change?

A new version is created when:

* Question wording changes.
* Correct answer changes.
* Explanation changes.
* Options change.
* Academic correction is made.

Minor metadata updates (such as tags or status) do not require a new version.

---

# 10. Version History

Every version stores:

* Version Number
* Changed By
* Change Date
* Reason for Change

Previous versions remain available for audit purposes.

---

# 11. Published Question Rules

Only Published questions:

* Appear in tests.
* Affect rankings.
* Affect analytics.
* Are available to students.

Drafts and archived questions are never served to students.

---

# 12. Archive Policy

Questions are never permanently deleted.

Lifecycle:

Published

↓

Inactive

↓

Archived

Archived questions:

* Remain in the database.
* Keep their history.
* Are excluded from test generation.
* Can be restored by an Admin if required.

---

# 13. Academic Integrity Rules

A published question must:

* Belong to one class.
* Belong to one subject.
* Belong to one chapter.
* Belong to one primary topic.
* Have one correct answer.
* Have one explanation.
* Pass validation checks.

---

# 14. Quality Checklist

Before publishing, every question should satisfy:

✓ No spelling mistakes.

✓ No grammatical errors.

✓ Correct syllabus mapping.

✓ Correct answer verified.

✓ Explanation available.

✓ Duplicate check passed.

✓ Status approved.

If any item fails, publication is blocked.

---

# 15. Future Multimedia Support

The architecture reserves fields for:

* Images
* Mathematical equations
* Diagrams
* Tables
* Audio
* Video

These remain disabled in Release 1.

No database redesign should be required when they are introduced.

---

# 16. Future AI Readiness

Every question structure is designed to support future AI capabilities such as:

* Automatic difficulty estimation.
* AI-generated explanations.
* Question quality scoring.
* Duplicate similarity detection.
* Adaptive practice recommendations.

The MVP stores only the information needed today while remaining compatible with future enhancements.

---

# 17. Business Rules

* Every question must have a UUID.
* Every published question must have a Question Reference Code.
* Every published question must include an explanation.
* Questions cannot be permanently deleted.
* Version history must always be preserved.
* Students always receive the latest published version.

---

# 18. Success Criteria

The Question Structure System is successful if:

* Every question follows a consistent format.
* All published questions pass validation.
* Version history is preserved.
* Future updates do not require structural redesign.
* The Question Bank remains reliable as it grows.

---

# CTO Decisions

### Decision AQMS-005

Every published question must include an explanation.

**Status:** Approved

**Reason:** Students learn more effectively when they understand why an answer is correct.

---

### Decision AQMS-006

Questions are version-controlled internally.

The public Question Reference Code never changes after publication.

**Status:** Approved

---

### Decision AQMS-007

Published questions cannot be permanently deleted.

They are archived instead.

**Status:** Approved

---

### Decision AQMS-008

Every question must pass a publication checklist before becoming available to students.

**Status:** Approved

---

# CTO Statement

A high-quality Question Bank is built through discipline, not volume.

Every question should be treated as a long-term academic asset.

By enforcing a standardized structure, maintaining version history, and preserving every meaningful change, Board Ranking ensures that its Question Bank remains accurate, trustworthy, and scalable for years to come.

Our goal is not simply to store questions—it is to build one of the most reliable academic repositories for school education.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 4 – Question Lifecycle & Workflow

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

A question does not simply appear in the Question Bank.

Every question follows a controlled academic workflow before it becomes available to students.

This ensures consistency, quality, accountability, and traceability throughout its lifecycle.

---

# 2. Lifecycle Philosophy

Every question has a life.

It is:

Created

↓

Reviewed

↓

Approved

↓

Published

↓

Used

↓

Improved

↓

Archived

No shortcuts are allowed.

---

# 3. Complete Lifecycle

```text
Create

↓

Draft

↓

Pending Review

↓

Review Passed?

↓

No → Return to Draft

↓

Yes

↓

Approved

↓

Ready for Publishing

↓

Published

↓

Used in Tests

↓

Reported (Optional)

↓

Review Required?

↓

Yes

↓

Create New Version

↓

Publish New Version

↓

Archive Old Version (if required)

↓

Continue
```

---

# 4. Stage 1 – Draft

A newly created question always starts as Draft.

Characteristics:

* Visible only to Admin
* Editable
* Cannot appear in tests
* No student access

---

# 5. Stage 2 – Pending Review

The question is ready for academic review.

Checklist:

* Correct syllabus
* Grammar checked
* Options verified
* Explanation verified
* Duplicate check completed

---

# 6. Stage 3 – Approved

Approval means:

The question satisfies all academic and technical standards.

Still not visible to students.

Approval and publication are separate actions.

---

# 7. Stage 4 – Published

Only Published questions:

* Appear in tests
* Affect rankings
* Affect analytics
* Are available through the Test Engine

This is the only student-visible state.

---

# 8. Stage 5 – Active Usage

While published, the question records future statistics such as:

* Number of attempts
* Accuracy
* Average solving time
* Student reports

These metrics help improve quality over time.

---

# 9. Stage 6 – Revision

If a published question requires correction:

Do not overwrite it.

Instead:

Create a new version.

Maintain complete history.

Students always receive the latest published version.

---

# 10. Stage 7 – Archive

Questions are archived when:

* Outdated
* Incorrect
* Replaced
* Out of syllabus

Archived questions:

* Stay in the database
* Preserve history
* Never appear in tests

---

# 11. Allowed State Changes

Draft → Pending Review

Pending Review → Draft

Pending Review → Approved

Approved → Published

Published → Archived

Published → New Version

Archived → Restored (Admin Only)

No other transitions are allowed.

---

# 12. Business Rules

* Every question starts as Draft.
* Only Approved questions may be Published.
* Published questions cannot bypass review.
* Archived questions never appear in tests.
* Every revision creates a new version.

---

# 13. Audit Trail

Every lifecycle action stores:

* User
* Date
* Previous Status
* New Status
* Reason

Nothing changes without being recorded.

---

# 14. Success Criteria

The lifecycle is successful if:

* Every question has a complete history.
* No unpublished question reaches students.
* Every revision is traceable.
* Quality remains consistent.

---

# CTO Decisions

AQMS-009

Questions always begin as Draft.

Approved.

AQMS-010

Approval and Publication are separate actions.

Approved.

AQMS-011

Every revision creates a new version.

Approved.

---

# CTO Statement

A controlled workflow protects academic quality.

Students should only see questions that have passed every academic and technical review.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 5 – Question Validation & Quality Assurance

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

Quality is the foundation of the Board Ranking Question Bank.

Every published question must pass a standardized validation process before becoming available to students.

The objective is simple:

**Every published question should be academically reliable.**

---

# 2. Validation Philosophy

Validation is not optional.

Every question must pass:

Technical Validation

*

Academic Validation

*

Quality Validation

Only then can it be published.

---

# 3. Technical Validation

The system automatically verifies:

✓ UUID exists

✓ Question Code exists

✓ Subject selected

✓ Chapter selected

✓ Topic selected

✓ Difficulty selected

✓ Four options provided

✓ One correct answer selected

✓ Explanation provided

Missing information blocks publication.

---

# 4. Academic Validation

Admin verifies:

* Correct syllabus
* Correct concept
* Correct answer
* Appropriate difficulty
* Correct chapter mapping
* Correct topic mapping

---

# 5. Language Validation

Questions must:

* Use proper grammar
* Use correct spelling
* Avoid ambiguity
* Be easy to understand
* Match the student's class level

---

# 6. Option Validation

Options should:

* Be realistic
* Be similar in length where practical
* Avoid obvious clues
* Avoid duplicate options
* Avoid "All of the Above" and "None of the Above" in Release 1 unless explicitly approved by academic guidelines

Only one correct option is allowed.

---

# 7. Explanation Validation

Explanation must:

* Match the correct answer
* Teach the concept
* Be simple
* Be factually correct

A question without an explanation cannot be published.

---

# 8. Duplicate Validation

Every new question is checked against:

* Exact text
* Similar wording
* Same concept
* Same options

Potential duplicates require manual review.

---

# 9. Difficulty Validation

Difficulty should reflect the expected effort for the target class.

Levels:

Easy

Medium

Hard

Difficulty should be based on educational standards, not personal opinion.

---

# 10. Quality Checklist

Before publication:

✓ Academic Accuracy

✓ Grammar

✓ Explanation

✓ Duplicate Check

✓ Metadata Complete

✓ Status Approved

✓ Review Completed

Only after all checks pass can the question be published.

---

# 11. Quality Score (Internal)

Every question receives an internal Quality Score.

Example:

0–100

Factors include:

* Academic correctness
* Clarity
* Explanation quality
* Validation status
* Student feedback (future)

The score is visible only to Admins.

Students never see it.

---

# 12. Future Quality Improvements

Future versions may automatically evaluate:

* Average accuracy
* Average solving time
* High report rate
* AI quality suggestions

These insights help identify questions needing improvement.

---

# 13. Business Rules

* Every published question must pass validation.
* Every published question must include an explanation.
* Every question receives a Quality Score.
* Validation failures block publication.

---

# 14. Success Criteria

The Quality Assurance System succeeds if:

* Incorrect questions never reach students.
* Duplicate questions are minimized.
* Explanations remain consistent.
* Academic standards remain high.

---

# CTO Decisions

AQMS-012

Validation is mandatory before publication.

Approved.

AQMS-013

Explanations are compulsory.

Approved.

AQMS-014

Every question receives an internal Quality Score.

Approved.

AQMS-015

Failed validation prevents publication.

Approved.

---

# CTO Statement

The quality of Board Ranking is determined not by how many questions it contains, but by how trustworthy those questions are.

Every published question should be something we are confident recommending to millions of students.

Quality is our competitive advantage, and the Question Bank should reflect that commitment every single day.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 6 – Duplicate Detection Engine

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

Duplicate questions reduce the quality of the Question Bank.

They waste storage, create repetitive tests, distort analytics, and reduce the learning experience.

The Duplicate Detection Engine ensures that every new question is checked before publication.

---

# 2. Objective

The system should:

* Prevent exact duplicates.
* Detect similar questions.
* Prevent repeated concepts within the same chapter where unnecessary.
* Assist admins in making final decisions.

The system recommends; the Admin approves.

---

# 3. Types of Duplicates

## Type 1 – Exact Duplicate

Example:

"What is the SI unit of Force?"

appears twice.

Result:

Publication blocked.

---

## Type 2 – Near Duplicate

Example:

"What is the SI unit of Force?"

"What is the SI unit used for measuring force?"

Same concept.

Different wording.

Result:

Admin review required.

---

## Type 3 – Option Duplicate

Question wording changes, but options and answer remain almost identical.

Result:

Admin warning.

---

## Type 4 – Concept Duplicate

Different wording.

Different options.

Testing exactly the same learning objective.

Result:

Suggested for review.

Sometimes acceptable if difficulty differs.

---

# 4. Duplicate Detection Workflow

```text
Admin Creates Question

↓

Save Draft

↓

Duplicate Engine Runs

↓

Exact Match?

↓

Yes

↓

Reject Save

↓

No

↓

Similarity Check

↓

High Similarity?

↓

Yes

↓

Admin Review Required

↓

No

↓

Continue Review Process
```

---

# 5. Detection Levels

The system classifies similarity as:

0–40%

Low Similarity

Safe

---

41–70%

Medium Similarity

Admin Warning

---

71–100%

High Similarity

Review Required

---

# 6. Fields Compared

The engine compares:

* Question statement
* Options
* Correct answer
* Chapter
* Topic
* Keywords
* Tags

Future versions may compare explanations and learning objectives.

---

# 7. Admin Experience

When a duplicate is detected:

The system displays:

Possible Duplicate Found

Similarity:

83%

Similar Questions:

10M0101

10M0108

10M0114

Admin may:

* Open existing question.
* Cancel creation.
* Continue with justification.

---

# 8. Business Rules

* Exact duplicates cannot be published.
* Near duplicates require review.
* Duplicate checks occur before approval.
* Published questions are also checked during updates.

---

# 9. Future AI Enhancement

Future AI may detect:

* Semantic similarity
* Concept overlap
* Learning objective overlap
* Difficulty overlap

Release 1 uses rule-based detection.

---

# 10. Success Criteria

The engine succeeds if:

* Exact duplicates are eliminated.
* Near duplicates are significantly reduced.
* Question quality improves over time.
* Test diversity increases.

---

# CTO Decisions

AQMS-016

Exact duplicate questions are blocked.

Approved.

AQMS-017

Near duplicates require manual review.

Approved.

AQMS-018

Admins always make the final publishing decision.

Approved.

---

# CTO Statement

A high-quality Question Bank is not measured by the number of questions it contains, but by the uniqueness and educational value of those questions.

The Duplicate Detection Engine protects the academic integrity of Board Ranking by ensuring students practice diverse and meaningful questions rather than repeated content.
# Chapter 11 – Academic Question Management System (AQMS)

## Phase 7 – Search, Filtering & Indexing System

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

As the Question Bank grows, administrators must be able to locate any question within seconds.

The Search, Filtering & Indexing System provides fast, accurate, and scalable access to the Question Bank.

The goal is to make question management efficient regardless of database size.

---

# 2. Objectives

The system should allow Admins to:

* Search instantly.
* Apply multiple filters.
* Find archived questions.
* Locate duplicates.
* Review question history.
* Build tests quickly.

---

# 3. Global Search

The search bar supports:

* Question Reference Code
* UUID
* Keywords
* Subject
* Chapter
* Topic

Example:

Search:

Arithmetic Progression

↓

Returns all related questions.

---

# 4. Advanced Filters

Admins can filter by:

* Class
* Subject
* Chapter
* Topic
* Difficulty
* Question Type
* Status
* Tags
* Source
* Created By
* Date Created
* Date Updated

Multiple filters can be combined.

---

# 5. Sorting

Results may be sorted by:

Newest First

Oldest First

Question Code

Difficulty

Most Used

Least Used

Alphabetical

Recently Updated

---

# 6. Saved Filters

Admins can save frequently used searches.

Example:

Class 10

↓

Mathematics

↓

Medium

↓

Published

↓

NCERT

One click restores the filter.

---

# 7. Search Performance

Target response time:

Under 500 milliseconds for typical searches.

Performance should remain stable as the Question Bank grows.

---

# 8. Indexing Strategy

Frequently searched fields should be indexed.

Examples:

* Question Code
* UUID
* Subject
* Chapter
* Topic
* Status
* Difficulty

This improves search speed.

---

# 9. Search Results

Each result displays:

* Question Code
* Question Preview
* Subject
* Chapter
* Difficulty
* Status
* Version
* Last Updated

Admins can open the full question from the results.

---

# 10. Bulk Actions

After filtering, Admins may:

* Publish
* Archive
* Export
* Change Tags
* Review
* Assign

Bulk actions reduce repetitive work.

---

# 11. Future Smart Search

Future versions may support:

Natural language search.

Example:

"Show hard Class 10 Mathematics questions about Arithmetic Progression."

The system interprets the request automatically.

---

# 12. Business Rules

* Search never exposes student data.
* Archived questions remain searchable.
* Drafts are visible only to Admins.
* Search results respect user permissions.

---

# 13. Success Criteria

The Search System succeeds if:

* Questions are easy to locate.
* Search remains fast at scale.
* Admin productivity improves.
* Test creation becomes faster.

---

# CTO Decisions

AQMS-019

All searchable academic fields must be indexed.

Approved.

AQMS-020

Archived questions remain searchable but cannot be selected for student tests.

Approved.

AQMS-021

Advanced filters support multiple simultaneous criteria.

Approved.

---

# CTO Statement

A Question Bank is only valuable if its contents can be found quickly.

The Search, Filtering & Indexing System transforms a large collection of questions into a usable academic resource, enabling administrators to maintain quality and build assessments efficiently even as the platform grows to millions of questions.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 8 – Bulk Upload & Import Pipeline

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

Creating thousands of questions manually is not practical.

The Bulk Upload & Import Pipeline allows administrators to upload large volumes of questions efficiently while maintaining academic quality and data integrity.

Every imported question must pass the same validation process as manually created questions.

---

# 2. Objectives

The Bulk Upload System should:

* Support thousands of questions per upload.
* Validate every question.
* Detect duplicates.
* Generate Question Reference Codes.
* Prevent incomplete imports.
* Produce detailed import reports.

---

# 3. Supported File Formats

Release 1

Supported:

* CSV (.csv)
* Excel (.xlsx)

Not Supported:

* PDF
* Word
* Images

Future support may include API-based imports.

---

# 4. Upload Workflow

```text
Admin

↓

Upload CSV/Excel

↓

Template Validation

↓

Data Validation

↓

Duplicate Detection

↓

Question Validation

↓

Generate Preview

↓

Admin Approval

↓

Import Questions

↓

Generate Report
```

---

# 5. Standard Import Template

Every uploaded row represents one question.

Required columns:

* Class
* Subject
* Chapter
* Topic
* Question
* Option A
* Option B
* Option C
* Option D
* Correct Answer
* Explanation
* Difficulty
* Tags (Optional)
* Source

The template must remain standardized.

---

# 6. Validation During Import

Each row is validated for:

* Missing values
* Invalid class
* Invalid subject
* Invalid chapter
* Invalid difficulty
* Missing explanation
* Duplicate Question Code
* Duplicate content
* Invalid answer option

Invalid rows are rejected.

---

# 7. Preview Before Import

Before saving, the system displays:

* Total rows
* Valid questions
* Invalid questions
* Duplicate questions
* Warnings

Nothing is saved until the Admin confirms.

---

# 8. Partial Import Policy

Approved Policy:

Valid rows are imported.

Invalid rows are skipped.

A detailed error report is generated.

This prevents one bad row from blocking hundreds of valid questions.

---

# 9. Import Report

After completion, generate:

* Total Uploaded
* Successfully Imported
* Failed
* Duplicates
* Warnings

The report should be downloadable.

---

# 10. Automatic Processing

For every valid question:

* Generate UUID
* Generate Question Reference Code
* Assign Version v1
* Set Status = Draft
* Record Created By
* Record Created Date

Imported questions still require the normal review workflow before publication.

---

# 11. Security

Only Admins can perform bulk imports.

Maximum upload size should be configurable.

Every upload action is logged.

---

# 12. Future Expansion

Future versions may support:

* Image imports
* AI-assisted imports
* NCERT package imports
* API integrations
* OCR-based question extraction

---

# 13. Business Rules

* Import never bypasses validation.
* Import never bypasses duplicate detection.
* Import never publishes questions automatically.
* Every imported question begins as Draft.

---

# CTO Decisions

AQMS-022

CSV and Excel are the official import formats.

Approved.

AQMS-023

Bulk imported questions always begin as Draft.

Approved.

AQMS-024

Partial imports are allowed.

Approved.

AQMS-025

Every import generates an audit report.

Approved.

---

# CTO Statement

Bulk uploading is a productivity feature—not a shortcut.

Every imported question must meet the same academic standards as a manually created question.

Quality must always take priority over speed.
# Chapter 11 – Academic Question Management System (AQMS)

## Phase 9 – Database Schema & Relationships

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

The AQMS database is designed to support millions of questions while maintaining speed, consistency, and scalability.

Normalization, proper relationships, and indexing are essential for long-term growth.

---

# 2. Design Principles

The database must be:

* Scalable
* Normalized
* Secure
* Extensible
* Easy to maintain

Every table should have one clear responsibility.

---

# 3. Core AQMS Tables

Release 1 includes:

* questions
* question_versions
* question_tags
* subjects
* chapters
* topics
* question_reports

Additional tables may be introduced as the platform grows.

---

# 4. Questions Table

Stores the current published version of every question.

Key fields include:

* UUID
* Question Reference Code
* Class
* Subject ID
* Chapter ID
* Topic ID
* Current Version
* Status
* Difficulty
* Source
* Created By
* Created Date

The table should contain only the latest active version.

---

# 5. Question Versions Table

Purpose:

Maintain complete edit history.

Stores:

* Question UUID
* Version Number
* Question Statement
* Options
* Correct Answer
* Explanation
* Changed By
* Change Reason
* Created Date

Every meaningful academic edit creates a new version.

---

# 6. Subjects Table

Stores:

* Subject ID
* Subject Code
* Subject Name
* Status

Example:

M

Mathematics

---

# 7. Chapters Table

Stores:

* Chapter ID
* Subject ID
* Chapter Number
* Chapter Name

Each chapter belongs to one subject.

---

# 8. Topics Table

Stores:

* Topic ID
* Chapter ID
* Topic Name

Each topic belongs to one chapter.

---

# 9. Question Tags Table

Stores reusable tags.

Examples:

* NCERT
* Previous Year
* Formula Based
* Revision
* High Weightage

A junction table should associate questions with multiple tags.

---

# 10. Question Reports Table

Stores reports submitted by students.

Fields include:

* Report ID
* Question UUID
* Student ID
* Report Type
* Description
* Status
* Reviewed By
* Reviewed Date

Reports never modify questions automatically.

---

# 11. Relationships

```text
Subject

↓

Chapter

↓

Topic

↓

Question

↓

Question Version

↓

Question Reports
```

This hierarchy keeps academic data organized.

---

# 12. Indexing Strategy

Indexes should be created for:

* UUID
* Question Reference Code
* Subject ID
* Chapter ID
* Topic ID
* Difficulty
* Status
* Current Version

Indexes improve search and test generation performance.

---

# 13. Constraints

Examples:

* UUID must be unique.
* Question Reference Code must be unique.
* One published version per question.
* Foreign keys enforce academic relationships.
* Null values are restricted for required fields.

---

# 14. Scalability

The schema should support:

* Millions of questions
* Millions of versions
* Millions of reports

without requiring structural redesign.

---

# 15. Future Expansion

The schema reserves space for:

* Images
* Diagrams
* AI metadata
* Learning objectives
* Bloom's Taxonomy
* Regional languages
* Multimedia assets

These additions should require new tables or columns rather than rebuilding existing structures.

---

# 16. Business Rules

* Every question belongs to one topic in Release 1.
* Every topic belongs to one chapter.
* Every chapter belongs to one subject.
* Question versions are immutable.
* Reports never overwrite question data.

---

# CTO Decisions

AQMS-026

Version history is stored in a dedicated table.

Approved.

AQMS-027

Academic hierarchy uses normalized relationships.

Approved.

AQMS-028

Question reports are stored separately from question content.

Approved.

AQMS-029

Question Reference Code remains unique across the platform.

Approved.

---

# CTO Statement

The database is the backbone of the Academic Question Management System.

A well-designed schema ensures that future features—analytics, adaptive learning, AI recommendations, and multilingual support—can be added without rebuilding the foundation.

Our goal is not just to store questions but to create an academic knowledge infrastructure capable of supporting millions of students over many years.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 10 – API Architecture & Backend Services

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

The API layer is the communication bridge between the frontend, admin panel, and the backend.

The frontend never communicates directly with the database.

Every request must pass through secure backend services.

---

# 2. Architecture

```text
Frontend

↓

API Routes

↓

Controllers

↓

Services

↓

Repositories

↓

Prisma ORM

↓

PostgreSQL
```

Each layer has one responsibility.

---

# 3. Folder Structure

```text
src/

routes/

controllers/

services/

repositories/

middlewares/

validators/

models/

utils/
```

---

# 4. Core APIs

Question APIs

POST /questions

GET /questions

GET /questions/:id

PATCH /questions/:id

DELETE /questions/archive

---

Review APIs

POST /questions/:id/review

POST /questions/:id/approve

POST /questions/:id/publish

POST /questions/:id/archive

---

Search APIs

GET /questions/search

GET /questions/filter

---

Bulk Upload APIs

POST /questions/import

GET /questions/import/status

GET /questions/import/report

---

Reports

POST /questions/:id/report

GET /questions/reports

PATCH /questions/reports/:id

---

# 5. Service Layer

QuestionService

Responsible for:

* Create Question
* Update Question
* Archive Question

---

ValidationService

Responsible for:

* Academic Validation
* Technical Validation

---

DuplicateService

Responsible for:

* Exact Duplicate
* Similar Question Detection

---

SearchService

Responsible for:

* Search
* Filters
* Sorting

---

ImportService

Responsible for:

* CSV Parsing
* Excel Parsing
* Import Validation

---

# 6. Repository Layer

Repository handles database communication only.

Example:

QuestionRepository

Methods:

create()

update()

findByUUID()

findByQuestionCode()

archive()

search()

---

# 7. Middleware

JWT Authentication

↓

Role Verification

↓

Rate Limiting

↓

Input Validation

↓

Controller

---

# 8. Response Format

Every API returns a standard response.

Success

* success
* message
* data

Error

* success
* errorCode
* message

Consistent responses simplify frontend development.

---

# 9. Business Rules

* Only Admin can create questions.
* Students cannot access Question APIs.
* Every write request is logged.
* Validation occurs before saving.

---

# CTO Decisions

AQMS-030

Backend follows Route → Controller → Service → Repository architecture.

Approved.

AQMS-031

Every API uses standard response formats.

Approved.

AQMS-032

All Question APIs require JWT authentication and Admin authorization.

Approved.

---

# CTO Statement

The API layer should remain thin and predictable.

Business logic belongs in services, data access belongs in repositories, and controllers should simply coordinate requests and responses.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 11 – Security & Access Control

**Project:** Board Ranking

**Version:** 1.0

---

# 1. Introduction

The Question Bank is the most valuable intellectual property of Board Ranking.

Security is therefore a core requirement, not an optional feature.

---

# 2. Access Matrix

| Action                   |         Student        | Admin |
| ------------------------ | :--------------------: | :---: |
| View Published Questions | ✓ (through tests only) |   ✓   |
| Create Question          |            ✗           |   ✓   |
| Edit Question            |            ✗           |   ✓   |
| Publish Question         |            ✗           |   ✓   |
| Archive Question         |            ✗           |   ✓   |
| Bulk Upload              |            ✗           |   ✓   |
| View Reports             |            ✗           |   ✓   |

---

# 3. Authentication

Every admin request requires:

* Valid JWT
* Active Session
* Admin Role

Requests without valid authentication are rejected.

---

# 4. Authorization

Backend verifies:

* Role
* Permission
* Resource Access

Frontend permissions are never trusted.

---

# 5. Audit Logging

Every sensitive action records:

* User ID
* Action
* Timestamp
* IP Address
* Device (Future)
* Previous Value
* New Value

---

# 6. Rate Limiting

Sensitive APIs:

* Question Creation
* Bulk Upload
* Search

should use rate limiting to prevent abuse.

---

# 7. Data Protection

* UUIDs never exposed publicly.
* Database credentials stored in environment variables.
* Secrets never committed to Git.

---

# 8. Security Rules

* Admin sessions expire after inactivity.
* Every API validates input.
* SQL Injection prevented through Prisma.
* XSS prevented by input sanitization.
* CSRF protection enabled where applicable.

---

# 9. Future Enhancements

* Multi-Factor Authentication
* Admin Activity Dashboard
* IP Allowlisting
* Security Notifications

---

# CTO Decisions

AQMS-033

All administrative actions are audited.

Approved.

AQMS-034

Question APIs require Admin role.

Approved.

AQMS-035

Sensitive configuration is stored outside source code.

Approved.

---

# CTO Statement

Protecting the Question Bank means protecting the future of Board Ranking.

Every security layer exists to preserve academic integrity and maintain student trust.
# Chapter 11 – Academic Question Management System (AQMS)

## Phase 12 – Future Architecture & AI Readiness

**Project:** Board Ranking

**Version:** 1.0

---

# 1. Introduction

Although Release 1 intentionally avoids AI, AQMS should be designed so future intelligent features can be added without redesigning the database or backend.

The architecture must be future-ready.

---

# 2. Future Question Types

Supported later:

* Multiple Correct Answers
* Fill in the Blanks
* Assertion–Reason
* Match the Following
* Case Study
* Numerical
* Diagram-Based Questions

---

# 3. Multimedia Support

Future versions may attach:

* Images
* Diagrams
* Audio
* Video
* Mathematical Equations

Questions remain compatible with existing IDs.

---

# 4. AI Opportunities

Future AI may provide:

* Difficulty estimation
* Explanation generation
* Duplicate detection
* Grammar correction
* Academic quality scoring
* Adaptive recommendations

---

# 5. Learning Intelligence

Future analytics may calculate:

* Average Accuracy
* Average Solving Time
* Question Difficulty Index
* Topic Mastery
* Concept Weakness
* Learning Trends

---

# 6. Curriculum Expansion

Architecture supports future:

* ICSE
* State Boards
* International Boards

using the curriculum versioning strategy.

---

# 7. Teacher Contributions

Future workflow:

Teacher

↓

Draft Question

↓

Validation

↓

Admin Review

↓

Publish

Teacher submissions never bypass admin approval.

---

# 8. AI Safety Principles

AI should:

* Assist Admins
* Never replace academic review
* Never publish automatically
* Always allow human approval

Humans remain responsible for academic quality.

---

# 9. Scalability Targets

Architecture should comfortably support:

* Millions of questions
* Millions of students
* Millions of test attempts
* Multiple curricula
* Multiple languages

without redesigning AQMS.

---

# 10. Long-Term Vision

AQMS evolves from a Question Bank into an Academic Knowledge Platform.

Every question becomes:

* Searchable
* Versioned
* Measurable
* Traceable
* Continuously improving

---

# CTO Decisions

AQMS-036

Release 1 contains no AI-driven publishing.

Approved.

AQMS-037

AI is an assistant, not a decision-maker.

Approved.

AQMS-038

Architecture must support future expansion without breaking existing data.

Approved.

---

# CTO Statement

Technology changes rapidly, but academic quality must remain constant.

Our responsibility is to build a foundation that welcomes innovation without sacrificing trust.

The Academic Question Management System is designed not only for today's MVP but also for the educational platform Board Ranking will become over the next decade.
# Chapter 11 – Academic Question Management System (AQMS)

## Phase 13 – Test Selection & Question Allocation Engine

**Version:** 1.0

---

# 1. Introduction

The Test Selection Engine is responsible for selecting the right questions for every test.

The objective is not random selection.

The objective is intelligent, balanced, and fair selection.

---

# 2. Objectives

The engine must:

* Build balanced tests.
* Avoid repeated questions.
* Maintain difficulty balance.
* Respect syllabus coverage.
* Support future adaptive learning.

---

# 3. Selection Flow

```text
Student Starts Test

↓

Test Engine

↓

Read Test Configuration

↓

Filter Eligible Questions

↓

Remove Archived Questions

↓

Remove Duplicate Questions

↓

Apply Difficulty Rules

↓

Randomize Questions

↓

Generate Final Test

↓

Lock Question Set

↓

Send to Student
```

---

# 4. Selection Filters

Questions are selected using:

* Curriculum
* Class
* Subject
* Chapter
* Topic
* Difficulty
* Status
* Version

---

# 5. Difficulty Distribution

Example (20 Questions)

Easy

40%

Medium

40%

Hard

20%

This distribution should be configurable by Admin.

---

# 6. Randomization

Randomization occurs:

* Question order
* Option order

Correct answers remain unchanged.

---

# 7. Repeat Prevention

Release 1 should avoid showing recently attempted questions whenever sufficient alternatives exist.

Future versions may use stronger personalization based on student history.

---

# 8. Business Rules

* Draft questions never appear.
* Archived questions never appear.
* Only Published questions are eligible.
* Question versions remain consistent throughout a test.

---

# CTO Decision AQMS-039

Only Published questions may participate in automatic test generation.

Approved.

---

# CTO Statement

The Test Selection Engine ensures every assessment is fair, balanced, and academically meaningful.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 14 – Question Performance Analytics Engine

**Version:** 1.0

---

# 1. Introduction

Every question teaches us something.

The platform should continuously learn from student performance.

---

# 2. Purpose

Measure question quality.

Identify weak questions.

Improve the Question Bank.

---

# 3. Metrics Collected

Every question stores:

* Total Attempts
* Correct Attempts
* Wrong Attempts
* Average Accuracy
* Average Time Taken
* Report Count
* Last Used Date

---

# 4. Internal Dashboard

Admins can view:

* Most difficult questions
* Easiest questions
* Frequently reported questions
* Never-used questions
* Most attempted questions

---

# 5. Difficulty Drift

If a question marked "Hard" is answered correctly by 98% of students over a meaningful sample size, it should be flagged for review.

Likewise, if an "Easy" question consistently performs poorly, it should also be reviewed.

The system recommends; the Admin decides.

---

# 6. Quality Alerts

Automatic alerts:

* High report rate
* Very low accuracy
* Very high accuracy
* Missing explanation
* Outdated syllabus

---

# 7. Business Rules

Analytics never modify questions automatically.

Every recommendation requires Admin approval.

---

# CTO Decision AQMS-040

Question analytics are advisory, not automatic.

Approved.

---

# CTO Statement

The best Question Bank is one that improves after every student attempts a question.
# Chapter 11 – Academic Question Management System (AQMS)

## Phase 15 – Governance, Backup & Disaster Recovery

**Version:** 1.0

---

# 1. Introduction

The Question Bank is the company's intellectual property.

Protecting it is a business requirement.

---

# 2. Backup Strategy

Production Database

↓

Daily Incremental Backup

↓

Weekly Full Backup

↓

Monthly Archive

Backups should be encrypted and tested periodically through restore drills.

---

# 3. Disaster Recovery

If a failure occurs:

Detect

↓

Isolate

↓

Restore Backup

↓

Verify Data Integrity

↓

Resume Service

---

# 4. Audit Logs

Every important action records:

* User
* Timestamp
* Action
* Previous Value
* New Value

Audit records should be retained according to the company's data retention policy.

---

# 5. Recovery Goals

Recovery Time Objective (RTO)

Target: Less than 4 hours for MVP.

Recovery Point Objective (RPO)

Target: No more than 24 hours of data loss for MVP.

These targets can be improved as the platform grows.

---

# 6. Business Rules

* Backups are encrypted.
* Backup access is restricted.
* Archived questions remain recoverable.
* Recovery procedures are documented and tested.

---

# CTO Decision AQMS-041

The Question Bank must always be recoverable.

Approved.

---

# CTO Statement

Questions can take years to build.

Recovery must take hours—not years.

# Chapter 11 – Academic Question Management System (AQMS)

## Phase 16 – Question Lifecycle Automation

**Version:** 1.0

---

# 1. Introduction

Automation reduces repetitive administrative work while maintaining academic quality.

Release 1 uses simple, rule-based automation.

---

# 2. Automated Actions

The system automatically:

* Generates UUIDs.
* Generates Question Reference Codes.
* Assigns Version v1.
* Sets Status to Draft.
* Records Created Date.
* Records Updated Date.
* Records Audit Logs.

---

# 3. Automatic Validation

Whenever a question is saved:

The platform automatically checks:

* Required fields
* Question format
* Duplicate risk
* Academic mapping
* Explanation availability

Validation failures prevent progression to the next workflow stage.

---

# 4. Scheduled Jobs

Background jobs may:

* Refresh search indexes.
* Recalculate analytics.
* Generate backup reports.
* Detect stale drafts.
* Notify admins about pending reviews.

---

# 5. Draft Monitoring

Questions remaining in Draft status for extended periods (for example, more than 30 days) may be highlighted for administrative review.

The system does not delete stale drafts automatically.

---

# 6. Notification Triggers

Admins receive notifications when:

* Duplicate detected
* Review pending
* Import completed
* Validation failed
* Question reported

---

# 7. Business Rules

Automation never:

* Publishes questions.
* Changes correct answers.
* Archives questions automatically.
* Replaces Admin decisions.

Automation assists.

Humans approve.

---

# CTO Decisions

AQMS-042

Automation supports administrators but never replaces academic review.

Approved.

AQMS-043

Publishing always requires explicit Admin approval.

Approved.

---

# CTO Statement

The purpose of automation is to remove repetitive work—not academic responsibility.

Board Ranking will automate processes while ensuring that final educational decisions always remain under human control.
