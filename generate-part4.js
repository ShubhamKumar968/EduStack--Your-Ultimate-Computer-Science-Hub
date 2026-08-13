'use strict';
// ================================================================
// EduStack Interview Masterclass — VOLUME 4 (FAANG COMPREHENSIVE EDITION)
// System Design, Operating Systems, Computer Networks & AI Microservice
// Based on: EduStack Production Architecture & Python FastAPI Microservice
// Run: node generate-part4.js
// Output: EduStack_Vol4_ML_SystemDesign.pdf
// ================================================================
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, 'EduStack_Vol4_ML_SystemDesign.pdf');
const doc = new PDFDocument({ size: 'A4', margins: { top: 40, bottom: 20, left: 50, right: 50 }, bufferPages: true });
const stream = fs.createWriteStream(OUT);
doc.pipe(stream);

const ML = 50, MR = 545, MB = 770, TW = 495;
const C = {
  brand: '#c0392b', accent: '#2471a3', dark: '#1c2833', gray: '#4a5568',
  light: '#718096', green: '#1e8449', greenSoft: '#d5f5e3', amber: '#b7950b',
  purple: '#7d3c98', teal: '#148f77', border: '#d5d8dc', codeBg: '#0d1117',
  codeText: '#7ee787', white: '#ffffff', offWhite: '#f8f9fa', rowAlt: '#eaf2ff',
};
function cleanText(str) {
  if (!str) return '';
  return String(str).replace(/—/g,' - ').replace(/–/g,' - ').replace(/’/g,"'").replace(/‘/g,"'")
    .replace(/“/g,'"').replace(/”/g,'"').replace(/•/g,'-').replace(/●/g,'-')
    .replace(/→/g,'->').replace(/←/g,'<-').replace(/✓/g,'[OK]').replace(/❌/g,'[X]').replace(/₹/g,'Rs.');
}
let _pg = 0;
function newPage() { if (_pg === 0) { _pg++; return; } if (doc.y > 60) { doc.addPage(); _pg++; } }
function ensureSpace(n) { if ((MB - doc.y) < n) { doc.addPage(); _pg++; } }
function gap(n) { doc.moveDown(n || 0.3); }
function hr(col) { doc.moveTo(ML,doc.y+2).lineTo(MR,doc.y+2).strokeColor(col||C.border).lineWidth(0.6).stroke(); gap(0.4); }
function sectionBanner(num,title,subtitle,col) {
  col=col||C.brand; newPage();
  doc.rect(0,0,595,12).fill(col); gap(2);
  doc.rect(ML,doc.y,TW,2).fill(col); gap(0.3);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(col).text('SECTION '+num,{align:'center'});
  doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(title),{align:'center'});
  if (subtitle) { gap(0.2); doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(cleanText(subtitle),{align:'center'}); }
  doc.rect(ML,doc.y+6,TW,2).fill(col); gap(0.6);
}
function h1(text,col) {
  col=col||C.brand; ensureSpace(30); gap(0.4);
  const y0=doc.y; doc.rect(ML,y0,TW,22).fill(col);
  doc.fontSize(10.5).font('Helvetica-Bold').fillColor(C.white).text('  '+cleanText(text),ML+6,y0+5,{width:TW-12,lineBreak:false});
  doc.y=y0+22; gap(0.35);
}
function h2(text,col) {
  col=col||C.dark; ensureSpace(22); gap(0.3);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(col).text(cleanText(text));
  doc.moveTo(ML,doc.y+1).lineTo(MR,doc.y+1).strokeColor(col).lineWidth(0.8).stroke(); gap(0.25);
}
function P(text) {
  if (!text||!text.trim()) return; ensureSpace(14);
  doc.fontSize(9).font('Helvetica').fillColor(C.gray).text(cleanText(text),{lineGap:3,align:'justify'}); gap(0.25);
}
function bullets(items) {
  items.forEach(function(item) {
    ensureSpace(14); const y0=doc.y;
    doc.circle(ML+6,y0+5,2.2).fill(C.brand);
    const txt=cleanText(item); const ci=txt.indexOf(':');
    if (ci>0&&ci<65) { doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.dark).text(txt.slice(0,ci),ML+16,y0,{continued:true,lineGap:2.5}); doc.font('Helvetica').fillColor(C.gray).text(txt.slice(ci),{lineGap:2.5}); }
    else { doc.fontSize(8.8).font('Helvetica').fillColor(C.gray).text(txt,ML+16,y0,{lineGap:2.5}); }
    gap(0.15);
  }); gap(0.2);
}
function CODE(text,lang) {
  const arr=cleanText(text).split('\n'); const lh=10.5,pad=6,MAX=36;
  for (let s=0;s<arr.length;s+=MAX) {
    const chunk=arr.slice(s,s+MAX); const ch=chunk.length*lh+pad*2+12;
    ensureSpace(ch+8); const y0=doc.y;
    doc.rect(ML,y0,TW,12).fill('#161b22');
    doc.fontSize(7).font('Helvetica-Bold').fillColor('#58a6ff').text('  '+(lang||'Python / System Design — EduStack Production'),ML+4,y0+2,{lineBreak:false});
    doc.rect(ML,y0+12,TW,ch-12).fill(C.codeBg);
    chunk.forEach(function(line,i) {
      let lc=C.codeText;
      if (line.trim().startsWith('//')||line.trim().startsWith('#')) lc='#8b949e';
      else if (/\b(def|class|async|await|return|if|else|import|from|try|except)\b/.test(line)) lc='#ff7b72';
      else if (/\b(FastAPI|BaseModel|Gemini|pypdf|LightRAG|Uvicorn)\b/.test(line)) lc='#79c0ff';
      else if (/\b(app\.|router\.|response\.|request\.)\b/.test(line)) lc='#d2a8ff';
      doc.fontSize(8).font('Courier').fillColor(lc).text(line,ML+8,y0+12+pad+(i*lh),{lineBreak:false,width:TW-16});
    });
    doc.y=y0+ch; gap(0.35);
  }
}
function infoBox(label,text,col,bg) {
  col=col||C.accent; bg=bg||'#ebf5fb'; ensureSpace(35);
  const bh=doc.fontSize(8.5).font('Helvetica').heightOfString(cleanText(text),{width:TW-28,lineGap:2})+16;
  const y0=doc.y; doc.rect(ML,y0,5,bh).fill(col); doc.rect(ML+5,y0,TW-5,bh).fill(bg);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor(col).text(label+': ',ML+14,y0+8,{continued:true,lineGap:2});
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(text),{lineGap:2});
  doc.y=y0+bh; gap(0.35);
}
function tipBox(t) { infoBox('INTERVIEW TIP',t,C.green,C.greenSoft); }
function warnBox(t) { infoBox('COMMON MISTAKE',t,C.amber,'#fef9e7'); }

