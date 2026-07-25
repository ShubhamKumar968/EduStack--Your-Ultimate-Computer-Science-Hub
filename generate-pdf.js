'use strict';
// ============================================================
// generate-pdf.js — EduStack Interview Preparation Guide
// Run: node generate-pdf.js
// Output: EduStack_Interview_Prep.pdf
// ============================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'EduStack_Interview_Prep.pdf');
const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));

// Layout constants
const ML=50, MR=545, MB=760, TW=495;

// Colours
const C={
  brand:'#e53e3e', dark:'#1a202c', gray:'#4a5568', light:'#718096',
  accent:'#3182ce', green:'#2f855a', amber:'#b7791f', border:'#e2e8f0',
  codeBg:'#1a1a2e', codeText:'#68d391', white:'#ffffff', purple:'#6b46c1'
};

// ── Helpers ─────────────────────────────────────────────────
let _pg=0;
function newPage(){ if(_pg>0) doc.addPage(); _pg++; }
function ensureSpace(need){ if((MB-doc.y)<need) doc.addPage(); }
function gap(n){ doc.moveDown(n||0.3); }

function H1(t,col){
  col=col||C.brand; ensureSpace(35); gap(0.4);
  var y0 = doc.y;
  doc.rect(ML,y0,TW,20).fill(col);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(C.white).text(t,ML+8,y0+4,{width:TW-16, lineBreak:false});
  doc.y = y0 + 20;
  gap(0.3);
}
function H2(t,col){
  col=col||C.dark; ensureSpace(22); gap(0.2);
  doc.fontSize(10.5).font('Helvetica-Bold').fillColor(col).text(t);
  doc.moveTo(ML,doc.y+1).lineTo(ML+doc.widthOfString(t)*0.9+30,doc.y+1).strokeColor(col).lineWidth(0.8).stroke();
  gap(0.25);
}
function H3(t,col){
  col=col||C.accent; ensureSpace(16); gap(0.15);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(col).text(t); gap(0.1);
}
function P(t){
  ensureSpace(16);
  doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(t,{lineGap:2}); gap(0.2);
}
function B(items,col){
  col=col||C.gray;
  items.forEach(function(item){
    ensureSpace(14);
    doc.fontSize(9).font('Helvetica').fillColor(col).text('\u2022  '+item,{indent:14,lineGap:2});
  }); gap(0.2);
}
function N(items){
  items.forEach(function(item,i){
    ensureSpace(14);
    doc.fontSize(9).font('Helvetica').fillColor(C.gray).text((i+1)+'.  '+item,{indent:14,lineGap:2});
  }); gap(0.2);
}
function CODE(text){
  var lines=text.split('\n'); var lh=10.5, pad=6; var bh=lines.length*lh+pad*2;
  ensureSpace(bh+10); var y0=doc.y;
  doc.rect(ML,y0,TW,bh).fill(C.codeBg);
  doc.fontSize(7.5).font('Courier').fillColor(C.codeText);
  lines.forEach(function(line,i){ doc.text(line,ML+8,y0+pad+(i*lh),{lineBreak:false,width:TW-16}); });
  doc.y=y0+bh; gap(0.35);
}

function TABLE(headers, rows, customWidths) {
  var numCols = headers.length;
  var colWidths = [];
  
  if (customWidths && customWidths.length === numCols) {
    colWidths = customWidths;
  } else {
    var defaultW = Math.floor(TW / numCols);
    for (var k = 0; k < numCols; k++) colWidths.push(defaultW);
  }

  // Calculate header height
  doc.fontSize(8).font('Helvetica-Bold');
  var maxHeaderH = 18;
  headers.forEach(function(h, i) {
    var hH = doc.heightOfString(h, { width: colWidths[i] - 8 }) + 8;
    if (hH > maxHeaderH) maxHeaderH = hH;
  });

  ensureSpace(maxHeaderH + 20);

  // Render header
  var y0 = doc.y;
  doc.rect(ML, y0, TW, maxHeaderH).fill(C.accent);
  var currentX = ML;
  headers.forEach(function(h, i) {
    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.white)
       .text(h, currentX + 4, y0 + 4, { width: colWidths[i] - 8, lineGap: 1 });
    currentX += colWidths[i];
  });

  doc.y = y0 + maxHeaderH;

  // Render rows dynamically with proper auto height & padding
  rows.forEach(function(row, ri) {
    doc.fontSize(7.5).font('Helvetica');
    var maxRowH = 16;
    row.forEach(function(cell, ci) {
      var cellH = doc.heightOfString(String(cell), { width: colWidths[ci] - 8, lineGap: 1.5 }) + 8;
      if (cellH > maxRowH) maxRowH = cellH;
    });

    ensureSpace(maxRowH);
    var ry = doc.y;

    if (ri % 2 === 0) {
      doc.rect(ML, ry, TW, maxRowH).fill('#f7fafc');
    }

    var rX = ML;
    row.forEach(function(cell, ci) {
      doc.fontSize(7.5).font('Helvetica').fillColor(C.gray)
         .text(String(cell), rX + 4, ry + 4, { width: colWidths[ci] - 8, lineGap: 1.5 });
      rX += colWidths[ci];
    });

    doc.y = ry + maxRowH;
  });

  gap(0.35);
}

function QA(q,a){
  doc.fontSize(9).font('Helvetica');
  var qh = doc.heightOfString('Q: ' + q, {width: TW, lineGap: 2}) + 4;
  var ah = doc.heightOfString('A: ' + a, {width: TW - 28, lineGap: 2}) + 4;
  ensureSpace(qh + ah + 10);
  
  var y0 = doc.y;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.accent).text('Q: ' + q, ML, y0, {width: TW, lineGap: 2});
  doc.y = y0 + qh;
  
  var y1 = doc.y;
  doc.rect(ML, y1, 20, ah).fill(C.green);
  doc.fontSize(8).font('Helvetica-Bold').fillColor(C.white).text('A', ML + 6, y1 + 3, {lineBreak: false});
  doc.fontSize(8.5).font('Helvetica').fillColor(C.gray).text(a, ML + 26, y1 + 2, {width: TW - 26, lineGap: 2});
  doc.y = y1 + ah + 4;
  doc.moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor(C.border).lineWidth(0.5).stroke();
  gap(0.3);
}
function INFOBOX(text,col){
  col=col||C.accent; ensureSpace(30);
  doc.fontSize(8.5).font('Helvetica');
  var bh = doc.heightOfString(text, {width: TW - 20, lineGap: 2}) + 12;
  var y0 = doc.y;
  doc.rect(ML, y0, 4, bh).fill(col);
  doc.rect(ML + 4, y0, TW - 4, bh).fill('#ebf8ff');
  doc.fontSize(8.5).font('Helvetica').fillColor(C.dark).text(text, ML + 12, y0 + 6, {width: TW - 20, lineGap: 2});
  doc.y = y0 + bh;
  gap(0.3);
}
function COVER_SEC(num,title,sub){
  newPage(); doc.rect(0,0,595,8).fill(C.brand); gap(1.2);
  doc.fontSize(9.5).font('Helvetica').fillColor(C.light).text('SECTION '+num,{align:'center'});
  doc.fontSize(20).font('Helvetica-Bold').fillColor(C.dark).text(title,{align:'center'});
  if(sub){gap(0.2);doc.fontSize(9.5).font('Helvetica').fillColor(C.gray).text(sub,{align:'center'});}
  doc.moveTo(ML+80,doc.y+6).lineTo(MR-80,doc.y+6).strokeColor(C.border).lineWidth(1).stroke(); gap(0.6);
}

