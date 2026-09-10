// ============================================================
// controllers/authController.js
// ============================================================
// PURPOSE:
//   Handles all authentication-related HTTP requests.
//   This is a pure REST API controller — it returns JSON, NOT views.
//
// ROUTES HANDLED:
//   POST   /api/auth/register          → Create new account
//   POST   /api/auth/login             → Login with email + password
//   POST   /api/auth/logout            → Clear auth cookie
//   POST   /api/auth/verify-otp        → Verify OTP (after register)
//   POST   /api/auth/resend-otp        → Resend OTP email
//   POST   /api/auth/forgot-password   → Send password-reset OTP
//   POST   /api/auth/reset-password    → Set new password after OTP verify
//   GET    /api/auth/me                → Get logged-in user's profile
//
// DEPENDENCIES:
//   asyncHandler   → Wraps fn, forwards errors to errorHandler
//   apiResponse    → Standardised JSON envelope
//   generateToken  → JWT sign + cookie attach
//   User model     → DB operations
//   otpService     → Generate + send + verify OTP
//   mailService    → Welcome email
//   bcryptjs       → Password hashing
//   cloudinary     → Profile picture upload
// ============================================================

const bcrypt        = require('bcryptjs');
const asyncHandler  = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const { attachTokenPair, hashToken } = require('../utils/generateToken');
const User          = require('../models/user');
const RefreshToken  = require('../models/refreshToken');
const otpService    = require('../services/otpService');
const mailService   = require('../services/mailService');
const { cloudinary, bufferToBase64Uri } = require('../config/cloudinary');
const jwt           = require('jsonwebtoken');

// ── Password hashing cost factor ────────────────────────────
// 12 rounds = secure enough for production, ~300ms on modern hardware.
// Lower (e.g. 10) = faster but less secure.
const SALT_ROUNDS = 12;


// ============================================================
// @route   POST /api/auth/register
// @desc    Register a new user account with email + password
// @access  Public
// ============================================================
exports.register = asyncHandler(async (req, res) => {
  const { firstName, lastName, email, password } = req.body;

  const normalizedEmail = email.toLowerCase().trim();

  // ── Check if email is already registered ──────────────────
  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser) {
    return sendError(res, 'An account with this email already exists.', 409);
  }

  // ── Hash the password ──────────────────────────────────────
  // Never store plain-text passwords. bcrypt adds a random salt automatically.
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  // ── Handle optional profile picture upload ─────────────────
  // req.file is populated by multer (if the client sent a file)
  let avatarUrl = 'default-avatar.png';
  if (req.file) {
    try {
      const base64Uri = bufferToBase64Uri(req.file);
      const uploaded  = await cloudinary.uploader.upload(base64Uri, {
        folder:  'edustack_profiles',
        timeout: 60000,
      });
      avatarUrl = uploaded.secure_url;
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary register upload warning, using inline data URI fallback:', cloudErr.message);
      const mime = req.file.mimetype || 'image/jpeg';
      avatarUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
    }
  }

  let fName = (firstName || '').trim();
  let lName = (lastName || '').trim();

  if (!fName && normalizedEmail) {
    const handle = normalizedEmail.split('@')[0];
    const parts = handle.split(/[\._\-]/).filter(Boolean);
    fName = parts[0] ? parts[0].charAt(0).toUpperCase() + parts[0].slice(1) : 'Student';
    lName = parts[1] ? parts[1].charAt(0).toUpperCase() + parts[1].slice(1) : '';
  }

  // Admin emails are loaded from env ONLY — never hardcoded in source
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);

  let assignedRole = 'student';
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(normalizedEmail)) {
    assignedRole = 'admin';
  }

  // ── Create the user document ───────────────────────────────
  const user = await User.create({
    firstName: fName,
    lastName:  lName,
    email:     normalizedEmail,
    password:  hashedPassword,
    avatar:    avatarUrl,
    role:      assignedRole,
    branch:    req.body.branch || 'CSE',
    semester:  req.body.semester ? parseInt(req.body.semester, 10) : 1,
  });

  // If user requested contributor role during registration, submit a pending request
  const wantsContributor = req.body.role === 'contributor' || req.body.userType === 'contributor';
  if (wantsContributor && assignedRole !== 'admin') {
    try {
      const ContributorRequest = require('../models/contributorRequest');
      const Notification = require('../models/notification');

      await ContributorRequest.create({
        user: user._id,
        branch: user.branch || 'CSE',
        semester: user.semester || 1,
        reason: req.body.reason || 'Requested contributor publishing access during registration.',
        status: 'pending',
      });

      await Notification.create({
        title: '📩 New Contributor Request',
        message: `${user.firstName} ${user.lastName} (${user.email}) requested to become an EduStack Contributor during registration. Review in Contributor Approvals.`,
        type: 'alert',
        link: '/admin/contributor-requests.html',
        createdBy: user._id,
        readBy: [],
      });
    } catch (reqErr) {
      console.warn('⚠️ Contributor request creation on registration warning:', reqErr.message);
    }
  }

  // ── Send verification OTP ──────────────────────────────────
  // otpService generates a code, saves to OTP collection, emails it
  await otpService.saveAndSendOtp(normalizedEmail);

  return sendSuccess(
    res,
    'Account created! A 6-digit verification code has been sent to your email.',
    { email: normalizedEmail },
    201 // 201 Created
  );
});


