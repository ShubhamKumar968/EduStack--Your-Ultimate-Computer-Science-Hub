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
  brand: '#1a5276', brandDark: '#154360', accent: '#2471a3', accentSoft: '#aed6f1',
  dark: '#1c2833', gray: '#4a5568', light: '#718096', green: '#1e8449', greenSoft: '#d5f5e3',
  amber: '#b7950b', amberSoft: '#fef9e7', purple: '#7d3c98', purpleSoft: '#e8daef',
  teal: '#148f77', tealSoft: '#d1f2eb', border: '#d5d8dc', codeBg: '#0d1117',
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
    .replace(/⚠️/g, '[!]').replace(/₹/g, 'Rs.')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '');
}

let _pg = 0;
function newPage() { if (_pg === 0) { _pg++; return; } doc.addPage(); _pg++; }
function ensureSpace(n) { if ((MB - doc.y) < n) { doc.addPage(); _pg++; } }
function gap(n) { doc.moveDown(n || 0.3); }
function hr(col) { doc.moveTo(ML, doc.y + 2).lineTo(MR, doc.y + 2).strokeColor(col || C.border).lineWidth(0.6).stroke(); gap(0.4); }

function sectionBanner(num, title, subtitle, col) {
  col = col || C.brand; newPage();
  doc.rect(0, 0, 595, 12).fill(col); gap(2);
  doc.rect(ML, doc.y, TW, 2).fill(col); gap(0.3);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(col).text('CHAPTER ' + num, { align: 'center' });
  doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(title), { align: 'center' });
  if (subtitle) { gap(0.2); doc.fontSize(8.5).font('Helvetica').fillColor(C.gray).text(cleanText(subtitle), { align: 'center' }); }
  doc.rect(ML, doc.y + 6, TW, 2).fill(col); gap(0.6);
}

function h1(text, col) {
  col = col || C.brand; ensureSpace(30); gap(0.4);
  const y0 = doc.y; doc.rect(ML, y0, TW, 22).fill(col);
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

function bullets(items, col) {
  col = col || C.gray;
  items.forEach(function(item) {
    ensureSpace(14); const y0 = doc.y;
    doc.circle(ML + 6, y0 + 5, 2.2).fill(C.brand);
    const txt = cleanText(item); const ci = txt.indexOf(':');
    if (ci > 0 && ci < 65) {
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.dark).text(txt.slice(0, ci), ML + 16, y0, { continued: true, lineGap: 2.5 });
      doc.font('Helvetica').fillColor(col).text(txt.slice(ci), { lineGap: 2.5 });
    } else {
      doc.fontSize(8.8).font('Helvetica').fillColor(col).text(txt, ML + 16, y0, { lineGap: 2.5 });
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
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#58a6ff').text('  ' + (lang || 'JavaScript / Node.js / Python'), ML + 4, y0 + 2, { lineBreak: false });
    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    chunk.forEach(function(line, i) {
      let lc = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lc = '#8b949e';
      else if (/\b(const|let|var|function|class|return|if|else|async|await|new|def|import|from)\b/.test(line)) lc = '#ff7b72';
      else if (/\b(require|module|exports|process|Promise|Buffer|crypto|jwt|bcrypt|mongoose|app|router)\b/.test(line)) lc = '#79c0ff';
      else if (line.includes('"') || line.includes("'") || line.includes('`')) lc = '#a5d6ff';
      doc.fontSize(8).font('Courier').fillColor(lc).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
    });
    doc.y = y0 + ch; gap(0.35);
  }
}

function DIAGRAM_BOXES(title, steps) {
  ensureSpace(steps.length * 26 + 35); const y0 = doc.y;
  doc.rect(ML, y0, TW, 16).fill(C.accent);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white).text('  FLOW: ' + cleanText(title), ML + 6, y0 + 4, { lineBreak: false });
  let curY = y0 + 22;
  steps.forEach(function(step, idx) {
    ensureSpace(24);
    doc.rect(ML + 10, curY, TW - 20, 20).fillAndStroke('#ebf5fb', C.accent);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(step.label), ML + 18, curY + 5, { width: TW - 36, lineBreak: false });
    curY += 20;
    if (idx < steps.length - 1) {
      doc.moveTo(ML + TW / 2, curY).lineTo(ML + TW / 2, curY + 6).strokeColor(C.accent).lineWidth(1.5).stroke();
      doc.polygon([ML + TW / 2 - 3, curY + 6], [ML + TW / 2 + 3, curY + 6], [ML + TW / 2, curY + 9]).fill(C.accent);
      curY += 10;
    }
  });
  doc.y = curY + 6; gap(0.35);
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

function QA(num, q, ans, details) {
  ensureSpace(60); const y0 = doc.y;
  const qTxt = 'Q' + num + ':  ' + cleanText(q);
  const qh = doc.heightOfString(qTxt, { width: TW - 16, lineGap: 2, font: 'Helvetica-Bold', fontSize: 8.8 }) + 12;
  doc.rect(ML, y0, TW, qh).fill(C.rowAlt); doc.rect(ML, y0, 4, qh).fill(C.accent);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.accent).text(qTxt, ML + 10, y0 + 6, { width: TW - 20, lineGap: 2 });
  doc.y = y0 + qh + 2;
  ensureSpace(20);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.green).text('  Answer:');
  doc.fontSize(8.8).font('Helvetica').fillColor(C.gray).text(cleanText(ans), { lineGap: 2.5, indent: 10 });
  gap(0.1);
  if (details && details.length > 0) {
    details.forEach(function(pt) { ensureSpace(12); doc.fontSize(8.3).font('Helvetica').fillColor(C.dark).text('   -> ' + cleanText(pt), { lineGap: 2, indent: 8 }); });
  }
  gap(0.2);
  doc.moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor(C.border).lineWidth(0.4).stroke(); gap(0.25);
}