function QA(q,ans,pts) {
  ensureSpace(60); const y0=doc.y;
  const qh=doc.fontSize(8.8).font('Helvetica-Bold').heightOfString('Q: '+cleanText(q),{width:TW-16,lineGap:2})+12;
  doc.rect(ML,y0,TW,qh).fill(C.rowAlt); doc.rect(ML,y0,4,qh).fill(C.accent);
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.accent).text('Q: '+cleanText(q),ML+10,y0+6,{width:TW-20});
  doc.y=y0+qh+2;
  doc.fontSize(8.8).font('Helvetica-Bold').fillColor(C.green).text('  Answer:');
  doc.fontSize(8.8).font('Helvetica').fillColor(C.gray).text(cleanText(ans),{lineGap:2.5,indent:10});
  if (pts&&pts.length) pts.forEach(function(pt) { ensureSpace(12); doc.fontSize(8.5).font('Helvetica').fillColor(C.dark).text('     -> '+cleanText(pt),{lineGap:2,indent:5}); });
  gap(0.2); doc.moveTo(ML,doc.y).lineTo(MR,doc.y).strokeColor(C.border).lineWidth(0.4).stroke(); gap(0.3);
}
function TABLE(headers,rows,widths) {
  if (!widths) widths=[]; if (!widths.length) { const w=Math.floor(TW/headers.length); headers.forEach(function(){widths.push(w);}); }
  let maxHH=20; headers.forEach(function(h,i){const hh=doc.fontSize(8.5).font('Helvetica-Bold').heightOfString(cleanText(h),{width:widths[i]-8})+10;if(hh>maxHH)maxHH=hh;});
  ensureSpace(maxHH+10); const hy=doc.y; doc.rect(ML,hy,TW,maxHH).fill(C.brand);
  let hx=ML; headers.forEach(function(h,i){doc.fontSize(8.5).font('Helvetica-Bold').fillColor(C.white).text(cleanText(h),hx+4,hy+5,{width:widths[i]-8,lineGap:1});hx+=widths[i];});
  doc.y=hy+maxHH;
  rows.forEach(function(row,ri) {
    let maxRH=16; row.forEach(function(cell,ci){const rh=doc.fontSize(8).font('Helvetica').heightOfString(cleanText(String(cell)),{width:widths[ci]-8,lineGap:1.5})+8;if(rh>maxRH)maxRH=rh;});
    ensureSpace(maxRH); const ry=doc.y;
    if (ri%2===0) doc.rect(ML,ry,TW,maxRH).fill(C.offWhite);
    let rx=ML; row.forEach(function(cell,ci){doc.fontSize(8).font('Helvetica').fillColor(C.gray).text(cleanText(String(cell)),rx+4,ry+4,{width:widths[ci]-8,lineGap:1.5});rx+=widths[ci];});
    doc.moveTo(ML,ry+maxRH).lineTo(MR,ry+maxRH).strokeColor(C.border).lineWidth(0.3).stroke(); doc.y=ry+maxRH;
  }); gap(0.4);
}

