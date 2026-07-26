# EduStack 🚀 — Computer Science Learning Hub & AI Academic Platform

> **"Pushing knowledge, Popping success."**

[![EduStack Architecture](https://img.shields.io/badge/Architecture-Microservice-brightgreen)](https://github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub)
[![Backend](https://img.shields.io/badge/Backend-Node.js%20%7C%20Express-blue)](https://nodejs.org/)
[![Database](https://img.shields.io/badge/Database-MongoDB-green)](https://www.mongodb.com/)
[![AI Engine](https://img.shields.io/badge/AI Engine-FastAPI%20%7C%20Google%20Gemini-orange)](https://fastapi.tiangolo.com/)

EduStack is a full-stack, microservice-based Computer Science Learning Platform and AI Academic Hub designed specifically for university engineering students, educators, and administrators. It consolidates academic course materials, previous year examination papers (PYQs), curated coding resources, and an AI-driven RAG tutor into a single, high-contrast, responsive web application.

---

## 🌟 Key Features

### 🎓 Academic Core
- **Subject Library**: Organized access to notes, PYQs, and YouTube lectures for Core CS subjects (DSA, DBMS, OS, Computer Networks, System Design, OOPs, Web Dev).
- **Role-Based Workflows**: Tailored user experiences for **Guests**, **Students**, **Contributors**, and **Admins/Hosts**.
- **Interactive DSA Sheet**: Premium curated problem sets with dynamic progress tracking.
- **Resource Management**: Seamless uploading, categorization, and Cloudinary CDN storage for PDF notes and solutions.

### 🤖 AI & RAG Engine (`ml_services`)
- **Retrieval-Augmented Generation (RAG)**: Answers student questions using context retrieved from indexed university course materials via Google Gemini 1.5/2.0 Flash LLMs.
- **Automated PYQ Generator**: Generates university exam-style questions with detailed marking schemes and C++ solution blocks.
- **Intelligent PDF Summarizer**: Extracts key concepts, executive summaries, and exam takeaways from uploaded study PDFs.
- **Dynamic PDF Quiz Generator**: Automatically converts uploaded study note PDFs into interactive Multiple-Choice Quizzes (MCQs).
- **EduStack AI Assistant Modal**: Live floating chat modal with Markdown formatting, C++ code block styling, and one-click copy features.

### 💳 Security & Payments
- **Secure Authentication**: HttpOnly JWT cookie sessions, Bcrypt password hashing, and Google OAuth 2.0.
- **Two-Factor OTP Verification**: Email verification via Nodemailer SMTP service.
- **Razorpay Integration**: Signed order creation and HMAC-SHA256 signature verification for Premium Membership upgrades.
- **Broadcast Notifications**: Global platform-wide notifications with real-time unread badge tracking.

---

## 🏗️ System Architecture

```
                  ┌─────────────────────────────────────────┐
                  │   Client Layer (HTML5, Tailwind, JS)    │
                  └────────────────────┬────────────────────┘
                                       │ HTTP / REST APIs
                                       ▼
                  ┌─────────────────────────────────────────┐
                  │    Express Backend API (Port 5000)      │
                  └─────────┬───────────────────┬───────────┘
                            │                   │ Proxy ML Requests
                            ▼                   ▼
                  ┌───────────────────┐   ┌───────────────────────────┐
                  │ MongoDB Database  │   │ FastAPI ML Service (8000) │
                  └───────────────────┘   └─────────────┬─────────────┘
                                                        │
                                                        ▼
                                          ┌───────────────────────────┐
                                          │ Google Gemini LLM & PyPDF │
                                          └───────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Vanilla HTML5, TailwindCSS (Compiled output), Vanilla JavaScript, FontAwesome Icons |
| **Backend Core** | Node.js, Express.js, Mongoose ORM, HttpOnly JWT Cookies, Bcrypt |
| **Database** | MongoDB / MongoDB Atlas |
| **AI / ML Service** | Python 3.10+, FastAPI, Uvicorn, Google Generative AI (Gemini), PyPDF |
| **Services** | Razorpay (Payments), Nodemailer (SMTP OTP), Cloudinary (CDN Storage) |

---

## 🚀 Quick Start Guide

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Python](https://www.python.org/) (v3.10+)
- [MongoDB](https://www.mongodb.com/) (Local or Atlas URI)
- [Google Gemini API Key](https://aistudio.google.com/)

---

### Step 1: Clone Repository
```bash
git clone https://github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub.git
cd EduStack--Your-Ultimate-Computer-Science-Hub
```

---

### Step 2: Configure & Start Express Backend
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/edustack
JWT_SECRET=your_super_secret_jwt_key
ML_SERVICE_URL=http://localhost:8000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
RAZORPAY_KEY_ID=your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
```

Start the Node backend:
```bash
npm run dev
```

---

### Step 3: Configure & Start Python ML Microservice
```bash
cd ../ml_services
python -m venv venv

# Windows
.\venv\Scripts\activate
# Linux / macOS
source venv/bin/activate

pip install -r requirements.txt
```

Create `ml_services/.env`:
```env
PORT=8000
GEMINI_API_KEY=your_google_gemini_api_key
```

Start the FastAPI microservice:
```bash
uvicorn main:app --reload --port 8000
```

---

### Step 4: Access Application
- 🌐 **Web App**: Open `http://localhost:5000` (or serve `client/index.html`)
- 📄 **Interactive Swagger API Docs**: `http://localhost:8000/docs`
- 💚 **ML Service Health Check**: `http://localhost:8000/health`

---

## 📡 REST API Endpoint Summary

### Auth (`/api/auth`)
- `POST /api/auth/register` — User signup
- `POST /api/auth/login` — Authentication & HttpOnly JWT cookie set
- `POST /api/auth/logout` — Terminate session cookie
- `GET  /api/auth/me` — Profile details
- `POST /api/auth/send-otp` — Trigger Nodemailer email OTP
- `POST /api/auth/verify-otp` — Validate 6-digit OTP

### AI Microservice (`/api/ai`)
- `POST /api/ai/ask` — Context-aware RAG AI Tutor answer
- `POST /api/ai/generate-pyq` — Exam question & solution generator
- `POST /api/ai/pdf/summarize` — Upload PDF for executive summary
- `POST /api/ai/pdf/generate-quiz` — Upload PDF for dynamic MCQ quiz

---

## 📝 License
Distributed under the MIT License. Built with ♥ by **Shubham Kumar** for the student community.
