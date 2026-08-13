'use strict';
// ============================================================
// generate-doc-pdf.js
// Converts EduStack_Interview_Documentation.md → PDF
// Run: node generate-doc-pdf.js
// Output: EduStack_Interview_Documentation.pdf
// ============================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const MD_PATH = path.join(
  'C:\\Users\\HP\\.gemini\\antigravity-ide\\brain\\72d251e3-7f29-4274-b6bf-3a102de47a95',
  'EduStack_Interview_Documentation.md'
);
const OUT = path.join(__dirname, 'EduStack_Interview_Documentation.pdf');

if (!fs.existsSync(MD_PATH)) {
  console.error('❌ Markdown file not found at:', MD_PATH);
  process.exit(1);
}

const raw = fs.readFileSync(MD_PATH, 'utf8');
const lines = raw.split(/\r?\n/);

// ── PDF setup ────────────────────────────────────────────────
const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
doc.pipe(fs.createWriteStream(OUT));

// ── Layout constants ─────────────────────────────────────────
const ML = 50, MR = 545, MB = 790, TW = 495;

// ── Colour palette ───────────────────────────────────────────
const C = {
  brand:   '#e53e3e',
  dark:    '#1a202c',
  gray:    '#4a5568',
  light:   '#718096',
  accent:  '#3182ce',
  green:   '#276749',
  amber:   '#b7791f',
  border:  '#e2e8f0',
  codeBg:  '#1a1a2e',
  codeText:'#68d391',
  white:   '#ffffff',
  purple:  '#6b46c1',
  teal:    '#2c7a7b',
  pink:    '#b83280',
};

// ── Helpers ──────────────────────────────────────────────────
let _pg = 0;
function newPage() { if (_pg > 0) doc.addPage(); _pg++; }
function ensureSpace(need) { if ((MB - doc.y) < need) { doc.addPage(); } }
function gap(n) { doc.moveDown(n || 0.3); }

function headerBar(text, bg, fg) {
  bg = bg || C.brand; fg = fg || C.white;
  ensureSpace(28); gap(0.3);
  const y0 = doc.y;
  doc.rect(ML, y0, TW, 22).fill(bg);
  doc.fontSize(10.5).font('Helvetica-Bold').fillColor(fg)
     .text(text, ML + 10, y0 + 5, { width: TW - 20, lineBreak: false });
  doc.y = y0 + 22; gap(0.3);
}

function h2(text, col) {
  col = col || C.dark;
  ensureSpace(20); gap(0.2);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(col).text(text);
  doc.moveTo(ML, doc.y + 1).lineTo(MR, doc.y + 1)
     .strokeColor(col).lineWidth(0.7).stroke();
  gap(0.25);
}

function h3(text, col) {
  col = col || C.accent;
  ensureSpace(16); gap(0.15);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(col).text('▸ ' + text);
  gap(0.1);
}

function para(text) {
  if (!text.trim()) return;
  ensureSpace(14);
  doc.fontSize(8.8).font('Helvetica').fillColor(C.gray).text(text, { lineGap: 2.5 });
  gap(0.15);
}

function bullet(text, col) {
  col = col || C.gray;
  ensureSpace(13);
  doc.fontSize(8.5).font('Helvetica').fillColor(col)
     .text('•  ' + text, { indent: 12, lineGap: 2 });
}

function codeBlock(lines_arr) {
  const lh = 10.5, pad = 6;
  const bh = lines_arr.length * lh + pad * 2;
  ensureSpace(bh + 10);
  const y0 = doc.y;
  doc.rect(ML, y0, TW, bh).fill(C.codeBg);
  doc.fontSize(7.5).font('Courier').fillColor(C.codeText);
  lines_arr.forEach(function (line, i) {
    doc.text(line, ML + 8, y0 + pad + i * lh, { lineBreak: false, width: TW - 16 });
  });
  doc.y = y0 + bh;
  gap(0.35);
}

function infoBox(text, col) {
  col = col || C.accent;
  ensureSpace(30);
  doc.fontSize(8.5).font('Helvetica');
  const bh = doc.heightOfString(text, { width: TW - 24, lineGap: 2 }) + 14;
  const y0 = doc.y;
  doc.rect(ML, y0, 4, bh).fill(col);
  doc.rect(ML + 4, y0, TW - 4, bh).fill('#ebf8ff');
  doc.fontSize(8.5).font('Helvetica').fillColor(C.dark)
     .text(text, ML + 14, y0 + 7, { width: TW - 24, lineGap: 2 });
  doc.y = y0 + bh;
  gap(0.3);
}

