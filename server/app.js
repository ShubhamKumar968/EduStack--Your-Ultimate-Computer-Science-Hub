// ============================================================
// app.js — Main Application Entry Point
// ============================================================
// PURPOSE:
//   Core server application file for EduStack.
//   Handles middleware setup, MongoDB session store, Passport Google OAuth,
//   static asset serving, API routes, and database bootstrap.
// ============================================================

const path = require('path');
const fs   = require('fs');
const https = require('https');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const mongoSanitize = require('express-mongo-sanitize');
const passport = require('passport');
const passportGoogle = require('passport-google-oauth20');

const { generateToken, attachCookieToken } = require('./utils/generateToken');
const errorHandler = require('./middlewares/errorHandler');
const User = require('./models/user');

// ── Environment Variables ─────────────────────────────────────
const DB_PATH = process.env.MONGO_URI;
if (!DB_PATH) {
  console.error('❌ FATAL: MONGO_URI is not set in environment variables. Exiting.');
  process.exit(1);
}

const PORT = process.env.PORT || 3000;
const IS_PRODUCTION = process.env.NODE_ENV === 'production';
// ML Service URL — set ML_SERVICE_URL in Render dashboard for production
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';

// ── Route Modules ─────────────────────────────────────────────
const authRoutes      = require('./routes/authRoutes');
const userRoutes      = require('./routes/userRoutes');
const subjectRoutes   = require('./routes/subjectRoutes');
const resourceRoutes  = require('./routes/resourceRoutes');
const favouriteRoutes = require('./routes/favouriteRoutes');
const paymentRoutes   = require('./routes/paymentRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const enrollmentRoutes   = require('./routes/enrollmentRoutes');
const aiRoutes           = require('./routes/aiRoutes');
const contributorRequestRoutes = require('./routes/contributorRequestRoutes');

// ── Create Express App ────────────────────────────────────────
const app = express();
if (IS_PRODUCTION || process.env.RENDER) {
  app.set('trust proxy', 1);
}

// ============================================================
// ⚙️ MONGO-DB SESSION STORE CONFIGURATION
// ============================================================
const store = new MongoDBStore({
  uri: DB_PATH,
  collection: 'sessions'
});

store.on('error', function(error) {
  console.error('⚠️ [Session Store Connection Error]:', error);
});

// ============================================================
// ⚙️ GLOBAL MIDDLEWARES
// ============================================================
app.use(helmet({ contentSecurityPolicy: false })); // Flexible for local asset & CDN loading

// ── CORS ─────────────────────────────────────────────────────
// Build allowed origins from env: supports localhost in dev and your Render domain in prod.
// Set CORS_ORIGINS=https://your-app.onrender.com in Render dashboard.
const buildAllowedOrigins = () => {
  const defaults = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:5500',
    'http://127.0.0.1:5500',
  ];
  if (process.env.CORS_ORIGINS) {
    const extra = process.env.CORS_ORIGINS.split(',').map(o => o.trim()).filter(Boolean);
    return [...new Set([...defaults, ...extra])];
  }
  return defaults;
};

const allowedOrigins = buildAllowedOrigins();

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In production, also allow the same Render hostname
    if (IS_PRODUCTION && process.env.RENDER_EXTERNAL_URL && origin === process.env.RENDER_EXTERNAL_URL) {
      return callback(null, true);
    }
    return callback(new Error(`CORS: origin '${origin}' not allowed.`));
  },
  credentials: true
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '1mb' })); // Reduced from 10mb — prevents large-payload DoS
app.use(cookieParser());

if (!IS_PRODUCTION) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

app.use(mongoSanitize());

// ── Express Session Engine ────────────────────────────────────
app.use(session({
  secret: process.env.JWT_SECRET || 'edustack_session_secret_key_change_in_production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: IS_PRODUCTION,              // HTTPS only in production (required for Render)
    httpOnly: true,                     // Prevent JS access to session cookie
    sameSite: IS_PRODUCTION ? 'none' : 'lax', // 'none' allows cross-site on same domain in prod
    maxAge: 7 * 24 * 60 * 60 * 1000    // 7 Days
  },
  store: store
}));

