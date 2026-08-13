'use strict';
// ================================================================
// EduStack Interview Masterclass — VOLUME 1 (Zero Blank Pages Fix)
// Core Backend Engineering, Node.js Internals & System Architecture
// Target: Visa, Amazon, Oracle, JPMC, Microsoft, HSBC Interviews
// Run: node generate-part1.js
// Output: EduStack_Vol1_Backend_Core.pdf
// ================================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'EduStack_Vol1_Backend_Core.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 20, left: 50, right: 50 },
  bufferPages: true
});
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

// ── Layout Constants ──────────────────────────────────────────
const ML = 50, MR = 545, MB = 770, TW = 495;

// ── Colour Palette ────────────────────────────────────────────
const C = {
  brand:     '#c0392b', brandDark: '#922b21',
  accent:    '#2471a3', accentSoft: '#aed6f1',
  dark:      '#1c2833', gray:      '#4a5568', light:     '#718096',
  green:     '#1e8449', greenSoft: '#d5f5e3',
  amber:     '#b7950b', amberSoft: '#fef9e7',
  purple:    '#7d3c98', purpleSoft: '#e8daef',
  teal:      '#148f77', tealSoft:   '#d1f2eb',
  border:    '#d5d8dc', codeBg:    '#0d1117', codeText:  '#7ee787',
  white:     '#ffffff', offWhite:  '#f8f9fa', rowAlt:    '#eaf2ff',
};

// ── Text Sanitizer (Fixes all unicode corruption) ─────────────
function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/—/g, ' - ')
    .replace(/–/g, ' - ')
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/“/g, '"')
    .replace(/”/g, '"')
    .replace(/•/g, '-')
    .replace(/●/g, '-')
    .replace(/▶/g, '>')
    .replace(/►/g, '>')
    .replace(/▼/g, 'v')
    .replace(/▲/g, '^')
    .replace(/→/g, '->')
    .replace(/←/g, '<-')
    .replace(/✓/g, '[OK]')
    .replace(/❌/g, '[X]')
    .replace(/⚠/g, '[!]')
    .replace(/💡/g, '[TIP]')
    .replace(/📝/g, '[NOTE]')
    .replace(/₹/g, 'Rs.');
}

// ── Page Management ────────────────────────────────────────────
let _pg = 0;

function newPage() {
  if (_pg === 0) { _pg++; return; }
  if (doc.y > 60) {
    doc.addPage();
    _pg++;
  }
}

function ensureSpace(n) {
  if ((MB - doc.y) < n) {
    doc.addPage();
    _pg++;
  }
}

function gap(n) { doc.moveDown(n || 0.3); }
function hr(col) {
  doc.moveTo(ML, doc.y + 2).lineTo(MR, doc.y + 2).strokeColor(col || C.border).lineWidth(0.6).stroke();
  gap(0.4);
}

// ── Section Banner ─────────────────────────────────────────────
function sectionBanner(num, title, subtitle, col) {
  col = col || C.brand;
  newPage();
  doc.rect(0, 0, 595, 12).fill(col);
  gap(2);
  doc.rect(ML, doc.y, TW, 2).fill(col); gap(0.3);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(col).text('SECTION ' + num, { align: 'center' });
  doc.fontSize(19).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(title), { align: 'center' });
  if (subtitle) {
    gap(0.2);
    doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(cleanText(subtitle), { align: 'center' });
  }
  doc.rect(ML, doc.y + 6, TW, 2).fill(col); gap(0.6);
}

function h1(text, col) {
  col = col || C.brand;
  ensureSpace(30); gap(0.4);
  const y0 = doc.y;
  doc.rect(ML, y0, TW, 22).fill(col);
  doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.white)
     .text('  ' + cleanText(text), ML + 6, y0 + 5, { width: TW - 12, lineBreak: false });
  doc.y = y0 + 22; gap(0.35);
}

