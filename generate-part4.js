'use strict';
// ================================================================
// EduStack Interview Masterclass — VOLUME 4 (Deep Rewrite)
// System Design, OS Concepts, DSA Patterns & FAANG Scenarios
// Target: FAANG, MAANG, Tier-1 product-based company interviews
// Run: node generate-part4.js
// Output: EduStack_Vol4_SystemDesign.pdf
// ================================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'EduStack_Vol4_SystemDesign.pdf');
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
    const txt = cleanText(item), ci = txt.indexOf(':');
    if (ci > 0 && ci < 55) {
      doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.dark).text(txt.slice(0, ci), ML + 16, y0, { continued: true, lineGap: 2.5 });
      doc.font('Helvetica').fillColor(col).text(txt.slice(ci), { lineGap: 2.5 });
    } else { doc.fontSize(8.8).font('Helvetica').fillColor(col).text(txt, ML + 16, y0, { lineGap: 2.5 }); }
    gap(0.15);
  }); gap(0.2);
}

function CODE(text, lang) {
  const arr = cleanText(text).split('\n'), lh = 10.5, pad = 6, MAX = 36;
  for (let s = 0; s < arr.length; s += MAX) {
    const chunk = arr.slice(s, s + MAX), ch = chunk.length * lh + pad * 2 + 12;
    ensureSpace(ch + 8); const y0 = doc.y;
    doc.rect(ML, y0, TW, 12).fill('#161b22');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#58a6ff').text('  ' + (lang || 'Pseudocode / JavaScript'), ML + 4, y0 + 2, { lineBreak: false });
    doc.rect(ML, y0 + 12, TW, ch - 12).fill(C.codeBg);
    chunk.forEach(function(line, i) {
      let lc = C.codeText;
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) lc = '#8b949e';
      else if (/\b(const|let|function|class|require|import)\b/.test(line)) lc = '#ff7b72';
      else if (/\b(return|if|else|for|while|new)\b/.test(line)) lc = '#d2a8ff';
      else if (line.includes('"') || line.includes("'")) lc = '#a5d6ff';
      doc.fontSize(8).font('Courier').fillColor(lc).text(line, ML + 8, y0 + 12 + pad + (i * lh), { lineBreak: false, width: TW - 16 });
    });
    doc.y = y0 + ch; gap(0.35);
  }
}

function DIAGRAM_BOXES(title, steps) {
  ensureSpace(steps.length * 28 + 35); const y0 = doc.y;
  doc.rect(ML, y0, TW, 16).fill(C.accent);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white).text('  ARCHITECTURE: ' + cleanText(title), ML + 6, y0 + 4, { lineBreak: false });
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
function warnBox(text) { infoBox('WATCH OUT', text, C.amber, C.amberSoft); }

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
doc.fontSize(10).font('Helvetica').fillColor(C.accent).text('VOLUME 4 of 4 — System Design, OS Concepts, DSA Patterns & FAANG Scenarios', { align: 'center' });
doc.fontSize(16).font('Helvetica-Bold').fillColor(C.dark).text('System Design: From Zero to FAANG Interview Ready', { align: 'center' });
doc.fontSize(8.5).font('Helvetica').fillColor(C.light)
   .text('OS | Processes | Deadlock | Networks | CAP Theorem | Microservices | DSA Patterns | FAANG Scenarios | 40 Deep Q&As', { align: 'center' });
gap(1.2);
const bx = doc.y;
doc.rect(60, bx, 475, 185).fill(C.offWhite); doc.rect(60, bx, 6, 185).fill(C.brand);
const ci4 = [
  ['Project', 'EduStack — CS Student Resource Hub & AI Tutor Platform'],
  ['This Volume', 'OS, Networks, CAP, System Design, DSA Patterns, Microservices, 40 Q&As'],
  ['Volume 1', 'JS Engine, Node.js Event Loop, Express Pipeline, REST API Design'],
  ['Volume 2', 'Authentication, JWT, bcrypt, Google OAuth, XSS, CSRF, Payment Security'],
  ['Volume 3', 'MongoDB, Mongoose, Indexing, Aggregation, Caching, Cloudinary'],
  ['EduStack Arch', 'Node.js Monolith + Python FastAPI ML Microservice + Render.com PaaS'],
  ['FAANG Focus', 'URL Shortener, Rate Limiter, Notification, Chat, Feed, Search System Designs'],
  ['DSA Patterns', '15 patterns: Sliding Window, BFS/DFS, DP, Binary Search, Backtracking, etc.'],
];
ci4.forEach(function(r, i) {
  const iy = bx + 14 + (i * 22);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.brand).text(cleanText(r[0]) + ':', 74, iy, { width: 90, lineBreak: false });
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(r[1]), 168, iy, { width: 352, lineBreak: false });
});
doc.y = bx + 195; gap(1.2);
doc.fontSize(7.5).font('Helvetica').fillColor(C.light).text('Volume 4 of 4 — Final Volume | Read all 4 volumes to crack any backend/system design interview at product-based companies', { align: 'center' });
doc.rect(0, 830, 595, 12).fill(C.brand);