// ================================================================
// COVER PAGE
// ================================================================
newPage();
doc.rect(0, 0, 595, 14).fill(C.brand); gap(2.5);
doc.fontSize(36).font('Helvetica-Bold').fillColor(C.brand).text('EduStack Enterprise', { align: 'center' });
gap(0.1);
doc.fontSize(12).font('Helvetica').fillColor(C.dark).text('Complete Technical Project Documentation & Architecture Blueprint', { align: 'center' });
gap(0.4); doc.moveTo(100, doc.y).lineTo(495, doc.y).strokeColor(C.border).lineWidth(1.5).stroke(); gap(0.4);
doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.accent).text('Your Ultimate Computer Science & Engineering Hub', { align: 'center' });
doc.fontSize(8.5).font('Helvetica').fillColor(C.light).text('Full Stack Software Architecture | Node.js Express | Python FastAPI | MongoDB | Security | AI RAG Engine', { align: 'center' });
gap(1.2);
const bx = doc.y;
doc.rect(60, bx, 475, 195).fill(C.offWhite); doc.rect(60, bx, 6, 195).fill(C.brand);
[
  ['Project Name',    'EduStack — Your Ultimate Computer Science Hub'],
  ['Author & Role',   'Shubham Kumar  |  Full-Stack Developer & Architect  |  NIT Patna'],
  ['Repository',      'github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub'],
  ['Backend Core',    'Node.js 18 LTS + Express.js 4 (REST API Monolith + Static Server)'],
  ['ML Microservice', 'Python 3.11 + FastAPI + Uvicorn (Google Gemini + LightRAG)'],
  ['Database Stack',  'MongoDB Atlas Managed Cluster + Mongoose 8 ODM + connect-mongodb-session'],
  ['Security Engine', 'Stateless JWT httpOnly Cookies, bcrypt-12, Helmet, NoSQL Sanitize, Rate Limiter'],
  ['Cloud & Media',   'Render.com Web Services + Cloudinary CDN Media Storage + Nodemailer SMTP'],
  ['Version & Date',  'v1.0.0 Enterprise Production Specification — August 2026'],
].forEach(function(r, i) {
  const iy = bx + 12 + (i * 20);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.brand).text(cleanText(r[0]) + ':', 72, iy, { width: 105, lineBreak: false });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(r[1]), 180, iy, { width: 345, lineBreak: false });
});
doc.y = bx + 205; gap(1.5);
doc.fontSize(7.5).font('Helvetica').fillColor(C.light).text('Official Comprehensive Engineering Documentation & Technical Architecture Reference', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// ================================================================
// TABLE OF CONTENTS (19 Sections)
// ================================================================
newPage();
doc.rect(0, 0, 595, 12).fill(C.brand); gap(0.8);
doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents — Complete System Specification'); hr(C.brand);
[
  ['1', 'Project Overview & Problem Statement', 'Centralized academic repository, AI tutor, live DSA tracker, role access'],
  ['2', 'System Architecture & Hybrid Infrastructure', 'Node.js monolith + Python FastAPI microservice proxy architecture'],
  ['3', 'Tech Stack Deep Dive', 'Frontend, Backend, ML/AI, Databases, and Security dependencies'],
  ['4', 'Backend — Node.js + Express', '10-middleware pipeline order, asyncHandler HOF, JSON response envelope'],
  ['5', 'Database Design — MongoDB + Mongoose', 'User, OTP TTL index, Subject, Resource, Payment, and Notification schemas'],
  ['6', 'Authentication System', 'Local OTP verification, JWT httpOnly cookies, Google OAuth 2.0, isAuth'],
  ['7', 'Security Implementation', '17-layer defense in depth, HMAC timingSafeEqual, NoSQL sanitization'],
  ['8', 'Payment Gateway — Razorpay', '3-step lifecycle, server-side HMAC-SHA256 verification, fraud protection'],
  ['9', 'ML / AI Microservice — Python + FastAPI', 'Google Gemini 1.5/2.0 Flash, LightRAG retrieval, fallback models, PDF OCR'],
  ['10', 'Frontend Architecture', 'Multi-page application, partials.js engine, auth guard, CSS variables theme'],
  ['11', 'Responsiveness & UI Design', 'Breakpoints, circular avatar across all devices, dark mode, glassmorphism'],
  ['12', 'API Design Patterns', 'REST conventions, HTTP status codes, requireRole RBAC, global error handler'],
  ['13', 'Cloud Services & File Uploads', 'Multer memoryStorage + Base64 URI + Cloudinary CDN, Nodemailer SMTP'],
  ['14', 'DSA Sheet — Live Google Sheet Sync', '3-layer data strategy: memory cache, live fetch, disk JSON fallback, parser'],
  ['15', 'Notification System', 'Broadcast model with per-user readBy array & $addToSet deduplication'],
  ['16', 'Deployment Architecture', 'Render.com 2 services, trust proxy, Graceful Shutdown handlers'],
  ['17', 'Security Analysis', '13 implemented security controls and future enhancement roadmap'],
  ['18', 'Interview Q&A — Full Coverage', 'Auth, Database, ML/AI, Frontend, and System Architecture interview questions'],
  ['19', 'Summary Cheat Sheet', 'Complete multi-category reference table covering the entire EduStack stack'],
].forEach(function(r) {
  ensureSpace(24); const y0 = doc.y;
  doc.rect(ML, y0, TW, 20).fill(C.offWhite); doc.rect(ML, y0, 4, 20).fill(C.brand);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.brand).text(r[0] + '.', ML + 8, y0 + 4, { width: 22, lineBreak: false });
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(r[1]), ML + 32, y0 + 4, { width: 280, lineBreak: false });
  doc.fontSize(7.5).font('Helvetica').fillColor(C.gray).text(cleanText(r[2]), ML + 315, y0 + 5, { width: 175, lineBreak: false });
  doc.y = y0 + 22;
});

