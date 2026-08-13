'use strict';
// ================================================================
// EduStack Interview Masterclass — VOLUME 4 (Zero Blank Pages Fix)
// ML / AI Microservice, System Design Scenarios & Playbook
// Target: Visa, Amazon, Oracle, JPMC, Microsoft, HSBC Interviews
// Run: node generate-part4.js
// Output: EduStack_Vol4_ML_SystemDesign.pdf
// ================================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'EduStack_Vol4_ML_SystemDesign.pdf');
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 20, left: 50, right: 50 },
  bufferPages: true
});
doc.pipe(fs.createWriteStream(OUT));

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
       .text('  Python / FastAPI & System Design Solution', ML + 4, y0 + 2, { lineBreak: false });

    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    doc.fontSize(8).font('Courier').fillColor(C.codeText);

    chunk.forEach(function (line, i) {
      let lineCol = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lineCol = '#8b949e';
      else if (line.includes('def ') || line.includes('class ') || line.includes('@app.')) lineCol = '#ff7b72';
      else if (line.includes('return ') || line.includes('try:') || line.includes('except')) lineCol = '#d2a8ff';
      else if (line.includes('genai.') || line.includes('rag_store.')) lineCol = '#79c0ff';

      doc.fillColor(lineCol).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
    });

    doc.y = y0 + ch;
    gap(0.35);
  }
}

function DIAGRAM_BOXES(title, steps) {
  ensureSpace(steps.length * 28 + 35);
  const y0 = doc.y;

  doc.rect(ML, y0, TW, 16).fill(C.purple);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white)
     .text('  SYSTEM DESIGN MAP: ' + cleanText(title), ML + 6, y0 + 4, { lineBreak: false });

  let curY = y0 + 22;
  steps.forEach(function (step, idx) {
    ensureSpace(24);
    doc.rect(ML + 10, curY, TW - 20, 20).fillAndStroke('#eaf2ff', C.purple);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.dark)
       .text('Phase ' + (idx + 1) + ': ' + cleanText(step.label), ML + 18, curY + 5, { width: TW - 36, lineBreak: false });

    curY += 20;
    if (idx < steps.length - 1) {
      doc.moveTo(ML + TW / 2, curY).lineTo(ML + TW / 2, curY + 6).strokeColor(C.purple).lineWidth(1.5).stroke();
      doc.polygon([ML + TW / 2 - 3, curY + 6], [ML + TW / 2 + 3, curY + 6], [ML + TW / 2, curY + 9]).fill(C.purple);
      curY += 10;
    }
  });

  doc.y = curY + 6;
  gap(0.35);
}

function QA(q, shortA, detailParts) {
  ensureSpace(55);
  const y0 = doc.y;
  const qh = doc.heightOfString('Scenario:  ' + cleanText(q), { width: TW - 16, lineGap: 2 }) + 10;
  doc.rect(ML, y0, TW, qh).fill(C.rowAlt);
  doc.rect(ML, y0, 4, qh).fill(C.accent);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.accent)
     .text('Scenario:  ' + cleanText(q), ML + 10, y0 + 5, { width: TW - 20, lineBreak: false });
  doc.y = y0 + qh + 2;

  ensureSpace(20);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.green).text('  Architectural Solution:');
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
doc.rect(0, 0, 595, 14).fill(C.purple);
gap(3);

doc.fontSize(44).font('Helvetica-Bold').fillColor(C.purple).text('EduStack Masterclass', { align: 'center' });
gap(0.1);
doc.fontSize(12).font('Helvetica').fillColor(C.dark).text('Your Ultimate Computer Science & Engineering Hub', { align: 'center' });
gap(0.5);
doc.moveTo(120, doc.y).lineTo(475, doc.y).strokeColor(C.border).lineWidth(1.5).stroke();
gap(0.5);
doc.fontSize(11).font('Helvetica').fillColor(C.accent).text('VOLUME 4 — ML Microservice, FAANG System Design & Playbook', { align: 'center' });
doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text('Tier-1 Interview Reference Guide (Visa, Amazon, Oracle, JPMC, Microsoft)', { align: 'center' });
doc.fontSize(8.8).font('Helvetica').fillColor(C.light)
   .text('Python FastAPI  |  RAG Engine  |  Gemini Multimodal  |  20 High-Scale Scenarios  |  Playbook', { align: 'center' });
