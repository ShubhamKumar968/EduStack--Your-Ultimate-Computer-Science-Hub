'use strict';
// ================================================================
// EduStack Interview Masterclass — VOLUME 3 (Deep Rewrite)
// MongoDB, Mongoose, Indexing, Caching, Cloudinary & Cloud Storage
// Target: FAANG, MAANG, Tier-1 product-based company interviews
// Run: node generate-part3.js
// Output: EduStack_Vol3_Database_Cloud.pdf
// ================================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'EduStack_Vol3_Database_Cloud.pdf');
const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 20, left: 50, right: 50 }, bufferPages: true });
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const ML = 50, MR = 545, MB = 770, TW = 495;
const C = {
  brand: '#c0392b', accent: '#2471a3', dark: '#1c2833', gray: '#4a5568', light: '#718096',
  green: '#1e8449', greenSoft: '#d5f5e3', amber: '#b7950b', amberSoft: '#fef9e7',
  purple: '#7d3c98', teal: '#148f77',
  border: '#d5d8dc', codeBg: '#0d1117', codeText: '#7ee787',
  white: '#ffffff', offWhite: '#f8f9fa', rowAlt: '#eaf2ff',
};

function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\u2014/g, ' - ').replace(/\u2013/g, ' - ')
    .replace(/\u2018/g, "'").replace(/\u2019/g, "'")
    .replace(/\u201c/g, '"').replace(/\u201d/g, '"')
    .replace(/\u2022/g, '-').replace(/\u2192/g, '->')
    .replace(/\u2713/g, '[OK]').replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/\u20b9/g, 'Rs.');
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
  doc.fontSize(9).font('Helvetica-Bold').fillColor(col).text('SECTION ' + num, { align: 'center' });
  doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(title), { align: 'center' });
  if (subtitle) { gap(0.2); doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(cleanText(subtitle), { align: 'center' }); }
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
    const txt = cleanText(item), colonIdx = txt.indexOf(':');
    if (colonIdx > 0 && colonIdx < 55) {
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.dark).text(txt.slice(0, colonIdx), ML + 16, y0, { continued: true, lineGap: 2.5 });
      doc.font('Helvetica').fillColor(col).text(txt.slice(colonIdx), { lineGap: 2.5 });
    } else { doc.fontSize(8.8).font('Helvetica').fillColor(col).text(txt, ML + 16, y0, { lineGap: 2.5 }); }
    gap(0.15);
  }); gap(0.2);
}

function CODE(text, lang) {
  const arr = cleanText(text).split('\n'), lh = 10.5, pad = 6, MAX_LINES = 36;
  for (let s = 0; s < arr.length; s += MAX_LINES) {
    const chunk = arr.slice(s, s + MAX_LINES), ch = chunk.length * lh + pad * 2 + 12;
    ensureSpace(ch + 8); const y0 = doc.y;
    doc.rect(ML, y0, TW, 12).fill('#161b22');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#58a6ff').text('  ' + (lang || 'JavaScript / Mongoose'), ML + 4, y0 + 2, { lineBreak: false });
    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    chunk.forEach(function(line, i) {
      let lc = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lc = '#8b949e';
      else if (/\b(const|let|var|function|class|require|import)\b/.test(line)) lc = '#ff7b72';
      else if (/\b(return|await|async|if|else|try|catch|new)\b/.test(line)) lc = '#d2a8ff';
      else if (/\b(mongoose\.|User\.|Subject\.|Resource\.|Payment\.|OTP\.)\b/.test(line)) lc = '#79c0ff';
      else if (line.includes('"') || line.includes("'") || line.includes('`')) lc = '#a5d6ff';
      doc.fontSize(8).font('Courier').fillColor(lc).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
    });
    doc.y = y0 + ch; gap(0.35);
  }
}

function DIAGRAM_BOXES(title, steps) {
  ensureSpace(steps.length * 28 + 35); const y0 = doc.y;
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
  const bh = doc.heightOfString(cleanText(text), { width: TW - 28, lineGap: 2, font: 'Helvetica', fontSize: 8.5 }) + 16;
  const y0 = doc.y;
  doc.rect(ML, y0, 5, bh).fill(col); doc.rect(ML + 5, y0, TW - 5, bh).fill(bg);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(col).text(label + ': ', ML + 14, y0 + 8, { continued: true, lineGap: 2 });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(text), { lineGap: 2 });
  doc.y = y0 + bh; gap(0.35);
}

function tipBox(text) { infoBox('FAANG TIP', text, C.green, C.greenSoft); }
function noteBox(text) { infoBox('KEY CONCEPT', text, C.accent, '#ebf5fb'); }
function warnBox(text) { infoBox('COMMON MISTAKE', text, C.amber, C.amberSoft); }

function QA(num, q, ans, details) {
  ensureSpace(60); const y0 = doc.y;
  const qTxt = 'Q' + num + ':  ' + cleanText(q);
  const qh = doc.heightOfString(qTxt, { width: TW - 16, lineGap: 2 }) + 12;
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

function TABLE(headers, rows, widths) {
  widths = widths || [];
  if (!widths.length) { const w = Math.floor(TW / headers.length); headers.forEach(function() { widths.push(w); }); }
  let maxHH = 20;
  headers.forEach(function(h, i) { const hh = doc.heightOfString(cleanText(h), { width: widths[i] - 8, font: 'Helvetica-Bold', fontSize: 8.5 }) + 10; if (hh > maxHH) maxHH = hh; });
  ensureSpace(maxHH + 10); const hy = doc.y;
  doc.rect(ML, hy, TW, maxHH).fill(C.brand);
  let hx = ML;
  headers.forEach(function(h, i) { doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white).text(cleanText(h), hx + 4, hy + 5, { width: widths[i] - 8, lineGap: 1 }); hx += widths[i]; });
  doc.y = hy + maxHH;
  rows.forEach(function(row, ri) {
    let maxRH = 16;
    row.forEach(function(cell, ci) { const rh = doc.heightOfString(cleanText(String(cell)), { width: widths[ci] - 8, lineGap: 1.5, font: 'Helvetica', fontSize: 8 }) + 8; if (rh > maxRH) maxRH = rh; });
    ensureSpace(maxRH); const ry = doc.y;
    if (ri % 2 === 0) doc.rect(ML, ry, TW, maxRH).fill(C.offWhite);
    let rx = ML;
    row.forEach(function(cell, ci) { doc.fontSize(8).font('Helvetica').fillColor(C.gray).text(cleanText(String(cell)), rx + 4, ry + 4, { width: widths[ci] - 8, lineGap: 1.5 }); rx += widths[ci]; });
    doc.moveTo(ML, ry + maxRH).lineTo(MR, ry + maxRH).strokeColor(C.border).lineWidth(0.3).stroke(); doc.y = ry + maxRH;
  }); gap(0.4);
}

// ================================================================
// COVER PAGE
// ================================================================
newPage();
doc.rect(0, 0, 595, 14).fill(C.brand); gap(2.5);
doc.fontSize(40).font('Helvetica-Bold').fillColor(C.brand).text('EduStack Masterclass', { align: 'center' });
gap(0.1);
doc.fontSize(11).font('Helvetica').fillColor(C.dark).text('Your Ultimate Computer Science & Engineering Interview Preparation Hub', { align: 'center' });
gap(0.4);
doc.moveTo(100, doc.y).lineTo(495, doc.y).strokeColor(C.border).lineWidth(1.5).stroke(); gap(0.4);
doc.fontSize(10).font('Helvetica').fillColor(C.accent).text('VOLUME 3 of 4 — MongoDB, Mongoose, Indexing, Caching & Cloud Storage', { align: 'center' });
doc.fontSize(16).font('Helvetica-Bold').fillColor(C.dark).text('Database & Cloud: From Zero to FAANG Interview Ready', { align: 'center' });
doc.fontSize(8.5).font('Helvetica').fillColor(C.light)
   .text('ACID | BSON | WiredTiger | Indexing | Aggregation | Mongoose | TTL Cache | Cloudinary | 40 Deep Q&As', { align: 'center' });