// ================================================================
// CHAPTER 1 — PROJECT OVERVIEW
// ================================================================
sectionBanner('1', 'Project Overview & Problem Statement',
  'Centralized academic repository, AI tutor, live DSA tracker, role access, and student pain points', C.brand);
h1('1.1  What is EduStack?', C.brand);
P('EduStack is a production-grade full-stack web application engineered for engineering and computer science students (primarily at NIT Patna). It resolves content fragmentation across telegram channels, unindexed Google Drive folders, Reddit threads, and scattered websites by consolidating all study resources into a secure, unified platform.');

h2('Core Platform Capabilities');
bullets([
  'Subject Repository: Curated lecture notes, previous year question papers (PYQs), and YouTube playlists organized by semester.',
  'AI Hub: Google Gemini-powered AI Exam Tutor, automated PYQ solution generator, PDF summarizer, and automated quiz generator.',
  'Premium DSA Sheet: 450+ hand-curated competitive programming problems synced live from Google Sheets with in-memory caching.',
  'Role-Based Access Control: Granular permissions for Students, Contributors, and Administrators.',
  'Razorpay Payment Gateway: Secure transactional premium subscription with HMAC-SHA256 verification (Rs.5 demo simulation).',
  'Notification Engine: System-wide admin broadcasts with per-user read state tracking using MongoDB arrays.',
  'Personalized Learning: Favourites, subject enrollments, and customized multi-accent themes (36 combinations).',
]);

// ================================================================
// CHAPTER 2 — SYSTEM ARCHITECTURE
// ================================================================
sectionBanner('2', 'System Architecture & Hybrid Infrastructure',
  'Node.js Express monolith + Python FastAPI microservice proxy architecture', C.accent);
h1('2.1  Architectural Topology', C.accent);
P('EduStack uses a deliberate hybrid architecture: a Node.js Express monolith handles all core business logic (auth, subjects, resources, payments, DSA sheet), while a separate Python FastAPI microservice handles AI/ML processing. This is a common production pattern at companies like Stripe, Shopify, and Flipkart.');

DIAGRAM_BOXES('EduStack Request Flow Topology', [
  { label: 'Client Browser (HTML5 + Vanilla JS + TailwindCSS) sends HTTP requests to Node.js Server on port 3000' },
  { label: 'Express Middleware Pipeline: helmet -> cors -> express.json -> cookieParser -> morgan -> mongoSanitize -> session -> passport' },
  { label: 'isAuth Middleware: verifies JWT from httpOnly cookie / Bearer header, validates user against MongoDB Atlas' },
  { label: 'Core REST Controllers: CRUD operations on MongoDB Atlas models (Users, Subjects, Resources, Payments, OTPs)' },
  { label: 'AI Proxy Gateway (aiRoutes.js): Node.js authenticates & rate-limits, then proxies to Python FastAPI ML Microservice (port 8000)' },
  { label: 'Python ML Service: Google Gemini 1.5/2.0 Flash + LightRAG engine + pypdf OCR generates context-grounded AI responses' },
]);

// ================================================================
// CHAPTER 3 — TECH STACK DEEP DIVE
// ================================================================
sectionBanner('3', 'Tech Stack Deep Dive',
  'Frontend, Backend, ML/AI, Databases, and Security dependencies', C.purple);
h1('3.1  Technology Matrix', C.purple);
TABLE(
  ['Layer', 'Technology', 'Role & Rationale'],
  [
    ['Frontend UI', 'HTML5 + Vanilla JS + TailwindCSS', 'Zero framework overhead, instant initial loads, full DOM control without complex build chains'],
    ['Icons & Fonts', 'Font Awesome 6 + Google Fonts Outfit/Inter', 'Clean typography, responsive icons via CDN'],
    ['Backend Runtime', 'Node.js 18 LTS + Express.js 4', 'Single-threaded async I/O capable of handling 10,000+ concurrent connections efficiently'],
    ['Database Layer', 'MongoDB Atlas + Mongoose 8 ODM', 'Flexible BSON document schemas, auto-timestamps, TTL indexes, and virtual fields'],
    ['Auth & Security', 'JWT + bcryptjs (12 rounds) + Passport.js', 'Stateless tokens in httpOnly cookies + Google OAuth 2.0 Authorization Code Grant'],
    ['Payment System', 'Razorpay SDK + Node Crypto', 'HMAC-SHA256 signature verification with timingSafeEqual fraud prevention'],
    ['Media & CDN', 'Multer + Cloudinary CDN', 'Memory storage buffer to base64 URI direct CDN streaming without server disk consumption'],
    ['AI / ML Engine', 'Python 3.11 + FastAPI + Uvicorn + Gemini', 'Google Gemini 1.5/2.0 Flash + LightRAG store + pypdf dual-strategy PDF OCR'],
    ['Deployment', 'Render.com Web Services (2 services)', 'Independent scaling of Node.js API and Python ML worker with auto-HTTPS and trust proxy'],
  ],
  [85, 160, 250]
);

