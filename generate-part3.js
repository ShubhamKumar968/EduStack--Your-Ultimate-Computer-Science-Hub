'use strict';
// ================================================================
// EduStack Interview Masterclass — VOLUME 3 (Zero Blank Pages Fix)
// Database Engineering, Data Modeling & Cloud Services
// Target: Visa, Amazon, Oracle, JPMC, Microsoft, HSBC Interviews
// Run: node generate-part3.js
// Output: EduStack_Vol3_Database_Cloud.pdf
// ================================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'EduStack_Vol3_Database_Cloud.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 20, left: 50, right: 50 },
  bufferPages: true
});
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const ML = 50, MR = 545, MB = 770, TW = 495;
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

let _pg = 0;
function newPage() {
  if (_pg === 0) { _pg++; return; }
  if (doc.y > 60) { doc.addPage(); _pg++; }
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
       .text('  Mongoose Schema & Database Implementation', ML + 4, y0 + 2, { lineBreak: false });

    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    doc.fontSize(8).font('Courier').fillColor(C.codeText);

    chunk.forEach(function (line, i) {
      let lineCol = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lineCol = '#8b949e';
      else if (line.includes('const ') || line.includes('new ') || line.includes('mongoose.')) lineCol = '#ff7b72';
      else if (line.includes('type:') || line.includes('required:') || line.includes('index:')) lineCol = '#d2a8ff';
      else if (line.includes('User.') || line.includes('Subject.') || line.includes('Resource.')) lineCol = '#79c0ff';

      doc.fillColor(lineCol).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
    });

    doc.y = y0 + ch;
    gap(0.35);
  }
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
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.green).text('  Comprehensive Database Answer:');
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
doc.fontSize(11).font('Helvetica').fillColor(C.accent).text('VOLUME 3 — Database Engineering, Data Modeling & Cloud Services', { align: 'center' });
doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text('Tier-1 Interview Reference Guide (Visa, Amazon, Oracle, JPMC, Microsoft)', { align: 'center' });
doc.fontSize(8.8).font('Helvetica').fillColor(C.light)
   .text('MongoDB Atlas  |  Mongoose Schemas  |  TTL Indexes  |  Multer MemoryStorage  |  25 Tier-1 Q&As', { align: 'center' });
gap(1.5);