// TOC
newPage();
doc.rect(0, 0, 595, 12).fill(C.brand); gap(0.8);
doc.fontSize(17).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents — Volume 4: System Design');
hr(C.brand);
const toc = [
  ['1', 'OS Concepts', 'Processes vs Threads, Context Switching, Deadlock (4 conditions), Virtual Memory, Paging'],
  ['2', 'Computer Networks', 'OSI layers, TCP vs UDP, HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS handshake, DNS'],
  ['3', 'CAP Theorem & Consistency Models', 'Consistency, Availability, Partition Tolerance — trade-offs at scale'],
  ['4', 'Scalability Patterns', 'Horizontal vs vertical scaling, sharding, consistent hashing, connection pooling'],
  ['5', 'EduStack System Architecture Deep Dive', 'Complete architecture, Render.com, trust proxy, graceful shutdown'],
  ['6', 'Microservices Architecture', 'Service discovery, API gateway, circuit breaker, Saga pattern, EduStack ML proxy'],
  ['7', 'DSA for FAANG Interviews', 'Time/Space complexity, 15 patterns, Big-O analysis'],
  ['8', 'FAANG System Design Scenarios', 'URL Shortener, Rate Limiter, Chat System, Notification Service, Search'],
  ['9', 'Interview Playbook', '2-minute pitch, STAR format, questions to ask, EduStack talking points'],
  ['10', '40 Deep Interview Q&As — System Design', 'OS, Networks, CAP, Scalability, Microservices, DSA — FAANG level'],
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
// SECTION 1 — OS CONCEPTS
// ================================================================
sectionBanner('1', 'Operating System Concepts',
  'Processes vs Threads, Context Switching, Deadlock, Virtual Memory — from first principles', C.brand);

h1('1.1  Processes vs Threads', C.brand);
TABLE(
  ['Property', 'Process', 'Thread'],
  [
    ['Definition', 'Independent program in execution. Has own memory space (code, data, heap, stack).', 'Lightweight unit of execution within a process. Shares the process\'s memory space.'],
    ['Memory', 'Isolated — processes do NOT share memory by default (need IPC: pipes, sockets, shared memory)', 'Shared — all threads in a process share heap, code, data. Each has its own stack.'],
    ['Creation Cost', 'Expensive — OS must allocate separate memory space, file descriptors, resources', 'Cheap — new stack is allocated, shares everything else with parent process'],
    ['Communication', 'IPC: Unix sockets, pipes, message queues, shared memory (complex)', 'Shared memory access directly (but needs synchronization: mutex, semaphore)'],
    ['Crash Impact', 'Process crash does not affect other processes', 'One thread crashing can crash ALL threads in the process (shared memory)'],
    ['Node.js', 'EduStack runs as one Node.js process. cluster module spawns multiple processes.', 'Worker Threads (node:worker_threads) create threads within the same process.'],
  ],
  [95, 200, 200]
);

h1('1.2  Context Switching', C.brand);
P('Context switching is the OS operation of saving the current process/thread state (Program Counter, registers, stack pointer, memory mappings) and loading the saved state of another process/thread. It enables multiple processes to share a single CPU by time-slicing.');
bullets([
  'What is saved: CPU registers (general purpose, floating point), Program Counter (next instruction address), Stack Pointer, Heap pointer, Process Control Block data.',
  'Cost: Context switching has overhead (~microseconds for threads, ~milliseconds for processes). Too many context switches reduce throughput — the CPU spends time switching rather than executing.',
  'Node.js avoids OS thread context switching: The event loop is cooperative multitasking within one thread. "Switching" between async operations is done by the JS engine at function call boundaries — much cheaper than OS context switches.',
  'Why processes are expensive: Process context switch requires switching memory address spaces (TLB flush on most architectures) — very expensive compared to thread context switch (same address space).',
]);

h1('1.3  Deadlock — The 4 Coffman Conditions', C.brand);
P('A deadlock occurs when two or more processes are each waiting for a resource held by the other, and neither can proceed. For a deadlock to occur, ALL 4 Coffman conditions must be simultaneously true. Preventing ANY one of them prevents deadlock.');

TABLE(
  ['Condition', 'Description', 'Prevention Strategy'],
  [
    ['Mutual Exclusion', 'A resource can only be held by ONE process at a time (exclusive access)', 'Use sharable resources where possible (read-only files)'],
    ['Hold and Wait', 'A process holds at least one resource and is waiting for more resources held by others', 'Require processes to request ALL needed resources upfront, or release all before requesting more'],
    ['No Preemption', 'Resources cannot be forcibly taken from a process — only released voluntarily', 'Allow OS to forcibly preempt (take back) resources when needed'],
    ['Circular Wait', 'A circular chain of processes each waiting for a resource held by the next (P1 waits for R1 held by P2, P2 waits for R2 held by P1)', 'Impose total ordering on resource types — always acquire resources in the same fixed order'],
  ],
  [100, 195, 200]
);

CODE(
'// Deadlock example in Node.js context (hypothetical):\n' +
'// Process A acquires Mutex1, then tries to acquire Mutex2\n' +
'// Process B acquires Mutex2, then tries to acquire Mutex1\n' +
'\n' +
'// Process A:\n' +
'mutex1.lock();\n' +
'// ... do some work ...\n' +
'mutex2.lock(); // DEADLOCK: B has mutex2 and won\'t release\n' +
'\n' +
'// Process B:\n' +
'mutex2.lock();\n' +
'// ... do some work ...\n' +
'mutex1.lock(); // DEADLOCK: A has mutex1 and won\'t release\n' +
'\n' +
'// Prevention: Always acquire in the same order\n' +
'// Both processes: mutex1.lock() first, then mutex2.lock()\n' +
'// This breaks the Circular Wait condition.\n' +
'\n' +
'// In Node.js (single-threaded): True deadlocks are rare in JS code\n' +
'// because there is only one execution thread.\n' +
'// Async deadlocks can occur: Promise A awaits Promise B, Promise B awaits Promise A\n' +
'// -> Both hang forever. Solution: timeouts + cancellation tokens.'
);

h1('1.4  Virtual Memory, Paging & Segmentation', C.brand);
bullets([
  'Virtual Memory: An abstraction that gives each process the illusion of having the entire address space (e.g., 0x000000000 to 0xFFFFFFFF). Virtual addresses are mapped to physical RAM by the Memory Management Unit (MMU).',
  'Paging: Virtual address space is divided into fixed-size pages (typically 4KB). Physical memory is divided into page frames of the same size. The OS maintains a Page Table mapping virtual pages to physical frames.',
  'Page Fault: When a process accesses a virtual page not currently in RAM (it is on disk/swap), the CPU raises a page fault exception. The OS loads the page from disk into a free RAM frame and updates the page table.',
  'TLB (Translation Lookaside Buffer): Hardware cache for page table entries. Dramatically speeds up address translation (most accesses hit the TLB instead of the full page table walk).',
  'Relevance to Node.js: V8\'s heap grows as your application creates more objects. If the heap exceeds available RAM, the OS starts swapping pages to disk — causing severe performance degradation. Monitor memory usage in production.',
]);

// ================================================================
// SECTION 2 — COMPUTER NETWORKS
// ================================================================
sectionBanner('2', 'Computer Networks Deep Dive',
  'OSI layers, TCP vs UDP, HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS handshake', C.accent);

h1('2.1  OSI Model — 7 Layers', C.accent);
TABLE(
  ['Layer', 'Name', 'Responsibility', 'Protocol Examples'],
  [
    ['7', 'Application', 'End-user protocols, data formatting for apps', 'HTTP/HTTPS, FTP, SMTP, DNS, WebSocket'],
    ['6', 'Presentation', 'Data encryption, compression, format conversion', 'TLS/SSL, JPEG, MPEG, Base64'],
    ['5', 'Session', 'Managing sessions between applications', 'NetBIOS, RPC'],
    ['4', 'Transport', 'End-to-end communication, segmentation, flow control, error recovery', 'TCP (reliable), UDP (unreliable, fast)'],
    ['3', 'Network', 'Logical addressing (IP), routing between networks', 'IP (IPv4, IPv6), ICMP, OSPF, BGP'],
    ['2', 'Data Link', 'Framing, MAC addressing, error detection', 'Ethernet, WiFi (802.11), ARP'],
    ['1', 'Physical', 'Physical transmission of bits over medium', 'Copper cable, fiber optic, radio waves'],
  ],
  [35, 90, 210, 160]
);

noteBox('Remember: "All People Seem To Need Data Processing" (Application, Presentation, Session, Transport, Network, Data Link, Physical). In practice, TCP/IP uses a 4-layer model (Application, Transport, Internet, Network Access). HTTP operates at Layer 7, TCP at Layer 4, IP at Layer 3.');

h1('2.2  TCP vs UDP', C.accent);
TABLE(
  ['Property', 'TCP (Transmission Control Protocol)', 'UDP (User Datagram Protocol)'],
  [
    ['Connection', 'Connection-oriented — 3-way handshake (SYN, SYN-ACK, ACK) before data', 'Connectionless — send data immediately, no handshake'],
    ['Reliability', 'Guaranteed delivery — acknowledgments, retransmission of lost packets', 'Best-effort delivery — packets may be lost, duplicated, or reordered'],
    ['Order', 'Guaranteed ordering — sequence numbers ensure correct order', 'No ordering guarantee'],
    ['Speed', 'Slower due to overhead (ACKs, flow control, congestion control)', 'Much faster — no overhead'],
    ['Use cases', 'HTTP/HTTPS, email, file transfer, SSH — where correctness matters', 'DNS, video streaming, gaming, VoIP — where speed > correctness'],
    ['EduStack', 'All HTTP requests use TCP. MongoDB Atlas connections use TCP.', 'UDP not used directly in EduStack'],
  ],
  [80, 207, 208]
);

h1('2.3  HTTP/1.1 vs HTTP/2 vs HTTP/3', C.accent);
TABLE(
  ['Feature', 'HTTP/1.1', 'HTTP/2', 'HTTP/3'],
  [
    ['Multiplexing', 'One request per connection. 6 parallel connections per domain workaround.', 'Multiple requests on ONE TCP connection (multiplexing, no head-of-line blocking per stream)', 'Multiple requests on ONE QUIC connection (UDP-based, no TCP head-of-line blocking)'],
    ['Headers', 'Plain text headers repeated in every request', 'HPACK compression — headers compressed, duplicates eliminated', 'QPACK compression (similar to HPACK but for QUIC)'],
    ['Transport', 'TCP', 'TCP', 'QUIC (UDP-based) — eliminates TCP head-of-line blocking'],
    ['Server Push', 'Not supported', 'Server can proactively push resources client will need', 'Supported but less common'],
    ['TLS', 'Optional (HTTP vs HTTPS)', 'Requires TLS 1.2+ in practice', 'TLS 1.3 integrated — always encrypted'],
    ['EduStack', 'Express supports HTTP/1.1 by default', 'Render.com may serve HTTP/2 at the load balancer level', 'HTTP/3 at CDN/proxy level'],
  ],
  [80, 135, 140, 140]
);

h1('2.4  TLS Handshake — How HTTPS Works', C.accent);
DIAGRAM_BOXES('TLS 1.3 Handshake (Simplified)', [
  { label: 'Step 1 (Client Hello): Client sends supported TLS versions, cipher suites, random nonce, and key_share (Diffie-Hellman public key for TLS 1.3)' },
  { label: 'Step 2 (Server Hello): Server selects TLS version + cipher suite, sends its DH public key, and server certificate (with public key)' },
  { label: 'Step 3 (Key Exchange): Both sides compute the same shared secret using their private key + other\'s public key (ECDH key exchange — never transmitted)' },
  { label: 'Step 4 (Client Certificate Verify): Optional. Server verifies client certificate if mutual TLS is required.' },
  { label: 'Step 5 (Finished): Both sides send a "Finished" message encrypted with the derived session keys. Handshake complete — TLS 1.3 = 1 RTT (vs TLS 1.2\'s 2 RTTs)' },
  { label: 'Step 6 (Application Data): All subsequent data is encrypted using symmetric AES-256 with the negotiated shared keys' },
]);

// ================================================================
// SECTION 3 — CAP THEOREM
// ================================================================
sectionBanner('3', 'CAP Theorem & Consistency Models',
  'Consistency, Availability, Partition Tolerance — every distributed system makes trade-offs', C.purple);

h1('3.1  CAP Theorem — The Fundamental Trade-off', C.purple);
P('CAP Theorem (Brewer\'s Theorem): In a distributed system, you can only guarantee 2 of these 3 properties simultaneously: Consistency, Availability, and Partition Tolerance. Since network partitions (temporary communication failures between nodes) are unavoidable in distributed systems, the real choice is between Consistency and Availability during a partition.');

TABLE(
  ['Property', 'Definition', 'Example', 'EduStack'],
  [
    ['Consistency (C)', 'Every read receives the most recent write or an error. All nodes see the same data at the same time.', 'After writing user.isPremium=true, every subsequent read from ANY node returns true.', 'MongoDB with w:"majority" ensures this across replica set members.'],
    ['Availability (A)', 'Every request receives a response (not necessarily the most recent data). System never returns an error due to network issues.', 'Server always responds, even if some nodes are down — but may serve stale data.', 'MongoDB Atlas replicated across 3 nodes — high availability even if one node fails.'],
    ['Partition Tolerance (P)', 'System continues operating even when some nodes cannot communicate with others (network partition).', 'Node A and Node B cannot communicate, but both still serve requests.', 'MongoDB Atlas handles network partitions via replica set election.'],
  ],
  [90, 155, 130, 120]
);

TABLE(
  ['Trade-off', 'Databases That Choose This', 'Consequence'],
  [
    ['CP (Consistency + Partition Tolerance)', 'MongoDB, HBase, Zookeeper', 'During partition, some nodes go offline rather than return stale data. Sacrifices availability.'],
    ['AP (Availability + Partition Tolerance)', 'Cassandra, DynamoDB, CouchDB', 'Always available, but during partition may return stale data. Eventual consistency.'],
    ['CA (Consistency + Availability)', 'Traditional SQL databases (single node)', 'Only possible without partition tolerance — works for single-node setups, not distributed systems.'],
  ],
  [150, 165, 180]
);

tipBox('Interview Q: "Is MongoDB CP or AP?" MongoDB is primarily CP — it prioritizes consistency over availability during a partition. When a primary fails, MongoDB holds an election (during which writes are rejected — sacrificing availability) to ensure only one primary exists (ensuring consistency). However, with w:1 write concern, MongoDB trades some consistency for availability.');

// ================================================================
// SECTION 4 — SCALABILITY PATTERNS
// ================================================================
sectionBanner('4', 'Scalability Patterns',
  'Horizontal vs vertical scaling, sharding, consistent hashing, load balancing', C.teal);

h1('4.1  Vertical vs Horizontal Scaling', C.teal);
TABLE(
  ['Property', 'Vertical Scaling (Scale Up)', 'Horizontal Scaling (Scale Out)'],
  [
    ['Method', 'Upgrade to a bigger machine (more CPU, RAM, faster disk)', 'Add more machines, distribute load across them'],
    ['Limit', 'Physical hardware limits — there is always a maximum machine size', 'Theoretically unlimited — keep adding machines'],
    ['Cost', 'Exponentially increasing cost per unit of performance', 'Linear cost increase with each added machine'],
    ['Simplicity', 'Simple — no code changes, same as single-server architecture', 'Complex — need load balancer, shared state (session, cache), distributed consistency'],
    ['Downtime', 'Requires downtime to upgrade hardware', 'No downtime — add machines to the pool live'],
    ['EduStack now', 'Single Render.com instance — vertical scaling only', 'Would need: load balancer, Redis for shared sessions, MongoDB Atlas (already horizontally scaled)'],
  ],
  [80, 205, 210]
);

h1('4.2  Database Sharding', C.teal);
P('Sharding is horizontal partitioning of a database across multiple servers. Instead of one MongoDB server holding all documents, you split the collection across multiple "shards." Each shard holds a subset of the data. MongoDB Atlas supports automatic sharding for massive collections.');

bullets([
  'Range-based sharding: Documents with userId 1-1M go to Shard A, 1M-2M to Shard B. Simple but can create hot spots if certain ranges get more traffic.',
  'Hash-based sharding: Apply a hash function to the shard key. Documents distributed based on hash value. Even distribution but range queries hit all shards.',
  'Shard key choice: Critical. High cardinality (many unique values), evenly distributed, aligns with common query patterns. Bad shard key = hot spots = poor performance.',
  'EduStack at scale: If the DSA problems collection grows to millions of problems, sharding by category or difficulty could distribute load. Currently not needed — Atlas free tier handles EduStack\'s scale.',
]);

h1('4.3  Consistent Hashing', C.teal);
P('Consistent hashing is an algorithm used in distributed systems (load balancers, distributed caches) to minimize data redistribution when nodes are added or removed. In regular hashing (key % N), changing N from 10 to 11 servers remaps ~91% of all keys. Consistent hashing typically remaps only ~1/N keys when a node is added or removed.');

CODE(
'// Consistent Hashing concept\n' +
'// Imagine a hash ring from 0 to 2^32 (a circle).\n' +
'// Each server is hashed to a position on the ring.\n' +
'// Each key (request) is hashed to a position on the ring.\n' +
'// The request is routed to the FIRST server clockwise from its position.\n' +
'\n' +
'// Ring: 0 -------- Server A (pos 100) ---- Server B (pos 200) ---- Server C (pos 300) ---> 360/0\n' +
'\n' +
'// Request key hash = 150 -> Routes to Server B (first server clockwise from 150)\n' +
'// Request key hash = 250 -> Routes to Server C\n' +
'// Request key hash = 350 -> Routes to Server A (wraps around ring)\n' +
'\n' +
'// When Server D is added at position 175:\n' +
'// Only requests between 150 and 175 are redistributed from B to D.\n' +
'// All other requests remain on the same servers.\n' +
'\n' +
'// Used in: AWS DynamoDB, Apache Cassandra, Memcached, Nginx upstream,\n' +
'// Redis Cluster, and CDN edge server selection.'
);

// ================================================================
// SECTION 5 — EDUSTACK ARCHITECTURE DEEP DIVE
// ================================================================
sectionBanner('5', 'EduStack Complete Architecture Deep Dive',
  'Every component explained: Node.js + Python ML + Render.com + MongoDB Atlas', C.brand);

h1('5.1  Complete System Architecture', C.brand);
DIAGRAM_BOXES('EduStack Full Production Architecture', [
  { label: 'LAYER 1 — Client: Browser loads HTML/CSS/JS from Render.com static serving. Makes API calls to same origin (/api/...).' },
  { label: 'LAYER 2 — Render.com Load Balancer + TLS: Terminates HTTPS, forwards HTTP to Node.js. Sets X-Forwarded-For header. trust proxy:1 in Express handles this.' },
  { label: 'LAYER 3 — Node.js Express Server (port 3000): 10-middleware pipeline -> JWT auth -> route handlers. Serves static HTML from /client/public.' },
  { label: 'LAYER 4 — MongoDB Atlas (cloud): 3-node replica set. Stores Users, Subjects, Resources, Payments, OTPs, Sessions. Mongoose ODM.' },
  { label: 'LAYER 5 — Python FastAPI ML Microservice (port 8000): Google Gemini + LightRAG. Node.js proxies AI requests. Never exposed directly to browser.' },
  { label: 'LAYER 6 — External Services: Cloudinary CDN (avatar/thumbnail hosting), Google OAuth (authentication), Razorpay (payments), Gmail SMTP (OTP emails), Google Sheets (DSA problems CSV).' },
]);

h1('5.2  Why This Architecture? Trade-offs Made', C.brand);
bullets([
  'Monolith for core business logic: Express handles all CRUD, auth, payments, notifications in one codebase. Benefits: Single deployment, no inter-service latency for core operations, simpler debugging, single MongoDB connection pool.',
  'Microservice only for ML: Python\'s AI ecosystem (Gemini SDK, pypdf, numpy, LightRAG) is incompatible with Node.js. Isolating it as a FastAPI service lets it scale independently and use Python natively without complex FFI.',
  'HTTP proxy pattern for security: Node.js acts as an authenticated gateway. Browser -> Node.js (with auth check) -> FastAPI. FastAPI has no auth of its own — it trusts only requests from the Node.js server. This is intentional — simplifies the ML service.',
  'Render.com for deployment: Free tier supports Node.js and Python services. Auto-deploys from GitHub. Provides HTTPS, custom domains, environment variables, and persistent disk (for uploaded files if needed).',
  'MongoDB Atlas over self-hosted: Auto-backups, replica sets, performance monitoring, and zero maintenance. Connection string in .env — easy to swap to self-hosted if needed.',
]);

// ================================================================
// SECTION 6 — MICROSERVICES
// ================================================================
sectionBanner('6', 'Microservices Architecture',
  'Service discovery, API gateway, circuit breaker, Saga pattern, EduStack ML proxy', C.accent);

h1('6.1  Microservices vs Monolith — When to Choose', C.accent);
TABLE(
  ['Factor', 'Monolith', 'Microservices'],
  [
    ['Team size', 'Small team (1-10 engineers) — less coordination overhead', 'Large teams (10+ engineers) — independent team ownership per service'],
    ['Deployment', 'Single deploy unit — simple CI/CD pipeline', 'Independent deployments — each service deploys independently'],
    ['Scaling', 'Scale the entire application (even if only one feature is hot)', 'Scale specific services independently (scale the payment service 10x, not auth)'],
    ['Latency', 'In-process function calls — nanoseconds', 'Network calls between services — milliseconds + potential failures'],
    ['Data consistency', 'Single database — ACID transactions easy', 'Each service has its own DB — distributed transactions complex (Saga pattern needed)'],
    ['EduStack choice', 'Monolith for Node.js (correct for current scale and team)', 'Microservice ONLY for Python ML (incompatible language/libraries)'],
  ],
  [80, 205, 210]
);

h1('6.2  Circuit Breaker Pattern', C.accent);
P('The Circuit Breaker pattern prevents cascading failures in distributed systems. When a service (e.g., the Python ML microservice) starts failing repeatedly, the circuit breaker "trips" and returns an immediate error without calling the failing service — giving it time to recover.');

CODE(
'// Circuit Breaker concept (simplified)\n' +
'class CircuitBreaker {\n' +
'  constructor(fn, failureThreshold = 5, resetTimeoutMs = 60000) {\n' +
'    this.fn = fn;\n' +
'    this.state = "CLOSED";    // CLOSED (normal), OPEN (blocking), HALF_OPEN (testing)\n' +
'    this.failureCount = 0;\n' +
'    this.failureThreshold = failureThreshold;\n' +
'    this.resetTimeout = resetTimeoutMs;\n' +
'    this.lastFailureTime = null;\n' +
'  }\n' +
'\n' +
'  async call(...args) {\n' +
'    if (this.state === "OPEN") {\n' +
'      if (Date.now() - this.lastFailureTime > this.resetTimeout) {\n' +
'        this.state = "HALF_OPEN"; // Allow ONE test request\n' +
'      } else {\n' +
'        throw new Error("Circuit open — ML service unavailable. Try again later.");\n' +
'      }\n' +
'    }\n' +
'    try {\n' +
'      const result = await this.fn(...args);\n' +
'      this.failureCount = 0;  // Reset on success\n' +
'      this.state = "CLOSED";\n' +
'      return result;\n' +
'    } catch (err) {\n' +
'      this.failureCount++;\n' +
'      this.lastFailureTime = Date.now();\n' +
'      if (this.failureCount >= this.failureThreshold) {\n' +
'        this.state = "OPEN"; // Trip the breaker\n' +
'        console.error("Circuit OPEN — ML service failing repeatedly.");\n' +
'      }\n' +
'      throw err;\n' +
'    }\n' +
'  }\n' +
'}'
);

tipBox('Circuit Breaker vs Retry: Retries are appropriate for transient failures (network blip). Circuit Breaker is for persistent failures (service is down). Combining both: retry 3 times with exponential backoff, then circuit breaker trips after 5 failures in 1 minute. Libraries: opossum (Node.js circuit breaker library).');

h1('6.3  API Gateway Pattern', C.accent);
bullets([
  'An API Gateway is a single entry point for all client requests to a microservice architecture. It handles: authentication, rate limiting, routing to services, request/response transformation, SSL termination, and load balancing.',
  'EduStack\'s Node.js server acts as a mini API gateway: It authenticates requests (isAuth), then routes to either the Express controllers (MongoDB) OR proxies to the Python FastAPI ML service.',
  'Industry-grade gateways: AWS API Gateway, Kong, Nginx, Traefik. These handle thousands of services and millions of requests per second.',
  'Gateway anti-pattern: Do not put business logic in the gateway. It should only route, auth, and transform — not compute results. EduStack\'s Node.js is a gateway only for AI requests, not for all business logic (which stays in the monolith).',
]);

// ================================================================
// SECTION 7 — DSA PATTERNS
// ================================================================
sectionBanner('7', 'DSA for FAANG Interviews — 15 Patterns',
  'Time/Space complexity, top 15 coding patterns for product-based interviews', C.green);

h1('7.1  Big-O Complexity Quick Reference', C.green);
TABLE(
  ['Complexity', 'Name', 'Example', 'N=1000 operations approx'],
  [
    ['O(1)', 'Constant', 'Array access by index, HashMap lookup', '1 operation'],
    ['O(log n)', 'Logarithmic', 'Binary search, B-Tree index lookup', '10 operations'],
    ['O(n)', 'Linear', 'Array scan, Linked list traversal', '1,000 operations'],
    ['O(n log n)', 'Linearithmic', 'Merge sort, Heap sort, efficient sorting', '10,000 operations'],
    ['O(n^2)', 'Quadratic', 'Bubble sort, nested loops over array', '1,000,000 operations'],
    ['O(2^n)', 'Exponential', 'All subsets, recursive Fibonacci (naive)', '2^1000 (astronomical)'],
    ['O(n!)', 'Factorial', 'All permutations, Traveling Salesman (brute)', 'Impossible for n>12'],
  ],
  [80, 110, 165, 140]
);

h1('7.2  The 15 Essential FAANG DSA Patterns', C.green);

bullets([
  'Pattern 1 - Sliding Window: Fixed or variable-size window over array/string. Find max sum subarray of size k, longest substring without repeating chars. Time: O(n). Space: O(1) to O(k). Key: Expand right pointer, shrink left when constraint violated.',
  'Pattern 2 - Two Pointers: Two pointers on sorted array or palindrome checking. Pair Sum, Remove Duplicates, Container With Most Water. Time: O(n). Space: O(1). Key: Move pointers based on comparison with target.',
  'Pattern 3 - Fast & Slow Pointers (Floyd\'s): Detect cycle in linked list/array. Find middle of linked list. Floyd\'s Cycle Detection. Time: O(n). Space: O(1). Key: Fast moves 2 steps, slow moves 1 — they meet if cycle exists.',
  'Pattern 4 - BFS (Breadth-First Search): Level-order traversal, shortest path in unweighted graph, connected components. Uses Queue. Time: O(V+E). Space: O(V). Key: Process all nodes at depth d before depth d+1.',
  'Pattern 5 - DFS (Depth-First Search): Path finding, cycle detection, topological sort, strongly connected components. Uses Stack/Recursion. Time: O(V+E). Space: O(V). Key: Go deep before exploring siblings.',
  'Pattern 6 - Binary Search: Search in sorted array, find first/last position, search in rotated array, minimize/maximize answers (binary search on answer). Time: O(log n). Key: Maintain search space invariant.',
  'Pattern 7 - Dynamic Programming (Tabulation): Optimal substructure + overlapping subproblems. LCS, Knapsack, Coin Change, Longest Increasing Subsequence. Time: O(n*m) typically. Key: Define state, recurrence relation, base case.',
  'Pattern 8 - Backtracking: Generate all solutions (permutations, subsets, combinations), constraint satisfaction. N-Queens, Sudoku Solver. Time: O(N!) typically. Key: Choose -> Explore -> Unchoose.',
  'Pattern 9 - Heap (Priority Queue): Top-K elements, K-th largest/smallest, Merge K sorted lists, Median in data stream. Time: O(n log k). Space: O(k). Key: Min-heap for top-K largest, max-heap for top-K smallest.',
  'Pattern 10 - Trie (Prefix Tree): Word search, autocomplete, word break. Time: O(L) per operation where L is word length. Space: O(N*L). Key: Each node represents a character, isEnd marks word completion.',
  'Pattern 11 - Union-Find (Disjoint Set Union): Number of connected components, cycle detection in undirected graph, Kruskal\'s MST. Time: O(a(n)) nearly O(1) with path compression. Key: Find root, union by rank.',
  'Pattern 12 - Monotonic Stack: Next Greater Element, Largest Rectangle in Histogram, Trapping Rain Water. Time: O(n). Space: O(n). Key: Maintain stack in monotonic order, pop when invariant violated.',
  'Pattern 13 - Graph (Topological Sort): Course Schedule, Task Ordering. Kahn\'s BFS algorithm or DFS with postorder. Time: O(V+E). Key: Only for DAGs (Directed Acyclic Graphs).',
  'Pattern 14 - Interval Merging: Merge Overlapping Intervals, Insert Interval. Sort by start time, compare end times. Time: O(n log n). Key: Sort intervals, then linear scan to merge overlapping.',
  'Pattern 15 - Bit Manipulation: Single Number (XOR), Number of 1 bits (Brian Kernighan), Power of 2. Time: O(1) to O(log n). Key: XOR cancels duplicates, n & (n-1) removes rightmost set bit.',
]);

CODE(
'// PATTERN 1: Sliding Window — Maximum sum subarray of size k\n' +
'function maxSumSubarray(arr, k) {\n' +
'  let windowSum = 0, maxSum = 0;\n' +
'  for (let i = 0; i < k; i++) windowSum += arr[i]; // First window\n' +
'  maxSum = windowSum;\n' +
'  for (let i = k; i < arr.length; i++) {\n' +
'    windowSum += arr[i] - arr[i - k]; // Slide: add new, remove old\n' +
'    maxSum = Math.max(maxSum, windowSum);\n' +
'  }\n' +
'  return maxSum;\n' +
'} // Time: O(n), Space: O(1)\n' +
'\n' +
'// PATTERN 6: Binary Search on answer — find minimum capacity\n' +
'function minCapacity(weights, days) {\n' +
'  let lo = Math.max(...weights), hi = weights.reduce((a, b) => a + b);\n' +
'  while (lo < hi) {\n' +
'    const mid = Math.floor((lo + hi) / 2);\n' +
'    if (canShip(weights, days, mid)) hi = mid; // Try smaller\n' +
'    else lo = mid + 1;                          // Need larger\n' +
'  }\n' +
'  return lo;\n' +
'} // Time: O(n log n), Space: O(1)\n' +
'\n' +
'// PATTERN 9: Top-K Frequent Elements using Min-Heap (JavaScript)\n' +
'function topKFrequent(nums, k) {\n' +
'  const freq = new Map();\n' +
'  for (const n of nums) freq.set(n, (freq.get(n) || 0) + 1);\n' +
'  // Use bucket sort for O(n): bucket[frequency] = [nums]\n' +
'  const buckets = Array.from({ length: nums.length + 1 }, () => []);\n' +
'  for (const [num, count] of freq) buckets[count].push(num);\n' +
'  const result = [];\n' +
'  for (let i = buckets.length - 1; i >= 0 && result.length < k; i--)\n' +
'    result.push(...buckets[i]);\n' +
'  return result.slice(0, k);\n' +
'} // Time: O(n), Space: O(n)'
);

// ================================================================
// SECTION 8 — FAANG SYSTEM DESIGN SCENARIOS
// ================================================================
sectionBanner('8', 'FAANG System Design Scenarios',
  'URL Shortener, Rate Limiter, Notification Service, Chat System, and more', C.purple);

h1('8.1  Design a URL Shortener (TinyURL / Bitly)', C.purple);
P('Requirements: Shorten long URLs, redirect short URLs to original, handle 100M URLs, 10B redirects/month (3300 redirects/second), low latency (<50ms for redirects).');

DIAGRAM_BOXES('URL Shortener Architecture', [
  { label: 'Client -> Load Balancer (Nginx/AWS ALB) -> URL Shortener Service (Node.js / multiple instances)' },
  { label: 'POST /shorten: Generate unique 6-char code (Base62: 0-9, a-z, A-Z = 62^6 = 56 billion possibilities). Store { code: "abc123", url: "https://...", createdAt, userId } in database.' },
  { label: 'GET /:code: Cache lookup in Redis (TTL 24h). Cache miss -> Database lookup. Cache hit returns in <5ms. Database lookup takes <20ms with index.' },
  { label: 'Redirect: Return HTTP 301 (permanent, browser caches) or 302 (temporary, analytics can track). 302 preferred for click tracking.' },
  { label: 'Database: SQL (PostgreSQL) for strong ACID. Index on "code" column. Write-once, read-many workload. Shard by code range if needed at massive scale.' },
]);

bullets([
  'Code generation: UUID is too long. Base62(counter) or Base62(md5(url)[:6]) for 6-char codes. Hash collisions: check DB before insert, regenerate if collision.',
  'Rate limiting: Limit URL creation per user (prevent abuse). express-rate-limit or Redis INCR with TTL.',
  'Analytics: Track clicks, referrer, user-agent, IP. Async write to a separate analytics DB or event queue (Kafka) — don\'t slow down redirects with analytics writes.',
  'Custom short codes: Allow users to specify custom alias. Check availability. Store in same DB with a flag.',
  'Expiry: Add expiresAt field. Background job (cron or MongoDB TTL) deletes expired URLs.',
]);

h1('8.2  Design a Rate Limiter', C.purple);
P('Requirements: Limit each IP/user to N requests per time window. Handle 100K requests/second. Distributed (multiple servers).');

TABLE(
  ['Algorithm', 'How It Works', 'Pros', 'Cons'],
  [
    ['Fixed Window Counter', 'Count requests in fixed time window (e.g., count per minute). Reject when count > limit.', 'Simple to implement', 'Burst at window boundary: 100 req at 00:59 + 100 req at 01:00 = 200 in 1 second'],
    ['Sliding Window Log', 'Store timestamp of each request in a sorted set. Count requests in last 60 seconds.', 'Accurate — no boundary burst', 'Memory intensive — store every request timestamp'],
    ['Sliding Window Counter', 'Approximate: current window count + (previous window count * overlap fraction)', 'Accurate, memory efficient', 'Slightly approximate (~0.1% error)'],
    ['Token Bucket', 'Bucket holds N tokens. Each request consumes 1. Tokens refill at rate R/second.', 'Handles bursts gracefully', 'Complex to implement precisely'],
    ['Leaky Bucket', 'Requests queue up; processed at fixed rate. Queue overflow = reject.', 'Smooth output rate', 'Not bursty-friendly'],
  ],
  [90, 165, 120, 120]
);

CODE(
'// Rate Limiter with Redis Sliding Window (production pattern)\n' +
'const rateLimit = async (userId, limit, windowMs) => {\n' +
'  const key = `rate:${userId}`;\n' +
'  const now = Date.now();\n' +
'  const windowStart = now - windowMs;\n' +
'\n' +
'  // Redis pipeline for atomic operations\n' +
'  const pipeline = redis.pipeline();\n' +
'  pipeline.zremrangebyscore(key, 0, windowStart);  // Remove old timestamps\n' +
'  pipeline.zadd(key, now, `${now}-${Math.random()}`); // Add current request\n' +
'  pipeline.zcard(key);                             // Count requests in window\n' +
'  pipeline.expire(key, windowMs / 1000);           // Set TTL\n' +
'  const results = await pipeline.exec();\n' +
'\n' +
'  const requestCount = results[2][1];\n' +
'  return requestCount <= limit; // true = allowed, false = rate limited\n' +
'};\n' +
'\n' +
'// express-rate-limit (EduStack uses this):\n' +
'const rateLimit = require("express-rate-limit");\n' +
'app.use("/api/auth/login", rateLimit({ windowMs: 15*60*1000, max: 10 }));'
);

h1('8.3  Design a Chat System (WhatsApp-level)', C.purple);
DIAGRAM_BOXES('Real-time Chat Architecture', [
  { label: 'Client A sends message -> WebSocket connection to Chat Service (persistent TCP connection for real-time bidirectional messaging)' },
  { label: 'Chat Service validates message (auth, rate limit, content filter). Stores in Message DB (Cassandra for high write throughput, partitioned by conversation_id).' },
  { label: 'For online recipient: Find which Chat Service instance Client B is connected to (via Redis pub/sub or ZooKeeper for service discovery). Route message to that instance.' },
  { label: 'For offline recipient: Store message in pending queue. Send push notification via FCM/APNs. Deliver when user reconnects.' },
  { label: 'Message Ordering: Each message has a Lamport clock or UUID-based timestamp. Messages delivered in order per conversation.' },
]);

h1('8.4  Design a Notification Service', C.purple);
bullets([
  'Event-driven: Other services (Order Service, Payment Service) emit events to a Kafka topic. Notification Service consumes events and sends appropriate notifications.',
  'Multiple channels: Email (Nodemailer/SendGrid), SMS (Twilio), Push (FCM/APNs), In-app (WebSocket or polling). Route to appropriate channel based on user preferences.',
  'Template engine: Notification templates stored in DB. Populated with event data before sending.',
  'Rate limiting: Avoid spamming users. At most 1 "payment reminder" per hour. User unsubscribe preferences respected.',
  'Retry with backoff: Failed email deliveries are retried with exponential backoff (1s, 2s, 4s, max 30s). Dead letter queue for permanently failing notifications.',
  'EduStack notification: notificationController.js + notificationRoutes.js handles in-app notifications stored in MongoDB. Notification schema: { user: ObjectId, type, message, isRead, createdAt }.',
]);

// ================================================================
// SECTION 9 — INTERVIEW PLAYBOOK
// ================================================================
sectionBanner('9', 'EduStack Interview Playbook',
  '2-minute pitch, STAR format, questions to ask, how to discuss EduStack in interviews', C.brand);

h1('9.1  Your 2-Minute Project Introduction', C.brand);
P('Interviewers will ask "Tell me about your project" in almost every interview. Here is how to answer concisely and impressively. Follow the Problem -> Solution -> Impact structure:');

CODE(
'// SCRIPT: 2-Minute EduStack Introduction\n' +
'\n' +
'"I built EduStack, a full-stack CS education platform, to solve a real problem:\n' +
' engineering students waste hours searching for academic notes, PYQs, and\n' +
' practice problems across fragmented platforms.\n' +
'\n' +
' The backend is a Node.js Express REST API with MongoDB Atlas, supporting:\n' +
' - Dual authentication (local email/OTP + Google OAuth 2.0 via Passport.js)\n' +
' - JWT stored in httpOnly cookies with bcrypt 12-round password hashing\n' +
' - Razorpay payment integration with HMAC-SHA256 server-side verification\n' +
' - A 450+ problem DSA tracker synced live from Google Sheets CSV\n' +
'   with an in-memory 5-minute TTL cache and disk fallback\n' +
'\n' +
' The interesting architectural decision: the AI tutor uses a Python FastAPI\n' +
' microservice (Google Gemini + LightRAG for RAG) that Node.js proxies to,\n' +
' keeping Python AI dependencies isolated from the Node.js runtime.\n' +
'\n' +
' Deployed on Render.com with MongoDB Atlas, Cloudinary for media, and\n' +
' Nodemailer for OTP emails. The entire backend is production-grade:\n' +
' helmet, cors, mongoSanitize, express-rate-limit, and graceful shutdown.\n' +
'\n' +
' I learned about distributed caching, OAuth flows, payment cryptography,\n' +
' and how to architect for security from the start."'
);

h2('Key Points to Emphasize for Specific Roles');
TABLE(
  ['Role', 'What to Emphasize', 'Key Technical Terms'],
  [
    ['Backend SDE', 'Event loop, async patterns, Express middleware pipeline, MongoDB indexing, JWT implementation', 'asyncHandler, libuv, process.nextTick, bufferPages, select:false'],
    ['Security Engineer', 'bcrypt 12 rounds, httpOnly cookies, mongoSanitize, HMAC-SHA256 timingSafeEqual, OWASP mitigations', 'timing attack, rainbow table, CSRF, XSS, NoSQL injection'],
    ['Full Stack', 'Both backend architecture AND frontend integration (API calls, cookie handling, OAuth redirect)', 'CORS credentials:true, sameSite:none, Cloudinary CDN'],
    ['System Design', 'Hybrid monolith+microservice, HTTP proxy pattern, graceful shutdown, horizontal scaling plan', 'CAP theorem, TTL cache, circuit breaker, consistent hashing'],
  ],
  [85, 220, 190]
);

h1('9.2  STAR Behavioral Format for EduStack', C.brand);
P('Behavioral questions ("Tell me about a time you...") should be answered with the STAR format: Situation, Task, Action, Result. Here are EduStack-specific STAR answers:');

bullets([
  'STAR — Security Challenge: Situation: During testing, I realized the login endpoint could be vulnerable to NoSQL injection via $gt operator. Task: Implement injection prevention. Action: Added express-mongo-sanitize middleware and input validation with express-validator, and enforced Mongoose typed schemas. Result: All injection vectors blocked; added to middleware pipeline in registration order.',
  'STAR — Performance Optimization: Situation: The DSA sheet page was loading slowly (500ms+) on every visit because it fetched from Google Sheets. Task: Reduce load time. Action: Implemented a 5-minute TTL in-memory cache with disk fallback. Result: 95% of requests now return in <10ms from cache. Only 1 in ~100 requests hits Google Sheets.',
  'STAR — Architecture Decision: Situation: Needed AI tutoring but Python Gemini SDK was incompatible with Node.js. Task: Integrate AI without mixing runtimes. Action: Designed a separate Python FastAPI microservice. Node.js authenticates the user then proxies AI requests. Result: Clean separation of concerns, each service deployable independently.',
  'STAR — Debugging: Situation: Google OAuth was working in development but failing in production on Render.com with "invalid cookie" errors. Task: Fix OAuth. Action: Identified that sameSite:strict prevents cookie sending during cross-origin OAuth redirect. Changed to sameSite:none + secure:true in production. Result: OAuth works correctly in production.',
]);

// ================================================================
// SECTION 10 — 40 DEEP Q&As
// ================================================================
sectionBanner('10', '40 Deep Interview Q&As — System Design',
  'OS, Networks, CAP, Scalability, Microservices, DSA, FAANG Scenarios — FAANG level', C.brand);

infoBox('About This Section', 'These 40 questions cover system design, OS, networking, and DSA at the depth expected in FAANG/Tier-1 interviews. This is Volume 4 — the final volume. Combined with Volumes 1-3, you have 160 deep Q&As covering the entire EduStack project.', C.accent);

QA(1, 'What is the difference between a process and a thread?',
'A process is an independent program in execution with its own memory address space. A thread is a lightweight unit of execution within a process that shares the process\'s memory space. Multiple threads in the same process can communicate via shared memory, while processes need IPC (Inter-Process Communication).',
['Creating a process: expensive (new address space allocation, PCB creation, file descriptor copying). Creating a thread: cheap (only a new stack is allocated, everything else is shared).', 'Thread safety: Shared memory means threads can corrupt each other\'s data. Mutex/semaphore synchronization prevents this.', 'Node.js uses one main thread for JS execution. libuv uses a thread pool for file I/O and crypto. Worker Threads module enables multi-threaded JS.']);

QA(2, 'Explain the 4 Coffman conditions for deadlock. Give a real-world example.',
'Deadlock requires ALL 4: (1) Mutual Exclusion: resource can only be held by one process, (2) Hold and Wait: process holds one resource while waiting for more, (3) No Preemption: OS cannot force a process to release a resource, (4) Circular Wait: P1 waits for resource held by P2, P2 waits for resource held by P1.',
['Real example: Dining Philosophers — 5 philosophers, 5 forks (one between each). Each picks up left fork (holds), waits for right fork (wait). If all pick up left simultaneously, circular wait. Solution: Each philosopher picks lower-numbered fork first (breaks circular wait).', 'Database deadlock: Transaction A locks Row 1, tries to lock Row 2. Transaction B locks Row 2, tries to lock Row 1. Both wait forever. Solution: DB detects deadlock cycle and kills one transaction.', 'Prevention: Impose total ordering on resource acquisition (always acquire resources in the same fixed order).']);

QA(3, 'What is virtual memory? What is a page fault?',
'Virtual memory gives each process the illusion of having the entire address space (e.g., 0 to 4GB on 32-bit). The MMU (Memory Management Unit) maps virtual addresses to physical RAM frames using a page table. Not all virtual pages need to be in RAM simultaneously — some can be on disk (swap).',
['Page fault: CPU accesses a virtual address whose page is not currently in RAM. Generates a hardware exception. OS handles it: (1) Find a free RAM frame (or evict a page), (2) Load the requested page from disk into the frame, (3) Update page table, (4) Resume the faulting instruction.', 'Major vs Minor page fault: Minor = page is in memory but not in the page table (mapping needed). Major = page is on disk, must be read (slow — milliseconds).', 'Relevance: Node.js processes with very large heaps can cause frequent page faults if the OS starts swapping V8\'s heap to disk.']);

QA(4, 'What is the OSI model? Name all 7 layers with examples.',
'OSI (Open Systems Interconnection) is a conceptual framework for how different network protocols interact. 7 layers from top to bottom: Application (HTTP, DNS), Presentation (TLS, JPEG), Session (NetBIOS), Transport (TCP, UDP), Network (IP, ICMP), Data Link (Ethernet, WiFi), Physical (copper wire, fiber).',
['Mnemonic: "All People Seem To Need Data Processing" (Application, Presentation, Session, Transport, Network, Data Link, Physical).', 'TCP/IP model simplification: 4 layers: Application (= OSI 5+6+7), Transport (= OSI 4), Internet (= OSI 3), Network Access (= OSI 1+2).', 'HTTP operates at layer 7 (Application). TCP at layer 4 (Transport). IP at layer 3 (Network). Ethernet at layer 2 (Data Link). All work together to deliver your request.']);

QA(5, 'What is the difference between TCP and UDP? When would you use UDP?',
'TCP provides: guaranteed delivery (ACKs + retransmission), ordered delivery (sequence numbers), flow control (don\'t overwhelm receiver), congestion control (slow down when network is congested). Reliable but slower due to overhead. UDP provides: best-effort delivery, no guaranteed ordering, no flow control. Fast but unreliable.',
['Use TCP: HTTP/HTTPS (web requests must arrive complete and in order), email, SSH, file transfer — correctness matters over speed.', 'Use UDP: Video streaming (a dropped frame is better than a buffered pause), online gaming (stale position data is useless — prefer fresh), DNS (small query+response, fast, can retry if lost), VoIP.', 'EduStack: All HTTP requests use TCP. MongoDB Atlas connections use TCP. UDP is not directly used.']);

QA(6, 'Explain the TLS handshake. How does HTTPS work?',
'TLS (Transport Layer Security) provides encrypted, authenticated communication. The handshake: (1) Client Hello: supported cipher suites, TLS version, client random. (2) Server Hello: chosen cipher, server certificate (contains public key). (3) Key Exchange: Client and server compute a shared session key (using ECDH — never transmitted over the wire). (4) Finished messages. (5) Application data encrypted with shared AES key.',
['Certificate authority (CA): The server\'s certificate is signed by a CA (Let\'s Encrypt, DigiCert). Browser has a list of trusted CAs. If the certificate chain leads to a trusted CA, the certificate is valid.', 'TLS 1.3 (current): 1 RTT handshake (vs TLS 1.2\'s 2 RTT). No RSA key exchange (removed for forward secrecy). Fewer cipher suites (removed weak ones).', 'Render.com provides automatic HTTPS for EduStack — handles TLS termination at the load balancer. Node.js only needs to handle HTTP internally.']);

QA(7, 'What is the CAP theorem? Give a real-world trade-off example.',
'CAP Theorem: A distributed system can guarantee only 2 of 3: Consistency (all nodes see same data), Availability (every request gets a response), Partition Tolerance (system works despite network partitions). Since partitions happen in real networks, the choice is really C vs A during a partition.',
['CP choice (MongoDB): During primary failure, MongoDB holds an election (~10-30 seconds). During this time, writes are rejected (sacrificing availability) to ensure only one primary exists (maintaining consistency).', 'AP choice (Cassandra): Even during partition, Cassandra accepts writes to available nodes. When partition heals, nodes reconcile using "last write wins" — trades consistency for availability.', 'EduStack: MongoDB Atlas is CP. During the election, EduStack\'s API returns 500 errors for write operations. The isAuth middleware can still read (secondaries are readable with appropriate read preference).']);

QA(8, 'What is horizontal scaling? What challenges does it introduce?',
'Horizontal scaling (scale out) adds more servers to distribute load. Instead of one powerful server, you run N identical servers behind a load balancer.',
['Challenge 1 - Session/State: If a user logs in to Server A, their session is on Server A. Next request goes to Server B — no session. Solution: Use shared session store (Redis, MongoDB sessions — EduStack already uses MongoDB sessions).', 'Challenge 2 - Caching: EduStack\'s in-memory DSA cache is per-process. In 10-server cluster, each server fetches independently. Solution: Redis shared cache.', 'Challenge 3 - File uploads: If Server A stores avatar locally, Server B cannot serve it. Solution: Cloud storage (Cloudinary) — EduStack already does this correctly.', 'Challenge 4 - Sticky sessions (workaround): Load balancer routes user to same server always. Simple but defeats the purpose of having multiple servers.']);

QA(9, 'Explain consistent hashing. When is it used?',
'Consistent hashing places servers and data keys on a virtual ring (0 to 2^32). A request is routed to the first server clockwise from the request\'s hash position on the ring. When adding/removing a server, only ~1/N of keys are redistributed (vs. ~N-1/N for regular hashing).',
['Used in: AWS DynamoDB (partition key -> server mapping), Redis Cluster (slot assignment), Cassandra (token-based ring), Nginx upstream (hash-based load balancing), CDN edge server selection.', 'Virtual nodes: To prevent hotspots (one server getting all keys in a range), each physical server is represented as K virtual nodes on the ring. Keys distribute more evenly.', 'EduStack potential use: If EduStack grew to use Redis Cluster (multiple Redis shards), consistent hashing would determine which Redis shard stores which cache key.']);

QA(10, 'What is a microservices architecture? When should you NOT use it?',
'Microservices split a monolith into independently deployable services, each responsible for a specific business capability. Services communicate via HTTP REST, gRPC, or message queues. Each service has its own database.',
['Do NOT use microservices if: Small team (< 10 engineers) — overhead of distributed systems outweighs benefits, Complex transactions (cross-service ACID is very hard), Early-stage startup (requirements change too fast for stable service boundaries), Simple CRUD application (no domain complexity justifying separation).', 'EduStack decision: Monolith for the Node.js backend (correct). Microservice only for Python ML (necessary — incompatible language/libraries). This is the right pragmatic choice.', 'Conway\'s Law: System architecture tends to mirror the communication structure of the organization that built it. Small team -> Monolith. Multiple teams with clear domain boundaries -> Microservices.']);

QA(11, 'What is the Circuit Breaker pattern? Why is it important in microservices?',
'Circuit Breaker prevents cascading failures. When a downstream service fails repeatedly, the circuit breaker "trips" (opens) and immediately returns errors without calling the failing service — giving it time to recover.',
['States: CLOSED (normal), OPEN (blocking all calls), HALF_OPEN (allow one test call to check recovery).', 'Without circuit breaker: All calls to ML service fail (500ms timeout each). Queue of requests backs up. Node.js event loop is occupied with timeout waiting. ALL other requests to the server slow down.', 'With circuit breaker: After N failures, circuit opens. Subsequent calls return immediately with "AI service unavailable" — no timeout, no blocking. After cooldown period, HALF_OPEN allows one test call.']);

QA(12, 'Explain the Saga pattern for distributed transactions.',
'Saga pattern manages distributed transactions without a 2-phase commit. A saga is a sequence of local transactions. Each step publishes an event. If a step fails, compensating transactions undo the previous steps.',
['Choreography-based: Each service reacts to events independently. No central coordinator. EduStack payment flow is similar: Node.js creates order (step 1), user pays via Razorpay (step 2), Node.js verifies and grants premium (step 3). If verification fails, the order stays in "failed" state — a compensating transaction could refund.', 'Orchestration-based: A central coordinator (orchestrator) tells each service what to do and manages the saga state machine. More complex but easier to reason about.', 'Not needed in EduStack currently: All payment steps use the same DB (MongoDB). Multi-document saga is only needed when services have separate databases.']);

QA(13, 'What is a load balancer? What algorithms does it use?',
'A load balancer distributes incoming requests across multiple server instances to ensure no single server is overwhelmed. It also provides high availability — if one server fails, the load balancer routes traffic to healthy servers.',
['Algorithms: Round Robin (request 1 to S1, request 2 to S2, request 3 to S3, request 4 to S1...). Least Connections (route to server with fewest active connections — better for varying request durations). IP Hash (same client IP always routes to same server — sticky sessions). Weighted Round Robin (some servers get more traffic based on capacity).', 'Layer 4 (Transport) LB: Routes based on IP + port. Cannot inspect HTTP headers. Faster. AWS NLB.', 'Layer 7 (Application) LB: Can inspect HTTP headers, cookies, URLs. More flexible. AWS ALB, Nginx, HAProxy. Render.com uses L7 load balancing.']);

QA(14, 'What is database sharding? What is the difference between vertical and horizontal partitioning?',
'Horizontal partitioning (sharding): Split rows across multiple DB servers. Each shard has a subset of rows (e.g., users with id 1-1M on Shard A, 1M-2M on Shard B). Vertical partitioning: Split columns — move some columns to a different table/DB (e.g., move user avatar_binary to a separate table to keep main user table small).',
['Shard key: Must be chosen carefully. High cardinality, evenly distributed, aligns with query patterns. Bad shard key (e.g., all users from India in one shard) creates a hot spot.', 'Cross-shard queries: Queries that need data from multiple shards are expensive — require scatter-gather (query all shards, merge results). Design schemas to minimize cross-shard queries.', 'MongoDB Atlas sharding: Built-in horizontal sharding (MongoDB calls shards "replica sets" in a sharded cluster). EduStack does not need sharding at current scale.']);

QA(15, 'Explain HTTP/2 multiplexing. What problem does it solve?',
'HTTP/1.1 limitation: A browser opens 6 parallel TCP connections per domain (browser limit). On each connection, requests are serialized — one request must complete before the next starts (Head-of-Line blocking). For a page with 20 resources, many wait in queue.',
['HTTP/2 multiplexing: All requests share ONE TCP connection. Each request/response is a "stream" (identified by a stream ID). Streams interleave on the connection — no one request blocks others. A slow image download doesn\'t block JS loading.', 'HTTP/2 benefits: Fewer TCP connections (less overhead, less TLS handshake overhead), binary protocol (faster parsing than HTTP/1.1 text), header compression (HPACK reduces header overhead for similar requests).', 'HTTP/3: Uses QUIC (UDP-based) instead of TCP. Eliminates TCP-level Head-of-Line blocking (even HTTP/2 suffers from this when a TCP packet is lost — all streams stall). QUIC handles per-stream loss independently.']);

QA(16, 'What is DNS? How does a DNS lookup work?',
'DNS (Domain Name System) translates human-readable domain names (google.com) to IP addresses (142.250.195.46). DNS is hierarchical: Root nameservers -> TLD nameservers (.com) -> Authoritative nameservers (google.com).',
['DNS lookup for "api.edustack.com": (1) Check browser cache. (2) Check OS hosts file. (3) Query Recursive Resolver (ISP\'s DNS server). (4) Recursive Resolver queries Root nameserver -> .com TLD -> edustack.com authoritative NS. (5) Get IP. Cache response with TTL.', 'DNS record types: A (domain -> IPv4), AAAA (domain -> IPv6), CNAME (alias -> canonical name), MX (mail server), TXT (verification, SPF), SRV (service discovery — MongoDB Atlas uses SRV for mongodb+srv://).', 'DNS is UDP by default (port 53) — fast but no guaranteed delivery. Falls back to TCP for responses > 512 bytes.']);

QA(17, 'What is the difference between a monolith, SOA, and microservices?',
'Monolith: Single deployable unit, all features in one codebase, shared database. Simple to develop/deploy/debug. Limited independent scaling. EduStack\'s Node.js backend is a monolith.',
['SOA (Service-Oriented Architecture): Services communicate via enterprise service bus (ESB). Services are coarser-grained than microservices (e.g., "UserService" handles ALL user operations). More formal, often uses SOAP/XML.', 'Microservices: Fine-grained services (one responsibility each), communicate via lightweight HTTP REST or gRPC or message queues. Independent deployment, independent scaling, independent databases. Higher operational complexity.', 'Trend: Monolith first (speed to market), then extract services where independent scaling is needed. Don\'t start with microservices before you know the domain boundaries.']);

QA(18, 'What is a message queue? Name examples and use cases.',
'A message queue allows services to communicate asynchronously. Producer puts messages in the queue; consumer processes them at its own pace. Producer and consumer are decoupled — they don\'t need to be running simultaneously.',
['Examples: RabbitMQ (AMQP, supports complex routing), Apache Kafka (distributed log, high throughput, retention, replay), AWS SQS (fully managed), Redis pub/sub (lightweight, in-memory), Google Pub/Sub.', 'Use cases: Email sending (API returns immediately, background worker sends email), Payment processing (capture order, process payment asynchronously), Notification fan-out (one message, many recipients), Log aggregation (many services write to Kafka, one service processes logs).', 'EduStack potential use: Instead of fire-and-forget email, publish "email:otp" event to queue, email worker processes it — decouples email latency from API response.']);

QA(19, 'What is time complexity O(n log n)? Give an example algorithm.',
'O(n log n) means the algorithm does O(log n) work for each of the n elements. It is faster than O(n^2) and is the best achievable time complexity for comparison-based sorting algorithms.',
['Merge Sort: Recursively splits array in half (log n splits), then merges all halves (n work per level). Total: O(n log n). Space: O(n).', 'Heap Sort: Build heap O(n), extract max n times (each extraction is O(log n)) = O(n log n). Space: O(1).', 'JavaScript Array.sort(): Uses TimSort (hybrid Merge Sort + Insertion Sort) — O(n log n) worst case.', 'Real-world: Sorting 1 million elements. O(n^2) = 10^12 operations (impossible). O(n log n) = 20 million operations (fast).']);

QA(20, 'What is the Two Pointers pattern? Give an example.',
'Two pointers maintains two indices into an array or string, typically starting from opposite ends or at different speeds. Useful for: sorted arrays, palindrome checking, sum problems, partitioning.',
['Example — Pair Sum in sorted array: Given sorted array, find pair that sums to target. left=0, right=n-1. if arr[left]+arr[right] == target: found! if sum < target: left++. if sum > target: right--. Time: O(n), Space: O(1).', 'Palindrome: left=0, right=n-1. While left < right: if arr[left] != arr[right] return false. left++, right--.', 'Remove Duplicates (in-place): slow pointer at position for next unique element. Fast pointer scans ahead, copies unique elements to slow position. Time: O(n), Space: O(1).']);

QA(21, 'Explain Dynamic Programming. What are the two conditions for DP?',
'Dynamic Programming solves problems by breaking them into overlapping subproblems and storing the results (memoization or tabulation) to avoid recomputation. Two conditions: (1) Optimal Substructure — optimal solution contains optimal solutions to subproblems. (2) Overlapping Subproblems — same subproblems are solved multiple times in a naive recursive approach.',
['Fibonacci with DP: Naive recursive O(2^n). With memoization: dp[i] = dp[i-1] + dp[i-2]. O(n) time, O(n) space.', 'Tabulation (bottom-up): Fill dp array from base cases up to solution. No recursion overhead.', 'Common DP problems: Longest Common Subsequence, Knapsack 0/1, Coin Change, Longest Increasing Subsequence, Edit Distance, Matrix Chain Multiplication.']);

QA(22, 'What is BFS? How is it different from DFS?',
'BFS (Breadth-First Search) explores nodes level by level using a Queue. Visits all nodes at depth d before any node at depth d+1. DFS (Depth-First Search) explores as deep as possible using a Stack (or recursion). Goes down one path completely before backtracking.',
['BFS use cases: Shortest path in unweighted graph (guaranteed to find shortest path), level-order tree traversal, connected components, finding all nodes at distance K.', 'DFS use cases: Cycle detection, topological sort, path existence, maze solving, backtracking problems, strongly connected components (Kosaraju, Tarjan).', 'BFS space: O(W) where W is width (max nodes at any level). DFS space: O(H) where H is height. For wide trees, DFS is more memory-efficient. For deep trees, BFS is better.']);

QA(23, 'What is Binary Search? When can you apply it?',
'Binary Search finds a target in a SORTED array by repeatedly halving the search space. Compare target with middle element: if equal, found; if less, search left half; if greater, search right half. Time: O(log n), Space: O(1).',
['Condition for binary search: The array must be sorted (or the function must be monotonic — always increasing or decreasing).', 'Binary Search on Answer: Many optimization problems can be solved by binary searching on the answer. "Find minimum capacity to ship all packages in D days." Binary search on capacity (lo = max weight, hi = sum of all weights). For each mid, check if it is feasible.', 'Common patterns: Search in rotated sorted array, find first/last position, search in 2D matrix, Kth smallest in sorted matrix, sqrt(x).']);

QA(24, 'What is the Sliding Window pattern? Give an example.',
'Sliding Window maintains a "window" (subarray/substring) of size k or with a specific property and slides it across the data. For fixed-size k: maintain running sum/count. For variable size: expand right until constraint violated, shrink left.',
['Fixed window — max sum subarray of size k: Initialize first k elements sum. Slide: add arr[i], subtract arr[i-k]. Track max. O(n) time.', 'Variable window — longest substring without repeating characters: right pointer expands, set tracks characters. When duplicate found: move left pointer past the previous occurrence. O(n) time.', 'When to use: "Find a subarray/substring that satisfies condition X." Contiguous subarray/substring. Condition changes monotonically as window grows/shrinks.']);

QA(25, 'What is the system design for a distributed cache (like Redis)?',
'Redis is an in-memory key-value store. Architecture: Single master handles writes, multiple read replicas handle reads. Persistence via RDB snapshots (point-in-time) or AOF log (append-only). Cluster mode: data sharded across multiple nodes using consistent hashing of key slots (16384 slots).',
['Redis data structures: Strings (simple key-value), Lists (push/pop for queues), Sets (unique values, set operations), Sorted Sets (ranked leaderboard), Hashes (object fields), Streams (event log).', 'Cache eviction policies: allkeys-lru (remove least recently used when memory full), volatile-lru (only evict keys with TTL set), noeviction (return error when full). Configure based on access pattern.', 'Sentinel for HA: Redis Sentinel monitors master/slaves. Auto-promotes a slave to master if master fails. Clients connect to Sentinel, which tells them the current master address.']);

QA(26, 'Explain consistent hashing with virtual nodes.',
'In basic consistent hashing, servers are unevenly distributed on the ring — some get more requests. Virtual nodes solve this: each physical server creates K virtual nodes at different positions on the ring. Requests are spread across K virtual positions, resulting in much more even distribution.',
['Example: With 3 servers and K=150 virtual nodes, each server is represented by 150 points on the ring. On average, each server gets 1/3 of all requests (150/450 = 1/3) — balanced.', 'Adding a server: The new server\'s K virtual nodes are inserted into the ring. Keys that were going to existing nodes clockwise from the new positions are reassigned to the new server.', 'Used in: Redis Cluster (16384 slots per ring, distributed across nodes), Cassandra (each node owns token ranges).']);

QA(27, 'How would you design a URL Shortener that can handle 100M URLs?',
'Core components: (1) Web service to create/redirect URLs, (2) Database for URL mapping, (3) Cache for popular short URLs.',
['URL generation: 6-character base-62 code (62^6 = 56B possibilities). Options: Counter (monotonically increasing) encoded as base-62 (predictable but simple), MD5 hash of URL (take first 6 chars, handle collisions), UUID (too long).', 'Database choice: PostgreSQL/MySQL for ACID (rare writes, many reads). Index on short_code (O(log n) lookup). Cache popular codes in Redis (99% of reads served from cache in <5ms).', 'Analytics: Async write clicks to Kafka/SQS. Consumer aggregates and writes to analytics DB. Never slow down redirects with synchronous analytics writes.', 'Scale: 100M URLs at 100 bytes each = 10GB (small — fits on single DB). 10B redirects/month = 3300/second = easily handled with cache + horizontal scaling.']);

QA(28, 'What is a Bloom filter? When would you use it?',
'A Bloom filter is a probabilistic data structure that answers "Is this element in the set?" with: "Definitely NOT in set" or "Probably in set" (with a configurable false positive rate). Space-efficient: represents millions of items in kilobytes. No false negatives.',
['How it works: Multiple hash functions hash the element to different positions in a bit array. Add: set those bits to 1. Check: if ALL corresponding bits are 1, element is probably present (could be false positive). If ANY bit is 0, element is DEFINITELY not present.', 'Use case: Before checking the database for a URL, check the Bloom filter. If filter says "not in set" — skip DB query (guaranteed not present). If "probably in set" — check DB.', 'EduStack potential: Could use Bloom filter for checking if a username/email exists before doing a DB query — reduces DB load for registrations.']);

QA(29, 'What is the difference between load balancing algorithms? Which is best for EduStack?',
'Load balancing algorithms: Round Robin (simple, equal distribution), Least Connections (send to server with fewest active connections — good for varying request durations), IP Hash (sticky sessions), Weighted (servers have different capacities), Random (simple, works well at scale).',
['Round Robin: Good for EduStack where requests are roughly equal in duration (API calls). Simple, no state needed at the load balancer.', 'Least Connections: Better if some requests take much longer (e.g., AI requests take 2-3 seconds vs regular API calls <100ms). EduStack AI requests go to Python FastAPI — least connections would prevent overloading the ML service.', 'EduStack recommendation: Round Robin for main Node.js servers. Least Connections if EduStack uses multiple Python ML workers.']);

QA(30, 'What is the system design for a notification service?',
'Notification service sends emails, SMS, push notifications, and in-app alerts. Components: API layer (receives notification requests), Worker service (processes and sends), User preference store (channel preferences, unsubscribed topics), Template engine (notification content generation), Delivery tracking (sent, opened, failed).',
['Event-driven: Services emit events ("payment.completed") to Kafka. Notification service consumes events, formats message from template, routes to appropriate channel.', 'EduStack\'s implementation: notificationController creates in-app notifications in MongoDB. Stored as { user: ObjectId, type: String, message: String, isRead: Boolean, createdAt: Date }. Frontend polls /api/notifications for new notifications.', 'Production scale: For millions of users, use queue-based fan-out. One "payment.completed" event fans out to push notification worker, email worker, in-app notification writer in parallel.']);

QA(31, 'What is the Backtracking algorithm pattern?',
'Backtracking systematically explores all possible solutions by building candidates incrementally and abandoning (backtracking) a candidate as soon as it is determined that it cannot lead to a valid solution.',
['Template: Choose (make a choice), Explore (recursively explore with this choice), Unchoose (undo the choice and try the next option).', 'Example — Generate all permutations: For each position, choose an unused element, recurse for remaining positions, then unchoose (mark element as unused).', 'Pruning: The key to efficient backtracking is pruning — detecting early that a partial solution cannot lead to a valid solution and stopping immediately. Reduces worst-case exponential search space.', 'Use cases: N-Queens, Sudoku Solver, Word Search, Combination Sum, Subset generation, Graph coloring.']);

QA(32, 'What is a Trie? When is it better than a HashMap?',
'A Trie (Prefix Tree) is a tree where each node represents a character. Words are stored as paths from root to a leaf/end-marked node. Searching for a word of length L takes O(L) time — independent of the number of words stored.',
['HashMap for word lookup: O(1) average but O(L) to hash the key. No prefix operations.', 'Trie advantages: Prefix search (find all words starting with "edu") — O(P) where P is prefix length. Useful for autocomplete, spell checker. Space efficient when many words share prefixes.', 'Trie operations: Insert O(L), Search O(L), StartsWith O(L) — all O(word length).', 'EduStack use: If implementing subject/resource search autocomplete, a Trie on subject names would enable fast prefix matching.']);

QA(33, 'What is the Union-Find (Disjoint Set Union) data structure?',
'Union-Find tracks a partition of elements into disjoint sets. Two operations: Find (which set does this element belong to?) and Union (merge two sets). Optimized with path compression and union by rank — amortized O(a(n)) per operation where a is the inverse Ackermann function (effectively constant).',
['Find with path compression: Follow the parent chain to root, flatten the tree by pointing all nodes directly to root.', 'Union by rank: Attach the shorter tree under the root of the taller tree — keeps trees balanced.', 'Use cases: Connected components in undirected graph, cycle detection, Kruskal\'s Minimum Spanning Tree algorithm, grouping friends (social network connectivity).']);

QA(34, 'How would you design an efficient search system for EduStack\'s subjects and resources?',
'Requirements: Full-text search on subject names, resource titles, descriptions. Relevance ranking. Autocomplete.',
['Option 1: MongoDB Text Index — Quick to implement. Create: db.subjects.createIndex({ name: "text", description: "text" }). Query: Subject.find({ $text: { $search: "data structures" } }, { score: { $meta: "textScore" } }).sort({ score: { $meta: "textScore" } }). Good for basic search at EduStack\'s scale.', 'Option 2: Elasticsearch — Dedicated search engine. Inverted index for full-text search. Powerful relevance scoring (BM25), fuzzy matching, autocomplete, faceted search. Better for large-scale search.', 'Atlas Search (MongoDB Atlas feature): Built on Lucene. Full-text search with relevance ranking, autocomplete, typo tolerance. EduStack can enable this on Atlas without a separate Elasticsearch cluster.']);

QA(35, 'What is the Heap data structure? How does a priority queue work?',
'A Heap is a complete binary tree satisfying the heap property: in a max-heap, every parent is >= its children; in a min-heap, every parent <= its children. Stored in an array: parent at i, left child at 2i+1, right child at 2i+2.',
['Operations: Insert O(log n) — add to end, bubble up. Extract max/min O(log n) — swap root with last, remove last, bubble down. Build heap O(n) — heapify from bottom up (not O(n log n)).', 'Priority Queue: Uses a heap internally. Always dequeues the highest-priority element. JavaScript does not have a built-in PriorityQueue — implement with a Heap class or use sorted-array.', 'Use cases: Dijkstra\'s shortest path (min-heap for selecting unvisited node with smallest distance), Merge K sorted arrays, Find Kth largest, Task scheduling.']);

QA(36, 'What is the EduStack graceful shutdown? Why does it matter for production?',
'Graceful shutdown means completing in-flight requests before stopping the server. EduStack registers signal handlers: process.on("SIGTERM"/"SIGINT", () => server.close(() => process.exit(0))). server.close() stops accepting new connections but allows existing ones to complete.',
['Why it matters: Without graceful shutdown — SIGTERM (sent on Render.com deploy) kills the process immediately. In-flight requests get no response. Users see connection reset errors. Database writes in progress are abandoned.', 'With graceful shutdown: Ongoing requests complete. DB operations finish. MongoDB connection closes cleanly. New deployment starts accepting traffic.', 'Force-exit guard: setTimeout(() => { process.exit(1); }, 10000) — if the server doesn\'t close within 10 seconds (stuck request), force-kill. Prevents infinite wait.']);

QA(37, 'What are some Redis use cases that would benefit EduStack at scale?',
'Current scale: in-memory variables in Node.js. At 10+ server instances, Redis provides shared state.',
['1. Session store: Replace MongoDB sessions with Redis for sub-millisecond session lookups. connect-redis replaces connect-mongodb-session.', '2. DSA Sheet cache: Move from in-memory to Redis with SET(key, JSON, "EX", 300). All server instances share the same cache.', '3. Rate limiting: Use Redis atomic INCR for distributed rate limiting (not per-process). redis-rate-limiter-flexible library.', '4. Job queue: Bull.js (uses Redis) for background jobs: email sending, PDF generation, heavy computation.', '5. Pub/Sub: Real-time notifications between Node.js server instances using redis.subscribe / redis.publish.']);

QA(38, 'How does EduStack\'s Python FastAPI ML microservice communicate with the Node.js server?',
'Node.js acts as an authenticated HTTP proxy. When a client sends an AI request to the Node.js API (e.g., POST /api/ai/ask), Node.js: (1) Verifies the JWT (isAuth middleware), (2) Checks rate limits, (3) Forwards the request to Python FastAPI at ML_SERVICE_URL (from environment variable) using an HTTP request (e.g., axios or Node\'s http.request), (4) Returns the FastAPI response to the client.',
['Security: The Python FastAPI service is NOT publicly accessible. Only Node.js knows the internal URL (ML_SERVICE_URL). In production, FastAPI might be on an internal network (VPN, private subnet) that only the Node.js server can reach.', 'Health check: Node.js can check FastAPI health before proxying: GET ML_SERVICE_URL/health — if unhealthy, return graceful error without sending to FastAPI.', 'Streaming responses: For long AI responses, Node.js can pipe the FastAPI response stream directly to the client — no buffering needed.']);

QA(39, 'What is the two-minute system design framework for FAANG interviews?',
'Framework for answering system design questions in interviews: (1) Clarify Requirements (2 min), (2) Back-of-envelope estimation (2 min), (3) High-level design (5 min), (4) Deep dive (15 min), (5) Identify bottlenecks and scaling (5 min).',
['Step 1 - Requirements: Functional (what the system does) vs Non-functional (QPS, latency, availability, consistency). Ask: How many users? Read-heavy or write-heavy? Availability requirement (99.9% = 8.7hr/year downtime)?.', 'Step 2 - Estimation: 1M daily users * 10 requests/user = 10M requests/day = ~115 requests/second. Data: 100 chars * 1M messages/day = 100MB/day = 3GB/month (manageable on single DB).', 'Step 4 - Deep dive: Pick 2-3 interesting components and go deep: How does the DB schema look? How does the cache work? How does data flow?', 'Step 5 - Bottlenecks: "The DB becomes a bottleneck at 10K QPS. Solution: Read replicas + cache. Cache becomes bottleneck: Redis cluster."']);

QA(40, 'What makes EduStack a strong portfolio project for SDE interviews at product-based companies?',
'EduStack demonstrates senior-level backend engineering across multiple domains: security (bcrypt, JWT, OAuth, HMAC), database design (MongoDB indexing, Mongoose schemas, TTL cache), payment integration (Razorpay with fraud prevention), microservices (Node.js + Python FastAPI), API design (RESTful, envelope pattern, versioning), and production deployment (Render.com, Cloudinary CDN, MongoDB Atlas).',
['What interviewers look for: (1) Real production patterns (not just CRUD), (2) Security awareness (not storing passwords in plaintext, JWT best practices), (3) Performance optimization (caching, indexing, connection pooling), (4) Architectural thinking (why hybrid monolith, when to extract microservice).', 'Unique differentiators: HMAC-SHA256 payment verification with timingSafeEqual (few students implement this), the Google Sheets live sync with in-memory TTL cache (shows real-world data pipeline thinking), Cloudinary integration with memory buffer (shows understanding of stateless server constraints).', 'How to discuss: Start with the business problem, explain architectural decisions and trade-offs, discuss what you would improve (refresh tokens, Redis cache, circuit breaker) — shows maturity.']);

// ── FOOTER ──────────────────────────────────────────────────
const range = doc.bufferedPageRange();
for (let fp = 0; fp < range.count; fp++) {
  doc.switchToPage(range.start + fp);
  if (fp > 0) {
    doc.rect(50, 792, 495, 14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text('EduStack Masterclass  |  VOLUME 4: System Design  |  Page ' + (fp + 1) + ' of ' + range.count + '  |  github.com/ShubhamKumar968/EduStack',
         50, 795, { lineBreak: false, align: 'center', width: 495 });
  }
}

doc.end();
stream.on('finish', function() {
  const kb = (fs.statSync(OUT).size / 1024).toFixed(1);
  console.log('\n========================================');
  console.log('  VOLUME 4 PDF Generated Successfully!');
  console.log('========================================');
  console.log('  File  :', OUT);
  console.log('  Pages :', range.count);
  console.log('  Size  :', kb, 'KB');
  console.log('========================================\n');
  console.log('  ALL 4 VOLUMES COMPLETE!');
  console.log('  Total Q&As: 160 deep interview questions');
  console.log('  Coverage: JS/Node.js + Auth/Security + DB/Cloud + System Design\n');
});
