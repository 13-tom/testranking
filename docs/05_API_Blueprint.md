# Board Ranking API Blueprint v1.0

Version: 1.0

Status: Active

Owner: Backend Team

Purpose:

This document defines every API used in Board Ranking.

Every API must follow this document.

No API should be created without documentation.

---

# API Standards

Base URL

/api/v1/

Example

/api/v1/auth/login

---

Authentication

Public APIs

No JWT Required

Protected APIs

JWT Required

Admin APIs

Admin JWT Required

---

Standard Response

Success

{
    success: true,
    message: "",
    data: {}
}

Error

{
    success: false,
    message: "",
    errors: []
}

---

Status Codes

200 OK

201 Created

400 Bad Request

401 Unauthorized

403 Forbidden

404 Not Found

409 Conflict

500 Internal Server Error

---

# MODULE 1

Authentication

Purpose

Register and Login Users.

Routes

POST

/auth/send-otp

Public

Purpose

Send OTP

Uses

Users Table

Validation

Valid Indian Mobile Number

Rate Limit

5 Requests / Hour

---

POST

/auth/verify-otp

Public

Purpose

Verify OTP

Business Logic

Create User if not exists.

Generate JWT.

Return User.

---

GET

/auth/me

Protected

Purpose

Return Logged In User

Uses

Users

StudentProfile

---

POST

/auth/logout

Protected

Purpose

Logout User

---

# MODULE 2

Student Profile

GET

/profile

Protected

Purpose

Fetch Student Profile

Uses

Users

StudentProfile

---

PUT

/profile

Protected

Purpose

Update Student Profile

Validation

Name

Class

School

Business Logic

Update Profile Completion.

Award Study Points if profile milestone reached.

---

GET

/profile/progress

Protected

Purpose

Return Profile Completion

---

# MODULE 3

Dashboard

GET

/dashboard

Protected

Purpose

Load Dashboard

Tables

Users

StudentProfile

Leaderboard

RecentAttempts

Response

Name

Study Points

Study Level

Study Streak

Today's Goal

Recent Tests

Recommended Test

Rank

---

# MODULE 4

Subjects

GET

/subjects

Public

Return All Subjects

---

GET

/subjects/:id

Public

Subject Details

---

# MODULE 5

Chapters

GET

/chapters

Public

Return Chapters

Filter

Class

Subject

---

# MODULE 6

Tests

GET

/tests

Public

Return Tests

Filters

Class

Subject

Chapter

Difficulty

---

GET

/tests/:id

Protected

Purpose

Return Test Information

---

POST

/tests/start

Protected

Purpose

Start Test

Business Logic

Create TestAttempt

Return Questions

---

POST

/tests/submit

Protected

Purpose

Submit Test

Business Logic

Check Answers

Calculate Marks

Calculate Percentage

Calculate Accuracy

Calculate Study Points

Update Level

Update Streak

Update Rank

Store Attempt

Generate Analytics

Return Result

This API NEVER trusts frontend score.

---

# MODULE 7

Leaderboard

GET

/leaderboard

Protected

Filters

School

District

State

India

Friends

Weekly

Monthly

All Time

---

# MODULE 8

Achievements

GET

/achievements

Protected

Return Earned Achievements

---

GET

/achievements/available

Protected

Return Locked Achievements

---

# MODULE 9

Notifications

GET

/notifications

Protected

PUT

/notifications/read

Protected

---

# MODULE 10

Subscription

GET

/subscription

Protected

POST

/subscription/purchase

Protected

---

# MODULE 11

Payments

POST

/payment/create-order

Protected

POST

/payment/webhook

Internal

POST

/payment/verify

Protected

---

# MODULE 12

Admin

/Admin APIs

Require

Admin Role

Examples

/users

/tests

/questions

/dashboard

/reports

---

# Validation Rules

Validate

Phone

OTP

JWT

UUID

Arrays

Objects

Required Fields

IDs

Never Trust Frontend

---

# Security Rules

JWT Required

Role Validation

Ownership Validation

Input Validation

Rate Limiting

Helmet

CORS

No Sensitive Data Exposure

Audit Logs

---

# Rate Limits

OTP

5/hour

Login

10/hour

Profile Update

30/hour

Test Submit

Unlimited

Admin APIs

100/hour

---

# Logging

Log

Login

Logout

Profile Update

Test Submit

Payment

Errors

Never Log

Password

OTP

JWT

---

# Error Messages

User Friendly

Examples

"Invalid OTP"

"Test Already Submitted"

"Unauthorized"

"Session Expired"

Never Return

Stack Trace

SQL Errors

Internal Details

---

# API Versioning

Always

/api/v1/

Future

/api/v2/

Never Break Existing APIs

---

# Golden Rules

Every API

Must Validate Input

Must Authenticate

Must Authorize

Must Return Standard Response

Must Log Important Events

Must Handle Errors

Must Follow Business Logic

Must Remain Backward Compatible
