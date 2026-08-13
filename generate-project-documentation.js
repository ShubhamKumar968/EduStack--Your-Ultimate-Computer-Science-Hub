'use strict';
// ================================================================
// EduStack Enterprise Project Documentation Generator
// Complete Technical Specification & Architectural Manual
// Output: EduStack_Complete_Project_Documentation.pdf
// Run: node generate-project-documentation.js
// ================================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'EduStack_Complete_Project_Documentation.pdf');
const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 20, left: 50, right: 50 }, bufferPages: true });
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const ML = 50, MR = 545, MB = 770, TW = 495;
const C = {
  brand: '#1a5276', accent: '#2471a3', dark: '#1c2833', gray: '#4a5568',
  light: '#718096', green: '#1e8449', greenSoft: '#d5f5e3', amber: '#b7950b',
  purple: '#7d3c98', teal: '#148f77', border: '#d5d8dc', codeBg: '#0d1117',
  codeText: '#7ee787', white: '#ffffff', offWhite: '#f8f9fa', rowAlt: '#eaf2ff',
};

function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/—/g, ' - ').replace(/–/g, ' - ')
    .replace(/’/g, "'").replace(/‘/g, "'")
    .replace(/“/g, '"').replace(/”/g, '"')
    .replace(/•/g, '-').replace(/●/g, '-')
    .replace(/→/g, '->').replace(/←/g, '<-')
    .replace(/✓/g, '[OK]').replace(/❌/g, '[X]')
    .replace(/₹/g, 'Rs.');
}

let _pg = 0;
function newPage() { if (_pg === 0) { _pg++; return; } if (doc.y > 60) { doc.addPage(); _pg++; } }
function ensureSpace(n) { if ((MB - doc.y) < n) { doc.addPage(); _pg++; } }
function gap(n) { doc.moveDown(n || 0.3); }
function hr(col) { doc.moveTo(ML, doc.y + 2).lineTo(MR, doc.y + 2).strokeColor(col || C.border).lineWidth(0.6).stroke(); gap(0.4); }

function sectionBanner(num, title, subtitle, col) {
  col = col || C.brand; newPage();
  doc.rect(0, 0, 595, 12).fill(col); gap(2);
  doc.rect(ML, doc.y, TW, 2).fill(col); gap(0.3);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(col).text('CHAPTER ' + num, { align: 'center' });
  doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(title), { align: 'center' });
  if (subtitle) { gap(0.2); doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(cleanText(subtitle), { align: 'center' }); }
  doc.rect(ML, doc.y + 6, TW, 2).fill(col); gap(0.6);
}

function h1(text, col) {
  col = col || C.brand; ensureSpace(30); gap(0.4);
  const y0 = doc.y;
  doc.rect(ML, y0, TW, 22).fill(col);
  doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.white).text('  ' + cleanText(text), ML + 6, y0 + 5, { width: TW - 12, lineBreak: false });
  doc.y = y0 + 22; gap(0.35);
}

function h2(text, col) {
  col = col || C.dark; ensureSpace(22); gap(0.3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(col).text(cleanText(text));
  doc.moveTo(ML, doc.y + 1).lineTo(MR, doc.y + 1).strokeColor(col).lineWidth(0.8).stroke(); gap(0.25);
}

function P(text) {
  if (!text || !text.trim()) return; ensureSpace(14);
  doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(cleanText(text), { lineGap: 3, align: 'justify' }); gap(0.25);
}

function bullets(items) {
  items.forEach(function(item) {
    ensureSpace(14); const y0 = doc.y;
    doc.circle(ML + 6, y0 + 5, 2.2).fill(C.brand);
    const txt = cleanText(item); const ci = txt.indexOf(':');
    if (ci > 0 && ci < 65) {
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.dark).text(txt.slice(0, ci), ML + 16, y0, { continued: true, lineGap: 2.5 });
      doc.font('Helvetica').fillColor(C.gray).text(txt.slice(ci), { lineGap: 2.5 });
    } else {
      doc.fontSize(8.8).font('Helvetica').fillColor(C.gray).text(txt, ML + 16, y0, { lineGap: 2.5 });
    }
    gap(0.15);
  });
  gap(0.2);
}