function qaBlock(q, a) {
  ensureSpace(50);
  const y0 = doc.y;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.accent)
     .text('Q: ' + q, ML, y0, { width: TW, lineGap: 2 });
  const qh = doc.y - y0 + 4;
  const y1 = doc.y + 2;
  const ah = doc.heightOfString(a, { width: TW - 30, lineGap: 2 }) + 10;
  doc.rect(ML, y1, 4, ah).fill(C.green);
  doc.rect(ML + 4, y1, TW - 4, ah).fill('#f0fff4');
  doc.fontSize(8.5).font('Helvetica').fillColor(C.dark)
     .text(a, ML + 14, y1 + 5, { width: TW - 22, lineGap: 2 });
  doc.y = y1 + ah;
  doc.moveTo(ML, doc.y + 2).lineTo(MR, doc.y + 2)
     .strokeColor(C.border).lineWidth(0.5).stroke();
  gap(0.35);
}

function tableRow(cells, widths, isHeader) {
  const fontSize = isHeader ? 8 : 7.5;
  const font     = isHeader ? 'Helvetica-Bold' : 'Helvetica';
  const bg       = isHeader ? C.accent : null;
  const fg       = isHeader ? C.white  : C.gray;

  doc.fontSize(fontSize).font(font);
  let maxH = 16;
  cells.forEach(function (c, i) {
    const h = doc.heightOfString(String(c), { width: widths[i] - 8, lineGap: 1.5 }) + 8;
    if (h > maxH) maxH = h;
  });
  ensureSpace(maxH);
  const y0 = doc.y;
  if (bg) doc.rect(ML, y0, TW, maxH).fill(bg);

  let x = ML;
  cells.forEach(function (c, i) {
    doc.fontSize(fontSize).font(font).fillColor(fg)
       .text(String(c), x + 4, y0 + 4, { width: widths[i] - 8, lineGap: 1.5 });
    x += widths[i];
  });
  doc.y = y0 + maxH;
}

// ── COVER PAGE ───────────────────────────────────────────────
newPage();
doc.rect(0, 0, 595, 10).fill(C.brand);
gap(3.5);

doc.fontSize(42).font('Helvetica-Bold').fillColor(C.brand)
   .text('EduStack', { align: 'center' });
doc.fontSize(11).font('Helvetica').fillColor(C.dark)
   .text('Your Ultimate Computer Science Hub', { align: 'center' });
gap(0.6);
doc.moveTo(100, doc.y).lineTo(495, doc.y)
   .strokeColor(C.border).lineWidth(1).stroke();
gap(0.6);

doc.fontSize(20).font('Helvetica-Bold').fillColor(C.dark)
   .text('Complete Interview Reference Documentation', { align: 'center' });
doc.fontSize(9.5).font('Helvetica').fillColor(C.light)
   .text('Architecture • Security • Auth • ML/AI • Frontend • 30+ Q&As', { align: 'center' });
gap(1.8);

// Info box
const bx = doc.y;
doc.rect(70, bx, 455, 160).fill('#f7fafc');
doc.rect(70, bx, 5, 160).fill(C.brand);

const info = [
  ['Author',      'Shubham Kumar  |  Full-Stack Developer & Architect'],
  ['Project',     'EduStack — Your Ultimate Computer Science Hub'],
  ['Stack',       'Node.js • Express • MongoDB • TailwindCSS • Python FastAPI'],
  ['Auth',        'JWT + httpOnly Cookie • OTP Email • Google OAuth 2.0'],
  ['AI / ML',     'Gemini API • FastAPI RAG Engine • PDF Summarizer • PYQ Generator'],
  ['Payments',    'Razorpay Gateway — HMAC-SHA256 server-side verification'],
  ['Hosting',     'Render.com (Node.js + Python services) • MongoDB Atlas'],
];
info.forEach(function (r, i) {
  const iy = bx + 12 + i * 20;
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.accent)
     .text(r[0] + ':', 90, iy, { width: 70, lineBreak: false });
  doc.font('Helvetica').fillColor(C.dark)
     .text(r[1], 165, iy, { width: 345, lineBreak: false });
});
doc.y = bx + 170;
gap(2);

