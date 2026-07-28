# Chapter 6 – MVP Scope

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

The purpose of the Minimum Viable Product (MVP) is not to launch every feature.

The purpose is to launch the **smallest possible version** of Board Ranking that delivers real value to students.

The MVP must solve one problem exceptionally well:

> **Help students practice, measure progress, and improve consistently.**

Every feature included in Release 1 supports this objective.

Everything else is intentionally postponed.

---

# 2. MVP Objective

Release 1 should allow a student to:

* Register within minutes.
* Practice chapter-wise and subject-wise tests.
* Receive instant results.
* Understand strengths and weaknesses.
* Earn Study Points.
* Track progress over time.
* Stay motivated to return.

If these goals are achieved, the MVP is successful.

---

# 3. Technology Stack

Frontend

* Next.js
* TypeScript
* Tailwind CSS
* shadcn/ui
* React Query
* Zustand

Backend

* Node.js
* Express.js
* Prisma ORM

Database

* PostgreSQL

Authentication

* Mobile Number + OTP
* JWT Authentication

Deployment

* Vercel (Frontend)
* Railway/Render (Backend)
* PostgreSQL Cloud Database

---

# 4. User Roles

Release 1 supports only two roles.

## Student

The primary user.

## Admin

Platform administrator.

No other roles exist in MVP.

---

# 5. Authentication Module

Included

✅ Mobile Number Login

✅ OTP Verification

✅ JWT Token

✅ Secure Logout

✅ Session Validation

Not Included

❌ Google Login

❌ Email Login

❌ Password Login

❌ Social Login

---

# 6. Registration Module

Included

* Name
* Mobile Number
* Class
* School Name
* State
* District

Optional Profile Completion

* Profile Photo
* Gender

Students receive Study Points for completing profile sections.

---

# 7. Student Dashboard

Included

Dashboard contains:

* Welcome Card
* Current Study Points
* Current Study Level
* Tests Attempted
* Recent Results
* Continue Practice
* Recommended Test
* Latest Announcement

Simple.

Fast.

Clean.

---

# 8. Question Engine

Release 1 supports only:

✅ Multiple Choice Questions (MCQ)

Question features:

* Four Options
* One Correct Answer
* Explanation
* Difficulty
* Chapter
* Subject
* Class
* Tags

Every question has:

Internal UUID

*

Human-readable Question Reference Number

Duplicate detection is enabled.

Questions are archived instead of deleted.

---

# 9. Test Engine

Supported Tests

✅ Chapter Test

✅ Subject Test

Retake Options

Practice Again

* Same questions
* Does not affect ranking

New Challenge

* Different questions
* Updates ranking and analytics

Question order is randomized.

---

# 10. Result Module

After submission students receive:

* Score
* Percentage
* Correct Answers
* Wrong Answers
* Time Taken
* Accuracy
* Explanation for every question

Results are calculated entirely by the backend.

---

# 11. Analytics Module

Included

Performance Summary

Strong Chapters

Weak Chapters

Accuracy

Average Score

Study History

Recommended Practice

No AI analysis in Release 1.

Recommendations are rule-based.

---

# 12. Ranking Module

Supported Rankings

Overall Platform Rank

Class Rank

Future ranking levels such as School, District, State, and India-wide segmented rankings can be introduced after sufficient user data is available.

Practice Mode does not affect rankings.

Only ranked attempts update rankings.

---

# 13. Study Points System

Students earn Study Points for:

Registration

Profile Completion

Completing Tests

Correct Answers

Achievements

Study Points unlock:

Study Levels

Badges

Progress

This system motivates continuous learning.

---

# 14. Admin Panel

Included

Student Management

Question Management

Question Archive

Duplicate Detection

Bulk Upload Questions

Test Management

Reports

Basic Analytics

System Settings

Subscription Management

Admins control the entire Question Bank.

---

# 15. Database

Core Tables

Users

StudentProfile

Questions

Tests

TestAttempts

Results

StudyPointsHistory

Subscriptions

SystemSettings

Only the tables required for MVP are included.

---

# 16. Security

Release 1 includes:

OTP Authentication

JWT Authorization

Input Validation

Rate Limiting

Secure APIs

Server-side Evaluation

Duplicate Question Detection

Basic Logging

Security is built into the platform from the beginning.

---

# 17. Documentation

Required documentation:

Product Bible

Engineering Guide

Design System

Database Blueprint

API Blueprint

PRD

Development begins only after documentation is complete.

---

# 18. Features NOT Included in MVP

The following features are intentionally postponed.

Teacher Dashboard

Parent Dashboard

Friend System

Friend Battles

School Battles

Live Tests

AI Question Generator

AI Answer Evaluation

Community

Chat

Discussion Forums

Video Courses

Offline Test Kits

Book Store

Referral System

Gamified Events

Leaderboards by School

School Management

Multi-board Support

Regional Languages

Google Login

---

# 19. Success Criteria

Release 1 is considered successful if students can:

Register

↓

Login

↓

Complete Profile

↓

Take Test

↓

Receive Results

↓

View Analytics

↓

Earn Study Points

↓

Return Tomorrow

Everything in MVP supports this journey.

---

# 20. Out of Scope

Release 1 is **not** trying to become:

* A coaching platform.
* A video learning platform.
* A social network.
* A marketplace.
* A school ERP.
* An AI tutoring system.

These may become future products, but they are not part of the MVP.

---

# 21. Product Priorities

Priority 1

Reliable Testing

Priority 2

Accurate Evaluation

Priority 3

Meaningful Analytics

Priority 4

Student Retention

Priority 5

Scalable Architecture

Every engineering decision should follow this order.

---

# 22. Final MVP Definition

Board Ranking Release 1 is a secure, student-first academic practice platform that enables students to register quickly, practice high-quality MCQ tests, receive instant performance analysis, earn Study Points, and continuously improve through structured learning.

The MVP deliberately avoids unnecessary complexity and focuses entirely on delivering an excellent testing experience.

---

# CTO Statement

The hardest part of building a startup is not deciding **what to build**.

It is deciding **what not to build**.

Every feature removed from the MVP increases the chances of launching sooner, collecting real student feedback, and building the right product.

Board Ranking will grow one strong foundation at a time—not by adding every idea at once, but by perfecting the essentials first.