// ================================================================
// PAGE 1 — COVER
// ================================================================
newPage();
doc.rect(0,0,595,8).fill(C.brand); gap(3);
doc.fontSize(38).font('Helvetica-Bold').fillColor(C.brand).text('EduStack',{align:'center'});
doc.fontSize(12).font('Helvetica').fillColor(C.dark).text('Your Ultimate Computer Science Hub',{align:'center'});
gap(0.8);
doc.moveTo(130,doc.y).lineTo(465,doc.y).strokeColor(C.border).lineWidth(1).stroke(); gap(0.8);
doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text('Complete Interview Preparation Guide',{align:'center'});
doc.fontSize(9.5).font('Helvetica').fillColor(C.light).text('Backend \u2022 Security \u2022 APIs \u2022 Database \u2022 60+ Q&As',{align:'center'});
gap(1.5);
var bx=doc.y;
doc.rect(70,bx,455,165).fill('#ebf4ff');
doc.rect(70,bx,4,165).fill(C.accent);
var inf=[['Project','EduStack \u2014 CS Resource Hub for Engineering Students'],['Developer','Shubham Kumar | CSE | NIT Patna'],['Stack','Node.js 18 \u2022 Express.js 4 \u2022 MongoDB Atlas \u2022 Tailwind CSS'],['Auth','JWT + httpOnly Cookie \u2022 OTP Email \u2022 Google OAuth 2.0'],['Files','Multer memoryStorage \u2192 Cloudinary CDN'],['Payments','Razorpay Gateway Integration (test mode)'],['Hosting','Render.com Web Service + MongoDB Atlas Free Tier']];
inf.forEach(function(r,i){
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.accent).text(r[0]+':', 85, bx+10+(i*21), {width:75, lineBreak:false});
  doc.font('Helvetica').fillColor(C.dark).text(r[1], 165, bx+10+(i*21), {width:350, lineBreak:false});
});
doc.y=bx+175; gap(1.5);
doc.fontSize(8).font('Helvetica').fillColor(C.light).text('github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub',{align:'center'});

// ================================================================
// PAGE 2 — TABLE OF CONTENTS
// ================================================================
newPage();
doc.rect(0,0,595,8).fill(C.brand); gap(0.8);
doc.fontSize(16).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents');
gap(0.2); doc.moveTo(ML,doc.y).lineTo(MR,doc.y).strokeColor(C.brand).lineWidth(1.5).stroke(); gap(0.5);
var toc=[
  ['1.','Project Overview & Purpose','3'],
  ['2.','Technology Stack \u2014 19 Libraries Explained','4'],
  ['3.','System Architecture & Request Lifecycle','5'],
  ['4.','Express.js Middleware Pipeline \u2014 Deep Dive','5'],
  ['5.','Authentication \u2014 JWT & httpOnly Cookies','6'],
  ['6.','OTP Email Verification System','7'],
  ['7.','Google OAuth 2.0 \u2014 Complete Flow','7'],
  ['8.','Role-Based Access Control (RBAC)','8'],
  ['9.','API Design, REST Principles & Validation','8'],
  ['10.','Error Handling \u2014 Global Strategy','9'],
  ['11.','MongoDB & Mongoose \u2014 Schema Design','10'],
  ['12.','Mongoose Advanced Patterns','11'],
  ['13.','Security \u2014 All 6 Defence Layers','12'],
  ['14.','File Uploads \u2014 Multer + Cloudinary Pipeline','13'],
  ['15.','Frontend Architecture & Auth Guards','14'],
  ['16.','Production Readiness Audit','14'],
  ['17.','Deployment Guide \u2014 Render.com','16'],
  ['18.','Q&A \u2014 Express & Node.js (10 Qs)','17'],
  ['19.','Q&A \u2014 Auth & Security (12 Qs)','18'],
  ['20.','Q&A \u2014 Database & Mongoose (10 Qs)','20'],
  ['21.','Q&A \u2014 File Uploads & Storage (6 Qs)','21'],
  ['22.','Q&A \u2014 Scalability & Performance (8 Qs)','22'],
  ['23.','Q&A \u2014 Project-Specific (10 Qs)','23'],
  ['24.','Quick Reference Card','25'],
];
toc.forEach(function(r){
  ensureSpace(14);
  var y0 = doc.y;
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.brand).text(r[0], ML, y0, {width: 25, lineBreak: false});
  doc.font('Helvetica').fillColor(C.dark).text(r[1], ML + 25, y0, {width: 420, lineBreak: false});
  doc.fillColor(C.light).text(r[2], ML + 445, y0, {width: 50, align: 'right', lineBreak: false});
  doc.y = y0 + 14;
});
gap(0.3);

// ================================================================
// SECTION 1 — PROJECT OVERVIEW
// ================================================================
COVER_SEC('1','Project Overview & Purpose','What EduStack is, who built it, and why it matters');

H1('1.1  What Is EduStack?');
P('EduStack is a production-grade, full-stack web application built for Computer Science and IT engineering students at NIT Patna and similar institutions. It serves as a one-stop hub consolidating academic resources that are otherwise scattered: lecture notes, previous year question papers (PYQs), DSA interview preparation sheets, and curated AI tool directories. The project was built with real-world backend engineering patterns that showcase serious engineering decision-making.');
P('This is not a CRUD tutorial project. EduStack implements: stateless JWT authentication with httpOnly cookies (OWASP-recommended), email OTP verification with bcrypt hashing and MongoDB TTL auto-cleanup, Google OAuth 2.0 via Passport.js with account linking, role-based access control, per-endpoint rate limiting, NoSQL injection prevention, Cloudinary cloud media pipeline, Razorpay payment gateway integration, and production-safe graceful shutdown. These choices demonstrate production thinking, not just feature delivery.');

H2('Core Feature Modules');
B([
  'Subject Library \u2014 42+ CSE subjects organised by semester (1\u20138) with notes, PYQs, and video lecture links. Paginated, searchable, filterable by semester. Subjects fetched from MongoDB via Mongoose with populate() for related resources.',
  'Authentication System \u2014 Three auth paths: (1) Email + password with OTP email verification; (2) Google OAuth 2.0 one-click login; (3) JWT stored in httpOnly cookie for stateless API auth across all paths.',
  'DSA Sheet \u2014 450+ curated SDE interview problems with direct LeetCode and GeeksforGeeks practice links. Difficulty badges (Easy/Medium/Hard), topic categorisation. Currently bypasses Razorpay to a coming-soon page.',
  'Contribute Module \u2014 Students upload notes or PYQs via multipart form. Files processed by Multer (memoryStorage) and streamed directly to Cloudinary CDN. Zero disk writes \u2014 safe for ephemeral hosting.',
  'Admin Dashboard \u2014 Role-gated panel for creating/editing/deleting subjects and resources, viewing user list, and approving contributions. Protected by isAuth + requireRole(\'admin\') middleware chain.',
  'College Links \u2014 NITP student portals (MIS, Exam portal, Intranet, ERP). Requires login \u2014 demonstrates frontend auth guards via window.requireAuth().',
  'AI Tools Directory \u2014 Curated list of AI productivity tools for CSE students.',
  'Notifications \u2014 MongoDB-stored system notifications for OTP events, welcome, resource approval. Fetched on demand via GET /api/notifications.',
  'Payment Gateway \u2014 Razorpay integration: order creation via POST /api/payments/create-order, HMAC-SHA256 signature verification via POST /api/payments/verify.',
]);