// ============================================================
// @route   POST /api/auth/verify-otp
// @desc    Verify the OTP sent after registration
// @access  Public
// ============================================================
exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // otpService.verifyOtp throws descriptive errors on failure.
  // We catch them here and return 400 so they don't become 500 errors.
  try {
    await otpService.verifyOtp(normalizedEmail, otp);
  } catch (err) {
    return sendError(res, err.message || 'Invalid or expired OTP.', 400);
  }

  // ── Mark user as verified ──────────────────────────────────
  const user = await User.findOneAndUpdate(
    { email: normalizedEmail },
    { isVerified: true },
    { new: true } // Return the updated document
  );

  if (!user) {
    return sendError(res, 'User not found. Please register again.', 404);
  }

  // ── Send welcome email (fire-and-forget) ───────────────────
  // We don't await this — we don't want a mail failure to block login
  mailService.sendWelcomeEmail(user.email, user.firstName).catch((err) => {
    console.warn('⚠️  [Auth]: Welcome email failed to send —', err.message);
  });

  // ── Issue Access + Refresh Token Pair ─────────────────────
  // attachTokenPair: generates both tokens, saves refresh hash to DB,
  // and sets both as httpOnly cookies on the response.
  const { accessToken } = await attachTokenPair(res, user._id);

  return sendSuccess(res, 'Email verified successfully! Welcome to EduStack.', {
    accessToken,
    user: {
      id:        user._id,
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      role:      user.role,
      avatar:    user.avatar,
    },
  });
});


// ============================================================
// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to the user's email
// @access  Public
// ============================================================
exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // Confirm the user actually exists before sending
  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return sendError(res, 'No account found with this email.', 404);
  }

  if (user.isVerified) {
    return sendError(res, 'This account is already verified.', 400);
  }

  // saveAndSendOtp upserts the OTP — automatically handles resend
  await otpService.saveAndSendOtp(normalizedEmail);

  return sendSuccess(res, 'A new OTP has been sent to your email.');
});


// ============================================================
// @route   POST /api/auth/login
// @desc    Login with email and password
// @access  Public
// ============================================================
exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  // ── Find user and include password field ───────────────────
  // password is select:false in the schema, so we must explicitly
  // request it here with .select('+password')
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    // Deliberately vague message — don't reveal whether email exists
    return sendError(res, 'Invalid email or password.', 401);
  }

  // ── Check if account is verified ──────────────────────────
  if (!user.isVerified) {
    // Resend OTP automatically for better UX
    await otpService.saveAndSendOtp(normalizedEmail);
    return sendError(
      res,
      'Account not verified. A new OTP has been sent to your email.',
      403
    );
  }

  // ── Compare passwords ──────────────────────────────────────────────
  // Guard: Google OAuth users have no password — block email/password login
  // and guide them to use Google Sign-In instead.
  if (!user.password) {
    return sendError(
      res,
      'This account was created with Google Sign-In. Please use the “Continue with Google” button to log in.',
      401
    );
  }

  // user.comparePassword is an instance method defined in User model
  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return sendError(res, 'Invalid email or password.', 401);
  }

  // Admin emails are loaded from env ONLY — never hardcoded in source
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(normalizedEmail) && user.role !== 'admin') {
    user.role = 'admin';
    await user.save();
  }

  // ── Issue Access + Refresh Token Pair ─────────────────────
  // INTERVIEW POINT:
  //   "On login we issue two tokens:
  //    1. A short-lived ACCESS token (15 min) — used for every API call.
  //    2. A long-lived REFRESH token (30 days) — stored in DB (hashed).
  //       Used only to get a new access token when the old one expires.
  //    Both are sent as httpOnly cookies (XSS-safe) AND in the response
  //    body (for mobile/SPA clients that store in memory)."
  const { accessToken } = await attachTokenPair(res, user._id);

  // Strip password from the response object
  user.password = undefined;

  return sendSuccess(res, 'Logged in successfully.', {
    accessToken,
    user: {
      id:        user._id,
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      role:      user.role,
      avatar:    user.avatar,
    },
  });
});


