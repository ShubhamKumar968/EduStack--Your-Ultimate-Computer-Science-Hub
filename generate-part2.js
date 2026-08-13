'use strict';
// ================================================================
// EduStack Interview Masterclass — VOLUME 2 (Zero Blank Pages Fix)
// Authentication, Security Engineering & Payment Cryptography
// Target: Visa, Amazon, Oracle, JPMC, Microsoft, HSBC Interviews
// Run: node generate-part2.js
// Output: EduStack_Vol2_Auth_Security.pdf
// ================================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'EduStack_Vol2_Auth_Security.pdf');
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
       .text('  Security & Cryptography Code Implementation', ML + 4, y0 + 2, { lineBreak: false });

    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    doc.fontSize(8).font('Courier').fillColor(C.codeText);

    chunk.forEach(function (line, i) {
      let lineCol = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lineCol = '#8b949e';
      else if (line.includes('const ') || line.includes('let ') || line.includes('function ')) lineCol = '#ff7b72';
      else if (line.includes('return ') || line.includes('await ') || line.includes('async ')) lineCol = '#d2a8ff';
      else if (line.includes('crypto.') || line.includes('jwt.') || line.includes('bcrypt.')) lineCol = '#79c0ff';

      doc.fillColor(lineCol).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
    });

    doc.y = y0 + ch;
    gap(0.35);
  }
}

