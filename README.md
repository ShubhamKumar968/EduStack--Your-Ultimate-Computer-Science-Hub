# 🎓 EduStack — Your Ultimate Computer Science Hub

> **A production-ready, polyglot full-stack educational ecosystem** built for Computer Science & Engineering students (piloted at NIT Patna) to unify academic lecture notes, university PYQs, 450+ company-tagged DSA problems, AI-powered document intelligence, and peer-to-peer contributor workflows into a single high-performance platform.

---

## 📋 Master Table of Contents

1. [Project Overview](#-project-overview)
2. [Technology Architecture: Why? How? What Happens If It Fails?](#-technology-architecture-why-how-what-happens-if-it-fails)
   - [2.1 Master Triage Matrix](#21-master-triage-matrix)
   - [2.2 Technology-by-Technology Deep Dive](#22-technology-by-technology-deep-dive)
     - [Brevo / Resend / Nodemailer (Transactional Email & OTP)](#1-brevo--resend--nodemailer-transactional-email--otp)
     - [JSON Web Tokens (JWT) & Dual-Token Rotation](#2-json-web-tokens-jwt--dual-token-rotation)
     - [Google Generative AI (Gemini 1.5 / 2.0 Flash)](#3-google-generative-ai-gemini-15--20-flash)
     - [MongoDB Atlas & Mongoose ODM](#4-mongodb-atlas--mongoose-odm)
     - [Node.js & Express.js (Core API Gateway)](#5-nodejs--expressjs-core-api-gateway)
     - [Python FastAPI & Uvicorn (AI Microservice)](#6-python-fastapi--uvicorn-ai-microservice)
     - [pypdf (Document Text Extraction)](#7-pypdf-document-text-extraction)
     - [Cloudinary & Multer (Ephemeral-Safe Media Engine)](#8-cloudinary--multer-ephemeral-safe-media-engine)
     - [Razorpay & Node Crypto (HMAC Payment Security)](#9-razorpay--node-crypto-hmac-payment-security)
     - [Passport.js & Google OAuth 2.0](#10-passportjs--google-oauth-20)
     - [Bcryptjs (Cryptographic Password Hashing)](#11-bcryptjs-cryptographic-password-hashing)
     - [Helmet & Express Security Suite](#12-helmet--express-security-suite)
     - [Tailwind CSS & Vanilla JavaScript](#13-tailwind-css--vanilla-javascript)
     - [Google Sheets CSV Sync Engine & Multi-Tier Cache](#14-google-sheets-csv-sync-engine--multi-tier-cache)
3. [System Architecture & Polyglot Request Flow](#-system-architecture--polyglot-request-flow)
4. [Project Directory Structure & File Map](#-project-directory-structure--file-map)
5. [Database Design — All 10 Models](#-database-design--all-10-models)
6. [Authentication & Authorization Mechanics](#-authentication--authorization-mechanics)
   - [Dual-Token System & Replay Detection](#dual-token-system--replay-detection)
   - [Stale Role Prevention](#stale-role-prevention)
   - [Google OAuth 2.0 Flow](#google-oauth-20-flow)
7. [Role-Based Access Control (RBAC) & Startup Contributor Sync](#-role-based-access-control-rbac--startup-contributor-sync)
8. [API Reference — All Endpoints & Data Contracts](#-api-reference--all-endpoints--data-contracts)
9. [Feature Deep-Dives & Production Edge-Cases](#-feature-deep-dives--production-edge-cases)
   - [Subject & Resource View Counter ($inc)](#1-subject--resource-view-counter-inc)
   - [DSA Sheet 3-Tier Sync & Custom CSV State-Machine](#2-dsa-sheet-3-tier-sync--custom-csv-state-machine)
   - [Contributor Moderation Pipeline](#3-contributor-moderation-pipeline)
   - [Notification Dispatch: Broadcast vs Private](#4-notification-dispatch-broadcast-vs-private)
   - [Razorpay Verification with Constant-Time HMAC](#5-razorpay-verification-with-constant-time-hmac)
   - [AI Hub: In-Memory RAG & PDF Processing Pipeline](#6-ai-hub-in-memory-rag--pdf-processing-pipeline)
10. [Security Architecture & OWASP Hardening](#-security-architecture--owasp-hardening)
11. [Middleware Execution Pipeline](#-middleware-execution-pipeline)
12. [Services Layer](#-services-layer)
13. [Client-Side Architecture (Vanilla JS Partial Engine)](#-client-side-architecture-vanilla-js-partial-engine)
14. [Environment Variables](#-environment-variables)
15. [Deployment & Graceful Shutdown](#-deployment--graceful-shutdown)
16. [Viva & Technical Interview Code Defense (30 Core Questions)](#-viva--technical-interview-code-defense)

---

## 🌐 Project Overview

**EduStack** is a **polyglot full-stack web application** (Node.js API Gateway + Python AI Microservice) engineered to eliminate academic resource fragmentation for university engineering students:

- 📚 **Curated Curriculum Resources:** Subject-wise categorized lecture notes (Google Drive links), official university PYQs, YouTube playlists, and reference documentation.
- 📊 **Interactive DSA Sheet:** 450+ data structures and algorithms problems synchronized live with Google Sheets, enriched with difficulty metrics, company tags (Google, Amazon, Microsoft), video explanations, and GitHub solutions.
- 🤖 **AI Learning Hub:** Microservice running Google Gemini 1.5/2.0 Flash for concept Q&A tutoring (RAG), dynamic university PYQ mock synthesis, and academic PDF summarization/quiz extraction.
- 👤 **Unified Authentication:** Dual-token JWT architecture (15-min access token in `httpOnly` cookie + 30-day hashed refresh token) plus one-click Google OAuth 2.0 with email-linking.
- 🏆 **Peer Contribution Pipeline:** Students apply to become content contributors; administrators inspect, approve, or reject applications with feedback.
- 💰 **Monetization & Premium Access:** Razorpay integration for premium DSA sheet access, verified using constant-time cryptographic signatures (`crypto.timingSafeEqual`).
- 🔔 **Targeted Notification Engine:** Supports both system-wide administrative broadcasts and private user-targeted notifications.

---

## 🛠 Technology Architecture: Why? How? What Happens If It Fails?

### 2.1 Master Triage Matrix

For every core technology in EduStack, know these three foundational answers:

| Technology | WHY did I use it? (Purpose) | HOW does it work in MY project? (Exact Implementation) | WHAT happens if it fails? (Failure Mode & Recovery) |
|---|---|---|---|
| **Brevo (Sendinblue)** | Transactional email & OTP delivery that bypasses cloud SMTP port blocks. | `mailService.js` dispatches HTTPS POST to `https://api.brevo.com/v3/smtp/email` over Port 443. | Logs rejection, falls back to Resend API, then Nodemailer SMTP. OTP is printed to server logs so developers/evaluators are never blocked. |
| **JSON Web Tokens (JWT)** | Stateless, scalable API authentication with dual-token rotation. | `generateToken.js` issues a 15-min access token (`httpOnly` cookie) and 30-day SHA-256 hashed refresh token. `isAuth.js` validates every private request. | If expired, returns 401 `Session expired`; client calls `/api/auth/refresh` to silently rotate tokens. If tampered, returns 401 `Invalid token`. |
| **Google Gemini API** | AI-driven RAG tutoring, syllabus summarization, and dynamic PYQ mock generation. | Python FastAPI receives query, retrieves document chunks, injects context into Gemini prompt, and returns structured JSON. | Handled via Python `try...except`; returns HTTP 503 with user-friendly error. Node.js gateway passes alert to frontend without crashing the primary server. |
| **MongoDB Atlas** | Primary NoSQL document store with native TTL expiration for OTPs and sessions. | Mongoose connection pool in `app.js`; 10 collections; pre-save hashing hooks; compound unique indexes for race condition prevention. | Mongoose emits `disconnected`; centralized `errorHandler.js` returns 500 DB error. Duplicate key errors (`E11000`) cleanly convert to 409 Conflict. |
| **Node.js + Express** | High-throughput asynchronous API gateway and static asset server. | Single-process event loop running modular routers (`/api/*`), security middleware pipelines, and static delivery for HTML/CSS/JS. | Unhandled errors caught by centralized `errorHandler.js` returning sanitized 500 JSON. Process termination triggers `SIGTERM` graceful drain. |
| **Python FastAPI** | High-performance ASGI microservice for CPU-intensive NLP & PDF parsing. | Runs on port 8000 (proxied by Node at `/api/ai/*`). Uses Pydantic for validation, `LightRAGStore` for retrieval, and async routes. | If microservice crashes, Node.js proxy catches `ECONNREFUSED` / timeout and returns 503 "AI Service Unavailable". Core web app remains 100% operational. |
| **pypdf** | Pure-Python, dependency-free text extraction from academic PDF syllabi. | Reads uploaded PDF memory buffer via `io.BytesIO`, extracts textual streams page by page, and sends cleaned tokens to Gemini. | Scanned/password-protected PDFs throw `PdfReadError`; returns 400 Bad Request: "Unable to extract text. Ensure PDF is not password-protected or an image." |
| **Cloudinary** | Cloud CDN image storage that survives ephemeral container restarts on Render. | Multer receives image in memory buffer; `cloudinary.uploader.upload_stream` pipes buffer directly to Cloudinary CDN; URL stored in MongoDB. | Stream errors caught by controller; returns 500 "Image upload failed, please try again". Existing user avatar/thumbnail remains intact. |
| **Multer** | In-memory multipart/form-data parser for avatars, subject covers, and PDF uploads. | `multer.memoryStorage()` with 5MB buffer limit and MIME-type filter (`image/*`, `application/pdf`). | File > 5MB triggers `LIMIT_FILE_SIZE` error -> 400 Bad Request. Invalid file extension rejected before reaching cloud storage. |
| **Razorpay** | Monetization gateway for premium DSA Sheet access (₹5 nominal fee). | Server creates order via `razorpay.orders.create()`. Verifies returned signature with `crypto.timingSafeEqual()` against computed HMAC-SHA256. | Invalid signature flags payment as `failed` and returns 400; user remains on free tier. Network drops during checkout handled by order polling. |
| **Passport.js (OAuth 2.0)** | One-click social login via Google, reducing onboarding friction. | `passport-google-oauth20` strategy exchanges auth code for Google profile, links/creates user, auto-verifies email, and sets JWT cookie. | OAuth cancellation redirects to `/auth/login.html?error=oauth_failed`. Server errors return 500 with user-friendly flash redirect. |
| **Bcryptjs** | Irreversible password hashing with resistance against GPU brute-force. | Pre-save Mongoose hook generates salt with 12 rounds (~250ms work factor); `user.comparePassword()` validates candidate strings. | Mismatched password returns 400/401 "Invalid credentials" (generic message to eliminate username/email enumeration vulnerabilities). |
| **Helmet** | HTTP security header hardening against XSS, clickjacking, and sniffing. | Applied as first middleware: sets `X-Frame-Options`, `HSTS`, `X-Content-Type-Options`, and removes `X-Powered-By: Express`. | Misconfigured CSP can block external CDNs (FontAwesome); mitigated by disabling default CSP while retaining all strict transport and frame headers. |
| **express-rate-limit** | DDoS, brute-force credential stuffing, and LLM quota exhaustion protection. | IP-based sliding windows: 10 req/15min on login, 5 req/hr on register, 5 req/10min on OTP, and 30 req/10min on AI endpoints. | HTTP 429 "Too many requests. Please try again later" returned automatically; client displays cooldown timer. |
| **express-mongo-sanitize** | NoSQL query injection prevention. | Recursively strips `$` and `.` characters from incoming `req.body`, `req.query`, and `req.params`. | Strips malicious injection vectors like `{"$gt": ""}`. Malformed payloads fail Mongoose schema casting and return 400 Bad Request. |
| **express-validator** | Request payload boundary validation and type sanitization. | Declarative validation chains on auth, subjects, and resources run before controllers; `validateRequest` intercepts validation errors. | Returns 400 Bad Request with an array of specific field errors (`[{ field: 'email', msg: 'Invalid email address' }]`). Controller logic never runs. |
| **Tailwind CSS & Vanilla JS** | Zero-bundle runtime, ultra-fast First Contentful Paint (FCP) on slow college networks. | PostCSS compiles utilities to `output.css`. `partials.js` (1849 lines) handles navbar injection, notification bell, auth state, and DOM logic. | Script failure in one isolated component is wrapped in `try...catch`; page content remains readable even if dynamic JavaScript widgets fail. |
| **Google Sheets CSV Sync** | Zero-deployment CMS allowing non-technical admins to update 450+ DSA problems. | `app.js` runs custom CSV streaming parser with 3-tier fallback: In-memory cache (5 min) -> Live CSV fetch -> Local `parsed_problems.json`. | If Google Sheets API times out or sheet permissions fail, server seamlessly falls back to `parsed_problems.json` on disk. User experience is never interrupted. |

---

### 2.2 Technology-by-Technology Deep Dive

#### 1. Brevo / Resend / Nodemailer (Transactional Email & OTP)
- **WHY:** Standard Nodemailer SMTP ports (25, 465, 587) are strictly blocked by cloud hosts like Render's free tier to prevent spam. This caused signup and OTP requests to hang indefinitely and fail with `ETIMEDOUT`.
- **HOW:** `server/services/mailService.js` implements a resilient 3-tier cascade:
  1. Primary: **Brevo HTTPS REST API** (`POST https://api.brevo.com/v3/smtp/email` over Port 443 — immune to cloud SMTP blocks).
  2. Secondary: **Resend HTTPS REST API** (`POST https://api.resend.com/emails` on Port 443).
  3. Tertiary: **Nodemailer SMTP** (for localhost/unblocked environments).
  4. Node.js IPv4 DNS prioritization via `dns.setDefaultResultOrder('ipv4first')` eliminates Linux IPv6 dual-stack resolution delays.
- **FAILURE:** If all external email providers fail, `mailService.js` outputs `🔑 [EduStack OTP Code for email]: <code_here>` directly into Render server logs so developers and evaluators can verify accounts immediately.

#### 2. JSON Web Tokens (JWT) & Dual-Token Rotation
- **WHY:** Single long-lived JWTs (e.g. 7 days) create an unrevokable vulnerability if stolen via XSS or network eavesdropping. Storing tokens in `localStorage` exposes them to script injection.
- **HOW:** `server/utils/generateToken.js` implements a production-grade dual-token rotation architecture:
  - **Access Token:** 15-minute lifespan (`JWT_ACCESS_EXPIRES_IN`), signed with `JWT_ACCESS_SECRET`, stored in an `httpOnly`, `secure`, `sameSite` cookie named `edustack_access_token`.
  - **Refresh Token:** 30-day lifespan (`JWT_REFRESH_EXPIRES_IN`), signed with `JWT_REFRESH_SECRET`. The raw token is **never stored in plaintext**; its `SHA-256` cryptographic digest is stored in the `RefreshToken` MongoDB collection.
  - **Rotation & Replay Detection:** When `/api/auth/refresh` is hit, the existing refresh token hash is deleted from the DB and a new pair is issued. If an already-consumed token is presented (replay attack), the system revokes **all** active sessions for that user ID.
- **FAILURE:** If the access token expires, `isAuth.js` catches `TokenExpiredError` and returns `401 Session expired`. Client-side `api.js` catches this, silently calls `/api/auth/refresh`, and transparently retries the failed request. If the refresh token is also invalid or revoked, the user is redirected to `/auth/login.html`.

#### 3. Google Generative AI (Gemini 1.5 / 2.0 Flash)
- **WHY:** State-of-the-art LLM with a 1-million-token context window, fast sub-second token generation, native structured JSON output, and affordable developer quotas.
- **HOW:** `ml_services/main.py` queries `LightRAGStore` to perform keyword retrieval over academic notes, injects the top-3 document chunks into a structured prompt, and queries Gemini. For quizzes, Gemini is instructed to output strictly valid JSON conforming to a Pydantic schema. Dynamic model fallback (`get_available_gemini_models()`) ensures seamless operation between `gemini-1.5-flash` and `gemini-2.0-flash`.
- **FAILURE:** If Gemini's API quota is exceeded (429) or a prompt triggers safety filters, FastAPI catches the exception and returns `HTTP 503 Service Unavailable`. The Node gateway forwards this to the client as an interactive alert toast without crashing.

#### 4. MongoDB Atlas & Mongoose ODM
- **WHY:** EduStack stores heterogeneous educational content (notes, PYQs, playlists, DSA sheets) with varying schemas. MongoDB handles polymorphic BSON documents without complex multi-table joins, while native TTL indexes handle automated cleanup.
- **HOW:** Mongoose ODM connects with connection pooling and retry listeners. 10 schemas enforce validations, pre-save password hashing, and unique compound indexes (e.g. `{ user: 1, subject: 1 }` on `Enrollment` to prevent race-condition duplicate enrollments).
- **FAILURE:** If MongoDB Atlas becomes unreachable, Mongoose triggers disconnected events and `errorHandler.js` returns a sanitized 500 JSON message. Duplicate key violations (`E11000`) are cleanly caught and translated to `409 Conflict`.

#### 5. Node.js & Express.js (Core API Gateway)
- **WHY:** High-throughput, non-blocking asynchronous event loop based on `libuv`. Ideal for I/O-heavy API gateways managing concurrent client traffic, file streaming, and third-party API calls.
- **HOW:** `server/app.js` coordinates security headers, CORS, body parsing, static HTML/asset delivery, modular REST routers (`/api/*`), and proxies AI requests to Python on port 8000.
- **FAILURE:** Synchronous errors pass to `errorHandler.js`. Uncaught exceptions and unhandled promise rejections are intercepted at the process level, triggering a graceful server drain and DB connection pool closure via `SIGTERM`/`SIGINT` handlers.

#### 6. Python FastAPI & Uvicorn (AI Microservice)
- **WHY:** Parsing 100-page academic PDFs and running NLP tokenization in single-threaded Node.js blocks the event loop, causing severe latency for all browsing students. Python possesses the mature AI/ML ecosystem.
- **HOW:** Runs on ASGI Uvicorn server (`port 8000`), proxied by Node.js via `postToMLService`. Uses Pydantic for request validation, in-memory `LightRAGStore` for search, and asynchronous handlers.
- **FAILURE:** If Python crashes on a corrupted PDF or OOM event, Node.js catches `ECONNREFUSED` or socket timeout and returns `503 AI Service Unavailable`. The primary web application and database operations remain 100% functional.

#### 7. pypdf (Document Text Extraction)
- **WHY:** Extracting text from student-uploaded syllabi and notes is required for LLM summarization. Unlike PyMuPDF or Tesseract OCR, `pypdf` is pure Python with **zero external C++ system dependencies**, allowing seamless deployment on containerized platforms (Render).
- **HOW:** Reads the PDF memory buffer via `io.BytesIO(contents)`, iterates through pages, extracts text streams, and passes truncated tokens to Gemini.
- **FAILURE:** Password-protected PDFs trigger `reader.is_encrypted` -> returns `400 Encrypted PDFs not supported`. Scanned image PDFs return empty text -> returns `400 Scanned image PDFs without OCR not supported`.

#### 8. Cloudinary & Multer (Ephemeral-Safe Media Engine)
- **WHY:** Render, Heroku, and containerized Docker environments use **ephemeral filesystems**. Any file saved to local disk (`/uploads`) is wiped when the container restarts or scales down.
- **HOW:** Multer intercepts multi-part requests into memory buffers (`multer.memoryStorage()`). `cloudinary.uploader.upload_stream` streams the buffer directly to Cloudinary's CDN, returning secure HTTPS URLs stored in MongoDB.
- **FAILURE:** Files > 5MB are rejected by Multer before hitting memory (`LIMIT_FILE_SIZE` -> 400 Bad Request). If Cloudinary is down, the controller aborts and preserves the user's existing avatar URL.

#### 9. Razorpay & Node Crypto (HMAC Payment Security)
- **WHY:** Enables monetization for the premium DSA problem tracker (₹5 nominal fee). Cryptographic signature verification ensures students cannot bypass payment.
- **HOW:** Server initiates orders via `razorpay.orders.create({ amount: 500, currency: 'INR' })`. Upon client payment, the server re-computes `HMAC-SHA256(order_id + '|' + payment_id, SECRET)` and verifies it using `crypto.timingSafeEqual()`.
- **FAILURE:** If the signature does not match, `Payment.status` is set to `'failed'`, `user.isPremium` remains `false`, and `400 Invalid payment signature` is returned. `crypto.timingSafeEqual()` eliminates side-channel timing attacks that exist with standard `===` comparisons.

#### 10. Passport.js & Google OAuth 2.0
- **WHY:** One-click Google login eliminates password fatigue and guarantees verified student email addresses without requiring an initial OTP flow.
- **HOW:** `passport-google-oauth20` redirects to Google's consent screen. Callback extracts the verified email, checks `ADMIN_EMAILS` env list for automatic admin role assignment, finds or creates the user record, sets `isVerified: true`, and issues dual-token JWT cookies via `attachTokenPair()`.
- **FAILURE:** User cancellation or Google server errors trigger the failure callback: redirects to `/auth/login.html?error=oauth_failed` where an informative error alert is rendered.

#### 11. Bcryptjs (Cryptographic Password Hashing)
- **WHY:** Fast hashing algorithms (MD5, SHA-256) are vulnerable to GPU brute-force cracking. Bcrypt is an adaptive, CPU-intensive key derivation function resistant to rainbow tables.
- **HOW:** Mongoose pre-save hook on `userSchema` generates a salt with **12 rounds** (~250–300ms work factor) and hashes the password before persistence. `password` is marked `select: false` so it is never returned in DB queries by default.
- **FAILURE:** Invalid password comparison in `loginController` returns generic `401 Invalid credentials` to prevent account enumeration.

#### 12. Helmet & Express Security Suite
- **WHY:** Protects against OWASP Top 10 web vulnerabilities: Clickjacking, XSS, MIME-sniffing, NoSQL query injection, and brute-force traffic saturation.
- **HOW:** 
  - `helmet()` configures 14 secure HTTP headers (`X-Frame-Options`, `X-Content-Type-Options`, `HSTS`).
  - `express-mongo-sanitize()` strips `$` and `.` from inputs, neutralizing NoSQL injections like `{"$gt": ""}`.
  - `express-rate-limit()` enforces tiered sliding windows: 10 req/15min on login, 5 req/hr on register, 30 req/10min on AI routes.
  - `express-validator` validates boundaries and formats before controller execution.
- **FAILURE:** Rate limit breaches return `429 Too Many Requests`. Schema validation failures abort immediately with `400 Bad Request` and structured field errors.

#### 13. Tailwind CSS & Vanilla JavaScript
- **WHY:** Eliminates 200KB–1MB of framework bundle overhead (React/Next.js), delivering instant First Contentful Paint (FCP) on slow college Wi-Fi or mobile data.
- **HOW:** Tailwind compiles utility CSS to `output.css`. `partials.js` (1849 lines) acts as client-side component router: checks `/api/auth/me`, injects dynamic navigation, mounts the notification bell, and manages dark/light themes.
- **FAILURE:** DOM logic is encapsulated in component-level `try...catch` blocks; static HTML remains fully readable even if dynamic JavaScript encounters an exception.

#### 14. Google Sheets CSV Sync Engine & Multi-Tier Cache
- **WHY:** Managing 450+ DSA problems directly in a database requires building a complex CMS. Faculty and student contributors maintain the problem list in a shared Google Sheet.
- **HOW:** Custom state-machine CSV parser (`parseCSVText`) in `server/app.js` runs a 3-tier caching strategy:
  1. Tier 1: In-Memory Cache (`_dsaSheetCache` — serves requests in < 5ms).
  2. Tier 2: Live Google Sheets CSV sync every 5 minutes (`/api/dsa-sheet/sync`).
  3. Tier 3: Local disk fallback (`parsed_problems.json` — 448KB).
- **FAILURE:** If Google Sheets times out or sheet permissions change, the server automatically catches the network error and falls back to `parsed_problems.json` on disk. Users experience zero downtime.

---

## 🏗 System Architecture & Polyglot Request Flow

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           CLIENT (Browser)                              │
│         Vanilla HTML5 + Tailwind CSS + Custom JavaScript Engines         │
│     - partials.js (Auth, Nav, Bell)   - dsa-problems.js (450+ Problems)  │
└────────────────────────────────────┬────────────────────────────────────┘
                                     │
                        HTTPS Requests (Cookies Auto-Attached)
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                    NODE.JS / EXPRESS API GATEWAY                        │
│                           (server/app.js)                               │
│                                                                         │
│  [Pipeline: Helmet ➔ CORS ➔ MongoSanitize ➔ RateLimit ➔ isAuth]         │
│                                                                         │
│  ┌───────────────────────┐ ┌───────────────────┐ ┌───────────────────┐  │
│  │     Core Routes       │ │   Payment Engine  │ │  Static Asset Srv │  │
│  │ /api/auth, /api/users │ │ /api/payments     │ │ /public, /assets  │  │
│  │ /api/subjects, etc.   │ │ (Razorpay + HMAC) │ │ HTML/CSS Delivery │  │
│  └───────────┬───────────┘ └─────────┬─────────┘ └───────────────────┘  │
└──────────────┼───────────────────────┼─────────────────┬────────────────┘
               │                       │                 │
               ▼                       ▼                 │
    ┌──────────────────────┐ ┌──────────────────────┐    │
    │    MongoDB Atlas     │ │ Third-Party Services │    │
    │  (10 Collections)    │ │ - Brevo (Email/OTP)  │    │
    │  - users             │ │ - Cloudinary (Images)│    │
    │  - subjects          │ │ - Google Sheets CSV  │    │
    │  - resources         │ └──────────────────────┘    │
    │  - refreshTokens     │                             │
    │  - payments          │                             │
    └──────────────────────┘                             ▼
                                        Internal Reverse Proxy
                                       (Private Network / Port 8000)
                                                         │
                                                         ▼
                                ┌─────────────────────────────────────────┐
                                │        PYTHON FASTAPI MICROSERVICE      │
                                │           (ml_services/main.py)         │
                                │                                         │
                                │  - LightRAGStore (In-Memory Retrieval)  │
                                │  - pypdf (Buffer Text Extraction)       │
                                │  - Google Generative AI (Gemini Flash)  │
                                └─────────────────────────────────────────┘
```

---

## 📁 Project Directory Structure & File Map

```
EduStack/
├── client/                                # Frontend Presentation Tier
│   ├── assets/
│   │   ├── css/output.css                 # Compiled Tailwind utility bundle
│   │   └── js/
│   │       ├── partials.js                # Core UI engine: Nav, Auth state, Notifications (1849 lines)
│   │       ├── api.js                     # Unified fetch wrapper with auto-retry and token refresh
│   │       ├── auth.js                    # Form validation & submission for Login/Signup
│   │       ├── auth-guard.js              # Client-side route protection UX
│   │       ├── subjects.js                # Subject catalog rendering and search
│   │       ├── dsa-problems.js            # Interactive 450+ problem table engine (480KB)
│   │       ├── dsa-lectures.js            # Video lecture viewer
│   │       ├── favourites.js              # Bookmarks widget
│   │       └── theme-toggle.js            # Persistent Light/Dark theme manager
│   └── public/
│       ├── index.html                     # Hero landing page (64KB)
│       ├── contribute.html                # Contributor onboarding portal
│       ├── ai-hub.html                    # AI Learning Hub interface (42KB)
│       ├── premium-dsa-sheet.html         # Premium-gated DSA Problem Tracker (94KB)
│       ├── subject-detail.html            # Dynamic resource page per subject
│       ├── 404.html                       # Fallback error page
│       ├── parsed_problems.json           # Offline fallback DSA problems (448KB)
│       ├── parsed_lectures.json           # Offline fallback lecture database
│       ├── admin/
│       │   ├── broadcast-notification.html# System-wide announcement console
│       │   └── contributor-requests.html  # Moderation dashboard for student applications
│       ├── auth/
│       │   ├── login.html, register.html, verify-otp.html
│       │   └── forgot-password.html, edit-profile.html
│       └── partials/
│           ├── nav.html                   # Injected navigation layout
│           └── head.html                  # Injected meta and stylesheet links
│
├── server/                                # Backend Application Tier
│   ├── app.js                             # Express application configuration (778 lines)
│   ├── server.js                          # HTTP server entry point & graceful shutdown
│   ├── .env.example                       # Documented environment template
│   ├── package.json                       # Dependencies & npm scripts
│   │
│   ├── config/
│   │   ├── cloudinary.js                  # Cloudinary SDK credentials & storage init
│   │   └── razorpay.js                    # Razorpay payment client instantiation
│   │
│   ├── models/                            # Mongoose ODM Schemas (10 Models)
│   │   ├── user.js                        # User profile, password hash hooks, roles
│   │   ├── subject.js                     # Academic curriculum catalog
│   │   ├── resource.js                    # Polymorphic resource URLs (Notes/PYQs/Playlists)
│   │   ├── notification.js                # Broadcast & targeted alert schema
│   │   ├── otp.js                         # Transient verification codes with TTL index
│   │   ├── payment.js                     # Razorpay audit ledger
│   │   ├── refreshToken.js                # SHA-256 hashed refresh tokens with TTL
│   │   ├── enrollment.js                  # Student-subject many-to-many junction
│   │   ├── favourite.js                   # Polymorphic bookmark store
│   │   └── contributorRequest.js          # Student contributor applications
│   │
│   ├── controllers/                       # Business Logic Layer
│   │   ├── authController.js              # Register, login, OTP verify, OAuth, refresh tokens
│   │   ├── userController.js              # Profile updates, avatar uploads, admin management
│   │   ├── subjectController.js           # Curriculum CRUD
│   │   ├── resourceController.js          # Resource links CRUD & atomic view counter
│   │   ├── notificationController.js      # Filtered dispatch & read status tracking
│   │   ├── paymentController.js           # Order creation & HMAC signature validation
│   │   ├── enrollmentController.js        # Subject enrollment logic
│   │   ├── favouriteController.js         # User bookmarking logic
│   │   └── contributorRequestController.js# Contributor review & role promotion
│   │
│   ├── routes/                            # Modular Express Routers
│   │   ├── authRoutes.js, userRoutes.js, subjectRoutes.js, resourceRoutes.js
│   │   ├── notificationRoutes.js, paymentRoutes.js, enrollmentRoutes.js
│   │   ├── favouriteRoutes.js, contributorRequestRoutes.js
│   │   └── aiRoutes.js                    # Reverse proxy to Python FastAPI service
│   │
│   ├── middlewares/                       # Security & Filter Pipeline
│   │   ├── isAuth.js                      # Dual-token JWT extraction & validation
│   │   ├── requireRole.js                 # Role-Based Access Control enforcement
│   │   ├── validateRequest.js             # express-validator error interception
│   │   └── errorHandler.js                # Centralized exception formatter
│   │
│   ├── services/                          # External Integration Services
│   │   ├── otpService.js                  # OTP generation, storage, and lifecycle
│   │   ├── mailService.js                 # Brevo, Resend, and Nodemailer email delivery
│   │   └── razorpayService.js             # Razorpay API & HMAC cryptographic checks
│   │
│   └── utils/                             # Shared Helper Libraries
│       ├── generateToken.js               # JWT signing, hashing, and cookie configuration
│       ├── asyncHandler.js                # Async route exception wrapper
│       └── apiResponse.js                 # Standardized JSON response envelope
│
└── ml_services/                           # Python AI Microservice Tier
    ├── main.py                            # FastAPI application (RAG, Gemini, pypdf) (452 lines)
    ├── requirements.txt                   # Python dependencies (uvicorn, pydantic, etc.)
    └── Procfile                           # Production execution command for Render
```

---

## 🗄 Database Design — All 10 Models

EduStack's data tier is normalized across 10 collections to avoid unbounded array growth while supporting atomic index operations:

```
                    ┌─────────────────┐
                    │      User       │
                    └────────┬────────┘
                             │
     ┌───────────────────────┼────────────────────────┐
     │ 1:N                   │ 1:N                    │ 1:N
     ▼                       ▼                        ▼
┌───────────────┐   ┌─────────────────┐      ┌────────────────┐
│  Enrollment   │   │    Favourite    │      │  RefreshToken  │
│  (user+subj)  │   │  (user+itemId)  │      │  (tokenHash)   │
└───────┬───────┘   └─────────────────┘      └────────────────┘
        │ N:1
        ▼
┌───────────────┐   1:N   ┌───────────────┐
│    Subject    │────────►│   Resource    │
└───────────────┘         └───────────────┘
```

### 1. User Model (`models/user.js`)
- `firstName`, `lastName`: `String` (Required, trimmed, max 50 chars).
- `email`: `String` (Required, unique, lowercase, regex-validated).
- `password`: `String` (`select: false`, bcrypt 12-round hash).
- `googleId`: `String` (Indexed, sparse).
- `role`: `String` (enum: `['user', 'student', 'contributor', 'admin']`, default: `'user'`).
- `isVerified`: `Boolean` (default: `false`, activated via OTP).
- `isPremium`: `Boolean` (default: `false`, activated via Razorpay verification).
- `avatar`: `String` (Cloudinary HTTPS URL or default avatar).
- `branch`: `String` (enum: `['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER']`, default: `'CSE'`).
- `semester`: `Number` (1–8).
- **Hooks & Methods:** Pre-save bcrypt hashing hook with 12 rounds. Instance method `user.comparePassword(candidate)`. Virtual `fullName`.

### 2. Subject Model (`models/subject.js`)
- `name`: `String` (Required, unique).
- `code`: `String` (Required, uppercase, e.g. `'CS301'`).
- `description`: `String` (max 500 chars).
- `thumbnail`: `String` (Cloudinary URL).
- `semester`: `Number` (1–8).
- `branch`: `String` (enum: branches + `'All'`).
- `notesLink`, `youtubeLink`, `pyqLink`: `String` (External resource URLs).
- `createdBy`: `ObjectId` (Ref: `User`).

### 3. Resource Model (`models/resource.js`)
- `title`: `String` (Required, max 150 chars).
- `description`: `String` (max 500 chars).
- `type`: `String` (enum: `['note', 'pyq', 'playlist', 'link', 'platform']`).
- `url`: `String` (Required external link).
- `subject`: `ObjectId` (Required, Ref: `Subject`).
- `uploadedBy`: `ObjectId` (Ref: `User`).
- `isPremium`: `Boolean` (default: `false`).
- `views`: `Number` (default: 0, atomically updated via `$inc`).
- **Compound Index:** `{ subject: 1, type: 1 }` (Enables high-speed filtering).

### 4. Notification Model (`models/notification.js`)
- `title`: `String` (Required, max 120 chars).
- `message`: `String` (Required, max 1000 chars).
- `type`: `String` (enum: `['announcement', 'alert', 'update', 'system']`).
- `link`: `String` (Optional redirect URL).
- `recipient`: `ObjectId` (Ref: `User`, default: `null`).
  - `null`: System-wide broadcast visible to all students.
  - `ObjectId`: Targeted private notification visible only to that user.
- `readBy`: `[ObjectId]` (Ref: `User`, array of user IDs who marked it read).

### 5. OTP Model (`models/otp.js`)
- `email`: `String` (Required, unique).
- `code`: `String` (6-digit numeric string).
- `createdAt`: `Date` (default: `Date.now`).
- **TTL Index:** `{ createdAt: 1 }` with `expireAfterSeconds: 600` (10 minutes). MongoDB background threads clean up expired documents automatically every 60 seconds.

### 6. RefreshToken Model (`models/refreshToken.js`)
- `userId`: `ObjectId` (Required, Ref: `User`).
- `tokenHash`: `String` (Required, unique — stores `SHA-256` digest of refresh token).
- `expiresAt`: `Date` (Required).
- **TTL Index:** `{ expiresAt: 1 }` with `expireAfterSeconds: 0`. Auto-deletes expired tokens from database storage.

### 7. Payment Model (`models/payment.js`)
- `user`: `ObjectId` (Required, Ref: `User`).
- `razorpayOrderId`: `String` (Required, unique — created prior to payment).
- `razorpayPaymentId`: `String` (Assigned post-payment).
- `razorpaySignature`: `String` (HMAC-SHA256 from Razorpay).
- `amount`: `Number` (Stored in paise: 500 = ₹5).
- `currency`: `String` (default: `'INR'`).
- `status`: `String` (enum: `['created', 'paid', 'failed']`).

### 8. Enrollment Model (`models/enrollment.js`)
- `user`: `ObjectId` (Required, Ref: `User`).
- `subject`: `ObjectId` (Required, Ref: `Subject`).
- **Compound Unique Index:** `{ user: 1, subject: 1 }` (Prevents duplicate enrollments at the database level).

### 9. Favourite Model (`models/favourite.js`)
- `user`: `ObjectId` (Required, Ref: `User`).
- `itemId`: `ObjectId` (Required, Subject or Resource ID).
- `itemType`: `String` (enum: `['subject', 'resource']`).
- **Compound Unique Index:** `{ user: 1, itemId: 1 }`.

### 10. ContributorRequest Model (`models/contributorRequest.js`)
- `user`: `ObjectId` (Required, Ref: `User`).
- `branch`: `String` (Applicant's branch).
- `semester`: `Number` (1–8).
- `reason`: `String` (max 1000 chars).
- `status`: `String` (enum: `['pending', 'approved', 'rejected']`).
- `reviewedBy`: `ObjectId` (Ref: `User`).
- `adminNote`: `String` (Feedback delivered to applicant).

---

## 🔐 Authentication & Authorization Mechanics

### Dual-Token System & Replay Detection

```
[Client]                                                   [Server]
   │                                                           │
   │──── 1. POST /api/auth/login ─────────────────────────────►│
   │                                                           │ Checks credentials
   │                                                           │ Issues Access Token (15m)
   │                                                           │ Hashes Refresh Token (30d) ➔ DB
   │◄─── 2. Set Cookies (edustack_access, edustack_refresh) ───│
   │                                                           │
   │─── 3. GET /api/users/profile (with Access Cookie) ───────►│
   │                                                           │ isAuth verifies signature
   │◄── 4. 200 OK (User Profile Data) ─────────────────────────│
   │                                                           │
   │   ... 16 Minutes Later (Access Token Expires) ...         │
   │                                                           │
   │─── 5. GET /api/users/profile (Expired Access Cookie) ────►│
   │                                                           │ isAuth catches TokenExpiredError
   │◄── 6. 401 Unauthorized ("Session expired") ───────────────│
   │                                                           │
   │─── 7. POST /api/auth/refresh (with Refresh Cookie) ──────►│
   │                                                           │ Verifies Refresh Token
   │                                                           │ Deletes Old Token Hash from DB
   │                                                           │ Rotates: Issues New Token Pair
   │◄── 8. 200 OK + Updated Cookies ───────────────────────────│
   │                                                           │
   │─── 9. Re-try GET /api/users/profile ─────────────────────►│
   │◄── 10. 200 OK (Transparent Recovery) ────────────────────│
```

1. **Access Token Generation (`generateAccessToken`):** Signs `{ id: userId }` using `JWT_ACCESS_SECRET` with 15-minute expiry. Attached to `res` in an `httpOnly`, `secure`, `sameSite` cookie named `edustack_access_token`.
2. **Refresh Token Generation & Hashing (`generateRefreshToken` & `hashToken`):** Signs `{ id: userId }` using `JWT_REFRESH_SECRET` with 30-day expiry. The raw token is hashed via `crypto.createHash('sha256').update(token).digest('hex')` and persisted in `RefreshToken`.
3. **Replay Attack Detection:** When `/api/auth/refresh` is requested, the system verifies the JWT signature and searches for the token hash in MongoDB:
   - If the hash is found: It is atomically deleted via `findOneAndDelete` and a brand-new token pair is issued.
   - If the hash is **not found** (despite being cryptographically valid): The token has already been consumed. This indicates a potential stolen token replay attack. The server immediately invalidates **all** refresh tokens belonging to that `userId`, forcing a fresh login.

### Stale Role Prevention
- The JWT payload strictly excludes user role or status: `{ id: userId }`.
- On every protected request, `isAuth.js` queries `User.findById(decoded.id).select('-password')`.
- If an admin demotes a contributor or bans an account, the user is locked out **on their very next HTTP request**, eliminating the multi-day stale permission window common in naive JWT implementations.

### Google OAuth 2.0 Flow
1. User clicks "Sign in with Google" -> `GET /auth/google`.
2. Passport redirects to Google consent screen requesting `profile` and `email`.
3. Google returns to `/auth/google/callback` with authorization code.
4. Passport strategy extracts email, checks `ADMIN_EMAILS` env list for automatic admin role promotion, and links to an existing user account or creates a new one with `isVerified: true`.
5. The callback invokes `attachTokenPair(res, user._id)`, attaches the dual-token cookies, and redirects the browser to `/`.

---

## 👮 Role-Based Access Control (RBAC) & Startup Contributor Sync

### Permission Hierarchy
- **`user` / `student`:** Browse all subjects, view academic notes/PYQs, access the free tier of the DSA sheet, manage favorites, submit contributor applications.
- **`contributor`:** All student permissions + ability to add and edit resource links across subjects.
- **`admin`:** Full platform control — create/delete subjects, manage users, broadcast global announcements, approve/reject contributor requests, and sync the DSA sheet.

### `requireRole` Middleware
```javascript
const requireRole = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ success: false, message: 'Forbidden: Insufficient privileges' });
  }
  next();
};
```

### Startup Contributor Role Synchronization
In `server/app.js`, a startup audit routine executes to ensure database integrity:
```javascript
// Scans for users who hold the 'contributor' role without an approved request
const rogueContributors = await User.find({ role: 'contributor' });
for (const user of rogueContributors) {
  const approvedRequest = await ContributorRequest.findOne({ user: user._id, status: 'approved' });
  if (!approvedRequest) {
    user.role = 'student';
    await user.save();
    console.warn(`⚠️ Revoked unauthorized contributor privileges for user: ${user.email}`);
  }
}
```
This ensures direct manual edits in MongoDB Atlas cannot bypass the administrative review workflow.

---

## 📡 API Reference — All Endpoints & Data Contracts

All endpoints return a standardized envelope: `{ "success": boolean, "message": string, "data": any }`.

### Authentication (`/api/auth`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/register` | Public | Registers user, hashes password (12 rounds), dispatches OTP via Brevo |
| POST | `/verify-otp` | Public | Validates 6-digit OTP, sets `isVerified: true`, issues dual JWT cookies |
| POST | `/resend-otp` | Public | Re-generates OTP and resets 10-minute TTL (Rate limit: 5/10 min) |
| POST | `/login` | Public | Validates credentials and verified status, issues dual-token cookies |
| POST | `/refresh` | Public | Consumes refresh cookie, validates replay security, rotates token pair |
| POST | `/logout` | Private | Clears cookies, removes refresh token hash from MongoDB |
| POST | `/forgot-password` | Public | Dispatches password reset OTP (returns generic response to prevent user enumeration) |
| POST | `/reset-password` | Public | Validates OTP and updates password hash |
| GET | `/me` | Private | Returns currently authenticated user document from `req.user` |
| GET | `/auth/google` | Public | Initiates Google OAuth consent flow |
| GET | `/auth/google/callback` | Public | OAuth callback, account linking, cookie attachment |

### Users (`/api/users`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/profile` | Private | Returns calling user profile |
| PUT | `/profile` | Private | Updates profile attributes (role cannot be altered) |
| PUT | `/avatar` | Private | Streams multipart image to Cloudinary CDN, updates `user.avatar` |
| GET | `/` | Admin | Paginated user management list |

### Subjects (`/api/subjects`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Returns all subjects with branch and semester filters |
| GET | `/:id` | Public | Retrieves specific subject details and associated resources |
| POST | `/` | Admin | Creates new subject catalog entry |
| PUT | `/:id` | Admin | Updates subject details |
| DELETE | `/:id` | Admin | Deletes subject and its associated resources |

### Resources (`/api/resources`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Public | Lists resources with type and keyword search |
| GET | `/:id` | Public | Fetches resource and atomically increments views (`$inc: { views: 1 }`) |
| GET | `/subject/:subjectId` | Public | Fetches all resources for a specific curriculum subject |
| POST | `/` | Contributor/Admin | Creates new resource link (auto-creates subject if needed) |
| PUT | `/:id` | Contributor/Admin | Updates resource URL or metadata |
| DELETE | `/:id` | Admin | Removes resource link |

### Notifications (`/api/notifications`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/` | Private | Fetches notifications: `{ $or: [{ recipient: null }, { recipient: userId }] }` |
| PUT | `/read-all` | Private | Marks all matching notifications as read for calling user |
| PUT | `/:id/read` | Private | Marks single notification as read |
| POST | `/` | Admin | Dispatches global announcement broadcast |
| DELETE | `/:id` | Admin | Deletes notification |

### Contributor Moderation (`/api/contributor-requests`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/` | Private | Submits contributor application (rejects if pending request exists) |
| GET | `/my-status` | Private | Checks status of own application |
| GET | `/` | Admin | Lists all applications with status filters |
| PUT | `/:id/approve` | Admin | Promotes user to `contributor`, notifies student |
| PUT | `/:id/reject` | Admin | Rejects application with feedback note, notifies student |

### Payments & Premium Access (`/api/payments`)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/key` | Public | Returns Razorpay Public Key ID |
| POST | `/create-order` | Private | Creates Razorpay order for ₹5 (500 paise) |
| POST | `/verify` | Private | Cryptographically verifies HMAC-SHA256 signature, sets `isPremium: true` |
| GET | `/history` | Private | Returns student's transaction history |

### AI Microservice Proxy (`/api/ai` — Rate limit: 30 req/10 min)
| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/ask` | Private | Proxies query to Python FastAPI `LightRAGStore` + Gemini |
| POST | `/generate-pyq` | Private | Dynamically synthesizes topic-specific university exam questions |
| POST | `/pdf/summarize` | Private | Streams PDF buffer to Python `pypdf` + Gemini summarizer |
| POST | `/pdf/generate-quiz` | Private | Extracts text from PDF and synthesizes interactive MCQ quiz |

---

## 🔍 Feature Deep-Dives & Production Edge-Cases

### 1. Subject & Resource View Counter ($inc)
```javascript
await Resource.findByIdAndUpdate(req.params.id, { $inc: { views: 1 } });
```
- **Concurrency Safety:** Avoids the standard "read-modify-write" race condition (`doc.views += 1; await doc.save()`). MongoDB executes the `$inc` directly on the storage engine thread, ensuring atomic increments even under concurrent requests.

### 2. DSA Sheet 3-Tier Sync & Custom CSV State-Machine
```
[User Requests DSA Sheet]
             │
             ▼
  Check In-Memory Cache (_dsaSheetCache)
             │
    ┌────────┴────────┐
[Valid (< 5 min)]  [Expired / Missing]
    │                 │
    ▼                 ▼
 Return Data     Fetch Live Google Sheets CSV
 (Latency < 5ms)      │
             ┌────────┴────────┐
         [Success]          [Fails / Offline]
             │                 │
             ▼                 ▼
       Update Cache &     Read parsed_problems.json
       Write to Disk      from Server Disk
             │                 │
             └────────┬────────┘
                      ▼
            Deliver 450+ Problems
```

- **Custom State-Machine CSV Parser (`parseCSVText`):** Written without third-party dependencies to handle multi-line quotes, escaped commas inside problem names, and CRLF line endings.
- **Company Name Filter:** Automatically detects when community contributors accidentally paste company tags (`"Amazon, Google"`) into problem intuition columns, stripping them to maintain clean UI rendering.

### 3. Contributor Moderation Pipeline
- Students submit applications detailing their branch, semester, and motivation.
- Prevents duplicate pending submissions at both the database level (index) and controller level.
- Upon admin approval, an atomic transaction updates `user.role = 'contributor'`, marks the request `approved`, and sends a private notification to the applicant.

### 4. Notification Dispatch: Broadcast vs Private
- Notification schema uses a nullable `recipient` field:
  - `recipient === null`: System broadcast delivered to all users.
  - `recipient === ObjectId`: Private notification delivered to a specific student.
- Query optimizer uses a single compound index:
  ```javascript
  Notification.find({ $or: [{ recipient: null }, { recipient: req.user._id }] }).sort({ createdAt: -1 });
  ```
- Individual read status is tracked via an array of user ObjectIds (`readBy`), eliminating the need for a separate junction collection.

### 5. Razorpay Verification with Constant-Time HMAC
```javascript
const expectedSignature = crypto
  .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
  .update(`${orderId}|${paymentId}`)
  .digest('hex');

const isMatch = crypto.timingSafeEqual(
  Buffer.from(expectedSignature, 'utf8'),
  Buffer.from(signature, 'utf8')
);
```
- Standard string comparison (`===`) aborts at the first non-matching byte, leaking timing information. `crypto.timingSafeEqual()` guarantees constant-time evaluation, eliminating side-channel timing attacks.

### 6. AI Hub: In-Memory RAG & PDF Processing Pipeline
1. Node.js authenticates user via `isAuth`, validates rate limits, and proxies request to FastAPI (`http://localhost:8000`).
2. Python service receives the payload:
   - For PDF processing: Streams raw binary into `pypdf.PdfReader(io.BytesIO(buffer))` without writing to disk.
   - For RAG Q&A: `LightRAGStore` scores keyword overlap across academic document chunks.
3. Relevant context is formatted into a structured prompt with strict system instructions.
4. Google Gemini 1.5/2.0 Flash processes the context and returns structured JSON conforming to Pydantic models.

---

## 🛡 Security Architecture & OWASP Hardening

- **NoSQL Injection Defense:** `express-mongo-sanitize` strips `$` and `.` from all inputs, neutralizing malicious payloads like `{"$gt": ""}`.
- **HTTP Header Hardening:** `helmet()` configures strict transport security (`HSTS`), clickjacking protection (`X-Frame-Options: SAMEORIGIN`), and MIME-type enforcement (`X-Content-Type-Options: nosniff`).
- **Tiered Rate Limiting:** Enforces sliding-window request limits on login (10/15min), registration (5/hr), OTP verification (5/10min), and AI endpoints (30/10min).
- **Password Security:** Salted with 12 bcrypt rounds (~250ms work factor). Schema configuration `select: false` prevents accidental credential exposure in database queries.
- **XSS Protection:** Authentication tokens are delivered exclusively in `httpOnly` cookies, preventing client-side JavaScript from reading authorization credentials.
- **Payload Guardrails:** Request bodies are restricted to `1mb` (`express.json({ limit: '1mb' })`) to prevent memory exhaustion DoS attacks. Multi-part file uploads are limited to 5MB via Multer.

---

## ⚙ Middleware Execution Pipeline

```
Incoming Client Request
    │
    ▼
1. helmet()                   ➔ Injects secure HTTP response headers
2. cors()                     ➔ Validates cross-origin authorization
3. express.urlencoded()       ➔ Parses URL-encoded form submissions
4. express.json({limit: 1mb}) ➔ Parses JSON payloads (guards against large-payload DoS)
5. cookieParser()             ➔ Parses access and refresh cookies
6. morgan('dev')              ➔ Logs HTTP request methods, status, and response latency
7. mongoSanitize()            ➔ Strips $ and . from body, query, and params (Anti-NoSQL injection)
8. session()                  ➔ Manages OAuth state persistence in MongoDB
9. passport.initialize()      ➔ Initializes Google OAuth strategy
10. res.locals Middleware     ➔ Exposes authenticated user state to template context
    │
    ├── Static Asset Routes   ➔ Delivers files from /client/public and /client/assets
    │
    ├── Public API Routes     ➔ [RateLimiter] ➔ [express-validator] ➔ Controller
    │
    └── Protected API Routes  ➔ [RateLimiter] ➔ [isAuth] ➔ [requireRole] ➔ Controller
    │
    ▼
404 Handler                   ➔ Catches unmatched endpoints, returns 404 JSON
    │
    ▼
errorHandler()                ➔ 4-parameter centralized error handler (sanitizes 500 errors)
```

---

## 🔧 Services Layer

- **`otpService.js`:**
  - Generates cryptographically secure 6-digit codes.
  - Updates/upserts the `OTP` document with a 10-minute TTL index.
  - `verifyOtp(email, code)` compares codes and **immediately deletes** the document upon match to guarantee one-time usage.
- **`mailService.js`:**
  - Enforces IPv4 resolution (`dns.setDefaultResultOrder('ipv4first')`).
  - Cascading delivery: Brevo HTTPS REST API (Port 443) -> Resend HTTPS REST API -> Nodemailer SMTP.
  - Development fallback: Outputs OTP directly to server logs.
- **`razorpayService.js`:**
  - Manages Razorpay order creation (`razorpay.orders.create`).
  - Executes constant-time HMAC-SHA256 signature verification via `crypto.timingSafeEqual`.

---

## 🖥 Client-Side Architecture (Vanilla JS Partial Engine)

- **`partials.js` (1849 lines):** The client-side core engine. Automatically executes on every page load:
  1. Queries `GET /api/auth/me` with credentials.
  2. Dynamically injects the appropriate navigation bar (Guest Navbar vs Authenticated Navbar with profile details, notification bell, and admin links).
  3. Mounts the notification bell widget, handles polling, and renders unread badges.
  4. Manages global dark/light theme switching with `localStorage` persistence.
- **`dsa-problems.js` (480KB):** Renders the 450+ problem sheet with real-time search, category filtering, difficulty toggles, and company tags. "Mark as Done" state is persisted in `localStorage` to avoid unnecessary database writes.
- **`auth-guard.js`:** Enforces client-side route protection by redirecting unauthenticated users to `/auth/login.html` (with server-side JWT verification acting as the true security boundary).

---

## 🌍 Environment Variables

`server/.env`:
```env
# Database Configuration
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/edustack?retryWrites=true&w=majority

# JWT Dual-Token Configuration
JWT_ACCESS_SECRET=your_super_secret_access_key_12345
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_super_secret_refresh_key_67890
JWT_REFRESH_EXPIRES_IN=30d
JWT_SECRET=legacy_fallback_secret_key

# Administrative Privileges (Comma-separated)
ADMIN_EMAILS=admin@nitp.ac.in,shubham@edustack.com

# Google OAuth 2.0
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_CALLBACK_URL=http://localhost:3000/auth/google/callback

# Transactional Email Providers
BREVO_API_KEY=xkeysib-your_brevo_api_key
BREVO_SENDER_EMAIL=no-reply@edustack.com
RESEND_API_KEY=re_your_resend_api_key
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=your_email@gmail.com
MAIL_PASS=your_app_password

# Media Storage (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Payment Processing (Razorpay)
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_razorpay_secret

# AI Microservice Proxy
ML_SERVICE_URL=http://localhost:8000

# Server Runtime Settings
PORT=3000
NODE_ENV=production
CORS_ORIGINS=https://edustack.onrender.com
OTP_EXPIRES_MIN=10
```

`ml_services/.env`:
```env
GEMINI_API_KEY=your_google_gemini_api_key
PORT=8000
```

---

## 🚀 Deployment & Graceful Shutdown

### Local Development Setup
```bash
# Terminal 1 — Primary Node.js API Gateway
cd server
npm install
npm run dev        # nodemon server.js (Port 3000)

# Terminal 2 — Python AI Microservice
cd ml_services
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```
Navigate to `http://localhost:3000` in your browser. Both static client assets and REST APIs are served from the same origin.

### Production Cloud Deployment (Render.com)
- **Node.js Web Service:**
  - Build: `cd server && npm install`
  - Start: `node server.js`
  - Environment: Configure all `server/.env` keys in the Render Dashboard.
- **Python AI Microservice:**
  - Build: `pip install -r requirements.txt`
  - Procfile: `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
  - Communicates with Node.js over Render's private service network.

### Graceful Termination
During cloud container restarts or redeployments, the server catches `SIGTERM` and `SIGINT`:
```javascript
const shutdown = () => {
  server.close(async () => {
    await mongoose.connection.close(false);
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10000); // 10s force-kill threshold
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
```
This allows in-flight database writes and active payment transactions to finish cleanly before process exit.

---

## 💡 Viva & Technical Interview Code Defense

### 30 Core Technical Questions & Answers

#### Q1: Why did you choose a monolithic structure for Node.js while keeping Python as a microservice?
**Answer:** Node.js handles I/O-bound tasks (user traffic, database operations, static asset serving) efficiently using its non-blocking event loop. Text parsing and LLM token processing are CPU-bound tasks. Isolating Python into an independent microservice ensures that intense AI computations never block the Node.js event loop, maintaining responsive page loads and API calls for all other users.

#### Q2: Why did you use `crypto.timingSafeEqual()` in payment verification?
**Answer:** Standard string comparison operators (`===`) return `false` at the first non-matching byte, causing minute variations in execution time. Attackers can exploit these differences through timing attacks to incrementally guess valid cryptographic signatures. `timingSafeEqual()` executes in constant time regardless of where or whether characters differ, eliminating side-channel leakage.

#### Q3: Why did you store refresh token hashes instead of raw tokens in MongoDB?
**Answer:** Storing raw refresh tokens in the database creates a major vulnerability: anyone with read access to the database could hijack all active user sessions. Storing a one-way `SHA-256` hash ensures that even in the event of a full database leak, the stored hashes cannot be used as authorization tokens.

#### Q4: What happens if a user submits two identical enrollment requests simultaneously?
**Answer:** The `Enrollment` collection enforces a compound unique index on `{ user: 1, subject: 1 }`. MongoDB guarantees atomicity at the document level: the first request inserts successfully, and the concurrent request triggers an `E11000 duplicate key error`. Our controller catches this and returns `409 Conflict`, preventing duplicate records.

#### Q5: Why did you choose MongoDB over PostgreSQL?
**Answer:** Educational resources in our system are polymorphic: lecture notes have Drive URLs and file sizes; PYQs have exam years and question types; playlists have video IDs and counts. In a relational database, this requires multiple sparse tables or complex joins. MongoDB's flexible BSON document model stores varied metadata naturally, and its native TTL indexes handle automated OTP and session cleanup out of the box.

#### Q6: Why did you put JWT in `httpOnly` cookies instead of browser `localStorage`?
**Answer:** Any JavaScript running on the page can access `localStorage`. If an application is compromised by an XSS vulnerability (such as a malicious third-party script or CDN library), tokens stored in `localStorage` can be stolen. `httpOnly` cookies cannot be accessed by client-side JavaScript, protecting tokens from XSS-based theft.

#### Q7: Why re-fetch the user from the database in `isAuth` if JWT is supposed to be stateless?
**Answer:** Storing roles directly in stateless tokens creates a stale authorization window. If an admin bans an account or revokes contributor access, the user would still retain access until the token expires. By verifying the user ID against the database on each request, account status changes and role revocations take effect immediately.

#### Q8: How did you fix Render Free Tier's SMTP blocking issue?
**Answer:** Render blocks outbound SMTP ports 25, 465, and 587 to prevent spam, causing Nodemailer to hang with `ETIMEDOUT` errors. I resolved this by integrating Brevo's transactional email API over HTTPS Port 443. Web traffic over Port 443 is never blocked by cloud firewalls, reducing email delivery latency to under 400ms.

#### Q9: How does your OTP auto-expire without a cron job?
**Answer:** In the Mongoose `otpSchema`, the `createdAt` field is configured with a TTL index: `{ expires: 600 }`. MongoDB's background thread scans the index and automatically purges expired documents every 60 seconds, eliminating the need for scheduled application cron jobs.

#### Q10: Why did you choose Vanilla JS over React for the frontend?
**Answer:** EduStack is an academic resource hub where fast initial page load (First Contentful Paint) is critical for students on slow mobile networks. React adds hundreds of kilobytes of runtime bundle overhead. Serving semantic HTML styled with Tailwind and enhanced with modular Vanilla JS provides instant loads, simplifies deployment, and eliminates frontend build steps.

#### Q11: What is the purpose of `express-mongo-sanitize`?
**Answer:** It protects against NoSQL injection attacks. If an attacker submits a payload like `{"email": {"$gt": ""}, "password": {"$gt": ""}}`, standard MongoDB queries could evaluate `$gt` as a query operator and authenticate without valid credentials. The middleware strips all `$` and `.` characters from incoming request inputs, neutralizing the attack.

#### Q12: How does your application prevent brute-force attacks on login and OTP?
**Answer:** We implement tiered rate limiting via `express-rate-limit`. The login route is restricted to 10 requests per 15 minutes per IP, registration to 5 requests per hour, and OTP verification to 5 requests per 10 minutes. Requests exceeding these thresholds are automatically rejected with `HTTP 429 Too Many Requests`.

#### Q13: What happens if Cloudinary is down when a user updates their avatar?
**Answer:** The upload stream error is caught in the controller's callback, logging the failure and returning `HTTP 500: "Image upload failed, please try again."` Because the user's database record is only updated after a successful Cloudinary response, the previous avatar URL remains intact without broken image links.

#### Q14: Why did you use `pypdf` instead of PyMuPDF or Tesseract OCR?
**Answer:** PyMuPDF and Tesseract require native C++ system libraries (Poppler, Leptonica) that are difficult or impossible to install on containerized free-tier environments like Render. `pypdf` is written entirely in Python, has zero OS dependencies, and runs reliably in any containerized environment.

#### Q15: How do you handle Google OAuth in production versus local development?
**Answer:** Google OAuth strictly validates authorized redirect URIs. We use an environment variable `GOOGLE_CALLBACK_URL` that points to `http://localhost:3000/auth/google/callback` locally and our production domain on Render. We also configure trust proxy settings (`app.set('trust proxy', 1)`) so Express respects secure HTTPS headers behind reverse proxies.

#### Q16: Why did you configure Mongoose's `password` field with `select: false`?
**Answer:** By setting `select: false`, Mongoose automatically excludes the password hash from all query results across the entire application by default. This prevents accidental credential exposure if a developer returns a user document directly via `res.json(user)`. Queries that specifically require the password (such as login authentication) must explicitly opt in using `.select('+password')`.

#### Q17: What happens if Google Sheets sync fails during a user request?
**Answer:** The sync operation is protected by a multi-tier fallback mechanism. If the network request to Google Sheets fails, the `catch` block intercepts the error and immediately loads the static `parsed_problems.json` file from disk. The user receives complete problem data without experiencing errors or delays.

#### Q18: What is the difference between private and broadcast notifications in your schema?
**Answer:** In the `Notification` model, the `recipient` field is an optional ObjectId referencing the `User` model. If `recipient` is `null`, it represents an admin announcement visible to all users. If `recipient` contains a specific `userId`, the notification is private to that user (such as contributor application approvals). The query `{ $or: [{ recipient: null }, { recipient: userId }] }` fetches both in a single operation.

#### Q19: How do you prevent privilege escalation for the contributor role?
**Answer:** First, the user profile update endpoint explicitly excludes the `role` field from modifiable attributes. Second, students must submit a formal application via `ContributorRequest`, which only an admin can approve. Third, during application startup, the server runs a synchronization check that demotes any contributor lacking an approved request record in the database.

#### Q20: Why did you use `pydantic` in the Python microservice?
**Answer:** Pydantic provides runtime type enforcement, validation, and JSON serialization. If incoming payloads from Node.js or client uploads miss required fields or contain incorrect types, Pydantic immediately returns structured 422 Unprocessable Entity errors before passing bad data to the Gemini API.

#### Q21: What happens if a user clicks the Razorpay payment button but closes the window?
**Answer:** The initial order creation sets the database record to `status: 'created'`. If the user cancels or closes the checkout modal, the verification endpoint is never called. The payment remains in the `'created'` state and `user.isPremium` remains `false`. A background cleanup job can mark stale orders older than 24 hours as `'failed'`.

#### Q22: What is the purpose of `dns.setDefaultResultOrder('ipv4first')` in `mailService.js`?
**Answer:** Modern Node.js versions on Linux distributions attempt to resolve IPv6 addresses first. Many cloud hosting providers support IPv4 only on external interfaces, causing connection attempts to IPv6 addresses to stall for several seconds before falling back to IPv4. Setting `ipv4first` resolves addresses to IPv4 immediately, eliminating connection delays.

#### Q23: How does graceful shutdown work during Render deployments?
**Answer:** When Render replaces a container, it sends a `SIGTERM` signal. Our server intercepts this signal, stops accepting new HTTP connections, waits up to 10 seconds for active requests to finish, and closes MongoDB connection pools cleanly. This prevents interrupted database writes and corrupted payment states during redeployments.

#### Q24: Why use a compound index on `{ subject: 1, type: 1 }` for resources?
**Answer:** The primary access pattern for resources is filtering by subject and category (e.g., "fetch all PYQs for DSA"). An index on `subject` alone requires scanning all documents for that subject to filter by type. The compound index `{ subject: 1, type: 1 }` satisfies both query conditions directly from the index tree in $O(\log N)$ time.

#### Q25: Why do you need both an access token and a refresh token?
**Answer:** Access tokens are short-lived (15 minutes) to minimize the exposure window if compromised. However, forcing users to log in every 15 minutes creates poor user experience. The long-lived refresh token (30 days) allows the application to obtain new access tokens silently in the background while providing the server with revocation control via database checks.

#### Q26: What happens if an unverified user tries to log in?
**Answer:** The login controller queries the user and checks `user.isVerified`. If `false`, login is denied with `HTTP 403 Forbidden: "Account not verified"`. The system automatically generates and sends a fresh OTP to the user's email, redirecting them directly to the verification screen.

#### Q27: How does atomic view incrementing work in `resourceController.js`?
**Answer:** Instead of reading the document, incrementing the count in JavaScript, and saving it back (which introduces race conditions under concurrent requests), we use MongoDB's atomic operator:
```javascript
Resource.findByIdAndUpdate(id, { $inc: { views: 1 } });
```
MongoDB updates the counter directly on the server thread, ensuring accurate view counts even under heavy concurrent traffic.

#### Q28: How do you protect against large payload DoS attacks?
**Answer:** We set strict body parsing limits on Express:
```javascript
app.use(express.json({ limit: '1mb' }));
```
Any incoming request payload larger than 1MB is rejected immediately with `HTTP 413 Payload Too Large`. File uploads are independently limited to 5MB via Multer memory limits.

#### Q29: What is the difference between `lean()` queries and standard Mongoose queries?
**Answer:** Standard Mongoose queries return full Mongoose Documents complete with change tracking, getters, setters, and internal methods. By appending `.lean()`, Mongoose skips this hydration step and returns plain JavaScript objects. This reduces memory consumption and speeds up read-heavy query execution by 3–5x.

#### Q30: If you had to redesign EduStack today, what would you improve?
**Answer:** 
1. **TypeScript:** Migrate both client and server to TypeScript to gain compile-time type safety across complex payment and API response models.
2. **Message Queue Architecture:** Introduce Redis with **BullMQ** to process emails, PDF parsing, and notifications asynchronously via background worker queues.
3. **Automated Testing:** Build end-to-end integration test suites using **Jest**, **Supertest**, and **Playwright** to validate critical authentication and payment flows on every commit.

---

*Built with ❤️ by Shubham Kumar — Computer Science & Engineering, NIT Patna.*