H2('Why This Project Stands Out in Interviews');
B([
  'JWT + httpOnly cookies (not localStorage) \u2014 demonstrates XSS/CSRF security awareness beyond tutorials',
  'OTP with bcrypt hashing + TTL index \u2014 shows beyond-basics database and security knowledge',
  'Google OAuth 2.0 with Passport.js \u2014 demonstrates third-party API integration skills',
  'Rate limiting per endpoint (3 different limiters) \u2014 shows API abuse prevention thinking',
  'express-mongo-sanitize \u2014 shows awareness of NoSQL injection attack vectors',
  'Multer memoryStorage + Cloudinary streaming \u2014 shows cloud infrastructure and DevOps awareness',
  'Global error handler with type-based mapping \u2014 shows structured, production error architecture',
  'Graceful SIGTERM/SIGINT handling \u2014 shows deployment platform (Render, Docker) awareness',
  'MongoDB session store (not MemoryStore) \u2014 shows stateful vs stateless trade-off understanding',
]);

TABLE(
  ['User Type','Access Level','Typical Actions'],
  [
    ['Guest (unauthenticated)','Public pages only','Browse subjects, view landing page, read about DSA sheet'],
    ['User (registered)','Public + all protected features','Enrol in subjects, access DSA sheet, contribute notes'],
    ['Admin (env-configured)','Full access to all features','Create/edit/delete subjects, manage resources, view users'],
  ],
  [120, 120, 255]
);

// ================================================================
// SECTION 2 — TECH STACK
// ================================================================
COVER_SEC('2','Technology Stack','Every library explained \u2014 what it does and why it was chosen');

H1('2.1  Backend \u2014 19 Libraries');
var libRows = [
  ['Node.js','18 LTS','JavaScript runtime. Non-blocking event loop handles thousands of concurrent I/O operations.'],
  ['Express.js','4.19','Minimal web framework. Compose exactly the middleware needed without framework overhead.'],
  ['MongoDB Atlas','Cloud M0','NoSQL document DB. Flexible schema suits varying resource types (PDF, video, link) per subject.'],
  ['Mongoose','8.5','ODM layer. Adds schema validation, pre/post hooks, populate(), timestamps to raw MongoDB driver.'],
  ['jsonwebtoken','9.0','Stateless JWT: sign userId into token, verify signature on each request. No session lookup.'],
  ['bcryptjs','2.4','Adaptive password hashing. 12 salt rounds = ~250ms per hash. Resistant to brute-force.'],
  ['Passport.js','0.7','Authentication middleware. Handles OAuth strategy, token exchange, session serialization.'],
  ['passport-google-oauth20','2.0','Google-specific OAuth 2.0 strategy for Passport. Handles consent screen redirect & profile.'],
  ['Nodemailer','9.0','Email transport. Gmail SMTP with App Password for OTP delivery.'],
  ['Multer','2.2','multipart/form-data parsing. memoryStorage: files as Buffer in RAM, streamed to Cloudinary.'],
  ['Cloudinary SDK','2.5','Cloud CDN for images and PDFs. upload_stream() accepts Buffer. Returns secure_url & public_id.'],
  ['Helmet.js','7.1','11 security HTTP response headers (X-Frame-Options, X-Content-Type-Options, HSTS, etc.).'],
  ['express-rate-limit','7.3','Per-route request throttling. Separate limiters for login, register, OTP with windows & counts.'],
  ['express-mongo-sanitize','2.2','Strips MongoDB operators ($gt, $where, etc.) from req.body/query/params before any DB query.'],
  ['cors','2.8','Allowlist-based CORS. Only listed origins can make credentialed API calls.'],
  ['connect-mongodb-session','5.0','MongoDB-backed Express session store. Sessions persist across restarts.'],
  ['express-validator','7.1','Input validation chains with field-level error reporting. Used in registerRules, loginRules.'],
  ['razorpay','2.9','Payment gateway SDK. Creates orders, verifies HMAC-SHA256 payment signatures.'],
  ['morgan','1.10','HTTP request logger. dev format in development, Apache combined format in production.']
];
TABLE(['Library','Version','Purpose & Why Chosen'], libRows, [110, 45, 340]);

H1('2.2  Frontend Stack');
B([
  'HTML5 (Semantic) \u2014 All pages use semantic elements: <nav>, <main>, <section>, <article>. Screen-reader friendly, SEO-compliant HTML structure.',
  'Tailwind CSS v3 (compiled) \u2014 Utility-first styling. output.css compiled and tree-shaken via CLI \u2014 only classes actually used in HTML are included. Dark mode via dark: prefix variant.',
  'Font Awesome 6.4 \u2014 Icon library via CDN. Used for nav icons, subject badges, CTA buttons, status indicators.',
  'Google Fonts (Inter/Outfit) \u2014 Modern typography loaded via CDN <link> in <head>.',
  'partials.js (custom micro-framework) \u2014 Runtime nav/sidebar injection. Fetches /api/auth/me on load, determines role, injects role-appropriate nav HTML via innerHTML.',
  'subjects.js \u2014 Subject grid rendering, search/filter event handlers, DSA sheet auth guard + Razorpay bypass, semester filter logic.',
  'Vanilla JS \u2014 Deliberate choice: React virtual DOM overhead not justified for a content-heavy site. Plain DOM manipulation is faster to write.',
]);

H1('2.3  Infrastructure');
TABLE(
  ['Service','Plan','What It Provides'],
  [
    ['MongoDB Atlas','Free M0 (512MB)','Cloud NoSQL DB, connection string in MONGO_URI, built-in backups, IP whitelist'],
    ['Cloudinary','Free (25GB)','CDN media hosting for profile pics, subject thumbnails, uploaded PDFs and notes'],
    ['Render.com','Free Web Service','PaaS hosting, auto-deploy on git push, ephemeral disk (files must go to Cloudinary)'],
    ['Gmail SMTP','Free with App Password','OTP email delivery via Nodemailer, requires 16-char App Password'],
    ['Razorpay','Test mode','Payment gateway, rzp_test_* keys for development, no real charges'],
  ],
  [110, 110, 275]
);

// ================================================================
// SECTION 3 — ARCHITECTURE
// ================================================================
COVER_SEC('3','System Architecture','Request lifecycle from browser to MongoDB and back');

H1('3.1  Architecture Pattern \u2014 Monolithic Full-Stack');
P('EduStack uses a monolithic architecture: a single Express.js process serves both the REST API (JSON responses to /api/* routes) and the static HTML/CSS/JS frontend (via express.static). Both layers are deployed together on one Render.com web service on one port.');
INFOBOX('Interview tip: Never say "I used a monolith because it was easy." Say: "For EduStack\'s scale and team size, a monolith offers faster development, simpler deployment, and easier debugging with no loss of functionality. The clean MVC-like layer separation means I could extract services into microservices if traffic demands it."');

H2('Request Lifecycle \u2014 Complete Flow');
N([
  'Browser sends HTTP request to https://your-app.onrender.com',
  'TCP connection established, HTTP request received by Express server',
  'helmet() adds 11 security headers to the response object',
  'cors() reads Origin header, checks against allowedOrigins array, allows or rejects',
  'express.urlencoded() parses form bodies into req.body',
  'express.json() parses application/json bodies into req.body',
  'cookieParser() parses Cookie header, populates req.cookies object',
  'morgan() logs: METHOD URL STATUS response-time ms',
  'express-mongo-sanitize() strips $ and . from req.body, req.query, req.params',
  'session() loads Express session from MongoDB sessions collection',
  'passport.initialize() + passport.session() restore authenticated user into req.user',
  'res.locals middleware: res.locals.user = req.user; res.locals.isLoggedIn = !!req.user',
  'express.static() checks if path matches file in client/public/ \u2014 serves it if found',
  'If no static file: routes to API handlers. Protected routes: isAuth runs next',
  'isAuth: verifies JWT \u2192 User.findById() \u2192 req.user = user \u2192 calls next()',
  'Controller function runs: DB queries, business logic, Cloudinary, emails',
  'sendSuccess() or sendError() returns { success, message, data } JSON response',
  'If next(error) called anywhere: global errorHandler formats and returns error response',
]);

