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
const rateLimit = require('express-rate-limit');

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
const dsaRoutes              = require('./routes/dsaRoutes');

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
app.use(helmet({ contentSecurityPolicy: false })); // Flexible for local asset & CDN loading, inline onclick handlers, and third-party APIs


// ── Rate Limiters ─────────────────────────────────────────────
// Auth endpoints: 5 requests per 15 minutes per IP (brute-force protection)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please wait 15 minutes and try again.' },
  skip: (req) => process.env.NODE_ENV === 'development' && req.ip === '::1', // Skip in local dev from localhost
});

// General API: 100 requests per 15 minutes per IP (DDoS mitigation)
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many requests. Please slow down.' },
});

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


// ── Safe client-side config endpoint ──────────────────────────
// Exposes only non-secret configuration values to the frontend.
app.get('/api/config', (req, res) => {
  res.status(200).json({
    success: true,
    mlServiceUrl: ML_SERVICE_URL,
    environment: process.env.NODE_ENV || 'development'
  });
});

// ── Health check ───────────────────────────────────────────────
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
// DSA Sheet endpoints (extracted to dsaRoutes.js for modularity)
app.use('/api/dsa-sheet',     dsaRoutes);

// Auth routes get strict brute-force rate limiting (5 req / 15 min per IP)
app.use('/api/ai',            aiRoutes);
app.use('/api/auth',          authLimiter, authRoutes);
app.use('/api/users',         generalLimiter, userRoutes);
app.use('/api/user',          generalLimiter, userRoutes);
app.use('/api/subjects',      generalLimiter, subjectRoutes);
app.use('/api/resources',     generalLimiter, resourceRoutes);
app.use('/api/favourites',    generalLimiter, favouriteRoutes);
app.use('/api/enrollments',   generalLimiter, enrollmentRoutes);
app.use('/api/payments',      generalLimiter, paymentRoutes);
app.use('/api/notifications',        generalLimiter, notificationRoutes);
app.use('/api/contributor-requests', generalLimiter, contributorRequestRoutes);
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