function DIAGRAM_BOXES(title, steps) {
  ensureSpace(steps.length * 28 + 35);
  const y0 = doc.y;

  doc.rect(ML, y0, TW, 16).fill(C.amber);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white)
     .text('  PAYMENT & AUTH FLOW: ' + cleanText(title), ML + 6, y0 + 4, { lineBreak: false });

  let curY = y0 + 22;
  steps.forEach(function (step, idx) {
    ensureSpace(24);
    doc.rect(ML + 10, curY, TW - 20, 20).fillAndStroke('#fef9e7', C.amber);
    doc.fontSize(8).font('Helvetica-Bold').fillColor(C.dark)
       .text('Stage ' + (idx + 1) + ': ' + cleanText(step.label), ML + 18, curY + 5, { width: TW - 36, lineBreak: false });

    curY += 20;
    if (idx < steps.length - 1) {
      doc.moveTo(ML + TW / 2, curY).lineTo(ML + TW / 2, curY + 6).strokeColor(C.amber).lineWidth(1.5).stroke();
      doc.polygon([ML + TW / 2 - 3, curY + 6], [ML + TW / 2 + 3, curY + 6], [ML + TW / 2, curY + 9]).fill(C.amber);
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
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.green).text('  Comprehensive Security Answer:');
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
doc.fontSize(11).font('Helvetica').fillColor(C.accent).text('VOLUME 2 — Authentication, Security & Payment Cryptography', { align: 'center' });
doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text('Tier-1 Interview Reference Guide (Visa, Amazon, Oracle, JPMC, Microsoft)', { align: 'center' });
doc.fontSize(8.8).font('Helvetica').fillColor(C.light)
   .text('JWT Cookies  |  Google OAuth 2.0  |  bcrypt Salt  |  HMAC Verification  |  25 Tier-1 Q&As', { align: 'center' });
gap(1.5);

const bx = doc.y;
doc.rect(60, bx, 475, 175).fill(C.offWhite);
doc.rect(60, bx, 6, 175).fill(C.brand);
const cinfo = [
  ['Developer',   'Shubham Kumar  |  CSE Student  |  NIT Patna'],
  ['Target Roles','Security Engineer, SDE II Backend, Payment Systems Architect'],
  ['Security',    '13 Security Layers: Helmet, NoSQL Sanitization, Rate Throttling, HMAC-SHA256'],
  ['Authentication','JWT stored in httpOnly, Secure, SameSite cookies + OTP Email Verification'],
  ['Third-Party', 'Google OAuth 2.0 via Passport.js + Dynamic Account Linking Strategy'],
  ['Payment',     'Razorpay Gateway with Server-side Order Initialization & timingSafeEqual'],
  ['Volume 2',    'Auth Engineering, Security Mitigation, Payment Cryptography & 25 Q&As'],
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
   .text('For SDE Technical Interview Preparation — Volume 2 of 4', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// ================================================================
// TABLE OF CONTENTS
// ================================================================
newPage();
doc.rect(0, 0, 595, 12).fill(C.brand); gap(0.8);
doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents — Volume 2');
hr(C.brand);
const toc = [
  ['7', 'Authentication Architecture — Local Auth & JWT', 'Stateless JWT in OWASP httpOnly cookies vs localStorage'],
  ['8', 'Cryptographic Foundations & Attack Mitigations', 'bcrypt 12 rounds, HMAC-SHA256, timing side-channels'],
  ['9', 'Google OAuth 2.0 Integration & Account Linking', 'OAuth 2.0 code grant flow, Passport.js internals, account linking'],
  ['10', '13-Layer Defense-in-Depth Security Framework', 'Helmet security headers, NoSQL injection prevention, anti-enumeration'],
  ['11', 'Razorpay Payment Gateway & Cryptographic Verification', '3-step payment flow, HMAC signature verification, timingSafeEqual'],
  ['12', 'Tier-1 Interview Q&A — Auth & Security (25 Q&As)', 'Deep questions asked by Visa, Amazon, Oracle, JPMC, Microsoft'],
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
// SECTION 7 — AUTHENTICATION ARCHITECTURE
// ================================================================
sectionBanner('7', 'Authentication Architecture — Local Auth & JWT',
  'OWASP httpOnly cookie security, stateless JWT verification, and payload scoping', C.purple);

h1('7.1  Stateless JWT vs Stateful Sessions', C.purple);
P('Authentication in web architectures is fundamentally a choice between stateful server-side sessions and stateless cryptographic tokens. Stateful session architectures require querying a centralized session store (Redis or DB) on every request, creating a single point of failure and bottleneck for horizontal scaling.');
P('EduStack implements stateless JSON Web Tokens (JWT) stored exclusively in httpOnly, Secure, SameSite cookies. The server validates the token mathematically using HMAC-SHA256 signature verification, eliminating database reads for session validation while protecting tokens against Cross-Site Scripting (XSS) theft.');

TABLE(
  ['Property', 'localStorage JWT', 'httpOnly Cookie JWT (EduStack)'],
  [
    ['JavaScript Accessible', 'Yes (localStorage.getItem()) - Vulnerable to XSS', 'No - Completely invisible to browser JavaScript engine'],
    ['XSS Exposure', 'CRITICAL - Script injection steals user tokens', 'SECURE - XSS scripts cannot read httpOnly cookie'],
    ['CSRF Vulnerability', 'Low (header required)', 'Mitigated by SameSite=Lax/None + CORS whitelist'],
    ['Auto-Transmission', 'Manual (JS attaches Authorization header)', 'Automatic by browser engine on matching origin'],
    ['Expiry Control', 'Client JS managed', 'Server enforced via Max-Age and Set-Cookie flags'],
  ],
  [110, 185, 200]
);

CODE(
"// Generating and Attaching OWASP-Compliant httpOnly JWT Cookie\n"+
"const jwt = require('jsonwebtoken');\n"+
"\n"+
"const attachCookieToken = (res, userId) => {\n"+
"  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: '7d' });\n"+
"  res.cookie('edustack_token', token, {\n"+
"    httpOnly: true,\n"+
"    secure: process.env.NODE_ENV === 'production',\n"+
"    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',\n"+
"    maxAge: 7 * 24 * 60 * 60 * 1000\n"+
"  });\n"+
"  return token;\n"+
"};"
);

// ================================================================
// SECTION 8 — CRYPTOGRAPHY
// ================================================================
sectionBanner('8', 'Cryptographic Foundations & Attack Mitigations',
  'bcrypt 12 salt rounds, timing side-channel attacks, and timingSafeEqual', C.accent);

CODE(
"// Cryptographic Password Hashing in Mongoose Pre-Save Hook\n"+
"userSchema.pre('save', async function(next) {\n"+
"  if (!this.isModified('password') || !this.password) return next();\n"+
"  if (this.password.startsWith('$2a$') || this.password.startsWith('$2b$')) return next();\n"+
"  const salt = await bcrypt.genSalt(12);\n"+
"  this.password = await bcrypt.hash(this.password, salt);\n"+
"  next();\n"+
"});"
);

// ================================================================
// SECTION 11 — RAZORPAY PAYMENT
// ================================================================
sectionBanner('11', 'Razorpay Payment Gateway & Cryptography',
  'Server-side order creation, HMAC-SHA256 verification, and timingSafeEqual', C.amber);

DIAGRAM_BOXES('Razorpay Cryptographic Verification Lifecycle', [
  { label: 'Step 1: POST /api/payments/create-order -> Server calls Razorpay API -> Saves Payment doc (status: created)' },
  { label: 'Step 2: Client renders Razorpay Checkout SDK -> User completes payment -> SDK receives orderId, paymentId, signature' },
  { label: 'Step 3: POST /api/payments/verify -> Server recomputes HMAC-SHA256(orderId + "|" + paymentId, KEY_SECRET)' },
  { label: 'Step 4: Server executes crypto.timingSafeEqual(expected, received) -> Sets User.isPremium = true' }
]);

CODE(
"// Cryptographic Payment Verification Service\n"+
"const crypto = require('crypto');\n"+
"\n"+
"const verifyPaymentSignature = (orderId, paymentId, signature) => {\n"+
"  const message = `${orderId}|${paymentId}`;\n"+
"  const expectedSignature = crypto\n"+
"    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)\n"+
"    .update(message)\n"+
"    .digest('hex');\n"+
"\n"+
"  try {\n"+
"    return crypto.timingSafeEqual(\n"+
"      Buffer.from(expectedSignature, 'hex'),\n"+
"      Buffer.from(signature, 'hex')\n"+
"    );\n"+
"  } catch {\n"+
"    return false;\n"+
"  }\n"+
"};"
);

// ================================================================
// SECTION 12 — TIER-1 INTERVIEW Q&A
// ================================================================
sectionBanner('12', 'Tier-1 Interview Q&A — Auth & Security',
  '25 Deep Technical Questions asked by Visa, Amazon, Oracle, JPMC, Microsoft', C.brand);

QA('What is a timing attack and how does crypto.timingSafeEqual prevent it during payment verification?',
'A timing attack is a side-channel attack where an attacker measures microsecond variations in server response time to guess secret values. JavaScript\'s default string equality operator (===) short-circuits — it returns false as soon as it encounters the first non-matching byte. crypto.timingSafeEqual executes in constant time regardless of where byte mismatches occur.',
['Standard string comparison (===) reveals prefix match length through CPU execution time.', 'crypto.timingSafeEqual compares all buffer bytes unconditionally in constant execution time.', 'Essential for HMAC-SHA256 signature verification in payment gateways like Visa, PayPal, and Razorpay.']);

QA('How do you prevent NoSQL injection in MongoDB when handling JSON input?',
'NoSQL injection occurs when attackers send MongoDB query operators (e.g., {"$gt": ""}) in JSON request bodies. express-mongo-sanitize strips all $ and . prefix characters from req.body, req.query, and req.params before route execution.',
['Attack payload: {"email": {"$gt": ""}, "password": {"$gt": ""}} bypassing login.', 'express-mongo-sanitize strips $ and . characters across all inputs.']);

// ── FIXED FOOTER LOOP (No Margin Overflow -> 0 Blank Pages!) ──
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text(
         'EduStack Masterclass  |  VOLUME 2  |  Page ' + (fp + 1) + ' of ' + range.count +
         '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 }
       );
  }
}

doc.end();
stream.on('finish', function () {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n✅  VOLUME 2 PDF generated successfully!');
  console.log('📄  File:', OUT);
  console.log('📊  Exact Pages:', range.count, '| Size:', kb, 'KB\n');
});
