// ============================================================
// utils/generateToken.js
// ============================================================
// PURPOSE:
//   Centralises JWT creation so any controller can call a single
//   function instead of duplicating jwt.sign() config everywhere.
//
// DESIGN DECISIONS:
//   • We store the raw userId (_id) as payload.  Role and email
//     are intentionally excluded from the token — they are re-fetched
//     from DB on every protected request via isAuth middleware, which
//     ensures stale tokens never grant stale permissions.
//   • The token is sent back in two ways:
//       1. As a JSON body field ("token") — for SPAs that store it
//          in memory or localStorage.
//       2. As an httpOnly cookie ("edustack_token") — for server-side
//          cookie flows that are resistant to XSS.
//     Controllers pick whichever strategy they need.
// ============================================================

const jwt = require('jsonwebtoken');

/**
 * Signs and returns a JWT for the given userId.
 *
 * @param   {string | ObjectId} userId  - MongoDB _id of the authenticated user
 * @returns {string}                    - Signed JWT string
 *
 * @example
 *   const token = generateToken(user._id);
 *   res.json({ token });
 */
const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },                         // payload  — keep it minimal
    process.env.JWT_SECRET,                 // secret   — loaded from .env
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } // expiry — default 7 days
  );
};

/**
 * Attaches a signed JWT as a secure, httpOnly cookie on the response.
 * Call this in any login / register controller that prefers cookies.
 *
 * Cookie flags explained:
 *   httpOnly  — JS on the browser cannot read it (prevents XSS token theft)
 *   secure    — Cookie is only sent over HTTPS in production
 *   sameSite  — 'strict' blocks CSRF from cross-origin form posts
 *   maxAge    — 7 days in milliseconds
 *
 * @param {import('express').Response} res
 * @param {string | ObjectId}          userId
 */
const attachCookieToken = (res, userId) => {
  const token = generateToken(userId);

  res.cookie('edustack_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,               // 7 days in ms
  });

  return token; // Return so the controller can also send it in the body if needed
};

module.exports = { generateToken, attachCookieToken };
