// ============================================================
// utils/generateToken.js
// ============================================================
// PURPOSE:
//   Centralises ALL JWT creation and cookie-attachment logic.
//   Controllers never call jwt.sign() directly — they call these
//   helper functions instead, keeping the implementation in one place.
//
// TOKEN STRATEGY (Dual-Token System):
//   ┌─────────────────┬──────────────┬─────────────────────────┐
//   │ Token           │ Lifetime     │ Storage                 │
//   ├─────────────────┼──────────────┼─────────────────────────┤
//   │ Access Token    │ 15 minutes   │ httpOnly cookie + body  │
//   │ Refresh Token   │ 30 days      │ httpOnly cookie + DB    │
//   └─────────────────┴──────────────┴─────────────────────────┘
//
// SECURITY DESIGN:
//   • Two separate secrets (JWT_ACCESS_SECRET ≠ JWT_REFRESH_SECRET).
//     If one leaks, the other stays safe.
//   • Refresh tokens are SHA-256 hashed before storing in MongoDB.
//     Even a DB breach doesn't expose usable tokens.
//   • Token rotation: every /refresh call deletes the old refresh token
//     and issues a brand-new one. Replay attacks are detected immediately.
//   • httpOnly cookies: JS on the browser cannot read them (XSS protection).
//
// EXPORTED FUNCTIONS:
//   generateAccessToken(userId)        → Signs short-lived access JWT
//   generateRefreshToken(userId)       → Signs long-lived refresh JWT
//   hashToken(token)                   → SHA-256 hash for DB storage
//   attachTokenPair(res, userId)       → Issues both tokens, saves to DB
//   generateToken(userId)              → Legacy: single JWT (kept for compat)
//   attachCookieToken(res, userId)     → Legacy: sets edustack_token cookie
// ============================================================

const jwt    = require('jsonwebtoken');
const crypto = require('crypto');

// Lazy-load to avoid circular dependency at module init time
const getRefreshTokenModel = () => require('../models/refreshToken');

// ── Refresh token lifetime constant ───────────────────────────
const REFRESH_EXPIRES_DAYS = 30;
const REFRESH_EXPIRES_MS   = REFRESH_EXPIRES_DAYS * 24 * 60 * 60 * 1000;
const ACCESS_EXPIRES_MS    = 15 * 60 * 1000; // 15 minutes


// ============================================================
// NEW: generateAccessToken
// ============================================================
/**
 * Signs a short-lived ACCESS JWT for the given userId.
 * Lifetime: 15 minutes (configurable via JWT_ACCESS_EXPIRES_IN).
 *
 * Uses JWT_ACCESS_SECRET — a secret SEPARATE from the refresh secret.
 * Falls back to JWT_SECRET for backward compatibility.
 *
 * @param   {string | ObjectId} userId
 * @returns {string} Signed JWT string
 */
const generateAccessToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m' }
  );
};


// ============================================================
// NEW: generateRefreshToken
// ============================================================
/**
 * Signs a long-lived REFRESH JWT for the given userId.
 * Lifetime: 30 days (configurable via JWT_REFRESH_EXPIRES_IN).
 *
 * Uses JWT_REFRESH_SECRET — a secret SEPARATE from the access secret.
 * Falls back to JWT_SECRET for backward compatibility.
 *
 * @param   {string | ObjectId} userId
 * @returns {string} Signed JWT string
 */
const generateRefreshToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d' }
  );
};


// ============================================================
// NEW: hashToken
// ============================================================
/**
 * Creates a one-way SHA-256 hash of a token string.
 * Used to safely store refresh tokens in MongoDB.
 *
 * INTERVIEW POINT:
 *   "We never store the raw refresh token in the DB.
 *    We store a SHA-256 hash. When the client sends the token back,
 *    we hash it again and compare — like how passwords work with bcrypt,
 *    but faster since we don't need a salt (JWTs are already unique)."
 *
 * @param   {string} token - Raw JWT string
 * @returns {string}       - Hex-encoded SHA-256 hash
 */
const hashToken = (token) => {
  return crypto.createHash('sha256').update(token).digest('hex');
};


// ============================================================
// NEW: attachTokenPair  (the main function to use from now on)
// ============================================================
/**
 * Issues BOTH an access token AND a refresh token for a user.
 *
 * Steps:
 *   1. Generate a short-lived access JWT  (15 min)
 *   2. Generate a long-lived refresh JWT  (30 days)
 *   3. Hash the refresh token and save to MongoDB (for revocation)
 *   4. Set access token as httpOnly cookie  (edustack_access_token)
 *   5. Set refresh token as httpOnly cookie (edustack_refresh_token)
 *   6. Return both raw tokens so the controller can send them in body
 *
 * @param   {import('express').Response} res
 * @param   {string | ObjectId}          userId
 * @returns {Promise<{ accessToken: string, refreshToken: string }>}
 */
const attachTokenPair = async (res, userId) => {
  const RefreshToken  = getRefreshTokenModel();
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';

  // ── 1. Generate both tokens ────────────────────────────────
  const accessToken  = generateAccessToken(userId);
  const refreshToken = generateRefreshToken(userId);

  // ── 2. Save hashed refresh token to DB ────────────────────
  const expiresAt = new Date(Date.now() + REFRESH_EXPIRES_MS);
  await RefreshToken.create({
    tokenHash: hashToken(refreshToken),
    userId,
    expiresAt,
  });

  // ── 3. Set Access Token cookie (15 min) ───────────────────
  // Short lifetime: if stolen, attacker has only 15 minutes.
  res.cookie('edustack_access_token', accessToken, {
    httpOnly: true,
    secure:   IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'strict',
    maxAge:   ACCESS_EXPIRES_MS,
  });

  // ── 4. Set Refresh Token cookie (30 days) ─────────────────
  // Long lifetime: used only to get a new access token.
  // DB-backed: we can revoke it instantly on logout.
  res.cookie('edustack_refresh_token', refreshToken, {
    httpOnly: true,
    secure:   IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'strict',
    maxAge:   REFRESH_EXPIRES_MS,
  });

  return { accessToken, refreshToken };
};


// ============================================================
// LEGACY: generateToken  (kept for backward compatibility)
// ============================================================
/**
 * Signs and returns a single JWT for the given userId.
 * Kept for any code that hasn't migrated to the dual-token system yet.
 *
 * @param   {string | ObjectId} userId
 * @returns {string} Signed JWT string
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};


// ============================================================
// LEGACY: attachCookieToken  (kept for backward compatibility)
// ============================================================
/**
 * Attaches a single signed JWT as a secure, httpOnly cookie.
 * Kept for backward compatibility (e.g. existing sessions).
 *
 * @param {import('express').Response} res
 * @param {string | ObjectId}          userId
 * @returns {string} The signed token
 */
const attachCookieToken = (res, userId) => {
  const token         = generateToken(userId);
  const IS_PRODUCTION = process.env.NODE_ENV === 'production';

  res.cookie('edustack_token', token, {
    httpOnly: true,
    secure:   IS_PRODUCTION,
    sameSite: IS_PRODUCTION ? 'none' : 'strict',
    maxAge:   7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  return token;
};


module.exports = {
  // New dual-token system
  generateAccessToken,
  generateRefreshToken,
  hashToken,
  attachTokenPair,
  // Legacy (backward compat)
  generateToken,
  attachCookieToken,
};