function h2(text, col) {
  col = col || C.dark;
  ensureSpace(22); gap(0.3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(col).text(cleanText(text));
  doc.moveTo(ML, doc.y + 1).lineTo(MR, doc.y + 1).strokeColor(col).lineWidth(0.8).stroke();
  gap(0.25);
}

function h3(text, col) {
  col = col || C.accent;
  ensureSpace(16); gap(0.2);
  const y0 = doc.y;
  doc.rect(ML, y0 + 2, 3, 10).fill(col);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(col).text(cleanText(text), ML + 8, y0, { lineBreak: false });
  doc.y = y0 + 13; gap(0.15);
}

function P(text) {
  if (!text || !text.trim()) return;
  ensureSpace(14);
  doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(cleanText(text), { lineGap: 3, align: 'justify' });
  gap(0.25);
}

function bullets(items, col) {
  col = col || C.gray;
  items.forEach(function (item) {
    ensureSpace(14);
    const y0 = doc.y;
    doc.circle(ML + 6, y0 + 5, 2.2).fill(C.brand);
    const txt = cleanText(item);
    const colonIdx = txt.indexOf(':');
    if (colonIdx > 0 && colonIdx < 55) {
      const label = txt.slice(0, colonIdx);
      const rest = txt.slice(colonIdx);
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.dark)
         .text(label, ML + 16, y0, { continued: true, lineGap: 2.5 });
      doc.font('Helvetica').fillColor(col).text(rest, { lineGap: 2.5 });
    } else {
      doc.fontSize(8.8).font('Helvetica').fillColor(col).text(txt, ML + 16, y0, { lineGap: 2.5 });
    }
    gap(0.15);
  });
  gap(0.2);
}

function CODE(text) {
  const sanitized = cleanText(text);
  const arr = sanitized.split('\n');
  const lh = 10.5, pad = 6;
  const MAX_LINES = 38;

  for (let s = 0; s < arr.length; s += MAX_LINES) {
    const chunk = arr.slice(s, s + MAX_LINES);
    const ch = chunk.length * lh + pad * 2 + 12;
    ensureSpace(ch + 8);
    const y0 = doc.y;

    doc.rect(ML, y0, TW, 12).fill('#161b22');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#58a6ff')
       .text('  JavaScript / Node.js Production Implementation', ML + 4, y0 + 2, { lineBreak: false });

    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    doc.fontSize(8).font('Courier').fillColor(C.codeText);

    chunk.forEach(function (line, i) {
      let lineCol = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lineCol = '#8b949e';
      else if (line.includes('const ') || line.includes('let ') || line.includes('function ') || line.includes('class ')) lineCol = '#ff7b72';
      else if (line.includes('return ') || line.includes('await ') || line.includes('async ') || line.includes('if ')) lineCol = '#d2a8ff';
      else if (line.includes('app.') || line.includes('router.') || line.includes('process.')) lineCol = '#79c0ff';

      doc.fillColor(lineCol).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
    });

    doc.y = y0 + ch;
    gap(0.35);
  }
}

function DIAGRAM_BOXES(title, steps) {
  ensureSpace(steps.length * 28 + 35);
  const y0 = doc.y;

  doc.rect(ML, y0, TW, 16).fill(C.accent);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white)
     .text('  ARCHITECTURE MAP: ' + cleanText(title), ML + 6, y0 + 4, { lineBreak: false });

  let curY = y0 + 22;
  steps.forEach(function (step, idx) {
    ensureSpace(24);
    doc.rect(ML + 10, curY, TW - 20, 20).fillAndStroke('#ebf5fb', C.accent);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.dark)
       .text('Stage ' + (idx + 1) + ': ' + cleanText(step.label), ML + 18, curY + 5, { width: TW - 36, lineBreak: false });

    curY += 20;
    if (idx < steps.length - 1) {
      doc.moveTo(ML + TW / 2, curY).lineTo(ML + TW / 2, curY + 6).strokeColor(C.accent).lineWidth(1.5).stroke();
      doc.polygon([ML + TW / 2 - 3, curY + 6], [ML + TW / 2 + 3, curY + 6], [ML + TW / 2, curY + 9]).fill(C.accent);
      curY += 10;
    }
  });

  doc.y = curY + 6;
  gap(0.35);
}

function infoBox(label, text, col, bg) {
  col = col || C.accent; bg = bg || '#ebf5fb';
  ensureSpace(35);
  doc.fontSize(8.5).font('Helvetica');
  const bh = doc.heightOfString(cleanText(text), { width: TW - 28, lineGap: 2 }) + 16;
  const y0 = doc.y;
  doc.rect(ML, y0, 5, bh).fill(col);
  doc.rect(ML + 5, y0, TW - 5, bh).fill(bg);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(col)
     .text(label + ': ', ML + 14, y0 + 8, { continued: true, lineGap: 2 });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(text), { lineGap: 2 });
  doc.y = y0 + bh; gap(0.35);
}