function CODE(text, lang) {
  const arr = cleanText(text).split('\n'); const lh = 10.5, pad = 6, MAX = 36;
  for (let s = 0; s < arr.length; s += MAX) {
    const chunk = arr.slice(s, s + MAX); const ch = chunk.length * lh + pad * 2 + 12;
    ensureSpace(ch + 8); const y0 = doc.y;
    doc.rect(ML, y0, TW, 12).fill('#161b22');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#58a6ff').text('  ' + (lang || 'EduStack Codebase Specification'), ML + 4, y0 + 2, { lineBreak: false });
    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    chunk.forEach(function(line, i) {
      let lc = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lc = '#8b949e';
      else if (/\b(const|let|var|function|class|return|if|else|async|await|new|def|import|from)\b/.test(line)) lc = '#ff7b72';
      else if (/\b(require|module|exports|process|Promise|Buffer|crypto|jwt|bcrypt)\b/.test(line)) lc = '#79c0ff';
      else if (/\b(app\.|router\.|doc\.|res\.|req\.|user\.|schema\.)\b/.test(line)) lc = '#d2a8ff';
      doc.fontSize(8).font('Courier').fillColor(lc).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
    });
    doc.y = y0 + ch; gap(0.35);
  }
}

function infoBox(label, text, col, bg) {
  col = col || C.accent; bg = bg || '#ebf5fb'; ensureSpace(35);
  const bh = doc.fontSize(8.5).font('Helvetica').heightOfString(cleanText(text), { width: TW - 28, lineGap: 2 }) + 16;
  const y0 = doc.y;
  doc.rect(ML, y0, 5, bh).fill(col); doc.rect(ML + 5, y0, TW - 5, bh).fill(bg);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(col).text(label + ': ', ML + 14, y0 + 8, { continued: true, lineGap: 2 });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(text), { lineGap: 2 });
  doc.y = y0 + bh; gap(0.35);
}

function TABLE(headers, rows, widths) {
  if (!widths) widths = []; if (!widths.length) { const w = Math.floor(TW / headers.length); headers.forEach(function() { widths.push(w); }); }
  let maxHH = 20;
  headers.forEach(function(h, i) { const hh = doc.fontSize(8.5).font('Helvetica-Bold').heightOfString(cleanText(h), { width: widths[i] - 8 }) + 10; if (hh > maxHH) maxHH = hh; });
  ensureSpace(maxHH + 10); const hy = doc.y; doc.rect(ML, hy, TW, maxHH).fill(C.brand);
  let hx = ML; headers.forEach(function(h, i) { doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white).text(cleanText(h), hx + 4, hy + 5, { width: widths[i] - 8, lineGap: 1 }); hx += widths[i]; });
  doc.y = hy + maxHH;
  rows.forEach(function(row, ri) {
    let maxRH = 16; row.forEach(function(cell, ci) { const rh = doc.fontSize(8).font('Helvetica').heightOfString(cleanText(String(cell)), { width: widths[ci] - 8, lineGap: 1.5 }) + 8; if (rh > maxRH) maxRH = rh; });
    ensureSpace(maxRH); const ry = doc.y;
    if (ri % 2 === 0) doc.rect(ML, ry, TW, maxRH).fill(C.offWhite);
    let rx = ML; row.forEach(function(cell, ci) { doc.fontSize(8).font('Helvetica').fillColor(C.gray).text(cleanText(String(cell)), rx + 4, ry + 4, { width: widths[ci] - 8, lineGap: 1.5 }); rx += widths[ci]; });
    doc.moveTo(ML, ry + maxRH).lineTo(MR, ry + maxRH).strokeColor(C.border).lineWidth(0.3).stroke(); doc.y = ry + maxRH;
  });
  gap(0.4);
}