// ================================================================
// CHAPTER 4 — BACKEND NODE.JS + EXPRESS
// ================================================================
sectionBanner('4', 'Backend — Node.js + Express Architecture',
  '10-middleware pipeline order, asyncHandler HOF, JSON response envelope', C.teal);
h1('4.1  Middleware Pipeline Order (Order Matters)', C.teal);
bullets([
  '1. helmet({ contentSecurityPolicy: false }): Security headers on ALL responses before any data is sent.',
  '2. cors({ origin: fn, credentials: true }): CORS preflight (OPTIONS) requests handled before body parsing.',
  '3. app.set("trust proxy", 1): Enables X-Forwarded-For header trust from Render.com load balancer for accurate rate limiting and session cookies.',
  '4. express.urlencoded({ extended: true }): Parses URL-encoded form submissions.',
  '5. express.json({ limit: "1mb" }): Parses JSON body with 1MB ceiling preventing large payload DoS attacks.',
  '6. cookieParser(): Populates req.cookies before authentication checks.',
  '7. morgan("combined" / "dev"): HTTP access logger registered after body parser to log payload sizes.',
  '8. mongoSanitize(): Strips $ and . characters from user inputs preventing NoSQL injection before reaching routes.',
  '9. session() + passport.initialize() + passport.session(): State persistence for OAuth 2.0 flow.',
  '10. Routes & Error Handler: API routers mounted; 4-parameter errorHandler registered LAST.',
]);

h1('4.2  asyncHandler & Response Envelope Pattern', C.teal);
CODE(
'// utils/asyncHandler.js — Higher-Order Function wrapper\n' +
'const asyncHandler = (fn) => (req, res, next) =>\n' +
'  Promise.resolve(fn(req, res, next)).catch(next);\n' +
'\n' +
'// utils/apiResponse.js — Standardized JSON envelope\n' +
'const sendSuccess = (res, message, data = {}, statusCode = 200) =>\n' +
'  res.status(statusCode).json({ success: true, message, data, timestamp: new Date().toISOString() });\n' +
'\n' +
'const sendError = (res, message, statusCode = 500, errors = []) =>\n' +
'  res.status(statusCode).json({ success: false, message, errors, timestamp: new Date().toISOString() });'
);

// ================================================================
// CHAPTER 5 — DATABASE DESIGN
// ================================================================
sectionBanner('5', 'Database Design — MongoDB + Mongoose',
  'User, OTP TTL index, Subject, Resource, Payment, and Notification schemas', C.brand);
h1('5.1  User Model & Schema Annotations', C.brand);
CODE(
'// models/user.js — Security-First User Schema\n' +
'const userSchema = new mongoose.Schema({\n' +
'  firstName: { type: String, required: true, trim: true, maxlength: 50 },\n' +
'  lastName:  { type: String, required: true, trim: true, maxlength: 50 },\n' +
'  email:     { type: String, required: true, unique: true, lowercase: true, trim: true },\n' +
'  password:  { type: String, select: false, minlength: 6 }, // select:false prevents password leak\n' +
'  googleId:  { type: String, default: null, index: true },  // O(log n) B-Tree index\n' +
'  role:       { type: String, enum: ["user","student","contributor","admin"], default: "user" },\n' +
'  isVerified: { type: Boolean, default: false },\n' +
'  isPremium:  { type: Boolean, default: false },\n' +
'  avatar:     { type: String, default: "default-avatar.png" },\n' +
'  branch:     { type: String, default: "CSE" },\n' +
'  semester:   { type: Number, min: 1, max: 8, default: 1 },\n' +
'}, { timestamps: true });\n' +
'\n' +
'userSchema.pre("save", async function(next) {\n' +
'  if (!this.isModified("password") || !this.password) return next();\n' +
'  if (!this.password.startsWith("$2a$") && !this.password.startsWith("$2b$")) {\n' +
'    this.password = await bcrypt.hash(this.password, 12);\n' +
'  }\n' +
'  next();\n' +
'});'
);

h2('OTP TTL Index & Payment Schemas');
bullets([
  'OTP Schema: { email: String, code: String, expiresAt: Date } with TTL index { expiresAt: 1 }, { expireAfterSeconds: 0 } — MongoDB auto-deletes expired records with zero cron overhead.',
  'Payment Schema: { user: ObjectId, razorpayOrderId: String (unique), razorpayPaymentId: String, razorpaySignature: String, amount: Number (paise), status: enum["created","paid","failed"] }.',
  'Resource Schema: Compound index { subject: 1, type: 1 } optimizes queries filtering notes/PYQs per subject.',
  'Notification Schema: { title: String, message: String, readBy: [{ type: ObjectId, ref: "User" }] } — embedded read tracking.',
]);

// ================================================================
// CHAPTER 6 — AUTHENTICATION SYSTEM
// ================================================================
sectionBanner('6', 'Authentication System',
  'Local OTP verification, JWT httpOnly cookies, Google OAuth 2.0, isAuth gatekeeper', C.accent);