gap(1.5);

const bx = doc.y;
doc.rect(60, bx, 475, 175).fill(C.offWhite);
doc.rect(60, bx, 6, 175).fill(C.purple);
const cinfo = [
  ['Developer',   'Shubham Kumar  |  CSE Student  |  NIT Patna'],
  ['Target Roles','AI/ML Platform Engineer, Senior Systems Architect, SDE II'],
  ['AI Engine',   'Python 3.11 FastAPI + Google Gemini 1.5/2.0 + LightRAG Engine'],
  ['PDF Multimodal','Dual-Strategy Processing: pypdf Text Extraction + Gemini Vision OCR'],
  ['Scenarios',   '20 High-Scale FAANG System Design & Incident Defense Scenarios'],
  ['Playbook',    '2-Minute Architectural Elevator Pitch & Defense Framework'],
  ['Volume 4',    'Python ML Microservice, RAG Engine, 20 Scenarios & Master Playbook'],
];
cinfo.forEach(function (r, i) {
  const iy = bx + 14 + (i * 22);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.purple).text(cleanText(r[0]) + ':', 74, iy, { width: 95, lineBreak: false });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(r[1]), 172, iy, { width: 348, lineBreak: false });
});
doc.y = bx + 185; gap(1.8);
doc.fontSize(8).font('Helvetica').fillColor(C.light)
   .text('github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub', { align: 'center' });
gap(0.3);
doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
   .text('For SDE Technical Interview Preparation — Volume 4 of 4', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.purple);

// ================================================================
// TABLE OF CONTENTS
// ================================================================
newPage();
doc.rect(0, 0, 595, 12).fill(C.purple); gap(0.8);
doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents — Volume 4');
hr(C.purple);
const toc = [
  ['20', 'Python FastAPI ML Microservice Architecture', 'Why Python for ML, Uvicorn ASGI server, proxy pattern'],
  ['21', 'RAG Engine & Gemini LLM Integration', 'Retrieval Augmented Generation, LightRAG store, model fallback loop'],
  ['22', 'Multimodal PDF Processing Pipeline', 'Text extraction vs Gemini Vision OCR for scanned PDFs'],
  ['23', 'Frontend Micro-Framework Architecture', 'partials.js, window.requireAuth guard, CSS custom variables'],
  ['24', 'FAANG System Design & Incident Scenarios (1-10)', 'High-concurrency rate limits, 100k webhooks, zero-downtime migrations'],
  ['25', 'FAANG System Design & Incident Scenarios (11-20)', '100MB PDF streaming, Redis session caching, real-time notifications'],
  ['26', 'Final Executive Interview Playbook & Defense Cheat Sheet', '2-minute technical pitch, core metrics, trade-off defense'],
];
toc.forEach(function (r) {
  ensureSpace(28);
  const y0 = doc.y;
  doc.rect(ML, y0, TW, 24).fill(C.offWhite);
  doc.rect(ML, y0, 4, 24).fill(C.purple);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.purple)
     .text(r[0] + '.', ML + 10, y0 + 4, { width: 25, lineBreak: false });
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.dark)
     .text(cleanText(r[1]), ML + 36, y0 + 4, { width: 320, lineBreak: false });
  doc.fontSize(8).font('Helvetica').fillColor(C.gray)
     .text(cleanText(r[2]), ML + 36, y0 + 14, { width: 420, lineBreak: false });
  doc.y = y0 + 26;
});

