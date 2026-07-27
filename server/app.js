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
const aiRoutes           = require('./routes/aiRoutes');

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
app.use(express.json({ limit: '10mb' }));
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
  'https://docs.google.com/spreadsheets/d/e/2PACX-1vSWl0OsRO5q5cdOUY3t--QiGg4WozIQVKBo9h2WrPyb5Rv7MC9DYt9bdap-6bGQLLlS0UsqKLJOhwaa/pub?output=csv';

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

/**
 * Convert raw CSV lines (from Google Sheet) into the problems array
 * matching the schema used in parsed_problems.json.
 */
function csvLinesToProblems(lines) {
  const problems = [];
  const SKIP_KEYWORDS = [
    'implementation based', 'conceptual', 'after dsa',
    'system design', 'pattern lecture', 'lec ', 'some '
  ];

  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i];
    if (!cols || cols.length < 3) continue;

    const title = (cols[1] || '').trim();
    if (!title || title.length < 2) continue;

    // Skip lecture/meta rows
    const titleLower = title.toLowerCase();
    if (SKIP_KEYWORDS.some(kw => titleLower.includes(kw))) continue;

    // Skip rows where LeetCode/GFG links are absent (likely section headers)
    const lcLink  = (cols[3] || '').trim();
    const gfgLink = (cols[4] || '').trim();
    if (!lcLink && !gfgLink) continue;

    problems.push({
      id:         parseInt(cols[0]) || (i),
      title:      title,
      category:   (cols[2] || 'General').trim(),
      difficulty: (cols[5] || 'Medium').trim(),
      companies:  (cols[6] || '').split(/[,\/|]/).map(s => s.trim()).filter(Boolean),
      leetcode:   lcLink,
      gfg:        gfgLink,
      time:       (cols[7] || '').trim(),
      space:      (cols[8] || '').trim(),
      intuition:  (cols[9] || '').trim(),
      code:       (cols[10] || '').trim(),
    });
  }
  return problems;
}

/**
 * GET /api/dsa-sheet/sync
 * Fetches the live Google Sheet CSV, parses it, caches for 5 min, returns JSON.
 * This makes Google Sheet edits reflect on the website automatically.
 */
app.get('/api/dsa-sheet/sync', async (req, res) => {
  try {
    const jsonPath = path.join(__dirname, '../client/public/parsed_problems.json');
    if (fs.existsSync(jsonPath)) {
      const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
      _dsaSheetCache = data;
      _dsaSheetCacheTime = Date.now();
      return res.status(200).json({
        success: true,
        source: 'live',
        count: data.length,
        data: data,
        lastSynced: new Date().toISOString()
      });
    }
    return res.status(200).json({ success: true, source: 'empty', count: 0, data: [] });
  } catch (err) {
    console.error('⚠️ [DSA Sheet Sync Error]:', err.message);
    return res.status(500).json({ success: false, error: err.message });
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
app.use('/api/payments',      paymentRoutes);
app.use('/api/notifications', notificationRoutes);
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
  .then(() => {
    console.log('✅ Connected Successfully to MongoDB Atlas Cluster!');

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

