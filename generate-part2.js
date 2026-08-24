'use strict';
// ================================================================
// EduStack Interview Masterclass — VOLUME 2 (Deep Rewrite)
// Authentication, Security, Cryptography & OAuth 2.0 Deep Dive
// Target: FAANG, MAANG, Tier-1 (Amazon, Google, Microsoft, Visa, Oracle, JPMC)
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
  brand: '#c0392b', brandDark: '#922b21',
  accent: '#2471a3', accentSoft: '#aed6f1',
  dark: '#1c2833', gray: '#4a5568', light: '#718096',
  green: '#1e8449', greenSoft: '#d5f5e3',
  amber: '#b7950b', amberSoft: '#fef9e7',
  purple: '#7d3c98', purpleSoft: '#e8daef',
  teal: '#148f77', tealSoft: '#d1f2eb',
  border: '#d5d8dc', codeBg: '#0d1117', codeText: '#7ee787',
  white: '#ffffff', offWhite: '#f8f9fa', rowAlt: '#eaf2ff',
};

function cleanText(str) {
  if (!str) return '';
  return String(str)
    .replace(/\u2014/g, ' - ').replace(/\u2013/g, ' - ')
    .replace(/\u2018/g, "'").replace(/\u2019/g, "'")
    .replace(/\u201c/g, '"').replace(/\u201d/g, '"')
    .replace(/\u2022/g, '-').replace(/\u25cf/g, '-')
    .replace(/\u2192/g, '->').replace(/\u2190/g, '<-')
    .replace(/\u2713/g, '[OK]').replace(/\u274c/g, '[X]')
    .replace(/\u26a0/g, '[!]').replace(/[\u{1F000}-\u{1FFFF}]/gu, '')
    .replace(/\u20b9/g, 'Rs.');
}

let _pg = 0;
function newPage() { if (_pg === 0) { _pg++; return; } doc.addPage(); _pg++; }
function ensureSpace(n) { if ((MB - doc.y) < n) { doc.addPage(); _pg++; } }
function gap(n) { doc.moveDown(n || 0.3); }
function hr(col) {
  doc.moveTo(ML, doc.y + 2).lineTo(MR, doc.y + 2).strokeColor(col || C.border).lineWidth(0.6).stroke();
  gap(0.4);
}

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

function h3(text, col) {
  col = col || C.accent; ensureSpace(16); gap(0.2);
  const y0 = doc.y;
  doc.rect(ML, y0 + 2, 3, 10).fill(col);
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(col).text(cleanText(text), ML + 8, y0, { lineBreak: false });
  doc.y = y0 + 13; gap(0.15);
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
    const txt = cleanText(item);
    const colonIdx = txt.indexOf(':');
    if (colonIdx > 0 && colonIdx < 55) {
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.dark).text(txt.slice(0, colonIdx), ML + 16, y0, { continued: true, lineGap: 2.5 });
      doc.font('Helvetica').fillColor(col).text(txt.slice(colonIdx), { lineGap: 2.5 });
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
  const lh = 10.5, pad = 6, MAX_LINES = 36;
  for (let s = 0; s < arr.length; s += MAX_LINES) {
    const chunk = arr.slice(s, s + MAX_LINES);
    const ch = chunk.length * lh + pad * 2 + 12;
    ensureSpace(ch + 8); const y0 = doc.y;
    doc.rect(ML, y0, TW, 12).fill('#161b22');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#58a6ff').text('  ' + (lang || 'JavaScript / Node.js'), ML + 4, y0 + 2, { lineBreak: false });
    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    chunk.forEach(function(line, i) {
      let lineCol = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lineCol = '#8b949e';
      else if (/\b(const|let|var|function|class|import|export|require)\b/.test(line)) lineCol = '#ff7b72';
      else if (/\b(return|await|async|if|else|try|catch|new)\b/.test(line)) lineCol = '#d2a8ff';
      else if (/\b(bcrypt\.|jwt\.|crypto\.|hmac\.|passport\.|User\.|OTP\.)\b/.test(line)) lineCol = '#79c0ff';
      else if (line.includes('"') || line.includes("'") || line.includes('`')) lineCol = '#a5d6ff';
      doc.fontSize(8).font('Courier').fillColor(lineCol).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
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
  doc.fontSize(8.5).font('Helvetica');
  const bh = doc.heightOfString(cleanText(text), { width: TW - 28, lineGap: 2 }) + 16;
  const y0 = doc.y;
  doc.rect(ML, y0, 5, bh).fill(col); doc.rect(ML + 5, y0, TW - 5, bh).fill(bg);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(col).text(label + ': ', ML + 14, y0 + 8, { continued: true, lineGap: 2 });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(text), { lineGap: 2 });
  doc.y = y0 + bh; gap(0.35);
}

function tipBox(text) { infoBox('FAANG TIP', text, C.green, C.greenSoft); }
function noteBox(text) { infoBox('KEY CONCEPT', text, C.accent, '#ebf5fb'); }
function warnBox(text) { infoBox('SECURITY WARNING', text, C.brand, '#fdedec'); }

function QA(num, q, ans, details) {
  ensureSpace(60); const y0 = doc.y;
  const qTxt = 'Q' + num + ':  ' + cleanText(q);
  const qh = doc.heightOfString(qTxt, { width: TW - 16, lineGap: 2 }) + 12;
  doc.rect(ML, y0, TW, qh).fill(C.rowAlt);
  doc.rect(ML, y0, 4, qh).fill(C.accent);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.accent).text(qTxt, ML + 10, y0 + 6, { width: TW - 20, lineGap: 2 });
  doc.y = y0 + qh + 2;
  ensureSpace(20);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.green).text('  Answer:');
  doc.fontSize(8.8).font('Helvetica').fillColor(C.gray).text(cleanText(ans), { lineGap: 2.5, indent: 10 });
  gap(0.1);
  if (details && details.length > 0) {
    details.forEach(function(pt) {
      ensureSpace(12);
      doc.fontSize(8.3).font('Helvetica').fillColor(C.dark).text('   -> ' + cleanText(pt), { lineGap: 2, indent: 8 });
    });
  }
  gap(0.2);
  doc.moveTo(ML, doc.y).lineTo(MR, doc.y).strokeColor(C.border).lineWidth(0.4).stroke(); gap(0.25);
}