// COVER PAGE
newPage();
doc.rect(0,0,595,14).fill(C.brand); gap(3);
doc.fontSize(40).font('Helvetica-Bold').fillColor(C.brand).text('EduStack Masterclass',{align:'center'});
gap(0.1);
doc.fontSize(12).font('Helvetica').fillColor(C.dark).text('Your Ultimate Computer Science & Engineering Hub',{align:'center'});
gap(0.5); doc.moveTo(120,doc.y).lineTo(475,doc.y).strokeColor(C.border).lineWidth(1.5).stroke(); gap(0.5);
doc.fontSize(11).font('Helvetica').fillColor(C.accent).text('VOLUME 4 -- System Design, OS, Computer Networks & AI Microservice',{align:'center'});
doc.fontSize(16).font('Helvetica-Bold').fillColor(C.dark).text('Product-Based Company Interview Guide (Amazon, Microsoft, Visa, Oracle, JPMC)',{align:'center'});
doc.fontSize(8.8).font('Helvetica').fillColor(C.light).text('OS Concepts | TCP/IP Networking | CAP Theorem | 20 FAANG Scenarios | Interview Playbook',{align:'center'});
gap(1.5);
const bx=doc.y;
doc.rect(60,bx,475,175).fill(C.offWhite); doc.rect(60,bx,6,175).fill(C.brand);
[['Developer','Shubham Kumar  |  CSE Student  |  NIT Patna'],
 ['Target','System Design Architect, Senior SDE, AI Infrastructure Engineer'],
 ['Microservice','Python 3.11 + FastAPI + Uvicorn ASGI Server'],
 ['AI Models','Google Gemini 1.5/2.0 Flash + LightRAG Knowledge Engine'],
 ['Networks','TCP/IP 4-Layer, HTTP/2 Multiplexing, TLS 1.3 Handshake'],
 ['System Design','CAP Theorem, Consistent Hashing, Rate Limiting, Sharding'],
 ['Volume 4','OS, Networks, System Design, 20 FAANG Scenarios, Playbook'],
].forEach(function(r,i) {
  const iy=bx+14+(i*22);
  doc.fontSize(9).font('Helvetica-Bold').fillColor(C.brand).text(cleanText(r[0])+':',74,iy,{width:90,lineBreak:false});
  doc.font('Helvetica').fillColor(C.dark).text(cleanText(r[1]),167,iy,{width:355,lineBreak:false});
});
doc.y=bx+185; gap(1.8);
doc.fontSize(8).font('Helvetica').fillColor(C.light).text('github.com/ShubhamKumar968/EduStack--Your-Ultimate-Computer-Science-Hub',{align:'center'});
doc.fontSize(7.5).font('Helvetica').fillColor(C.light).text('Volume 4 of 4 -- For Product-Based Company Interview Preparation',{align:'center'});
doc.rect(0,830,595,12).fill(C.brand);