h1('6.1  Dual Authentication Flow', C.accent);
bullets([
  'Local Registration: Password hashed with bcrypt (12 rounds). 6-digit cryptographic OTP emailed via Nodemailer. Account remains isVerified: false until verified.',
  'OTP Verification: Checks MongoDB OTP record. On match, deletes OTP immediately (single use), sets isVerified: true, and fires welcome email.',
  'Login: User.findOne({ email }).select("+password"). Compares via bcrypt.compare(). Returns JWT in httpOnly cookie.',
  'Google OAuth 2.0: Passport.js Authorization Code Grant. Pre-verifies email, checks ADMIN_EMAILS env list, sets JWT cookie on redirect.',
]);

h1('6.2  isAuth Middleware Implementation', C.accent);
CODE(
'// middlewares/isAuth.js — Dual Token Source Verifier\n' +
'const isAuth = async (req, res, next) => {\n' +
'  try {\n' +
'    let token = req.headers.authorization?.startsWith("Bearer ") \n' +
'      ? req.headers.authorization.split(" ")[1] \n' +
'      : req.cookies?.edustack_token;\n' +
'\n' +
'    if (!token) return sendError(res, "Access denied. Please log in.", 401);\n' +
'\n' +
'    const decoded = jwt.verify(token, process.env.JWT_SECRET);\n' +
'    const user = await User.findById(decoded.id).select("-password");\n' +
'    if (!user) return sendError(res, "User not found.", 401);\n' +
'    if (!user.isVerified) return sendError(res, "Account not verified.", 403);\n' +
'\n' +
'    req.user = user; // Attached for downstream controllers\n' +
'    next();\n' +
'  } catch (err) {\n' +
'    return sendError(res, "Invalid or expired session token.", 401);\n' +
'  }\n' +
'};'
);

// ================================================================
// CHAPTER 7 — SECURITY IMPLEMENTATION
// ================================================================
sectionBanner('7', 'Security Implementation',
  '17-layer defense in depth, HMAC timingSafeEqual, NoSQL sanitization', C.purple);
h1('7.1  17 Layers of Defense in Depth', C.purple);
TABLE(
  ['Layer', 'Implementation', 'Threat Mitigated'],
  [
    ['1. Security Headers', 'Helmet.js (15+ headers)', 'Clickjacking, MIME sniffing, XSS, HSTS'],
    ['2. CORS Whitelist', 'Dynamic origin callback', 'Unauthorized cross-origin API calls'],
    ['3. httpOnly Cookies', 'JWT in httpOnly cookie', 'XSS JavaScript token theft'],
    ['4. Password Hashing', 'bcryptjs with 12 salt rounds', 'Rainbow tables, GPU brute force'],
    ['5. NoSQL Sanitization', 'express-mongo-sanitize', 'MongoDB $gt/$where injection bypasses'],
    ['6. Rate Limiting', 'express-rate-limit (30/10min on AI)', 'DDoS, credential stuffing, scraping'],
    ['7. Token Expiry', '7-day expiration window', 'Compromised token lifetime limit'],
    ['8. HMAC Verification', 'crypto.createHmac("sha256")', 'Forged payment confirmations'],
    ['9. Constant-Time Compare', 'crypto.timingSafeEqual()', 'Side-channel timing attacks'],
    ['10. Admin via Env', 'ADMIN_EMAILS in .env only', 'Git repo leak privilege escalation'],
    ['11. select: false', 'Password excluded by default', 'Accidental credential exposure in JSON'],
    ['12. OTP TTL Index', '5-minute MongoDB expiration', 'OTP brute force attack window'],
    ['13. OTP Single-Use', 'deleteOne() immediately on check', 'Replay attacks'],
    ['14. Anti-Enumeration', 'Identical response for unknown emails', 'User email harvesting'],
    ['15. Body Payload Limit', 'express.json({ limit: "1mb" })', 'Large payload DoS'],
    ['16. Trust Proxy', 'app.set("trust proxy", 1)', 'IP spoofing behind load balancers'],
    ['17. Graceful Shutdown', 'SIGTERM/SIGINT server.close()', 'In-flight request data loss'],
  ],
  [100, 165, 230]
);

// ================================================================
// CHAPTER 8 — PAYMENT GATEWAY (RAZORPAY)
// ================================================================
sectionBanner('8', 'Payment Gateway — Razorpay Integration',
  '3-step lifecycle, server-side HMAC-SHA256 verification, fraud protection', C.teal);
h1('8.1  3-Step Payment Architecture', C.teal);
bullets([
  'Step 1 (Order Creation): Client requests POST /api/payments/create-order. Node.js backend calls Razorpay SDK with amount: 500 (paise = Rs.5). Stores Payment record with status: "created". Returns orderId and keyId.',
  'Step 2 (Client Checkout): Frontend launches Razorpay Modal. User completes UPI/Card payment. Razorpay returns { razorpayOrderId, razorpayPaymentId, razorpaySignature }.',
  'Step 3 (HMAC Verification): Client sends receipt to POST /api/payments/verify. Server recomputes HMAC-SHA256 and verifies using crypto.timingSafeEqual(). If valid, marks Payment as "paid" and sets user.isPremium = true.',
]);

CODE(
'// services/razorpayService.js — Fraud-Proof Payment Verification\n' +
'const verifyPaymentSignature = (orderId, paymentId, signature) => {\n' +
'  const message = `${orderId}|${paymentId}`;\n' +
'  const expected = crypto\n' +
'    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)\n' +
'    .update(message)\n' +
'    .digest("hex");\n' +
'\n' +
'  try {\n' +
'    return crypto.timingSafeEqual(\n' +
'      Buffer.from(expected, "hex"),\n' +
'      Buffer.from(signature, "hex")\n' +
'    );\n' +
'  } catch { return false; }\n' +
'};'
);

