// ============================================================
// middlewares/isAuth.js
// ============================================================
// PURPOSE:
//   Protects private routes by verifying the JWT on every request.
//   If valid, attaches the full user document to req.user so that
//   downstream controllers can access it without a second DB query.
//
// TOKEN SOURCES (checked in order):
//   1. Authorization header: "Bearer <token>"  ← preferred for REST APIs
//   2. httpOnly cookie: "edustack_token"        ← for cookie-based flows
//
// WHAT HAPPENS ON FAILURE:
//   Returns 401 Unauthorized. The client must redirect to /login.
//   We use next(error) so the global errorHandler formats the response.
//
// WHY FETCH THE USER EVERY REQUEST?
//   We never store role/email inside the JWT. Instead we re-fetch from
//   DB so that if an admin revokes a user's account or changes their
//   role, the change takes effect immediately — not after token expiry.
// ============================================================

const jwt  = require('jsonwebtoken');
const User = require('../models/user');
const { sendError } = require('../utils/apiResponse');

/**
 * isAuth — JWT Authentication Middleware
 *
 * Attach to any route that requires a logged-in user:
 *   router.get('/profile', isAuth, userController.getProfile);
 */
const isAuth = async (req, res, next) => {
  try {
    let token;

    // ── 1. Check Authorization header (Bearer token) ──────────
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Extract token after "Bearer "
      token = authHeader.split(' ')[1];
    }

    // ── 2. Fallback: Check httpOnly cookie ────────────────────
    if (!token && req.cookies && req.cookies.edustack_token) {
      token = req.cookies.edustack_token;
    }

    // ── 3. No token found anywhere ────────────────────────────
    if (!token) {
      return sendError(res, 'Access denied. Please log in to continue.', 401);
    }

    // ── 4. Verify & decode the JWT ────────────────────────────
    // jwt.verify throws if:
    //   • Token is malformed
    //   • Signature doesn't match (tampered)
    //   • Token has expired (exp claim)
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // decoded.id is the userId we stored in generateToken.js

    // ── 5. Fetch the user from DB ─────────────────────────────
    // .select('-password') explicitly excludes the password hash.
    // The model already has select:false on password, but we're
    // explicit here for absolute clarity and safety.
    const user = await User.findById(decoded.id).select('-password');

    if (!user) {
      // Token was valid but user was deleted from DB — treat as unauthorized
      return sendError(res, 'User account not found. Please register again.', 401);
    }

    // ── 6. Block unverified accounts ─────────────────────────
    if (!user.isVerified) {
      return sendError(res, 'Account not verified. Please verify your email first.', 403);
    }

    // ── 7. Attach user to request object ─────────────────────
    // All downstream controllers can now access req.user
    req.user = user;

    next(); // ✅ Token valid, user found — proceed to the route handler

  } catch (error) {
    // jwt.verify throws JsonWebTokenError or TokenExpiredError
    if (error.name === 'TokenExpiredError') {
      return sendError(res, 'Session expired. Please log in again.', 401);
    }
    return sendError(res, 'Invalid token. Please log in again.', 401);
  }
};

module.exports = isAuth;