H2('3.2  Directory Structure');
CODE(
'EduStack/\n'+
'\u251c\u2500\u2500 client/                      \u2190 All frontend assets\n'+
'\u2502   \u251c\u2500\u2500 assets/css/output.css       \u2190 Compiled Tailwind (tree-shaken, ~12KB)\n'+
'\u2502   \u251c\u2500\u2500 assets/js/partials.js       \u2190 Nav injector + global auth helpers\n'+
'\u2502   \u251c\u2500\u2500 assets/js/subjects.js       \u2190 Subject grid, search, DSA auth guard\n'+
'\u2502   \u2514\u2500\u2500 public/ index.html, premium-dsa-sheet.html, partials/nav.html\n'+
'\u2514\u2500\u2500 server/                      \u2190 All backend code\n'+
'    \u251c\u2500\u2500 app.js                   \u2190 Entry: middleware + routes + DB bootstrap\n'+
'    \u251c\u2500\u2500 controllers/             \u2190 Business logic (auth, subject, resource, payment)\n'+
'    \u251c\u2500\u2500 routes/                  \u2190 Express Router per resource\n'+
'    \u251c\u2500\u2500 models/                  \u2190 Mongoose schemas (user, subject, resource, otp)\n'+
'    \u251c\u2500\u2500 middlewares/             \u2190 isAuth, requireRole, errorHandler, validateRequest\n'+
'    \u251c\u2500\u2500 validators/              \u2190 express-validator rule arrays\n'+
'    \u251c\u2500\u2500 services/                \u2190 emailService.js, cloudinaryService.js\n'+
'    \u2514\u2500\u2500 utils/                   \u2190 generateToken.js, apiResponse.js, sendEmail.js'
);

// ================================================================
// SECTION 4 — MIDDLEWARE PIPELINE
// ================================================================
COVER_SEC('4','Express.js Middleware Pipeline','Order matters \u2014 here is exactly why each piece is where it is');

H1('4.1  What Is Express Middleware?');
P('Middleware is any function with signature (req, res, next) that sits in Express\'s request-response pipeline. Express processes middleware in registration order. Each middleware either: (1) modifies req/res and calls next() to continue, (2) sends a response to end the cycle, or (3) calls next(error) to jump to the global error handler.');

H2('4.2  Complete Middleware Order \u2014 Why This Exact Sequence');
var mwRows = [
  ['1','helmet()','Security headers on EVERY response before anything else is set'],
  ['2','cors()','Before routes: browsers send OPTIONS preflight before actual POST requests'],
  ['3','express.urlencoded()','Parse bodies before validators/controllers need req.body'],
  ['4','express.json()','Parse JSON bodies into req.body object'],
  ['5','cookieParser()','MUST come before isAuth \u2014 isAuth reads req.cookies.edustack_token'],
  ['6','morgan()','After parsing so full request details available for logging'],
  ['7','mongoSanitize()','Strip injections BEFORE any database query is possible'],
  ['8','session()','OAuth needs session state \u2014 must come before passport middleware'],
  ['9','passport.initialize()','Sets up Passport state \u2014 must be after session'],
  ['10','passport.session()','Restores user from session \u2014 must be after initialize()'],
  ['11','res.locals injector','Sets user context for all downstream handlers'],
  ['12','express.static()','Serve files before routing to API for performance'],
  ['13','API routes','Handles dynamic requests that static serving didn\'t match'],
  ['14','404 catch-all','Must be AFTER all routes \u2014 catches unmatched requests'],
  ['15','errorHandler (4-param)','Must be LAST \u2014 receives errors from next(err) calls']
];
TABLE(['Order','Middleware','Why This Position'], mwRows, [40, 110, 345]);

H1('4.3  Global Error Handler \u2014 Full Implementation');
P('Express identifies a 4-parameter (err, req, res, next) function as an error handler. Any call to next(error) anywhere in the pipeline skips all regular middleware and lands directly here.');
CODE(
'const errorHandler = (err, req, res, next) => {\n'+
'  if(process.env.NODE_ENV===\'development\') console.error(\'[ErrorHandler]:\', err);\n'+
'  else console.error(\'[Error]:\', err.message);\n'+
'\n'+
'  let status = err.statusCode || 500;\n'+
'  let message = err.message || \'Server error\';\n'+
'\n'+
'  if(err.name===\'ValidationError\'){\n'+
'    status=400;\n'+
'    message=Object.values(err.errors).map(e=>e.message).join(\', \');\n'+
'  }\n'+
'  if(err.name===\'CastError\'){ status=400; message=\'Invalid ID: \'+err.path; }\n'+
'  if(err.code===11000){\n'+
'    status=409;\n'+
'    const field=Object.keys(err.keyValue)[0];\n'+
'    message=\'Duplicate \'+field+\' already exists\';\n'+
'  }\n'+
'  if(err.name===\'JsonWebTokenError\') { status=401; message=\'Invalid token\'; }\n'+
'  if(err.name===\'TokenExpiredError\') { status=401; message=\'Session expired\'; }\n'+
'  if(err.code===\'LIMIT_FILE_SIZE\') { status=400; message=\'File too large (5MB max)\'; }\n'+
'\n'+
'  const extra = process.env.NODE_ENV===\'development\' ? {stack:err.stack} : {};\n'+
'  return sendError(res, message, status, [extra]);\n'+
'};'
);

// ================================================================
// SECTION 5 — JWT AUTH
// ================================================================
COVER_SEC('5','Authentication System','JWT cookies, OTP verification, and Google OAuth 2.0');

H1('5.1  JWT Internals \u2014 How Tokens Work');
P('JSON Web Tokens consist of three Base64Url-encoded parts: Header (algorithm + type), Payload (claims), Signature (HMAC of header+payload using secret). The server can verify a token without any database lookup.');
CODE(
'// Creation (generateToken.js):\n'+
'const token = jwt.sign(\n'+
'  { id: userId },           // Payload: store ONLY userId\n'+
'  process.env.JWT_SECRET,   // Secret: min 64 hex chars in env\n'+
'  { expiresIn: \'7d\' }       // Expiry embedded in exp claim\n'+
');\n'+
'\n'+
'// Verification (isAuth.js):\n'+
'const decoded = jwt.verify(token, process.env.JWT_SECRET);\n'+
'// Throws JsonWebTokenError if tampered or malformed\n'+
'// Throws TokenExpiredError if past exp claim'
);

H2('Why Only userId in Payload? (Critical Interview Question)');
P('We store ONLY the userId. We then re-fetch User.findById(decoded.id) on every isAuth call. This means: (1) If an admin bans a user, the ban takes effect on their NEXT request. (2) If a user\'s role changes, it\'s reflected immediately. (3) JWT payload stays small.');

H1('5.2  httpOnly Cookie vs localStorage \u2014 Security Comparison');
TABLE(
  ['Property','localStorage','httpOnly Cookie (EduStack)'],
  [
    ['JS accessible?','Yes: localStorage.getItem()','No: completely invisible to JS'],
    ['XSS risk','Critical: script can steal token','Safe: XSS cannot read httpOnly cookie'],
    ['CSRF risk','Safe: not auto-sent','Mitigated: sameSite + CORS allowlist'],
    ['Auto-sent by browser?','No: JS must add header','Yes: browser auto-sends on every request'],
    ['Expiry control','JS sets/clears','Server controls Max-Age, Secure, HttpOnly'],
    ['HTTPS-only option','No','Yes: secure:true flag'],
  ],
  [110, 160, 225]
);