gap(1.2);
const bx = doc.y;
doc.rect(60, bx, 475, 185).fill(C.offWhite); doc.rect(60, bx, 6, 185).fill(C.brand);
const ci2 = [
  ['Project', 'EduStack — CS Student Resource Hub & AI Tutor Platform'],
  ['This Volume', 'MongoDB, Mongoose schemas, Indexing, Aggregation, Caching, Cloudinary, 40 Q&As'],
  ['Volume 1', 'JS Engine, Node.js Event Loop, Express Pipeline, REST API Design'],
  ['Volume 2', 'Authentication, JWT, bcrypt, Google OAuth, XSS, CSRF, Payment Security'],
  ['Volume 4', 'System Design, OS Concepts, DSA Patterns, Microservices, FAANG Scenarios'],
  ['DB Stack', 'MongoDB Atlas + Mongoose 8 + connect-mongodb-session + in-memory TTL cache'],
  ['Media Stack', 'Multer memoryStorage + Cloudinary CDN + bufferToBase64Uri'],
  ['Indexes', 'email (unique), googleId (index:true), { subject:1, type:1 } compound, TTL on OTP'],
];
ci2.forEach(function(r, i) {
  const iy = bx + 14 + (i * 22);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.brand).text(cleanText(r[0]) + ':', 74, iy, { width: 90, lineBreak: false });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(r[1]), 168, iy, { width: 352, lineBreak: false });
});
doc.y = bx + 195; gap(1.2);
doc.fontSize(7.5).font('Helvetica').fillColor(C.light).text('Volume 3 of 4 | Read all 4 volumes to crack any backend/database interview at product-based companies', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// TOC
newPage();
doc.rect(0, 0, 595, 12).fill(C.brand); gap(0.8);
doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents — Volume 3: Database & Cloud');
hr(C.brand);
const toc = [
  ['1', 'ACID Properties & Database Fundamentals', 'Atomicity, Consistency, Isolation, Durability with concrete MongoDB examples'],
  ['2', 'SQL vs NoSQL — When to Use What', 'Trade-offs, scaling patterns, when MongoDB is right and when it is not'],
  ['3', 'MongoDB Internals', 'BSON storage, WiredTiger engine, journaling, write concerns, document model'],
  ['4', 'Mongoose Schema Design — EduStack Models', 'User, Subject, Resource, Payment, OTP schemas with design rationale'],
  ['5', 'Indexing Deep Dive', 'B-Tree structure, compound indexes, partial indexes, covered queries, explain()'],
  ['6', 'Mongoose Advanced Patterns', 'populate(), $lookup, findOneAndUpdate(), select(+password), pre-save hooks'],
  ['7', 'Aggregation Pipeline', '$match, $group, $lookup, $project, $sort with real EduStack examples'],
  ['8', 'Caching Strategies', 'TTL in-memory cache, DSA sheet 5-min cache, Redis patterns, LRU eviction'],
  ['9', 'MongoDB Session Store', 'connect-mongodb-session, sessions collection, session vs JWT'],
  ['10', 'Cloud Media Pipeline', 'multer memoryStorage, bufferToBase64Uri, Cloudinary upload, CDN architecture'],
  ['11', '40 Deep Interview Q&As — Database & Cloud', 'MongoDB, Mongoose, Indexing, ACID, Aggregation, Caching — FAANG level'],
];
toc.forEach(function(r) {
  ensureSpace(28); const y0 = doc.y;
  doc.rect(ML, y0, TW, 24).fill(C.offWhite); doc.rect(ML, y0, 4, 24).fill(C.brand);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.brand).text(r[0] + '.', ML + 10, y0 + 4, { width: 25, lineBreak: false });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(r[1]), ML + 36, y0 + 4, { width: 310, lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(C.gray).text(cleanText(r[2]), ML + 36, y0 + 14, { width: 420, lineBreak: false });
  doc.y = y0 + 26;
});

// ================================================================
// SECTION 1 — ACID PROPERTIES
// ================================================================
sectionBanner('1', 'ACID Properties & Database Fundamentals',
  'Atomicity, Consistency, Isolation, Durability — from first principles with MongoDB examples', C.brand);

h1('1.1  ACID — The Four Pillars of Reliable Transactions', C.brand);
P('ACID is a set of four properties that guarantee database transactions are processed reliably. Understanding ACID is essential for database design interviews at any product-based company. These properties apply to both SQL databases (MySQL, PostgreSQL) and modern NoSQL databases with transaction support (MongoDB 4.0+ supports ACID transactions).');

TABLE(
  ['Property', 'What It Guarantees', 'Without It', 'MongoDB/EduStack Example'],
  [
    ['Atomicity', 'A transaction either FULLY completes or FULLY rolls back. No partial state.', 'Payment deducted from account but order not created — money lost without order.', 'User.create() either succeeds fully or fails — no half-created user documents.'],
    ['Consistency', 'Transactions take the DB from one VALID state to another. Schema rules always maintained.', 'A user document missing required fields violates schema — inconsistent data.', 'Mongoose schema validation: { required: true } ensures consistency before save.'],
    ['Isolation', 'Concurrent transactions do not see each other\'s intermediate state.', 'Two users simultaneously withdraw the last Rs.100 — both succeed (phantom read).', 'MongoDB default: document-level atomicity. Multi-document transactions for cross-collection consistency.'],
    ['Durability', 'Once committed, a transaction persists even after system crashes.', 'Payment confirmed but DB crashes before writing to disk — data lost.', 'MongoDB uses journaling (WAL) — writes go to journal first, then to data files.'],
  ],
  [75, 145, 130, 145]
);

noteBox('MongoDB before v4.0 only had document-level atomicity (a single document write is atomic). MongoDB 4.0+ added multi-document ACID transactions with session.startTransaction() — similar to SQL BEGIN TRANSACTION. EduStack does not currently use multi-document transactions but would need them for complex operations like "transfer premium status" involving multiple collections.');

h1('1.2  BASE vs ACID — Eventual Consistency', C.brand);
P('Many distributed NoSQL databases (Cassandra, DynamoDB) use the BASE model instead of ACID. BASE stands for: Basically Available, Soft state, Eventually consistent. This is a deliberate trade-off: sacrifice strong consistency for higher availability and partition tolerance.');

TABLE(
  ['', 'ACID (Strong Consistency)', 'BASE (Eventual Consistency)'],
  [
    ['Consistency', 'Immediate — all reads see latest committed write', 'Eventual — replicas may temporarily have stale data'],
    ['Availability', 'May sacrifice availability during partition', 'Always available (may serve stale data during partition)'],
    ['Transactions', 'Full multi-document transactions with rollback', 'Usually no cross-partition transactions'],
    ['Use cases', 'Financial systems, order processing, auth', 'Social media feeds, analytics, product catalogs'],
    ['Examples', 'PostgreSQL, MySQL, MongoDB with transactions', 'Cassandra, DynamoDB, CouchDB, ElasticSearch'],
  ],
  [110, 190, 195]
);

// ================================================================
// SECTION 2 — SQL vs NoSQL
// ================================================================
sectionBanner('2', 'SQL vs NoSQL — Decision Framework',
  'When to use relational vs document databases — trade-offs at scale', C.accent);

h1('2.1  The Core Difference', C.accent);
bullets([
  'SQL (Relational): Data stored in tables with rows and columns. Fixed schema defined upfront. Relations through foreign keys and JOINs. ACID transactions natively. Query language: SQL. Examples: PostgreSQL, MySQL, SQLite.',
  'NoSQL (Document): Data stored as documents (JSON-like BSON). Flexible schema — each document can have different fields. Denormalization preferred over JOINs. Horizontal scaling native. Examples: MongoDB, CouchDB.',
  'MongoDB Document Model: A "subject" with its linked "resources" can be queried in ONE collection scan with $lookup, or embedded directly. This is fundamentally different from SQL where you need JOIN across two tables.',
  'EduStack uses MongoDB: Educational content (subjects, resources) has flexible, evolving schemas. The platform needs to store varied resource types (notes, PYQs, playlists, links) with different optional fields. Document model fits this naturally.',
]);

TABLE(
  ['Factor', 'Choose SQL When...', 'Choose MongoDB When...'],
  [
    ['Data Structure', 'Data is highly structured, rarely changes shape, has strong relationships', 'Data shape varies per document, evolves frequently, or is hierarchical'],
    ['Relationships', 'Many complex many-to-many relationships that need JOINs', 'One-to-many or embedded relationships (subject has many resources)'],
    ['Consistency', 'Strong ACID required across multiple tables (banking, payments)', 'Eventual consistency acceptable, or single-collection operations sufficient'],
    ['Scalability', 'Vertical scaling OK, or sharding is complex', 'Horizontal sharding required (write-heavy, massive scale)'],
    ['EduStack fit', 'Payments table has fixed schema (amount, status, orderId)', 'Subjects/Resources have flexible types, optional fields, embeddings'],
  ],
  [85, 205, 205]
);

// ================================================================
// SECTION 3 — MONGODB INTERNALS
// ================================================================
sectionBanner('3', 'MongoDB Internals — BSON, WiredTiger & Journaling',
  'How MongoDB actually stores data — from disk to memory', C.teal);

h1('3.1  BSON — Binary JSON', C.teal);
P('MongoDB stores documents in BSON (Binary JSON), not plain JSON text. BSON extends JSON with additional data types and is designed for efficient traversal, encoding, and decoding. BSON is binary — it is NOT human-readable but is significantly faster to parse than text JSON.');

TABLE(
  ['BSON Type', 'Size', 'Not in JSON?', 'Usage in EduStack'],
  [
    ['ObjectId', '12 bytes', 'Yes — MongoDB\'s unique ID type', 'Every document\'s _id, and all ref: "User" / "Subject" fields'],
    ['Date', '8 bytes (64-bit int)', 'JSON has no Date — would serialize as string', 'createdAt, updatedAt (timestamps), expiresAt in OTP'],
    ['Int32/Int64', '4/8 bytes', 'JSON number has no int/float distinction', 'semester (1-8), views counter, amount in paise'],
    ['Boolean', '1 byte', 'JSON has boolean but BSON is explicit', 'isVerified, isPremium, httpOnly'],
    ['Binary', 'Variable', 'JSON has no binary type', 'File data, bcrypt hashes (stored as string in EduStack)'],
  ],
  [80, 75, 140, 200]
);

h1('3.2  WiredTiger Storage Engine', C.teal);
P('WiredTiger is MongoDB\'s default storage engine (since v3.2). It provides document-level concurrency control, compression, and journaling. Understanding WiredTiger is important for database performance tuning questions.');

bullets([
  'Document-level locking: Multiple operations can simultaneously modify DIFFERENT documents. No collection-level or database-level write locks (unlike older MMAPv1 engine). Enables high write concurrency.',
  'Compression: WiredTiger compresses data on disk using Snappy (default, fast) or zlib (better compression, slower). EduStack\'s Atlas cluster uses Snappy compression by default.',
  'Cache: WiredTiger maintains an in-memory cache (default: 50% of RAM or 256MB, whichever is larger). Frequently accessed documents (hot data) stay in cache for fast reads without disk I/O.',
  'Journaling (Write-Ahead Log): All writes go to the journal FIRST, then to data files. If the server crashes, MongoDB replays the journal on restart to recover committed operations. Ensures Durability (the D in ACID).',
  'Checkpoints: WiredTiger periodically flushes dirty pages (modified data) from cache to disk files. Checkpoint interval: 60 seconds by default. After a crash, MongoDB replays only the journal since the last checkpoint.',
]);

h1('3.3  Write Concerns & Read Preferences', C.teal);
TABLE(
  ['Write Concern', 'What It Means', 'When to Use'],
  [
    ['{ w: 0 }', 'Fire-and-forget — no acknowledgment from MongoDB', 'Low-importance logs, analytics where some loss is acceptable'],
    ['{ w: 1 }', 'Primary node acknowledges the write (default in MongoDB)', 'Standard CRUD operations. Fast, but data can be lost if primary crashes before replication'],
    ['{ w: "majority" }', 'Majority of replica set members acknowledge. Survives primary failure.', 'Critical data: user registrations, payments. EduStack should use this in production.'],
    ['{ w: 1, j: true }', 'Primary acknowledges AND journal write is confirmed', 'Important operations requiring durability guarantee'],
  ],
  [110, 215, 170]
);

// ================================================================
// SECTION 4 — MONGOOSE SCHEMA DESIGN
// ================================================================
sectionBanner('4', 'Mongoose Schema Design — All EduStack Models',
  'User, Subject, Resource, Payment, OTP schemas with full design rationale', C.purple);

h1('4.1  User Schema — Design Deep Dive', C.purple);
CODE(
'// models/user.js — Full schema with design annotations\n' +
'const userSchema = new mongoose.Schema({\n' +
'  // IDENTITY\n' +
'  firstName: { type: String, required: true, trim: true, maxlength: 50 },\n' +
'  lastName:  { type: String, required: true, trim: true, maxlength: 50 },\n' +
'\n' +
'  // Email: unique index + lowercase normalization\n' +
'  // lowercase: true transforms before save — "USER@TEST.COM" -> "user@test.com"\n' +
'  // unique: true creates a unique B-Tree index on this field\n' +
'  email: {\n' +
'    type: String, required: true, unique: true,\n' +
'    lowercase: true, trim: true,\n' +
'    match: [/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/, "Invalid email format"],\n' +
'  },\n' +
'\n' +
'  // AUTHENTICATION\n' +
'  // select: false = NEVER returned in queries unless .select("+password") used\n' +
'  // minlength: 6 = Mongoose-level validation (not bcrypt — bcrypt has no minimum)\n' +
'  password: { type: String, select: false, minlength: 6 },\n' +
'\n' +
'  // index: true = O(log n) lookup on every Google OAuth login (prevents full scan)\n' +
'  googleId:  { type: String, default: null, index: true },\n' +
'\n' +
'  // ROLE & STATUS\n' +
'  role: { type: String, enum: ["user","student","contributor","admin"], default: "user" },\n' +
'  isVerified: { type: Boolean, default: false }, // false until OTP verified\n' +
'  isPremium:  { type: Boolean, default: false }, // true after Razorpay payment\n' +
'\n' +
'  // PROFILE\n' +
'  avatar:      { type: String, default: "default-avatar.png" },\n' +
'  phoneNumber: { type: String, trim: true, default: null },\n' +
'  bio:         { type: String, maxlength: 300, default: "" },\n' +
'  branch:      { type: String, trim: true, default: "CSE" },\n' +
'  semester:    { type: Number, min: 1, max: 8, default: 1 },\n' +
'}, { timestamps: true }); // Auto-adds createdAt, updatedAt\n' +
'\n' +
'// Virtual field — computed, NOT stored in MongoDB\n' +
'userSchema.virtual("fullName").get(function() {\n' +
'  return `${this.firstName} ${this.lastName}`;\n' +
'});\n' +
'\n' +
'// Singleton pattern — prevents model recompilation in hot-reload\n' +
'const User = mongoose.models.User || mongoose.model("User", userSchema);'
);

h1('4.2  Resource Schema — Compound Index', C.purple);
CODE(
'// models/resource.js — Key design decisions\n' +
'const resourceSchema = new mongoose.Schema({\n' +
'  title:       { type: String, required: true, trim: true, maxlength: 150 },\n' +
'  description: { type: String, trim: true, maxlength: 500, default: "" },\n' +
'\n' +
'  // Discriminator field — tells frontend HOW to render this resource\n' +
'  type: {\n' +
'    type: String,\n' +
'    enum: ["note", "pyq", "playlist", "link", "platform"],\n' +
'    required: true,\n' +
'  },\n' +
'\n' +
'  url: { type: String, required: true, trim: true }, // External URL only — no file uploads\n' +
'\n' +
'  // Relationships — ObjectId refs for population\n' +
'  subject:    { type: mongoose.Schema.Types.ObjectId, ref: "Subject", required: true },\n' +
'  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },\n' +
'\n' +
'  isPremium: { type: Boolean, default: false }, // Premium gate per resource\n' +
'  views:     { type: Number, default: 0, min: 0 }, // Simple view counter\n' +
'}, { timestamps: true });\n' +
'\n' +
'// COMPOUND INDEX: Optimizes "all notes for subject X" query pattern\n' +
'// Without this: MongoDB scans ALL resources for subject + type match\n' +
'// With this:    MongoDB looks up the index directly — O(log n) not O(n)\n' +
'resourceSchema.index({ subject: 1, type: 1 });'
);

tipBox('Why a compound index { subject: 1, type: 1 } instead of two separate single-field indexes? MongoDB can only use ONE index per query. A compound index covers BOTH conditions efficiently. Also, the LEFT-PREFIX RULE: { subject: 1, type: 1 } also optimizes queries filtering ONLY by subject (because subject is the leading key), but NOT queries filtering only by type.');

// ================================================================
// SECTION 5 — INDEXING DEEP DIVE
// ================================================================
sectionBanner('5', 'Indexing Deep Dive',
  'B-Tree structure, compound indexes, covered queries, explain() — from first principles', C.brand);

h1('5.1  How Indexes Work — B-Tree Structure', C.brand);
P('A database index is a separate data structure (separate from the collection) that MongoDB maintains to support fast lookup of documents. Without an index, MongoDB must perform a "collection scan" — reading every document to find matches. With an index, MongoDB can jump directly to the matching location.');
P('MongoDB uses B-Tree (Balanced Tree) indexes. A B-Tree keeps data sorted and provides O(log n) time complexity for search, insert, and delete. For a collection of 10 million documents, finding a user by email takes about 23 comparisons with a B-Tree index vs 10 million reads without.');

TABLE(
  ['Index Type', 'What It Does', 'EduStack Usage', 'Performance Impact'],
  [
    ['Single Field', 'B-Tree on one field. Supports equality, range, sort queries.', 'googleId: true, email: unique:true', 'O(log n) lookup vs O(n) collection scan'],
    ['Compound', 'B-Tree on multiple fields in order. Left-prefix rule.', '{ subject: 1, type: 1 } on Resource', 'Covers multi-field queries with single index lookup'],
    ['Unique', 'Single-field + uniqueness constraint. MongoDB rejects duplicates.', 'email: { unique: true }', 'Prevents duplicate inserts at DB level + O(log n) lookup'],
    ['TTL (Time-To-Live)', 'Background worker deletes documents when expiresAt is in the past.', 'expiresAt on OTP collection', 'Automatic cleanup — no cron job needed'],
    ['Text Index', 'Full-text search on string fields. Supports $text: { $search: "..." }.', 'Not yet used — could index subject.name for search', 'Enables full-text search on collection'],
  ],
  [85, 145, 145, 120]
);

h1('5.2  The Left-Prefix Rule for Compound Indexes', C.brand);
CODE(
'// Compound index: { subject: 1, type: 1 }\n' +
'// Index keys are stored sorted: first by subject, then by type within same subject\n' +
'\n' +
'// QUERY 1: Filter by BOTH subject AND type -> USES INDEX (both fields covered)\n' +
'Resource.find({ subject: subjectId, type: "note" });\n' +
'\n' +
'// QUERY 2: Filter by ONLY subject (left prefix) -> USES INDEX (partial use)\n' +
'Resource.find({ subject: subjectId });\n' +
'\n' +
'// QUERY 3: Filter by ONLY type (right field, no left prefix) -> COLLECTION SCAN\n' +
'Resource.find({ type: "note" }); // Cannot use { subject:1, type:1 } alone!\n' +
'// For this query, you would need a separate { type: 1 } index\n' +
'\n' +
'// Verify with explain():\n' +
'const explanation = await Resource.find({ subject: subjectId, type: "note" })\n' +
'  .explain("executionStats");\n' +
'console.log(explanation.queryPlanner.winningPlan.inputStage.indexName);\n' +
'// Expected: "subject_1_type_1"\n' +
'console.log(explanation.executionStats.totalDocsExamined);\n' +
'// With index: small number. Without index: = total documents in collection'
);

h1('5.3  Covered Queries — Zero Document Reads', C.brand);
P('A "covered query" is one where ALL data needed for the response is available IN the index itself — MongoDB never needs to load the actual documents from disk. This is the fastest possible query type.');

CODE(
'// Covered query example:\n' +
'// Index: { subject: 1, type: 1 }\n' +
'// Query: find by subject + type, return ONLY subject and type fields\n' +
'const types = await Resource.find(\n' +
'  { subject: subjectId, type: "note" },  // Filter\n' +
'  { subject: 1, type: 1, _id: 0 }        // Projection: only indexed fields\n' +
');\n' +
'// MongoDB reads from index only — ZERO document reads from disk\n' +
'// explain() will show: "IXSCAN" with no "FETCH" stage\n' +
'\n' +
'// NOT a covered query:\n' +
'Resource.find({ subject: subjectId }, { title: 1 });\n' +
'// "title" is NOT in the index — MongoDB must fetch the document\n' +
'// explain() shows: "IXSCAN" -> "FETCH" (additional disk read per document)'
);

// ================================================================
// SECTION 6 — MONGOOSE ADVANCED PATTERNS
// ================================================================
sectionBanner('6', 'Mongoose Advanced Patterns',
  'populate(), $lookup, findOneAndUpdate(), select(+password), pre-save hooks', C.accent);

h1('6.1  populate() vs $lookup — When to Use Each', C.accent);
P('Both populate() and $lookup join data from different collections. populate() is Mongoose-specific and issues a separate query for each referenced document. $lookup is MongoDB\'s native aggregation JOIN that retrieves related documents in a single pipeline stage.');

CODE(
'// populate() — Mongoose convenience method (runs separate query)\n' +
'// Gets all resources and populates the "subject" and "uploadedBy" fields\n' +
'const resources = await Resource.find({ type: "note" })\n' +
'  .populate("subject", "name code semester")   // Only select name, code, semester from Subject\n' +
'  .populate("uploadedBy", "firstName email");   // Only select firstName, email from User\n' +
'\n' +
'// Under the hood: 3 queries:\n' +
'// 1. Resource.find({ type: "note" }) -> array of resources\n' +
'// 2. Subject.find({ _id: { $in: [subjectIds...] } }) -> subjects\n' +
'// 3. User.find({ _id: { $in: [userIds...] } }) -> users\n' +
'// Then Mongoose merges the results in JavaScript memory\n' +
'\n' +
'// $lookup — Native MongoDB aggregation JOIN (single pipeline)\n' +
'const resources = await Resource.aggregate([\n' +
'  { $match: { type: "note" } },\n' +
'  { $lookup: {\n' +
'      from: "subjects",           // Collection name (lowercase plural)\n' +
'      localField: "subject",      // Field in Resource (ObjectId)\n' +
'      foreignField: "_id",        // Field in Subject\n' +
'      as: "subjectData",          // Output array field name\n' +
'  }},\n' +
'  { $unwind: "$subjectData" },    // Flatten array to single object\n' +
']);\n' +
'\n' +
'// Use populate() for simple lookups in application code (cleaner)\n' +
'// Use $lookup in aggregation pipelines where you need $group, $sort, $count etc.'
);

h1('6.2  findOneAndUpdate() — Atomic Read-Modify-Write', C.accent);
CODE(
'// findOneAndUpdate() atomically finds + updates in single MongoDB operation\n' +
'// Returns EITHER the old document OR the new document based on { new: } option\n' +
'\n' +
'// 1. Mark user as verified after OTP check:\n' +
'const user = await User.findOneAndUpdate(\n' +
'  { email: normalizedEmail },      // Filter\n' +
'  { isVerified: true },            // Update\n' +
'  { new: true }                    // Return the UPDATED document (not the old one)\n' +
');\n' +
'\n' +
'// 2. Grant premium after payment:\n' +
'await User.findByIdAndUpdate(req.user._id, { isPremium: true });\n' +
'// findByIdAndUpdate is shorthand for findOneAndUpdate({ _id: id }, ...)\n' +
'\n' +
'// 3. Update payment status:\n' +
'await Payment.findOneAndUpdate(\n' +
'  { razorpayOrderId },             // Find by Razorpay order ID\n' +
'  { status: "paid", razorpayPaymentId, razorpaySignature }, // Update multiple fields\n' +
');\n' +
'\n' +
'// 4. Upsert OTP (create or update):\n' +
'await OTP.findOneAndUpdate(\n' +
'  { email },                       // Filter\n' +
'  { email, code, expiresAt },      // Update/set fields\n' +
'  { upsert: true, new: true }      // CREATE if not found + return new doc\n' +
');\n' +
'\n' +
'// WHY NOT find() then save()?\n' +
'// const user = await User.findOne({ email });\n' +
'// user.isVerified = true;\n' +
'// await user.save();\n' +
'// This is TWO operations — a race condition can occur between find and save.\n' +
'// findOneAndUpdate is ATOMIC — safe for concurrent requests.'
);

h1('6.3  Mongoose Middleware (Hooks)', C.accent);
bullets([
  'Pre hooks: Run before a model operation. Used in EduStack to hash passwords before save: userSchema.pre("save", async function() { ... }). The function MUST be a regular function (not arrow) so "this" = document instance.',
  'Post hooks: Run after an operation. Useful for sending emails after user creation, triggering side effects.',
  'isModified(): userSchema.pre("save") checks if(!this.isModified("password")) return next() — prevents re-hashing an already-hashed password when saving unrelated fields (e.g., updating avatar).',
  'pre("validate"): Runs before Mongoose validation. Useful for transforming data before validation rules are checked.',
  'Query middleware: pre("find"), pre("findOne") — run before queries. Can add default filters (e.g., always exclude soft-deleted documents).',
]);

// ================================================================
// SECTION 7 — AGGREGATION PIPELINE
// ================================================================
sectionBanner('7', 'MongoDB Aggregation Pipeline',
  '$match, $group, $lookup, $project, $sort — from first principles', C.teal);

h1('7.1  What is the Aggregation Pipeline?', C.teal);
P('MongoDB\'s aggregation pipeline is a data processing framework that transforms documents through a sequence of stages. Each stage takes the output of the previous stage as input. This is similar to Unix pipes: data flows through a series of transformations.');

CODE(
'// Aggregation Pipeline Example: Count resources per subject, sorted by count\n' +
'const resourceStats = await Resource.aggregate([\n' +
'\n' +
'  // STAGE 1: $match — Filter documents (like WHERE in SQL)\n' +
'  { $match: { isPremium: false } }, // Only count free resources\n' +
'\n' +
'  // STAGE 2: $group — Group by field, compute aggregates\n' +
'  { $group: {\n' +
'      _id: "$subject",              // Group by subject ObjectId\n' +
'      totalResources: { $sum: 1 }, // Count documents per group\n' +
'      typeBreakdown: { $push: "$type" }, // Collect all types into array\n' +
'      avgViews: { $avg: "$views" },  // Average views per subject\n' +
'  }},\n' +
'\n' +
'  // STAGE 3: $lookup — JOIN with subjects collection\n' +
'  { $lookup: {\n' +
'      from: "subjects",\n' +
'      localField: "_id",            // _id here is the subject ObjectId from $group\n' +
'      foreignField: "_id",\n' +
'      as: "subjectInfo",\n' +
'  }},\n' +
'\n' +
'  // STAGE 4: $unwind — Deconstruct subjectInfo array (each doc has one subject)\n' +
'  { $unwind: "$subjectInfo" },\n' +
'\n' +
'  // STAGE 5: $project — Shape the output (like SELECT in SQL)\n' +
'  { $project: {\n' +
'      subjectName: "$subjectInfo.name",\n' +
'      subjectCode: "$subjectInfo.code",\n' +
'      totalResources: 1,\n' +
'      avgViews: { $round: ["$avgViews", 2] }, // Round to 2 decimal places\n' +
'      _id: 0,  // Exclude _id from output\n' +
'  }},\n' +
'\n' +
'  // STAGE 6: $sort — Sort output\n' +
'  { $sort: { totalResources: -1 } }, // Descending: most resources first\n' +
'\n' +
'  // STAGE 7: $limit — Pagination\n' +
'  { $limit: 10 }, // Top 10 subjects by resource count\n' +
']);\n' +
'\n' +
'// Aggregation NEVER returns Mongoose Documents — always plain JS objects\n' +
'// Schema validation and virtuals do NOT apply to aggregation output'
);

tipBox('Aggregation pipeline key insight: Order of stages matters for performance. Always $match FIRST to reduce the number of documents flowing through subsequent stages. Placing $match after $lookup means MongoDB joins all documents first, then filters — much slower. MongoDB can use indexes for $match placed at the pipeline beginning.');

// ================================================================
// SECTION 8 — CACHING STRATEGIES
// ================================================================
sectionBanner('8', 'Caching Strategies',
  'EduStack\'s TTL in-memory cache, Redis patterns, LRU eviction — from first principles', C.green);

h1('8.1  Why Cache? The Performance Problem', C.green);
P('EduStack\'s DSA sheet contains 450+ problems sourced from a public Google Sheet CSV. Without caching, every request to /api/dsa-sheet would fetch and parse the entire CSV from Google Sheets (network I/O + CSV parsing). At 100 requests/minute, this would hammer Google\'s servers and slow every user request to 500ms+.');

h2('EduStack\'s In-Memory TTL Cache Implementation');
CODE(
'// app.js — In-memory TTL cache for DSA sheet (real EduStack code)\n' +
'\n' +
'let _dsaSheetCache = null;         // Stores parsed problems array\n' +
'let _dsaSheetCacheTime = 0;        // Last successful fetch timestamp\n' +
'const DSA_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes TTL\n' +
'\n' +
'app.get("/api/dsa-sheet/sync", async (req, res) => {\n' +
'  const bustCache = req.query.bust || false;\n' +
'\n' +
'  // Check if cache is FRESH (within 5 minutes)\n' +
'  const isFresh = _dsaSheetCache && (Date.now() - _dsaSheetCacheTime < DSA_CACHE_TTL_MS);\n' +
'\n' +
'  if (isFresh && !bustCache) {\n' +
'    // CACHE HIT: Return immediately without any I/O\n' +
'    return res.json({ success: true, source: "cache", data: _dsaSheetCache });\n' +
'  }\n' +
'\n' +
'  // CACHE MISS or BUST: Fetch live from Google Sheets\n' +
'  try {\n' +
'    const csvText = await fetchCSV(GOOGLE_SHEET_CSV_URL); // HTTP request\n' +
'    const liveProblems = csvLinesToProblems(parseCSVText(csvText));\n' +
'\n' +
'    if (liveProblems && liveProblems.length > 5) {\n' +
'      _dsaSheetCache = liveProblems;       // Update in-memory cache\n' +
'      _dsaSheetCacheTime = Date.now();     // Reset TTL timer\n' +
'      fs.writeFileSync(jsonPath, JSON.stringify(liveProblems, null, 2)); // Persist to disk\n' +
'      return res.json({ success: true, source: "live", data: liveProblems });\n' +
'    }\n' +
'  } catch (err) {\n' +
'    // Fallback chain: in-memory stale -> disk file -> empty array\n' +
'    if (_dsaSheetCache) return res.json({ source: "stale-cache", data: _dsaSheetCache });\n' +
'    const diskData = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));\n' +
'    return res.json({ source: "disk-fallback", data: diskData });\n' +
'  }\n' +
'});'
);

h1('8.2  Cache Patterns — Beyond Simple TTL', C.green);
TABLE(
  ['Pattern', 'How It Works', 'Use Case', 'EduStack Equivalent'],
  [
    ['TTL Cache', 'Expire cache entry after N seconds. Re-fetch on next request.', 'Data that changes periodically (DSA sheet updates hourly)', 'DSA sheet: 5-minute TTL cache'],
    ['LRU Cache', 'Least Recently Used eviction. When cache is full, remove the item accessed longest ago.', 'Many objects, limited memory — keep hot data in cache', 'Not used — only one cached object (DSA sheet)'],
    ['Cache-Aside', 'App checks cache first. Cache miss -> load from DB -> write to cache -> return.', 'DB query results: user profiles, subject lists', 'Could cache User.findById(id) results'],
    ['Write-Through', 'Write to cache AND DB simultaneously. Cache always has latest.', 'Write-heavy systems needing read speed', 'Could use when updating payment status'],
    ['Read-Through', 'Cache handles DB misses automatically. App only talks to cache.', 'Transparent caching layer (Redis, Memcached as cache layer)', 'Redis caching layer in production scale'],
  ],
  [80, 150, 130, 135]
);

h1('8.3  Redis for Production Caching', C.green);
bullets([
  'Redis is an in-memory key-value store used as a distributed cache. Unlike EduStack\'s single-process memory cache, Redis survives process restarts and is shared across multiple Node.js instances (cluster mode or multiple servers).',
  'Why Redis over in-memory for production: EduStack on Render.com\'s free tier restarts periodically (cold starts). The DSA cache resets on every restart. Redis (persistent or with replication) would retain cache across restarts.',
  'Redis data structures: Strings (simple key-value), Lists (queues), Sets, Sorted Sets (leaderboards), Hashes (object-like), Pub/Sub (real-time messaging). All stored in RAM for microsecond latency.',
  'Redis patterns in Node.js: const client = redis.createClient(); await client.setEx("dsa_cache", 300, JSON.stringify(data)); const cached = await client.get("dsa_cache"); if (cached) return JSON.parse(cached);',
  'Eviction policies: allkeys-lru (remove least recently used when memory full), volatile-ttl (remove keys with shortest TTL), noeviction (return error when full). Configure based on your caching needs.',
]);

// ================================================================
// SECTION 9 — MONGODB SESSION STORE
// ================================================================
sectionBanner('9', 'MongoDB Session Store',
  'connect-mongodb-session, the sessions collection, session vs JWT comparison', C.accent);

h1('9.1  How Sessions Work in EduStack', C.accent);
P('EduStack uses express-session with connect-mongodb-session as the storage adapter. This creates a "sessions" collection in MongoDB where session data is persisted. Sessions are used exclusively for Google OAuth flow — regular email/password auth uses only JWT cookies.');

CODE(
'// app.js — MongoDB Session Store Configuration\n' +
'const MongoDBStore = require("connect-mongodb-session")(session);\n' +
'\n' +
'const store = new MongoDBStore({\n' +
'  uri: process.env.MONGO_URI,  // Same MongoDB Atlas cluster\n' +
'  collection: "sessions",       // Stores sessions in a "sessions" collection\n' +
'});\n' +
'\n' +
'store.on("error", function(error) {\n' +
'  console.error("Session Store Error:", error); // Log but don\'t crash\n' +
'});\n' +
'\n' +
'app.use(session({\n' +
'  secret: process.env.JWT_SECRET,  // Used to sign session ID cookie\n' +
'  resave: false,                   // Don\'t save session if unmodified\n' +
'  saveUninitialized: false,        // Don\'t create session until data is stored\n' +
'  cookie: {\n' +
'    secure: IS_PRODUCTION,         // HTTPS-only in production\n' +
'    httpOnly: true,                // JS cannot read session cookie\n' +
'    sameSite: IS_PRODUCTION ? "none" : "lax",\n' +
'    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days\n' +
'  },\n' +
'  store: store,  // Persist sessions to MongoDB (not in-memory)\n' +
'}));\n' +
'\n' +
'// Passport uses the session to store user._id between OAuth redirects:\n' +
'passport.serializeUser((user, done) => done(null, user._id));\n' +
'passport.deserializeUser(async (id, done) => {\n' +
'  const user = await User.findById(id);\n' +
'  done(null, user);\n' +
'});'
);

noteBox('The "sessions" collection in MongoDB stores: _id (session ID), session (serialized session data including passport.user = user._id), expires (TTL for auto-cleanup). MongoDB automatically cleans up expired sessions. Session ID is a cryptographically random string, not the user ID — it is safe to store in a cookie.');

// ================================================================
// SECTION 10 — CLOUD MEDIA PIPELINE
// ================================================================
sectionBanner('10', 'Cloud Media Pipeline — Multer + Cloudinary',
  'memoryStorage, bufferToBase64Uri, Cloudinary upload, CDN architecture', C.purple);

h1('10.1  Why Not Store Files on the Server?', C.purple);
bullets([
  'Ephemeral filesystem: Render.com (and most PaaS platforms) uses an ephemeral filesystem. Files written to disk are LOST when the process restarts or the container is recreated. A deploy wipes all local files.',
  'Stateless requirement: Running multiple Node.js instances (horizontal scaling) means different instances have different local files. Request 1 to server-A uploads avatar. Request 2 to server-B asks for the avatar — server-B has no file.',
  'CDN advantages: Cloudinary serves files from a global CDN with edge locations. Users in India get images from the nearest Cloudinary edge node, not from your Render.com server. Much faster image delivery.',
  'Storage scalability: Cloudinary has effectively unlimited storage (paid). Local disk is limited to the server\'s volume size.',
]);

h1('10.2  The Full Upload Pipeline', C.purple);
DIAGRAM_BOXES('EduStack Avatar Upload Flow', [
  { label: 'Step 1: Frontend sends multipart/form-data POST request with image file (+ other form fields)' },
  { label: 'Step 2: Multer middleware (multer({ storage: multer.memoryStorage() })) reads the file into req.file.buffer (RAM, not disk)' },
  { label: 'Step 3: bufferToBase64Uri(req.file): Creates "data:image/jpeg;base64,<base64String>" data URI from Buffer' },
  { label: 'Step 4: cloudinary.uploader.upload(base64Uri, { folder: "edustack_profiles", timeout: 60000 })' },
  { label: 'Step 5: Cloudinary stores image in cloud storage, generates secure HTTPS CDN URL (uploaded.secure_url)' },
  { label: 'Step 6: avatarUrl = uploaded.secure_url is stored in User.avatar in MongoDB' },
  { label: 'Step 7: Frontend receives the Cloudinary CDN URL and uses it as <img src=...>' },
]);

CODE(
'// config/cloudinary.js — Cloudinary configuration\n' +
'const { v2: cloudinary } = require("cloudinary");\n' +
'\n' +
'cloudinary.config({\n' +
'  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,  // From .env\n' +
'  api_key:    process.env.CLOUDINARY_API_KEY,      // From .env\n' +
'  api_secret: process.env.CLOUDINARY_API_SECRET,   // From .env — SECRET\n' +
'});\n' +
'\n' +
'// Convert multer Buffer to Cloudinary-compatible data URI\n' +
'const bufferToBase64Uri = (file) => {\n' +
'  const b64 = Buffer.from(file.buffer).toString("base64");\n' +
'  const mimeType = file.mimetype; // e.g., "image/jpeg", "image/png"\n' +
'  return `data:${mimeType};base64,${b64}`;\n' +
'};\n' +
'\n' +
'// authController.js — Avatar upload with fallback:\n' +
'if (req.file) {\n' +
'  try {\n' +
'    const base64Uri = bufferToBase64Uri(req.file);\n' +
'    const uploaded = await cloudinary.uploader.upload(base64Uri, {\n' +
'      folder: "edustack_profiles",\n' +
'      timeout: 60000, // 60 second timeout for large uploads\n' +
'    });\n' +
'    avatarUrl = uploaded.secure_url; // HTTPS Cloudinary CDN URL\n' +
'  } catch (cloudErr) {\n' +
'    console.warn("Cloudinary upload failed:", cloudErr.message);\n' +
'    // Fallback: store base64 directly in DB (large document — not ideal for prod)\n' +
'    avatarUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;\n' +
'  }\n' +
'}'
);

// ================================================================
// SECTION 11 — 40 DEEP Q&As
// ================================================================
sectionBanner('11', '40 Deep Interview Q&As — Database & Cloud',
  'MongoDB, Mongoose, Indexing, ACID, Aggregation, Caching — FAANG level', C.brand);

infoBox('About This Section', 'These 40 questions cover databases, MongoDB internals, Mongoose ODM patterns, indexing, and cloud storage at FAANG/Tier-1 interview depth. All answers reference EduStack\'s actual production database design.', C.accent);

QA(1, 'What is MongoDB? How is it different from SQL databases?',
'MongoDB is a document-oriented NoSQL database. Data is stored as BSON (Binary JSON) documents in collections (analogous to SQL tables). Documents in the same collection can have different fields — there is no rigid schema enforced at the database level (Mongoose adds schema validation at the application level).',
['SQL: Rows in tables with fixed columns, JOINs for relationships, ACID by default, strong consistency.', 'MongoDB: Documents in collections with flexible structure, $lookup for joins (or embed related data), ACID per document (multi-document ACID via transactions in v4.0+).', 'EduStack uses MongoDB: Educational content schemas evolve frequently, different resource types have different optional fields, and Atlas provides managed hosting with automatic failover.']);

QA(2, 'Explain ACID properties with a concrete example.',
'ACID ensures database transactions are reliable. Example: User pays Rs.5 for premium access. The transaction must: (A) Atomically mark payment as "paid" AND set isPremium:true — both or neither. (C) Keep user schema consistent — isPremium must be boolean, not string. (I) Two concurrent payment verifications don\'t see each other\'s partial state. (D) Once isPremium is set true, it persists even if the server crashes immediately after.',
['MongoDB document-level atomic writes: Updating { isPremium: true } on a single User document is atomic — it either fully completes or doesn\'t.', 'Multi-document ACID: The Payment status update AND User.isPremium update are in different collections. For true ACID across both, a MongoDB session.startTransaction() would be needed.', 'EduStack\'s current design: If server crashes between Payment update and User.isPremium update, the payment is marked "paid" but premium not granted — a known gap that could be fixed with transactions.']);

QA(3, 'What is a Mongoose schema? Why use Mongoose instead of raw MongoDB driver?',
'A Mongoose schema defines the structure, types, defaults, validators, and indexes for documents in a collection. Mongoose provides: schema validation before saves, middleware hooks (pre/post), virtuals (computed properties), method definitions, population (reference resolution), and a cleaner query API.',
['Raw MongoDB driver: const coll = db.collection("users"); await coll.insertOne({...}) — no validation, no hooks, no schema.', 'Mongoose: const User = mongoose.model("User", userSchema); await User.create({...}) — validates against schema, runs pre-save hooks, enforces types and constraints.', 'EduStack uses Mongoose 8 for all database operations — schema validation catches data errors early (at app layer) before they reach MongoDB.']);

QA(4, 'Explain Mongoose\'s unique index. How does it differ from unique: true in schema?',
'In Mongoose, unique: true in the schema field definition creates a MongoDB unique index on that field. It does NOT add Mongoose validation — it relies on MongoDB throwing an E11000 error on duplicate insert. The difference: Mongoose validation fires before save (returns ValidationError), while unique constraint fires at DB level (returns MongoServerError with code 11000).',
['This means Mongoose does not check uniqueness before inserting — it attempts the insert and catches the DB error if duplicate.', 'The correct way to handle duplicate email: Use User.findOne({ email }) before User.create() for a user-friendly error message. Rely on E11000 as the safety net (in case of race condition between findOne and create).', 'EduStack\'s errorHandler maps err.code === 11000 to HTTP 409 Conflict.']);

QA(5, 'What is the difference between .save() and .create() in Mongoose?',
'.create() is a static method that creates a new document and saves it in one call. It is equivalent to new Model(data).save(). .save() is an instance method on a Mongoose document — called when you want to save changes to an existing document or a manually created instance.',
['User.create({ email }) is shorthand for: const user = new User({ email }); await user.save();', '.save() runs pre-save middleware (bcrypt hook) — so does .create() since it calls save() internally.', 'findOneAndUpdate() does NOT trigger pre-save hooks (it goes directly to MongoDB). If you need hooks to run, use find() then save().']);

QA(6, 'How does Mongoose\'s .lean() method affect query results? When should you use it?',
'By default, Mongoose queries return Mongoose Document objects — JavaScript objects with prototype methods (save(), validate(), get(), set()), virtuals, and tracking for modified paths. .lean() returns plain JavaScript objects without any Mongoose-specific overhead.',
['.lean() use cases: Read-only operations where you will not call save(), API responses where you just need the data, aggregation results (aggregation already returns plain objects).', 'Performance: .lean() is 2-3x faster and uses less memory than regular Mongoose Documents because there is no document instantiation overhead.', 'Do NOT use .lean() if: You need to call doc.save(), doc.comparePassword(), or access schema virtuals like user.fullName.']);

QA(7, 'What is a MongoDB aggregation pipeline? How is it different from a regular query?',
'Regular queries (find, findOne, findById) filter and return documents from a single collection with minimal transformation. Aggregation pipelines process documents through a series of stages that can: filter ($match), group ($group), join ($lookup), reshape ($project), sort ($sort), and compute ($addFields, $count, $sum).',
['Aggregation is more powerful: Can compute statistics (average views per subject), join across collections, reshape output structure, and perform multi-step transformations.', 'Aggregation returns plain JavaScript objects, NOT Mongoose Documents. Schema virtuals, methods, and instanceof checks do not work on aggregation output.', 'Use cases in EduStack: Resource count per subject, payment totals per user, most-viewed resources, user enrollment statistics.']);

QA(8, 'Explain MongoDB\'s $match stage. When should it be the FIRST stage?',
'$match filters documents passing through the pipeline, similar to find(). It should almost ALWAYS be the first stage because: (1) MongoDB can use indexes for $match at the pipeline start, (2) It reduces the number of documents processed by subsequent stages (expensive $lookup, $group) — critical for performance.',
['Placing $match FIRST: MongoDB processes only the matching documents through all subsequent stages.', 'Placing $match AFTER $lookup: MongoDB first joins ALL documents, then filters. This means joining potentially millions of documents before discarding most of them.', 'Exception: Sometimes you need to $match on a joined field. In that case, $lookup first then $match on the joined field — unavoidable but be aware of the performance cost.']);

QA(9, 'What is an ObjectId in MongoDB? How is it structured?',
'ObjectId is MongoDB\'s default _id type — a 12-byte unique identifier. Structure: 4 bytes = Unix timestamp (seconds since epoch), 5 bytes = random value (unique per machine+process), 3 bytes = incrementing counter (unique within same second on same machine).',
['ObjectId encodes creation time: new mongoose.Types.ObjectId().getTimestamp() returns the date the ID was created. This means you can sort by _id to get chronological order.', 'ObjectId vs UUID: ObjectId is 12 bytes (vs UUID\'s 16 bytes). ObjectId has temporal locality — IDs created together are numerically close, improving B-Tree index performance.', 'Always use ObjectId for _id unless you have a specific reason to override. Never use email as _id — it cannot be changed without updating all references.']);

QA(10, 'What is the EduStack DSA sheet caching strategy? What are its limitations?',
'EduStack uses an in-memory TTL cache stored in module-level variables in app.js: _dsaSheetCache (parsed problems array) and _dsaSheetCacheTime (last fetch timestamp). Cache TTL is 5 minutes. On cache miss, it fetches live from Google Sheets CSV, parses, updates cache, and persists to disk. Fallback: stale cache -> disk file -> empty array.',
['Limitation 1: Not shared across processes. In cluster mode (multiple Node.js instances), each instance has its own cache — they each make independent fetches.', 'Limitation 2: Cache resets on every process restart (Render.com cold starts). The disk fallback (parsed_problems.json) provides continuity.', 'Limitation 3: No cache eviction on update. If the Google Sheet is updated, users see stale data for up to 5 minutes. The ?bust=true query parameter forces a fresh fetch for admins.', 'Production improvement: Use Redis as shared cache with automatic expiry.']);

QA(11, 'What is a TTL index in MongoDB? How does it work for OTP collection?',
'A TTL (Time-To-Live) index tells MongoDB to automatically delete documents after a specified time. For the OTP collection, the TTL index is on the expiresAt field with expireAfterSeconds: 0 — meaning MongoDB deletes documents as soon as their expiresAt timestamp is in the past.',
['MongoDB\'s background TTL monitor thread runs every 60 seconds. It scans all TTL-indexed collections and deletes expired documents.', 'No cron job needed: MongoDB handles OTP cleanup automatically. This is more reliable than manual cleanup (no missed runs, no maintenance burden).', 'Behavior when expiresAt is reached: The document is NOT immediately deleted — it is deleted within 60 seconds of expiry (TTL monitor granularity). Always check expiresAt manually in your code for exact timing.']);

QA(12, 'Explain the compound index { subject: 1, type: 1 } on the Resource collection.',
'This compound index optimizes queries that filter by both subject AND type. The 1 means ascending order. The index keys are stored sorted: first by subject ObjectId, then by type within the same subject. This is the most common query pattern for EduStack\'s resource API: "give me all notes (type: note) for subject X".',
['Left-prefix rule: { subject: 1, type: 1 } also optimizes queries filtering ONLY by subject (Resource.find({ subject: id })). But NOT queries filtering only by type.', 'Without this index: MongoDB must scan ALL resources and check both conditions on each document — O(n) where n is total resources.', 'With this index: MongoDB jumps directly to the subject position in the index, then scans the type sub-range — O(log n) effectively.']);

QA(13, 'What is populate() in Mongoose and what queries does it run?',
'populate() resolves ObjectId references by fetching the referenced documents from their collection. It runs a SEPARATE query for each referenced collection (N+1 query problem for naive use, but Mongoose batches by field).',
['Resource.find().populate("subject") runs: 1) Resource.find() 2) Subject.find({ _id: { $in: [all subject ids] } }). Mongoose merges results in memory.', 'N+1 Problem: If you have 100 resources each referencing different users, populate("uploadedBy") makes 1 + 1 = 2 queries (Mongoose batches all user IDs into one query). NOT 101 queries.', 'Alternative: Use $lookup in aggregation for complex joins that need additional pipeline stages (filtering, sorting the joined data).']);

QA(14, 'How does MongoDB connection pooling work? How many connections does EduStack maintain?',
'Mongoose (via the MongoDB driver) maintains a connection pool — a set of reusable database connections. Rather than opening a new TCP connection for every query (expensive), the pool keeps N connections open and assigns them to queries as needed.',
['Default pool size: Mongoose/MongoDB driver default is 5 connections per pool (configurable via mongoose.connect(uri, { maxPoolSize: 10 })).', 'Connection lifecycle: mongoose.connect() creates the pool on startup. All controllers share these 5 connections. If all 5 are busy and a 6th query comes in, it waits for a connection to become free.', 'EduStack\'s bootstrap: app.js connects mongoose.connect(DB_PATH) once at startup. All controllers use the same pool. Never call mongoose.connect() per request!']);

QA(15, 'What is the difference between findById and findOne({ _id: id })?',
'findById(id) is Mongoose syntactic sugar for findOne({ _id: id }). Mongoose casts the id to ObjectId automatically. The performance is identical — both use the _id index.',
['findById("abc") where "abc" is not a valid ObjectId: findById silently returns null (Mongoose catches the CastError). findOne({ _id: "abc" }) throws a CastError — you must handle it.', 'findById is preferred for clarity when fetching by primary key. findOne is preferred for compound conditions: findOne({ email: normalizedEmail }).', 'findByIdAndUpdate, findByIdAndDelete are also sugar for findOneAndUpdate/findOneAndDelete with _id.']);

QA(16, 'Explain Mongoose virtuals. What is the fullName virtual in EduStack?',
'Virtuals are computed properties on Mongoose documents that are NOT stored in MongoDB. They are computed on-the-fly when accessed. The fullName virtual in User model: userSchema.virtual("fullName").get(function() { return this.firstName + " " + this.lastName; })',
['Virtuals are NOT included in JSON output by default. To include: userSchema.set("toJSON", { virtuals: true }) or when calling doc.toJSON({ virtuals: true }).', 'Virtual setter: Can create setter virtuals that split a full name into firstName + lastName.', 'Use cases: computed display names, derived URLs, age from birthdate, aggregated counts from related collections.']);

QA(17, 'What is mongoose.models.User || mongoose.model("User", userSchema)? Why the OR?',
'mongoose.model("Model", schema) compiles the model and registers it with Mongoose. If you call mongoose.model("User", schema) a SECOND time (e.g., in hot-reload dev environments like nodemon, or when a test file imports the model multiple times), Mongoose throws OverwriteModelError.',
['mongoose.models.User: If the model is already compiled and registered, return the existing model. If not, compile from schema.', 'In development with nodemon: File changes trigger process restart — model is fresh. No issue.', 'In test environments: Multiple test files may import User model. Without this guard, model compilation runs multiple times.']);

QA(18, 'What does timestamps: true do in Mongoose?',
'timestamps: true automatically adds two fields to every document: createdAt (Date — when the document was first created) and updatedAt (Date — automatically updated whenever the document is saved). These are managed by Mongoose, not by your code.',
['Performance: createdAt is useful for sorting by newest first: User.find().sort({ createdAt: -1 })', 'updatedAt is automatically updated on every .save(), findOneAndUpdate(), etc. — you never need to manually set it.', 'EduStack uses timestamps: true on ALL schemas (User, Subject, Resource, Payment, OTP) for auditing and debugging.']);

QA(19, 'What is the upsert option in Mongoose? How does EduStack use it for OTP?',
'upsert: true in findOneAndUpdate means: if a matching document is found, UPDATE it; if NO matching document is found, CREATE a new one (insert). This is an atomic operation — find + create/update in a single MongoDB command.',
['OTP upsert: OTP.findOneAndUpdate({ email }, { code, expiresAt }, { upsert: true }). First OTP request: creates new OTP document. Resend OTP: updates the existing document with a new code and expiry.', 'Without upsert: You would need findOne() then if (existing) update() else create() — two round-trips and a potential race condition.', 'upsert is also used for: session management, counter updates (but use $inc for counters), idempotent operations.']);

QA(20, 'What is select: false in Mongoose? Name other field-level options.',
'select: false means the field is EXCLUDED from all query results unless explicitly requested with .select("+fieldName"). Used in EduStack for password — prevents accidental exposure.',
['Other field options: required: [true, "Error msg"] (validation). unique: true (unique index). default: value (default value). min/max (numeric range validation). maxlength (string length validation). trim: true (auto-trim whitespace). lowercase: true (auto-lowercase). enum: [...] (only allowed values). index: true (create index). match: [regex, "msg"] (regex validation).', 'Type coercion: Mongoose automatically casts values to the declared type. "3" for a Number type becomes 3. "true" for Boolean becomes true.', 'Custom validators: validate: { validator: fn, message: "msg" } for complex validation rules.']);

QA(21, 'Explain write concern in MongoDB. What is the default?',
'Write concern specifies how many replica set members must acknowledge a write before the MongoDB driver considers it successful. Default: { w: 1 } — the primary node acknowledges.',
['{ w: 0 }: No acknowledgment — fire-and-forget. Fastest but data can be lost.', '{ w: 1 }: Primary acknowledges. Standard for most operations.', '{ w: "majority" }: More than half the replica set acknowledges. Survives primary failure. Recommended for critical data (EduStack payments, user creation).', '{ j: true }: Primary acknowledges AND confirms journal write. Guarantees durability even if process crashes.']);

QA(22, 'What is MongoDB Atlas? How does EduStack use it?',
'MongoDB Atlas is MongoDB\'s fully managed cloud database service. It provides: automatic backups, point-in-time recovery, automatic failover with replica sets, performance monitoring, automatic security patching, and a visual query performance advisor.',
['EduStack connects via: mongoose.connect(process.env.MONGO_URI) where MONGO_URI is the Atlas connection string (mongodb+srv://...). The connection string includes credentials, cluster hostname, and TLS settings.', 'Atlas features EduStack benefits from: Replica set (automatic failover), Atlas Search (could enable full-text search on subjects), Performance Advisor (suggests missing indexes), Data Explorer (visual DB browser).', 'MONGO_URI is in .env — never hardcoded. The Atlas cluster uses TLS encryption for all connections.']);

QA(23, 'What is the difference between embedded documents and references in MongoDB?',
'Embedded: Store related data directly inside the parent document as a subdocument or array. References: Store the ObjectId of the related document and use populate() or $lookup to retrieve it.',
['Embed when: Related data is always accessed together, data belongs to one parent, no need to query related data independently. Example: User\'s address object embedded in user document.', 'Reference when: Related data is large and not always needed, data has its own identity and can be updated independently, many-to-many relationships. EduStack: Resource references Subject by ObjectId (a resource belongs to one subject, but subjects can be queried independently).', 'EduStack design: Resources reference Subject (many resources per subject — reference). Subject does NOT embed resources (too many, and resources have their own lifecycle).']);

QA(24, 'What is the aggregation $group stage? What accumulators are available?',
'$group groups documents by a specified key (_id field) and computes aggregate values for each group using accumulator operators.',
['Accumulators: $sum (total or count), $avg (average), $min/$max (min/max value in group), $push (array of values), $addToSet (unique values array), $first/$last (first/last value in group after sorting), $count (number of documents).', 'Example: Group resources by type and count: { $group: { _id: "$type", count: { $sum: 1 } } } — gives { _id: "note", count: 45 }, { _id: "pyq", count: 23 }, etc.', 'Important: $group can only compute values from fields in the documents entering the stage. To include subject name, you need $lookup before $group.']);

QA(25, 'How does EduStack parse and use the Google Sheets CSV data?',
'EduStack fetches the published CSV URL from Google Sheets using Node\'s built-in https.get() (not axios/fetch), following HTTP redirects manually. parseCSVText() manually parses CSV text handling quoted fields, escaped quotes, and CRLF line endings. csvLinesToProblems() maps CSV rows to problem objects.',
['Custom CSV parser: Handles edge cases like fields containing commas in quotes: "Google, Amazon" is a single field. Standard JSON.parse() cannot handle this.', 'Google Sheets redirect: The CSV URL redirects (302) to the actual data URL. EduStack\'s fetchCSV() follows redirect chains manually.', 'Merge with static file: Live CSV data is merged with parsed_problems.json to preserve manually-added GitHub solution URLs and video links that are not in the Google Sheet.']);

QA(26, 'What is connection string format in MongoDB? What is the difference between mongodb:// and mongodb+srv://?',
'mongodb://: Legacy connection string. Specifies host:port directly. Example: mongodb://user:pass@localhost:27017/mydb.',
['mongodb+srv://: DNS Seedlist connection format. Instead of listing all replica set members, uses a single SRV DNS record that resolves to multiple hosts. MongoDB Atlas uses this format.', 'SRV advantages: When Atlas adds/removes nodes from the replica set, the DNS record is updated — no need to update connection strings. Also includes TLS settings automatically.', 'EduStack: Uses mongodb+srv://username:password@cluster.mongodb.net/edustack — Atlas format with automatic TLS.']);

QA(27, 'Explain Mongoose\'s populate() with select. How do you avoid over-fetching?',
'populate("field") fetches ALL fields of the referenced document by default. Use populate({ path: "field", select: "name email -_id" }) to select only needed fields.',
['Over-fetching problem: Resource.find().populate("subject") fetches the entire Subject document (description, thumbnail, all fields) even if you only need subject.name.', 'Optimized: Resource.find().populate("subject", "name code -_id") — only fetches name and code from Subject. Reduces network bandwidth and memory.', 'EduStack example: Resource.find().populate("uploadedBy", "firstName email") — only fetches first name and email from the uploading admin user.']);

QA(28, 'What is an aggregation $project stage? How does it differ from .select()?',
'$project shapes the output of a pipeline stage — include or exclude fields, rename fields, compute new fields using expressions. Unlike .select() (which can only include/exclude existing fields), $project can compute new fields using operators ($concat, $sum, $cond, $dateToString, etc.).',
['Include fields: { $project: { name: 1, code: 1 } } — include only name and code.', 'Compute new fields: { $project: { fullName: { $concat: ["$firstName", " ", "$lastName"] }, yearJoined: { $year: "$createdAt" } } }', 'Rename fields: { $project: { subjectName: "$name" } } — renames "name" to "subjectName" in output.']);

QA(29, 'How does EduStack handle the case where Cloudinary upload fails?',
'If cloudinary.uploader.upload() throws an error (network timeout, quota exceeded, invalid image), EduStack catches the error and falls back to storing the image as a base64 data URI string directly in the User.avatar field.',
['Fallback: avatarUrl = "data:image/jpeg;base64," + req.file.buffer.toString("base64") — stores the entire image binary as a string in MongoDB.', 'Limitation: Base64 encoding increases size by ~33%. A 100KB image becomes a 133KB MongoDB field. Large base64 data URIs slow down user document reads.', 'Better production approach: If Cloudinary fails, either retry, use a fallback CDN, or return an error and ask the user to upload again. Storing binary in MongoDB is an antipattern for images.']);

QA(30, 'What is mongoose.connect()? What are the important options?',
'mongoose.connect(uri, options) establishes the MongoDB connection pool and returns a Promise. EduStack calls it once at server startup in app.js before starting the HTTP server.',
['Key options: maxPoolSize (default 5), serverSelectionTimeoutMS (how long to wait to find a healthy server), socketTimeoutMS (how long to wait for a response), family: 4 (force IPv4 — sometimes needed in cloud environments).', 'Error handling: EduStack uses .then() and .catch(). If connection fails, process.exit(1) is called — no point running without a database.', 'Mongoose events: mongoose.connection.on("connected", ...), mongoose.connection.on("error", ...) — useful for monitoring.']);

QA(31, 'What is the $lookup aggregation operator? Write an example.',
'$lookup is MongoDB\'s aggregation JOIN. It combines documents from two collections based on a matching field. Produces an array of matching documents in the output.',
['Basic $lookup: { $lookup: { from: "users", localField: "uploadedBy", foreignField: "_id", as: "uploaderInfo" } } — joins resources with their uploading user.', '$unwind: Since $lookup produces an array, $unwind flattens it: { $unwind: "$uploaderInfo" } converts the array to a single embedded object.', 'Pipeline $lookup (more powerful): { $lookup: { from: "resources", let: { subId: "$_id" }, pipeline: [ { $match: { $expr: { $eq: ["$subject", "$$subId"] } } }, { $limit: 5 } ], as: "resources" } } — join with additional pipeline stages inside lookup.']);

QA(32, 'What is the N+1 query problem in Mongoose? How do you solve it?',
'N+1 problem: Fetching N parent documents, then making a separate query for each parent\'s related data — N+1 total queries. Example: Fetch 20 resources (1 query), then for each resource fetch its subject (20 queries) = 21 total queries.',
['Mongoose solution: populate() batches all related IDs into a single $in query: 1 query for resources + 1 query for ALL unique subjects = 2 queries (not 21).', '$lookup solution: Single aggregation pipeline — 1 query total for both resources and their subjects.', 'Dataloader pattern (for GraphQL): Batches and caches related queries. Not needed for EduStack\'s REST API since Mongoose populate() handles batching automatically.']);

QA(33, 'Explain how EduStack\'s CSVLinesToProblems function works at a high level.',
'csvLinesToProblems() processes the 2D array of CSV rows (lines) and converts them into structured problem objects. It maintains state for the "current category" and "current subtopic" as it iterates rows. Special rows update the category/subtopic state. Data rows (where col2 is a number) are converted to problem objects.',
['Category detection: If col0 (first cell) has a non-empty, non-admin value, it becomes the new currentCategory.', 'Subtopic detection: Rows where col2 is not a number AND col4 is empty/placeholder are treated as subtopic headers.', 'Company name filtering: isOnlyCompanyNames() checks if an "intuition" field is actually just company names (e.g., "Google, Amazon") — filters these out to prevent misleading data.']);

QA(34, 'What is a MongoDB replica set? How does it provide high availability?',
'A replica set is a group of MongoDB servers that maintain the same data. One server is the Primary (handles all writes). Others are Secondaries (replicate from primary asynchronously). If the primary fails, secondaries hold an automatic election to choose a new primary.',
['Atlas M0 (free tier): 3-node replica set in a single region. Auto-failover within ~30 seconds if primary fails.', 'Replication: Every write to the primary is replicated to secondaries within milliseconds. Read preference can route reads to secondaries to distribute load.', 'Connection string: mongoose.connect("mongodb+srv://...") automatically discovers all replica set members via DNS SRV records. Client transparently reconnects to the new primary after failover.']);

QA(35, 'What is the significance of the "sessions" collection created by connect-mongodb-session?',
'The sessions collection stores user session data for EduStack\'s Google OAuth flow. Each document represents one active session: { _id: sessionId, session: { passport: { user: userId }, ... }, expires: Date }. The _id is the session ID stored as a cookie in the user\'s browser.',
['Session ID security: The session ID is a cryptographically random string (not predictable). It is signed with JWT_SECRET using the session secret option — prevents session ID forgery.', 'TTL: sessions collection has a MongoDB TTL index on expires field. Expired sessions are auto-deleted. No manual session cleanup needed.', 'Session vs JWT trade-off: If the sessions collection is deleted, all logged-in users are logged out. JWT has no central store — you cannot invalidate JWTs this way.']);

QA(36, 'How does mongoose.find() differ from mongoose.aggregate()? When to use each?',
'find() returns Mongoose Documents from a single collection with optional filtering, projection, sorting, and population. aggregate() processes documents through a pipeline of stages that can transform, join, group, and compute — returns plain JavaScript objects.',
['Use find() when: Simple CRUD queries, need Mongoose Document features (save(), populate(), virtuals), single collection access.', 'Use aggregate() when: Computing statistics, grouping data, joining multiple collections in complex ways, reshaping output structure, counting with complex conditions.', 'Performance: aggregate() can be more efficient for complex operations (server-side processing) but is more complex to write. find() is simpler for straightforward queries.']);

QA(37, 'What is the difference between mongoose.Schema.Types.ObjectId and String for ref fields?',
'Using mongoose.Schema.Types.ObjectId for ref fields (like subject, uploadedBy, user) is strongly preferred over String because: (1) Mongoose validates that the value is a valid ObjectId format before saving, (2) populate() works correctly with ObjectId refs, (3) $lookup and $match with ObjectIds use the indexed _id field.',
['If you use String for a ref field and store the ObjectId as a string, populate() still works but $match comparisons with $lookup may fail if the types don\'t match (String vs ObjectId).', 'Always declare ref fields as: { type: mongoose.Schema.Types.ObjectId, ref: "ModelName" }.', 'Mongoose auto-casts: String "64f7a2b3c8..." passed to an ObjectId field is automatically cast to ObjectId by Mongoose — you don\'t need to do mongoose.Types.ObjectId("...") manually.']);

QA(38, 'Explain the Cloudinary folder structure EduStack uses. Why have separate folders?',
'EduStack uses two Cloudinary folders: "edustack_profiles" for user avatar images and "edustack_subjects" for subject thumbnail images. Separate folders provide: organized storage, easy bulk management (delete all subject thumbnails), separate access policies, and clear purpose identification.',
['Cloudinary folder: { folder: "edustack_profiles" } in upload options. The uploaded file URL becomes: https://res.cloudinary.com/yourcloud/image/upload/v1234/edustack_profiles/filename.jpg', 'Transformations: Cloudinary can auto-resize images in the URL. Requesting .../w_200,h_200,c_fill/... crops the avatar to 200x200. This eliminates the need for server-side image processing.', 'CDN: Cloudinary\'s global CDN serves images from the nearest edge to the requesting user — faster than serving from Render.com\'s single server location.']);

QA(39, 'What happens when mongoose.connect() fails? How does EduStack handle it?',
'If mongoose.connect() rejects (wrong credentials, network issue, Atlas cluster paused), EduStack\'s .catch(err => { console.error(err.message); process.exit(1); }) immediately exits the Node.js process with error code 1.',
['Why exit instead of retry? EduStack has no database retry logic. The process manager (Render.com) will restart the process automatically. On Render.com, a failed start causes the deploy to show as "failed" — visible in the dashboard.', 'serverSelectionTimeoutMS: Controls how long Mongoose waits before giving up on finding a MongoDB server. Default is 30 seconds — long for a startup timeout.', 'Production improvement: Add a retry loop with exponential backoff: try connecting up to N times with increasing delays before giving up.']);

QA(40, 'What is the .env file? What secrets does EduStack store in it?',
'The .env file stores environment-specific configuration values, especially secrets that must not be committed to version control. EduStack reads it with require("dotenv").config() which loads variables into process.env.',
['EduStack .env secrets: MONGO_URI (DB connection with credentials), JWT_SECRET (signs JWTs), GOOGLE_CLIENT_ID/SECRET (OAuth credentials), RAZORPAY_KEY_ID/SECRET (payment API keys), CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET (CDN credentials), EMAIL_USER/PASS (SMTP credentials), ADMIN_EMAILS (admin email list).', 'Security: .env is in .gitignore — never committed. A .env.example with placeholder values (MONGO_URI=mongodb+srv://USERNAME:PASSWORD@cluster/db) documents required variables without exposing secrets.', 'Render.com: Environment variables are set via the Render dashboard Environment tab — they become process.env.VAR_NAME in the running process.']);

// ── FOOTER ──────────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text('EduStack Masterclass  |  VOLUME 3: Database & Cloud  |  Page ' + (fp + 1) + ' of ' + range.count + '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 });
  }
}

doc.end();
stream.on('finish', function() {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n========================================');
  console.log('  VOLUME 3 PDF Generated Successfully!');
  console.log('========================================');
  console.log('  File  :', OUT);
  console.log('  Pages :', range.count);
  console.log('  Size  :', kb, 'KB');
  console.log('========================================\n');
});
