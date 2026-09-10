// ============================================================
// middlewares/isAuth.js
// ============================================================
// PURPOSE:
//   Protects private routes by verifying the JWT access token
//   on every request. If valid, attaches the full user document
//   to req.user so downstream controllers can use it directly.
//
// TOKEN SOURCES (checked in priority order):
//   1. Authorization header: "Bearer <access_token>"  ← REST API clients
//   2. httpOnly cookie: "edustack_access_token"        ← New dual-token system
//   3. httpOnly cookie: "edustack_token"               ← Legacy sessions (backward compat)
//
// VERIFICATION:
//   Uses JWT_ACCESS_SECRET for the new access tokens.
//   Falls back to JWT_SECRET for legacy tokens.
//
// WHAT HAPPENS ON FAILURE:
//   Returns 401 Unauthorized. The client should call POST /api/auth/refresh
//   to get a new access token using the refresh token, then retry.
//   If the refresh token is also expired/revoked, the user must log in again.
//
// WHY FETCH THE USER EVERY REQUEST?
//   We store only the userId in the JWT payload.
//   Role/email/status are re-fetched from DB on every request so that:
//   - Banned/deleted accounts are blocked immediately
//   - Role changes take effect instantly (no stale token window)
// ============================================================

const jwt  = require('jsonwebtoken');
const User = require('../models/user');
const { sendError } = require('../utils/apiResponse');

/**
 * isAuth — JWT Access Token Authentication Middleware
 *
 * Attach to any route that requires a logged-in user:
 *   router.get('/profile', isAuth, userController.getProfile);
 */
const isAuth = async (req, res, next) => {
  try {
    let token;
    let secret;

    // ── 1. Check Authorization header (Bearer token) ──────────
    // Preferred for programmatic API clients (mobile apps, Postman, etc.)
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token  = authHeader.split(' ')[1];
      secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    }

    // ── 2. Check new edustack_access_token cookie ─────────────
    // Set by the dual-token system (attachTokenPair)
    if (!token && req.cookies?.edustack_access_token) {
      token  = req.cookies.edustack_access_token;
      secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
    }

    // ── 3. Fallback: legacy edustack_token cookie ─────────────
    // Keeps existing Google OAuth sessions alive during migration.
    // Can be removed once all clients have refreshed to the new system.
    if (!token && req.cookies?.edustack_token) {
      token  = req.cookies.edustack_token;
      secret = process.env.JWT_SECRET; // Legacy tokens were signed with JWT_SECRET
    }

    // ── 4. No token found anywhere ────────────────────────────
    if (!token) {
      return sendError(res, 'Access denied. Please log in to continue.', 401);
    }

    // ── 5. Verify & decode the JWT ────────────────────────────
    // jwt.verify throws if:
    //   • Token is malformed or tampered (JsonWebTokenError)
    //   • Token has expired (TokenExpiredError)
    //   • Signature doesn't match the secret
    const decoded = jwt.verify(token, secret);
    // decoded.id is the userId stored in the token payload

    // ── 6. Fetch the user from DB ─────────────────────────────
    // We never store role/email in the token — re-fetch every time.
    // .select('-password') excludes the password hash from the result.
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      // Token was valid but user was deleted from DB — block access
      return sendError(res, 'User account not found. Please register again.', 401);
    }

    // ── 7. Block unverified accounts ─────────────────────────
    if (!user.isVerified) {
      return sendError(res, 'Account not verified. Please verify your email first.', 403);
    }

    // ── 8. Attach user to request object ─────────────────────
    // All downstream controllers can access req.user without extra DB queries
    req.user = user;

    next(); // ✅ Token valid, user found — proceed to route handler

  } catch (error) {
    // ── Handle specific JWT errors with helpful messages ──────
    if (error.name === 'TokenExpiredError') {
      // INTERVIEW POINT: "When the access token expires, we return 401
      // with a specific message. The client then hits /api/auth/refresh
      // to silently get a new access token using the refresh token."
      return sendError(res, 'Session expired. Please refresh your token or log in again.', 401);
    }
    return sendError(res, 'Invalid token. Please log in again.', 401);
  }
};

module.exports = isAuth;