// ================================================================
// CHAPTER 9 — ML / AI MICROSERVICE
// ================================================================
sectionBanner('9', 'ML / AI Microservice — Python + FastAPI',
  'Google Gemini 1.5/2.0 Flash, LightRAG retrieval, fallback models, PDF OCR', C.purple);
h1('9.1  Architecture & RAG Engine', C.purple);
bullets([
  'Microservice Isolation: Python FastAPI service runs independently with Google Generative AI SDK, pypdf, and Uvicorn ASGI server.',
  'LightRAG Store: Retrieves top-K course chunks using TF-IDF word frequency scoring. Augments Gemini prompt with retrieved context to prevent hallucination.',
  'Self-Healing Model Fallback: Queries genai.list_models() dynamically and waterfalls through Gemini 1.5 Flash -> 2.0 Flash -> Pro if quota or deprecation errors occur.',
  'Dual-Strategy PDF Processing: Uses pypdf for text-selectable documents (>50 chars). Uses Gemini Multimodal Vision OCR for scanned image PDFs.',
]);

CODE(
'# ml_services/main.py — PDF Dual Processing Strategy\n' +
'@app.post("/api/pdf/summarize")\n' +
'async def summarize_pdf(file: UploadFile = File(...)):\n' +
'    pdf_bytes = await file.read()\n' +
'    text = extract_text_from_pdf_bytes(pdf_bytes)\n' +
'    if len(text) > 50:\n' +
'        contents = [f"{prompt}\\n\\nDocument Text:\\n{text[:10000]}"]\n' +
'    else:\n' +
'        contents = [{"mime_type": "application/pdf", "data": pdf_bytes}, prompt]\n' +
'    response = model.generate_content(contents)\n' +
'    return {"success": True, "summary": response.text}'
);

// ================================================================
// CHAPTER 10 — FRONTEND ARCHITECTURE
// ================================================================
sectionBanner('10', 'Frontend Architecture & partials.js Engine',
  'Multi-page application, partials.js engine, auth guard, CSS variables theme', C.brand);
h1('10.1  partials.js — The Global Frontend Engine', C.brand);
P('EduStack is an MPA (Multi-Page Application) where every HTML file includes partials.js. This 91KB client script handles dynamic navbar injection, auth state verification (/api/auth/me caching in window.currentUser), theme switching, notifications, slide-in mobile drawers, and auth guard modals.');

CODE(
'// client/assets/js/partials.js — Auth Guard Pattern\n' +
'window.requireAuth = function(action, label) {\n' +
'  if (window.currentUser) {\n' +
'    action();\n' +
'  } else {\n' +
'    fetch("/api/auth/me", { credentials: "include" })\n' +
'      .then(r => r.json())\n' +
'      .then(d => {\n' +
'        if (d?.success && d?.data?.user) {\n' +
'          window.currentUser = d.data.user;\n' +
'          action();\n' +
'        } else {\n' +
'          window.showAuthModal(label || "access this feature");\n' +
'        }\n' +
'      });\n' +
'  }\n' +
'};'
);

// ================================================================
// CHAPTER 11 — RESPONSIVENESS & UI DESIGN
// ================================================================
sectionBanner('11', 'Responsiveness & UI Design',
  'Breakpoints, circular avatar across all devices, dark mode, glassmorphism', C.accent);
h1('11.1  Adaptive Breakpoints & Glassmorphism', C.accent);
TABLE(
  ['Breakpoint', 'Width', 'Layout Behavior'],
  [
    ['xs (Mobile)', '< 480px', 'Circular 36px profile pill avatar only, hamburger drawer menu'],
    ['sm (Small Mobile)', '480 - 639px', 'AI Tutor quick button and Sign Up CTA appear'],
    ['md (Tablet)', '640 - 1023px', 'Profile pill expands to show user name + role badge'],
    ['lg (Desktop)', '1024 - 1279px', 'Full desktop horizontal navigation bar with all category links'],
    ['xl (Large Desktop)', '>= 1280px', 'Complete navbar + dedicated secondary action buttons'],
  ],
  [85, 95, 315]
);

bullets([
  'Glassmorphism: Sticky navbar uses backdrop-blur-xl bg-white/90 dark:bg-[#181818]/90 with subtle borders.',
  'Theme Engine: Sets CSS custom properties (--brand, --brand-rgb) dynamically on :root supporting 36 theme combinations.',
  'Dark Mode: Persistent class "dark" on <html> activates Tailwind dark: utility classes with localStorage sync.',
]);

// ================================================================
// CHAPTER 12 — API DESIGN PATTERNS
// ================================================================
sectionBanner('12', 'API Design Patterns',
  'REST conventions, HTTP status codes, requireRole RBAC, global error handler', C.purple);