// ================================================================
// SECTION 20 — ML MICROSERVICE ARCHITECTURE
// ================================================================
sectionBanner('20', 'Python FastAPI ML Microservice Architecture',
  'ASGI Uvicorn server, HTTP Proxy Gateway pattern, and language isolation', C.purple);

P('EduStack isolates its AI tutoring and document processing engine into a dedicated Python 3.11 FastAPI microservice. Node.js handles I/O-intensive web traffic, while Python manages CPU-intensive AI computations.');

CODE(
"# ml_services/main.py — FastAPI Initialization & RAG Integration\n"+
"from fastapi import FastAPI, HTTPException, UploadFile, File\n"+
"import google.generativeai as genai\n"+
"import os\n"+
"\n"+
"app = FastAPI(title='EduStack AI Engine')\n"+
"genai.configure(api_key=os.getenv('GEMINI_API_KEY'))\n"+
"\n"+
"def get_available_gemini_models():\n"+
"    try:\n"+
"        models = [m.name for m in genai.list_models() if 'generateContent' in m.supported_generation_methods]\n"+
"        return models or ['models/gemini-1.5-flash', 'models/gemini-2.0-flash']\n"+
"    except Exception:\n"+
"        return ['models/gemini-1.5-flash', 'models/gemini-2.0-flash']"
);

// ================================================================
// SECTION 21 — RAG ENGINE
// ================================================================
sectionBanner('21', 'RAG Engine & Gemini Integration',
  'Retrieval Augmented Generation with LightRAG knowledge store and fallback loop', C.green);

DIAGRAM_BOXES('Retrieval-Augmented Generation (RAG) Architecture', [
  { label: 'Phase 1: Question Input -> LightRAG Store retrieves top-3 relevant CS course chunks via TF-IDF' },
  { label: 'Phase 2: Prompt Engine constructs augmented context prompt with course material' },
  { label: 'Phase 3: Fallback Loop iterates Gemini models (gemini-2.0-flash -> gemini-1.5-flash)' },
  { label: 'Phase 4: Gemini generates grounded factual response -> Returns answer + source references' }
]);

// ================================================================
// SECTION 24-25 — FAANG SYSTEM DESIGN SCENARIOS
// ================================================================
sectionBanner('24', 'FAANG System Design & Incident Scenarios',
  '20 Realistic, High-Impact Interview Scenarios with Full Technical Solutions', C.dark);

QA('Scenario 1: Distributed Botnet Login Attack Mitigation',
'Implement a multi-tier sliding-window rate limiter using Redis. Tier 1: IP-based limit (10 req/min). Tier 2: Email account limit (5 failed logins per target email across ALL IPs in 15 min). After 5 failed attempts, temporarily lock the email in Redis (redis.setex("lock:"+email, 900, "1")). Always return the generic message "Invalid credentials".',
['IP-only limits fail against proxy botnets; email locking stops credential stuffing.', 'Atomic Redis Lua scripts prevent race conditions during high concurrency.']);

QA('Scenario 2: Zero-Downtime Password Hash Migration (bcrypt to Argon2id)',
'Implement lazy re-hashing during active user logins. Add hashAlgorithm field to user schema (default "bcrypt"). During login: verify with bcrypt. If valid, asynchronously hash plaintext password with Argon2id, update MongoDB document, and set hashAlgorithm="argon2id". Inactive accounts remain securely hashed with bcrypt until next login.',
['Zero user disruption — re-hashing occurs transparently during login.', 'OWASP-recommended pattern for upgrading legacy password hash algorithms.']);

// ── FIXED FOOTER LOOP (No Margin Overflow -> 0 Blank Pages!) ──
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text(
         'EduStack Masterclass  |  VOLUME 4  |  Page ' + (fp + 1) + ' of ' + range.count +
         '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 }
       );
  }
}

doc.end();
doc.on('end', function () {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n✅  VOLUME 4 PDF generated successfully!');
  console.log('📄  File:', OUT);
  console.log('📊  Exact Pages:', range.count, '| Size:', kb, 'KB\n');
});