H1('5.3  Complete Login Flow');
CODE(
'// POST /api/auth/login \u2192 loginLimiter \u2192 loginRules \u2192 validateRequest \u2192 login\n'+
'const user = await User.findOne({ email }).select(\'+password\');\n'+
'if(!user) return sendError(res, \'Invalid credentials\', 401);\n'+
'\n'+
'const match = await bcrypt.compare(req.body.password, user.password);\n'+
'if(!match) return sendError(res, \'Invalid credentials\', 401);\n'+
'\n'+
'if(!user.isVerified) return sendError(res, \'Verify your email first\', 403);\n'+
'\n'+
'attachCookieToken(res, user._id);\n'+
'const safe = { _id, firstName, lastName, email, role, avatar, isVerified };\n'+
'return sendSuccess(res, \'Login successful\', { user: safe });'
);

H1('5.4  isAuth Middleware \u2014 Line by Line');
CODE(
'const isAuth = async (req, res, next) => {\n'+
'  try {\n'+
'    let token;\n'+
'    if(req.headers.authorization?.startsWith(\'Bearer \'))\n'+
'      token = req.headers.authorization.split(\' \')[1];\n'+
'    if(!token && req.cookies?.edustack_token)\n'+
'      token = req.cookies.edustack_token;\n'+
'\n'+
'    if(!token) return sendError(res, \'Please log in to continue\', 401);\n'+
'\n'+
'    const decoded = jwt.verify(token, process.env.JWT_SECRET);\n'+
'    const user = await User.findById(decoded.id).select(\'-password\');\n'+
'    if(!user) return sendError(res, \'Account not found\', 401);\n'+
'    if(!user.isVerified) return sendError(res, \'Email not verified\', 403);\n'+
'\n'+
'    req.user = user; next();\n'+
'  } catch(error) {\n'+
'    if(error.name===\'TokenExpiredError\')\n'+
'      return sendError(res, \'Session expired. Please log in again.\', 401);\n'+
'    return sendError(res, \'Invalid token\', 401);\n'+
'  }\n'+
'};'
);

H1('5.5  OTP System \u2014 4 Abuse Prevention Layers');
B([
  'Layer 1 \u2014 Rate Limiting: express-rate-limit blocks >5 OTP requests per 10 min per IP.',
  'Layer 2 \u2014 OTP Hashing: Raw 6-digit OTP is bcrypt-hashed (rounds=10) before storage.',
  'Layer 3 \u2014 TTL Index: MongoDB\'s TTL thread auto-deletes OTP documents when expiresAt passes.',
  'Layer 4 \u2014 Single-Use Flag: After verification, otp.used = true is saved.',
]);

H1('5.6  Google OAuth 2.0 \u2014 Full Flow');
N([
  'GET /api/auth/google \u2192 Passport redirects to Google consent screen',
  'User grants permission \u2192 Google redirects to GOOGLE_CALLBACK_URL with auth code',
  'Passport exchanges code for access_token \u2192 fetches profile',
  'Strategy callback: findOne({ googleId }) || findOne({ email }) || create new user',
  'Check ADMIN_EMAILS env var \u2192 if match, set role:\'admin\'',
  'attachCookieToken(res, user._id) \u2192 JWT cookie set \u2192 res.redirect(\'/\')',
]);

H1('5.7  RBAC \u2014 requireRole Middleware');
CODE(
'const requireRole = (...roles) => (req, res, next) => {\n'+
'  if(!req.user) return sendError(res, \'Not authenticated\', 401);\n'+
'  if(!roles.includes(req.user.role))\n'+
'    return sendError(res, \'Insufficient permissions\', 403);\n'+
'  next();\n'+
'};'
);

// ================================================================
// SECTION 6 — API DESIGN
// ================================================================
COVER_SEC('6','API Design & REST Principles','Endpoints, validation, response format, REST trade-offs');

H1('6.1  RESTful Design Principles in EduStack');
TABLE(
  ['REST Principle','EduStack Implementation'],
  [
    ['Stateless','Every request carries its own JWT cookie. Server stores no client state.'],
    ['Uniform Interface','All responses: { success, message, data } via apiResponse utils.'],
    ['Resource-Based URLs','/api/subjects, /api/resources, /api/auth \u2014 nouns, not verbs'],
    ['HTTP Verb Semantics','GET=read, POST=create, PUT=update, DELETE=remove'],
    ['HTTP Status Codes','200, 201, 400, 401, 403, 404, 409, 422, 429, 500'],
    ['Pagination','GET /api/subjects?page=1&limit=10&semester=3&search=OS'],
  ],
  [140, 355]
);

H1('6.2  Standard API Response Format');
CODE(
'const sendSuccess = (res, message, data={}, statusCode=200) =>\n'+
'  res.status(statusCode).json({ success: true, message, data });\n'+
'\n'+
'const sendError = (res, message, statusCode=500, errors=[]) =>\n'+
'  res.status(statusCode).json({ success: false, message, errors });'
);

H1('6.3  Input Validation Pipeline \u2014 express-validator');
CODE(
'exports.registerRules = [\n'+
'  body(\'firstName\').trim().notEmpty().withMessage(\'First name required\'),\n'+
'  body(\'email\').isEmail().withMessage(\'Valid email required\').normalizeEmail(),\n'+
'  body(\'password\').isLength({ min: 8 }).withMessage(\'Min 8 characters\'),\n'+
'];\n'+
'\n'+
'module.exports = (req, res, next) => {\n'+
'  const errors = validationResult(req);\n'+
'  if(!errors.isEmpty())\n'+
'    return sendError(res, \'Validation failed\', 422,\n'+
'      errors.array().map(e => ({ field: e.path, message: e.msg }))\n'+
'    );\n'+
'  next();\n'+
'};'
);

// ================================================================
// SECTION 7 — DATABASE
// ================================================================
COVER_SEC('7','MongoDB & Mongoose','Schema design, hooks, indexes, and patterns explained');

H1('7.1  Why MongoDB Over PostgreSQL for EduStack?');
TABLE(
  ['Criteria','MongoDB (chosen)','PostgreSQL (alternative)'],
  [
    ['Schema','Flexible: subjects can have PDF notes, videos, links in same collection','Rigid: schema changes require ALTER TABLE migrations'],
    ['Joins','populate() via $in query (2 queries total)','Native JOINs (1 query but more complex SQL)'],
    ['Free hosting','Atlas M0: 512MB, no sleep','Supabase/Neon: 500MB, sometimes restricted'],
    ['Data format','JSON-native: no serialization overhead','Requires JSON columns or separate tables'],
  ],
  [85, 190, 220]
);

H1('7.2  User Schema \u2014 Key Code');
CODE(
'const userSchema = new mongoose.Schema({\n'+
'  firstName: { type: String, required: true, trim: true },\n'+
'  email:     { type: String, required: true, unique: true, lowercase: true },\n'+
'  password:  { type: String, select: false }, // Excluded by default\n'+
'  googleId:  { type: String, default: null },\n'+
'  role:      { type: String, enum: [\'user\',\'admin\'], default: \'user\' },\n'+
'  isVerified:{ type: Boolean, default: false },\n'+
'  enrolledSubjects: [{ type: mongoose.Schema.Types.ObjectId, ref: \'Subject\' }],\n'+
'}, { timestamps: true });\n'+
'\n'+
'userSchema.pre(\'save\', async function(next) {\n'+
'  if (!this.isModified(\'password\')) return next();\n'+
'  this.password = await bcrypt.hash(this.password, 12);\n'+
'  next();\n'+
'});'
);

H1('7.3  OTP Schema \u2014 TTL Index');
CODE(
'const otpSchema = new mongoose.Schema({\n'+
'  email: { type: String, required: true, index: true },\n'+
'  otp:   { type: String, required: true }, // bcrypt hashed\n'+
'  expiresAt: { type: Date, required: true },\n'+
'  used:  { type: Boolean, default: false },\n'+
'});\n'+
'// Auto-deletes expired documents after expiresAt passing:\n'+
'otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });'
);