// TOC
newPage();
doc.rect(0,0,595,12).fill(C.brand); gap(0.8);
doc.fontSize(18).font('Helvetica-Bold').fillColor(C.dark).text('Table of Contents - Volume 4'); hr(C.brand);
[['1','Operating System Core Concepts','Processes vs Threads, Context Switching, Deadlock Banker\'s algorithm'],
 ['2','Computer Networks & Web Protocols','OSI 7 Layers, TCP 3-way handshake, HTTP/1.1 vs HTTP/2 vs HTTP/3'],
 ['3','System Design Framework & Trade-offs','CAP theorem, BASE vs ACID, Consistency models, Load Balancing'],
 ['4','Scalability & High Availability Patterns','Horizontal vs Vertical scaling, Database Sharding, Consistent Hashing'],
 ['5','Top 15 DSA Algorithmic Interview Patterns','Sliding Window, Two Pointers, BFS/DFS, Dynamic Programming'],
 ['6','Python FastAPI ML Microservice Architecture','FastAPI Uvicorn server, LightRAG, Gemini fallback loop'],
 ['7','20 FAANG System Design & Incident Scenarios','Rate limiting, DDoS botnet defense, 100k webhooks, zero-downtime DB migrations'],
 ['8','Executive Technical Interview Playbook','2-minute elevator pitch, behavioral STAR framework, architecture defense'],
].forEach(function(r) {
  ensureSpace(28); const y0=doc.y;
  doc.rect(ML,y0,TW,24).fill(C.offWhite); doc.rect(ML,y0,4,24).fill(C.brand);
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.brand).text(r[0]+'.',ML+10,y0+4,{width:25,lineBreak:false});
  doc.fontSize(10).font('Helvetica-Bold').fillColor(C.dark).text(cleanText(r[1]),ML+36,y0+4,{width:310,lineBreak:false});
  doc.fontSize(8).font('Helvetica').fillColor(C.gray).text(cleanText(r[2]),ML+36,y0+14,{width:420,lineBreak:false});
  doc.y=y0+26;
});

// SECTION 1
sectionBanner('1','Operating System Core Concepts',
  'Processes vs Threads, Context Switching, Deadlock conditions, Memory virtualization',C.brand);
h1('1.1  Processes vs Threads',C.brand);
P('Understanding operating system abstractions is critical for backend engineering interviews.');
TABLE(
  ['Dimension','OS Process','OS Thread'],
  [
    ['Memory Space','Isolated virtual address space per process','Shared address space within parent process'],
    ['Context Switch Cost','High - flush CPU Translation Lookaside Buffer (TLB)','Low - register reload only, TLB intact'],
    ['IPC Requirement','Requires Inter-Process Communication (IPC, Pipes, Sockets)','Direct memory access via shared variables'],
    ['Node.js Context','Node.js app runs as 1 main OS process','libuv thread pool maintains background worker threads'],
  ],
  [80,205,210]
);

h2('Deadlock - 4 Coffman Conditions & Prevention');
bullets([
  'Mutual Exclusion: At least one resource must be held in a non-shareable mode.',
  'Hold and Wait: A process holds a resource while requesting additional resources.',
  'No Preemption: Resources cannot be forcibly taken from a process.',
  'Circular Wait: A closed chain of processes exists where each waits for a resource held by the next.',
  'Prevention: Banker\'s Algorithm for deadlock avoidance; strict lock ordering rule for thread synchronization.',
]);

// SECTION 2
sectionBanner('2','Computer Networks & Web Protocols',
  'OSI 7 Layers, TCP 3-way handshake, HTTP/1.1 vs HTTP/2 vs HTTP/3, TLS 1.3',C.accent);
