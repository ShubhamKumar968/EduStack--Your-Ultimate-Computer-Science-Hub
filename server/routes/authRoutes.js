// ============================================================
// routes/authRoutes.js
// ============================================================
// PURPOSE:
//   Defines all authentication-related API endpoints.
//   Wires: validators → validateRequest middleware → controller
//
// BASE PATH (mounted in app.js): /api/auth
//
// FULL ENDPOINT TABLE:
//   POST  /api/auth/register          → Register new user
//   POST  /api/auth/verify-otp        → Verify email OTP
//   POST  /api/auth/resend-otp        → Resend OTP
//   POST  /api/auth/login             → Login
//   POST  /api/auth/logout            → Logout
//   POST  /api/auth/forgot-password   → Send reset OTP
//   POST  /api/auth/reset-password    → Set new password
//   GET   /api/auth/me                → Get own profile (private)
//   GET   /api/auth/google            → Google OAuth redirect
//   GET   /api/auth/google/callback   → Google OAuth callback
// ============================================================

const express  = require('express');
const passport = require('passport');
const multer   = require('multer');
const rateLimit = require('express-rate-limit');
const router   = express.Router();

const authController  = require('../controllers/authController');
const isAuth          = require('../middlewares/isAuth');
const validateRequest = require('../middlewares/validateRequest');
const {
  registerRules,
  loginRules,
  forgotPasswordRules,
  verifyOtpRules,
  resetPasswordRules,
} = require('../validators/authValidator');
const { generateToken, attachCookieToken } = require('../utils/generateToken');

// ── Multer (memory storage — no disk writes) ─────────────────
// Files are stored as Buffer in memory, then sent to Cloudinary
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // Max 5 MB per file
  fileFilter: (req, file, cb) => {
    // Only allow image files for avatar upload
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for profile picture.'), false);
    }
  },
});

// ── Rate Limiters ─────────────────────────────────────────────
// Prevents brute-force attacks on auth endpoints.
// These limits reset after the window period.

// Login: max 10 attempts per 15 minutes per IP
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development', // No limit in dev
});

// Register: max 5 registrations per hour per IP
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { success: false, message: 'Too many accounts created from this IP. Please try again after an hour.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});

// OTP: max 5 OTP requests per 10 minutes per IP
const otpLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5,
  message: { success: false, message: 'Too many OTP requests. Please wait 10 minutes before requesting again.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => process.env.NODE_ENV === 'development',
});


// ── Public Routes ─────────────────────────────────────────────

// Register: multer processes optional avatar BEFORE validators run
// (multer must run first so req.body is populated for validation)
router.post(
  '/register',
  registerLimiter,
  upload.single('avatar'),  // Optional profile picture (field name: "avatar")
  registerRules,            // Validation rules array from authValidator
  validateRequest,          // Checks rules, returns 422 if any fail
  authController.register   // Controller runs only if validation passes
);

// Verify OTP after registration
router.post('/verify-otp',      verifyOtpRules,       validateRequest, authController.verifyOtp);

// Resend OTP (no strict validation needed beyond email format)
router.post('/resend-otp',      otpLimiter, forgotPasswordRules, validateRequest, authController.resendOtp);

// Login
router.post('/login',           loginLimiter, loginRules, validateRequest, authController.login);

// Forgot password — sends OTP to email (supports both forgot-password and forget-password)
router.post('/forgot-password',        otpLimiter, forgotPasswordRules, validateRequest, authController.forgotPassword);
router.post('/forget-password',        otpLimiter, forgotPasswordRules, validateRequest, authController.forgotPassword);

// Verify OTP for forgot password before changing password
router.post('/verify-forgot-password', verifyOtpRules, validateRequest, authController.verifyForgotPassword);
router.post('/verify-forget-password', verifyOtpRules, validateRequest, authController.verifyForgotPassword);

// Reset password — sets new password
router.post('/reset-password',         resetPasswordRules, validateRequest, authController.resetPassword);


// ── Private Routes (require valid JWT) ───────────────────────

router.post('/logout', isAuth, authController.logout);
router.get('/me',      isAuth, authController.getMe);


// ── Google OAuth Routes ───────────────────────────────────────

// Step 1: Redirect to Google's OAuth consent screen (always ask user to select account)
const triggerGoogleAuth = passport.authenticate('google', {
  scope: ['profile', 'email'],
  prompt: 'select_account',
});

router.get('/google', triggerGoogleAuth);
router.get('/auth/google', triggerGoogleAuth);

// Step 2: Google redirects back here after user grants permission
const handleGoogleCallback = [
  passport.authenticate('google', {
    failureRedirect: '/auth/login.html?error=oauth_failed',
  }),
  (req, res) => {
    // Attach JWT Cookie
    const token = attachCookieToken(res, req.user._id);

    // Save session memory so res.locals.isLoggedIn and res.locals.user work
    if (req.session) {
      req.session.isLoggedIn = true;
      req.session.user = {
        _id: req.user._id.toString(),
        email: req.user.email,
        name: `${req.user.firstName} ${req.user.lastName}`,
        role: req.user.role,
        avatar: req.user.avatar
      };
    }

    // Redirect to home page
    res.redirect('/');
  }
];

router.get('/google/callback', handleGoogleCallback);
router.get('/auth/google/callback', handleGoogleCallback);

module.exports = router;
