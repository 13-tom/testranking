# Chapter 10 – Student Dashboard System

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

The Student Dashboard is the heart of Board Ranking.

Every student enters the dashboard immediately after logging in.

Its purpose is not to display everything.

Its purpose is to help students quickly understand:

* Where they are
* What they should do next
* How they are improving

The dashboard should feel clean, motivating, and distraction-free.

---

# 2. Dashboard Philosophy

The dashboard answers five questions:

1. Welcome back.
2. How am I performing?
3. What should I practice today?
4. How much have I improved?
5. What's my next goal?

If a widget doesn't answer one of these questions, it should not be on the dashboard.

---

# 3. Dashboard Layout

```
--------------------------------------------------------

Header

--------------------------------------------------------

Sidebar

|

Main Dashboard

|

Quick Information Panel

--------------------------------------------------------
```

The layout should remain consistent throughout the application.

---

# 4. Header

The header contains:

* Board Ranking Logo
* Search Bar
* Notifications
* Student Name
* Study Points
* Study Level
* Profile Avatar

Header remains fixed while scrolling.

---

# 5. Left Sidebar

Navigation

Dashboard

Mock Tests

Results

Analytics

Rankings

Subscription

Profile

Settings

Logout

Future features are intentionally hidden.

---

# 6. Welcome Card

The first widget.

Displays:

Good Morning, Digvijay!

Welcome back.

Ready for today's practice?

Below this:

Study Level

Study Points

Current Streak

Profile Completion

---

# 7. Continue Learning Card

If the student has an unfinished activity:

Display:

Continue Previous Test

Otherwise:

Recommend today's practice.

One primary CTA only.

---

# 8. Recommended Practice

Backend decides recommendation.

Examples:

Practice Mathematics Chapter 5

Science Chapter 3

Revision Test

Recommendation is based on:

* Weak chapters
* Recent performance
* Unattempted chapters

No AI in MVP.

Rule-based recommendations only.

---

# 9. Study Progress Widget

Shows:

Tests Attempted

Average Accuracy

Study Points

Study Level

Completion Percentage

Quick visual cards.

---

# 10. Recent Test Results

Display last five tests.

Each card contains:

Test Name

Date

Score

Accuracy

Button:

View Result

---

# 11. Performance Snapshot

Quick overview.

Shows:

Strongest Subject

Weakest Subject

Best Score

Lowest Score

Average Accuracy

No graphs on dashboard.

Graphs belong inside Analytics.

---

# 12. Rankings Widget

Shows:

Overall Rank

Class Rank

Small "View Full Rankings" button.

Future ranking categories remain hidden until implemented.

---

# 13. Achievements Widget

Displays latest unlocked achievements.

Examples:

Profile Completed

First Test

100 Questions Solved

Level Up

Students can open the complete achievements page.

---

# 14. Announcements

Displays:

Platform Updates

New Tests

Maintenance

Exam Notifications

Only admins can publish announcements.

---

# 15. Subscription Card

Displays:

Current Plan

Renewal Date

Upgrade Button

Free users see:

Upgrade to Premium.

Premium users see:

Manage Subscription.

---

# 16. Dashboard Loading

While data loads:

Display skeleton loaders.

Never show empty white screens.

Dashboard should feel responsive.

---

# 17. Dashboard APIs

Dashboard requires:

GET /dashboard

GET /profile

GET /recent-tests

GET /recommendation

GET /study-points

GET /rank

Frontend combines responses into one dashboard.

---

# 18. Backend Workflow

```text
Student Login

↓

JWT Verified

↓

Dashboard API

↓

Read User

↓

Read Student Profile

↓

Read Recent Tests

↓

Read Rankings

↓

Read Study Points

↓

Generate Recommendation

↓

Return Dashboard Data

↓

Frontend Displays Dashboard
```

---

# 19. Business Logic

Dashboard does not calculate anything.

Backend calculates:

Study Points

Level

Rank

Recommendation

Statistics

Frontend only displays data.

This keeps the platform secure and consistent.

---

# 20. Dashboard Performance Goals

Dashboard should load in under two seconds.

Only essential data should be loaded initially.

Large reports and analytics should be fetched only when the student opens those pages.

---

# 21. Empty Dashboard

A new student has no history.

Instead of empty widgets, show:

Welcome to Board Ranking!

Take your first test to begin your learning journey.

Button:

Start First Test

The dashboard should motivate, not confuse.

---

# 22. Out of Scope

The dashboard will not include:

Chat

Friend Requests

Community Posts

Teacher Messages

Parent Messages

Live Competitions

School Battles

These belong to future releases.

---

# 23. Dashboard Principles

Every widget must:

Provide useful information.

Require minimal interaction.

Load quickly.

Support the student's learning journey.

Avoid unnecessary visual clutter.

---

# 24. Future Dashboard Enhancements

Future versions may include:

AI Study Assistant

Parent Notifications

Teacher Assignments

Live Competitions

Friend Challenges

School Rankings

These are excluded from Release 1.

---

# 25. CTO Decisions

### Decision 009

Dashboard Design

Minimal and student-focused.

Status:

Approved

---

### Decision 010

Recommendation Engine

Rule-based.

No AI in MVP.

Status:

Approved

---

### Decision 011

Dashboard Calculations

Performed only by the backend.

Frontend never calculates Study Points, Levels, or Rankings.

Status:

Approved

---

### Decision 012

Loading Strategy

Skeleton loaders instead of blank pages.

Status:

Approved

---

# CTO Statement

The dashboard is not a statistics page.

It is the student's home.

Every time a student logs in, the dashboard should answer one question:

**"What should I do next to improve?"**

If the dashboard successfully guides students toward their next learning activity, then it has fulfilled its purpose.