h1('2.1  TCP 3-Way Handshake vs 4-Way Teardown',C.accent);
bullets([
  'SYN: Client sends SYN packet (seq = x) to server.',
  'SYN-ACK: Server responds with SYN-ACK packet (seq = y, ack = x + 1).',
  'ACK: Client responds with ACK packet (ack = y + 1). Connection ESTABLISHED.',
  'TLS 1.3 Handshake: Follows TCP handshake in 1 RTT, exchanging Diffie-Hellman keys.',
]);

TABLE(
  ['Protocol','Transport Layer','Key Feature','EduStack Usage'],
  [
    ['HTTP/1.1','TCP','Head-of-Line Blocking, 1 request per TCP socket','Legacy client connections'],
    ['HTTP/2','TCP','Binary framing, Multiplexing over 1 TCP socket, Header Compression (HPACK)','Production API communication'],
    ['HTTP/3','UDP (QUIC)','Zero-RTT handshake, no TCP Head-of-Line blocking, connection migration','Future edge CDN routing'],
  ],
  [65,75,230,125]
);

// SECTION 3
sectionBanner('3','System Design Framework & Trade-offs',
  'CAP Theorem, BASE vs ACID, Consistency Models, Load Balancing Strategies',C.teal);
h1('3.1  CAP Theorem Framework',C.teal);
P('In distributed systems, a database can guarantee at most TWO of the three CAP properties simultaneously during network partition:');
bullets([
  'Consistency (C): Every read receives the most recent write or an error.',
  'Availability (A): Every non-failing node returns a non-error response without guaranteeing latest data.',
  'Partition Tolerance (P): System continues operating despite network packet loss or node isolation.',
  'MongoDB Atlas (CP): Prioritizes consistency and partition tolerance. During primary partition, secondary elections take ~10-12s (writes paused).',
]);

// SECTION 4
sectionBanner('4','Scalability & High Availability Patterns',
  'Horizontal vs Vertical scaling, Database Sharding, Consistent Hashing algorithm',C.purple);
h1('4.1  Consistent Hashing Algorithm',C.purple);
P('Consistent Hashing maps both servers and keys to a 360-degree virtual ring using a hash function (MD5/SHA-256). When a server node is added or removed, only K/N keys need remapping (where K = total keys, N = total nodes), preventing cache storm failures.');

// SECTION 5
sectionBanner('5','Top 15 DSA Algorithmic Interview Patterns',
  'Essential algorithmic problem-solving patterns for FAANG interviews',C.green);
TABLE(
  ['Pattern','Use Case','Example Problem'],
  [
    ['Sliding Window','Subarrays/Substrings with target criteria','Longest Substring Without Repeating Characters'],
    ['Two Pointers','Sorted arrays/strings comparison','Container With Most Water, 3Sum'],
    ['Fast & Slow Pointers','Cycle detection in linked lists/arrays','LinkedList Cycle II, Happy Number'],
    ['BFS / Graph Traversal','Shortest path in unweighted graph','Word Ladder, Binary Tree Level Order Traversal'],
    ['Dynamic Programming','Overlapping subproblems & optimal substructure','Coin Change, Longest Common Subsequence'],
  ],
  [120,190,185]
);

// SECTION 6
sectionBanner('6','Python FastAPI ML Microservice Architecture',
  'FastAPI Uvicorn server, LightRAG knowledge store, Gemini fallback loop',C.brand);
CODE(
'# ml_services/main.py - Python FastAPI ML Microservice\n' +
'from fastapi import FastAPI, HTTPException\n' +
'import google.generativeai as genai\n' +
'\n' +
'app = FastAPI(title="EduStack AI Microservice")\n' +
'\n' +
'@app.post("/api/rag/generate-pyq")\n' +
'async def generate_pyq(payload: dict):\n' +
'    try:\n' +
'        model = genai.GenerativeModel("gemini-1.5-flash")\n' +
'        response = await model.generate_content_async(payload.get("prompt"))\n' +
'        return {"success": True, "data": response.text}\n' +
'    except Exception as e:\n' +
'        raise HTTPException(status_code=500, detail=str(e))'
);