// COVER PAGE
newPage();
doc.rect(0, 0, 595, 14).fill(C.brand); gap(3);
doc.fontSize(36).font('Helvetica-Bold').fillColor(C.brand).text('EduStack Enterprise', { align: 'center' });
gap(0.1);
doc.fontSize(13).font('Helvetica').fillColor(C.dark).text('Complete Technical Project Documentation & Architecture Blueprint', { align: 'center' });
gap(0.5); doc.moveTo(120, doc.y).lineTo(475, doc.y).strokeColor(C.border).lineWidth(1.5).stroke(); gap(0.5);
doc.fontSize(11).font('Helvetica-Bold').fillColor(C.accent).text('Your Ultimate Computer Science & Engineering Hub', { align: 'center' });
doc.fontSize(9).font('Helvetica').fillColor(C.light).text('Full Stack Software Architecture | Node.js Express | Python FastAPI | MongoDB | Security | AI Engine', { align: 'center' });
gap(1.5);
const bx = doc.y;
doc.rect(60, bx, 475, 185).fill(C.offWhite); doc.rect(60, bx, 6, 185).fill(C.brand);
[['Project Name','EduStack -- Your Ultimate Computer Science Hub'],
 ['Developer','Shubham Kumar  |  CSE Student  |  NIT Patna'],
 ['Repository','github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub'],
 ['Primary Runtime','Node.js 18 LTS + Express.js 4 (REST API Monolith)'],
 ['Microservice','Python 3.11 + FastAPI + Uvicorn (AI / ML RAG Service)'],
 ['Database Layer','MongoDB Atlas Managed Cluster + Mongoose 7 ODM'],
 ['Security Engine','Stateless JWT httpOnly Cookies, bcrypt-12, Helmet, NoSQL Sanitize'],
 ['Cloud Deployment','Render.com Web Services + Cloudinary CDN Media Storage']
].forEach(function(r, i) {
  const iy = bx + 12 + (i * 21);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.brand).text(cleanText(r[0]) + ':', 72, iy, { width: 100, lineBreak: false });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(r[1]), 175, iy, { width: 350, lineBreak: false });
});
doc.y = bx + 195; gap(1.8);
doc.fontSize(8).font('Helvetica').fillColor(C.light).text('Official Technical Documentation  |  Generated for EduStack Repository', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// TOC
newPage();
doc.rect(0, 0, 595, 12).fill(C.brand); gap(0.8);
doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents - System Documentation'); hr(C.brand);
[['1','Executive Summary & System Vision','Platform problem statement, core capabilities, engineering goals'],
 ['2','System Architecture & Hybrid Infrastructure','Node.js monolith + Python FastAPI microservice proxy architecture'],
 ['3','Codebase Directory & Module Walkthrough','Complete folder structure breakdown of server/, client/, and ml_services/'],
 ['4','Stateless Security Engine & Authentication','Dual auth (Local + Google OAuth 2.0), JWT httpOnly cookies, bcrypt-12'],
 ['5','Database Design & Complete Mongoose Schemas','User, OTP TTL, Subject, Resource, Payment, and Notification models'],
 ['6','REST API Specification & Route Reference','Complete endpoint reference guide with payload structures'],
 ['7','Python AI / ML Microservice & RAG Engine','FastAPI ASGI server, Google Gemini 1.5/2.0 Flash, LightRAG, PDF parser'],
 ['8','Razorpay Payment Gateway & Cryptography','3-step payment lifecycle, HMAC-SHA256 verification, timingSafeEqual'],
 ['9','Cloud Deployment & Production Setup','Render.com, MongoDB Atlas, Cloudinary zero-disk upload, env setup'],
 ['10','Maintenance, Troubleshooting & Operational Playbook','Monitoring, error logging, database backups, disaster recovery'],
].forEach(function(r) {
  ensureSpace(28); const y0 = doc.y;
  doc.rect(ML, y0, TW, 24).fill(C.offWhite); doc.rect(ML, y0, 4, 24).fill(C.brand);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.brand).text(r[0] + '.', ML + 10, y0 + 4, { width: 25, lineBreak: false });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(r[1]), ML + 36, y0 + 4, { width: 310, lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(C.gray).text(cleanText(r[2]), ML + 36, y0 + 14, { width: 420, lineBreak: false });
  doc.y = y0 + 26;
});

// CHAPTER 1
sectionBanner('1', 'Executive Summary & System Vision',
  'Platform problem statement, core capabilities, engineering goals, and domain vision', C.brand);
h1('1.1  The Problem Space', C.brand);
P('Computer science and engineering education suffers from severe content fragmentation. Previous year exam papers, lecture notes, syllabus blueprints, and competitive programming trackers are scattered across unindexed drives, social media channels, and static websites.');
P('EduStack was engineered as a single unified platform providing academic subjects, organized semester resources, a live competitive DSA problem tracker, an automated AI exam paper tutor, and transactional premium subscriptions.');

h2('Core Platform Features');
bullets([
  'Subject Catalog Engine: Manages 42+ CS subjects categorized by semester with Mongoose schemas, code indexing, and virtual populations.',
  'Resource Repository: Categorized notes, question papers, and lab manuals streamed directly to Cloudinary CDN.',
  'DSA Competitive Tracker: 450+ hand-curated competitive programming problems synced live from a published Google Sheet CSV with an in-memory 5-minute TTL cache and local JSON fallback.',
  'AI Exam Tutor & RAG Engine: Python FastAPI microservice powered by Google Gemini 1.5/2.0 Flash and LightRAG for grounded Q&A and PDF text extraction.',
  'Stateless Security Engine: Dual auth system (Local Email/Password + Google OAuth 2.0) issuing JWTs stored exclusively in httpOnly, Secure cookies.',
  'Transactional Payments: Razorpay payment gateway integration with server-side order creation and HMAC-SHA256 constant-time signature verification.',
]);

// CHAPTER 2
sectionBanner('2', 'System Architecture & Hybrid Infrastructure',
  'Node.js Express monolith + Python FastAPI microservice gateway architecture', C.accent);
h1('2.1  Architectural Overview', C.accent);
P('EduStack utilizes a deliberate hybrid architecture combining the rapid non-blocking I/O of Node.js for web endpoints with the specialized AI/ML capabilities of Python FastAPI.');

TABLE(
  ['Component', 'Technology Stack', 'Responsibility', 'Deployment Unit'],
  [
    ['Web Monolith', 'Node.js 18 LTS + Express.js 4', 'REST APIs, auth, routing, database CRUD, payment logic', 'Render.com Web Service'],
    ['AI Microservice', 'Python 3.11 + FastAPI + Uvicorn', 'Gemini AI inference, RAG retrieval, PDF text extraction', 'Render.com Web Service (Internal)'],
    ['Database Layer', 'MongoDB Atlas M0 Managed Cluster', 'Persistent storage for users, subjects, resources, payments', 'MongoDB Atlas Cloud'],
    ['Media Storage', 'Cloudinary Media API', 'CDN storage for user avatars and PDF resource documents', 'Cloudinary Global CDN'],
  ],
  [90, 130, 160, 115]
);

CODE(
'// HTTP Proxy Gateway Pattern in server/routes/aiRoutes.js\n' +
'// Browser communicates ONLY with Node.js. Node.js proxies AI requests to Python microservice.\n' +
'const ML_SERVICE_URL = process.env.ML_SERVICE_URL || "http://localhost:8000";\n' +
'\n' +
'router.use(isAuth);          // 1. Verify user JWT token\n' +
'router.use(aiRateLimiter);   // 2. Apply rate limit (30 req / 10 min per IP)\n' +
'\n' +
'router.post("/generate-pyq", async (req, res, next) => {\n' +
'  try {\n' +
'    const response = await axios.post(`${ML_SERVICE_URL}/api/rag/generate-pyq`, req.body);\n' +
'    return res.status(response.status).json(response.data);\n' +
'  } catch (err) {\n' +
'    return res.status(503).json({ success: false, message: "AI Microservice Offline." });\n' +
'  }\n' +
'});'
);

// CHAPTER 3
sectionBanner('3', 'Codebase Directory & Module Walkthrough',
  'Complete file structure breakdown of server/, client/, and ml_services/', C.teal);
h1('3.1  Directory Structure', C.teal);
CODE(
'EduStack/\n' +
'├── server/                      # Node.js Express Backend Monolith\n' +
'│   ├── app.js                   # Application entry point & middleware registration\n' +
'│   ├── config/                  # DB, Passport, and Cloudinary configuration\n' +
'│   ├── controllers/             # Route controllers (auth, subject, payment, etc.)\n' +
'│   ├── middlewares/             # isAuth, requireRole, errorHandler, rateLimiter\n' +
'│   ├── models/                  # Mongoose models (User, Subject, Resource, Payment, OTP)\n' +
'│   ├── routes/                  # Express API routers (/api/auth, /api/subjects, etc.)\n' +
'│   ├── services/                # Business logic (mailService, razorpayService)\n' +
'│   └── utils/                   # asyncHandler, apiResponse, generateToken\n' +
'├── client/                      # Vanilla JS Single Page Application\n' +
'│   ├── assets/                  # Stylesheets, JS Partial components, images\n' +
'│   └── index.html               # Main frontend interface\n' +
'├── ml_services/                 # Python FastAPI AI Microservice\n' +
'│   ├── main.py                  # FastAPI app & Gemini API endpoints\n' +
'│   └── requirements.txt         # Python dependencies (fastapi, google-generativeai)\n' +
'└── generate-part1.js            # Masterclass PDF Generators (Part 1 to Part 4)'
);

// CHAPTER 4
sectionBanner('4', 'Stateless Security Engine & Authentication',
  'Dual authentication (Local + Google OAuth 2.0), JWT httpOnly cookies, bcrypt-12', C.purple);
h1('4.1  Stateless Security Pipeline', C.purple);
P('EduStack implements OWASP-compliant stateless security storing JWTs exclusively in httpOnly, Secure, SameSite cookies to protect tokens against Cross-Site Scripting (XSS) theft.');

TABLE(
  ['Security Mechanism', 'Implementation Detail', 'Vulnerability Prevented'],
  [
    ['httpOnly Cookies', 'Token set via Set-Cookie header with httpOnly:true', 'Cross-Site Scripting (XSS) token theft'],
    ['bcrypt 12 Rounds', '4096 salt rounds iteration (~300ms hash time)', 'GPU brute-force & Rainbow table attacks'],
    ['mongoSanitize', 'Strips $ and . characters from req.body/params/query', 'NoSQL Operator Injection attacks'],
    ['Helmet Headers', 'Attaches 15+ HTTP security headers (HSTS, Clickjacking)', 'Clickjacking, MIME-sniffing, SSL stripping'],
    ['timingSafeEqual', 'Constant-time buffer comparison for Razorpay HMAC', 'Timing side-channel key recovery attacks'],
  ],
  [115, 185, 195]
);

CODE(
'// JWT Generation & Cookie Attachment in server/utils/generateToken.js\n' +
'const generateToken = (res, userId) => {\n' +
'  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "7d" });\n' +
'  res.cookie("edustack_token", token, {\n' +
'    httpOnly: true,\n' +
'    secure: process.env.NODE_ENV === "production",\n' +
'    sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",\n' +
'    maxAge: 7 * 24 * 60 * 60 * 1000\n' +
'  });\n' +
'  return token;\n' +
'};'
);

// CHAPTER 5
sectionBanner('5', 'Database Design & Complete Mongoose Schemas', 'User, OTP TTL, Subject, Resource, Payment, and Notification models', C.green);
h1('5.1  Database Schema Schematics', C.green);
P('MongoDB Atlas manages data using 6 primary Mongoose schemas:');
bullets([
  'User Schema: Manages credentials, hashed password (select: false), role enum ("user", "student", "contributor", "admin"), verification status, and premium subscription state.',
  'OTP Schema: Managed with MongoDB TTL Index ({ createdAt: 1 }, { expireAfterSeconds: 600 }) for automatic 10-minute code expiration.',
  'Subject Schema: CS subjects indexed by semester and subject code with virtual references to attached resources.',
  'Resource Schema: Study documents, notes, and previous year papers linked to subjects with Cloudinary CDN URLs.',
  'Payment Schema: Tracks Razorpay orders, payment IDs, signature hashes, and payment verification status.',
  'Notification Schema: System-wide alerts and user notifications.',
]);

CODE(
'// server/models/user.js - User Schema Blueprint\n' +
'const userSchema = new mongoose.Schema({\n' +
'  name: { type: String, required: true, trim: true },\n' +
'  email: { type: String, required: true, unique: true, lowercase: true, trim: true },\n' +
'  password: { type: String, required: true, select: false },\n' +
'  role: { type: String, enum: ["user", "student", "contributor", "admin"], default: "user" },\n' +
'  isVerified: { type: Boolean, default: false },\n' +
'  isPremium: { type: Boolean, default: false },\n' +
'  avatar: { type: String, default: "" }\n' +
'}, { timestamps: true });'
);

// CHAPTER 6
sectionBanner('6', 'REST API Specification & Route Reference', 'Complete endpoint reference guide with payload structures and HTTP status codes', C.brand);
TABLE(
  ['Method', 'Endpoint', 'Auth Required', 'Description'],
  [
    ['POST', '/api/auth/register', 'None', 'Register new user account with email normalization and avatar upload'],
    ['POST', '/api/auth/verify-otp', 'None', 'Verify 6-digit email OTP and activate user account'],
    ['POST', '/api/auth/login', 'None', 'Authenticate user and set httpOnly JWT cookie'],
    ['GET', '/api/auth/me', 'isAuth', 'Get current authenticated user profile'],
    ['GET', '/api/subjects', 'isAuth', 'List all computer science subjects categorized by semester'],
    ['POST', '/api/subjects', 'isAuth + Admin', 'Create new subject entry (Admin only)'],
    ['POST', '/api/ai/generate-pyq', 'isAuth + RateLimit', 'Generate AI exam paper answers via Python FastAPI microservice'],
    ['POST', '/api/payments/create-order', 'isAuth', 'Initialize Razorpay payment order for Premium upgrade'],
    ['POST', '/api/payments/verify', 'isAuth', 'Verify Razorpay HMAC signature and activate Premium status'],
  ],
  [45, 140, 90, 220]
);

// CHAPTER 7
sectionBanner('7', 'Python AI / ML Microservice & RAG Engine', 'FastAPI ASGI server, Google Gemini 1.5/2.0 Flash, LightRAG, PDF text extraction', C.purple);
P('The AI engine runs in an isolated Python FastAPI container utilizing Google Gemini API and LightRAG for context-grounded educational tutoring.');
CODE(
'# ml_services/main.py - Python FastAPI AI Microservice\n' +
'from fastapi import FastAPI, HTTPException\n' +
'import google.generativeai as genai\n' +
'\n' +
'app = FastAPI(title="EduStack AI Engine")\n' +
'\n' +
'@app.post("/api/rag/generate-pyq")\n' +
'async def generate_pyq(payload: dict):\n' +
'    prompt = payload.get("prompt")\n' +
'    if not prompt:\n' +
'        raise HTTPException(status_code=400, detail="Prompt is required")\n' +
'    model = genai.GenerativeModel("gemini-1.5-flash")\n' +
'    response = await model.generate_content_async(prompt)\n' +
'    return {"success": True, "data": response.text}'
);

// CHAPTER 8
sectionBanner('8', 'Razorpay Payment Gateway & Cryptography', '3-step payment lifecycle, HMAC-SHA256 verification, timingSafeEqual constant-time check', C.amber);
CODE(
'// server/services/razorpayService.js - Payment Signature Verification\n' +
'const crypto = require("crypto");\n' +
'\n' +
'const verifySignature = (orderId, paymentId, signature) => {\n' +
'  const expected = crypto\n' +
'    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)\n' +
'    .update(`${orderId}|${paymentId}`)\n' +
'    .digest("hex");\n' +
'\n' +
'  return crypto.timingSafeEqual(\n' +
'    Buffer.from(expected, "hex"),\n' +
'    Buffer.from(signature, "hex")\n' +
'  );\n' +
'};'
);

// CHAPTER 9
sectionBanner('9', 'Cloud Deployment & Production Setup', 'Render.com web services, MongoDB Atlas, Cloudinary zero-disk upload, env setup', C.dark);
bullets([
  'Render.com Deployment: Node.js web service running app.js with environment variables set in Render dashboard.',
  'MongoDB Atlas: Production M0/M10 managed MongoDB cluster with IP access rules.',
  'Cloudinary CDN: Zero-disk RAM buffer streaming via Multer memoryStorage and cloudinary.uploader.upload_stream().',
  'Environment Variables: JWT_SECRET, MONGO_URI, RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET, CLOUDINARY_URL, ML_SERVICE_URL, ADMIN_EMAILS.',
]);

// CHAPTER 10
sectionBanner('10', 'Maintenance, Troubleshooting & Operational Playbook', 'Monitoring, log management, error recovery, and operational procedures', C.brand);
bullets([
  'Morgan HTTP Logging: morgan("combined") outputs Apache standard request logs for production auditing.',
  'Unhandled Exceptions: process.on("unhandledRejection") logs error and gracefully shuts down HTTP server before exiting.',
  'Health Check Endpoint: GET /health returns DB connection state and microservice connectivity for Render uptime checks.',
]);

// FOOTER
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text('EduStack Technical Documentation  |  Page ' + (fp + 1) + ' of ' + range.count + '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 });
  }
}
doc.end();
stream.on('finish', function() {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n✅  PROJECT DOCUMENTATION PDF generated successfully!');
  console.log('📄  File:', OUT);
  console.log('📊  Exact Pages:', range.count, '| Size:', kb, 'KB\n');
});