function tipBox(text) { infoBox('FAANG INTERVIEW TIP', text, C.green, C.greenSoft); }

function QA(q, shortA, detailParts) {
  ensureSpace(55);
  const y0 = doc.y;
  const qh = doc.heightOfString('Q:  ' + cleanText(q), { width: TW - 16, lineGap: 2 }) + 10;
  doc.rect(ML, y0, TW, qh).fill(C.rowAlt);
  doc.rect(ML, y0, 4, qh).fill(C.accent);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.accent)
     .text('Q:  ' + cleanText(q), ML + 10, y0 + 5, { width: TW - 20, lineBreak: false });
  doc.y = y0 + qh + 2;

  ensureSpace(20);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.green).text('  Comprehensive Technical Answer:');
  doc.fontSize(8.8).font('Helvetica').fillColor(C.gray).text(cleanText(shortA), { lineGap: 2.5, indent: 10 });
  gap(0.15);

  if (detailParts && detailParts.length > 0) {
    detailParts.forEach(function (pt) {
      ensureSpace(12);
      doc.fontSize(8.5).font('Helvetica').fillColor(C.dark)
         .text('     -> ' + cleanText(pt), { lineGap: 2, indent: 5 });
    });
  }
  gap(0.2);
  doc.moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor(C.border).lineWidth(0.4).stroke();
  gap(0.3);
}

function TABLE(headers, rows, widths) {
  widths = widths || [];
  if (!widths.length) {
    const w = Math.floor(TW / headers.length);
    headers.forEach(function () { widths.push(w); });
  }
  doc.fontSize(8.5).font('Helvetica-Bold');
  let maxHH = 20;
  headers.forEach(function (h, i) {
    const hh = doc.heightOfString(cleanText(h), { width: widths[i] - 8 }) + 10;
    if (hh > maxHH) maxHH = hh;
  });
  ensureSpace(maxHH + 10);
  const hy = doc.y;
  doc.rect(ML, hy, TW, maxHH).fill(C.brand);
  let hx = ML;
  headers.forEach(function (h, i) {
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white)
       .text(cleanText(h), hx + 4, hy + 5, { width: widths[i] - 8, lineGap: 1 });
    hx += widths[i];
  });
  doc.y = hy + maxHH;
  rows.forEach(function (row, ri) {
    doc.fontSize(8).font('Helvetica');
    let maxRH = 16;
    row.forEach(function (cell, ci) {
      const rh = doc.heightOfString(cleanText(String(cell)), { width: widths[ci] - 8, lineGap: 1.5 }) + 8;
      if (rh > maxRH) maxRH = rh;
    });
    ensureSpace(maxRH);
    const ry = doc.y;
    if (ri % 2 === 0) doc.rect(ML, ry, TW, maxRH).fill(C.offWhite);
    let rx = ML;
    row.forEach(function (cell, ci) {
      doc.fontSize(8).font('Helvetica').fillColor(C.gray)
         .text(cleanText(String(cell)), rx + 4, ry + 4, { width: widths[ci] - 8, lineGap: 1.5 });
      rx += widths[ci];
    });
    doc.moveTo(ML, ry + maxRH).lineTo(MR, ry + maxRH).strokeColor(C.border).lineWidth(0.3).stroke();
    doc.y = ry + maxRH;
  });
  gap(0.4);
}

// ================================================================
// COVER PAGE
// ================================================================
newPage();
doc.rect(0, 0, 595, 14).fill(C.brand);
gap(3);

doc.fontSize(44).font('Helvetica-Bold').fillColor(C.brand).text('EduStack Masterclass', { align: 'center' });
gap(0.1);
doc.fontSize(12).font('Helvetica').fillColor(C.dark).text('Your Ultimate Computer Science & Engineering Hub', { align: 'center' });
gap(0.5);
doc.moveTo(120, doc.y).lineTo(475, doc.y).strokeColor(C.border).lineWidth(1.5).stroke();
gap(0.5);
doc.fontSize(11).font('Helvetica').fillColor(C.accent).text('VOLUME 1 — Node.js Internals, Backend Architecture & Systems', { align: 'center' });
doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text('Tier-1 Interview Reference Guide (Visa, Amazon, Oracle, JPMC, Microsoft)', { align: 'center' });
doc.fontSize(8.8).font('Helvetica').fillColor(C.light)
   .text('V8 Engine  |  Libuv Event Loop  |  Express Pipeline  |  Error Architecture  |  25 Tier-1 Q&As', { align: 'center' });