h1('12.1  RESTful Endpoint Reference', C.purple);
TABLE(
  ['Method', 'Endpoint', 'Access Level', 'Purpose'],
  [
    ['POST', '/api/auth/register', 'Public', 'User registration with email normalization'],
    ['POST', '/api/auth/verify-otp', 'Public', 'OTP verification and account activation'],
    ['POST', '/api/auth/login', 'Public', 'Credentials login and httpOnly cookie issuance'],
    ['GET', '/api/auth/me', 'isAuth', 'Get current authenticated user profile'],
    ['GET', '/api/subjects', 'Public', 'List CS subjects by semester with resource counts'],
    ['POST', '/api/subjects', 'isAuth + Admin', 'Create new subject entry'],
    ['GET', '/api/dsa-sheet/sync', 'isAuth + Premium', 'Get live-synced 450+ DSA problems'],
    ['POST', '/api/payments/create-order', 'isAuth', 'Create Razorpay order for Premium access'],
    ['POST', '/api/payments/verify', 'isAuth', 'Verify HMAC signature and grant Premium'],
    ['POST', '/api/ai/ask', 'isAuth + RateLimit', 'Proxy query to Python FastAPI ML RAG engine'],
  ],
  [45, 140, 95, 215]
);

// ================================================================
// CHAPTER 13 — CLOUD SERVICES & FILE UPLOADS
// ================================================================
sectionBanner('13', 'Cloud Services & File Uploads',
  'Multer memoryStorage + Base64 URI + Cloudinary CDN, Nodemailer SMTP', C.teal);
h1('13.1  Zero-Disk Memory Upload Pipeline', C.teal);
bullets([
  'Multer Memory Storage: multer({ storage: multer.memoryStorage() }) buffers image uploads in RAM — zero server disk consumption.',
  'Base64 URI Conversion: Buffer is formatted as data:image/jpeg;base64,... and streamed to Cloudinary.',
  'Cloudinary CDN: Uploaded to "edustack_profiles" / "edustack_subjects" folders returning HTTPS CDN URLs.',
  'Graceful Degradation: If Cloudinary times out or fails, falls back to saving the base64 URI directly in MongoDB.',
  'Nodemailer SMTP: Sends OTP verification and welcome emails using Gmail App Passwords with fire-and-forget background delivery.',
]);

// ================================================================
// CHAPTER 14 — DSA SHEET LIVE SYNC
// ================================================================
sectionBanner('14', 'DSA Sheet — Live Google Sheet Sync',
  '3-layer data strategy: memory cache, live fetch, disk JSON fallback, custom parser', C.brand);
h1('14.1  Three-Tier Synchronization Architecture', C.brand);
DIAGRAM_BOXES('DSA Sheet Sync Data Strategy', [
  { label: 'Layer 1: In-Memory TTL Cache (_dsaSheetCache) — returns in <1ms if cached within 5 minutes' },
  { label: 'Layer 2: Live Fetch from Google Sheets CSV URL using native https.get() following 302 redirects' },
  { label: 'Custom CSV Parser: Handles quoted fields with commas ("Google, Amazon") and Windows CRLF endings' },
  { label: 'Link Merging: Merges live problems with disk JSON to preserve manual LeetCode & solution URLs' },
  { label: 'Layer 3: Disk JSON Fallback (parsed_problems.json) — serves if Google Sheets is unreachable' },
]);

// ================================================================
// CHAPTER 15 — NOTIFICATION SYSTEM
// ================================================================
sectionBanner('15', 'Notification System',
  'Broadcast model with per-user readBy array & $addToSet deduplication', C.accent);
h1('15.1  Broadcast Model Architecture', C.accent);
P('Instead of generating N separate notification records for N users (fan-out antipattern), EduStack creates ONE notification document. An embedded readBy array tracks user IDs who have viewed it.');

CODE(
'// controllers/notificationController.js — Efficient Read Tracking\n' +
'// Fetch with computed isRead boolean:\n' +
'const notifications = await Notification.find().sort({ createdAt: -1 }).limit(30);\n' +
'const data = notifications.map(n => ({\n' +
'  ...n.toObject(),\n' +
'  isRead: n.readBy.some(id => id.toString() === req.user._id.toString())\n' +
'}));\n' +
'\n' +
'// Mark all as read (idempotent atomic bulk update):\n' +
'await Notification.updateMany(\n' +
'  { readBy: { $ne: req.user._id } },\n' +
'  { $addToSet: { readBy: req.user._id } } // Prevents duplicates\n' +
');'
);

// ================================================================
// CHAPTER 16 — DEPLOYMENT ARCHITECTURE
// ================================================================
sectionBanner('16', 'Deployment Architecture',
  'Render.com 2 services, trust proxy, Graceful Shutdown handlers', C.purple);
h1('16.1  Production Deployment Blueprint', C.purple);
bullets([
  'Service 1 (Node.js API): Render Web Service running Node 18, serving API routes and static HTML. Configured with trust proxy: 1 for correct client IP detection.',
  'Service 2 (FastAPI ML): Render Python Web Service running Uvicorn ASGI server with Gemini API keys.',
  'MongoDB Atlas: Managed 3-node replica set with automated backups and encrypted connections.',
  'Graceful Shutdown: Catches SIGTERM / SIGINT, stops accepting new requests with server.close(), allows active requests to finish, and closes MongoDB connections cleanly.',
]);

// ================================================================
// CHAPTER 17 — SECURITY ANALYSIS
// ================================================================
sectionBanner('17', 'Security Analysis & Future Roadmap',
  '13 implemented security controls and future enhancement roadmap', C.teal);
h1('17.1  Implemented Controls vs Roadmap', C.teal);
TABLE(
  ['Implemented Security Controls', 'Future Enhancement Roadmap'],
  [
    ['httpOnly + Secure + SameSite JWT cookies', 'CSRF double-submit tokens on state-changing forms'],
    ['bcrypt with 12 salt rounds (GPU resistant)', 'Account lockout / exponential delay after N failed logins'],
    ['HMAC-SHA256 payment verification with timingSafeEqual', 'Mutual TLS / API key auth between Node and Python ML'],
    ['express-mongo-sanitize NoSQL injection defense', 'Refresh token rotation with short 15-min access tokens'],
    ['Rate limiting on AI proxy (30 req / 10 min)', 'Admin audit logging collection for tracking mutations'],
    ['MongoDB TTL auto-expiring OTP documents (5 min)', 'Redis distributed caching layer for multi-instance scaling'],
  ],
  [245, 250]
);