// ============================================================
// @route   POST /api/auth/logout
// @desc    Log out by clearing the auth cookie
// @access  Private (isAuth)
// ============================================================
exports.logout = asyncHandler(async (req, res) => {
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';
  const cookieOpts = {
    httpOnly: true,
    secure:   IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'strict',
    maxAge:   0, // Expire immediately
  };

  // ── Delete refresh token from DB ───────────────────────────
  // INTERVIEW POINT:
  //   "Unlike stateless JWTs, our refresh tokens are DB-backed.
  //    On logout we physically DELETE the token from MongoDB.
  //    This means the token is immediately invalid — no 30-day
  //    wait for the JWT to naturally expire."
  const refreshTokenRaw = req.cookies?.edustack_refresh_token;
  if (refreshTokenRaw) {
    try {
      const tokenHash = hashToken(refreshTokenRaw);
      await RefreshToken.deleteOne({ tokenHash });
    } catch (_) {
      // Non-critical — proceed with logout even if DB delete fails
    }
  }

  // ── Clear all auth cookies ─────────────────────────────────
  res.cookie('edustack_access_token',  '', cookieOpts);
  res.cookie('edustack_refresh_token', '', cookieOpts);
  res.cookie('edustack_token',         '', cookieOpts); // Clear legacy cookie too

  return sendSuccess(res, 'Logged out successfully.');
});


// ============================================================
// @route   POST /api/auth/forgot-password
// @desc    Send OTP to email for password reset
// @access  Public
// ============================================================
exports.forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = email.toLowerCase().trim();

  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return sendError(
      res,
      'No account found with this email address. Please check your spelling or create an account first.',
      404
    );
  }

  // Google OAuth accounts don't use passwords
  if (user.googleId && !user.password) {
    return sendError(
      res,
      'This account was created with Google Sign-In and does not have a password. Please log in directly with Google.',
      400
    );
  }

  try {
    await otpService.saveAndSendOtp(normalizedEmail);
  } catch (err) {
    console.error('❌ [ForgotPassword]: OTP send failed:', err.message);
    return sendError(
      res,
      `Unable to send OTP email: ${err.message}. Please verify your email or try again.`,
      500
    );
  }

  return sendSuccess(
    res,
    'A 6-digit password reset code has been sent to your email.',
    { email: normalizedEmail }
  );
});


// ============================================================
// @route   POST /api/auth/verify-forgot-password (or /verify-forget-password)
// @desc    Verify password reset OTP before allowing new password input
// @access  Public
// ============================================================
exports.verifyForgotPassword = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return sendError(res, 'Email and OTP are required.', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();
  const OTPModel = require('../models/otp');
  const record = await OTPModel.findOne({ email: normalizedEmail });

  if (!record) {
    return sendError(res, 'OTP has expired or was never requested. Please request a new one.', 400);
  }

  if (record.code !== otp.toString().trim()) {
    return sendError(res, 'Invalid OTP code. Please check your email.', 400);
  }

  return sendSuccess(res, 'OTP verified successfully. You may now enter your new password.', {
    email: normalizedEmail,
    verified: true,
  });
});


// ============================================================
// @route   POST /api/auth/reset-password
// @desc    Verify OTP then set new password
// @access  Public
// ============================================================
exports.resetPassword = asyncHandler(async (req, res) => {
  const { email, otp, password } = req.body;
  if (!email || !password) {
    return sendError(res, 'Email and new password are required.', 400);
  }

  const normalizedEmail = email.toLowerCase().trim();

  // If OTP is provided, verify it first
  if (otp) {
    await otpService.verifyOtp(normalizedEmail, otp);
  }

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    return sendError(res, 'User account not found.', 404);
  }

  // Hash the new password
  const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

  user.password = hashedPassword;
  await user.save();

  return sendSuccess(res, 'Password reset successfully. You can now log in with your new password.');
});