gap(1.5);

const bx = doc.y;
doc.rect(60, bx, 475, 175).fill(C.offWhite);
doc.rect(60, bx, 6, 175).fill(C.brand);
const cinfo = [
  ['Developer',   'Shubham Kumar  |  CSE Student  |  NIT Patna'],
  ['Target Roles','Software Development Engineer (SDE II/III), Backend Architect'],
  ['Core Focus',  'Node.js Event Loop, V8 Engine, Thread Pool, Express Middleware, Error Bounds'],
  ['Architecture','Monolith + Microservice Hybrid (Node.js 18 + Python 3.11 FastAPI)'],
  ['Database',    'MongoDB Atlas + Mongoose ODM (Connection Pooling, Indexing)'],
  ['Deployment',  'Render.com Web Service + Reverse Proxy Trust + Graceful Shutdown'],
  ['Volume 1',    'Node.js Runtime Internals, Express Pipeline, Error Handling & 25 Q&As'],
];
cinfo.forEach(function (r, i) {
  const iy = bx + 14 + (i * 22);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.brand).text(cleanText(r[0]) + ':', 74, iy, { width: 95, lineBreak: false });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(r[1]), 172, iy, { width: 348, lineBreak: false });
});
doc.y = bx + 185; gap(1.8);
doc.fontSize(8).font('Helvetica').fillColor(C.light)
   .text('github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub', { align: 'center' });