H1('7.4  Advanced Mongoose Patterns');
H3('Pattern: populate() for Relational Joins');
CODE(
'const subject = await Subject.findById(id)\n'+
'  .populate(\'resources\', \'title type fileUrl createdAt\');'
);
H3('Pattern: lean() for Read Performance');
CODE(
'const subjects = await Subject.find({ semester: 3 }).lean();'
);

// ================================================================
// SECTION 8 — SECURITY
// ================================================================
COVER_SEC('8','Security \u2014 All 6 Defence Layers','Helmet, CORS, NoSQL injection, rate limiting, bcrypt, cookies');

H1('8.1  Layer 1 \u2014 Helmet.js HTTP Headers');
TABLE(
  ['Header','Attack Prevented','Value'],
  [
    ['X-Content-Type-Options','MIME sniffing','nosniff'],
    ['X-Frame-Options','Clickjacking','DENY'],
    ['X-XSS-Protection','Legacy XSS filter','1; mode=block'],
    ['Strict-Transport-Security','SSL stripping','max-age=31536000'],
  ],
  [140, 200, 155]
);

H1('8.2  Layer 2 \u2014 CORS Allowlist');
CODE(
'app.use(cors({\n'+
'  origin: (origin, callback) => {\n'+
'    if(!origin || allowedOrigins.includes(origin)) return callback(null, true);\n'+
'    return callback(new Error(\'CORS: origin not allowed\'));\n'+
'  },\n'+
'  credentials: true\n'+
'}));'
);

H1('8.3  Layer 3 \u2014 NoSQL Injection Prevention');
CODE(
'// Attacker sends: { "email": {"$gt":""}, "password":"123" }\n'+
'// express-mongo-sanitize strips $ and . operators:\n'+
'app.use(mongoSanitize());\n'+
'// Becomes { "email": {"gt":""} } \u2014 finds nothing!'
);

H1('8.4  Layer 4 \u2014 Rate Limiting Strategy');
CODE(
'const loginLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10 });\n'+
'const registerLimiter = rateLimit({ windowMs: 3600000, max: 5 });\n'+
'const otpLimiter = rateLimit({ windowMs: 600000, max: 5 });'
);

H1('8.5  Layer 5 \u2014 bcrypt Password Security');
P('12 salt rounds = 2^12 = 4096 iterations. ~250ms per hash. Makes brute-force attacks computationally infeasible.');

H1('8.6  Layer 6 \u2014 httpOnly Cookie Security');
CODE(
'res.cookie(\'edustack_token\', token, {\n'+
'  httpOnly: true,\n'+
'  secure: IS_PRODUCTION,\n'+
'  sameSite: IS_PRODUCTION ? \'none\' : \'lax\',\n'+
'  maxAge: 7 * 24 * 60 * 60 * 1000\n'+
'});'
);

// ================================================================
// SECTION 9 — FILE UPLOADS
// ================================================================
COVER_SEC('9','File Uploads \u2014 Multer + Cloudinary','From browser to CDN \u2014 zero disk writes');

H1('9.1  Why memoryStorage?');
P('Render.com has ephemeral disk storage. Files written to server disk are wiped on redeploy. Multer memoryStorage keeps files in RAM as Buffer, streamed directly to Cloudinary.');

H1('9.2  Complete Upload Pipeline');
CODE(
'const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5*1024*1024 } });\n'+
'\n'+
'const uploadToCloudinary = (buffer, folder) =>\n'+
'  new Promise((resolve, reject) => {\n'+
'    cloudinary.uploader.upload_stream(\n'+
'      { folder, resource_type: \'auto\' },\n'+
'      (err, result) => err ? reject(err) : resolve(result)\n'+
'    ).end(buffer);\n'+
'  });'
);

// ================================================================
// SECTION 10 — FRONTEND & PRODUCTION
// ================================================================
COVER_SEC('10','Frontend & Production Readiness','Auth guards, production audit, deployment checklist');

H1('10.1  partials.js Nav Injector');
P('Loaded on every page. Fetches /api/auth/me \u2192 injects role-appropriate nav HTML via innerHTML. Provides global window.requireAuth().');

H1('10.2  Production Readiness Scores');
TABLE(
  ['Category','Score','Assessment'],
  [
    ['Security','8.5/10','JWT+httpOnly+bcrypt+ratelimit+sanitize.'],
    ['Backend Architecture','9.0/10','Clean MVC, global error handler, graceful shutdown.'],
    ['Scalability','5.5/10','No Redis cache, no API versioning.'],
    ['Frontend Quality','8.0/10','Auth guards, toasts, dark mode.'],
  ],
  [130, 55, 310]
);

H1('10.3  Deployment Checklist');
N([
  'Create Web Service on Render, connect repo',
  'Build: cd server && npm install | Start: cd server && npm start',
  'Set NODE_ENV=production, MONGO_URI, JWT_SECRET, GOOGLE_CLIENT_ID',
  'Set CLOUDINARY_*, MAIL_*, ADMIN_EMAILS, CORS_ORIGINS',
  'Test /api/health endpoint',
]);

// ================================================================
// SECTION 11 — Q&A EXPRESS & NODE
// ================================================================
COVER_SEC('11','Q&A \u2014 Express & Node.js','10 questions with complete answers');

QA('What is the Node.js event loop and why is it key to EduStack\'s performance?',
'Node.js runs on a single thread using V8 engine. The event loop delegates all I/O operations (MongoDB queries, Cloudinary uploads, Gmail SMTP calls) to the OS via libuv. While waiting for I/O, the event loop handles other requests. For EduStack with many concurrent DB queries, file uploads, and email sends, this non-blocking model serves thousands of concurrent users from one thread. A traditional thread-per-request model (PHP, Java) would need one OS thread per concurrent user.');

QA('Explain the difference between process.nextTick, setImmediate, and setTimeout in the event loop.',
'process.nextTick runs BEFORE the event loop continues \u2014 immediately after the current operation completes, before any I/O callbacks. setImmediate runs in the "check" phase of the event loop, after I/O callbacks. setTimeout(fn, 0) runs in the "timers" phase, also after I/O, but not guaranteed to run before setImmediate.');

QA('How does async/await work and what is the difference from raw Promises?',
'async/await is syntactic sugar over Promises. async functions return Promises. await pauses the async function execution until the awaited Promise resolves, then resumes with the resolved value. Error handling uses try/catch instead of .catch(). In EduStack controllers: try { const user = await User.findById(id); } catch(err) { next(err); }.');

QA('What is the difference between app.use(path, router) and app.use(router)?',
'app.use(router) without a path mounts the router at / \u2014 it handles all paths. app.use(\'/api/auth\', authRoutes) mounts the router at /api/auth. Inside authRouter, the routes are relative: router.post(\'/login\') becomes POST /api/auth/login on the main app.');

QA('How does the graceful shutdown prevent dropped requests during Render deployments?',
'Render sends SIGTERM before stopping the old container. Our handler: (1) calls server.close() which stops accepting NEW connections but keeps existing ones alive. (2) Waits for all active request handlers to complete. (3) process.exit(0) when done. (4) setTimeout 10s force exit.');

QA('What is Morgan and what is the difference between dev and combined log formats?',
'Morgan is an Express HTTP request logger. Format "dev": short, colored output for terminal. Format "combined": Apache Combined Log Format \u2014 machine-parseable, integrates with log aggregation tools (Papertrail, Logtail, Datadog).');

