# Board Ranking Engineering Guide v1.0

Version: 1.0
Status: Active
Owner: Engineering Team
Project: Board Ranking

---

# 1. Purpose

This document defines how Board Ranking should be engineered.

Every AI assistant, developer, designer, and future engineer working on this project must follow this guide.

This document is focused on engineering, architecture, security, scalability, maintainability, and code quality.

The Product Bible explains WHAT we build.

The Engineering Guide explains HOW we build it.

---

# 2. Engineering Philosophy

Our goals are:

• Production Ready
• Clean Architecture
• Secure by Default
• Scalable
• Easy to Maintain
• Easy to Extend

Never build quick fixes.

Never write temporary code.

Every feature should be capable of evolving without rewriting the entire project.

---

# 3. Technology Stack

Frontend

• Next.js (App Router)
• React
• TypeScript
• Tailwind CSS
• shadcn/ui
• Framer Motion
• TanStack Query
• Zustand

Backend

• Node.js
• Express.js
• TypeScript

Database

• PostgreSQL

ORM

• Prisma

Authentication

• Phone OTP
• Google OAuth
• JWT
• Role Based Authorization

Storage

• Cloudflare R2

Notifications

• Firebase Cloud Messaging

Payments

• Razorpay

Deployment

Frontend
• Vercel

Backend
• Railway

Database
• Neon PostgreSQL

---

# 4. Folder Structure

Backend

src/

routes/

controllers/

services/

middleware/

validators/

utils/

config/

prisma/

types/

constants/

Frontend

app/

components/

features/

hooks/

services/

store/

types/

lib/

assets/

styles/

Do not change this architecture without approval.

---

# 5. Architecture Principles

Follow Layered Architecture.

Client

↓

Routes

↓

Controllers

↓

Services

↓

Prisma

↓

Database

Rules

Routes

Responsible for:

• URL Mapping

Controllers

Responsible for:

• Request
• Response

Services

Responsible for:

• Business Logic

Prisma

Responsible for:

• Database Operations

Database

Responsible for:

• Data Storage

Never skip layers.

---

# 6. Coding Standards

Always use TypeScript.

Never use JavaScript.

Use meaningful variable names.

Use async/await.

Avoid nested logic.

Keep functions small.

Write reusable code.

Use interfaces where appropriate.

Avoid duplicated code.

Follow SOLID principles.

---

# 7. Naming Conventions

Files

camelCase

Variables

camelCase

Components

PascalCase

Database Tables

PascalCase

Columns

camelCase

API Routes

kebab-case

Constants

UPPER_CASE

Environment Variables

UPPER_CASE

---

# 8. Backend Rules

Business logic belongs only inside Services.

Controllers should never calculate:

• Marks
• XP
• Rank
• Level
• Streak

Controllers only:

Receive Request

↓

Call Service

↓

Return Response

---

# 9. Frontend Rules

Frontend is responsible for:

Displaying data

Forms

Animations

Navigation

State

Never calculate

XP

Marks

Ranks

Levels

Always request data from backend.

---

# 10. Database Standards

Normalize data.

Use Foreign Keys.

Avoid duplicate data.

Index searchable columns.

Prefer IDs over storing repeated names.

Example

Store

schoolId

NOT

schoolName

---

# 11. Authentication

Supported

Phone OTP

Google Login

JWT

Protected APIs require authentication.

Guests should never access protected APIs.

---

# 12. Authorization

Role Based Access

Student

Teacher

Parent

Admin

Every request must verify user role.

Never trust frontend roles.

---

# 13. Validation

Validate every request.

Phone

OTP

Email

Numbers

Arrays

Objects

IDs

Reject invalid input immediately.

---

# 14. Security Standards

Never trust frontend.

Always validate backend.

Never expose secrets.

Never expose stack traces.

Use Helmet.

Use CORS.

Use Rate Limiting.

Use Input Validation.

Sanitize all input.

Hash passwords using bcrypt if password authentication is introduced.

JWT Secret must remain inside environment variables.

Never commit .env files.

---