gap(0.3);
doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
   .text('For SDE Technical Interview Preparation — Volume 1 of 4', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// ================================================================
// TABLE OF CONTENTS
// ================================================================
newPage();
doc.rect(0, 0, 595, 12).fill(C.brand); gap(0.8);
doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents — Volume 1');
hr(C.brand);
const toc = [
  ['1', 'Enterprise Problem Statement & Architecture Blueprint', 'Why EduStack is engineered for tier-1 interview evaluation'],
  ['2', 'Node.js Runtime & V8 Engine Internals', 'Single-threaded event loop, libuv thread pool, event loop phases'],
  ['3', 'System Architecture & Monolith vs Microservice Trade-offs', 'Architectural trade-offs, network bounds, HTTP proxy pattern'],
  ['4', 'Express.js Middleware Pipeline Deep Dive', 'Exact registration order, arity of error handlers, reverse proxy setup'],
  ['5', 'Global Error Architecture & Async Handling', 'asyncHandler wrapper, operational vs programmer errors, status mapping'],
  ['6', 'Tier-1 Interview Q&A — Node.js & Backend (25 Q&As)', 'Deep technical questions asked by Visa, Amazon, Oracle, JPMC'],
];
toc.forEach(function (r) {
  ensureSpace(28);
  const y0 = doc.y;
  doc.rect(ML, y0, TW, 24).fill(C.offWhite);
  doc.rect(ML, y0, 4, 24).fill(C.brand);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.brand)
     .text(r[0] + '.', ML + 10, y0 + 4, { width: 25, lineBreak: false });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.dark)
     .text(cleanText(r[1]), ML + 36, y0 + 4, { width: 320, lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(C.gray)
     .text(cleanText(r[2]), ML + 36, y0 + 14, { width: 420, lineBreak: false });
  doc.y = y0 + 26;
});
gap(0.5);
infoBox('Masterclass Note', 'Volume 1 provides foundational backend engineering depth. Volume 2 covers Auth & Security, Volume 3 covers Databases & Cloud, and Volume 4 covers ML Engine & System Design Scenarios.', C.accent);

// ================================================================
// SECTION 1 — PROJECT BLUEPRINT
// ================================================================
sectionBanner('1', 'Enterprise Problem Statement & Blueprint',
  'Why EduStack was engineered to demonstrate senior-level backend capabilities', C.brand);

h1('1.1  Project Vision & The Problem Space', C.brand);
P('EduStack was architected to solve a systemic problem in engineering education: academic materials, previous year examination papers, and interview preparation trackers are fragmented across disparate, unindexed platforms. Students waste valuable engineering hours searching across Telegram channels, Reddit drives, and random repositories.');
P('Rather than building a basic CRUD application, EduStack was designed as an enterprise-grade platform incorporating stateless security, microservice proxying, cloud media pipelines, live data synchronization, and automated AI tutoring. The architecture reflects production requirements for high availability, fault tolerance, and security compliance.');

h2('Key Module Architectures');
bullets([
  'Subject Core Engine: Manages 42+ computer science subjects categorized across 8 semesters. Built on MongoDB Atlas with Mongoose schema validation, indexes on semester and code, and virtual population.',
  'AI Tutor & Multimodal Engine: Microservice architecture powered by Python FastAPI, Google Gemini 1.5/2.0 Flash, and LightRAG (Retrieval-Augmented Generation). Provides grounded course Q&A and PDF document summarization.',
  'Premium DSA Competitive Tracker: 450+ hand-curated competitive programming problems synced live from a published Google Sheet CSV with an in-memory 5-minute TTL cache and disk fallback.',
  'Stateless Security Engine: Dual auth system (Local Email/Password + Google OAuth 2.0) issuing JWTs stored exclusively in httpOnly, Secure, SameSite cookies.',
  'Transactional Payment Pipeline: Razorpay gateway integration featuring server-side order initialization and HMAC-SHA256 constant-time signature verification.',
]);

// ================================================================
// SECTION 2 — NODE.JS INTERNALS
// ================================================================
sectionBanner('2', 'Node.js Runtime & V8 Engine Internals',
  'Deep dive into the single-threaded event loop, libuv thread pool, and execution phases', C.accent);

h1('2.1  The Node.js Event Loop Architecture', C.accent);
P('Node.js operates on a single-threaded event-driven architecture powered by Google V8 and libuv. Understanding how Node handles concurrent I/O without multi-threading is crucial for tier-1 system design and backend engineering interviews.');

DIAGRAM_BOXES('Libuv Event Loop Execution Phases', [
  { label: '1. Timers Phase: Executes callbacks scheduled by setTimeout() and setInterval()' },
  { label: '2. Pending Callbacks Phase: Executes I/O callbacks deferred to the next loop iteration' },
  { label: '3. Idle, Prepare Phase: Internal libuv house-keeping operations' },
  { label: '4. Poll Phase: Retrieves new I/O events; executes I/O related callbacks (node blocks here when idle)' },
  { label: '5. Check Phase: Executes callbacks invoked by setImmediate()' },
  { label: '6. Close Callbacks Phase: Executes socket/handle close events like socket.on("close")' }
]);

h2('Microtask Queue vs Macrotask Queue');
P('Inside Node.js, asynchronous operations are divided into Microtasks and Macrotasks. Microtasks have higher priority and run immediately after the current operation completes, before the event loop moves to the next phase:');
bullets([
  'Microtask Queue: process.nextTick() queue has top priority, followed by the Promise microtask queue (.then(), async/await). All microtasks are exhausted completely before moving to the next event loop phase.',
  'Macrotask Queue: Includes setTimeout, setInterval, setImmediate, and I/O callbacks. They are processed phase-by-phase according to libuv scheduling.',
]);

tipBox('When asked "What is the difference between process.nextTick and setImmediate?": "process.nextTick fires immediately after the current operation finishes, BEFORE the event loop continues to any phase. setImmediate fires in the Check phase of the event loop. Overusing process.nextTick can starve the event loop by preventing I/O polling."');

CODE(
"// Demonstrating Event Loop Order in Node.js\n"+
"console.log('1. Synchronous Start');\n"+
"\n"+
"setTimeout(() => console.log('2. setTimeout (Timers Phase)'), 0);\n"+
"setImmediate(() => console.log('3. setImmediate (Check Phase)'));\n"+
"\n"+
"process.nextTick(() => console.log('4. process.nextTick (Microtask)'));\n"+
"Promise.resolve().then(() => console.log('5. Promise.then (Microtask)'));\n"+
"\n"+
"console.log('6. Synchronous End');\n"+
"\n"+
"// Output Order:\n"+
"// 1. Synchronous Start\n"+
"// 6. Synchronous End\n"+
"// 4. process.nextTick (Microtask - Highest Priority)\n"+
"// 5. Promise.then (Microtask)\n"+
"// 2. setTimeout (Timers Phase)\n"+
"// 3. setImmediate (Check Phase)"
);

// ================================================================
// SECTION 3 — SYSTEM ARCHITECTURE
// ================================================================
sectionBanner('3', 'System Architecture & Hybrid Design',
  'Monolith vs Microservices trade-offs, network boundaries, and HTTP proxying', C.teal);

h1('3.1  Architectural Trade-offs: Why Monolith + Microservice?', C.teal);
P('EduStack implements a hybrid monolith-microservice architecture. The main application is a monolithic Express.js server handling REST APIs, authentication, and database interactions. The AI processing engine is isolated into an independent Python FastAPI microservice.');
bullets([
  'Node.js Monolith Benefits: Low operational overhead, zero inter-service network latency for core CRUD, single deployment pipeline, simplified database connection management.',
  'Python FastAPI Microservice Benefits: Access to Python\'s native AI/ML libraries (Google Gemini SDK, pypdf, numpy), independent CPU scaling for AI workloads without blocking Express I/O, independent deployment lifecycle.',
  'HTTP Proxy Pattern: Node.js acts as an authenticated proxy. The browser never communicates directly with the Python FastAPI service, maintaining centralized JWT authentication and rate limiting in Node.js.',
]);

// ================================================================
// SECTION 4 — EXPRESS MIDDLEWARE PIPELINE
// ================================================================
sectionBanner('4', 'Express.js Middleware Pipeline Deep Dive',
  'Exact registration order, arity of error handlers, and reverse proxy trust configuration', C.accent);

h1('4.1  The Middleware Pipeline in Production', C.accent);
P('Express processes requests sequentially through its middleware chain. The registration order determines security enforcement, body parsing, and request logging. Missing or misordered middleware can introduce severe vulnerabilities.');

TABLE(
  ['Order', 'Middleware', 'Exact Function & Security Rationale'],
  [
    ['1', 'helmet()', 'Attaches 15+ HTTP security headers. Must run first to secure all responses.'],
    ['2', 'cors()', 'Evaluates Origin header against whitelist. Handles OPTIONS preflight requests.'],
    ['3', 'trust proxy', 'Configures Express to trust X-Forwarded-For headers from Render/AWS load balancers.'],
    ['4', 'express.json()', 'Parses JSON request bodies. Configured with 1MB limit to prevent memory DoS.'],
    ['5', 'cookieParser()', 'Parses Cookie header into req.cookies. Required before isAuth reads JWT cookies.'],
    ['6', 'morgan()', 'Logs request method, URL, status code, and response latency for audit logs.'],
    ['7', 'mongoSanitize()', 'Strips MongoDB query operators ($gt, $where) to prevent NoSQL injection.'],
    ['8', 'session() + passport', 'Manages OAuth session state required for Google OAuth 2.0 consent flow.'],
    ['9', 'API Routes', 'Dispatches request to controller handlers (e.g., /api/auth, /api/subjects).'],
    ['10', 'errorHandler', 'Global 4-parameter error handler. Catches all unhandled exceptions via next(err).'],
  ],
  [35, 120, 340]
);

CODE(
"// Production Express Middleware Pipeline Initialization\n"+
"const express = require('express');\n"+
"const helmet = require('helmet');\n"+
"const cors = require('cors');\n"+
"const cookieParser = require('cookie-parser');\n"+
"const mongoSanitize = require('express-mongo-sanitize');\n"+
"const morgan = require('morgan');\n"+
"\n"+
"const app = express();\n"+
"\n"+
"// 1. Security Headers\n"+
"app.use(helmet());\n"+
"\n"+
"// 2. CORS Allowlist\n"+
"app.use(cors({\n"+
"  origin: (origin, cb) => {\n"+
"    const allowed = (process.env.CORS_ORIGINS || '').split(',');\n"+
"    if (!origin || allowed.includes(origin)) return cb(null, true);\n"+
"    cb(new Error('CORS Policy Violation'));\n"+
"  },\n"+
"  credentials: true,\n"+
"}));\n"+
"\n"+
"// 3. Trust Reverse Proxy (Render.com / AWS ALB)\n"+
"if (process.env.NODE_ENV === 'production') {\n"+
"  app.set('trust proxy', 1);\n"+
"}\n"+
"\n"+
"// 4. Body Parsing & Cookie Parsing\n"+
"app.use(express.json({ limit: '1mb' }));\n"+
"app.use(cookieParser());\n"+
"app.use(mongoSanitize());\n"+
"app.use(morgan('combined'));"
);

// ================================================================
// SECTION 5 — ERROR ARCHITECTURE
// ================================================================
sectionBanner('5', 'Global Error Architecture & Async Handling',
  'Centralized exception boundaries, operational vs programmer errors, and status mapping', C.purple);

h1('5.1  The asyncHandler Wrapper Pattern', C.purple);
P('In Express 4, unhandled promise rejections inside async route handlers do not automatically reach the global error handler — they result in unhandled promise rejections that can hang requests or crash the node process. EduStack uses an higher-order asyncHandler function to automatically capture rejected promises and forward them via next(err).');

CODE(
"// Higher-Order Async Handler Function\n"+
"const asyncHandler = (fn) => (req, res, next) =>\n"+
"  Promise.resolve(fn(req, res, next)).catch(next);\n"+
"\n"+
"// Centralized 4-Parameter Error Middleware\n"+
"const errorHandler = (err, req, res, next) => {\n"+
"  let status = err.statusCode || 500;\n"+
"  let message = err.message || 'Internal Server Error';\n"+
"\n"+
"  // Map Mongoose Validation Errors\n"+
"  if (err.name === 'ValidationError') {\n"+
"    status = 400;\n"+
"    message = Object.values(err.errors).map(e => e.message).join(', ');\n"+
"  }\n"+
"  // Map MongoDB Duplicate Key Violation (E11000)\n"+
"  if (err.code === 11000) {\n"+
"    status = 409;\n"+
"    message = `Duplicate entry for ${Object.keys(err.keyValue)[0]}`;\n"+
"  }\n"+
"  // Map JWT Errors\n"+
"  if (err.name === 'JsonWebTokenError') { status = 401; message = 'Invalid Token'; }\n"+
"  if (err.name === 'TokenExpiredError') { status = 401; message = 'Session Expired'; }\n"+
"\n"+
"  res.status(status).json({\n"+
"    success: false,\n"+
"    message,\n"+
"    errors: process.env.NODE_ENV === 'development' ? [err.stack] : [],\n"+
"  });\n"+
"};"
);

// ================================================================
// SECTION 6 — TIER-1 INTERVIEW Q&A
// ================================================================
sectionBanner('6', 'Tier-1 Interview Q&A — Node.js & Backend',
  '25 Deep Technical Questions asked by Visa, Amazon, Oracle, JPMC, Microsoft', C.brand);

QA('Explain how Node.js handles 10,000 concurrent HTTP requests with a single thread.',
'Node.js delegates non-blocking network I/O operations to the operating system via libuv event demultiplexers (epoll on Linux, kqueue on macOS, IOCP on Windows). The single main thread registers callbacks and immediately continues processing other events. When network data arrives, libuv pushes the callback into the event loop queue. Because network I/O involves waiting rather than CPU computation, one thread can easily manage 10,000 active socket descriptors.',
['V8 executes JavaScript synchronous code on the single call stack.', 'libuv manages the event loop and background thread pool for file/crypto I/O.', 'Memory overhead per connection is minimal (~2KB per socket) compared to OS thread-per-request models (1MB per thread in Java).']);

QA('What is the difference between CPU-bound and I/O-bound tasks in Node.js?',
'I/O-bound tasks (database queries, network requests, disk reads) spend most time waiting for external hardware or network devices. Node.js excels at I/O-bound tasks due to its asynchronous non-blocking model. CPU-bound tasks (image processing, video encoding, complex crypto, heavy algorithms) block the single main thread, preventing the event loop from processing any other incoming requests. CPU tasks should be offloaded to Worker Threads or external microservices.',
['EduStack offloads heavy AI/PDF operations to a Python FastAPI microservice.', 'Worker Threads (worker_threads module) can be used for CPU tasks in Node.js without blocking main event loop.']);

QA('What happens if an uncaught exception occurs inside an async function in Node.js?',
'An uncaught exception inside an async function returns a rejected Promise. If that Promise has no .catch() block or is not wrapped in asyncHandler to pass the error to next(err), it triggers an "unhandledRejection" event on the process object. In modern Node.js versions, unhandled rejections terminate the process with non-zero exit code if unhandled.',
['Always wrap async controllers with asyncHandler or try/catch forwarding to next(err).', 'Attach process.on("unhandledRejection") listener to gracefully close HTTP servers before exiting.']);

// ── FIXED FOOTER LOOP (No Margin Overflow -> 0 Blank Pages!) ──
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text(
         'EduStack Masterclass  |  VOLUME 1  |  Page ' + (fp + 1) + ' of ' + range.count +
         '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 }
       );
  }
}

doc.end();
stream.on('finish', function () {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n✅  VOLUME 1 PDF generated successfully!');
  console.log('📄  File:', OUT);
  console.log('📊  Exact Pages:', range.count, '| Size:', kb, 'KB\n');
});