// SECTION 7
sectionBanner('7','20 FAANG System Design & Incident Scenarios',
  'Real-world system design interview questions and incident response blueprints',C.amber);

QA('Scenario 1: How do you handle 100,000 concurrent payment webhooks without dropping requests?',
'Buffer webhooks in a message queue (AWS SQS or Redis Streams) -> Worker pool consumes messages at controlled rate -> Idempotency check via razorpayOrderId before DB write -> Return 200 OK to Razorpay immediately upon queue push.',
['Queue decouples ingestion from database processing.','Idempotency key prevents double-crediting users.']);

QA('Scenario 2: How do you prevent Botnet DDoS attacks on authentication routes?',
'Deploy Cloudflare WAF at edge -> Enforce CAPTCHA after 3 failed login attempts -> Apply IP + User-Agent rate limiting via Redis -> Block IP ranges exhibiting bot signature headers.',
['Edge WAF filters bad traffic before hitting origin server.','Redis rate limiter tracks IP + fingerprint.']);

QA('Scenario 3: How do you execute zero-downtime MongoDB schema migrations?',
'Expand-Contract pattern: (1) Add new optional fields to schema. (2) Deploy app version supporting both old and new fields. (3) Run background script migrating existing docs. (4) Remove old field code.',
['Expand-Contract pattern avoids breaking API compatibility during deploys.']);

QA('Scenario 4: How do you prevent Memory Exhaustion (OOM) when serving 100MB PDF files?',
'Use Node.js Stream pipeline: fs.createReadStream(pdfPath).pipe(res). Streaming chunks (64KB) prevents loading 100MB buffer into V8 heap RAM.',
['Streams keep RAM usage constant (~64KB per active download).']);

QA('Scenario 5: How do you design a high-performance Leaderboard for 1M active users?',
'Use Redis Sorted Sets (ZADD, ZREVRANGE). O(log N) insertion and score updates. Read top 100 users in O(log N + M) time directly from RAM.',
['Redis Sorted Sets (ZSET) provide O(log N) performance for live leaderboards.']);

QA('Scenario 6: How do you maintain session state across 10 horizontally scaled server instances?',
'Centralize session storage in Redis cluster (express-session-redis adapter) or use stateless JWT httpOnly cookies.',
['Stateless JWT cookies or external Redis session cluster.']);

QA('Scenario 7: What strategy prevents Thundering Herd problem when cache expires?',
'Mutex lock / Probabilistic Early Expiration (XFetch): First process acquiring lock refreshes cache; other requests serve stale cached data until refresh completes.',
['Cache locks prevent DB overload on cache miss bursts.']);

QA('Scenario 8: How do you handle MongoDB Primary node failure in production?',
'MongoDB Replica Set automatically triggers election (~10-12 seconds). Mongoose client auto-reconnects to newly elected Primary node.',
['Replica Set election promotes secondary to primary automatically.']);

QA('Scenario 9: How do you secure internal communication between Node.js and Python microservice?',
'mTLS (Mutual TLS) certificates or private virtual network isolation (Render.com internal network) with shared HMAC secret header.',
['Private network routing + mTLS certificate authentication.']);

QA('Scenario 10: How do you design an Analytics Event Collection pipeline for 10M events/day?',
'Batch events in client memory -> Send POST payload every 10s -> Kafka/Kinesis stream ingestion -> ClickHouse or BigQuery data warehouse.',
['Kafka streaming ingestion to ClickHouse column-store database.']);

QA('Scenario 11: How do you design a URL Shortener like Bitly at scale?',
'Base62 encoding of auto-incrementing ID or MD5 hash prefix -> Store mapping in NoSQL DB (MongoDB/Cassandra) -> Cache hot URLs in Redis.',
['Base62 encoding + Redis cache for O(1) redirection lookup.']);

QA('Scenario 12: How do you implement a Distributed Rate Limiter?',
'Sliding Window Counter algorithm in Redis using Lua script (`EVAL`) for atomic execution across distributed instances.',
['Redis + Lua script for atomic sliding window rate limiting.']);