QA('What is the purpose of res.locals in EduStack?',
'res.locals is a response-scoped object that persists through the middleware chain for a single request. We set res.locals.user = req.user || null; res.locals.isLoggedIn = !!req.user to make user context available across all middleware.');

QA('Explain req.body, req.query, and req.params with examples from your routes.',
'req.params: URL path variables captured by : syntax (/api/subjects/:id). req.query: URL query string after ? (/api/subjects?semester=3). req.body: Parsed request body (POST /api/auth/login).');

QA('How would you add an API endpoint to get a user\'s enrolled subjects?',
'router.get(\'/:id/subjects\', isAuth, userController.getEnrolledSubjects). In controller: const user = await User.findById(req.params.id).populate(\'enrolledSubjects\'). Ensure req.params.id === req.user._id.toString() || req.user.role===\'admin\'.');

QA('What would you change if you were to start this project from scratch?',
'(1) TypeScript from day one. (2) API versioning /api/v1/. (3) Automated tests (Jest + Supertest). (4) Redis for caching and rate limiting. (5) Docker for reproducible environments. (6) Sentry.io error monitoring.');

// ================================================================
// SECTION 12 — Q&A AUTH & SECURITY
// ================================================================
COVER_SEC('12','Q&A \u2014 Authentication & Security','12 deep questions on JWT, OAuth, OTP, and security');

QA('Explain the full JWT lifecycle from creation to expiry.',
'Creation: user logs in \u2192 jwt.sign({id:userId}, JWT_SECRET, {expiresIn:\'7d\'}). Storage: attachCookieToken() sets httpOnly cookie. Verification: jwt.verify(token, JWT_SECRET) on each request. Expiry: after 7 days, jwt.verify() throws TokenExpiredError, isAuth returns 401.');

QA('What is the difference between symmetric and asymmetric JWT signing?',
'Symmetric (HMAC): same secret used for signing and verification. Used in EduStack with JWT_SECRET. Asymmetric (RSA/EC): private key for signing, public key for verification. Used in microservices.');

QA('How would you implement JWT refresh tokens to improve security?',
'Short-lived access tokens (15 min) + long-lived refresh tokens (30 days in DB). On 401, client hits POST /api/auth/refresh with refresh cookie to get new access token.');

QA('What is account enumeration and how does your login controller prevent it?',
'Attacker determines if email exists based on error response. EduStack returns generic message: "Invalid credentials" (401) for both non-existent email and wrong password.');

QA('How does Passport.js serialize and deserialize users for sessions?',
'Serialization: passport.serializeUser((user, done) => done(null, user._id)) stores ObjectId in session. Deserialization: passport.deserializeUser((id, done) => User.findById(id)).');

QA('What is the OAuth state parameter and what does it protect against?',
'Random string generated before redirecting to Google. Verifying state on callback prevents CSRF attacks on the OAuth flow.');

QA('How does bcrypt.compare() work without storing the salt separately?',
'bcrypt embeds the salt inside the hash string itself ($2b$12$<salt><hash>). compare() extracts the salt, re-hashes plaintext, and does constant-time comparison.');

QA('What is a timing attack and how does bcrypt prevent it?',
'Attacker measures response time to deduce secret bytes. Bcrypt constant-time comparison takes identical time regardless of matching bytes.');

QA('How do you securely store API keys and why can\'t they be in the code?',
'API keys in code get committed to Git history. Use environment variables (process.env) via .env file locally and platform environment settings on Render.');

QA('What is the difference between hashing and encryption?',
'Hashing is one-way (password verification). Encryption is two-way with a key (data payload protection).');

QA('How would you add two-factor authentication (2FA) to EduStack?',
'TOTP via Google Authenticator using speakeasy npm package. Generate secret, show QR code, verify 6-digit TOTP token on login.');

QA('What vulnerabilities remain in EduStack that you would fix before production launch?',
'(1) Remove hardcoded admin fallback email. (2) Add CSRF tokens. (3) Add account lockout after 5 failed attempts. (4) Add security audit logging.');

// ================================================================
// SECTION 13 — Q&A DATABASE
// ================================================================
COVER_SEC('13','Q&A \u2014 Database & Mongoose','10 questions on MongoDB design and Mongoose patterns');

QA('What is an ODM and what specific advantages does Mongoose provide?',
'Object Document Mapper. Mongoose adds schema validation, pre/post hooks, virtuals, instance methods, populate(), type casting, and chainable query API over raw MongoDB driver.');

QA('What is the N+1 query problem and how does EduStack avoid it?',
'Fetching 1 parent + N children = N+1 queries. Mongoose populate() batches all IDs into a single $in query (2 queries total).');

QA('Explain pre-save hooks and why isModified is critical.',
'pre(\'save\') runs before document.save(). Without isModified(\'password\'), password would re-hash on every profile update, permanently breaking login.');

QA('What are MongoDB indexes and which ones should EduStack add?',
'Data structures enabling O(log n) lookups. EduStack should add: subjects.semester, subjects.name (text), resources.subject, resources.type.');

QA('What is a Mongoose virtual and when would you add one?',
'Computed property not stored in MongoDB. Example: fullName = firstName + lastName, or enrollmentCount = enrolledSubjects.length.');

QA('How does Mongoose handle ObjectId casting and what is CastError?',
'Mongoose casts string URL params to ObjectId. Malformed 24-char hex strings throw CastError \u2192 global errorHandler returns 400 Bad Request.');

QA('What is the difference between save(), update(), and findByIdAndUpdate()?',
'save() loads document and runs hooks. findByIdAndUpdate() sends update directly to DB without loading document or running hooks.');

QA('How would you implement soft delete?',
'Add deletedAt field. Use pre(/^find/) hook to filter {deletedAt: null} automatically on all queries.');

QA('What are MongoDB transactions and when would EduStack need them?',
'Atomic multi-document operations. Needed for payment processing (order + user status update) and resource creation (Cloudinary + MongoDB doc).');

QA('Explain how to implement pagination efficiently.',
'Offset (skip/limit): Subject.find().skip((page-1)*limit).limit(limit). Keyset (cursor): Subject.find({_id:{$gt:lastId}}).limit(limit).');

// ================================================================
// SECTION 14 — Q&A FILE UPLOADS
// ================================================================
COVER_SEC('14','Q&A \u2014 File Uploads & Storage','6 questions on Multer, Cloudinary, and cloud storage');

QA('Why is checking file.mimetype more secure than file extension?',
'File extensions are easily spoofed by renaming files. file.mimetype is checked against Content-Type header and binary magic bytes.');

QA('What is a Buffer in Node.js and why is it right for file uploads?',
'Raw binary memory chunk allocated outside V8 heap. Perfect for streaming uploaded file bytes directly to Cloudinary without disk persistence.');

QA('Explain how you would handle upload failures midway to Cloudinary.',
'upload_stream Promise rejects \u2192 catch block calls next(err) \u2192 global errorHandler returns 500. No MongoDB doc created yet.');

QA('What are the security risks of file uploads and how does EduStack mitigate them?',
'(1) Malicious file execution: mimetype filter + Cloudinary CDN. (2) DoS: 5MB fileSize limit. (3) Path traversal: Cloudinary public_id used instead of original filename.');

QA('How does Cloudinary\'s secure_url differ from public_id?',
'secure_url: HTTPS CDN URL stored in DB for display. public_id: internal asset identifier used for deletion (destroy) and transformations.');

QA('How would you implement file deletion to avoid orphaned assets?',
'cloudinary.uploader.destroy(resource.cloudinaryPublicId) \u2192 then Resource.findByIdAndDelete() \u2192 pull from Subject.resources.');

// ================================================================
// SECTION 15 — Q&A SCALABILITY
// ================================================================
COVER_SEC('15','Q&A \u2014 Scalability & Performance','8 questions on scaling, caching, and performance');