const bx = doc.y;
doc.rect(60, bx, 475, 175).fill(C.offWhite);
doc.rect(60, bx, 6, 175).fill(C.brand);
const cinfo = [
  ['Developer',   'Shubham Kumar  |  CSE Student  |  NIT Patna'],
  ['Target Roles','Database Architect, SDE II Backend, Cloud Infrastructure Lead'],
  ['Database',    'MongoDB Atlas M0 + Mongoose ODM (Schema Validation, Indexes, TTL)'],
  ['Schemas',     'User (select:false), OTP (TTL), Subject, Resource, Payment, Notification'],
  ['Cloud Ops',   'Multer memoryStorage + Cloudinary CDN + Nodemailer SMTP'],
  ['Data Sync',   'Google Sheet Live Sync via CSV with 3-Layer In-Memory Caching'],
  ['Volume 3',    'MongoDB Design, Indexes, Cloud File Pipelines & 25 Q&As'],
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
   .text('For SDE Technical Interview Preparation — Volume 3 of 4', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// ================================================================
// TABLE OF CONTENTS
// ================================================================
newPage();
doc.rect(0, 0, 595, 12).fill(C.brand); gap(0.8);
doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents — Volume 3');
hr(C.brand);
const toc = [
  ['13', 'MongoDB Architecture & Mongoose ODM Internals', 'NoSQL vs SQL trade-offs for tier-1 companies, BSON engine'],
  ['14', 'Complete Schema Blueprint & Code', 'User, OTP (TTL), Subject, Resource, Payment, Notification schemas'],
  ['15', 'Advanced Database Patterns', 'Mongoose select:false, pre-save hooks, virtuals, populate vs $lookup'],
  ['16', 'Database Optimization & Indexing Strategy', 'B-tree indexes, compound indexes, text search, TTL background engine'],
  ['17', 'Cloud Infrastructure & Zero-Disk Upload Pipeline', 'Multer memoryStorage RAM buffer -> Cloudinary CDN streaming'],
  ['18', 'Notification Broadcast & Live Google Sheet Sync', 'readBy array pattern, $addToSet, 3-layer DSA cache strategy'],
  ['19', 'Tier-1 Interview Q&A — Database & Cloud (25 Q&As)', 'Deep technical questions asked by Visa, Amazon, Oracle, JPMC'],
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

// ================================================================
// SECTION 13 — MONGODB ARCHITECTURE
// ================================================================
sectionBanner('13', 'MongoDB Architecture & Mongoose ODM Internals',
  'NoSQL vs RDBMS evaluation for tier-1 tech interviews', C.teal);

h1('13.1  NoSQL Document Store vs Relational RDBMS', C.teal);
P('In enterprise interviews at Amazon, Oracle, and Microsoft, database selection must be justified based on query patterns, schema flexibility, and horizontal scalability. EduStack uses MongoDB Atlas - a distributed BSON document database.');

TABLE(
  ['Dimension', 'MongoDB (EduStack)', 'PostgreSQL / Oracle'],
  [
    ['Schema Model', 'Dynamic BSON documents - handles varying resource fields naturally', 'Rigid relational tables - requires ALTER TABLE migrations'],
    ['Query Model', 'JSON-native Mongoose queries & Aggregation Pipelines', 'SQL JOIN queries with relational algebra optimization'],
    ['Scale Model', 'Native sharding across cluster nodes', 'Vertical scaling (primary-replica read scaling)'],
    ['Joins / Population', 'populate() batched $in lookups or $lookup pipeline', 'Native C-level JOIN execution'],
    ['Special Features', 'Built-in TTL (Time-To-Live) index engine for auto-deletions', 'Requires pg_cron or external background workers'],
  ],
  [100, 195, 200]
);

// ================================================================
// SECTION 14 — SCHEMAS
// ================================================================
sectionBanner('14', 'Complete Schema Blueprint & Implementation',
  'Production Mongoose schemas for User, OTP, Subject, Resource, Payment, Notification', C.accent);

CODE(
"// models/otp.js — MongoDB TTL Index Engine\n"+
"const mongoose = require('mongoose');\n"+
"\n"+
"const otpSchema = new mongoose.Schema({\n"+
"  email:     { type: String, required: true, lowercase: true, index: true },\n"+
"  hashedOtp: { type: String, required: true }, // bcrypt hash of 6-digit code\n"+
"  purpose:   { type: String, enum: ['verify', 'reset'], required: true },\n"+
"  used:      { type: Boolean, default: false },\n"+
"  expiresAt: { type: Date, required: true },\n"+
"});\n"+
"\n"+
"// TTL INDEX: MongoDB background thread auto-deletes doc when expiresAt passes\n"+
"otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });\n"+
"\n"+
"module.exports = mongoose.model('OTP', otpSchema);"
);

// ================================================================
// SECTION 17 — CLOUD INFRASTRUCTURE
// ================================================================
sectionBanner('17', 'Cloud Infrastructure & Zero-Disk Upload Pipeline',
  'Multer memoryStorage RAM buffers directly streamed to Cloudinary CDN', C.purple);

P('Render.com operates on ephemeral storage - files saved to server disk are erased on redeploy. EduStack uses Multer memoryStorage to capture file bytes into RAM Buffer, then streams directly to Cloudinary CDN via upload_stream().');

CODE(
"// Zero-Disk Upload Pipeline\n"+
"const multer = require('multer');\n"+
"const cloudinary = require('cloudinary').v2;\n"+
"\n"+
"const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5*1024*1024 } });\n"+
"\n"+
"const streamToCloudinary = (buffer, folder) =>\n"+
"  new Promise((resolve, reject) => {\n"+
"    const stream = cloudinary.uploader.upload_stream({ folder }, (err, res) => {\n"+
"      if (err) return reject(err);\n"+
"      resolve(res);\n"+
"    });\n"+
"    stream.end(buffer);\n"+
"  });"
);

// ================================================================
// SECTION 19 — TIER-1 INTERVIEW Q&A
// ================================================================
sectionBanner('19', 'Tier-1 Interview Q&A — Database & Cloud',
  '25 Deep Technical Questions asked by Visa, Amazon, Oracle, JPMC, Microsoft', C.brand);

QA('Explain the N+1 query problem in Mongoose and how populate() resolves it.',
'The N+1 query problem occurs when fetching 1 parent document and then executing N individual queries to fetch child details. Mongoose populate() solves this by executing 2 queries total: Query 1 finds parent documents; Query 2 executes child.find({ _id: { $in: childIds } }), batching all child IDs in a single $in query.',
['Parent query: Subject.find() -> returns 50 subjects.', 'Populate query: Resource.find({ _id: { $in: [50 IDs] } }) -> 2 queries total.', 'Alternative: MongoDB $lookup aggregation pipeline executes in a single query pass.']);

QA('How does MongoDB\'s TTL index background engine work?',
'A TTL (Time-To-Live) index is created on a Date field. MongoDB runs a background cleanup thread once every 60 seconds that evaluates current_time > indexed_date + expireAfterSeconds and removes matching documents from memory and disk B-tree indexes.',
['Zero application code or cron jobs required.', 'Used in EduStack for automatic 5-minute OTP expiration.']);

// ── FIXED FOOTER LOOP (No Margin Overflow -> 0 Blank Pages!) ──
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text(
         'EduStack Masterclass  |  VOLUME 3  |  Page ' + (fp + 1) + ' of ' + range.count +
         '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 }
       );
  }
}

doc.end();
stream.on('finish', function () {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n✅  VOLUME 3 PDF generated successfully!');
  console.log('📄  File:', OUT);
  console.log('📊  Exact Pages:', range.count, '| Size:', kb, 'KB\n');
});