QA('Scenario 13: How do you prevent Race Conditions during Flash Sale inventory checkout?',
'Redis atomic `DECR` command for inventory count OR MongoDB optimistic concurrency control using version key (`__v`).',
['Atomic Redis DECR or optimistic locking with Mongoose __v.']);

QA('Scenario 14: How do you design a Real-Time Notification System for millions of users?',
'WebSockets for active connections -> Fallback to Server-Sent Events (SSE) -> Pub/Sub message broker (Redis Pub/Sub or RabbitMQ) for broadcasting.',
['WebSockets + Redis Pub/Sub for real-time notification fan-out.']);

QA('Scenario 15: How do you handle Database Connection Pool Exhaustion?',
'Implement Circuit Breaker pattern (Opossum npm) -> Tune connection pool size -> Add read replicas for query offloading.',
['Circuit Breaker + Connection pool tuning + Read replicas.']);

QA('Scenario 16: How do you design a File Storage Service like AWS S3?',
'Chunked multipart upload -> Metadata stored in MongoDB -> Binary chunks written to distributed object store (Ceph/MinIO) -> Edge CDN.',
['Multipart chunked upload + Metadata DB + Edge CDN caching.']);

QA('Scenario 17: How do you generate Globally Unique IDs in a distributed system?',
'Twitter Snowflake ID algorithm: 64-bit integer (Timestamp 41 bits + Datacenter ID 5 bits + Worker ID 5 bits + Sequence number 12 bits).',
['Twitter Snowflake ID algorithm for k-ordered 64-bit unique IDs.']);

QA('Scenario 18: How do you implement Graceful Shutdown in Node.js?',
'Listen for SIGTERM/SIGINT -> `server.close()` to stop accepting new requests -> Drain in-flight requests -> Close DB connection pool -> `process.exit(0)`.',
['SIGTERM listener drains in-flight requests and closes DB pools gracefully.']);

QA('Scenario 19: How do you design Multi-Region Data Replication for low latency?',
'Active-Active multi-region deployment with GeoDNS routing -> DynamoDB Global Tables or MongoDB Global Clusters -> Asynchronous cross-region replication.',
['GeoDNS routing + Multi-Region active-active replication.']);

QA('Scenario 20: How do you design a Real-Time Collaborative Document Editor like Google Docs?',
'Operational Transformation (OT) or Conflict-Free Replicated Data Types (CRDTs) over WebSockets with central authority server.',
['CRDTs / Operational Transformation over WebSockets.']);

// SECTION 8
sectionBanner('8','Executive Technical Interview Playbook',
  '2-minute elevator pitch, behavioral STAR framework, system architecture defense cheat sheet',C.purple);
h1('8.1  The 2-Minute Architecture Elevator Pitch',C.purple);
P('"EduStack is a high-performance computer science learning platform architected as a hybrid Node.js Express monolith and Python FastAPI microservice. I engineered a stateless authentication pipeline using JWTs in httpOnly, Secure, SameSite cookies with bcrypt-12 password hashing and Google OAuth 2.0. The database layer uses MongoDB Atlas with WiredTiger engine, custom compound indexes, and TTL auto-expiring OTP documents. The system integrates Razorpay payments with HMAC-SHA256 constant-time verification and zero-disk Cloudinary media streaming."');

// FOOTER
const range=doc.bufferedPageRange();
for (let fp=0;fp<range.count;fp++) {
  doc.switchToPage(range.start+fp);
  if (fp>0) {
    doc.rect(50,792,495,14).fill(C.offWhite);
    doc.fontSize(7.5).font('Helvetica').fillColor(C.light)
       .text('EduStack Masterclass  |  VOLUME 4: System Design & ML  |  Page '+(fp+1)+' of '+range.count+'  |  github.com/ShubhamKumar968/EduStack',
         50,795,{lineBreak:false,align:'center',width:495});
  }
}
doc.end();
stream.on('finish',function() {
  const kb=(fs.statSync(OUT).size/1024).toFixed(1);
  console.log('\\n[OK]  VOLUME 4 generated!');
  console.log('[PDF] File:',OUT);
  console.log('[INFO] Pages:',range.count,'| Size:',kb,'KB\\n');
});
