'use strict';
// ================================================================
// EduStack Interview Masterclass — VOLUME 1 (Deep Rewrite)
// JavaScript Engine Internals, Node.js Runtime & Express Architecture
// Target: FAANG, MAANG, Tier-1 (Amazon, Google, Microsoft, Visa, Oracle, JPMC)
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

function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\u2014/g, ' - ').replace(/\u2013/g, ' - ')
    .replace(/\u2018/g, "'").replace(/\u2019/g, "'")
    .replace(/\u201c/g, '"').replace(/\u201d/g, '"')
    .replace(/\u2022/g, '-').replace(/\u25cf/g, '-')
    .replace(/\u25b6/g, '>').replace(/\u25ba/g, '>')
    .replace(/\u2192/g, '->').replace(/\u2190/g, '<-')
    .replace(/\u2713/g, '[OK]').replace(/\u274c/g, '[X]')
    .replace(/\u26a0/g, '[!]').replace(/\u2764/g, '<3')
    .replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/\u20b9/g, 'Rs.');
}

let _pg = 0;
function newPage() {
  if (_pg === 0) { _pg++; return; }
  doc.addPage(); _pg++;
}
function ensureSpace(n) {
  if ((MB - doc.y) < n) { doc.addPage(); _pg++; }
}
function gap(n) { doc.moveDown(n || 0.3); }
function hr(col) {
  doc.moveTo(ML, doc.y + 2).lineTo(MR, doc.y + 2).strokeColor(col || C.border).lineWidth(0.6).stroke();
  gap(0.4);
}

