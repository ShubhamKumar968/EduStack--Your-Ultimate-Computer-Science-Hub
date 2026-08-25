# 🎓 EduStack — Your Ultimate Computer Science Hub

> **A full-stack, production-ready web application** built for CS/Engineering students at NIT Patna to access study notes, PYQs, DSA problems, AI-powered tutoring, and premium resources — all in one place.

---

## 📋 Table of Contents

1. [Project Overview](#-project-overview)
2. [Tech Stack](#-tech-stack)
3. [System Architecture](#-system-architecture)
4. [Project Directory Structure](#-project-directory-structure)
5. [Database Design — All Models](#-database-design--all-models)
6. [Authentication System](#-authentication-system)
7. [Role-Based Access Control (RBAC)](#-role-based-access-control-rbac)
8. [API Reference — All Endpoints](#-api-reference--all-endpoints)
9. [Feature Deep-Dives](#-feature-deep-dives)
10. [Security Architecture](#-security-architecture)
11. [Middleware Pipeline](#-middleware-pipeline)
12. [Services Layer](#-services-layer)
13. [Client-Side Architecture](#-client-side-architecture)
14. [Environment Variables](#-environment-variables)
15. [Deployment](#-deployment)
16. [Key Design Decisions & Interview Talking Points](#-key-design-decisions--interview-talking-points)

---

## 🌐 Project Overview

**EduStack** is a **monolithic full-stack web application** with a **separate Python microservice** for AI features. It serves engineering students primarily from NIT Patna with:

- 📚 **Subject-wise resources** — Notes (Google Drive links), PYQs, YouTube playlists, external links
- 📊 **DSA Sheet** — 450+ problems synced live from Google Sheets with company tags, difficulty, GitHub solutions, and video explanations
- 🤖 **AI Hub** — RAG-powered Q&A tutor, PYQ generator, PDF summarizer, PDF quiz generator (powered by Google Gemini)
- 👤 **User system** — Email/password auth, Google OAuth, OTP-based email verification
- 🏆 **Contributor system** — Students apply to become contributors; admin approves/rejects
- 💰 **Premium access** — Razorpay payment gateway for DSA Sheet access
- 🔔 **Notifications** — Admin broadcasts to all users; private notifications per user
- ❤️ **Favourites** — Save subjects or resources
- 📝 **Enrollments** — Track subject enrollments per student

---

## 🛠 Tech Stack

### Backend (Node.js)
| Technology | Version | Purpose |
|---|---|---|
| **Node.js + Express.js** | v4.x | REST API server, static file serving |
| **MongoDB + Mongoose** | v8.x | Primary database (Atlas cloud-hosted) |
| **JSON Web Tokens (JWT)** | v9.x | Stateless auth tokens |
| **bcryptjs** | v2.x | Password hashing (12 salt rounds) |
| **Passport.js** | v0.7 | Google OAuth 2.0 strategy |
| **Nodemailer** | v9.x | Email delivery (OTP, welcome emails) |
| **Cloudinary** | v2.x | Profile picture and subject thumbnail storage |
| **Razorpay** | v2.x | Payment gateway for premium access |
| **Multer** | v2.x | Multipart form data / file upload handling |
| **Helmet** | v7.x | HTTP security headers |
| **express-rate-limit** | v7.x | Brute-force / DDoS rate limiting |
| **express-mongo-sanitize** | v2.x | NoSQL injection prevention |
| **express-validator** | v7.x | Request body validation |
| **Morgan** | v1.x | HTTP request logging |
| **express-session + connect-mongodb-session** | v1.x | Session persistence in MongoDB |
| **cors** | v2.x | Cross-Origin Resource Sharing |
| **dotenv** | v16.x | Environment variable loading |

### AI / ML Microservice (Python)
| Technology | Purpose |
|---|---|
| **FastAPI** | High-performance Python API framework |
| **Uvicorn** | ASGI server for FastAPI |
| **Google Generative AI (Gemini)** | LLM for RAG answers and PYQ generation |
| **pypdf** | PDF text extraction |
| **Pydantic** | Data validation and serialization |

### Frontend
| Technology | Purpose |
|---|---|
| **Vanilla HTML/CSS/JS** | Core UI (no frontend framework) |
| **Tailwind CSS** | Utility-first CSS (via CDN + PostCSS build) |
| **Font Awesome** | Icon library |

### DevOps / Cloud
| Service | Purpose |
|---|---|
| **MongoDB Atlas** | Cloud-hosted database cluster |
| **Cloudinary** | Image CDN (avatars, thumbnails) |
| **Render.com** | Production deployment (both Node.js and Python) |
| **Google Cloud Console** | OAuth 2.0 credentials |

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CLIENT (Browser)                    │
│          Vanilla HTML + CSS + Tailwind + JS          │
│     /client/public/*.html  /client/assets/js/*.js   │
└────────────────────┬────────────────────────────────┘
                     │  HTTP / Cookie-based Auth
                     ▼
┌─────────────────────────────────────────────────────┐
│             NODE.JS EXPRESS SERVER                   │
│                  server/app.js                       │
│                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────┐  │
│  │  Middleware  │  │   Routes     │  │ Static    │  │
│  │  - Helmet    │  │  /api/auth   │  │ Serving   │  │
│  │  - CORS      │  │  /api/users  │  │ /assets   │  │
│  │  - Session   │  │  /api/subs   │  │ /public   │  │
│  │  - Passport  │  │  /api/notif  │  └───────────┘  │
│  │  - Sanitize  │  │  /api/ai     │                  │
│  │  - RateLimit │  │  ...         │                  │
│  └──────────────┘  └──────────────┘                  │
└───────────────┬─────────────────┬───────────────────┘
                │                 │
                ▼                 ▼
┌───────────────────┐   ┌──────────────────────────┐
│   MongoDB Atlas   │   │  External Services        │
│   (Primary DB)    │   │  - Cloudinary (Images)    │
│   10 Collections  │   │  - Nodemailer (Email)     │
└───────────────────┘   │  - Razorpay (Payments)    │
                        │  - Google OAuth           │
                        │  - Google Sheets CSV      │
                        └──────────────────────────┘
                        ┌──────────────────────────┐
                        │  PYTHON FastAPI SERVICE   │
                        │  ml_services/main.py      │
                        │  Port: 8000               │
                        │  - RAG Q&A (Gemini)       │
                        │  - PYQ Generator          │
                        │  - PDF Summarizer         │
                        │  - PDF Quiz Generator     │
                        └──────────────────────────┘
```

**Key Architectural Decisions:**
- The Node.js server serves both the **REST API** (`/api/*`) and the **static HTML files** from the same process/port
- The Python AI service runs on a **different port (8000)** and is proxied through Node.js at `/api/ai/*`
- Frontend is **Vanilla JS** — partials (nav, notification bell) are injected via JavaScript, not server-side rendering

---

## 📁 Project Directory Structure

```
EduStack/
├── client/                         # All frontend files
│   ├── assets/
│   │   ├── css/output.css          # Tailwind compiled CSS
│   │   └── js/
│   │       ├── partials.js         # Nav injection, notification bell, auth guards (1849 lines)
│   │       ├── api.js              # Centralized API fetch helpers
│   │       ├── auth.js             # Login/register form logic
│   │       ├── auth-guard.js       # Client-side page guard
│   │       ├── subjects.js         # Subject list/detail page logic
│   │       ├── dsa-problems.js     # DSA Sheet rendering (480KB)
│   │       ├── dsa-lectures.js     # Lecture tab in DSA Sheet
│   │       ├── favourites.js       # Favourites widget
│   │       └── theme-toggle.js     # Dark/light mode toggle
│   └── public/
│       ├── index.html              # Landing page (64KB)
│       ├── contribute.html         # Contributor hub page
│       ├── ai-hub.html             # AI tools page (42KB)
│       ├── premium-dsa-sheet.html  # DSA Sheet (94KB — premium gated)
│       ├── subject-detail.html     # Subject detail view
│       ├── 404.html                # Custom 404 page
│       ├── parsed_problems.json    # Pre-parsed DSA problems (448KB static fallback)
│       ├── parsed_lectures.json    # Pre-parsed lecture data
│       ├── admin/
│       │   ├── broadcast-notification.html
│       │   └── contributor-requests.html
│       ├── auth/
│       │   ├── login.html, register.html, verify-otp.html
│       │   ├── forgot-password.html, edit-profile.html
│       ├── guest/
│       │   ├── favourite-list.html, enrollments.html
│       └── partials/
│           ├── nav.html            # Navbar HTML (injected by partials.js)
│           └── head.html
│
├── server/                         # All backend files
│   ├── app.js                      # Main Express app (778 lines)
│   ├── server.js                   # Entry point
│   ├── .env                        # Secrets (NOT in Git)
│   ├── .env.example                # Template
│   ├── package.json
│   │
│   ├── config/
│   │   ├── cloudinary.js           # Cloudinary SDK init
│   │   └── razorpay.js             # Razorpay SDK init
│   │
│   ├── models/                     # Mongoose schemas
│   │   ├── user.js, subject.js, resource.js
│   │   ├── notification.js, enrollment.js
│   │   ├── favourite.js, payment.js
│   │   ├── otp.js, contributorRequest.js
│   │
│   ├── controllers/                # Business logic
│   │   ├── authController.js       # Auth (register, login, OTP, OAuth, password reset)
│   │   ├── userController.js       # Profile, avatar, admin user list
│   │   ├── subjectController.js    # Subject CRUD
│   │   ├── resourceController.js   # Resource CRUD
│   │   ├── notificationController.js
│   │   ├── paymentController.js    # Razorpay flow
│   │   ├── enrollmentController.js
│   │   ├── favouriteController.js
│   │   └── contributorRequestController.js
│   │
│   ├── routes/                     # Express routers
│   │   ├── authRoutes.js, userRoutes.js
│   │   ├── subjectRoutes.js, resourceRoutes.js
│   │   ├── notificationRoutes.js, paymentRoutes.js
│   │   ├── enrollmentRoutes.js, favouriteRoutes.js
│   │   ├── contributorRequestRoutes.js
│   │   └── aiRoutes.js             # Proxy to Python ML service
│   │
│   ├── middlewares/
│   │   ├── isAuth.js               # JWT authentication
│   │   ├── requireRole.js          # RBAC
│   │   ├── validateRequest.js      # express-validator error formatter
│   │   └── errorHandler.js         # Global error handler
│   │
│   ├── services/
│   │   ├── otpService.js           # OTP lifecycle
│   │   ├── mailService.js          # Email templates
│   │   └── razorpayService.js      # Razorpay HMAC verification
│   │
│   └── utils/
│       ├── generateToken.js        # JWT sign + cookie attach
│       ├── asyncHandler.js         # try/catch wrapper
│       └── apiResponse.js          # Standardized JSON envelope
│
└── ml_services/                    # Python AI microservice
    ├── main.py                     # FastAPI app (452 lines)
    ├── requirements.txt
    └── Procfile                    # Render deploy config
```

---

## 🗄 Database Design — All Models

### 1. User Model (`models/user.js`)

```
Collection: users
```

| Field | Type | Details |
|---|---|---|
| `firstName` | String | Required, max 50 chars |
| `lastName` | String | Required, max 50 chars |
| `email` | String | Required, unique, lowercase, regex validated |
| `password` | String | **select: false** (never returned by default), bcrypt 12-round hash |
| `googleId` | String | Google OAuth ID — null for local auth. **Indexed** for O(log n) lookup |
| `role` | String | enum: `['user', 'student', 'contributor', 'admin']` — default `'user'` |
| `isVerified` | Boolean | Must be `true` before login. Set by OTP verification |
| `isPremium` | Boolean | Set to `true` after successful Razorpay payment |
| `avatar` | String | Cloudinary URL or `'default-avatar.png'` |
| `phoneNumber` | String | Optional |
| `bio` | String | Max 300 chars |
| `branch` | String | Default `'CSE'` |
| `semester` | Number | 1–8 range |
| `createdAt` / `updatedAt` | Date | Auto from `timestamps: true` |

**Pre-save Hook:** On `save`, if password is modified and not already a bcrypt hash, it's hashed with `bcrypt.genSalt(12)`.

**Instance Method:** `user.comparePassword(candidatePassword)` → `bcrypt.compare()`.

**Virtual:** `fullName` → `${firstName} ${lastName}` — computed, not stored in DB.

---

### 2. Subject Model (`models/subject.js`)

```
Collection: subjects
```

| Field | Type | Details |
|---|---|---|
| `name` | String | Required, unique (e.g., "Data Structures & Algorithms") |
| `code` | String | Required, uppercase (e.g., "DSA", "DBMS") |
| `description` | String | Max 500 chars |
| `thumbnail` | String | Cloudinary URL |
| `semester` | Number | 1–8 |
| `branch` | String | enum: `['CSE','IT','ECE','EEE','MECH','CIVIL','OTHER','All']` |
| `notesLink` | String | Direct Drive link |
| `youtubeLink` | String | YouTube playlist URL |
| `pyqLink` | String | PYQ Drive link |
| `rating` | Number | Default 4.5 |
| `createdBy` | ObjectId | Ref → User (admin) |

---

### 3. Resource Model (`models/resource.js`)

```
Collection: resources
Compound Index: { subject: 1, type: 1 }  ← makes "get all notes for subject X" fast
```

| Field | Type | Details |
|---|---|---|
| `title` | String | Required, max 150 chars |
| `description` | String | Max 500 chars |
| `type` | String | enum: `['note', 'pyq', 'playlist', 'link', 'platform']` |
| `url` | String | Required — external URL (Drive, YouTube, GFG, etc.) |
| `subject` | ObjectId | Required — Ref → Subject |
| `uploadedBy` | ObjectId | Ref → User |
| `isPremium` | Boolean | If true, only premium users see this |
| `views` | Number | Incremented atomically with `$inc` on each access |

> **Important:** No actual files are stored. Everything is a URL. Cloudinary is ONLY used for images (avatars, thumbnails).

---

### 4. Notification Model (`models/notification.js`)

```
Collection: notifications
```

| Field | Type | Details |
|---|---|---|
| `title` | String | Required, max 120 chars |
| `message` | String | Required, max 1000 chars |
| `type` | String | enum: `['announcement', 'alert', 'update', 'system']` |
| `link` | String | Optional URL for "View Details →" action |
| `createdBy` | ObjectId | Ref → User |
| `recipient` | ObjectId | **null = broadcast to ALL. userId = private to that user only** |
| `readBy` | [ObjectId] | Array of user IDs who have read this |

**The critical `recipient` field:**
- `null` → Admin broadcast (shown to all logged-in users)
- `userId` → Private (shown only to that specific user)

This was a **bug fix** — previously all notifications were fetched with `Notification.find()` and no filter, exposing private contributor notifications to all users.

---

### 5. OTP Model (`models/otp.js`)

```
Collection: otps
TTL Index: { createdAt: 1 } → auto-deleted after OTP_EXPIRES_MIN * 60 seconds (default 10 min)
```

| Field | Type | Details |
|---|---|---|
| `email` | String | Required, unique (one active OTP per email) |
| `code` | String | 6-digit numeric string |
| `createdAt` | Date | Used by MongoDB TTL index to auto-expire |

**Design Insight:** Unique index on `email` + `upsert: true` in save = resend OTP automatically updates the existing record and resets TTL. No cron job needed.

---

### 6. Payment Model (`models/payment.js`)

```
Collection: payments
```

| Field | Type | Details |
|---|---|---|
| `user` | ObjectId | Ref → User |
| `razorpayOrderId` | String | Required, unique — created BEFORE payment |
| `razorpayPaymentId` | String | Assigned AFTER payment — null until verified |
| `razorpaySignature` | String | HMAC-SHA256 from Razorpay — stored for audit |
| `amount` | Number | In PAISE (₹5 = 500 paise) |
| `currency` | String | Default `'INR'` |
| `status` | String | enum: `['created', 'paid', 'failed']` |
| `description` | String | `'EduStack Premium Access'` |

---

### 7. Enrollment Model (`models/enrollment.js`)

```
Collection: enrollments
Unique Compound Index: { user: 1, subject: 1 }  ← DB-level duplicate prevention
```

| Field | Type | Details |
|---|---|---|
| `user` | ObjectId | Ref → User |
| `subject` | ObjectId | Ref → Subject |

---

### 8. Favourite Model (`models/favourite.js`)

```
Collection: favourites
```

| Field | Type | Details |
|---|---|---|
| `user` | ObjectId | Ref → User |
| `itemId` | ObjectId | The subject or resource ID |
| `itemType` | String | `'subject'` or `'resource'` |

---

### 9. ContributorRequest Model (`models/contributorRequest.js`)

```
Collection: contributorrequests
Indexes: { user: 1 }, { status: 1 }
```

| Field | Type | Details |
|---|---|---|
| `user` | ObjectId | Ref → User (applicant) |
| `branch` | String | Applicant's branch |
| `semester` | Number | 1–8 |
| `reason` | String | Required, max 1000 chars |
| `status` | String | enum: `['pending', 'approved', 'rejected']` |
| `reviewedBy` | ObjectId | Ref → User (admin who reviewed) |
| `reviewedAt` | Date | When review happened |
| `adminNote` | String | Admin feedback (shown to student) |

---

## 🔐 Authentication System

### Flow 1: Local Auth (Email + Password)

```
REGISTER:
  POST /api/auth/register
  → Validate input (express-validator)
  → Check email not in DB
  → bcrypt.hash(password, 12)
  → User.create({ ..., isVerified: false })
  → otpService.saveAndSendOtp(email)
  → Return 201: "Check your email for OTP"

VERIFY OTP:
  POST /api/auth/verify-otp
  → otpService.verifyOtp(email, otp)
  → User.findOneAndUpdate({ isVerified: true })
  → mailService.sendWelcomeEmail() [fire-and-forget]
  → attachCookieToken(res, user._id)
  → Return JWT in cookie + response body

LOGIN:
  POST /api/auth/login
  → User.findOne({ email }).select('+password')
  → Check isVerified (if not → auto-resend OTP)
  → user.comparePassword(password)
  → attachCookieToken(res, user._id)
  → Return JWT in cookie + user data

LOGOUT:
  POST /api/auth/logout
  → res.cookie('edustack_token', '', { maxAge: 0 })

FORGOT PASSWORD:
  POST /api/auth/forgot-password
  → Always return same message (prevents email enumeration)
  → If user exists: otpService.saveAndSendOtp(email)

RESET PASSWORD:
  POST /api/auth/reset-password
  → otpService.verifyOtp(email, otp)
  → bcrypt.hash(newPassword, 12)
  → user.save()
```

### Flow 2: Google OAuth 2.0

```
GET /auth/google
→ passport.authenticate('google', { scope: ['profile', 'email'] })
→ Redirect to Google consent screen

GET /auth/google/callback
→ Google Strategy runs:
   a. Extract email from Google profile
   b. Check ADMIN_EMAILS env var → assign 'admin' role if match
   c. Try User.findOne({ googleId }) → if found, use it
   d. Try User.findOne({ email }) → link existing local account
   e. Otherwise User.create({ googleId, isVerified: true })
→ attachCookieToken(res, user._id)
→ req.session.user = { ... }
→ res.redirect('/')
```

### JWT Details

- **Payload:** `{ id: userId }` only — role excluded (re-fetched from DB on every request)
- **Secret:** `process.env.JWT_SECRET`
- **Expiry:** `process.env.JWT_EXPIRES_IN` (default `'7d'`)
- **Cookie name:** `edustack_token`
- **Cookie flags:** `httpOnly: true`, `secure: true` (prod), `sameSite: 'none'` (prod) / `'strict'` (dev)

### isAuth Middleware Flow

```
1. Check Authorization header: "Bearer <token>"
2. Fallback: Check cookie req.cookies.edustack_token
3. No token → 401 "Access denied"
4. jwt.verify(token, JWT_SECRET)
5. Invalid/expired → 401 error
6. User.findById(decoded.id).select('-password')
7. Not found → 401 "User not found"
8. !user.isVerified → 403 "Account not verified"
9. req.user = user → next()
```

---

## 👮 Role-Based Access Control (RBAC)

### Roles

| Role | Who | Permissions |
|---|---|---|
| `user` / `student` | Default registrant | Browse subjects, resources, DSA Sheet (free tier) |
| `contributor` | Admin-approved | Same as student + can upload resources |
| `admin` | Set via `ADMIN_EMAILS` | Full access — create subjects, manage everything, approve contributors, broadcast notifications |

### Admin Assignment (Never Hardcoded)

Admin emails come from `process.env.ADMIN_EMAILS` (comma-separated). Checked in 3 places:
1. **Registration** — if email matches → `role = 'admin'`
2. **Login** — if email matches and role isn't admin yet → upgrade
3. **Google OAuth** — same check in Google Strategy callback

### `requireRole` Middleware

```javascript
requireRole('admin')                   // Only admins
requireRole('admin', 'contributor')    // Both roles allowed
```

Reads `req.user.role` (populated by `isAuth`) → if allowed → `next()` → else 403 Forbidden.

---

## 📡 API Reference — All Endpoints

### Auth Routes (`/api/auth`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/register` | Public | Register |
| POST | `/verify-otp` | Public | Verify OTP |
| POST | `/resend-otp` | Public | Resend OTP |
| POST | `/login` | Public | Login |
| POST | `/logout` | Private | Clear cookie |
| POST | `/forgot-password` | Public | Send reset OTP |
| POST | `/verify-forgot-password` | Public | Verify reset OTP |
| POST | `/reset-password` | Public | Set new password |
| GET | `/me` | Private | Get current user |
| GET | `/auth/google` | Public | Initiate Google OAuth |
| GET | `/auth/google/callback` | Public | OAuth callback |

**Rate Limits:**
- Login: 10 req / 15 min / IP | Register: 5 req / 1 hour / IP | OTP: 5 req / 10 min / IP

---

### User Routes (`/api/users`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/profile` | Private | Get own profile |
| PUT | `/profile` | Private | Update name, bio, branch, semester, password |
| PUT | `/avatar` | Private | Upload/replace profile picture |
| GET | `/` | Admin | List all users (paginated) |

---

### Subject Routes (`/api/subjects`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | All subjects (filterable) |
| GET | `/:id` | Public | Single subject |
| POST | `/` | Admin | Create subject |
| PUT | `/:id` | Admin | Update subject |
| DELETE | `/:id` | Admin | Delete subject |

---

### Resource Routes (`/api/resources`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Public | All resources (filterable) |
| GET | `/:id` | Public | Single resource (also increments views) |
| GET | `/subject/:subjectId` | Public | Resources for a subject |
| POST | `/` | Admin | Create resource link |
| PUT | `/:id` | Admin | Update resource |
| DELETE | `/:id` | Admin | Delete resource |

---

### Notification Routes (`/api/notifications`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/` | Private | Get user's notifications (filtered by recipient) |
| PUT | `/read-all` | Private | Mark all as read |
| PUT | `/:id/read` | Private | Mark single as read |
| POST | `/` | Admin | Broadcast notification |
| DELETE | `/:id` | Admin | Delete notification |

**Filter query:**
```javascript
{ $or: [{ recipient: null }, { recipient: userId }] }
```

---

### Contributor Request Routes (`/api/contributor-requests`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Private | Submit application |
| GET | `/my-status` | Private | Check own status |
| GET | `/` | Admin | List all applications |
| PUT | `/:id/approve` | Admin | Approve → role becomes 'contributor' |
| PUT | `/:id/reject` | Admin | Reject with feedback |

---

### Payment Routes (`/api/payments`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/key` | Public | Razorpay public key |
| POST | `/create-order` | Private | Create Razorpay order (₹5) |
| POST | `/verify` | Private | Verify HMAC + grant premium |
| POST | `/simulate` | Private | Test mode — grant premium |
| GET | `/history` | Private | Payment history |

---

### Enrollment Routes (`/api/enrollments`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/:subjectId` | Private | Enroll in subject |
| DELETE | `/:subjectId` | Private | Unenroll |
| GET | `/` | Private | Get enrolled subjects |

---

### Favourite Routes (`/api/favourites`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/` | Private | Add favourite |
| DELETE | `/:itemId` | Private | Remove favourite |
| GET | `/` | Private | Get all favourites |

---

### AI Proxy Routes (`/api/ai`) — Rate: 30 req/10 min/IP

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/ask` | Private | RAG Q&A |
| POST | `/generate-pyq` | Private | Generate PYQs |
| POST | `/pdf/summarize` | Private | PDF → AI summary |
| POST | `/pdf/generate-quiz` | Private | PDF → MCQ quiz |

---

### DSA Sheet Routes (in `app.js`)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/dsa-sheet/live` | Public | Fast: read from disk |
| GET | `/api/dsa-sheet/sync` | Public | Live Google Sheets + 5-min cache |
| GET | `/api/config` | Public | Client-safe config (ML URL) |
| GET | `/api/health` | Public | Health check |

---

## 🔍 Feature Deep-Dives

### 1. Subject & Resource Management

Admin creates a **Subject** → admin attaches **Resources** (URL links only):
- `note` → Google Drive PDF link
- `pyq` → Drive PYQ link
- `playlist` → YouTube playlist
- `link` → GFG, docs, etc.
- `platform` → LeetCode, HackerRank

**Smart subject auto-creation:** If admin provides a subject name (not ObjectId) that doesn't exist, the resource controller auto-creates it to prevent upload failures.

**View counter:** `Resource.findByIdAndUpdate(id, { $inc: { views: 1 } })` — MongoDB's atomic increment, no race conditions.

---

### 2. DSA Sheet — Live Google Sheets Sync

**Problem:** 450+ DSA problems live in a Google Sheet. Changes should reflect on the website within 5 minutes without a manual deploy.

**Solution — Three-Layer Data Strategy:**

```
Layer 1: In-Memory Cache (_dsaSheetCache)
   → Serves requests instantly if cache < 5 minutes old

Layer 2: Google Sheets CSV (Live Fetch)
   → Fetched when cache expires
   → Custom CSV parser (handles quoted fields, CRLF, commas in cells)
   → Merged with existing JSON to preserve manually-added URLs
   → Google's CSV export strips hyperlinks — merge keeps real URLs

Layer 3: Static JSON file (parsed_problems.json on disk)
   → Fallback if Google Sheets fetch fails
   → Updated on every successful sync
```

**Two Endpoints:**
- `/api/dsa-sheet/live` — Read from disk, instant, always available
- `/api/dsa-sheet/sync` — Fetch live, update cache + disk, fall back to disk

**Why custom CSV parser?**
Google Sheets CSV has: quoted multi-line cells, commas inside quoted cells, escaped quotes. The custom `parseCSVText()` handles all this without any external library.

**Company name filtering:**
`isOnlyCompanyNames()` detects when a cell meant for "intuition/hints" accidentally contains company names (data quality issue in the sheet) and replaces with empty string.

---

### 3. Contributor System

**Complete Workflow:**

```
1. Student fills form on contribute.html
2. POST /api/contributor-requests
   → Check not already admin/contributor
   → Check no existing PENDING request
   → ContributorRequest.create({ status: 'pending' })
   → Notification.create({ recipient: admin._id })   ← admin-only
   
3. Admin opens /admin/contributor-requests.html
4. GET /api/contributor-requests (admin only)
   → Lists all applications with pagination, search, filter by status

5a. Admin APPROVES:
    PUT /api/contributor-requests/:id/approve
    → targetUser.role = 'contributor'
    → request.status = 'approved'
    → Notification.create({ recipient: targetUser._id })  ← student only

5b. Admin REJECTS:
    PUT /api/contributor-requests/:id/reject
    → request.status = 'rejected', adminNote = feedback
    → Notification.create({ recipient: targetUser._id })  ← student only
```

**Startup Contributor Sync (on every server start in app.js):**
Finds users with `role = 'contributor'` who lack an approved `ContributorRequest` → downgrades to `'student'` and creates pending request. Prevents manual DB edits from bypassing the approval workflow.

---

### 4. Notification System

| Type | `recipient` | Visible To |
|---|---|---|
| Broadcast (admin announcements) | `null` | All logged-in users |
| New contributor request | `admin._id` | Admin only |
| Request approved | `targetUser._id` | Approved student only |
| Request rejected | `targetUser._id` | Rejected student only |

**Frontend:** Bell icon in nav calls `GET /api/notifications`. Backend filters:
```javascript
{ $or: [{ recipient: null }, { recipient: currentUserId }] }
```

**Read status:** `readBy[]` array stores user IDs. On fetch, `isRead = readBy.includes(currentUserId)`.

---

### 5. Payment & Premium Access (Razorpay)

**Step 1 — Create Order:**
```
Frontend calls POST /api/payments/create-order
→ razorpayService.createOrder(500)   ← 500 paise = ₹5
→ Payment.create({ status: 'created', razorpayOrderId })
→ Return { orderId, amount, keyId }
→ Frontend opens Razorpay checkout popup
```

**Step 2 — Verify Payment:**
```
User pays → Razorpay gives frontend: { orderId, paymentId, signature }
Frontend calls POST /api/payments/verify
→ Build message: "${orderId}|${paymentId}"
→ Compute HMAC-SHA256 with KEY_SECRET
→ crypto.timingSafeEqual(expected, received)  ← timing-attack safe
→ If INVALID: Payment.status = 'failed', return 400
→ If VALID:   Payment.status = 'paid', User.isPremium = true, return 200
```

**Why `crypto.timingSafeEqual()`?**
Normal `===` can be exploited via timing attacks — an attacker measures response times to guess the hash character by character. `timingSafeEqual()` always takes constant time.

---

### 6. DSA Sheet Data Flow (Detailed)

```
Browser loads premium-dsa-sheet.html
        ↓
dsa-problems.js runs
        ↓
fetch('/api/dsa-sheet/live') — reads from disk (fast)
        ↓
Render all 450+ problems in categorized, filterable table
        ↓
Problem click → opens LeetCode/GFG link, GitHub solution, YouTube video
        ↓
"Mark as done" → stored in localStorage (no server call)
        ↓
Background: fetch('/api/dsa-sheet/sync') — refresh from Google Sheets
        ↓
If sync successful → update displayed data
```

---

### 7. AI Hub — ML Microservice

**Request Flow:**
```
Browser → POST /api/ai/ask (with JWT cookie)
    ↓
Node.js: isAuth verifies JWT
    ↓
aiRateLimiter (30 req/10 min)
    ↓
postToMLService('/api/rag/ask', body)  ← HTTP to port 8000
    ↓
Python FastAPI handles request
    ↓
LightRAGStore.retrieve() → finds relevant document chunks by keyword matching
    ↓
Google Gemini API → generates answer with context
    ↓
Response piped back through Node → to browser
```

**4 AI Features:**
1. **RAG Q&A** — keyword retrieval from in-memory CS knowledge base + Gemini answer generation
2. **PYQ Generator** — Gemini generates MCQs + theory questions for subject/topic/difficulty
3. **PDF Summarizer** — `pypdf` extracts text → Gemini summarizes → structured output
4. **PDF Quiz Generator** — same PDF → Gemini generates MCQ quiz with answers + explanations

---

## 🛡 Security Architecture

### Input Sanitization
- `express-mongo-sanitize()` — strips `$` and `.` from body (NoSQL injection prevention)
- `express-validator` rules on all auth endpoints

### HTTP Headers
- `helmet()` — X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, HSTS, etc.

### Rate Limiting
| Endpoint | Limit |
|---|---|
| Login | 10 req / 15 min / IP |
| Register | 5 req / 1 hour / IP |
| OTP endpoints | 5 req / 10 min / IP |
| AI endpoints | 30 req / 10 min / IP |

*(All rate limits skipped in development env)*

### Password Security
- bcrypt with **12 salt rounds** (~300ms per hash)
- `select: false` on schema — never returned by default
- Pre-save hook prevents double-hashing
- Login explicitly uses `.select('+password')`

### JWT Security
- Payload: only `userId` — role excluded
- `httpOnly` cookie — JS cannot access (XSS protection)
- `secure: true` in production (HTTPS only)
- `sameSite: 'none'` in production for OAuth redirects

### Payment Security
- HMAC-SHA256 signature verification
- `crypto.timingSafeEqual()` — timing-attack safe comparison

### Admin Security
- Admin emails in env var only — never in source code
- Role re-fetched from DB on every request (stale token can't grant stale permissions)
- Startup sync downgrades unauthorized contributor roles

### Payload Limits
- `express.json({ limit: '1mb' })` — prevents large-payload DoS
- Multer: 5MB max per file upload

---

## ⚙ Middleware Pipeline

```
Incoming Request
    ↓
1. helmet()           → Security headers
2. cors()             → Origin validation
3. express.urlencoded → Form data parsing
4. express.json()     → JSON body parsing (1MB limit)
5. cookieParser()     → Parse cookies
6. morgan()           → HTTP logging
7. mongoSanitize()    → NoSQL injection prevention
8. session()          → Session middleware (MongoDB store)
9. passport.initialize() + passport.session()
10. res.locals middleware → user, isLoggedIn
    ↓
Static files → /assets, /public
    ↓
API Routes → [rateLimit] → [validator] → [isAuth] → [requireRole] → Controller
    ↓
404 handler
    ↓
Global errorHandler()
```

---

## 🔧 Services Layer

### otpService.js
- `generateOtp()` → `Math.floor(100000 + Math.random() * 900000).toString()` — always 6 digits
- `saveAndSendOtp(email)` → `findOneAndUpdate` with `upsert: true`, resets `createdAt` (TTL restart), sends email
- `verifyOtp(email, code)` → finds, compares, **immediately deletes** on success (one-time use guaranteed)

### mailService.js
Nodemailer with HTML email templates:
- `sendOtpEmail(email, otp)` — OTP email
- `sendWelcomeEmail(email, firstName)` — welcome after verification

### razorpayService.js
- `createOrder(amount, currency)` — Razorpay SDK `orders.create()`
- `verifyPaymentSignature(orderId, paymentId, signature)` — HMAC-SHA256 with `crypto.timingSafeEqual()`

---

## 🖥 Client-Side Architecture

### No Framework — Vanilla JS with Partial Injection

**`partials.js` (1849 lines)** is the frontend engine:
1. Detects page type (guest/admin/user)
2. Calls `GET /api/auth/me` with cookies on every page load
3. If logged in → injects authenticated navbar (notification bell, profile dropdown, admin links)
4. If not → injects public navbar (Login / Join Free)

**Notification Bell:**
- Fetches `GET /api/notifications` on click
- Renders list with read/unread styling
- Badge shows unread count
- "Mark all read" → `PUT /api/notifications/read-all`

**`dsa-problems.js` (480KB):**
- Renders 450+ problems from API
- Filters: category, difficulty, company, search
- "Mark as done" stored in `localStorage`

**`auth-guard.js`:**
- Client-side redirect to login if not authenticated
- Real security enforced server-side; this is UX only

---

## 🌍 Environment Variables

`server/.env`:
```env
# Database
MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/edustack

# JWT
JWT_SECRET=your-long-random-secret-key
JWT_EXPIRES_IN=7d

# Admin Access (comma-separated emails)
ADMIN_EMAILS=admin@example.com,admin2@example.com

# Google OAuth
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Email (Nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your@gmail.com
MAIL_PASS=your-app-password

# Cloudinary
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your-razorpay-secret

# AI Service URL
ML_SERVICE_URL=http://localhost:8000

# Server
NODE_ENV=production
PORT=3000
CORS_ORIGINS=https://your-app.onrender.com
OTP_EXPIRES_MIN=10
```

`ml_services/.env`:
```env
GEMINI_API_KEY=your-gemini-api-key
```

---

## 🚀 Deployment

### Local Development
```bash
# Terminal 1 — Node.js server
cd server
npm install
npm run dev        # nodemon app.js

# Terminal 2 — Python ML service
cd ml_services
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

Server starts at `http://localhost:3000`. Both static files and API served from same origin.

### Production (Render.com)

**Node.js Service:**
- Build: `cd server && npm install`
- Start: `node app.js`
- All env vars set in Render dashboard

**Python Service:**
- `Procfile`: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- Build: `pip install -r requirements.txt`

### Graceful Shutdown
- `SIGTERM` (Render/Docker) + `SIGINT` (Ctrl+C) handled
- `server.close()` → waits for in-flight requests → exits cleanly
- Force exit after 10 seconds if requests don't drain

---

## 💡 Key Design Decisions & Interview Talking Points

### 1. Why JWT in httpOnly cookies instead of localStorage?
`localStorage` is vulnerable to XSS — any injected script steals the token. `httpOnly` cookies cannot be read by JavaScript at all, only sent automatically with requests. This is the industry-standard approach.

### 2. Why re-fetch user from DB on every request instead of storing role in JWT?
If role were in the JWT, a demoted admin would keep admin permissions for 7 days until token expiry. Re-fetching from DB via `isAuth` means role changes take effect instantly.

### 3. Why MongoDB TTL index for OTP instead of a cron job?
MongoDB TTL indexes run as a background DB task every 60 seconds — no external scheduler, no cron setup, no missed cleanups. Auto-expires cleanly with zero application code.

### 4. Why two endpoints for DSA Sheet (live vs sync)?
`/live` serves from disk — instant, zero network overhead, always available. `/sync` hits Google Sheets — slower, can fail, but updates data live. 5-minute in-memory cache means Google Sheets isn't hit on every page load.

### 5. Why proxy AI requests through Node.js instead of calling Python directly from browser?
- **Authentication** — Node.js verifies JWT before forwarding
- **Rate limiting** — applied at Node.js layer
- **Security** — Python service URL never exposed to client
- **Single domain** — all requests go to same origin, no extra CORS complexity

### 6. Why is `recipient` on Notification nullable instead of two separate collections?
Single collection with nullable discriminator = one efficient query:
`{ $or: [{ recipient: null }, { recipient: userId }] }`. Consistent API response format. Simpler codebase. Can add compound index `{ recipient: 1, createdAt: -1 }` for performance.

### 7. Why `crypto.timingSafeEqual()` for Razorpay verification?
Regular `===` leaks timing information — different lengths take different time to compare, potentially revealing expected hash bits. `timingSafeEqual()` always takes constant time regardless of where strings differ.

### 8. Why Vanilla JS instead of React for the frontend?
- No build step needed for frontend changes
- Faster initial page load (no framework bundle ~100KB+)
- Primary content is static/reference material, not a real-time interactive app
- Admin panel is simple enough that a framework would add complexity without value

### 9. Why is `password` field `select: false` in Mongoose?
Defense-in-depth: even if a controller bug accidentally returns the user document, the password hash is excluded from all queries by default. Must explicitly opt-in with `.select('+password')` — accidental exposure is impossible.

### 10. Why is there a startup contributor role sync?
Prevents privilege escalation through direct database edits. If someone manually sets `role = 'contributor'` in MongoDB without an approved ContributorRequest, the startup sync reverts it. Enforces the approval workflow as the only legitimate path to contributor access.

---

## 📊 MongoDB Collections Summary

| Collection | Purpose | Key Indexes |
|---|---|---|
| `users` | User accounts | `email` (unique), `googleId` |
| `subjects` | CS subjects | `name` (unique) |
| `resources` | Learning resource links | `{ subject, type }` compound |
| `notifications` | Broadcast + private notifications | — |
| `enrollments` | User-subject enrollments | `{ user, subject }` unique compound |
| `favourites` | User saved items | — |
| `payments` | Razorpay transactions | `razorpayOrderId` (unique) |
| `otps` | Temporary OTP codes | `email` (unique), TTL on `createdAt` |
| `contributorrequests` | Contributor applications | `user`, `status` |
| `sessions` | OAuth/session storage | Auto-managed by connect-mongodb-session |

---

*Built with ❤️ by Shubham Kumar — NIT Patna*