// ============================================================
// @route   GET /api/auth/me
// @desc    Get the currently logged-in user's profile
// @access  Private (isAuth)
// ============================================================
exports.getMe = asyncHandler(async (req, res) => {
  // req.user is populated by isAuth middleware — no extra DB query needed
  const user = req.user;

  return sendSuccess(res, 'User profile fetched.', {
    user: {
      id:                 user._id,
      firstName:          user.firstName,
      lastName:           user.lastName,
      email:              user.email,
      role:               user.role,
      avatar:             user.avatar,
      phoneNumber:        user.phoneNumber,
      branch:             user.branch || 'CSE',
      semester:           user.semester || 1,
      bio:                user.bio,
      isVerified:         user.isVerified,
      isPremium:          user.isPremium || false,
      dsaSolvedCount:     user.dsaSolvedCount || 0,
      edustackPoints:     user.edustackPoints || 0,
      streak:             user.streak || { current: 0, best: 0, lastActiveDate: null },
      unlockedBadges:     user.unlockedBadges || [],
      bookmarkedProblems: user.bookmarkedProblems || [],
      attemptedProblems:  user.attemptedProblems || [],
      potdCompletedDates: user.potdCompletedDates || [],
      createdAt:          user.createdAt,
    },
  });
});


// ============================================================
// @route   POST /api/auth/refresh
// @desc    Issue a new access token using a valid refresh token
// @access  Public (requires valid refresh token in cookie)
// ============================================================
// INTERVIEW EXPLANATION:
//   "The /refresh endpoint implements TOKEN ROTATION:
//    1. Client sends the refresh token (from httpOnly cookie).
//    2. We verify its JWT signature with JWT_REFRESH_SECRET.
//    3. We hash it and look it up in MongoDB — if it's been
//       revoked (e.g. after logout) we reject it immediately.
//    4. We DELETE the old refresh token from DB (one-time use!).
//    5. We issue a BRAND NEW access token (15 min) + refresh token (30 days).
//    6. The new refresh token hash is saved to DB.
//    This rotation means a stolen refresh token can only be used ONCE.
//    If an attacker uses it before the real user does, the next /refresh
//    call by the real user will fail — alerting them to the breach."
exports.refreshToken = asyncHandler(async (req, res) => {
  // ── 1. Extract refresh token from cookie ──────────────────
  const rawRefreshToken = req.cookies?.edustack_refresh_token;

  if (!rawRefreshToken) {
    return sendError(res, 'No refresh token provided. Please log in again.', 401);
  }

  // ── 2. Verify JWT signature of the refresh token ──────────
  // This checks: valid format, correct secret, not expired
  let decoded;
  try {
    decoded = jwt.verify(
      rawRefreshToken,
      process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET
    );
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Refresh token expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid refresh token. Please log in again.', 401);
  }

  // ── 3. Look up hashed token in MongoDB ────────────────────
  // If it's not in the DB (revoked, already used, or never existed)
  // we reject the request. This prevents replay attacks.
  const tokenHash   = hashToken(rawRefreshToken);
  const storedToken = await RefreshToken.findOne({ tokenHash });

  if (!storedToken) {
    // Possible replay attack — token was already used or user logged out
    return sendError(res, 'Refresh token is invalid or has already been used. Please log in again.', 401);
  }

  if (storedToken.isRevoked) {
    // Manually revoked (e.g. forced logout by admin)
    return sendError(res, 'Session has been revoked. Please log in again.', 401);
  }

  // ── 4. Verify the userId still exists in DB ───────────────
  const user = await User.findById(decoded.id).select('-password');
  if (!user) {
    await RefreshToken.deleteOne({ tokenHash }); // Clean up orphaned token
    return sendError(res, 'User not found. Please register again.', 401);
  }

  if (!user.isVerified) {
    return sendError(res, 'Account not verified. Please verify your email first.', 403);
  }

  // ── 5. TOKEN ROTATION: Delete old refresh token from DB ───
  // The old token is now consumed — it cannot be reused.
  await RefreshToken.deleteOne({ tokenHash });

  // ── 6. Issue brand-new token pair ─────────────────────────
  // New access token (15 min) + new refresh token (30 days).
  // New refresh token hash is saved to DB by attachTokenPair.
  const { accessToken } = await attachTokenPair(res, user._id);

  return sendSuccess(res, 'Token refreshed successfully.', {
    accessToken,
    user: {
      id:        user._id,
      firstName: user.firstName,
      lastName:  user.lastName,
      email:     user.email,
      role:      user.role,
      avatar:    user.avatar,
    },
  });
});