doc.fontSize(8).font('Helvetica').fillColor(C.light)
   .text('github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// ── PARSE & RENDER MARKDOWN ──────────────────────────────────
// State machine for parsing markdown
let inCode = false;
let codeBuffer = [];
let inTable = false;
let tableHeaders = [];
let tableWidths = [];
let tableRowCount = 0;

let currentSection = '';
let sectionColors = {
  '1':  C.brand,  // Project Overview
  '2':  C.accent, // Architecture
  '3':  C.accent, // Tech Stack
  '4':  C.teal,   // Backend
  '5':  C.teal,   // Database
  '6':  C.purple, // Auth
  '7':  C.pink,   // Security
  '8':  C.amber,  // Payment
  '9':  C.green,  // ML/AI
  '10': C.teal,   // Frontend
  '11': C.teal,   // Responsiveness
  '12': C.accent, // API Design
  '13': C.accent, // Cloud
  '14': C.green,  // DSA Sheet
  '15': C.purple, // Notifications
  '16': C.dark,   // Deployment
  '17': C.pink,   // Security Analysis
  '18': C.brand,  // Q&A
  '19': C.dark,   // Cheat Sheet
};

function getSectionColor(num) {
  return sectionColors[num] || C.accent;
}

// Table column width helper
function guessWidths(numCols) {
  if (numCols === 2) return [150, TW - 150];
  if (numCols === 3) return [120, 150, TW - 270];
  if (numCols === 4) return [80, 120, 140, TW - 340];
  const w = Math.floor(TW / numCols);
  return Array(numCols).fill(w);
}

// Parse inline: strip bold/italic markers for plain text
function stripInline(s) {
  return s
    .replace(/\*\*(.+?)\*\*/g, '$1')
    .replace(/\*(.+?)\*/g, '$1')
    .replace(/`(.+?)`/g, '$1')
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    .trim();
}

function flushCode() {
  if (codeBuffer.length > 0) {
    // Split large code blocks across pages
    const chunkSize = 35;
    for (let start = 0; start < codeBuffer.length; start += chunkSize) {
      const chunk = codeBuffer.slice(start, start + chunkSize);
      codeBlock(chunk);
    }
    codeBuffer = [];
  }
}

// Q&A mode: accumulate Q then A
let qaMode = false;
let qaQuestion = '';
let qaAnswer = [];

function flushQA() {
  if (qaMode && qaQuestion) {
    qaBlock(qaQuestion, qaAnswer.join(' ').trim());
    qaQuestion = '';
    qaAnswer = [];
    qaMode = false;
  }
}

let pendingQSection = false;

lines.forEach(function (rawLine) {
  const line = rawLine.trimEnd();

  // ── Code fence ───────────────────────────────────────────
  if (line.startsWith('```')) {
    if (inCode) {
      flushCode();
      inCode = false;
    } else {
      inCode = true;
      codeBuffer = [];
    }
    return;
  }
  if (inCode) { codeBuffer.push(line); return; }

  // ── Table detection ──────────────────────────────────────
  if (line.startsWith('|')) {
    const cells = line.split('|').filter((_, i, arr) => i > 0 && i < arr.length - 1)
                       .map(c => stripInline(c.trim()));
    // separator row
    if (cells.every(c => /^[-:]+$/.test(c))) return;

    if (!inTable) {
      inTable = true;
      tableHeaders = cells;
      tableWidths = guessWidths(cells.length);
      tableRowCount = 0;
      ensureSpace(30);
      tableRow(cells, tableWidths, true);
    } else {
      // Alternate row shading
      if (tableRowCount % 2 === 0) {
        const y0 = doc.y;
        doc.fontSize(7.5).font('Helvetica');
        let maxH = 14;
        cells.forEach(function (c, i) {
          const h = doc.heightOfString(c, { width: tableWidths[i] - 8, lineGap: 1.5 }) + 8;
          if (h > maxH) maxH = h;
        });
        ensureSpace(maxH);
        const ry = doc.y;
        doc.rect(ML, ry, TW, maxH).fill('#f7fafc');
        let rx = ML;
        cells.forEach(function (c, i) {
          doc.fontSize(7.5).font('Helvetica').fillColor(C.gray)
             .text(c, rx + 4, ry + 4, { width: tableWidths[i] - 8, lineGap: 1.5 });
          rx += tableWidths[i];
        });
        doc.y = ry + maxH;
      } else {
        tableRow(cells, tableWidths, false);
      }
      tableRowCount++;
    }
    return;
  } else {
    if (inTable) { inTable = false; gap(0.35); }
  }

  // ── Skip horizontal rules ────────────────────────────────
  if (/^---+$/.test(line.trim())) {
    gap(0.2);
    doc.moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor(C.border).lineWidth(0.5).stroke();
    gap(0.2);
    return;
  }

  // ── Headings ─────────────────────────────────────────────
  if (line.startsWith('# ')) {
    flushQA();
    const text = stripInline(line.slice(2));
    newPage();
    doc.rect(0, 0, 595, 10).fill(C.brand); gap(0.5);
    doc.fontSize(9).font('Helvetica').fillColor(C.light)
       .text('EduStack — Interview Reference', { align: 'center' });
    doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark)
       .text(text, { align: 'center' });
    doc.moveTo(ML + 60, doc.y + 6).lineTo(MR - 60, doc.y + 6)
       .strokeColor(C.border).lineWidth(1).stroke();
    gap(0.6);
    return;
  }

  if (line.startsWith('## ')) {
    flushQA();
    const text = stripInline(line.slice(3));
    // Detect section number
    const numMatch = text.match(/^(\d+)\./);
    const col = numMatch ? getSectionColor(numMatch[1]) : C.brand;
    currentSection = numMatch ? numMatch[1] : currentSection;
    headerBar(text, col, C.white);
    return;
  }

  if (line.startsWith('### ')) {
    flushQA();
    h3(stripInline(line.slice(4)));
    return;
  }

  if (line.startsWith('#### ')) {
    flushQA();
    const text = stripInline(line.slice(5));
    ensureSpace(14);
    doc.fontSize(9).font('Helvetica-Bold').fillColor(C.dark).text(text);
    gap(0.1);
    return;
  }

  // ── Blockquote (> text) — used for Q&A answers ───────────
  if (line.startsWith('> ')) {
    const text = stripInline(line.slice(2));
    // Check if this is a Q&A answer (after a bold Q line)
    if (qaMode) {
      qaAnswer.push(text);
    } else {
      infoBox(text, C.accent);
    }
    return;
  }

  // ── Bold Q lines ─────────────────────────────────────────
  // e.g. **Q: How does...?**
  const qMatch = line.match(/^\*\*Q:\s*(.+)\*\*$/);
  if (qMatch) {
    flushQA();
    qaMode = true;
    qaQuestion = stripInline(qMatch[1]);
    qaAnswer = [];
    return;
  }

  // ── Bullet points ─────────────────────────────────────────
  if (line.match(/^[-*] /)) {
    flushQA();
    const text = stripInline(line.slice(2));
    bullet(text);
    return;
  }

  // ── Numbered list ─────────────────────────────────────────
  if (line.match(/^\d+\. /)) {
    flushQA();
    const text = stripInline(line.replace(/^\d+\. /, ''));
    ensureSpace(13);
    doc.fontSize(8.5).font('Helvetica').fillColor(C.gray)
       .text('  ' + line.match(/^\d+/)[0] + '.  ' + text, { indent: 10, lineGap: 2 });
    return;
  }

  // ── Empty line ────────────────────────────────────────────
  if (line.trim() === '') {
    if (qaMode && qaAnswer.length > 0) {
      // Don't flush yet — wait for next non-answer line
    }
    return;
  }

  // ── Regular paragraph ─────────────────────────────────────
  // Check if line is continuation of Q&A answer
  if (qaMode && line.trim() && !line.startsWith('#') && !line.startsWith('|')) {
    // If it starts with "A:" it's the answer format
    if (line.startsWith('A:') || line.startsWith('> ')) {
      qaAnswer.push(stripInline(line.replace(/^A:\s*/, '').replace(/^> /, '')));
    } else if (line.startsWith('**Q:') || line.startsWith('---')) {
      flushQA();
      para(stripInline(line));
    } else {
      flushQA();
      para(stripInline(line));
    }
  } else {
    flushQA();
    para(stripInline(line));
  }
});

// Flush any remaining
if (inCode) flushCode();
flushQA();

// ── Page numbers ─────────────────────────────────────────────
const totalPages = doc.bufferedPageRange().count;
for (let i = 0; i < totalPages; i++) {
  doc.switchToPage(i);
  doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
     .text(
       `EduStack Interview Reference  |  Page ${i + 1} of ${totalPages}`,
       ML, MB + 15,
       { width: TW, align: 'center' }
     );
}

doc.end();

doc.on('end', function () {
  const stats = fs.statSync(OUT);
  const kb = (stats.size / 1024).toFixed(1);
  console.log('\n✅  PDF generated!');
  console.log('📄  File:', OUT);
  console.log('📊  Pages:', totalPages, '| Size:', kb, 'KB\n');
});