function TABLE(headers, rows, widths) {
  widths = widths || [];
  if (!widths.length) { const w = Math.floor(TW / headers.length); headers.forEach(function() { widths.push(w); }); }
  doc.fontSize(8.5).font('Helvetica-Bold');
  let maxHH = 20;
  headers.forEach(function(h, i) { const hh = doc.heightOfString(cleanText(h), { width: widths[i] - 8 }) + 10; if (hh > maxHH) maxHH = hh; });
  ensureSpace(maxHH + 10); const hy = doc.y;
  doc.rect(ML, hy, TW, maxHH).fill(C.brand);
  let hx = ML;
  headers.forEach(function(h, i) { doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white).text(cleanText(h), hx + 4, hy + 5, { width: widths[i] - 8, lineGap: 1 }); hx += widths[i]; });
  doc.y = hy + maxHH;
  rows.forEach(function(row, ri) {
    doc.fontSize(8).font('Helvetica');
    let maxRH = 16;
    row.forEach(function(cell, ci) { const rh = doc.heightOfString(cleanText(String(cell)), { width: widths[ci] - 8, lineGap: 1.5 }) + 8; if (rh > maxRH) maxRH = rh; });
    ensureSpace(maxRH); const ry = doc.y;
    if (ri % 2 === 0) doc.rect(ML, ry, TW, maxRH).fill(C.offWhite);
    let rx = ML;
    row.forEach(function(cell, ci) { doc.fontSize(8).font('Helvetica').fillColor(C.gray).text(cleanText(String(cell)), rx + 4, ry + 4, { width: widths[ci] - 8, lineGap: 1.5 }); rx += widths[ci]; });
    doc.moveTo(ML, ry + maxRH).lineTo(MR, ry + maxRH).strokeColor(C.border).lineWidth(0.3).stroke(); doc.y = ry + maxRH;
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
doc.fontSize(10).font('Helvetica').fillColor(C.accent).text('VOLUME 2 of 4 — Authentication, Security, Cryptography & OAuth 2.0', { align: 'center' });
doc.fontSize(16).font('Helvetica-Bold').fillColor(C.dark).text('Auth & Security: From Zero to FAANG Interview Ready', { align: 'center' });
doc.fontSize(8.5).font('Helvetica').fillColor(C.light)
   .text('bcrypt | JWT | Cookies | Google OAuth | OTP | HMAC-SHA256 | XSS | CSRF | NoSQL Injection | OWASP | 40 Deep Q&As', { align: 'center' });
gap(1.2);
const bx = doc.y;
doc.rect(60, bx, 475, 185).fill(C.offWhite);
doc.rect(60, bx, 6, 185).fill(C.brand);
const cinfo = [
  ['Project', 'EduStack — CS Student Resource Hub & AI Tutor Platform'],
  ['This Volume', 'Auth, Security, Cryptography, JWT, bcrypt, OAuth 2.0, OTP, OWASP, 40 Q&As'],
  ['Volume 1', 'JS Engine, Node.js Event Loop, Express Pipeline, REST API'],
  ['Volume 3', 'MongoDB, Mongoose, Indexing, Caching, Cloudinary, Sessions'],
  ['Volume 4', 'System Design, OS, DSA Patterns, Microservices, FAANG Scenarios'],
  ['Auth Stack', 'bcryptjs (12 rounds) + jsonwebtoken + Passport.js + express-session + Nodemailer'],
  ['Payment Security', 'Razorpay HMAC-SHA256 + crypto.timingSafeEqual (fraud prevention)'],
  ['Cookie Security', 'httpOnly + Secure + SameSite — XSS and CSRF prevention'],
  ['Target Roles', 'SDE I/II/III — Backend, Security Engineer, Full-Stack'],
];
cinfo.forEach(function(r, i) {
  const iy = bx + 14 + (i * 19);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.brand).text(cleanText(r[0]) + ':', 74, iy, { width: 90, lineBreak: false });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(r[1]), 168, iy, { width: 352, lineBreak: false });
});
doc.y = bx + 195; gap(1.2);
doc.fontSize(7.5).font('Helvetica').fillColor(C.light).text('Volume 2 of 4 | Read all 4 volumes to crack any backend/security interview at product-based companies', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// TOC
newPage();
doc.rect(0, 0, 595, 12).fill(C.brand); gap(0.8);
doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents — Volume 2: Auth & Security');
hr(C.brand);
const toc = [
  ['1', 'Cryptography Foundations', 'Symmetric vs Asymmetric, hashing vs encryption, salt, pepper, one-way functions'],
  ['2', 'bcrypt Deep Dive', 'Blowfish cipher, cost factor, 12 rounds, rainbow table defense, $2a$/$2b$ prefix'],
  ['3', 'JWT — Structure, Signing & Verification', 'Header.Payload.Signature, HS256, minimal payload design, exp claim, isAuth'],
  ['4', 'Cookie Security', 'httpOnly, Secure, SameSite flags — XSS and CSRF protection explained'],
  ['5', 'EduStack Full Auth Flow', 'Register -> OTP -> verify -> JWT cookie; Login -> select(+password) -> comparePassword'],
  ['6', 'Google OAuth 2.0 Deep Dive', 'Authorization Code Grant, Passport.js, serialize/deserialize, session + JWT hybrid'],
  ['7', 'OTP Service & Email Security', 'Random OTP, MongoDB TTL, upsert, fire-and-forget email pattern'],
  ['8', 'Attack Patterns & Defenses', 'XSS, CSRF, NoSQL injection, timing attacks, email enumeration — EduStack defenses'],
  ['9', 'Razorpay Payment Security', 'HMAC-SHA256 signature, timingSafeEqual, PCI-DSS basics, fraud prevention'],
  ['10', '40 Deep Interview Q&As — Auth & Security', 'bcrypt, JWT, OAuth, cookies, XSS, CSRF, HMAC — FAANG level'],
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
// SECTION 1 — CRYPTOGRAPHY FOUNDATIONS
// ================================================================
sectionBanner('1', 'Cryptography Foundations',
  'Hashing vs encryption, symmetric vs asymmetric, salt, pepper — from first principles', C.brand);

h1('1.1  Hashing vs Encryption — A Fundamental Distinction', C.brand);
P('Hashing and encryption are often confused but are fundamentally different operations. Understanding this difference is critical for designing secure authentication systems.');

TABLE(
  ['Property', 'Hashing (One-Way)', 'Encryption (Two-Way)'],
  [
    ['Reversibility', 'IRREVERSIBLE — cannot get original from hash', 'REVERSIBLE — decryption produces original plaintext'],
    ['Purpose', 'Verify data integrity without storing original', 'Store/transmit data that must be recovered'],
    ['Key required?', 'No key (deterministic function)', 'Yes — encryption key + decryption key'],
    ['Examples', 'SHA-256, SHA-512, bcrypt, MD5 (broken)', 'AES-256 (symmetric), RSA (asymmetric)'],
    ['Used for', 'Passwords, checksums, digital signatures, JWTs', 'HTTPS/TLS, file encryption, secure key exchange'],
    ['EduStack usage', 'bcrypt for passwords, SHA-256 for Razorpay HMAC', 'TLS for all HTTPS connections (handled by Render.com)'],
  ],
  [120, 185, 190]
);

h1('1.2  Symmetric vs Asymmetric Encryption', C.brand);
bullets([
  'Symmetric encryption: Same key encrypts and decrypts. Fast. Examples: AES-128, AES-256, ChaCha20. Problem: How do you securely share the key? Used in: TLS bulk data transfer after key exchange.',
  'Asymmetric encryption: Public key encrypts, private key decrypts (or private key signs, public key verifies). Slow. Examples: RSA-2048, RSA-4096, ECC (Elliptic Curve). Solves key distribution problem. Used in: TLS handshake key exchange, digital signatures, JWT RS256.',
  'TLS (HTTPS) uses BOTH: Asymmetric RSA/ECDH for key exchange (slow, but only done once per connection), then symmetric AES for bulk data transfer (fast, uses the exchanged shared key).',
  'EduStack JWT uses HS256 (HMAC-SHA256) — symmetric: the same JWT_SECRET is used to sign and verify. For public-facing APIs, RS256 (RSA) is preferred so verification can be done without the private key.',
]);

h1('1.3  Salt, Pepper & Rainbow Tables', C.brand);
P('Why not just SHA-256 passwords? Because SHA-256 is deterministic: SHA256("password123") always produces the same hash. An attacker can precompute a "rainbow table" — a giant lookup table of hash->plaintext mappings — and instantly reverse common passwords.');

TABLE(
  ['Defense', 'What It Is', 'How bcrypt Uses It', 'Who Knows It'],
  [
    ['Salt', 'Random unique value added to each password before hashing', 'bcrypt generates a random salt per-user and embeds it IN the hash string (after the cost prefix)', 'Stored in DB (not secret — its uniqueness prevents rainbow tables)'],
    ['Pepper', 'Secret value added to all passwords, stored in env (not DB)', 'NOT used in EduStack (optional additional layer, adds complexity)', 'Known only to server, never stored in DB'],
    ['Cost factor', 'Number of bcrypt rounds (2^N iterations)', 'EduStack uses 12 rounds = 4096 iterations per hash, ~300ms on modern CPU', 'Embedded in hash string as $12$ prefix'],
  ],
  [65, 175, 140, 115]
);

noteBox('bcrypt output format: $2b$12$N9qo8uLOickgx2ZMRZoMyuDkspedmjklr9.kHc36M3KDu30fxqhBP. Breaking it down: $2b$ = bcrypt version, $12$ = cost factor (12 rounds), next 22 chars = base64-encoded salt, remaining = the actual hash. bcrypt.compare() extracts the salt and cost from this string automatically.');

// ================================================================
// SECTION 2 — BCRYPT DEEP DIVE
// ================================================================
sectionBanner('2', 'bcrypt Deep Dive',
  'Blowfish cipher, 12 cost rounds, why bcrypt beats SHA-256 for passwords', C.accent);

h1('2.1  Why bcrypt for Passwords?', C.accent);
P('bcrypt is a deliberately SLOW hashing algorithm designed specifically for passwords. Regular hash functions (SHA-256, MD5) are designed to be as FAST as possible — SHA-256 can hash 1 billion passwords per second on a GPU. bcrypt at cost factor 12 does ~100 hashes per second on the same GPU. This 10-million-fold slowdown makes brute force attacks economically infeasible.');

CODE(
'// bcrypt implementation in EduStack — authController.js\n' +
'const bcrypt = require("bcryptjs");\n' +
'const SALT_ROUNDS = 12; // 2^12 = 4096 iterations per hash\n' +
'\n' +
'// === DURING REGISTRATION ===\n' +
'exports.register = asyncHandler(async (req, res) => {\n' +
'  const { password } = req.body;\n' +
'  // bcrypt.hash() does 3 things:\n' +
'  // 1. Generates a cryptographically random 128-bit salt\n' +
'  // 2. Runs Blowfish key expansion 2^12 = 4096 times\n' +
'  // 3. Returns the combined hash string with embedded salt + cost\n' +
'  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);\n' +
'  await User.create({ password: hashedPassword, ... });\n' +
'});\n' +
'\n' +
'// === DURING LOGIN (instance method on User model) ===\n' +
'userSchema.methods.comparePassword = async function(candidatePassword) {\n' +
'  // bcrypt.compare() extracts the salt from this.password (stored hash),\n' +
'  // hashes candidatePassword with the SAME salt + cost, then compares.\n' +
'  // Returns true if match, false if not.\n' +
'  return bcrypt.compare(candidatePassword, this.password);\n' +
'};\n' +
'\n' +
'// === PRE-SAVE HOOK (safety net in models/user.js) ===\n' +
'userSchema.pre("save", async function(next) {\n' +
'  if (!this.isModified("password") || !this.password) return next();\n' +
'  // Guard: if already a bcrypt hash ($2a$/$2b$), do not double-hash\n' +
'  if (!this.password.startsWith("$2a$") && !this.password.startsWith("$2b$")) {\n' +
'    const salt = await bcrypt.genSalt(12);\n' +
'    this.password = await bcrypt.hash(this.password, salt);\n' +
'  }\n' +
'  next();\n' +
'});'
);

tipBox('Interview Q: "Why does EduStack use 12 bcrypt rounds instead of 10 or 14?" 10 rounds (~100ms) is sufficient but 12 (~300ms) is the current production recommendation balancing security and UX. 14 rounds (>1 second) would make login noticeably slow. The bcrypt cost factor should be increased as hardware improves to maintain the target hash time of 100-300ms.');

// ================================================================
// SECTION 3 — JWT DEEP DIVE
// ================================================================
sectionBanner('3', 'JWT — Structure, Signing & Verification',
  'Header.Payload.Signature, HS256, minimal payload, why role is NOT stored in token', C.purple);

h1('3.1  JWT Structure — Decoded', C.purple);
P('A JSON Web Token (JWT) is a compact, URL-safe way to securely transmit claims between parties. It consists of three Base64URL-encoded parts separated by dots: Header.Payload.Signature. The signature makes it tamper-evident — any modification to the header or payload invalidates the signature.');

CODE(
'// JWT HEADER (Base64URL decoded):\n' +
'{\n' +
'  "alg": "HS256",  // Algorithm: HMAC-SHA256 (symmetric)\n' +
'  "typ": "JWT"\n' +
'}\n' +
'\n' +
'// JWT PAYLOAD (Base64URL decoded) — EduStack keeps this MINIMAL:\n' +
'{\n' +
'  "id": "64f7a2b3c8e1234567890abc",  // MongoDB ObjectId of the user\n' +
'  "iat": 1724464800,                  // Issued At (Unix timestamp)\n' +
'  "exp": 1725069600                   // Expiry (iat + 7 days)\n' +
'}\n' +
'// NOTE: role and email are intentionally NOT in the payload.\n' +
'// Reason: If an admin revokes a user, the token still has the old role.\n' +
'// EduStack re-fetches user from DB on every request (isAuth) so revocations\n' +
'// take effect immediately, not just after token expiry.\n' +
'\n' +
'// JWT SIGNATURE:\n' +
'// HMAC-SHA256(base64url(header) + "." + base64url(payload), JWT_SECRET)\n' +
'\n' +
'// utils/generateToken.js\n' +
'const generateToken = (userId) => {\n' +
'  return jwt.sign(\n' +
'    { id: userId },                              // Minimal payload\n' +
'    process.env.JWT_SECRET,                      // Symmetric secret key\n' +
'    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" } // 7 day default\n' +
'  );\n' +
'};\n' +
'\n' +
'// jwt.verify() in isAuth middleware:\n' +
'const decoded = jwt.verify(token, process.env.JWT_SECRET);\n' +
'// decoded = { id: "...", iat: ..., exp: ... }\n' +
'// Throws JsonWebTokenError if tampered, TokenExpiredError if expired'
);

h2('HS256 vs RS256 — When to Use Which');
TABLE(
  ['Property', 'HS256 (HMAC-SHA256)', 'RS256 (RSA + SHA256)'],
  [
    ['Type', 'Symmetric — same secret for sign and verify', 'Asymmetric — private key signs, public key verifies'],
    ['Key Management', 'Single secret shared between signer and verifier', 'Private key secured on auth server, public key distributed freely'],
    ['Performance', 'Fast — HMAC is a single-pass operation', 'Slower — RSA involves modular exponentiation'],
    ['Best For', 'Single-server or trusted microservices that share secret', 'Multi-service architectures where services only need to VERIFY (not sign)'],
    ['EduStack', 'Uses HS256 — single Node.js server signs and verifies', 'Would use RS256 if auth server was separate from resource servers'],
  ],
  [100, 195, 200]
);

// ================================================================
// SECTION 4 — COOKIE SECURITY
// ================================================================
sectionBanner('4', 'Cookie Security — httpOnly, Secure, SameSite',
  'How EduStack prevents XSS token theft and CSRF attacks via cookie flags', C.teal);

h1('4.1  The Three Critical Cookie Flags', C.teal);
P('EduStack stores the JWT in an httpOnly cookie named "edustack_token". This is the recommended approach for web applications — it is significantly more secure than storing JWTs in localStorage, which is vulnerable to XSS attacks.');

TABLE(
  ['Flag', 'What It Does', 'Without It', 'EduStack Value'],
  [
    ['httpOnly', 'Prevents JavaScript from reading the cookie via document.cookie', 'An XSS attack can steal the token with: document.cookie (trivial)', 'true — always set'],
    ['Secure', 'Cookie is only sent over HTTPS connections', 'Token sent in plaintext over HTTP — intercepted by man-in-the-middle', 'true in production, false in local dev (no HTTPS locally)'],
    ['SameSite', 'Controls when cookie is sent in cross-origin requests', 'Without SameSite=strict, an attacker\'s site can trigger requests to EduStack API using victim\'s cookie', 'strict in dev, none in production (required for OAuth redirect)'],
    ['MaxAge', 'Time in milliseconds before cookie expires', 'Session cookie — deleted when browser closes (poor UX)', '7 days (604800000 ms)'],
  ],
  [65, 170, 130, 130]
);

CODE(
'// utils/generateToken.js — How EduStack sets the secure cookie\n' +
'const attachCookieToken = (res, userId) => {\n' +
'  const token = generateToken(userId);\n' +
'  const IS_PRODUCTION = process.env.NODE_ENV === "production";\n' +
'\n' +
'  res.cookie("edustack_token", token, {\n' +
'    httpOnly: true,       // CRITICAL: JS cannot read this cookie\n' +
'    secure: IS_PRODUCTION, // HTTPS-only in production\n' +
'    sameSite: IS_PRODUCTION ? "none" : "strict",\n' +
'    // Production uses "none" because Google OAuth redirect goes from\n' +
'    // Google (different origin) back to our server, and the cookie\n' +
'    // must be sent in that cross-origin redirect.\n' +
'    // "none" REQUIRES secure:true (HTTPS)\n' +
'    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds\n' +
'  });\n' +
'\n' +
'  return token; // Also returned in body for API clients that prefer headers\n' +
'};\n' +
'\n' +
'// LOGOUT: Clear the cookie by setting maxAge to 0\n' +
'exports.logout = asyncHandler(async (req, res) => {\n' +
'  res.cookie("edustack_token", "", {\n' +
'    httpOnly: true,\n' +
'    secure: IS_PRODUCTION,\n' +
'    sameSite: "strict",\n' +
'    maxAge: 0, // Immediately expire — effectively deletes the cookie\n' +
'  });\n' +
'  return sendSuccess(res, "Logged out successfully.");\n' +
'});'
);

warnBox('NEVER store JWTs in localStorage. localStorage is accessible via document.cookie/window.localStorage from any JavaScript on the page. A single XSS vulnerability (e.g., injecting a script via unsanitized user input) can steal ALL tokens from localStorage. httpOnly cookies are immune to this attack because JavaScript cannot read them at all.');

// ================================================================
// SECTION 5 — EDUSTACK AUTH FLOW
// ================================================================
sectionBanner('5', 'EduStack Full Authentication Flow',
  'Registration -> OTP -> verify -> JWT cookie; Login -> comparePassword -> JWT', C.green);

h1('5.1  Registration Flow — Step by Step', C.green);
DIAGRAM_BOXES('EduStack User Registration Flow', [
  { label: 'Step 1: POST /api/auth/register — Client sends { firstName, lastName, email, password, avatar? }' },
  { label: 'Step 2: Normalize email (lowercase + trim). Check for existing user (User.findOne({ email })) — 409 if duplicate' },
  { label: 'Step 3: Hash password with bcrypt.hash(password, 12) — ~300ms, runs in libuv thread pool' },
  { label: 'Step 4: Handle optional avatar: multer reads file into Buffer, bufferToBase64Uri() converts, Cloudinary uploads' },
  { label: 'Step 5: User.create({ firstName, lastName, email, password: hashedPassword, avatar, role }) — saves to MongoDB' },
  { label: 'Step 6: otpService.saveAndSendOtp(email) — generates 6-digit OTP, upserts to OTP collection, sends via Nodemailer' },
  { label: 'Step 7: Return 201 Created with { email } — user cannot log in until OTP verified (isVerified: false)' },
]);

h1('5.2  OTP Verification Flow', C.green);
DIAGRAM_BOXES('OTP Verify -> Account Activation -> JWT Issue', [
  { label: 'Step 1: POST /api/auth/verify-otp — Client sends { email, otp }' },
  { label: 'Step 2: otpService.verifyOtp(email, otp) — finds OTP document in MongoDB, checks code match and expiry' },
  { label: 'Step 3: User.findOneAndUpdate({ email }, { isVerified: true }, { new: true }) — activates account' },
  { label: 'Step 4: mailService.sendWelcomeEmail() — fire-and-forget (no await), failure does NOT block response' },
  { label: 'Step 5: attachCookieToken(res, user._id) — generates JWT, sets httpOnly cookie, returns token in body' },
  { label: 'Step 6: Return 200 with { token, user: { id, firstName, lastName, email, role, avatar } }' },
]);

h1('5.3  Login Flow — The Critical password Selection', C.green);
CODE(
'// authController.js — Login: The most security-critical endpoint\n' +
'exports.login = asyncHandler(async (req, res) => {\n' +
'  const { email, password } = req.body;\n' +
'  const normalizedEmail = email.toLowerCase().trim();\n' +
'\n' +
'  // CRITICAL: .select("+password") is required because the User schema\n' +
'  // has { password: { type: String, select: false } }\n' +
'  // Without +password, user.password is undefined and comparePassword() fails.\n' +
'  const user = await User.findOne({ email: normalizedEmail }).select("+password");\n' +
'\n' +
'  if (!user) {\n' +
'    // Deliberately vague message — do NOT say "email not found"\n' +
'    // Specific messages enable email enumeration attacks.\n' +
'    return sendError(res, "Invalid email or password.", 401);\n' +
'  }\n' +
'\n' +
'  // Block unverified accounts and auto-resend OTP for better UX\n' +
'  if (!user.isVerified) {\n' +
'    await otpService.saveAndSendOtp(normalizedEmail); // Resend OTP\n' +
'    return sendError(res, "Account not verified. A new OTP has been sent.", 403);\n' +
'  }\n' +
'\n' +
'  // bcrypt.compare() hashes the candidate password with the same salt\n' +
'  // that is embedded in user.password, then compares.\n' +
'  const isMatch = await user.comparePassword(password);\n' +
'  if (!isMatch) {\n' +
'    return sendError(res, "Invalid email or password.", 401); // Same message!\n' +
'  }\n' +
'\n' +
'  const token = attachCookieToken(res, user._id); // JWT cookie set here\n' +
'  user.password = undefined; // Remove from response object\n' +
'\n' +
'  return sendSuccess(res, "Logged in successfully.", { token, user: {...} });\n' +
'});'
);

tipBox('Interview Q: "Why does EduStack return the same error message for wrong email AND wrong password?" This prevents email enumeration attacks. If the server said "Email not found" when email is wrong and "Wrong password" when email exists, an attacker could enumerate which emails are registered. Always return the same message for authentication failures.');

// ================================================================
// SECTION 6 — GOOGLE OAUTH 2.0
// ================================================================
sectionBanner('6', 'Google OAuth 2.0 Deep Dive',
  'Authorization Code Grant flow, Passport.js, session + JWT hybrid', C.accent);

h1('6.1  OAuth 2.0 — Why It Exists', C.accent);
P('OAuth 2.0 is an authorization framework that allows users to grant third-party applications limited access to their account on another service, WITHOUT sharing their password. "Sign in with Google" uses OAuth — EduStack never sees your Google password. It only receives a profile (name, email, photo) after you grant permission.');

DIAGRAM_BOXES('Google OAuth 2.0 Authorization Code Grant Flow', [
  { label: 'Step 1: User clicks "Sign in with Google" -> Browser navigates to GET /auth/google' },
  { label: 'Step 2: Passport.js redirects to Google OAuth consent screen: accounts.google.com/o/oauth2/auth?client_id=...&scope=profile+email' },
  { label: 'Step 3: User sees Google consent screen. If approved, Google redirects to: GET /auth/google/callback?code=<auth_code>' },
  { label: 'Step 4: Passport.js exchanges the auth code for access token: POST accounts.google.com/o/oauth2/token (server-to-server — auth code is safe)' },
  { label: 'Step 5: Passport.js uses access token to GET https://www.googleapis.com/userinfo/v2/me — fetches name, email, photo, googleId' },
  { label: 'Step 6: EduStack GoogleStrategy callback: find/create user in MongoDB, set role if admin email, return done(null, user)' },
  { label: 'Step 7: passport.serializeUser saves user._id to session. attachCookieToken sets JWT cookie. Redirect to /' },
]);

CODE(
'// app.js — Google OAuth Strategy Configuration\n' +
'passport.use(new GoogleStrategy({\n' +
'    clientID:     process.env.GOOGLE_CLIENT_ID,\n' +
'    clientSecret: process.env.GOOGLE_CLIENT_SECRET,\n' +
'    callbackURL:  getGoogleCallbackURL(), // Handles localhost vs Render.com\n' +
'  },\n' +
'  async (accessToken, refreshToken, profile, done) => {\n' +
'    try {\n' +
'      const userEmail = profile.emails[0].value.toLowerCase().trim();\n' +
'      const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",")...\n' +
'      const isAdmin = ADMIN_EMAILS.includes(userEmail);\n' +
'\n' +
'      // 1. Find by googleId (returning Google user)\n' +
'      let user = await User.findOne({ googleId: profile.id });\n' +
'      if (user) { /* update role if admin, return */ return done(null, user); }\n' +
'\n' +
'      // 2. Find by email (local account, now linking Google)\n' +
'      const emailUser = await User.findOne({ email: userEmail });\n' +
'      if (emailUser) {\n' +
'        emailUser.googleId = profile.id; // Link Google ID to existing account\n' +
'        await emailUser.save();\n' +
'        return done(null, emailUser);\n' +
'      }\n' +
'\n' +
'      // 3. Create new Google user (first-time Google login)\n' +
'      user = await User.create({\n' +
'        firstName: profile.name.givenName || "User",\n' +
'        lastName:  profile.name.familyName || "",\n' +
'        email:     userEmail,\n' +
'        googleId:  profile.id,\n' +
'        role:      isAdmin ? "admin" : "user",\n' +
'        avatar:    profile.photos?.[0]?.value || "default-avatar.png",\n' +
'        isVerified: true, // Google accounts are pre-verified\n' +
'      });\n' +
'      return done(null, user);\n' +
'    } catch (err) { return done(err, null); }\n' +
'  }\n' +
'));'
);

h2('Why EduStack Uses BOTH Sessions AND JWTs for OAuth');
bullets([
  'Google OAuth REQUIRES session state: After the consent screen, Google redirects to /auth/google/callback with an authorization code. Passport.js needs session state to know which user initiated this OAuth flow and to store temporary OAuth data between redirects.',
  'connect-mongodb-session stores session data in MongoDB "sessions" collection. Session ID is stored in a cookie (not httpOnly by default). Passport serializes user._id to session on login.',
  'After OAuth callback: EduStack calls attachCookieToken(res, user._id) to also set the JWT httpOnly cookie. This gives the frontend a JWT for subsequent API calls (which use Bearer token or cookie JWT auth, not session auth).',
  'Hybrid design: Session (stateful) for OAuth flow. JWT (stateless) for all API requests. Best of both worlds.',
]);

// ================================================================
// SECTION 7 — OTP SERVICE
// ================================================================
sectionBanner('7', 'OTP Service & Email Security',
  'Random OTP generation, MongoDB TTL, upsert, fire-and-forget email pattern', C.teal);

h1('7.1  OTP Implementation — Security Analysis', C.teal);
CODE(
'// services/otpService.js — Simplified implementation\n' +
'const OTP = require("../models/otp");\n' +
'const mailService = require("./mailService");\n' +
'const crypto = require("crypto");\n' +
'\n' +
'// Generate cryptographically secure 6-digit OTP\n' +
'const generateOtp = () => {\n' +
'  // crypto.randomInt(min, max) uses OS CSPRNG (Cryptographically Secure PRNG)\n' +
'  // Unlike Math.random() which is NOT cryptographically secure\n' +
'  return String(crypto.randomInt(100000, 999999));\n' +
'};\n' +
'\n' +
'exports.saveAndSendOtp = async (email) => {\n' +
'  const code = generateOtp();\n' +
'  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes\n' +
'\n' +
'  // upsertOne: Updates if exists, creates if not.\n' +
'  // { upsert: true } prevents duplicate OTP documents per email.\n' +
'  await OTP.findOneAndUpdate(\n' +
'    { email },                          // find by email\n' +
'    { email, code, expiresAt },         // update with new code\n' +
'    { upsert: true, new: true }         // create if not found\n' +
'  );\n' +
'\n' +
'  // Send email via Nodemailer (fire-and-forget from controller)\n' +
'  await mailService.sendOtpEmail(email, code);\n' +
'};\n' +
'\n' +
'exports.verifyOtp = async (email, inputCode) => {\n' +
'  const record = await OTP.findOne({ email });\n' +
'  if (!record) throw new Error("OTP expired. Please request a new one.");\n' +
'  if (record.expiresAt < new Date()) throw new Error("OTP has expired.");\n' +
'  if (record.code !== String(inputCode).trim()) throw new Error("Invalid OTP.");\n' +
'  await OTP.deleteOne({ email }); // Consume the OTP (single use)\n' +
'};'
);

bullets([
  'Cryptographically secure: crypto.randomInt() uses the OS CSPRNG (not Math.random() which is predictable). A 6-digit OTP has 900,000 possibilities — secure for a 10-minute window.',
  'MongoDB TTL index: The OTP collection has a TTL index on expiresAt. MongoDB automatically deletes expired OTP documents — no cron job needed.',
  'Upsert pattern: findOneAndUpdate with upsert:true ensures only ONE active OTP per email. Resending OTP replaces the previous one.',
  'Single use: OTP is deleted after verification. It cannot be used twice (replay attack prevention).',
  'Rate limiting: express-rate-limit on /api/auth/resend-otp prevents OTP spam attacks.',
]);

// ================================================================
// SECTION 8 — ATTACK PATTERNS & DEFENSES
// ================================================================
sectionBanner('8', 'Attack Patterns & EduStack Defenses',
  'XSS, CSRF, NoSQL injection, timing attacks, OWASP Top 10 with mitigation', C.brand);

h1('8.1  Cross-Site Scripting (XSS)', C.brand);
P('XSS occurs when an attacker injects malicious JavaScript into a web page viewed by other users. The script runs in the victim\'s browser with access to the page\'s DOM, cookies (if not httpOnly), localStorage, and network requests.');

TABLE(
  ['XSS Type', 'How It Works', 'EduStack Mitigation'],
  [
    ['Stored XSS', 'Malicious script saved in DB (e.g., in a comment), rendered to all users who view it', 'Input sanitization on save, escape user-generated content on render, Content-Security-Policy header'],
    ['Reflected XSS', 'Script in URL parameter, server reflects it back in HTML response', 'Express does not render user input in HTML (REST API returns JSON, no server-side templating)'],
    ['DOM-Based XSS', 'Client-side JS reads URL/DOM and writes unsanitized data to innerHTML', 'Using textContent instead of innerHTML in frontend JS; avoid eval()'],
  ],
  [100, 195, 200]
);

noteBox('httpOnly cookies are XSS-resistant: Even if an attacker successfully injects script that runs document.cookie, the edustack_token cookie is NOT accessible because httpOnly flag prevents JavaScript from reading it. The cookie is still SENT with requests (the browser handles this), but scripts cannot read its value.');

h1('8.2  Cross-Site Request Forgery (CSRF)', C.brand);
P('CSRF occurs when an attacker tricks a victim\'s browser into making a state-changing request to a trusted site using the victim\'s existing session. Example: An email contains an image tag <img src="https://edustack.com/api/payments/create-order"> — the victim\'s browser automatically sends the request WITH their cookie.');

bullets([
  'SameSite=strict defense: When EduStack sets sameSite: "strict" on the JWT cookie, browsers refuse to send the cookie on cross-origin requests. The attacker\'s CSRF request from their site does not include the edustack_token cookie.',
  'SameSite=none in production: EduStack uses "none" in production for Google OAuth redirect compatibility. This reduces CSRF protection, so an additional CSRF token should be implemented in production for state-changing endpoints.',
  'JSON-only API: EduStack only accepts application/json content type for state-changing endpoints. HTML form submissions (the traditional CSRF vector) do not have the Content-Type header and are rejected by express.json() middleware.',
  'Helmet headers: helmet() sets X-Frame-Options: SAMEORIGIN which prevents clickjacking (a CSRF variant using iframes).',
]);

h1('8.3  NoSQL Injection', C.brand);
CODE(
'// WITHOUT mongoSanitize — VULNERABLE to NoSQL injection:\n' +
'// Attacker sends: POST /api/auth/login\n' +
'// Body: { "email": { "$gt": "" }, "password": { "$gt": "" } }\n' +
'// Mongoose query becomes: User.findOne({ email: { $gt: "" }, password: { $gt: "" } })\n' +
'// $gt: "" matches any non-empty string — authentication BYPASSED!\n' +
'\n' +
'// WITH mongoSanitize — PROTECTED:\n' +
'app.use(mongoSanitize());\n' +
'// mongoSanitize strips all keys starting with "$" from req.body and req.query\n' +
'// Result: { email: "", password: "" } — treated as empty strings, not operators\n' +
'\n' +
'// ADDITIONAL PROTECTION in Mongoose schemas:\n' +
'// Mongoose schema casting also protects:\n' +
'// email: { type: String } — if { $gt: "" } is passed as email,\n' +
'// Mongoose tries to cast it to String, resulting in "[object Object]"\n' +
'// which won\'t match any real email in the DB.\n' +
'\n' +
'// BEST PRACTICE: Use parameterized queries / Mongoose typed schemas\n' +
'// AND mongoSanitize as defense-in-depth.'
);

h1('8.4  Timing Attacks & timingSafeEqual', C.brand);
P('A timing attack measures the time it takes for a server to respond to determine secret information. If a string comparison exits early on first mismatch (as === does), an attacker can measure nanosecond differences in response time to determine how many characters of the secret match their guess.');

CODE(
'// services/razorpayService.js — Timing-safe comparison\n' +
'const crypto = require("crypto");\n' +
'\n' +
'const verifyPaymentSignature = (orderId, paymentId, signature) => {\n' +
'  // Build the message Razorpay signed\n' +
'  const message = `${orderId}|${paymentId}`;\n' +
'\n' +
'  // Compute the expected signature using our KEY_SECRET\n' +
'  const expectedSig = crypto\n' +
'    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)\n' +
'    .update(message)\n' +
'    .digest("hex");\n' +
'\n' +
'  // WRONG (vulnerable to timing attack):\n' +
'  // return expectedSig === signature; // Exits on first char mismatch\n' +
'\n' +
'  // CORRECT (timing-safe — always takes the same time regardless of match):\n' +
'  try {\n' +
'    return crypto.timingSafeEqual(\n' +
'      Buffer.from(expectedSig, "hex"),\n' +
'      Buffer.from(signature,   "hex")\n' +
'    );\n' +
'  } catch {\n' +
'    return false; // Length mismatch also means invalid\n' +
'  }\n' +
'};'
);

// ================================================================
// SECTION 9 — RAZORPAY PAYMENT SECURITY
// ================================================================
sectionBanner('9', 'Razorpay Payment Security',
  'HMAC-SHA256 signature verification, 2-step payment flow, fraud prevention', C.purple);

h1('9.1  Razorpay 2-Step Payment Flow', C.purple);
DIAGRAM_BOXES('EduStack Razorpay Payment Flow', [
  { label: 'Step 1: POST /api/payments/create-order (authenticated). Server calls Razorpay API to create order with amount in paise. Saves order to DB (status: "created"). Returns orderId, amount, keyId to frontend.' },
  { label: 'Step 2: Frontend opens Razorpay checkout UI with orderId + keyId. User enters card/UPI details. Payment is processed by Razorpay.' },
  { label: 'Step 3: On success, Razorpay gives frontend: { razorpayOrderId, razorpayPaymentId, razorpaySignature }' },
  { label: 'Step 4: POST /api/payments/verify. Server recomputes HMAC-SHA256(orderId|paymentId, KEY_SECRET) and compares with razorpaySignature using timingSafeEqual.' },
  { label: 'Step 5: If valid: Update payment to "paid", set user.isPremium = true. If invalid: Set payment to "failed", return 400 (fraud attempt).' },
]);

tipBox('Interview Q: "Why does EduStack verify the Razorpay signature server-side instead of trusting the frontend?" The frontend is untrusted. An attacker can intercept Razorpay\'s callback and forge a payment confirmation. Server-side HMAC verification ensures only Razorpay (who knows the KEY_SECRET) could have generated the valid signature. This prevents fake payment injections.');

// ================================================================
// SECTION 10 — 40 DEEP Q&As
// ================================================================
sectionBanner('10', '40 Deep Interview Q&As — Auth & Security',
  'bcrypt, JWT, OAuth, cookies, XSS, CSRF, HMAC, OWASP — FAANG level', C.brand);

infoBox('About This Section', 'These 40 questions cover authentication, security, and cryptography at the depth expected in FAANG/Tier-1 company interviews. All answers reference EduStack\'s actual production security implementation.', C.accent);

QA(1, 'Why should you NEVER store passwords in plain text? What is bcrypt?',
'Plain-text passwords in a database expose ALL user accounts if the database is breached. bcrypt is a password hashing algorithm designed to be deliberately slow (computationally expensive), making brute-force attacks infeasible. It generates a unique random salt per password, preventing rainbow table attacks.',
['SHA-256 can hash 1 billion passwords/second on a GPU. bcrypt at cost 12 does ~100 hashes/second. 10-million-fold slowdown makes brute force impractical.', 'bcrypt embeds the salt in the hash output — bcrypt.compare() can extract it and use it for verification without a separate storage column.', 'EduStack uses bcryptjs (pure JavaScript bcrypt) with cost factor 12 — balancing security (~300ms hash time) and user experience.']);

QA(2, 'What is a JWT? How does signature verification work?',
'JWT (JSON Web Token) is a compact, URL-safe token with three Base64URL-encoded parts: Header (algorithm type), Payload (claims like userId and exp), and Signature (HMAC of header+payload using a secret). Any modification to header or payload invalidates the signature — tampering is detectable without contacting the server.',
['jwt.sign(payload, secret, options) creates the token. jwt.verify(token, secret) decodes and validates signature + expiry.', 'HS256: HMAC-SHA256 with a shared secret (symmetric). RS256: RSA signature with private/public key pair (asymmetric).', 'JWTs are NOT encrypted by default — the payload is Base64URL-encoded (reversible). Never store sensitive data (SSN, credit card) in JWT payload.']);

QA(3, 'Why does EduStack NOT store user role in the JWT payload?',
'If the role is stored in the JWT, changing a user\'s role (e.g., revoking admin access) has no effect until the token expires (7 days in EduStack). An attacker who obtains a token for a decommissioned admin account can continue using it with admin privileges for up to 7 days.',
['EduStack\'s solution: JWT only contains { id: userId }. isAuth middleware fetches the FULL user from MongoDB on every request — including current role. Role changes take effect on the very next API call.', 'Trade-off: One DB query per authenticated request. For high-traffic APIs, this can be mitigated with a short JWT expiry (15 minutes) + refresh tokens, or by caching user data in Redis.', 'NEVER store passwords, payment details, or sensitive PII in JWT payloads.']);

QA(4, 'What is the difference between authentication and authorization?',
'Authentication: Verifying WHO you are. "Are you really Shubham Kumar?" Verified by checking credentials (password match, valid JWT). Authorization: Verifying WHAT you are allowed to do. "Is Shubham Kumar allowed to delete this subject?" Checked by role/permissions.',
['Authentication in EduStack: isAuth middleware (JWT verification + user fetch from DB).', 'Authorization in EduStack: requireRole("admin") middleware checks req.user.role === "admin" after isAuth confirms identity.', 'Route example: router.post("/subjects", isAuth, requireRole("admin"), subjectController.create) — must be authenticated AND admin.']);

QA(5, 'What is XSS? How does EduStack prevent it?',
'Cross-Site Scripting (XSS) is an attack where malicious JavaScript is injected into a web page. When other users view the page, the script runs in their browser, potentially stealing cookies, localStorage data, making API requests on their behalf, or redirecting them.',
['httpOnly cookies: The edustack_token cookie cannot be read by injected scripts — document.cookie returns empty.', 'Content-Security-Policy (partially): helmet() sets some CSP-related headers. A full CSP policy would restrict which scripts can execute.', 'Input validation: express-validator validates and sanitizes req.body fields. Mongoose schema types cast and reject unexpected data formats.']);

QA(6, 'What is CSRF? How does SameSite cookie prevent it?',
'CSRF (Cross-Site Request Forgery) tricks a victim\'s browser into making an authenticated request to a trusted site from an attacker-controlled page. The browser automatically includes cookies in requests, so the victim\'s auth cookie rides along with the attacker\'s request.',
['SameSite=strict: Browser refuses to send the cookie with ANY cross-origin request (form submissions, image loads, AJAX). The CSRF request from the attacker\'s site never includes the auth cookie.', 'SameSite=none: EduStack uses this in production for OAuth redirect compatibility. Means CSRF via cross-origin requests IS possible — additional CSRF token protection should be added for production.', 'Content-Type check: CSRF attacks typically use HTML forms (application/x-www-form-urlencoded). EduStack only accepts application/json — rejects HTML form submissions.']);

QA(7, 'Explain HMAC-SHA256. How does Razorpay use it in EduStack?',
'HMAC (Hash-based Message Authentication Code) is a construction that uses a cryptographic hash function (SHA-256) combined with a secret key to produce a MAC (Message Authentication Code). It provides both integrity (message not modified) and authenticity (message came from someone with the key).',
['HMAC-SHA256 formula: HMAC = SHA256(key XOR opad || SHA256(key XOR ipad || message))', 'Razorpay signs: HMAC-SHA256("orderId|paymentId", KEY_SECRET). EduStack recomputes this. If they match, the payment is genuine.', 'crypto.timingSafeEqual() prevents timing attacks — comparison takes constant time regardless of how many characters match.']);

QA(8, 'What is select: false in Mongoose? Why does EduStack use it on password?',
'select: false means the field is NOT included in query results by default. You must explicitly request it with .select("+password"). This prevents the password hash from being accidentally included in API responses (e.g., when fetching user profiles).',
['Without select: false — User.findById(id) would return { name, email, password: "$2b$12$..." } — the hash leaks in every user fetch.', 'With select: false — User.findById(id) returns { name, email } — password omitted.', 'EduStack only includes password when needed for verification: User.findOne({ email }).select("+password") in the login controller.']);

QA(9, 'What is OAuth 2.0 and why does EduStack use it?',
'OAuth 2.0 is an authorization framework enabling third-party applications to access user accounts on external services without exposing credentials. "Sign in with Google" uses OAuth — EduStack never sees the user\'s Google password. Google authenticates the user and gives EduStack a profile.',
['Benefits: No password management for Google users, trusted Google verification, auto-verified email (isVerified: true for Google users).', 'Security: The authorization code (from Google\'s redirect) is exchanged for an access token server-to-server — the code is never exposed in the browser URL in a way that persists.', 'PKCE (Proof Key for Code Exchange) prevents code interception attacks. Passport.js handles PKCE automatically for Google OAuth.']);

QA(10, 'Explain the difference between symmetric and asymmetric cryptography.',
'Symmetric: Same key for encryption and decryption (e.g., AES-256). Fast but requires secure key exchange. Both parties must know the secret. Used for: bulk data encryption (TLS data phase), JWT HS256.',
['Asymmetric: Public key encrypts/verifies, private key decrypts/signs (e.g., RSA-2048, ECC). Slower but solves key distribution. Used for: TLS handshake (key exchange), JWT RS256, SSL certificates, digital signatures.', 'TLS uses both: RSA/ECDH (asymmetric) to securely exchange a session key, then AES (symmetric) for all data in that session.', 'EduStack JWT uses HS256 (symmetric) — appropriate for a single-server application. Multi-service architectures prefer RS256 so services can verify without knowing the private key.']);

QA(11, 'What is a rainbow table attack? How does bcrypt\'s salt prevent it?',
'A rainbow table is a precomputed lookup table mapping common passwords to their hashes (e.g., SHA256("password123") -> "ef92b7..."). An attacker who obtains the DB can instantly reverse common passwords without brute-forcing them.',
['bcrypt\'s salt prevention: bcrypt generates a random 128-bit salt per password. Even if two users have the same password, their bcrypt hashes are completely different (different salts). Rainbow tables are useless because they would need to precompute all combinations of (password, salt).', 'Attacker would need to compute 2^128 tables (one per possible salt) — computationally impossible.', 'The salt is stored IN the bcrypt hash string itself — bcrypt.compare() knows to use it.']);

QA(12, 'What is a timing attack? How does crypto.timingSafeEqual prevent it?',
'Regular string comparison (===) short-circuits on the first differing character. An attacker can measure nanosecond response time differences to determine how many leading characters of their guess match the correct value, enabling character-by-character brute force.',
['timingSafeEqual: Compares two Buffers in constant time — always takes the same time regardless of where the first mismatch occurs. Completely eliminates timing-based information leakage.', 'Critical for: HMAC verification (Razorpay payment sig), API key comparison, password comparison (bcrypt handles this internally).', 'Do NOT use === for security-sensitive comparisons. Always use crypto.timingSafeEqual() in Node.js.']);

QA(13, 'What is the OTP model\'s TTL index in MongoDB? How does it work?',
'A TTL (Time-To-Live) index in MongoDB automatically deletes documents after a specified time period. The OTP model has a TTL index on the expiresAt field. MongoDB\'s background TTL monitor runs every 60 seconds and removes expired OTP documents automatically.',
['Schema: { expiresAt: { type: Date }, code: String, email: String }', 'Index: otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 }) — documents are deleted when expiresAt is in the past.', 'No manual cleanup needed — MongoDB handles OTP expiration automatically. Expired OTPs cannot be used because findOne() returns null for deleted documents.']);

QA(14, 'Why is the same error message returned for wrong email AND wrong password in EduStack\'s login?',
'Returning different messages ("Email not found" vs "Wrong password") allows an attacker to enumerate which emails are registered. They can write a script to test thousands of emails and learn which ones have accounts — useful for phishing targeted attacks.',
['EduStack returns "Invalid email or password." for BOTH cases — the attacker cannot distinguish between them.', 'Applied consistently: forgotPassword endpoint also returns the same message whether the email exists or not: "If an account with this email exists, a reset OTP has been sent."', 'This is OWASP API Security Top 10 recommendation: API2:2023 - Broken Authentication — avoid leaking information about account existence.']);

QA(15, 'Explain bcrypt.genSalt() vs bcrypt.hash() — what is the difference?',
'bcrypt.genSalt(rounds) generates a random cryptographic salt with the specified cost factor embedded. bcrypt.hash(password, saltOrRounds) can accept either the salt (from genSalt) or directly a number of rounds (it generates salt internally).',
['bcrypt.genSalt(12) then bcrypt.hash(password, salt): Explicit two-step — gives you the salt if you need it separately.', 'bcrypt.hash(password, 12): Generates salt internally and hashes in one call. EduStack uses this in the authController.', 'Both are equivalent in security — single-step hash is cleaner for most use cases.']);

QA(16, 'What is Passport.js? How does serializeUser/deserializeUser work?',
'Passport.js is authentication middleware for Express. It abstracts authentication strategies (local, Google, GitHub, etc.) into a unified API. serializeUser determines what data is stored in the session (typically just user ID). deserializeUser retrieves the full user from DB using the stored ID on subsequent requests.',
['serializeUser: passport.serializeUser((user, done) => done(null, user._id)) — stores only user._id in session (small).', 'deserializeUser: passport.deserializeUser(async (id, done) => { const user = await User.findById(id); done(null, user); }) — fetches full user from DB per request.', 'Passport is only used for Google OAuth in EduStack. Regular login uses JWT (stateless) — no session needed.']);

QA(17, 'What is the difference between authorization code grant and implicit grant in OAuth?',
'Authorization Code Grant (used by EduStack): Client gets an authorization code, exchanges it server-to-server for an access token. The access token is never exposed in the browser URL. Secure for web applications.',
['Implicit Grant (deprecated): The access token is returned directly in the URL fragment (e.g., #access_token=...). The token is exposed in browser history, logs, and referrer headers. Deprecated in OAuth 2.1.', 'PKCE (Proof Key for Code Exchange): Extension to Authorization Code Grant for mobile/SPA apps. Generates a code_verifier + code_challenge to prevent code interception. Passport.js supports PKCE.', 'EduStack uses Authorization Code Grant via Passport.js GoogleStrategy — the most secure OAuth grant type.']);

QA(18, 'What does helmet() do? List 5 specific security headers it sets.',
'Helmet is a collection of 15 middleware functions that set HTTP security headers. It protects against several well-known web vulnerabilities by controlling browser security features.',
['X-DNS-Prefetch-Control: off — Disables DNS prefetching, preventing some information leakage.', 'X-Frame-Options: SAMEORIGIN — Prevents clickjacking by refusing to display page in iframes from other origins.', 'X-Content-Type-Options: nosniff — Browser must respect Content-Type, preventing MIME-type sniffing attacks.', 'Referrer-Policy: no-referrer — Prevents referrer header from leaking URLs when navigating to external sites.', 'Strict-Transport-Security (HSTS): max-age=15552000; includeSubDomains — Forces HTTPS for 180 days.']);

QA(19, 'How does express-mongo-sanitize protect against NoSQL injection?',
'express-mongo-sanitize removes all keys from req.body and req.query that begin with "$" (MongoDB operators) or contain dots (.) which could be used to access nested paths. This prevents attackers from embedding MongoDB operators in user input.',
['Attack vector without protection: POST /login with { "email": { "$gt": "" } } matches ALL users (any non-empty email > "").', 'With mongoSanitize: The "$gt" key is stripped, resulting in { "email": "" } — a legitimate string query.', 'Registration order matters: app.use(mongoSanitize()) BEFORE routes ensures all request bodies are sanitized before reaching controllers.']);

QA(20, 'What is the fire-and-forget pattern? When does EduStack use it?',
'Fire-and-forget means initiating an async operation without awaiting its completion. The calling function returns immediately without waiting for the async operation to finish. If the operation fails, the failure is logged but does NOT affect the caller\'s response.',
['EduStack fires-and-forgets: mailService.sendWelcomeEmail(user.email).catch(err => console.warn(...)) — no "await". If email delivery fails, the user is still verified and logged in. Email failure is non-critical.', 'Contrast with: await otpService.saveAndSendOtp() during registration — this IS awaited because the OTP must be saved before responding.', 'Use fire-and-forget only for non-critical side effects. For business-critical operations (payment confirmation, order creation), always await and handle failures.']);

QA(21, 'What is JWT token expiry? What happens when a token expires in EduStack?',
'JWT tokens have an exp (expiration) claim that is a Unix timestamp. jwt.verify() checks the exp claim and throws TokenExpiredError if the current time is past the expiry. EduStack\'s JWT expires after 7 days (configurable via JWT_EXPIRES_IN env var).',
['When expired: isAuth catches TokenExpiredError and returns 401 "Session expired. Please log in again." The frontend should redirect to the login page.', 'No auto-refresh: EduStack does not implement refresh tokens. Users must log in again after 7 days. Refresh token implementation would use a long-lived refresh token to silently issue new short-lived access tokens.', 'JWTs cannot be invalidated before expiry (no token blacklist in EduStack). If a token is compromised, the attacker has access until expiry. Mitigation: Short expiry (15-60 minutes) + refresh tokens.']);

QA(22, 'What is the principle of least privilege? How does EduStack implement it?',
'Least privilege: Grant only the minimum permissions necessary for a task. Never give more access than required. An admin account compromised should not allow database root access; a user account should not allow admin operations.',
['EduStack roles: "user" — browse subjects, access resources, DSA sheet (if premium). "admin" — create/edit/delete subjects, resources, manage users. "contributor" — intermediate role.', 'requireRole("admin") middleware: Attached to admin-only routes. If req.user.role !== "admin", returns 403 Forbidden.', 'JWT payload: Only user ID stored — no role in token. Role is always freshly fetched from DB, preventing stale elevated permissions.']);

QA(23, 'How does multer work in EduStack for avatar uploads? What is memoryStorage?',
'Multer is a multipart/form-data middleware for Express. EduStack uses multer with memoryStorage, which stores the uploaded file in an in-memory Buffer (req.file.buffer) rather than writing to disk. The Buffer is then converted to a base64 data URI and uploaded directly to Cloudinary.',
['multer({ storage: multer.memoryStorage() }) — file never touches the filesystem, stored in RAM.', 'bufferToBase64Uri(file): Creates a "data:image/jpeg;base64,<base64String>" URI from the buffer. Cloudinary accepts this format.', 'Why not disk storage? Render.com has a read-only filesystem and ephemeral /tmp — files written to disk are lost on process restart. Memory storage + Cloudinary upload is the correct stateless approach.']);

QA(24, 'What is OWASP Top 10? Name 5 items and how EduStack addresses them.',
'OWASP (Open Web Application Security Project) Top 10 is a list of the most critical web application security risks.',
['A01 - Broken Access Control: EduStack uses isAuth + requireRole for all protected endpoints. Admin-only routes explicitly require admin role.', 'A02 - Cryptographic Failures: bcrypt for passwords (not MD5/SHA1), HTTPS for all production traffic (Render.com enforces HTTPS), HMAC-SHA256 for payment verification.', 'A03 - Injection: mongoSanitize prevents NoSQL injection, express-validator sanitizes inputs, Mongoose schema typing rejects operator objects.', 'A05 - Security Misconfiguration: helmet() sets secure headers. JWT_SECRET and other secrets are ONLY in environment variables, never hardcoded in source.', 'A07 - Identification and Authentication Failures: httpOnly cookie for JWT, bcrypt 12 rounds, OTP email verification, email normalization preventing case-mismatch duplicate accounts.']);

QA(25, 'What is the difference between a session and a JWT?',
'Session (Stateful): Server stores session data (userId, role, data). Client has a session ID cookie. Each request: server looks up session in storage (Redis, MongoDB, memory). Can be instantly invalidated (delete session from storage).',
['JWT (Stateless): All data encoded in the token itself. Server validates the signature — no storage lookup needed. Cannot be invalidated before expiry (unless using a blacklist).', 'EduStack hybrid: JWT for API requests (no DB lookup for auth, just signature verify + user fetch). MongoDB session for Google OAuth flow (Passport requires session to maintain OAuth state between redirects).', 'Performance: JWT saves a session lookup per request. Trade-off: Compromised JWT valid until expiry.']);

QA(26, 'What is express-rate-limit and why is it important for auth routes?',
'express-rate-limit limits the number of requests a single IP can make in a time window. Applied to auth routes, it prevents brute-force attacks (trying thousands of passwords), OTP enumeration (trying all 6-digit codes), and denial-of-service attacks.',
['Without rate limiting: An attacker can send 1 million login attempts from one IP.', 'With rate limiting: After N failures in T minutes, the IP is blocked for a period. EduStack applies rate limiting to /api/auth/login, /api/auth/register, /api/auth/resend-otp.', 'Rate limit by IP (trust proxy must be set correctly so rate limiter uses real IP, not load balancer IP).']);

QA(27, 'What is environment variable security? What happens if JWT_SECRET is exposed?',
'Environment variables store secrets (keys, passwords, API tokens) outside source code. They are set on the server (Render.com dashboard) and accessed via process.env. Secrets must NEVER be committed to Git.',
['JWT_SECRET exposure: Any party with JWT_SECRET can forge valid JWTs for any user, including admin accounts. Complete authentication bypass.', 'RAZORPAY_KEY_SECRET exposure: Attacker can generate valid payment signatures and fake payment verifications — bypassing payment checks.', 'GOOGLE_CLIENT_SECRET exposure: Attacker can make OAuth requests on behalf of EduStack.', '.gitignore: .env must always be in .gitignore. EduStack has a .env.example with placeholder values for documentation without exposing actual secrets.']);

QA(28, 'How does EduStack handle admin role assignment? Why is it never hardcoded?',
'Admin emails are stored ONLY in environment variables (ADMIN_EMAILS=admin@example.com,admin2@example.com). During registration and Google OAuth login, EduStack checks if the user\'s email is in this list and assigns the admin role accordingly.',
['Why not hardcode? Source code is committed to GitHub (public repo). Hardcoding admin emails exposes them to anyone who views the code. Credentials in code violate security best practices.', 'Why not user-controlled? If role was assignable via req.body.role = "admin", any user could self-promote. EduStack only assigns role from env list OR from explicit user-provided "student"/"contributor" roles (not "admin").', 'Role persistence: After initial assignment, the role is stored in MongoDB. Subsequent logins update the role if the email is (or is no longer) in the admin list.']);

QA(29, 'What is Nodemailer? How does EduStack use it for OTP emails?',
'Nodemailer is a Node.js module for sending emails. EduStack configures it with Gmail SMTP (or any SMTP provider). The mailService.js creates a transporter with SMTP credentials from environment variables and provides sendOtpEmail() and sendWelcomeEmail() functions.',
['SMTP credentials: EMAIL_USER and EMAIL_PASS (Gmail app password — NOT Gmail account password) are stored in .env, never in source code.', 'OTP email template: HTML email with the 6-digit OTP code, expiry notice, and EduStack branding. Sent via transporter.sendMail().', 'Gmail App Password: Google accounts with 2FA can generate 16-character app passwords for SMTP — more secure than using the main account password.']);

QA(30, 'What is Content Security Policy (CSP)? Why does EduStack disable it?',
'CSP is an HTTP header that tells browsers which sources are trusted for scripts, styles, images, and other resources. It prevents XSS by blocking scripts from unexpected origins.',
['EduStack sets helmet({ contentSecurityPolicy: false }) — CSP is disabled. Reason: EduStack loads CDN resources (Google Fonts, external CSS), and the frontend HTML pages load scripts from multiple origins. A strict CSP would break these resources without careful configuration.', 'Production improvement: Configure a custom CSP that allows specific known CDN domains rather than completely disabling. Use helmet\'s contentSecurityPolicy configuration object.', 'Without CSP, injected scripts from other origins can execute freely. The httpOnly cookie provides some protection, but CSP adds defense-in-depth.']);

QA(31, 'What is the difference between authentication tokens (JWT) and refresh tokens?',
'Access Token (JWT): Short-lived (15 min - 1 hour). Sent with every API request in Authorization header or cookie. If compromised, valid only for a short time.',
['Refresh Token: Long-lived (7-30 days). Stored securely (httpOnly cookie or secure storage). Used ONLY to request new access tokens when the current one expires. NOT sent with every API request.', 'Flow: Access token expires -> Client sends refresh token to /api/auth/refresh -> Server validates refresh token -> Issues new access token.', 'EduStack does NOT implement refresh tokens (single JWT, 7 days). Production enhancement: Use short access tokens (15min) + httpOnly refresh tokens (7 days) for better security.']);

QA(32, 'How does password reset work in EduStack? Walk through the flow.',
'POST /api/auth/forgot-password -> Server finds user by email (same success message if not found — prevents enumeration) -> Generates OTP via otpService.saveAndSendOtp() -> Sends OTP to email.',
['POST /api/auth/verify-forgot-password -> Checks OTP is valid (not expired, code matches) -> Returns { verified: true } without resetting password yet.', 'POST /api/auth/reset-password -> Verifies OTP again (or uses verified session) -> bcrypt.hash(newPassword, 12) -> user.password = hashedPassword -> user.save().', 'Security: OTP must be verified before allowing password change. Without OTP verification, anyone who knows an email could trigger a password reset.']);

QA(33, 'What is the Cloudinary integration in EduStack? How is it secure?',
'EduStack uses Cloudinary for image storage (user avatars, subject thumbnails). multer memoryStorage holds the file buffer. bufferToBase64Uri() converts Buffer to data:image/jpeg;base64,... string. cloudinary.uploader.upload() sends to Cloudinary CDN.',
['Security: Cloudinary credentials (CLOUD_NAME, API_KEY, API_SECRET) are in environment variables. Files are uploaded from the server — the client never gets Cloudinary credentials.', 'The secure_url from Cloudinary uses HTTPS. Images are served via Cloudinary\'s global CDN with automatic format optimization.', 'Error handling: If Cloudinary upload fails (e.g., timeout), EduStack falls back to storing the base64 data URI directly in the DB — functional but not production-ideal (large DB documents).']);

QA(34, 'What is cross-origin resource sharing (CORS)? When does a browser send a preflight request?',
'CORS is a browser mechanism that restricts cross-origin HTTP requests. A browser sends a preflight OPTIONS request before the actual request when: (1) Method is not GET/POST/HEAD, (2) Content-Type is not application/x-www-form-urlencoded, multipart/form-data, or text/plain, (3) Custom headers are included (like Authorization).',
['Preflight: OPTIONS /api/auth/login with Access-Control-Request-Method: POST and Access-Control-Request-Headers: Content-Type, Authorization.', 'EduStack\'s cors() responds to preflight with Access-Control-Allow-Origin, Access-Control-Allow-Methods, Access-Control-Allow-Headers, and Access-Control-Allow-Credentials: true.', 'credentials: true in cors() is required for the browser to include cookies in cross-origin requests. Must be paired with explicit origin (not *).']);

QA(35, 'What is the difference between isPremium flag and role in EduStack\'s User model?',
'role defines the user\'s PERMISSION LEVEL (admin vs regular user vs contributor). It determines what actions they can take (create subjects, delete resources, etc.). isPremium defines their SUBSCRIPTION STATUS — whether they have paid for premium DSA sheet access.',
['An admin can be non-premium (staff account that manages content but hasn\'t purchased premium).', 'A regular user can be premium (paid subscriber with no admin permissions).', 'Checking: requireRole("admin") checks req.user.role. Premium gate checks req.user.isPremium. Both are fetched fresh from DB on every request via isAuth.']);

QA(36, 'How does EduStack prevent duplicate user registrations with different email cases?',
'The User schema normalizes emails: lowercase: true in the schema, plus email.toLowerCase().trim() in the controller before any query. This ensures "User@Test.com" and "user@test.com" are treated as the same email and matched by the unique index.',
['Mongoose schema: email: { type: String, unique: true, lowercase: true, trim: true }. The lowercase: true transform runs before saving.', 'Controller normalization: const normalizedEmail = email.toLowerCase().trim() before User.findOne() and User.create().', 'Without normalization: "USER@GMAIL.COM" would create a new account even though "user@gmail.com" already exists — the MongoDB index is case-sensitive by default.']);

QA(37, 'What is input validation? How does EduStack use express-validator?',
'Input validation ensures request data meets expected format, type, and constraints BEFORE processing. express-validator provides a declarative validation chain using check() and body() validators that can validate, sanitize, and return structured error messages.',
['Example: body("email").isEmail().normalizeEmail() — validates email format and normalizes it.', 'body("password").isLength({ min: 6 }) — minimum length check.', 'validationResult(req) collects all validation errors. If any exist, return 400 with error details before reaching controller logic.', 'EduStack has validators/ directory with separate validation files per route for clean separation of concerns.']);

QA(38, 'What is a salt round in bcrypt? What cost factor should you use?',
'A "round" in bcrypt means 2^N iterations of the key expansion algorithm. Cost factor 10 = 1024 iterations, Cost factor 12 = 4096 iterations, Cost factor 14 = 16384 iterations.',
['Cost factor selection: Target 100-300ms hash time on your production hardware. Too fast (< 10 rounds) = easy to brute-force. Too slow (> 14 rounds) = login takes > 1 second = poor UX.', 'EduStack uses 12 rounds (~300ms on typical cloud VM). The OWASP recommendation is minimum cost 10, recommended 12+.', 'Cost should be increased periodically as hardware improves to maintain the same effective security level.']);

QA(39, 'Explain the Google OAuth callback URL configuration in EduStack. Why is it dynamic?',
'The OAuth callback URL must match exactly what is registered in Google Cloud Console. EduStack needs different URLs for local development (http://localhost:3000/auth/google/callback) and Render.com production (https://myapp.onrender.com/auth/google/callback).',
['getGoogleCallbackURL() function: Checks GOOGLE_CALLBACK_URL env var first. If it contains localhost, falls back to RENDER_EXTERNAL_URL for production. Otherwise uses the env var directly.', 'Why /auth/google/callback (not /api/auth/google/callback): Google Cloud Console has the callback registered at the root path. EduStack has a root-level route for this. All other auth endpoints are under /api/auth/.', 'Security: Google validates the callback URL exactly — an attacker cannot redirect the OAuth callback to their server because the URL must match what was pre-registered.']);

QA(40, 'What security practices does EduStack use for the payment flow?',
'Razorpay payment security in EduStack: (1) KEY_ID (public) sent to frontend for checkout UI — safe to expose. (2) KEY_SECRET (private) NEVER sent to frontend — only used server-side for HMAC computation. (3) Orders created server-side with exact amount — frontend cannot manipulate price. (4) HMAC-SHA256 signature verification using crypto.timingSafeEqual() — prevents tampered payment confirmations.',
['Server-side amount: PREMIUM_PRICE_PAISE = 500 is hardcoded server-side. The frontend cannot pass a different amount — the order is always created for Rs.5. A malicious frontend changing the amount displayed in the UI cannot affect the actual charge.', 'Idempotent verification: Verifying the same payment twice is safe — the second call finds the existing payment record already marked "paid" and simply updates premium status again (idempotent).', 'Payment simulation for testing: /api/payments/simulate bypasses Razorpay for test environments — grants premium without real payment. Must be disabled in production.']);

// ── FOOTER ──────────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text('EduStack Masterclass  |  VOLUME 2: Auth & Security  |  Page ' + (fp + 1) + ' of ' + range.count + '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 });
  }
}

doc.end();
stream.on('finish', function() {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n========================================');
  console.log('  VOLUME 2 PDF Generated Successfully!');
  console.log('========================================');
  console.log('  File  :', OUT);
  console.log('  Pages :', range.count);
  console.log('  Size  :', kb, 'KB');
  console.log('========================================\n');
});