QA('What is the biggest scalability bottleneck in EduStack and how would you fix it?',
'isAuth querying MongoDB on every request. Fix: Redis cache with 5-min TTL for user session JSON (redis.get(\'user:\'+userId)).');

QA('Explain horizontal vs vertical scaling and which is more appropriate for Node.js.',
'Node.js is single-threaded. Horizontal scaling (multiple instances + PM2 cluster mode) scales compute across CPU cores and servers.');

QA('What is connection pooling in Mongoose?',
'Reusing a pool of pre-established TCP connections (default 5) to MongoDB instead of opening a new connection per query.');

QA('What database indexes would most improve performance?',
'subjects.semester (1), resources.subject (1), resources.type (1), subjects.name text index.');

QA('How would you implement caching for the subject list endpoint?',
'Redis key subjects:sem:3:p:1. Check Redis first; on miss query MongoDB & setex 300s; invalidate key on admin CUD actions.');

QA('What is the difference between Redis and Memcached?',
'Redis supports complex data structures (sets, hashes, lists), pub/sub, persistence, and shared rate limiters. Memcached is key-value string only.');

QA('How would you implement API response compression?',
'app.use(compression()) middleware. Compresses JSON responses using gzip/deflate for clients supporting Accept-Encoding: gzip (60-80% size reduction).');

QA('How would you add a CDN for static assets?',
'Serve client/ static files via Cloudflare Pages or separate CDN service, leaving Express server to focus exclusively on API routes.');

// ================================================================
// SECTION 16 — Q&A PROJECT-SPECIFIC
// ================================================================
COVER_SEC('16','Q&A \u2014 Project-Specific','10 questions unique to EduStack\'s design decisions');

QA('Why did you choose Vanilla JS and Tailwind over React?',
'React\'s virtual DOM overhead is unnecessary for a content-heavy, read-dominant site. Vanilla JS + Tailwind compiled CSS delivers minimal bundle size.');

QA('Explain the partials.js pattern and its trade-offs.',
'Fetches nav HTML asynchronously and injects via innerHTML. Trade-off: eliminates duplicate nav files, but causes minor nav flicker on slow loads.');

QA('How does the DSA sheet auth guard work technically?',
'requireAuth() checks window.currentUser \u2192 if null, re-fetches /api/auth/me \u2192 if unauthorized, shows auth modal; if authorized, opens DSA page.');

QA('Describe the Razorpay payment flow and signature verification.',
'POST /api/payments/create-order creates orderId. Razorpay checkout opens. On callback, server verifies HMAC-SHA256(orderId|\'+paymentId, secret) === signature.');

QA('What was the double-listen crash and what did fixing it teach you?',
'app.js and server.js both called app.listen(). Render\'s start command triggered both \u2192 EADDRINUSE port crash. Fix: single entry point in app.js.');

QA('How does admin role assignment work?',
'Google OAuth callback checks email against process.env.ADMIN_EMAILS comma-separated list. If matched, user.role is set to \'admin\'.');

QA('How would you implement subject search with relevance ranking?',
'MongoDB text index on {name:\'text\', description:\'text\'} with $text search and textScore meta ranking. Algolia for enterprise typo tolerance.');

QA('What testing strategy would you implement?',
'Jest unit tests for utils \u2192 Supertest integration tests for auth & CRUD \u2192 Playwright E2E tests for registration & contribution flows.');

QA('How would you implement real-time notifications?',
'Server-Sent Events (SSE) via GET /api/notifications/stream. Server pushes events to EventSource API without client polling.');

QA('What are the most important monitoring improvements for production?',
'Sentry.io for error tracking with stack traces + UptimeRobot for /api/health pinging + MongoDB Atlas connection alerts.');

// ================================================================
// SECTION 17 — QUICK REFERENCE
// ================================================================
COVER_SEC('17','Quick Reference Card','APIs, environment variables, one-liner definitions');

H1('17.1  Complete API Reference');
CODE(
'# AUTHENTICATION\n'+
'POST /api/auth/register            { firstName, email, password }\n'+
'POST /api/auth/verify-otp          { email, otp, purpose: "verify" }\n'+
'POST /api/auth/login               { email, password } -> httpOnly cookie\n'+
'GET  /api/auth/me                  -> { user: {...} }\n'+
'POST /api/auth/forgot-password     { email }\n'+
'GET  /api/auth/google              -> OAuth redirect\n'+
'\n'+
'# SUBJECTS & RESOURCES\n'+
'GET  /api/subjects                 ?semester=&search=&page=&limit=\n'+
'GET  /api/subjects/:id             populated with resources\n'+
'POST /api/subjects                 ADMIN: create subject\n'+
'GET  /api/resources                ?subjectId=&type=notes|pyq|video\n'+
'POST /api/resources                AUTH: multipart upload file\n'+
'\n'+
'# OTHER\n'+
'GET  /api/health                   PUBLIC: health check'
);

H1('17.2  Environment Variables');
CODE(
'PORT=3000\n'+
'NODE_ENV=production\n'+
'MONGO_URI=mongodb+srv://USER:PASS@cluster.mongodb.net/EduStack\n'+
'JWT_SECRET=<64-char-hex>\n'+
'GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com\n'+
'GOOGLE_CLIENT_SECRET=GOCSPX-xxx\n'+
'CLOUDINARY_CLOUD_NAME=xxx\n'+
'MAIL_USER=your@gmail.com\n'+
'MAIL_PASS=<16-char-app-password>\n'+
'CORS_ORIGINS=https://your-app.onrender.com\n'+
'ADMIN_EMAILS=admin@gmail.com'
);

H1('17.3  One-Liner Concept Definitions');
B([
  'Event Loop: Node.js single-threaded mechanism delegating I/O tasks to libuv OS threads',
  'JWT: Base64(Header).Base64(Payload).HMAC-SHA256 \u2014 stateless cryptographic token',
  'httpOnly cookie: Cookie inaccessible to client JS \u2014 immune to XSS token theft',
  'bcrypt salt: Random bytes added to password before hashing \u2014 defeats rainbow tables',
  'NoSQL injection: Attacker passing MongoDB operators ($gt) via un-sanitized JSON body',
  'CORS: Browser security policy blocking cross-origin XHR requests unless allowed by server headers',
  'TTL index: MongoDB automatic document deletion when Date field exceeds expiration threshold',
  'select:false: Schema configuration hiding field by default unless explicitly requested with .select(\'+field\')',
  'populate(): Mongoose query helper executing batched $in lookup to replace ObjectIds with documents',
  'memoryStorage: Multer storage option keeping uploaded files in RAM Buffer instead of server disk',
  'Ephemeral disk: Cloud platform filesystems wiped on container restarts \u2014 requires external CDN storage',
  'Graceful shutdown: Handling SIGTERM signals to complete active requests before closing HTTP server',
]);

// ── Page footers ─────────────────────────────────────────────
var range = doc.bufferedPageRange();
for(var fp=0; fp<range.count; fp++){
  doc.switchToPage(range.start+fp);
  doc.rect(0,820,595,22).fill('#f7fafc');
  doc.moveTo(0,820).lineTo(595,820).strokeColor(C.border).lineWidth(0.5).stroke();
  doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
     .text('EduStack Interview Prep Guide  \u2022  Page '+(fp+1)+' of '+range.count+'  \u2022  github.com/ShubhamKumar968/EduStack',
       50, 826, {align:'center',width:495});
}

doc.end();
doc.on('end', function(){
  console.log('\n\u2705  PDF generated!');
  console.log('\ud83d\udcc4  File: '+OUT);
  console.log('\ud83d\udcca  Pages: '+range.count);
});