// ================================================================
// CHAPTER 18 — INTERVIEW Q&A
// ================================================================
sectionBanner('18', 'Interview Q&A — Comprehensive Technical Coverage',
  'Auth, Database, ML/AI, Frontend, and System Architecture interview questions', C.brand);

QA(1, 'How does EduStack authentication work end-to-end?',
'Dual auth: Local (Email/Password + OTP + JWT) and Google OAuth 2.0. Passwords are hashed with bcrypt (12 rounds). On registration, a 6-digit OTP is saved with MongoDB TTL and emailed. Once verified, a JWT with minimal payload ({ id: userId }) is set in an httpOnly cookie. isAuth verifies JWT and re-fetches user from DB per request for instant role revocation.',
['httpOnly cookie prevents XSS token theft.', 'Re-fetching user ensures admin privilege changes take effect immediately.', 'Google OAuth links existing accounts with matching email.']);

QA(2, 'Why store JWT in an httpOnly cookie instead of localStorage?',
'localStorage is accessible by any JavaScript running in the browser. A single XSS vulnerability allows attackers to extract all tokens. httpOnly cookies cannot be read by JavaScript (document.cookie returns empty). The browser attaches the cookie automatically with requests.',
['Paired with Secure: true (HTTPS only) and SameSite protection.', 'Mitigates token theft risks in enterprise applications.']);

QA(3, 'What is a timing attack and how do you prevent it in payment verification?',
'String comparison (===) short-circuits on the first mismatched character, leaking timing information. Attackers measure response times to guess secrets char-by-char. crypto.timingSafeEqual() compares entire Buffers in constant time regardless of where mismatches occur.',
['Used in verifyPaymentSignature for Razorpay HMAC verification.', 'Essential for cryptographic signature and token comparisons.']);

QA(4, 'How does the RAG engine in the AI Hub function?',
'LightRAG uses TF-IDF keyword scoring to retrieve relevant subject syllabus and notes chunks from local knowledge store. It injects retrieved context into the Gemini prompt. This grounds Gemini\'s response in actual course materials and eliminates hallucinations.',
['Dual strategy handles text-based PDFs via pypdf and scanned PDFs via Gemini Vision OCR.', 'Dynamic model fallback catches deprecations and quota limits.']);

QA(5, 'How would you scale EduStack to 1,000,000 users?',
'Replace in-memory DSA cache with Redis cluster, move static assets to Cloudflare CDN, run multiple Node.js instances behind an Nginx/ALB load balancer, offload emails and PDF tasks to BullMQ queues, use MongoDB read replicas, and use Pinecone vector database for AI embeddings.',
['Stateless JWT auth scales across server instances without shared session state.', 'Cloudinary handles media offload without server load.']);

// ================================================================
// CHAPTER 19 — SUMMARY CHEAT SHEET
// ================================================================
sectionBanner('19', 'Summary Cheat Sheet',
  'Complete multi-category reference table covering the entire EduStack stack', C.accent);
TABLE(
  ['Category', 'Technology / Pattern', 'Key Implementation Detail'],
  [
    ['Authentication', 'JWT + bcrypt + OTP', 'httpOnly cookie, 12 salt rounds, 7-day expiry, select:false'],
    ['OAuth SSO', 'Passport.js GoogleStrategy', 'ADMIN_EMAILS env list, links existing email accounts'],
    ['Payment', 'Razorpay + HMAC-SHA256', 'crypto.timingSafeEqual, server-side verification, paise units'],
    ['Database', 'MongoDB Atlas + Mongoose 8', 'TTL index for OTP (5 min), compound indexes, virtual fields'],
    ['Security', 'Helmet + mongoSanitize + CORS', '17 defense layers, trust proxy:1, 1MB body limit'],
    ['AI Engine', 'FastAPI + Gemini + LightRAG', 'TF-IDF retrieval, model fallback waterfall, PDF Vision OCR'],
    ['DSA Tracker', 'Google Sheets CSV live sync', '5-min memory cache, disk JSON fallback, custom parser'],
    ['File Storage', 'Multer + Cloudinary CDN', 'Memory buffer to base64 data URI, zero server disk usage'],
    ['Frontend', 'Vanilla JS + TailwindCSS', 'partials.js engine, window.currentUser, 36 theme combos'],
    ['Notifications', 'MongoDB readBy array', '$addToSet atomic deduplication, single broadcast record'],
    ['Deployment', 'Render.com (2 services)', 'Independent Node.js + Python ML scaling, graceful shutdown'],
  ],
  [85, 160, 250]
);

// ================================================================
// FOOTER
// ================================================================
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text('EduStack Technical Project Documentation  |  Page ' + (fp + 1) + ' of ' + range.count + '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 });
  }
}

doc.end();
stream.on('finish', function() {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n========================================');
  console.log('  PROJECT DOCUMENTATION PDF GENERATED!');
  console.log('========================================');
  console.log('  File  :', OUT);
  console.log('  Pages :', range.count);
  console.log('  Size  :', kb, 'KB');
  console.log('========================================\n');
});