function sectionBanner(num, title, subtitle, col) {
  col = col || C.brand;
  newPage();
  doc.rect(0, 0, 595, 12).fill(col);
  gap(2);
  doc.rect(ML, doc.y, TW, 2).fill(col); gap(0.3);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(col).text('SECTION ' + num, { align: 'center' });
  doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(title), { align: 'center' });
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
  items.forEach(function(item) {
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

function CODE(text, lang) {
  const sanitized = cleanText(text);
  const arr = sanitized.split('\n');
  const lh = 10.5, pad = 6;
  const MAX_LINES = 36;
  for (let s = 0; s < arr.length; s += MAX_LINES) {
    const chunk = arr.slice(s, s + MAX_LINES);
    const ch = chunk.length * lh + pad * 2 + 12;
    ensureSpace(ch + 8);
    const y0 = doc.y;
    doc.rect(ML, y0, TW, 12).fill('#161b22');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#58a6ff')
       .text('  ' + (lang || 'JavaScript / Node.js'), ML + 4, y0 + 2, { lineBreak: false });
    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    doc.fontSize(8).font('Courier').fillColor(C.codeText);
    chunk.forEach(function(line, i) {
      let lineCol = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lineCol = '#8b949e';
      else if (/\b(const|let|var|function|class|import|export|require)\b/.test(line)) lineCol = '#ff7b72';
      else if (/\b(return|await|async|if|else|for|while|try|catch|new|typeof|instanceof)\b/.test(line)) lineCol = '#d2a8ff';
      else if (/\b(app\.|router\.|process\.|mongoose\.|bcrypt\.|jwt\.|crypto\.)\b/.test(line)) lineCol = '#79c0ff';
      else if (line.includes('"') || line.includes("'") || line.includes('`')) lineCol = '#a5d6ff';
      doc.fillColor(lineCol).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
    });
    doc.y = y0 + ch; gap(0.35);
  }
}

function DIAGRAM_BOXES(title, steps) {
  ensureSpace(steps.length * 28 + 35);
  const y0 = doc.y;
  doc.rect(ML, y0, TW, 16).fill(C.accent);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white)
     .text('  FLOW DIAGRAM: ' + cleanText(title), ML + 6, y0 + 4, { lineBreak: false });
  let curY = y0 + 22;
  steps.forEach(function(step, idx) {
    ensureSpace(24);
    doc.rect(ML + 10, curY, TW - 20, 20).fillAndStroke('#ebf5fb', C.accent);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.dark)
       .text(cleanText(step.label), ML + 18, curY + 5, { width: TW - 36, lineBreak: false });
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

function tipBox(text) { infoBox('FAANG TIP', text, C.green, C.greenSoft); }
function noteBox(text) { infoBox('KEY CONCEPT', text, C.accent, '#ebf5fb'); }
function warnBox(text) { infoBox('COMMON MISTAKE', text, C.amber, C.amberSoft); }

function QA(num, q, ans, details) {
  ensureSpace(60);
  const y0 = doc.y;
  const qTxt = 'Q' + num + ':  ' + cleanText(q);
  const qh = doc.heightOfString(qTxt, { width: TW - 16, lineGap: 2, font: 'Helvetica-Bold', fontSize: 8.8 }) + 12;
  doc.rect(ML, y0, TW, qh).fill(C.rowAlt);
  doc.rect(ML, y0, 4, qh).fill(C.accent);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.accent)
     .text(qTxt, ML + 10, y0 + 6, { width: TW - 20, lineGap: 2 });
  doc.y = y0 + qh + 2;
  ensureSpace(20);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.green).text('  Answer:');
  doc.fontSize(8.8).font('Helvetica').fillColor(C.gray).text(cleanText(ans), { lineGap: 2.5, indent: 10 });
  gap(0.1);
  if (details && details.length > 0) {
    details.forEach(function(pt) {
      ensureSpace(12);
      doc.fontSize(8.3).font('Helvetica').fillColor(C.dark)
         .text('   -> ' + cleanText(pt), { lineGap: 2, indent: 8 });
    });
  }
  gap(0.2);
  doc.moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor(C.border).lineWidth(0.4).stroke();
  gap(0.25);
}

function TABLE(headers, rows, widths) {
  widths = widths || [];
  if (!widths.length) {
    const w = Math.floor(TW / headers.length);
    headers.forEach(function() { widths.push(w); });
  }
  doc.fontSize(8.5).font('Helvetica-Bold');
  let maxHH = 20;
  headers.forEach(function(h, i) {
    const hh = doc.heightOfString(cleanText(h), { width: widths[i] - 8 }) + 10;
    if (hh > maxHH) maxHH = hh;
  });
  ensureSpace(maxHH + 10);
  const hy = doc.y;
  doc.rect(ML, hy, TW, maxHH).fill(C.brand);
  let hx = ML;
  headers.forEach(function(h, i) {
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white)
       .text(cleanText(h), hx + 4, hy + 5, { width: widths[i] - 8, lineGap: 1 });
    hx += widths[i];
  });
  doc.y = hy + maxHH;
  rows.forEach(function(row, ri) {
    doc.fontSize(8).font('Helvetica');
    let maxRH = 16;
    row.forEach(function(cell, ci) {
      const rh = doc.heightOfString(cleanText(String(cell)), { width: widths[ci] - 8, lineGap: 1.5 }) + 8;
      if (rh > maxRH) maxRH = rh;
    });
    ensureSpace(maxRH);
    const ry = doc.y;
    if (ri % 2 === 0) doc.rect(ML, ry, TW, maxRH).fill(C.offWhite);
    let rx = ML;
    row.forEach(function(cell, ci) {
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
gap(2.5);
doc.fontSize(40).font('Helvetica-Bold').fillColor(C.brand).text('EduStack Masterclass', { align: 'center' });
gap(0.1);
doc.fontSize(11).font('Helvetica').fillColor(C.dark).text('Your Ultimate Computer Science & Engineering Interview Preparation Hub', { align: 'center' });
gap(0.4);
doc.moveTo(100, doc.y).lineTo(495, doc.y).strokeColor(C.border).lineWidth(1.5).stroke();
gap(0.4);
doc.fontSize(10).font('Helvetica').fillColor(C.accent).text('VOLUME 1 of 4 — JavaScript Engine + Node.js Runtime + Express Architecture', { align: 'center' });
doc.fontSize(16).font('Helvetica-Bold').fillColor(C.dark).text('Backend Core: From Zero to FAANG Interview Ready', { align: 'center' });
doc.fontSize(8.5).font('Helvetica').fillColor(C.light)
   .text('V8 Engine | Libuv Event Loop | Closures | Prototypes | Promises | Express Pipeline | REST API | 40 Deep Q&As', { align: 'center' });
gap(1.2);

const bx = doc.y;
doc.rect(60, bx, 475, 210).fill(C.offWhite);
doc.rect(60, bx, 6, 210).fill(C.brand);
const cinfo = [
  ['Project',       'EduStack — CS Student Resource Hub & AI Tutor Platform'],
  ['Developer',     'Shubham Kumar | CSE Student | NIT Patna'],
  ['GitHub',        'github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub'],
  ['Target Roles',  'SDE I/II/III — Backend Engineer, Full-Stack, Systems Engineer'],
  ['This Volume',   'JS Internals, Node.js Event Loop, V8 Engine, Express Pipeline, 40 Q&As'],
  ['Volume 2',      'Auth, Security, JWT, bcrypt, OAuth 2.0, OWASP, Payment Crypto'],
  ['Volume 3',      'MongoDB, Mongoose, Indexing, Caching, Cloudinary, Sessions'],
  ['Volume 4',      'System Design, OS, DSA Patterns, Microservices, FAANG Scenarios'],
  ['Backend Stack', 'Node.js 18 + Express 4 + MongoDB Atlas + Mongoose + Razorpay + Cloudinary'],
  ['Deployment',    'Render.com Web Service + Python FastAPI ML Microservice'],
];
cinfo.forEach(function(r, i) {
  const iy = bx + 14 + (i * 19);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.brand).text(cleanText(r[0]) + ':', 74, iy, { width: 90, lineBreak: false });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(r[1]), 168, iy, { width: 352, lineBreak: false });
});
doc.y = bx + 220; gap(1.2);
doc.fontSize(7.5).font('Helvetica').fillColor(C.light).text('For SDE Technical Interview Preparation — Volume 1 of 4 | Read all 4 volumes to crack any backend interview', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// ================================================================
// TABLE OF CONTENTS
// ================================================================
newPage();
doc.rect(0, 0, 595, 12).fill(C.brand); gap(0.8);
doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents — Volume 1: Backend Core');
hr(C.brand);
const toc = [
  ['1', 'EduStack Project Architecture Blueprint', 'Full-stack structure, hybrid monolith+microservice, deployment pipeline'],
  ['2', 'JavaScript Engine & V8 Internals', 'Call Stack, Heap, GC, JIT compilation, Hidden Classes, Inline Caching'],
  ['3', 'Node.js Event Loop — All 6 Phases', 'libuv, microtask vs macrotask, process.nextTick, setImmediate, I/O'],
  ['4', 'Closures, Prototypes & this Binding', 'Lexical scope, prototype chain, call/apply/bind, arrow vs regular functions'],
  ['5', 'Promises, async/await & Error Propagation', 'Microtask scheduling, Promise.all/race/allSettled, async error handling'],
  ['6', 'Express.js Middleware Pipeline Deep Dive', 'Full 10-middleware pipeline, arity, trust proxy, CORS, cookie flow'],
  ['7', 'REST API Design & HTTP Fundamentals', 'Methods, status codes, idempotency, pagination, versioning, JSON envelope'],
  ['8', 'asyncHandler & Global Error Architecture', 'Higher-order wrapper, Mongoose error mapping, JWT errors, next(err)'],
  ['9', '40 Deep Interview Q&As — Backend Core', 'Node.js, JS Engine, HTTP, Express, REST, Error Handling — FAANG level'],
];
toc.forEach(function(r) {
  ensureSpace(28);
  const y0 = doc.y;
  doc.rect(ML, y0, TW, 24).fill(C.offWhite);
  doc.rect(ML, y0, 4, 24).fill(C.brand);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.brand)
     .text(r[0] + '.', ML + 10, y0 + 4, { width: 25, lineBreak: false });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.dark)
     .text(cleanText(r[1]), ML + 36, y0 + 4, { width: 310, lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(C.gray)
     .text(cleanText(r[2]), ML + 36, y0 + 14, { width: 420, lineBreak: false });
  doc.y = y0 + 26;
});
gap(0.5);
infoBox('How to Use These Volumes', 'Start from Section 1 and read cover-to-cover. Every concept is explained from first principles so a beginner can understand and crack any product-based company interview. Real EduStack code is used throughout to show production-level implementation.', C.accent);

// ================================================================
// SECTION 1 — PROJECT ARCHITECTURE
// ================================================================
sectionBanner('1', 'EduStack Project Architecture Blueprint',
  'Full project structure, technology stack, and design philosophy that interviewers evaluate', C.brand);

h1('1.1  Project Overview & Problem Statement', C.brand);
P('EduStack is a full-stack computer science education platform engineered to solve a systemic problem in engineering education: academic resources (notes, PYQs, playlists), competitive programming problem sets, and interview preparation materials are scattered across fragmented, unindexed platforms. Students lose valuable time searching across Telegram, Reddit, and random GitHub repos.');
P('EduStack consolidates all of this into a single platform with: a subject resource hub (notes, PYQs, playlists), a premium DSA competitive programming tracker (450+ problems synced live from Google Sheets), an AI tutor powered by Google Gemini + LightRAG, and Razorpay-based premium access.');

h2('Full Technology Stack');
TABLE(
  ['Layer', 'Technology', 'Purpose & Key Design Choice'],
  [
    ['Runtime', 'Node.js 18 LTS', 'Single-threaded async I/O — handles 10K+ concurrent connections'],
    ['Framework', 'Express.js 4', 'Lightweight HTTP framework with manual middleware pipeline control'],
    ['Database', 'MongoDB Atlas + Mongoose 8', 'Document store with ODM for schema validation and rich querying'],
    ['Auth', 'JWT + bcrypt + Passport.js', 'Stateless tokens in httpOnly cookies + Google OAuth 2.0'],
    ['Payment', 'Razorpay SDK + crypto', 'HMAC-SHA256 signature verification for fraud prevention'],
    ['Media', 'Multer + Cloudinary', 'Memory buffer -> base64 URI -> Cloudinary CDN for avatar/thumbnails'],
    ['Security', 'Helmet + cors + mongoSanitize', '15+ security headers, CORS whitelist, NoSQL injection prevention'],
    ['AI/ML', 'Python FastAPI + Gemini', 'Isolated microservice for CPU-heavy AI — proxied through Node.js'],
    ['Email', 'Nodemailer + SMTP', 'OTP verification and welcome emails via Gmail SMTP'],
    ['Deployment', 'Render.com', 'PaaS with HTTPS, environment variables, graceful shutdown support'],
  ],
  [65, 125, 305]
);

h1('1.2  Hybrid Monolith + Microservice Architecture', C.brand);
P('EduStack uses a deliberate hybrid architecture: a Node.js Express monolith handles all core business logic (auth, subjects, resources, payments, DSA sheet), while a separate Python FastAPI microservice handles AI/ML processing. This is a common production pattern at companies like Stripe, Shopify, and Flipkart.');

DIAGRAM_BOXES('EduStack Request Flow', [
  { label: 'Browser Client (HTML/CSS/JS) sends HTTP request to Node.js server on port 3000' },
  { label: 'Express middleware pipeline: helmet -> cors -> body-parser -> cookieParser -> morgan -> mongoSanitize -> session -> passport' },
  { label: 'isAuth middleware: reads JWT from cookie or Bearer header, verifies, fetches user from MongoDB, attaches req.user' },
  { label: 'Route Handler / Controller: executes business logic, interacts with MongoDB via Mongoose' },
  { label: 'For AI requests: Node.js acts as authenticated proxy, forwards to Python FastAPI microservice' },
  { label: 'Response: JSON envelope via sendSuccess/sendError, or static HTML file served directly' },
]);

bullets([
  'Monolith benefits: Zero inter-service network latency for core CRUD, single deployment unit, simplified DB connection management, no service discovery overhead.',
  'Microservice benefits: Python ML libraries (Gemini SDK, pypdf, numpy) isolated from Node.js runtime, independent CPU scaling, independent deployment lifecycle.',
  'HTTP Proxy security: Browser never directly hits the Python FastAPI service — Node.js adds JWT auth layer, rate limiting, and CORS enforcement before proxying.',
  'Graceful shutdown: SIGTERM/SIGINT handlers close HTTP server, wait for in-flight requests, then disconnect from MongoDB before process.exit(0).',
]);

// ================================================================
// SECTION 2 — JAVASCRIPT ENGINE & V8 INTERNALS
// ================================================================
sectionBanner('2', 'JavaScript Engine & V8 Internals',
  'How JS code is parsed, compiled, and executed — from first principles', C.accent);

h1('2.1  The JavaScript Engine — What Happens When Code Runs', C.accent);
P('When Node.js starts your application, it does NOT interpret JavaScript line-by-line like old scripting languages. Instead, the V8 engine (Google\'s open-source JavaScript engine) compiles JavaScript to native machine code at runtime. Understanding this process is critical for writing high-performance Node.js code.');

h2('The V8 Compilation Pipeline');
bullets([
  'Step 1 - Parsing: V8 reads your source code and converts it into an Abstract Syntax Tree (AST). The parser checks for syntax errors here. The AST is a tree representation of the code structure.',
  'Step 2 - Ignition Interpreter: V8\'s Ignition interpreter converts the AST into bytecode — a compact, low-level representation that runs faster than parsing raw source but is still interpreted.',
  'Step 3 - TurboFan JIT Compiler: V8 profiles your bytecode as it runs. Functions that are called frequently ("hot paths") are identified by the profiler and handed to TurboFan for Just-In-Time compilation into optimized native machine code.',
  'Step 4 - Deoptimization: If the JIT compiler made assumptions (e.g., a function always receives numbers) and those assumptions are violated (you pass a string), V8 deoptimizes back to the interpreter. This is a common performance pitfall.',
]);

noteBox('JIT (Just-In-Time) compilation means V8 compiles code WHILE it is running, not before. The first execution is slower (interpreted bytecode), but hot functions get compiled to machine code, making subsequent calls extremely fast. This is why Node.js throughput increases after warm-up.');

h2('Memory Model: Call Stack & Heap');
TABLE(
  ['Memory Area', 'What Gets Stored', 'Managed By', 'Size Limit'],
  [
    ['Call Stack', 'Function frames, local variables, return addresses, primitive values', 'V8 automatically', '~10,000 frames (configurable)'],
    ['Memory Heap', 'Objects, arrays, closures, strings — anything allocated with "new" or literals', 'V8 Garbage Collector', 'Limited by OS/RAM (default ~1.5GB in Node)'],
    ['String Pool', 'Interned string literals for deduplication', 'V8 internal', 'Part of heap'],
    ['Code Space', 'Compiled machine code from TurboFan JIT', 'V8 internal', 'Part of heap'],
  ],
  [100, 165, 130, 100]
);

h1('2.2  Hidden Classes & Inline Caching (V8 Optimization)', C.accent);
P('V8 optimizes object property access using "Hidden Classes" (also called "shapes" or "maps"). When you create an object with the same properties in the same order, V8 assigns them the same Hidden Class, enabling extremely fast property lookup.');

CODE(
'// GOOD: Same shape — V8 assigns same Hidden Class to both objects\n' +
'const u1 = { name: "Shubham", role: "admin" };\n' +
'const u2 = { name: "Ravi",    role: "user"  };\n' +
'// Both share the same Hidden Class → V8 uses Inline Caching for fast access\n' +
'\n' +
'// BAD: Different shapes — V8 creates separate Hidden Classes (slower)\n' +
'const u3 = { role: "user",  name: "Priya" }; // Different property order!\n' +
'const u4 = { name: "Ankit" };                 // Missing "role" property!\n' +
'\n' +
'// WORST: Dynamically adding properties after creation (causes deoptimization)\n' +
'const u5 = {};\n' +
'u5.name = "Deepak";  // Shape 1\n' +
'u5.role = "admin";   // Shape 2 — V8 transitions Hidden Class twice\n' +
'\n' +
'// PRODUCTION LESSON: In Mongoose models, always define all fields upfront\n' +
'// in the schema. Never dynamically add properties to Mongoose documents.'
);

tipBox('Interviewers at Google and Facebook ask: "What is V8 Hidden Classes and how do they affect performance?" Answer: Objects with the same property shape share a Hidden Class, enabling Inline Caching which makes property access O(1) instead of hash table lookup. Always initialize objects with all properties in the same order to avoid shape transitions.');

h1('2.3  Garbage Collection — How V8 Frees Memory', C.accent);
P('V8 uses a generational garbage collector. The key insight: most objects die young (short-lived request data, temp variables). V8 separates the heap into Young Generation (new space) and Old Generation (old space), running different GC strategies for each.');

TABLE(
  ['GC Space', 'What Lives Here', 'Collection Algorithm', 'Frequency'],
  [
    ['Young Generation (Nursery)', 'Newly allocated objects — most objects die here', 'Scavenger (Cheney\'s algorithm, copy-collect)', 'Very frequent (~milliseconds)'],
    ['Old Generation', 'Objects that survived 2+ Young GC cycles', 'Mark-Sweep + Mark-Compact', 'Less frequent but longer pauses'],
    ['Large Object Space', 'Objects >256KB (e.g., large Buffers)', 'Never moved (too expensive)', 'Part of Old Gen GC'],
  ],
  [120, 150, 145, 80]
);
bullets([
  'Mark Phase: GC traverses all reachable objects starting from "roots" (global variables, stack frames, closures). Each reachable object is marked alive.',
  'Sweep Phase: GC scans the heap and frees memory from all unmarked (unreachable) objects.',
  'Compact Phase: GC moves surviving objects together to eliminate heap fragmentation, improving cache locality.',
  'Stop-the-World: During GC, the main thread pauses. V8 uses incremental marking and concurrent sweeping to minimize pause times.',
]);

warnBox('Common memory leak patterns in Node.js: (1) Global variables accumulating data (arrays/objects that grow unboundedly), (2) Event listeners not removed (emitter.removeListener not called), (3) Closures capturing large objects unnecessarily, (4) Caches without eviction policy. In EduStack, the DSA sheet cache uses a 5-minute TTL to prevent unbounded growth.');

// ================================================================
// SECTION 3 — NODE.JS EVENT LOOP
// ================================================================
sectionBanner('3', 'Node.js Event Loop — All 6 Phases Explained',
  'Single-threaded async I/O, libuv phases, microtask vs macrotask from first principles', C.teal);

h1('3.1  Why Node.js Uses a Single Thread', C.teal);
P('Traditional web servers (Java Tomcat, PHP-FPM) use one OS thread per request. With 1000 concurrent connections, that means 1000 threads, each consuming ~1MB of stack memory (1GB total), plus constant OS context-switching overhead. Node.js takes a fundamentally different approach: one thread, non-blocking I/O, and an event loop.');
P('The key insight is that most web server work is I/O-bound: reading from a database, waiting for file reads, making outbound HTTP calls. The CPU is idle while waiting. Node.js delegates all waiting to the OS (via libuv) and uses the freed CPU time to handle other requests.');

h2('libuv — The Engine Under Node.js');
bullets([
  'libuv is a C library that provides Node.js with its event loop, async file I/O, DNS resolution, child processes, thread pool, and OS-level I/O multiplexing (epoll on Linux, kqueue on macOS, IOCP on Windows).',
  'Network I/O: Handled by OS-level event notification (epoll/IOCP). libuv registers interest in socket events, the OS notifies when data arrives, libuv pushes the callback into the event queue.',
  'File I/O & CPU tasks: Unlike network I/O, disk operations are not truly async on all OSes. libuv maintains a thread pool (default: 4 threads) for file system operations, DNS lookups, and crypto.',
  'Thread pool size: Configurable via UV_THREADPOOL_SIZE env var (max 1024). Increase if you have many concurrent file/crypto operations.',
]);

h1('3.2  The 6 Event Loop Phases — Detailed', C.teal);
P('The Node.js event loop is a loop that continuously checks for pending callbacks and executes them. Each iteration of the loop ("tick") goes through 6 ordered phases. Understanding these phases is essential for debugging async ordering bugs and writing predictable async code.');

DIAGRAM_BOXES('Node.js libuv Event Loop — 6 Ordered Phases', [
  { label: 'Phase 1 — TIMERS: Executes setTimeout() and setInterval() callbacks whose delay has elapsed' },
  { label: 'Phase 2 — PENDING CALLBACKS: Executes I/O callbacks deferred from the previous loop iteration (rare)' },
  { label: 'Phase 3 — IDLE, PREPARE: Internal libuv housekeeping — not accessible from user code' },
  { label: 'Phase 4 — POLL: Retrieves new I/O events. Executes I/O callbacks. Node.js BLOCKS here if no other work is pending, waiting for I/O' },
  { label: 'Phase 5 — CHECK: Executes setImmediate() callbacks (always runs after POLL, before next TIMERS phase)' },
  { label: 'Phase 6 — CLOSE CALLBACKS: Executes close event callbacks (socket.on("close"), server.on("close"))' },
]);

noteBox('Between each phase, Node.js drains the MICROTASK QUEUES completely: first all process.nextTick() callbacks, then all Promise .then() callbacks. Microtasks run BETWEEN phases, not during them. This means microtasks always run before any macro-phase callbacks.');

CODE(
'// Demonstrating precise Node.js event loop ordering\n' +
'console.log("1. Sync: Start"); // Runs first — synchronous\n' +
'\n' +
'setTimeout(() => console.log("2. Timers Phase: setTimeout 0ms"), 0);\n' +
'setImmediate(() => console.log("3. Check Phase: setImmediate"));\n' +
'\n' +
'process.nextTick(() => console.log("4. Microtask: nextTick (highest priority)"));\n' +
'Promise.resolve().then(() => console.log("5. Microtask: Promise.then"));\n' +
'\n' +
'// Simulating I/O callback (e.g., DB query completing)\n' +
'const fs = require("fs");\n' +
'fs.readFile("./package.json", () => {\n' +
'  // Inside an I/O callback (Poll phase):\n' +
'  setTimeout(() => console.log("8. Inner setTimeout"), 0);\n' +
'  setImmediate(() => console.log("6. Inner setImmediate — runs BEFORE inner setTimeout!"));\n' +
'  process.nextTick(() => console.log("7. Inner nextTick"));\n' +
'});\n' +
'\n' +
'console.log("9. Sync: End"); // Runs synchronously before any async\n' +
'\n' +
'// OUTPUT ORDER:\n' +
'// 1. Sync: Start\n' +
'// 9. Sync: End\n' +
'// 4. Microtask: nextTick (highest priority)\n' +
'// 5. Microtask: Promise.then\n' +
'// 2. Timers Phase: setTimeout 0ms\n' +
'// 3. Check Phase: setImmediate\n' +
'// 7. Inner nextTick\n' +
'// 6. Inner setImmediate\n' +
'// 8. Inner setTimeout'
);

tipBox('FAANG Question: "Why does setImmediate fire before setTimeout(0) inside an I/O callback?" Because inside an I/O callback (Poll phase), when the callback completes, the loop moves to the CHECK phase (setImmediate) BEFORE going back to TIMERS (setTimeout). Outside I/O, the order is non-deterministic due to timer precision.');

// ================================================================
// SECTION 4 — CLOSURES, PROTOTYPES & THIS
// ================================================================
sectionBanner('4', 'Closures, Prototypes & this Binding',
  'Lexical scope, prototype chain, call/apply/bind — from first principles', C.purple);

h1('4.1  Closures — The Foundation of JavaScript', C.purple);
P('A closure is a function that retains access to its enclosing scope even after the outer function has returned. This is NOT a feature added on top of JS — it is a direct consequence of how JavaScript resolves variable names via the Scope Chain.');

CODE(
'// Closure fundamentals — how EduStack uses this pattern\n' +
'function createRateLimiter(maxRequests, windowMs) {\n' +
'  const requests = new Map(); // Closed-over variable — persists across calls\n' +
'\n' +
'  return function(userId) {   // Inner function closes over "requests" Map\n' +
'    const now = Date.now();\n' +
'    const userReqs = requests.get(userId) || [];\n' +
'    const recentReqs = userReqs.filter(t => now - t < windowMs);\n' +
'\n' +
'    if (recentReqs.length >= maxRequests) {\n' +
'      return false; // Rate limit exceeded\n' +
'    }\n' +
'    recentReqs.push(now);\n' +
'    requests.set(userId, recentReqs);\n' +
'    return true;\n' +
'  };\n' +
'}\n' +
'\n' +
'// The closure retains "requests" Map even after createRateLimiter returns\n' +
'const limiter = createRateLimiter(10, 60000); // 10 requests per minute\n' +
'limiter("user_123"); // true\n' +
'\n' +
'// Real EduStack pattern: asyncHandler is a closure!\n' +
'const asyncHandler = (fn) => (req, res, next) =>\n' +
'  Promise.resolve(fn(req, res, next)).catch(next);\n' +
'// fn is closed over — asyncHandler returns a new function that holds fn'
);

h1('4.2  Prototype Chain — How Inheritance Works in JS', C.purple);
P('JavaScript uses prototype-based inheritance, not classical class-based inheritance (even though ES6 "class" syntax exists, it is purely syntactic sugar over prototypes). Every object in JS has an internal [[Prototype]] reference that points to another object.');

CODE(
'// Prototype chain — how Mongoose models actually work internally\n' +
'function User(name, email) {\n' +
'  this.name = name;\n' +
'  this.email = email;\n' +
'}\n' +
'\n' +
'// Method added to prototype — shared by ALL User instances (memory efficient)\n' +
'User.prototype.comparePassword = async function(candidate) {\n' +
'  const bcrypt = require("bcryptjs");\n' +
'  return bcrypt.compare(candidate, this.password);\n' +
'};\n' +
'\n' +
'const u = new User("Shubham", "s@nit.ac.in");\n' +
'// u.__proto__ === User.prototype === true\n' +
'// u.__proto__.__proto__ === Object.prototype === true  \n' +
'// u.__proto__.__proto__.__proto__ === null (end of chain)\n' +
'\n' +
'// Property lookup walks the chain:\n' +
'u.comparePassword  // Found on User.prototype (1 level up)\n' +
'u.toString()       // Found on Object.prototype (2 levels up)\n' +
'u.nonExistent      // undefined — reached null, not found\n' +
'\n' +
'// ES6 class syntax is identical (just prettier):\n' +
'class User2 {\n' +
'  constructor(name) { this.name = name; }\n' +
'  comparePassword(c) { /* same as above */ }\n' +
'}\n' +
'// User2.prototype.comparePassword exists — IDENTICAL to manual prototype assignment'
);

h1('4.3  "this" Binding Rules — 4 Rules in Order', C.purple);
TABLE(
  ['Rule', 'How "this" is Determined', 'Example'],
  [
    ['1. New Binding', 'When called with "new", "this" = newly created object', 'new User("Shubham") — this is the new User object'],
    ['2. Explicit Binding', 'call/apply/bind explicitly sets "this"', 'fn.call(myObj) — this is myObj'],
    ['3. Implicit Binding', 'Method called on an object — "this" = that object', 'user.save() — this is user'],
    ['4. Default Binding', 'Standalone call in non-strict mode — "this" = global. In strict mode / arrow fn — undefined or outer this', 'fn() — this is global/undefined'],
  ],
  [110, 190, 195]
);

CODE(
'// Arrow functions vs regular functions — CRITICAL for Mongoose hooks\n' +
'\n' +
'// WRONG: Arrow function loses "this" — Mongoose "this" would be undefined!\n' +
'userSchema.pre("save", async () => {\n' +
'  // "this" here is NOT the document — it is the outer lexical "this"\n' +
'  if (this.isModified("password")) { ... } // FAILS\n' +
'});\n' +
'\n' +
'// CORRECT: Regular function — "this" is the Mongoose document\n' +
'userSchema.pre("save", async function() {\n' +
'  if (!this.isModified("password") || !this.password) return;\n' +
'  const salt = await bcrypt.genSalt(12);\n' +
'  this.password = await bcrypt.hash(this.password, salt); // "this" = document\n' +
'});\n' +
'\n' +
'// Same rule for instance methods:\n' +
'userSchema.methods.comparePassword = async function(candidatePassword) {\n' +
'  return bcrypt.compare(candidatePassword, this.password); // "this" = document\n' +
'  // Arrow function would break this!\n' +
'};'
);

tipBox('"Why can\'t you use arrow functions in Mongoose pre-save hooks?" — Arrow functions lexically bind "this" to the enclosing scope at the time of definition (not the caller\'s context). Mongoose pre-save hooks need "this" to refer to the document instance, which requires a regular function where "this" is determined at call time.');

// ================================================================
// SECTION 5 — PROMISES & ASYNC/AWAIT
// ================================================================
sectionBanner('5', 'Promises, async/await & Error Propagation',
  'Microtask queue scheduling, chaining, Promise.all patterns — from first principles', C.green);

h1('5.1  How Promises Work Internally', C.green);
P('A Promise is an object representing the eventual completion or failure of an asynchronous operation. Internally, a Promise is a state machine with 3 states: Pending (initial), Fulfilled (resolved with a value), or Rejected (failed with a reason). Once settled, a Promise\'s state is immutable.');

CODE(
'// How Promises are scheduled — microtask queue mechanics\n' +
'console.log("A"); // 1. Synchronous\n' +
'\n' +
'Promise.resolve("resolved").then(v => {\n' +
'  console.log("B:", v); // 3. Promise microtask (after sync code, before I/O)\n' +
'  return "chained";\n' +
'}).then(v => {\n' +
'  console.log("C:", v); // 4. Next microtask (each .then is a separate microtask)\n' +
'});\n' +
'\n' +
'console.log("D"); // 2. Synchronous\n' +
'\n' +
'// OUTPUT: A, D, B: resolved, C: chained\n' +
'\n' +
'// ── async/await is EXACTLY equivalent to the above:\n' +
'async function demo() {\n' +
'  console.log("A");\n' +
'  const v = await Promise.resolve("resolved"); // Suspends here, schedules microtask\n' +
'  console.log("B:", v); // Resumes from microtask queue\n' +
'  console.log("C: chained"); // Still inside same microtask context\n' +
'}\n' +
'\n' +
'// await is syntactic sugar for .then() — same microtask scheduling!'
);

h1('5.2  Promise Combinators — When to Use Which', C.green);
TABLE(
  ['Method', 'Behavior on Failure', 'When to Use', 'EduStack Example'],
  [
    ['Promise.all([])', 'Rejects immediately if ANY promise rejects (fail-fast)', 'When ALL results are needed and failure of one means overall failure', 'Parallel DB queries where all must succeed'],
    ['Promise.allSettled([])', 'Always resolves with array of {status, value/reason} for each', 'When you need ALL results regardless of partial failures', 'Batch operations: send welcome + OTP emails'],
    ['Promise.race([])', 'Resolves/rejects with FIRST settled promise', 'Timeout patterns: race DB query vs timeout promise', 'DSA sheet fetch with timeout fallback'],
    ['Promise.any([])', 'Rejects only if ALL promises reject', 'When you need the FIRST successful result', 'Try multiple API endpoints, use first success'],
  ],
  [100, 135, 135, 125]
);

CODE(
'// EduStack pattern: Parallel operations with proper error handling\n' +
'exports.register = asyncHandler(async (req, res) => {\n' +
'  // Sequential (necessary — OTP depends on user creation):\n' +
'  const user = await User.create({ ...userData });\n' +
'  await otpService.saveAndSendOtp(email);  // Must complete before responding\n' +
'\n' +
'  // Fire-and-forget pattern (welcome email — failure should NOT block response):\n' +
'  mailService.sendWelcomeEmail(user.email, user.firstName)\n' +
'    .catch(err => console.warn("Welcome email failed:", err.message));\n' +
'  // Note: No "await" — we do NOT wait for this. Response returns immediately.\n' +
'\n' +
'  return sendSuccess(res, "Account created!", { email }, 201);\n' +
'});\n' +
'\n' +
'// Parallel operations pattern (independent queries):\n' +
'const [subjects, resources, user] = await Promise.all([\n' +
'  Subject.find({ semester }),\n' +
'  Resource.find({ subject: subjectId }),\n' +
'  User.findById(userId)\n' +
']);'
);

// ================================================================
// SECTION 6 — EXPRESS MIDDLEWARE PIPELINE
// ================================================================
sectionBanner('6', 'Express.js Middleware Pipeline Deep Dive',
  'The full 10-step pipeline from EduStack app.js, arity, trust proxy, cookies explained', C.accent);

h1('6.1  How Express Processes a Request', C.accent);
P('Express is essentially a pipeline of functions. When a request arrives, Express passes it through registered middleware functions in the exact registration order. Each middleware receives (req, res, next) and either sends a response, calls next() to proceed, or calls next(err) to jump to the error handler.');
P('The critical rule: ORDER MATTERS. Registering cors() after your routes means the CORS headers are never set for route responses. Registering errorHandler in the middle means errors from later middleware are not caught.');

h2('EduStack\'s Exact 10-Middleware Pipeline (from app.js)');
TABLE(
  ['#', 'Middleware', 'Why This Position?'],
  [
    ['1', 'helmet({ contentSecurityPolicy: false })', 'MUST be first — sets security headers on ALL responses. CSP disabled for CDN + local asset compatibility.'],
    ['2', 'cors({ origin: fn, credentials: true })', 'Before body parsing — CORS preflight (OPTIONS) requests need to be responded to WITHOUT body parsing.'],
    ['3', 'app.set("trust proxy", 1)', 'Enables X-Forwarded-For header trust from Render.com load balancer. Needed for correct IP in rate limiters and session cookies.'],
    ['4', 'express.urlencoded({ extended: true })', 'Parses HTML form submissions (application/x-www-form-urlencoded).'],
    ['5', 'express.json({ limit: "1mb" })', '1MB limit prevents large-payload DoS. Lower than default 10MB. Must be BEFORE routes that read req.body.'],
    ['6', 'cookieParser()', 'MUST be before isAuth middleware — isAuth reads req.cookies.edustack_token.'],
    ['7', 'morgan("dev"/"combined")', 'Logs AFTER body parsing so request size is known. Does not affect response.'],
    ['8', 'mongoSanitize()', 'Removes MongoDB operators ($gt, $where) from req.body and req.params to prevent NoSQL injection.'],
    ['9', 'session() + passport.initialize() + passport.session()', 'Session must be BEFORE passport — passport uses session to persist OAuth state.'],
    ['10', 'API Routes (app.use("/api/...", router))', 'Routes come AFTER all middleware so all middleware runs for every route.'],
  ],
  [20, 150, 325]
);

h1('6.2  Error Middleware — The Critical 4-Parameter Arity', C.accent);
P('In Express, error-handling middleware is distinguished from regular middleware by having exactly 4 parameters: (err, req, res, next). Express\'s internal router checks the function\'s .length property. If it is exactly 4, Express treats it as an error handler and only calls it when next(err) is invoked.');

CODE(
'// Regular middleware — 3 params (or fewer)\n' +
'app.use((req, res, next) => { next(); }); // Called for every request\n' +
'\n' +
'// Error middleware — MUST have exactly 4 params\n' +
'const errorHandler = (err, req, res, next) => { // 4 params!\n' +
'  let status = err.statusCode || 500;\n' +
'  let message = err.message || "Internal Server Error";\n' +
'\n' +
'  // Map Mongoose ValidationError\n' +
'  if (err.name === "ValidationError") {\n' +
'    status = 400;\n' +
'    message = Object.values(err.errors).map(e => e.message).join(", ");\n' +
'  }\n' +
'  // Map MongoDB Duplicate Key (E11000) — e.g., duplicate email on register\n' +
'  if (err.code === 11000) {\n' +
'    status = 409;\n' +
'    message = `Duplicate entry: ${Object.keys(err.keyValue)[0]}`;\n' +
'  }\n' +
'  // Map JWT errors\n' +
'  if (err.name === "JsonWebTokenError") { status = 401; message = "Invalid token"; }\n' +
'  if (err.name === "TokenExpiredError") { status = 401; message = "Session expired"; }\n' +
'\n' +
'  res.status(status).json({\n' +
'    success: false, message,\n' +
'    errors: process.env.NODE_ENV === "development" ? [err.stack] : [],\n' +
'  });\n' +
'};\n' +
'\n' +
'// MUST be registered AFTER all routes — Express error middleware\n' +
'// only catches errors from middleware/routes registered BEFORE it.\n' +
'app.use(errorHandler);'
);

tipBox('Interviewers ask: "Why does the Express error handler need exactly 4 parameters?" Answer: Express\'s router.handle() checks fn.length. If length === 4, it only invokes the function when an error exists. If you accidentally write (req, res, next) = 3 params, Express treats it as a regular middleware and never calls it for errors.');

h1('6.3  CORS Deep Dive — Preflight & Credentials', C.accent);
P('CORS (Cross-Origin Resource Sharing) is a browser security mechanism that blocks web pages from making requests to a different origin than the one that served the page. It does NOT apply to server-to-server requests — only browser-initiated requests are restricted.');

bullets([
  'Simple requests (GET, POST with basic headers): Browser sends the request and checks the Access-Control-Allow-Origin response header.',
  'Preflight requests (DELETE, PUT, custom headers, credentials): Browser first sends an OPTIONS request asking the server if the actual request is allowed. Server MUST respond with appropriate CORS headers to the OPTIONS request.',
  'credentials: true: When set, cookies and Authorization headers are included in cross-origin requests. The server MUST set Access-Control-Allow-Credentials: true AND specify an exact origin (not wildcard *).',
  'sameSite: "none" in production: EduStack sets this on the JWT cookie in production because the Render.com domain and the client may differ, requiring cross-site cookie access. Must be paired with secure: true (HTTPS).',
]);

// ================================================================
// SECTION 7 — REST API DESIGN
// ================================================================
sectionBanner('7', 'REST API Design & HTTP Fundamentals',
  'Methods, status codes, idempotency, pagination, versioning, envelope pattern', C.brand);

h1('7.1  HTTP Methods & Idempotency', C.brand);
TABLE(
  ['Method', 'Purpose', 'Idempotent?', 'Safe?', 'EduStack Usage'],
  [
    ['GET', 'Retrieve resource(s)', 'Yes', 'Yes', '/api/subjects, /api/auth/me, /api/dsa-sheet/live'],
    ['POST', 'Create new resource', 'No', 'No', '/api/auth/register, /api/payments/create-order'],
    ['PUT', 'Replace entire resource', 'Yes', 'No', '/api/users/profile (full update)'],
    ['PATCH', 'Partial resource update', 'No (usually)', 'No', '/api/users/avatar, /api/subjects/:id'],
    ['DELETE', 'Remove resource', 'Yes', 'No', '/api/resources/:id, /api/favourites/:id'],
  ],
  [55, 125, 65, 45, 205]
);

noteBox('Idempotent means calling the operation N times produces the same result as calling it once. GET /api/subjects always returns the same subjects list. DELETE /api/resources/123 — first call deletes it, second call returns 404, but the FINAL STATE is the same (resource is gone). POST /api/payments/create-order is NOT idempotent — calling it twice creates two orders.');

h1('7.2  HTTP Status Codes — Complete Reference', C.brand);
TABLE(
  ['Code', 'Name', 'When EduStack Uses It'],
  [
    ['200', 'OK', 'Successful GET, POST (verification/login), PATCH. sendSuccess default.'],
    ['201', 'Created', 'POST /api/auth/register — new user created. sendSuccess(res, msg, data, 201).'],
    ['204', 'No Content', 'DELETE operations where no body is returned.'],
    ['400', 'Bad Request', 'Validation errors, missing required fields, Mongoose ValidationError.'],
    ['401', 'Unauthorized', 'No token, invalid token, expired token. isAuth returns 401.'],
    ['403', 'Forbidden', 'Authenticated but insufficient permissions (requireRole). Unverified account.'],
    ['404', 'Not Found', 'Resource/User not found in DB. Unknown routes return 404 with custom 404.html.'],
    ['409', 'Conflict', 'Duplicate email on register (MongoDB E11000 duplicate key error).'],
    ['422', 'Unprocessable Entity', 'Semantically invalid data (valid JSON but business logic violation).'],
    ['429', 'Too Many Requests', 'Rate limiter triggered (express-rate-limit on auth routes).'],
    ['500', 'Internal Server Error', 'Uncaught errors, DB connection failures. errorHandler default.'],
  ],
  [45, 120, 330]
);

h1('7.3  EduStack\'s JSON Envelope Pattern', C.brand);
P('All API responses use a consistent JSON envelope pattern implemented in utils/apiResponse.js. This standardizes the response format so the frontend always knows what fields to expect regardless of success or failure.');

CODE(
'// utils/apiResponse.js — Standardized JSON Envelope Pattern\n' +
'\n' +
'const sendSuccess = (res, message, data = {}, statusCode = 200) => {\n' +
'  return res.status(statusCode).json({\n' +
'    success: true,\n' +
'    message,\n' +
'    data,\n' +
'    timestamp: new Date().toISOString(),\n' +
'  });\n' +
'};\n' +
'\n' +
'const sendError = (res, message, statusCode = 500, errors = []) => {\n' +
'  return res.status(statusCode).json({\n' +
'    success: false,\n' +
'    message,\n' +
'    errors,\n' +
'    timestamp: new Date().toISOString(),\n' +
'  });\n' +
'};\n' +
'\n' +
'// Usage in any controller:\n' +
'// return sendSuccess(res, "User profile fetched.", { user }, 200);\n' +
'// return sendError(res, "Invalid email or password.", 401);\n' +
'\n' +
'// Benefits: Frontend checks "success" boolean, not HTTP status alone.\n' +
'// Consistent structure enables generic frontend error handling.'
);

// ================================================================
// SECTION 8 — ASYNCHANDLER & ERROR HANDLING
// ================================================================
sectionBanner('8', 'asyncHandler & Global Error Architecture',
  'Higher-order wrapper, next(err), Mongoose error mapping from EduStack\'s codebase', C.purple);

h1('8.1  The asyncHandler Higher-Order Function', C.purple);
P('In Express 4 (the version EduStack uses), if an async route handler throws an error or returns a rejected Promise, Express does NOT automatically catch it and pass it to the error handler. The error becomes an "unhandled promise rejection" that can crash the Node.js process. The asyncHandler pattern solves this elegantly.');

CODE(
'// utils/asyncHandler.js\n' +
'//\n' +
'// A Higher-Order Function (HOF) — takes a function, returns a new function.\n' +
'// The returned function wraps the original in Promise.resolve().catch(next).\n' +
'\n' +
'const asyncHandler = (fn) => (req, res, next) =>\n' +
'  Promise.resolve(fn(req, res, next)).catch(next);\n' +
'\n' +
'// HOW IT WORKS:\n' +
'// 1. asyncHandler(fn) is called with your controller function\n' +
'// 2. It returns a NEW Express-compatible function (req, res, next) => ...\n' +
'// 3. When that function runs, it calls Promise.resolve(fn(req, res, next))\n' +
'//    - If fn is async, it returns a Promise\n' +
'//    - If fn is sync and returns a value, Promise.resolve wraps it\n' +
'// 4. .catch(next) catches any rejection and calls next(err)\n' +
'//    which routes to the 4-param global error handler\n' +
'\n' +
'// Usage — every controller is wrapped:\n' +
'exports.login = asyncHandler(async (req, res) => {\n' +
'  const { email, password } = req.body;\n' +
'  const user = await User.findOne({ email }).select("+password");\n' +
'  // If this throws (e.g., MongoDB timeout) → caught by asyncHandler → next(err)\n' +
'  // → goes to errorHandler → returns 500 JSON response\n' +
'\n' +
'  if (!user) return sendError(res, "Invalid email or password.", 401);\n' +
'  // ...\n' +
'});'
);

h1('8.2  Complete Error Handling Flow', C.purple);
DIAGRAM_BOXES('Error Propagation in EduStack', [
  { label: 'Route handler wrapped in asyncHandler(fn)' },
  { label: 'Async operation fails (DB error, JWT error, Mongoose validation, duplicate key)' },
  { label: 'asyncHandler catches rejection via .catch(next) — calls next(err)' },
  { label: 'Express skips all non-error middleware and routes to 4-param errorHandler' },
  { label: 'errorHandler classifies the error: ValidationError->400, E11000->409, JWT errors->401, else 500' },
  { label: 'JSON response sent: { success: false, message, errors: [stack in dev] }' },
]);

bullets([
  'Mongoose ValidationError: Triggered when a document fails schema validation (e.g., missing required field, maxlength exceeded). errorHandler extracts the messages from err.errors object.',
  'MongoDB E11000 (Duplicate Key): Triggered when inserting a document that violates a unique index (e.g., duplicate email). errorHandler maps this to 409 Conflict.',
  'JsonWebTokenError: Thrown by jwt.verify() when the token is malformed or signature does not match. Maps to 401 Unauthorized.',
  'TokenExpiredError: Thrown by jwt.verify() when the token\'s exp claim has passed. Maps to 401 with "Session expired" message.',
  'Operational vs Programmer Errors: Operational errors (user passes bad data) should return 4xx. Programmer errors (bugs in code) should return 500 and be alerted immediately.',
]);

// ================================================================
// SECTION 9 — 40 DEEP Q&As
// ================================================================
sectionBanner('9', '40 Deep Interview Q&As — Backend Core',
  'FAANG-level questions on Node.js, JavaScript Engine, HTTP, Express, REST, Error Handling', C.brand);

infoBox('About This Section', 'These 40 questions are curated from real FAANG, MAANG, and Tier-1 company interviews (Amazon, Google, Microsoft, Visa, Oracle, JPMC, Flipkart, PhonePe). Answers reference EduStack\'s actual production code patterns.', C.accent);

QA(1, 'Explain how Node.js handles 10,000 concurrent HTTP requests with a single thread.',
'Node.js delegates non-blocking network I/O to the OS via libuv event demultiplexers (epoll on Linux, kqueue on macOS, IOCP on Windows). The single main thread registers event listeners and immediately continues. When data arrives on any socket, the OS notifies libuv, which pushes the callback into the event queue. Since most web requests are I/O-bound (waiting for DB, network), the single thread can manage 10K+ sockets with minimal CPU usage.',
['V8 executes synchronous JS on the single call stack. libuv handles all async I/O with OS-level syscalls.', 'Memory per connection: ~2KB (socket + event listener). Java thread-per-request: ~1MB per thread.', 'Node.js excels at I/O-bound workloads. CPU-bound tasks (AI, image processing) should use Worker Threads or separate processes — EduStack uses a Python FastAPI microservice for this.']);

QA(2, 'What is the difference between process.nextTick(), setImmediate(), and Promise.then()?',
'process.nextTick() fires IMMEDIATELY after the current operation, BEFORE the event loop moves to any phase — it has the highest async priority. Promise.then() (Promise microtask) fires after all nextTick callbacks. setImmediate() fires in the CHECK phase of the event loop, AFTER I/O callbacks in the POLL phase.',
['Priority order: Synchronous > process.nextTick > Promise.then > setImmediate > setTimeout(0)', 'process.nextTick can starve the event loop if called recursively — it keeps firing without letting the event loop advance phases.', 'Inside an I/O callback: setImmediate always fires before setTimeout(0) because after the POLL phase, the loop goes to CHECK (setImmediate) before going back to TIMERS (setTimeout).']);

QA(3, 'What is V8\'s JIT compilation and how does it improve Node.js performance?',
'JIT (Just-In-Time) compilation means V8 compiles JavaScript to native machine code at runtime, not before. The Ignition interpreter first converts AST to bytecode. The profiler identifies "hot" functions (called frequently). TurboFan JIT compiler optimizes hot functions to native machine code. Subsequent calls to hot functions run as fast as compiled C++ code.',
['First execution: Interpreted (slower). After warm-up: JIT-compiled (much faster). This is why Node.js performance benchmarks improve significantly under sustained load.', 'Deoptimization: If JIT assumptions fail (e.g., function receives mixed types), V8 falls back to interpreter. Write type-consistent code for best performance.', 'Hidden Classes: Objects with the same property shape share a Hidden Class, enabling O(1) property access via Inline Caching instead of hash table lookups.']);

QA(4, 'Why is process.nextTick() considered dangerous if misused?',
'process.nextTick() callbacks run before any I/O event. If a nextTick callback schedules another nextTick(), the event loop never advances to the I/O poll phase. This "starves" I/O callbacks — pending database queries, incoming HTTP requests, and timers never execute.',
['Example starvation: function loop() { process.nextTick(loop); } — this infinite loop completely blocks all I/O.', 'Safe usage: Use nextTick for deferring a callback to run after current synchronous code completes but before I/O, in a controlled, non-recursive manner.', 'Prefer Promise.then() or setImmediate() for most async deferral needs — they respect I/O phases.']);

QA(5, 'What is the difference between CPU-bound and I/O-bound tasks in Node.js? How does EduStack handle them?',
'I/O-bound tasks spend most time waiting: DB queries, file reads, HTTP calls to external APIs. CPU-bound tasks spend time computing: image processing, video encoding, AI inference, complex crypto. Node.js excels at I/O-bound. CPU-bound tasks block the single main thread and prevent all other requests from being served.',
['EduStack handles CPU-bound AI/ML in a separate Python FastAPI microservice. Node.js proxies requests to it via HTTP, freeing the main thread.', 'bcrypt hashing (12 rounds) is CPU-intensive. Node.js offloads it to libuv\'s thread pool (worker threads), so it does NOT block the main thread.', 'Worker Threads (node:worker_threads module) can run CPU-intensive JS in a separate thread without blocking the event loop.']);

QA(6, 'Explain JavaScript\'s scope chain and lexical scoping.',
'Lexical scope means a function\'s scope is determined by where it is WRITTEN in the source code, not where it is called from. When JS resolves a variable, it looks in the current function scope first, then walks up to the enclosing function scopes, then module scope, then global scope. This chain is called the scope chain.',
['Closures are the practical manifestation of lexical scope — inner functions close over their outer function\'s variables.', 'var has function scope. let and const have block scope (inside {} blocks). This is why var in a for loop leaks outside the loop, but let does not.', 'In EduStack, asyncHandler is a closure — it closes over fn and returns a new function that uses fn from the outer scope.']);

QA(7, 'What are JavaScript Promises and how do they differ from callbacks?',
'Promises represent an eventual value. They solve callback hell (deeply nested callbacks), provide chainable .then()/.catch(), allow parallel execution with Promise.all(), and propagate errors through .catch() rather than requiring error-first callbacks at every level.',
['Callback hell: db.find({}, (err, users) => { if (err) return handle(err); process(users, (err2, result) => { ... }) })', 'Promise equivalent: db.find({}).then(users => process(users)).catch(handle) — flat, readable chain', 'async/await makes Promise code look synchronous: const users = await db.find({}); — but still non-blocking under the hood.']);

QA(8, 'What is async/await and what does it compile to under the hood?',
'async/await is syntactic sugar over Promises and generators. An async function always returns a Promise. await suspends the async function and schedules the continuation as a microtask when the awaited Promise settles. No new OS thread is created — the event loop continues processing other events while the async function is suspended.',
['async function login() { const user = await User.findOne(...); } is equivalent to: function login() { return User.findOne(...).then(user => { ... }); }', 'Error handling: try/catch in async function catches rejected promises, just like .catch() on a Promise chain.', 'Pitfall: await in a loop is sequential. Use Promise.all([...promises]) for parallel execution.']);

QA(9, 'Explain the Express.js middleware chain. What happens if next() is not called?',
'Express processes requests through a chain of middleware functions registered with app.use() or router.use(). Each middleware gets (req, res, next). If a middleware sends a response (res.json(), res.send()), it should NOT call next(). If it does not send a response AND does not call next(), the request hangs indefinitely — no response is sent, the client times out.',
['Only one middleware should send the final response. Multiple calls to res.json() throw an "headers already sent" error.', 'next() passes control to the next matching middleware. next(err) skips to the 4-param error handler.', 'Common bug: forgetting "return" before next() or res.send(), causing code to continue executing after the response is sent.']);

QA(10, 'How does EduStack\'s isAuth middleware verify a JWT token? What are the two token sources?',
'isAuth checks two sources: (1) Authorization header with "Bearer <token>" (preferred for REST API clients), (2) httpOnly cookie named "edustack_token" (for browser-based cookie flows). It verifies the token with jwt.verify() using the JWT_SECRET from env, fetches the user from MongoDB with .select("-password"), blocks unverified accounts, and attaches the user to req.user.',
['The JWT payload only contains { id: userId } — role and email are NOT stored in the token. This ensures that if an admin revokes a user, the change takes effect immediately on the next request (role is re-fetched from DB each time).', 'JsonWebTokenError (malformed/tampered token) and TokenExpiredError (exp claim expired) are caught and return 401.', 'select("-password") ensures the password hash is never included in req.user even if select:false is somehow bypassed.']);

QA(11, 'What is "trust proxy" in Express and why does EduStack set it?',
'When deployed on Render.com (or any PaaS/reverse proxy), the HTTP requests reach Express from the reverse proxy, not directly from clients. The client\'s real IP is in the X-Forwarded-For header, not in req.socket.remoteAddress. Setting app.set("trust proxy", 1) tells Express to trust the first proxy in the X-Forwarded-For chain, making req.ip return the real client IP.',
['Without trust proxy: rate limiters use the load balancer\'s IP (127.0.0.1 or the proxy IP) instead of the actual client IP. All requests appear to come from the same IP, making rate limiting ineffective.', 'Secure cookies (secure: true) require the client to be on HTTPS. With trust proxy, Express correctly identifies HTTPS connections even when the TLS termination happens at the proxy level.', 'Setting to 1 means trust 1 hop. Setting to true trusts all proxies (less secure, not recommended for production).']);

QA(12, 'Explain the asyncHandler pattern. Why is it needed in Express 4?',
'Express 4 route handlers are not async-aware. If an async function throws or returns a rejected Promise, Express does not automatically catch it — the error becomes an unhandled promise rejection. asyncHandler is a Higher-Order Function that wraps controllers: it calls fn(req, res, next) inside Promise.resolve().catch(next), so any rejection automatically calls next(err), routing to the global error handler.',
['Without asyncHandler, developers must write try/catch in every async controller — repetitive and error-prone.', 'Express 5 (currently in beta) will natively handle async errors without asyncHandler. EduStack uses Express 4, so asyncHandler is necessary.', 'The pattern: const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);']);

QA(13, 'What is MongoDB E11000 error? When does it occur in EduStack?',
'E11000 is MongoDB\'s DuplicateKey error code. It occurs when an insert or update operation tries to write a value that violates a unique index. In EduStack, the User schema has unique: true on the email field. If two users try to register with the same email, MongoDB throws E11000.',
['EduStack\'s errorHandler maps err.code === 11000 to HTTP 409 Conflict with message "Duplicate entry for email".', 'The User schema also has a unique index on email: { type: String, unique: true, lowercase: true, trim: true }. Lowercase ensures "User@Test.com" and "user@test.com" are treated as duplicates.', 'Always check for existing users before creating to provide better UX: User.findOne({ email }) before User.create(). EduStack does this in authController.register.']);

QA(14, 'What is the difference between "==" and "===" in JavaScript? When should you use each?',
'=== (strict equality) compares both value AND type without coercion. == (loose equality) performs type coercion before comparison. Always use === in production code — == has 50+ confusing edge cases (null == undefined is true, "" == 0 is true, [] == false is true).',
['0 == false is true (type coercion: false -> 0). 0 === false is false (different types).', 'null == undefined is true (special case in spec). null === undefined is false.', 'Always use === except when intentionally checking for null/undefined together: if (x == null) checks both null and undefined.']);

QA(15, 'Explain var, let, and const differences. What is hoisting?',
'var: function-scoped, hoisted to function top (initialized as undefined). let: block-scoped, hoisted but NOT initialized (Temporal Dead Zone — access before declaration throws ReferenceError). const: block-scoped, hoisted but NOT initialized, must be initialized at declaration, value cannot be reassigned (but object/array contents CAN be mutated).',
['Hoisting: JS moves variable and function DECLARATIONS to the top of their scope before execution. Only declarations are hoisted, not initializations.', 'TDZ (Temporal Dead Zone): The region between the start of a block and a let/const declaration. Accessing the variable in the TDZ throws ReferenceError.', 'Best practice: Always use const. Use let only when you need to reassign. Never use var in modern code.']);

QA(16, 'What is the Prototype chain? How does Mongoose leverage it?',
'Every JS object has an internal [[Prototype]] reference (accessible as __proto__) pointing to another object. Property lookup walks this chain until found or null is reached. Object.prototype is the top of all chains.',
['Mongoose model instances are plain JS objects. Methods defined on userSchema.methods are added to the User model\'s prototype. When you call user.comparePassword(), JS finds it on User.prototype.', 'Mongoose\'s model compilation (mongoose.model("User", userSchema)) creates a constructor function. Instances created by User.create() or User.findOne() inherit all schema methods via prototype chain.', 'Mongoose prevents re-compiling models (mongoose.models.User || mongoose.model(...)) to avoid duplicate model errors in hot-reload dev environments.']);

QA(17, 'What are JavaScript generators and how are they related to async/await?',
'Generators are functions that can pause execution (yield) and resume later. They return an iterator. async/await is built on top of generators under the hood. An async function is roughly equivalent to a generator function wrapped in a Promise-based runner that resumes the generator when Promises resolve.',
['Generator syntax: function* myGen() { const x = yield somePromise; }', 'async/await desugars to: function login() { return co(function*() { const user = yield User.findOne(...); }); } (conceptually)', 'In practice, use async/await directly. Generators are useful for custom iterators and lazy sequences.']);

QA(18, 'Explain event-driven programming. How does EduStack use it?',
'Event-driven programming is a paradigm where execution flow is determined by events (user actions, I/O completions, messages). In Node.js, the EventEmitter is the foundation. The event loop continuously polls for events and dispatches them to registered handlers.',
['EventEmitter pattern: emitter.on("event", handler) to register, emitter.emit("event", data) to trigger.', 'EduStack uses Express (built on http.Server, which extends EventEmitter): server.on("error"), store.on("error") for MongoDB session store errors.', 'Node.js core modules use EventEmitter: stream.on("data"), stream.on("end"), mongoose.connection.on("connected").']);

QA(19, 'What is "callback hell" and how do Promises and async/await solve it?',
'Callback hell occurs when async operations are nested — each requiring a callback for the next step. The code becomes a "pyramid of doom" that is hard to read, debug, and maintain. Error handling requires checking err at every level.',
['Callback hell example: db.find({}, (err, users) => { if(err) return; sendMail(users[0].email, (err2, result) => { if(err2) return; saveLog(result, (err3) => {...})})})', 'Promises: db.find({}).then(users => sendMail(users[0].email)).then(result => saveLog(result)).catch(handleAllErrors)', 'async/await: const users = await db.find({}); const result = await sendMail(users[0].email); await saveLog(result); — looks synchronous, is async.']);

QA(20, 'What is the Node.js libuv thread pool? When is it used?',
'libuv maintains a pool of OS threads (default: 4, configurable via UV_THREADPOOL_SIZE up to 1024) for operations that cannot be done asynchronously at the OS level on all platforms: file system operations, DNS resolution (dns.lookup), crypto operations (bcrypt, crypto.pbkdf2), and zlib compression.',
['Network I/O (TCP, HTTP) uses OS-level async I/O (epoll/kqueue) — does NOT use the thread pool.', 'bcrypt.hash() in EduStack runs in libuv\'s thread pool — it is CPU-intensive but does NOT block the main event loop thread.', 'If you have 10 concurrent bcrypt operations and only 4 threads, the 5th-10th operations wait for a thread to become free. Increase UV_THREADPOOL_SIZE if this is a bottleneck.']);

QA(21, 'How does EduStack implement graceful shutdown? Why is it important?',
'EduStack registers SIGTERM and SIGINT signal handlers. When a signal is received: (1) stops accepting new connections (server.close()), (2) waits for in-flight requests to complete, (3) exits cleanly. A force-exit setTimeout(process.exit, 10000) ensures the process does not hang indefinitely.',
['SIGTERM is sent by Render.com, Docker, Kubernetes, and PM2 when restarting the process (e.g., new deployment). Without graceful shutdown, in-flight DB writes could be left incomplete.', 'server.close() stops accepting new connections but allows existing ones to complete. MongoDB connections are closed automatically when process.exit() is called.', 'process.on("unhandledRejection", ...) closes the server before exit to prevent zombie processes.']);

QA(22, 'What is Express router? How do route modules work in EduStack?',
'express.Router() creates a mini Express application that handles a subset of routes. It has its own middleware stack. Router instances are mounted on the main app with app.use("/api/auth", authRoutes). This modularizes routes into separate files (authRoutes.js, userRoutes.js, etc.).',
['EduStack has 9 route modules: authRoutes, userRoutes, subjectRoutes, resourceRoutes, favouriteRoutes, paymentRoutes, notificationRoutes, enrollmentRoutes, aiRoutes.', 'Each router file: const router = express.Router(); router.post("/login", loginController); module.exports = router;', 'app.use("/api/auth", authRoutes) means the authRoutes file\'s router.post("/login") becomes POST /api/auth/login in the full app.']);

QA(23, 'What is req.body vs req.params vs req.query? When is each used?',
'req.params: URL path parameters defined with colon notation (:id). Example: GET /api/subjects/:id — req.params.id = "abc123". req.query: URL query string parameters. Example: GET /api/subjects?semester=3 — req.query.semester = "3". req.body: HTTP request body (JSON or form data). Example: POST /api/auth/login sends { email, password } in body — req.body.email.',
['req.params is used for identifying a specific resource: /api/resources/:resourceId', 'req.query is used for filtering, pagination, sorting: /api/subjects?semester=2&branch=CSE&limit=20&page=1', 'req.body requires body-parsing middleware (express.json(), express.urlencoded()). Without it, req.body is undefined.']);

QA(24, 'Explain REST API versioning strategies. Which does EduStack use?',
'Three main versioning strategies: (1) URL path versioning: /api/v1/subjects, /api/v2/subjects — simple, explicit, widely used. (2) Request header versioning: Accept: application/vnd.api+json;version=1 — clean URLs but complex client implementation. (3) Query param versioning: /api/subjects?version=1 — simple but clutters query params.',
['EduStack currently uses URL path versioning implicitly through /api/ prefix. Future versioning would add /api/v1/ or /api/v2/ to the path.', 'URL versioning is the most common in production APIs (Stripe, Razorpay, GitHub all use it). Clients can easily see which version they are calling.', 'Never version by having breaking changes with no versioning — always introduce a new version for breaking changes.']);

QA(25, 'What is Morgan middleware? What does it log?',
'Morgan is an HTTP request logger middleware for Express. It logs incoming request details to stdout. Format "dev" (used in development) logs: method, URL, status code, response time, content-length in color. Format "combined" (used in production) logs Apache-compatible log lines including IP, user agent, referrer.',
['EduStack uses morgan("dev") in development for colorized, compact logs and morgan("combined") in production for full audit trails.', 'Morgan is registered AFTER body parsers so it can log content-length. It is a pass-through — it calls next() after logging.', 'For production, combine Morgan logs with a log aggregation service (DataDog, Papertrail, Logtail) for searchable, persistent audit logs.']);

QA(26, 'What is mongoose.sanitize and why is it important?',
'express-mongo-sanitize removes MongoDB query operators ($gt, $lt, $where, $regex, etc.) from req.body and req.query. Without it, an attacker can send { "email": { "$gt": "" }, "password": { "$gt": "" } } in the login request body. The $gt operator matches any non-empty string, effectively bypassing password authentication.',
['This is a NoSQL injection attack — analogous to SQL injection but for MongoDB.', 'EduStack registers mongoSanitize() before routes. It replaces all keys starting with "$" with empty strings.', 'Additional protection: Use Mongoose schemas with defined types — unrecognized fields are stripped during casting.']);

QA(27, 'What is the difference between findOne(), findById(), and find() in Mongoose?',
'find(): Returns an array of all matching documents. findOne(): Returns the FIRST matching document as an object (or null). findById(id): Syntactic sugar for findOne({ _id: id }). All return Mongoose Query objects (thenables) that can be chained with .select(), .populate(), .lean(), .sort().',
['findById() is faster than findOne({ _id }) because Mongoose optimizes the _id cast. Always use findById when you have the ID.', '.lean() returns plain JS objects instead of Mongoose Documents — faster (no prototype overhead), useful for read-only operations that don\'t need save(), validate(), etc.', 'findOneAndUpdate() atomically finds and updates in a single MongoDB operation — important for avoiding race conditions.']);

QA(28, 'What is "req.user" and how is it populated in EduStack?',
'req.user is a custom property attached by the isAuth middleware to the Express request object. isAuth reads the JWT from the cookie or Authorization header, verifies it, fetches the User document from MongoDB (without password), checks isVerified, and attaches the full user document to req.user. All downstream route handlers access req.user directly without additional DB queries.',
['This is the "Decorate the Request" pattern — middleware enriches the request object for downstream handlers.', 'req.user is NOT available in routes that don\'t use the isAuth middleware (public routes: login, register, health check).', 'In EduStack, controllers reference req.user._id for ownership checks, req.user.role for permission checks, req.user.isPremium for premium feature gating.']);

QA(29, 'What is Helmet.js and what security headers does it set?',
'Helmet is a collection of middleware functions that set HTTP security headers. EduStack uses helmet({ contentSecurityPolicy: false }) because CSP is disabled for compatibility with CDN resources and local assets.',
['X-DNS-Prefetch-Control: Disables DNS prefetching to prevent exposure of visited URLs.', 'X-Frame-Options: SAMEORIGIN — prevents clickjacking by blocking your site from being framed by other origins.', 'X-Content-Type-Options: nosniff — prevents MIME type sniffing (browsers follow Content-Type strictly).', 'Strict-Transport-Security: Forces HTTPS for 1 year — HSTS header.', 'X-XSS-Protection: Enables browser-built-in XSS filter (legacy browsers).', 'Referrer-Policy: Controls how much referrer info is sent.']);

QA(30, 'Explain how EduStack\'s DSA sheet caching works.',
'EduStack uses an in-memory cache with TTL (Time To Live). Two module-level variables: _dsaSheetCache (stores parsed problems array) and _dsaSheetCacheTime (stores last fetch timestamp). The /api/dsa-sheet/sync endpoint checks if the cache is fresh (Date.now() - _dsaSheetCacheTime < 5 minutes). If fresh, returns cached data. If stale, fetches live from Google Sheets CSV, parses, updates cache, persists to disk.',
['This is a simple TTL (Time To Live) cache pattern — no external cache (Redis) needed for this use case.', 'Fallback chain: in-memory cache -> live Google Sheet fetch -> disk file (parsed_problems.json) -> empty array.', 'Cache bust: ?bust=true query param forces a fresh fetch regardless of TTL. Useful for admin-triggered cache invalidation.', 'On Render.com free tier, the in-memory cache resets on each cold start (process restart). The disk file fallback ensures data is still available.']);

QA(31, 'What is the difference between stateless and stateful authentication?',
'Stateless: Each request contains all authentication information (JWT token). Server does not store session state. Scales horizontally — any server instance can validate the token. Stateless tokens cannot be invalidated before expiry (unless using a token blacklist).',
['Stateful: Server stores session state in DB or memory (session ID -> user data mapping). Each request sends a session ID, server looks up the session. Easy to invalidate (just delete the session). Cannot scale horizontally without shared session store (Redis, MongoDB).', 'EduStack uses HYBRID: JWT for API routes (stateless), MongoDB session store (connect-mongodb-session) for Google OAuth flow (stateful). The OAuth callback requires session state to store passport data between redirect steps.', 'JWT advantage: No DB lookup for session. JWT disadvantage: Cannot revoke before expiry (EduStack mitigates by re-fetching user from DB in isAuth to catch banned/deleted accounts).']);

QA(32, 'What is "module caching" in Node.js? How does it affect EduStack?',
'Node.js caches the result of require() after the first load. Subsequent require() calls for the same module path return the CACHED exports object, not re-execute the module. This means module-level variables (like the mongoose connection, the razorpay instance, the DSA sheet cache) are initialized once and shared across all require() calls.',
['EduStack\'s razorpay instance (require("../config/razorpay")) is a singleton — instantiated once, shared across all controllers that use it.', 'The DSA sheet cache (_dsaSheetCache) is a module-level variable in app.js — it persists as long as the Node.js process runs.', 'Circular dependencies: If module A requires B and B requires A, one of them will get an incomplete exports object. Avoid circular requires by using dependency injection instead.']);

QA(33, 'What is the difference between synchronous and asynchronous operations in Node.js?',
'Synchronous: Execution blocks until the operation completes. No other code runs during this time. Asynchronous: The operation is initiated and the callback/Promise is registered. Execution continues immediately. The callback/Promise resolves when the operation completes (possibly much later).',
['fs.readFileSync() — synchronous, blocks the event loop. Never use in production route handlers.', 'fs.readFile() — asynchronous, does not block. The callback fires when reading completes.', 'EduStack uses async/await for ALL I/O operations: mongoose queries, cloudinary uploads, bcrypt hashing. Synchronous operations (require(), String manipulation, JSON.parse()) are fine for startup but should not be used in request handlers for large data.']);

QA(34, 'Explain the "Don\'t Repeat Yourself" (DRY) principle with examples from EduStack.',
'DRY means extracting repeated logic into reusable functions or modules. EduStack applies DRY throughout: asyncHandler wraps all controllers (not duplicating try/catch in each), sendSuccess/sendError provides standardized responses (not duplicating res.json structure), isAuth middleware handles auth for all protected routes (not duplicating JWT verification in each controller).',
['Without DRY: Every controller has try { ... } catch(err) { res.status(500).json({ success: false, ... }) } — 20+ duplicated error blocks.', 'With DRY: asyncHandler handles errors once. errorHandler formats responses once. Controllers focus only on business logic.', 'requireRole("admin") middleware is reused on all admin-only routes rather than checking req.user.role in each controller.']);

QA(35, 'What is the difference between PUT and PATCH in HTTP?',
'PUT replaces the ENTIRE resource with the request body. If you PUT { name: "Shubham" } to /api/users/123, all other fields (email, avatar, role) are overwritten/removed. PATCH applies a PARTIAL update — only the fields in the request body are modified; other fields remain unchanged.',
['PUT is idempotent: Sending the same PUT request twice produces the same result.', 'PATCH is semantically NOT idempotent (though it can be implemented idempotently). Sending { views: views+1 } twice increments views twice.', 'EduStack uses PATCH for profile updates (only update the fields provided by the user) and avoids PUT for documents with many fields.']);

QA(36, 'What is "pagination" and how do you implement it with Mongoose?',
'Pagination divides large datasets into pages to avoid sending thousands of documents in one response (which would overwhelm the client and slow the server). Two main strategies: Offset-based (skip/limit) and Cursor-based (keyset pagination).',
['Offset pagination: const page = +req.query.page || 1; const limit = +req.query.limit || 20; const skip = (page - 1) * limit; const data = await Subject.find(filter).skip(skip).limit(limit).sort({ createdAt: -1 });', 'Cursor pagination: Use the last document\'s _id as cursor. const data = await Subject.find({ _id: { $gt: lastId } }).limit(limit); — more efficient for large datasets, no performance degradation at high skip values.', 'Always include total count: const total = await Subject.countDocuments(filter); Response includes: { data, page, limit, total, totalPages: Math.ceil(total/limit) }']);

QA(37, 'What is middleware order in Express? What happens if errorHandler is registered before routes?',
'Express processes middleware in registration order. If errorHandler (4-param) is registered BEFORE routes, errors thrown in routes will NOT reach it — the routes are processed after the error handler is already in the chain, and errors cannot travel backwards up the middleware stack.',
['Correct order: security middleware -> body parsers -> session -> routes -> 404 handler -> error handler.', 'The 404 "catch-all" handler (app.use((req, res) => res.status(404)...)) must come AFTER all routes to only catch unmatched routes.', 'EduStack\'s app.js correctly registers errorHandler as the very last middleware: app.use(errorHandler); at the end of all route registrations.']);

QA(38, 'What is the Node.js EventEmitter? How does it work?',
'EventEmitter is Node.js\'s core pub-sub implementation. Objects that extend EventEmitter can emit named events (this.emit("event", data)) and register listeners (obj.on("event", handler)). This is the foundation for all async Node.js operations — streams, HTTP servers, Mongoose connections.',
['emitter.on("event", fn) — registers a listener (called every time event fires).', 'emitter.once("event", fn) — listener fires only once, then auto-removed.', 'emitter.removeListener("event", fn) — removes a specific listener. Failing to do this causes memory leaks.', 'EduStack uses store.on("error", ...) to catch MongoDB session store errors and logs them without crashing.']);

QA(39, 'Explain "idempotency" in the context of API design and payment systems.',
'An operation is idempotent if performing it multiple times has the same effect as performing it once. In payment systems, idempotency is critical: network failures can cause clients to retry requests. Without idempotency, a retry could create duplicate charges.',
['HTTP methods: GET, PUT, DELETE are idempotent. POST is NOT. PATCH is usually not.', 'Razorpay uses idempotency keys on order creation — sending the same idempotency key twice returns the existing order instead of creating a new one.', 'EduStack\'s payment verify endpoint: calling it twice with the same paymentId is safe — the second call finds the payment is already "paid" and returns success without double-granting premium.']);

QA(40, 'What are common Node.js performance optimizations for production?',
'Key production optimizations: (1) Use process clustering (cluster module or PM2 cluster mode) to run one worker per CPU core. (2) Enable HTTP keep-alive to reuse TCP connections. (3) Minimize synchronous operations in request handlers. (4) Use streaming for large responses instead of buffering. (5) Enable Node.js response compression (compression middleware). (6) Reduce middleware per route — only apply isAuth where needed.',
['EduStack on Render.com: Single instance (free tier). Production scale would use PM2 cluster or container orchestration (Kubernetes) to run N instances equal to CPU count.', 'Mongoose connection pooling: Mongoose maintains a connection pool (default 5 connections). This is shared across all requests — not one connection per request.', 'Set NODE_ENV=production: Enables Express production optimizations (caching compiled templates, fewer error details in responses, optimized morgan format).']);

// ── FOOTER ──────────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text(
         'EduStack Masterclass  |  VOLUME 1: Backend Core  |  Page ' + (fp + 1) + ' of ' + range.count +
         '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 }
       );
  }
}

doc.end();
stream.on('finish', function() {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n========================================');
  console.log('  VOLUME 1 PDF Generated Successfully!');
  console.log('========================================');
  console.log('  File  :', OUT);
  console.log('  Pages :', range.count);
  console.log('  Size  :', kb, 'KB');
  console.log('========================================\n');
});
