# Chapter 8 – Authentication & Authorization System

**Project:** Board Ranking

**Document Type:** Product Requirement Document (PRD)

**Version:** 1.0

---

# 1. Introduction

Authentication is the process of verifying who a user is.

Authorization is the process of deciding what that user is allowed to access.

Board Ranking follows a **mobile-first authentication system** using **OTP (One-Time Password)** and **JWT (JSON Web Token)**.

The authentication system must be:

* Secure
* Fast
* Simple
* Scalable

Students should be able to log in within a few seconds.

---

# 2. Authentication Philosophy

The login process should never become a barrier to learning.

A student should be able to access the dashboard in the fewest possible steps while maintaining platform security.

Release 1 focuses on simplicity rather than multiple login methods.

---

# 3. Supported Login Methods

## Included in Release 1

✅ Mobile Number + OTP

---

## Not Included

❌ Google Login

❌ Email Login

❌ Username + Password

❌ Facebook Login

❌ Apple Login

These authentication methods may be added in future releases.

---

# 4. User Roles

Only two user roles exist in the MVP.

### Student

Can access the student portal.

### Admin

Can access the admin portal.

Every request is validated based on the user's role.

---

# 5. Student Login Flow

```text
Student enters Mobile Number

↓

Frontend sends request

POST /auth/send-otp

↓

Backend validates number

↓

Generate OTP

↓

Hash OTP

↓

Store OTP with expiry

↓

Send OTP using SMS Provider

↓

Student enters OTP

↓

Frontend sends

POST /auth/verify-otp

↓

Backend verifies OTP

↓

Create user if first login

OR

Login existing user

↓

Generate JWT

↓

Return Dashboard Data

↓

Student enters Dashboard
```

---

# 6. First-Time Registration Flow

If the mobile number does not exist:

Backend creates:

* User
* Student Profile

Then asks student to complete profile.

Required Fields

* Full Name
* Class
* School Name
* State
* District

Optional Fields

* Gender
* Profile Photo

Study Points are awarded gradually for profile completion.

---

# 7. Returning User Flow

If the mobile number already exists:

Verify OTP

↓

Generate JWT

↓

Return:

* Name
* Study Points
* Study Level
* Dashboard Data
* Recent Tests
* Profile Completion
* Subscription Status

Student is taken directly to the dashboard.

---

# 8. JWT Authentication

After successful login:

Backend generates a JWT.

The JWT contains:

* User ID
* Role
* Session Information

The frontend stores the token securely.

Every protected API request includes:

Authorization

Bearer JWT_TOKEN

The backend validates the token before processing the request.

---

# 9. Protected Routes

Student Routes

/dashboard

/profile

/tests

/results

/analytics

/subscription

Admin Routes

/admin/dashboard

/admin/questions

/admin/tests

/admin/users

/admin/reports

Access is denied if the JWT is invalid or expired.

---

# 10. OTP Rules

OTP Length

6 digits

Expiry

5 minutes

Maximum Attempts

5

Resend Timer

30–60 seconds

One-Time Use

Yes

OTP is invalid immediately after successful verification.

---

# 11. OTP Security

The backend must never store OTP in plain text.

Instead:

Generate OTP

↓

Hash OTP

↓

Store Hash

↓

Compare Hash during verification

Even database access should not expose valid OTPs.

---

# 12. SMS Provider

Release 1 Recommendation

MSG91

Reason:

* High delivery rate in India
* Startup-friendly pricing
* Reliable API
* Easy integration

The backend communicates directly with the SMS provider.

The frontend never communicates with the SMS provider.

---

# 13. Session Management

Each successful login creates a new authenticated session.

The session remains active until:

* Logout
* Token Expiry
* Admin Force Logout

Future versions may support multi-device management.

---

# 14. Logout Flow

Student clicks Logout

↓

Frontend removes JWT

↓

Session ends

↓

Redirect to Login Page

Protected pages become inaccessible.

---

# 15. Authorization

Every request follows this sequence:

Receive Request

↓

Validate JWT

↓

Identify User

↓

Check User Role

↓

Allow or Deny Access

Authorization always happens on the backend.

---

# 16. Security Measures

Release 1 includes:

* OTP Authentication
* JWT Authorization
* HTTPS Only
* Input Validation
* Rate Limiting
* Secure API Design
* Server-side Validation
* Audit Logging

No sensitive operation relies on frontend validation.

---

# 17. Error Handling

Common authentication responses:

Invalid Mobile Number

Invalid OTP

OTP Expired

Too Many Attempts

Unauthorized Access

Forbidden Resource

Session Expired

Messages shown to users should be clear but should not expose internal security details.

---

# 18. Authentication APIs

Core APIs

POST /auth/send-otp

POST /auth/verify-otp

POST /auth/logout

GET /auth/me

These APIs form the authentication module.

---

# 19. Out of Scope

The following are intentionally excluded:

Password Reset

Email Verification

Google OAuth

Social Login

Biometric Login

Face Recognition

Multi-factor Authentication

These may be introduced in future releases if required.

---

# 20. Authentication Architecture

```text
Student

↓

Frontend

↓

Authentication API

↓

Express Backend

↓

OTP Service

↓

PostgreSQL

↓

JWT Generation

↓

Response

↓

Student Dashboard
```

---

# 21. Design Principles

Authentication should be:

* Fast
* Secure
* Reliable
* Easy for students
* Mobile-friendly
* Easy to maintain

The login process should never discourage students from practicing.

---

# CTO Decisions

### Decision 001

Authentication Method

**Mobile Number + OTP**

Status:

Approved

Reason:

Simple, secure, and ideal for the Indian student audience.

---

### Decision 002

Password Authentication

Status:

Rejected (Release 1)

Reason:

OTP-based login reduces password-related issues and simplifies onboarding.

---

### Decision 003

Google Login

Status:

Postponed

Reason:

Not required for MVP. Can be added later without changing the authentication architecture.

---

### Decision 004

User Roles

Release 1 supports only:

* Student
* Admin

Teacher and Parent authentication will be introduced in future releases.

---

# CTO Statement

Authentication is the gateway to the Board Ranking ecosystem.

A student should be able to move from entering a mobile number to practicing a test in less than a minute.

The authentication system must prioritize security without sacrificing simplicity, ensuring that every student can access the platform quickly while protecting their personal information and academic data.
