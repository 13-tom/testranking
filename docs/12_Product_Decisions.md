# 12_Product_Decisions.md

**Project:** Board Ranking

**Document Version:** 1.0

**Status:** Living Document

---

# Introduction

This document records all approved product, engineering, and architectural decisions made during the development of Board Ranking.

Every major decision should include:

* Decision ID
* Category
* Decision
* Status
* Reason
* Alternatives Considered
* Date
* Future Review (if applicable)

This document is updated whenever an important decision is approved.

---

# Decision Format

Every decision follows this template.

```text
Decision ID:

Category:

Decision:

Status:

Reason:

Alternatives Considered:

Future Review:

Approved By:

Version:
```

---

# Product Decisions

---

## BR-001

**Category**

Product

**Decision**

Board Ranking will initially support only **CBSE Class 9, 10, 11, and 12**.

**Status**

Approved

**Reason**

Focus on a clearly defined audience and launch faster.

**Alternatives Considered**

Support all education boards from Day One.

**Why Rejected**

Would significantly increase syllabus complexity.

---

## BR-002

**Category**

Authentication

**Decision**

Use **Mobile Number + OTP** authentication.

**Status**

Approved

**Reason**

Simple onboarding for Indian students.

**Alternatives Considered**

Email login

Google Login

Password login

**Future Review**

Google Login may be introduced in a later release.

---

## BR-003

**Category**

User Roles

**Decision**

Release 1 supports only:

* Student
* Admin

**Status**

Approved

**Reason**

Keep MVP focused and reduce development complexity.

---

## BR-004

**Category**

Teacher Module

**Decision**

Teacher Dashboard is postponed.

**Status**

Approved

**Reason**

Question quality will be managed entirely by Admins during the MVP.

---

## BR-005

**Category**

Parent Module

**Decision**

Parent Dashboard is postponed.

**Status**

Approved

**Reason**

Primary focus is student learning.

---

## BR-006

**Category**

Question System

**Decision**

Release 1 supports only **MCQ questions**.

**Status**

Approved

**Reason**

Fast development, simpler evaluation, and reliable analytics.

**Future Review**

Support additional question types in future releases.

---

## BR-007

**Category**

Question Ownership

**Decision**

Only Admins can create, edit, publish, or archive questions.

**Status**

Approved

---

## BR-008

**Category**

Question IDs

**Decision**

Every question has:

* Internal UUID
* Human-readable Question Reference Code

Example:

10M0101

**Status**

Approved

---

## BR-009

**Category**

Question Deletion

**Decision**

Questions are never permanently deleted.

They are archived.

**Status**

Approved

**Reason**

Maintain academic history and auditability.

---

## BR-010

**Category**

Duplicate Detection

**Decision**

The Question Bank must prevent duplicate and near-duplicate questions.

**Status**

Approved

---

## BR-011

**Category**

Retake Policy

**Decision**

Students can retake tests using two modes.

Practice Again

* Same questions
* Does not affect ranking

New Challenge

* Different questions
* Updates rankings and analytics

**Status**

Approved

---

## BR-012

**Category**

Backend

**Decision**

All business logic executes on the backend.

**Status**

Approved

Examples:

* Study Points
* Rankings
* Test Evaluation
* Recommendations

Frontend only displays information.

---

## BR-013

**Category**

Database

**Decision**

PostgreSQL will be used as the primary database.

Prisma ORM will manage database access.

**Status**

Approved

---

## BR-014

**Category**

Security

**Decision**

Frontend never communicates directly with the database.

All communication passes through the backend API.

**Status**

Approved

---

## BR-015

**Category**

Profile System

**Decision**

Students complete profiles progressively.

Study Points are awarded gradually.

**Status**

Approved

---

## BR-016

**Category**

Gamification

**Decision**

Use **Study Points (SP)** instead of traditional gaming XP.

**Status**

Approved

**Reason**

Creates an educational identity while maintaining motivation.

---

## BR-017

**Category**

Recommendations

**Decision**

Recommendations are rule-based in Release 1.

No AI is used for recommendations.

**Status**

Approved

---

## BR-018

**Category**

Rankings

**Decision**

Release 1 includes:

* Overall Platform Rank
* Class Rank

School, District, and State rankings will be introduced after sufficient user growth.

**Status**

Approved

---

## BR-019

**Category**

Question Lifecycle

**Decision**

Every question follows:

Draft

↓

Review

↓

Approved

↓

Published

↓

Archived

**Status**

Approved

---

## BR-020

**Category**

Documentation

**Decision**

Development begins only after documentation is approved.

Required documentation includes:

* Product Bible
* Engineering Guide
* Design System
* Database Blueprint
* API Blueprint
* PRD

**Status**

Approved

---

## BR-021

**Category**

Architecture

**Decision**

The platform will be built using modular engines.

Examples:

* Academic Question Management System
* Test Engine
* Evaluation Engine
* Analytics Engine
* Ranking Engine
* Study Points Engine

**Status**

Approved

---

## BR-022

**Category**

Security

**Decision**

Backend is the single source of truth.

No score, ranking, Study Point, or evaluation calculation may occur on the frontend.

**Status**

Approved

---

## BR-023

**Category**

Question Bank

**Decision**

The Question Bank is considered the most valuable intellectual property of Board Ranking.

**Status**

Approved

---

## BR-024

**Category**

MVP Strategy

**Decision**

Launch a small, polished product instead of a feature-heavy platform.

**Status**

Approved

---

## BR-025

**Category**

Product Philosophy

**Decision**

Every feature must answer one question:

> "Does this help students learn better?"

If the answer is no, the feature should not be built.

**Status**

Approved

---

# Pending Decisions

The following topics are still under discussion and will be finalized later:

* Subscription Plans
* Premium Feature List
* School Partnership Model
* AI Roadmap
* Parent Dashboard
* Teacher Dashboard
* Mobile Application Strategy
* Regional Language Support
* Offline Learning Products

---

# Decision Governance

Every approved decision must:

* Have a unique Decision ID.
* Include a clear business or technical reason.
* Be reviewed before major architectural changes.
* Remain documented for future team members.

No major product or architecture decision should be implemented without first being recorded in this document.

---

# Change Log

| Version | Changes                                                                     |
| ------- | --------------------------------------------------------------------------- |
| 1.0     | Initial set of Board Ranking product and architecture decisions documented. |

---

# CTO Statement

A successful software product is built on good decisions, not just good code.

Developers may change.

Designers may change.

Technology may change.

Artificial Intelligence may change.

But well-documented decisions preserve the vision of the product.

This document is the institutional memory of Board Ranking.

Every important decision should be recorded here before it is implemented, ensuring that the platform grows consistently, scales intelligently, and remains true to its original mission of helping students learn better.

---

**Document Status:** Living Document

**Version:** 1.0

**Last Updated:** To be updated with each approved decision.
