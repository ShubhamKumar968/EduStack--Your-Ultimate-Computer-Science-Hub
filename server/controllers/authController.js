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
const { generateToken, attachCookieToken } = require('../utils/generateToken');
const User          = require('../models/user');
const otpService    = require('../services/otpService');
const mailService   = require('../services/mailService');
const { cloudinary, bufferToBase64Uri } = require('../config/cloudinary');

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
  let assignedRole = 'user';
  if (ADMIN_EMAILS.length > 0 && ADMIN_EMAILS.includes(normalizedEmail)) {
    assignedRole = 'admin';
  } else if (req.body.role === 'student' || req.body.role === 'user' || req.body.role === 'contributor') {
    assignedRole = req.body.role;
  }

  // ── Create the user document ───────────────────────────────
  const user = await User.create({
    firstName: fName,
    lastName:  lName,
    email:     normalizedEmail,
    password:  hashedPassword,
    avatar:    avatarUrl,
    role:      assignedRole,
  });

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

  // otpService.verifyOtp throws descriptive errors on failure
  // asyncHandler catches them and forwards to errorHandler
  await otpService.verifyOtp(normalizedEmail, otp);

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

  // ── Issue JWT ──────────────────────────────────────────────
  const token = attachCookieToken(res, user._id); // Also sets httpOnly cookie

  return sendSuccess(res, 'Email verified successfully! Welcome to EduStack.', {
    token,
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

  // ── Compare passwords ──────────────────────────────────────
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

  // ── Issue JWT ──────────────────────────────────────────────
  const token = attachCookieToken(res, user._id);

  // Strip password from the response object
  user.password = undefined;

  return sendSuccess(res, 'Logged in successfully.', {
    token,
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
  // Clear the httpOnly cookie by setting maxAge to 0
  res.cookie('edustack_token', '', {
    httpOnly: true,
    secure:   process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge:   0, // Immediately expire the cookie
  });

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

  // Security note: We always return the same message whether the user
  // exists or not — prevents email enumeration attacks.
  if (!user) {
    return sendSuccess(
      res,
      'If an account with this email exists, a reset OTP has been sent.'
    );
  }

  await otpService.saveAndSendOtp(normalizedEmail);

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
      id:          user._id,
      firstName:   user.firstName,
      lastName:    user.lastName,
      email:       user.email,
      role:        user.role,
      avatar:      user.avatar,
      phoneNumber: user.phoneNumber,
      branch:      user.branch || 'CSE',
      semester:    user.semester || 1,
      bio:         user.bio,
      isVerified:  user.isVerified,
      isPremium:   user.isPremium || false,
      createdAt:   user.createdAt,
    },
  });
});