// ============================================================
// 🔒 PASSPORT GOOGLE OAUTH CONFIGURATION
// ============================================================
const getGoogleCallbackURL = () => {
  const envUrl = process.env.GOOGLE_CALLBACK_URL;
  if (envUrl && !envUrl.includes('localhost')) return envUrl;
  if (process.env.RENDER_EXTERNAL_URL) return `${process.env.RENDER_EXTERNAL_URL}/api/auth/google/callback`;
  return envUrl || 'http://localhost:3000/auth/google/callback';
};

const GoogleStrategy = passportGoogle.Strategy;

passport.use(
  new GoogleStrategy(
    {
      clientID:     process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL:  getGoogleCallbackURL(),
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        const userEmail = (profile.emails[0].value || '').toLowerCase().trim();
        // Admin emails are loaded from env ONLY — never hardcoded in source
        const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
          .split(',').map(e => e.trim().toLowerCase()).filter(Boolean);
        const isAdmin = ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(userEmail);

        let user = await User.findOne({ googleId: profile.id });
        if (user) {
          if (isAdmin && user.role !== 'admin') {
            user.role = 'admin';
            await user.save();
          }
          return done(null, user);
        }

        const emailUser = await User.findOne({ email: userEmail });
        if (emailUser) {
          emailUser.googleId = profile.id;
          if (isAdmin && emailUser.role !== 'admin') {
            emailUser.role = 'admin';
          }
          await emailUser.save();
          return done(null, emailUser);
        }

        user = await User.create({
          firstName:  profile.name.givenName || 'User',
          lastName:   profile.name.familyName || '',
          email:      userEmail,
          googleId:   profile.id,
          role:       isAdmin ? 'admin' : 'user',
          avatar:     profile.photos?.[0]?.value || 'default-avatar.png',
          isVerified: true,
        });

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user._id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

app.use(passport.initialize());
app.use(passport.session());

// Global Local Dynamic Context Middleware
app.use((req, res, next) => {
  res.locals.user = req.user || (req.session && req.session.user) || null;
  res.locals.isLoggedIn = !!res.locals.user;
  next();
});

// ============================================================
// 📁 STATIC ASSETS & WEBSITE SERVING
// ============================================================
app.use('/assets', express.static(path.join(__dirname, '../client/assets')));
app.use('/public', express.static(path.join(__dirname, '../client/public')));
app.use(express.static(path.join(__dirname, '../client/public')));

// Root Route: Serves index.html directly
app.get('/', (req, res) => {
  const indexPath = path.join(__dirname, '../client/public/index.html');
  res.sendFile(indexPath, (err) => {
    if (err) {
      res.status(200).json({
        success: true,
        message: 'EduStack REST API Server Active',
        healthCheck: '/api/health'
      });
    }
  });
});

// ── Google Sheet Live Sync — In-Memory Cache ─────────────────
// Caches parsed CSV for 5 minutes to avoid hammering Google on every request.
// On Render free tier this is reset on each cold start (OK — will re-fetch on next visit).
let _dsaSheetCache = null;
let _dsaSheetCacheTime = 0;
const DSA_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

const GOOGLE_SHEET_CSV_URL =
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSWl0OsRO5q5cdOUY3t--QiGg4WozIQVKBo9h2WrPyb5Rv7MC9DYt9bdap-6bGQLLlS0UsqKLJOhwaa/pub?gid=0&single=true&output=csv';

/**
 * Fetch raw CSV text from a URL using built-in https module.
 * Returns a Promise<string>.
 */
function fetchCSV(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : require('http');
    client.get(url, { headers: { 'User-Agent': 'EduStack-Server/1.0' } }, (resp) => {
      // Follow HTTP redirects (301, 302, 303, 307, 308 - Google Sheets redirect)
      if ([301, 302, 303, 307, 308].includes(resp.statusCode) && resp.headers.location) {
        return fetchCSV(resp.headers.location).then(resolve).catch(reject);
      }
      if (resp.statusCode !== 200) {
        return reject(new Error(`CSV fetch failed: HTTP ${resp.statusCode}`));
      }
      let raw = '';
      resp.on('data', chunk => { raw += chunk; });
      resp.on('end', () => resolve(raw));
    }).on('error', reject);
  });
}

/**
 * Parse CSV text into array of row arrays.
 * Handles quoted fields, escaped quotes and CRLF.
 */
function parseCSVText(text) {
  const lines = [];
  let row = [], inQ = false, cur = '';
  for (let i = 0; i < text.length; i++) {
    const c = text[i], n = text[i + 1];
    if (c === '"') {
      if (inQ && n === '"') { cur += '"'; i++; }
      else inQ = !inQ;
    } else if (c === ',' && !inQ) {
      row.push(cur.trim()); cur = '';
    } else if ((c === '\r' || c === '\n') && !inQ) {
      if (c === '\r' && n === '\n') i++;
      row.push(cur.trim());
      if (row.some(v => v !== '')) lines.push(row);
      row = []; cur = '';
    } else {
      cur += c;
    }
  }
  if (cur || row.length > 0) { row.push(cur.trim()); if (row.some(v => v !== '')) lines.push(row); }
  return lines;
}

const KNOWN_COMPANIES = [
  'google', 'amazon', 'microsoft', 'meta', 'facebook', 'flipkart', 'adobe', 'apple', 'uber',
  'samsung', 'netflix', 'goldman sachs', 'goldman', 'oracle', 'paytm', 'visa', 'intuit', 'linkedin',
  'walmart', 'capgemini', 'ola', 'oyo', 'tcs', 'infosys', 'wipro', 'atlassian', 'paypal',
  'salesforce', 'morgan stanley', 'jp morgan', 'jpmorgan', 'swiggy', 'zomato', 'meesho', 'cred', 'phonepe',
  'byju', 'unacademy', 'accenture', 'cognizant', 'deloitte', 'ey', 'pwc', 'kpmg', 'ibm', 'cisco',
  'npci', 'mastercard', 'amex', 'barclays', 'hsbc', 'deutsche bank', 'standard chartered',
  'airtel', 'jio', 'tata', 'reliance', 'zoho', 'freshworks', 'postman', 'groww', 'zerodha',
  'upstox', 'slice', 'navi', 'bharatpe', 'dream11', 'mpl', 'urban company', 'makemytrip',
  'goibibo', 'cleartrip', 'cars24', 'spinny', 'inmobi', 'sharechat', 'dailyhunt', 'scaler',
  'snapdeal', 'media.net', 'bloomberg', 'vmware', 'nvidia', 'intel', 'amd', 'qualcomm', 'citadel',
  'jane street', 'two sigma', 'nutanix', 'rubrik', 'cohesity', 'servicenow', 'workday', 'twilio',
  'stripe', 'square', 'plaid', 'robinhood', 'coinbase', 'affirm', 'chime', 'klarna', 'revolut',
  'monzo', 'wise', 'instacart', 'doordash', 'grubhub', 'delivery hero', 'grab', 'gojek', 'shopee',
  'rakuten', 'line', 'kakao', 'naver', 'baidu', 'alibaba', 'tencent', 'bytedance', 'xiaomi',
  'huawei', 'didi', 'tech mahindra', 'l&t', 'mphasis', 'mindtree', 'persistent', 'kpit', 'cyient',
  'zensar', 'hexaware', 'tata elxsi', 'naukri', 'info edge', 'housing', 'magicbricks', 'nobroker',
  'urbancompany', 'dunzo', 'blinkit', 'zepto', 'bigbasket', 'grofers', 'nykaa', 'lenskart',
  'myntra', 'ajio', 'shopclues', 'firstcry', 'purplle', 'boat', 'noise', 'fireboltt', 'rapido',
  'redbus', 'yatra', 'easemytrip', 'ixigo', 'bookmyshow', 'pine labs', 'razorpay', 'cashfree',
  'billdesk', 'payu', 'juspay', 'instamojo', 'jupiter', 'fi', 'niyo', 'epifi', 'simpl', 'mobikwik'
];

function isOnlyCompanyNames(str) {
  if (!str || typeof str !== 'string') return false;
  const trimmed = str.trim().replace(/^"|"$/g, '');
  if (!trimmed) return false;

  const parts = trimmed.split(/[,\/|;]/).map(s => s.trim().toLowerCase()).filter(Boolean);
  if (parts.length === 0) return false;

  const allMatched = parts.every(part => {
    return KNOWN_COMPANIES.some(comp => {
      if (comp.length <= 3) {
        return part === comp || new RegExp('\\b' + comp + '\\b', 'i').test(part);
      }
      return part === comp || part.includes(comp);
    });
  });

  if (allMatched) return true;

  const dsaKeywords = ['sum', 'sub', 'array', 'map', 'node', 'tree', 'dp', 'graph', 'pointer', 'index', 'for', 'while', 'if', 'return', 'int', 'min', 'max', 'count', 'length', 'hash', 'grid', 'binary', 'sort', 'search', 'bfs', 'dfs', 'stack', 'queue', 'heap', 'k', 'matrix', 'val', 'element', 'subarray', 'subsequence', 'logic', 'approach', 'find', 'calculate', 'check', 'traverse', 'store', 'update', 'sliding', 'window', 'two', 'left', 'right', 'root', 'parent', 'child', 'leaf', 'set', 'list', 'reverse', 'apply', 'use', 'implement', 'mark', 'push', 'pop', 'insert', 'delete', 'preorder', 'postorder', 'inorder', 'dijkstra', 'bellman', 'floyd', 'tarjan', 'kruskal', 'prim', 'topo', 'dsu', 'union', 'path', 'cycle', 'memo', 'cache', 'prefix', 'suffix', 'bit', 'mod', 'size', 'pair', 'edge', 'vertex', 'level', 'depth', 'distance', 'weight', 'cost', 'step', 'character', 'string', 'digit', 'number', 'odd', 'even', 'negative', 'positive', 'frequency', 'pivot', 'divide', 'conquer', 'greedy', 'backtrack', 'recursion', 'iterative', 'dynamic', 'programming', 'hashing', 'bitmask', 'geometry', 'string', 'pattern', 'matching', 'trie', 'segment', 'fenwick', 'disjoint', 'set', 'dsu', 'euler', 'hamilton', 'bipartite', 'connected', 'strongly', 'components', 'bridge', 'articulation', 'mst', 'shortest', 'flow', 'cut', 'tsp', 'knapsack', 'lis', 'lcs', 'palindrome', 'anagram', 'permutation', 'combination', 'subset', 'subsets', 'subsequence', 'subarray', 'partition', 'split', 'group', 'merge', 'sort', 'quick', 'heap', 'radix', 'counting', 'bucket', 'search', 'binary', 'ternary', 'interpolation', 'jump', 'exponential', 'select', 'median', 'kth', 'order', 'statistic', 'top', 'k', 'freq', 'most', 'least', 'frequent', 'unique', 'duplicate', 'missing', 'first', 'last', 'next', 'prev', 'previous', 'current', 'target', 'start', 'end', 'begin', 'finish', 'limit', 'boundary', 'corner', 'edge', 'case', 'special', 'optimization', 'complexity', 'space', 'time', 'efficiency'];
  const lowerStr = trimmed.toLowerCase();
  const hasDsaWord = dsaKeywords.some(kw => new RegExp('\\b' + kw + '\\b').test(lowerStr));

  if (!hasDsaWord && trimmed.length < 30 && !/[:;\->\/\(\)\[\]#\.']/.test(trimmed)) {
    return true;
  }

  return false;
}

function csvLinesToProblems(lines) {
  if (!lines || lines.length <= 1) return [];

  const staticMap = {};
  try {
    const jsonPath = path.join(__dirname, '../client/public/parsed_problems.json');
    if (fs.existsSync(jsonPath)) {
      const staticProblems = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      staticProblems.forEach(p => {
        if (p.title) staticMap[p.title.trim().toLowerCase()] = p;
      });
    }
  } catch (e) {}

  let currentCategory = 'Graphs';
  let currentSubtopic = '';
  const problems = [];

  for (let i = 0; i < lines.length; i++) {
    const cols = lines[i];
    if (!cols || cols.length === 0) continue;

    if (cols[0] && cols[0].trim() && !cols[0].toLowerCase().includes('sheet') && !cols[0].toLowerCase().includes('edit') && !cols[0].toLowerCase().includes('do not')) {
      currentCategory = cols[0].trim();
    }

    const col1 = (cols[1] || '').trim();
    const col2 = (cols[2] || '').trim();
    const col3 = (cols[3] || '').trim();

    if (col3.toLowerCase().includes('dsa sheet') || col3.toLowerCase().includes('questions') || col1.toLowerCase().includes('mark as done') || col3.toLowerCase().includes('do not send')) {
      continue;
    }

    const lowerCol3 = col3.toLowerCase();
    const lowerCol0 = (cols[0] || '').toLowerCase();
    if (lowerCol3.includes('implementation based') || lowerCol3.includes('conceptual video') || lowerCol3.includes('algorithmic pattern') || lowerCol0.includes('implementation based') || lowerCol0.includes('conceptual video')) {
      continue;
    }

    const isIdNum = !isNaN(parseInt(col2)) && parseInt(col2) > 0;
    const col4Val = (cols[4] || '').trim();
    const isPlaceholderLink = col4Val === '' || col4Val === 'Problem Link';
    if (col3 && !isIdNum && (col1 === '' || col1 === 'FALSE' || col1 === 'TRUE') && isPlaceholderLink) {
      currentSubtopic = col3;
      continue;
    }

    const lowerCat = (currentCategory || '').toLowerCase();
    const lowerSub = (currentSubtopic || '').toLowerCase();
    if (lowerCat.includes('implementation based') || lowerCat.includes('conceptual video') || lowerSub.includes('implementation based') || lowerSub.includes('conceptual video')) {
      continue;
    }

    if (col3 && isIdNum) {
      const id = problems.length + 1;
      const title = col3;
      // Match ONLY by exact title to avoid cross-category ID hint leaks
      const staticRef = staticMap[title.toLowerCase()] || {};

      const problemLink = (cols[4] || '').startsWith('http') ? cols[4].trim() : (staticRef.problemLink || '');
      const rawDiff = (cols[5] || '').trim();
      const difficulty = (rawDiff === 'Easy' || rawDiff === 'Medium' || rawDiff === 'Hard') ? rawDiff : (staticRef.difficulty || 'Medium');
      const github = (cols[6] || '').startsWith('http') ? cols[6].trim() : (staticRef.github || '');
      const video = (cols[7] || '').startsWith('http') ? cols[7].trim() : (staticRef.video || '');
      
      const compStr = (cols[8] || '').trim();
      const companies = compStr ? compStr.split(/[,\/|]/).map(s => s.trim().replace(/^"|"$/g, '')).filter(Boolean) : (staticRef.companies || []);
      
      let rawIntuition = (cols[9] || '').trim();
      if (isOnlyCompanyNames(rawIntuition)) {
        rawIntuition = '';
      }
      let intuition = rawIntuition !== '' ? rawIntuition : (staticRef.intuition && staticRef.intuition !== 'Refer to problem logic & hints.' ? staticRef.intuition : '');
      if (isOnlyCompanyNames(intuition)) {
        intuition = '';
      }

      problems.push({
        id,
        title,
        category: currentCategory || staticRef.category || 'General',
        subTopic: currentSubtopic || staticRef.subTopic || '',
        difficulty,
        companies,
        problemLink,
        github,
        video,
        intuition,
        code: staticRef.code || `// Logic & hint for: ${title}\n// Refer to problem link for full description.`
      });
    }
  }
  return problems;
}

/**
 * GET /api/dsa-sheet/sync
 * Fetches the LIVE Google Sheet CSV, parses it, caches for 5 min, returns JSON.
 * Falls back to the static parsed_problems.json on network/parse errors.
 * This makes Google Sheet edits reflect on the website within 5 minutes.
 */
app.get('/api/dsa-sheet/sync', async (req, res) => {
  const jsonPath = path.join(__dirname, '../client/public/parsed_problems.json');

  // ── Serve from in-memory cache if still fresh ─────────────
  const bustCache = req.query.bust || false;
  const isFresh = _dsaSheetCache && (Date.now() - _dsaSheetCacheTime < DSA_CACHE_TTL_MS);
  if (isFresh && !bustCache) {
    return res.status(200).json({
      success: true,
      source: 'cache',
      count: _dsaSheetCache.length,
      data: _dsaSheetCache,
      lastSynced: new Date(_dsaSheetCacheTime).toISOString()
    });
  }

  // ── Try to fetch LIVE from Google Sheet ───────────────────
  try {
    console.log('🔄 [DSA Sheet Sync] Fetching live data from Google Sheets…');
    const csvText = await fetchCSV(GOOGLE_SHEET_CSV_URL);
    const csvLines = parseCSVText(csvText);
    const liveProblems = csvLinesToProblems(csvLines);

    if (liveProblems && liveProblems.length > 5) {
      // ── Merge live data with existing static JSON so manually-added
      // problemLinks are never overwritten by a sync (since Google Sheets
      // CSV export strips hyperlink URLs, leaving only placeholder text).
      let mergedProblems = liveProblems;
      try {
        if (fs.existsSync(jsonPath)) {
          const existingData = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
          const existingMap = {};
          existingData.forEach(p => { if (p.title) existingMap[p.title.trim().toLowerCase()] = p; });
          mergedProblems = liveProblems.map(lp => {
            const existing = existingMap[lp.title.trim().toLowerCase()] || {};
            return {
              ...lp,
              // Preserve existing URLs if live CSV didn't provide a real one
              problemLink: lp.problemLink || existing.problemLink || '',
              github:      lp.github      || existing.github      || '',
              video:       lp.video       || existing.video       || '',
            };
          });
        }
      } catch (mergeErr) {
        console.warn('⚠️ [DSA Sheet Sync] Merge with existing JSON failed, using live data:', mergeErr.message);
      }

      // Update in-memory cache
      _dsaSheetCache = mergedProblems;
      _dsaSheetCacheTime = Date.now();

      // Persist to disk so /api/dsa-sheet/live also stays fresh
      try {
        fs.writeFileSync(jsonPath, JSON.stringify(mergedProblems, null, 2), 'utf-8');
        console.log(`✅ [DSA Sheet Sync] Wrote ${mergedProblems.length} problems to parsed_problems.json`);
      } catch (writeErr) {
        console.warn('⚠️ [DSA Sheet Sync] Could not write parsed_problems.json:', writeErr.message);
      }

      return res.status(200).json({
        success: true,
        source: 'live',
        count: mergedProblems.length,
        data: mergedProblems,
        lastSynced: new Date().toISOString()
      });
    }

    throw new Error('Parsed 0 problems from live sheet — falling back');
  } catch (liveErr) {
    console.warn('⚠️ [DSA Sheet Sync] Live fetch failed, using static file:', liveErr.message);

    // ── Fallback: read from disk ───────────────────────────
    try {
      if (fs.existsSync(jsonPath)) {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        _dsaSheetCache = data;
        _dsaSheetCacheTime = Date.now();
        return res.status(200).json({
          success: true,
          source: 'cached-file',
          count: data.length,
          data: data,
          lastSynced: new Date().toISOString()
        });
      }
      return res.status(200).json({ success: true, source: 'empty', count: 0, data: [] });
    } catch (fsErr) {
      console.error('❌ [DSA Sheet Sync] Static fallback also failed:', fsErr.message);
      return res.status(500).json({ success: false, error: fsErr.message });
    }
  }
});

/**
 * GET /api/dsa-sheet/live
 * Fast: serves pre-parsed static JSON from disk (committed to repo).
 * Use /api/dsa-sheet/sync for live Google Sheet reflection.
 */
app.get('/api/dsa-sheet/live', (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');

    const jsonPath = path.join(__dirname, '../client/public/parsed_problems.json');
    const lecPath  = path.join(__dirname, '../client/public/parsed_lectures.json');

    let data = [];
    let lectures = [];

    if (fs.existsSync(jsonPath)) {
      data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
    }
    if (fs.existsSync(lecPath)) {
      lectures = JSON.parse(fs.readFileSync(lecPath, 'utf-8'));
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data,
      lectures: lectures,
      lastSynced: new Date().toISOString()
    });
  } catch (err) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * GET /api/config
 * Exposes safe client-side configuration (no secrets).
 * Frontend reads this once on load to know the ML service URL.
 */
app.get('/api/config', (req, res) => {
  res.status(200).json({
    success: true,
    mlServiceUrl: ML_SERVICE_URL,
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'EduStack API is running.',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});


// ============================================================
// 🛣️ API ROUTE PIPELINES
// ============================================================
app.use('/api/ai',            aiRoutes);
app.use('/api/auth',          authRoutes);
app.use('/api/users',         userRoutes);
app.use('/api/user',          userRoutes);
app.use('/api/subjects',      subjectRoutes);
app.use('/api/resources',     resourceRoutes);
app.use('/api/favourites',    favouriteRoutes);
app.use('/api/enrollments',   enrollmentRoutes);
app.use('/api/payments',      paymentRoutes);
app.use('/api/notifications',        notificationRoutes);
app.use('/api/contributor-requests', contributorRequestRoutes);
// ── Google OAuth root-level aliases ──────────────────────────
// These MUST live at root because Google Cloud Console's Authorized
// Redirect URI is set to: https://your-app.onrender.com/auth/google/callback
// All other auth endpoints are strictly under /api/auth/
app.get('/auth/google',          passport.authenticate('google', { scope: ['profile', 'email'], prompt: 'select_account' }));
app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/auth/login.html?error=oauth_failed' }), (req, res) => {
  const { attachCookieToken } = require('./utils/generateToken');
  attachCookieToken(res, req.user._id);
  if (req.session) {
    req.session.isLoggedIn = true;
    req.session.user = {
      _id:    req.user._id.toString(),
      email:  req.user.email,
      name:   `${req.user.firstName} ${req.user.lastName}`,
      role:   req.user.role,
      avatar: req.user.avatar,
    };
  }
  res.redirect('/');
});

// Catch-all 404 handler — must be after all routes
// API requests get a JSON error; browser/page requests get the custom 404.html
app.use((req, res) => {
  const isApiRequest = req.originalUrl.startsWith('/api/');
  if (isApiRequest) {
    return res.status(404).json({
      success: false,
      message: `Route not found: ${req.method} ${req.originalUrl}`,
    });
  }
  // Serve the custom 404 HTML page for all other unknown routes
  const notFoundPath = path.join(__dirname, '../client/public/404.html');
  res.status(404).sendFile(notFoundPath, (err) => {
    if (err) {
      // Fallback if 404.html itself is missing
      res.status(404).send('<h1>404 - Page Not Found</h1>');
    }
  });
});

// Global Error Handler — must be last
app.use(errorHandler);

// ============================================================
// 🚀 SERVER BOOTSTRAP PIPELINE
// ============================================================
// Connects to MongoDB first, then starts the HTTP server.
// All graceful shutdown and unhandled error logic lives here
// so that `server` is in scope for clean close().
// ============================================================

mongoose.connect(DB_PATH)
  .then(async () => {
    console.log('✅ Connected Successfully to MongoDB Atlas Cluster!');

    // ── Sync unverified contributor accounts into Admin approval queue ──
    try {
      const ContributorRequest = require('./models/contributorRequest');
      const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
        .split(',')
        .map(e => e.trim().toLowerCase())
        .filter(Boolean);

      const unverifiedContributors = await User.find({ role: 'contributor' });
      for (const u of unverifiedContributors) {
        if (ADMIN_EMAILS.includes((u.email || '').toLowerCase())) continue;

        const approvedReq = await ContributorRequest.findOne({ user: u._id, status: 'approved' });
        if (!approvedReq) {
          u.role = 'student';
          await u.save();

          const existingReq = await ContributorRequest.findOne({ user: u._id });
          if (!existingReq) {
            await ContributorRequest.create({
              user: u._id,
              branch: u.branch || 'CSE',
              semester: u.semester || 1,
              reason: 'Contributor account requiring administrator verification.',
              status: 'pending',
            });
          } else if (existingReq.status !== 'approved') {
            existingReq.status = 'pending';
            await existingReq.save();
          }
          console.log(`ℹ️ [Contributor Sync] Queued user ${u.email} for Admin approval.`);
        }
      }
    } catch (syncErr) {
      console.warn('⚠️ [Contributor Sync] Warning during role sync:', syncErr.message);
    }

    // ── Start HTTP Server ───────────────────────────────────
    const server = app.listen(PORT, () => {
      console.log(`
  ╔═══════════════════════════════════════════════╗
  ║        🚀  EduStack API Server Started         ║
  ╠═══════════════════════════════════════════════╣
  ║  Port : ${PORT}
  ║  Mode : ${process.env.NODE_ENV || 'development'}
  ║  URL  : http://localhost:${PORT}
  ║  Health: http://localhost:${PORT}/api/health
  ╚═══════════════════════════════════════════════╝
      `);
    });

    // ============================================================
    // UNHANDLED PROMISE REJECTIONS
    // ============================================================
    // Catches any unhandled .catch()-less Promise rejections.
    // We shut down gracefully so in-flight requests aren't dropped.
    process.on('unhandledRejection', (reason) => {
      console.error('🔥 [Unhandled Promise Rejection]:', reason);
      server.close(() => process.exit(1));
    });

    // ============================================================
    // UNCAUGHT EXCEPTIONS
    // ============================================================
    // Synchronous errors thrown outside any try/catch.
    // The process MUST exit — the app is in an unknown state.
    process.on('uncaughtException', (error) => {
      console.error('💥 [Uncaught Exception]:', error.message);
      process.exit(1);
    });

    // ============================================================
    // GRACEFUL SHUTDOWN (SIGTERM / SIGINT)
    // ============================================================
    // SIGTERM → PM2, Docker, Kubernetes, Render, Railway
    // SIGINT  → Ctrl+C in local terminal
    const gracefulShutdown = (signal) => {
      console.log(`\n⚠️  [${signal}] received. Closing server gracefully...`);
      server.close(() => {
        console.log('✅ HTTP server closed. Goodbye!');
        process.exit(0);
      });
      // Force-exit if server does not close within 10 seconds
      setTimeout(() => {
        console.error('❌ Server did not close in time. Forcing exit.');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT',  () => gracefulShutdown('SIGINT'));
  })
  .catch(err => {
    console.error('❌ Error while connecting to MongoDB:', err.message);
    process.exit(1);
  });

module.exports = app;