# 15. VAPT Standards

Prevent

SQL Injection

XSS

CSRF (where applicable)

Broken Authentication

Broken Access Control

Sensitive Data Exposure

IDOR

Directory Traversal

Command Injection

File Upload Attacks

Rate Limit Abuse

If AI finds a possible vulnerability,

Explain it.

Then provide the secure implementation.

---

# 16. Business Logic Rules

Backend calculates:

Marks

Percentages

XP

Study Points

Study Level

Ranks

Achievements

Badges

Streaks

Recommendations

Frontend never calculates these values.

---

# 17. Logging

Log

Login

Logout

OTP Verification

Payment

Errors

Suspicious Activities

Never log

Passwords

OTP

JWT

Personal secrets

---

# 18. Error Handling

Return consistent JSON.

Example

{
  success: false,
  message: "Invalid OTP"
}

Never expose internal errors.

Log detailed errors only on server.

---

# 19. Performance

Optimize queries.

Avoid N+1 queries.

Paginate large datasets.

Cache when necessary.

Lazy load heavy components.

Optimize images.

Prepare architecture for scaling.

Keep implementation simple until scaling is actually needed.

---

# 20. API Standards

REST APIs.

Examples

POST /auth/login

GET /dashboard

POST /attempt/start

POST /attempt/submit

GET /leaderboard

Use proper HTTP status codes.

200

201

400

401

403

404

500

Return consistent JSON structure.

---

# 21. Git Workflow

main

Production

develop

Development

feature/registration

feature/dashboard

feature/test-engine

Every feature should have its own branch.

Merge only after review.

---

# 22. Testing Strategy

Every feature should be tested.

Backend

Service Tests

API Tests

Frontend

Component Tests

Flow Tests

Before merge verify

Success

Failure

Edge Cases

---

# 23. AI Development Workflow

For every feature

Step 1

Understand Product Requirement

↓

Step 2

Design Database

↓

Step 3

Design APIs

↓

Step 4

Explain Backend Flow

↓

Step 5

Explain Business Logic

↓

Step 6

Review Security

↓

Step 7

Generate Code

↓

Step 8

Review Code

↓

Step 9

Test

↓

Step 10

Merge

Never skip these steps.

---

# 24. Code Review Checklist

Before finishing any task verify

✓ Architecture follows guide

✓ Folder structure correct

✓ No duplicate code

✓ Controllers thin

✓ Business logic inside Services

✓ Validation complete

✓ Security reviewed

✓ API documented

✓ Database normalized

✓ Production ready

---

# 25. Definition of Done

A feature is NOT complete until:

✓ UI completed

✓ Backend completed

✓ Database updated

✓ Validation completed

✓ Security reviewed

✓ APIs tested

✓ Errors handled

✓ Edge cases handled

✓ Documentation updated

✓ Code reviewed

---

# 26. AI Rules

Do not assume requirements.

Do not redesign existing screens.

Do not create additional features.

Do not rename APIs without approval.

Always explain architectural decisions before implementation.

Always ask questions if requirements are unclear.

Think like a Senior Software Engineer.

---

# 27. Non-Negotiable Engineering Rules

1. Production-ready code only.

2. Security before convenience.

3. Backend owns business logic.

4. Frontend only displays data.

5. Never hardcode secrets.

6. One feature at a time.

7. Every API validated.

8. Every protected API authenticated.

9. Every feature documented.

10. Build today without blocking tomorrow's scalability.

---

# 28. CTO Review Process

Before delivering any feature, perform this self-review:

Architecture
✓ Is it clean and modular?

Security
✓ Are authentication and authorization correct?
✓ Are common vulnerabilities mitigated?

Business Logic
✓ Is all business logic in the service layer?

Database
✓ Is the schema normalized?
✓ Are foreign keys and indexes appropriate?

API
✓ Are endpoints RESTful and responses consistent?

Performance
✓ Are there unnecessary queries or loops?

Maintainability
✓ Can another developer understand and extend this feature easily?

If any answer is "No", fix it before considering the feature complete.