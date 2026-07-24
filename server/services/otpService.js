// ============================================================
// services/otpService.js
// ============================================================
// PURPOSE:
//   Handles the full OTP lifecycle:
//     1. generateOtp()        → creates a secure 6-digit code
//     2. saveOtp(email, otp)  → upserts into the OTP collection
//     3. verifyOtp(email, otp)→ checks code & deletes it after match
//
//   Controllers call these three functions — they never import
//   the OTP model or mailService directly.  Clean separation.
//
// OTP EXPIRY:
//   The OTP document has a MongoDB TTL index (see models/otp.js).
//   MongoDB auto-deletes it after OTP_EXPIRES_MIN minutes.
//   verifyOtp() also deletes it immediately on success so it
//   cannot be reused even before the TTL fires.
// ============================================================

const OTP         = require('../models/otp');
const mailService = require('./mailService');

// ── Helper: Generate a 6-digit numeric OTP ───────────────────
// Math.random() range: [0, 1)
// 100000 + random * 900000 → range [100000, 999999]
// .toString() keeps leading zeros safe (e.g. "100042")
const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// ============================================================
// EXPORTED FUNCTION 1: saveAndSendOtp
// ============================================================
/**
 * Generates an OTP, upserts it into the OTP collection (one per email),
 * and sends it to the user's email via mailService.
 *
 * Using `upsert: true` means:
 *   - If an OTP already exists for this email → update it (new code + fresh TTL)
 *   - If none exists → create a new one
 * This handles "resend OTP" automatically without extra logic.
 *
 * @param {string} email - The recipient's email address
 * @returns {string}     - The OTP code (useful for testing/logging)
 */
const saveAndSendOtp = async (email) => {
  const otp = generateOtp();

  // upsert: true  → insert if not found, update if found
  // new: true     → return the updated document (not the old one)
  await OTP.findOneAndUpdate(
    { email: email.toLowerCase().trim() },
    { code: otp, createdAt: new Date() }, // Reset createdAt so TTL restarts
    { upsert: true, new: true }
  );

  // Send email — if this throws, the error bubbles up to the controller
  // which wraps everything in asyncHandler → forwarded to errorHandler
  await mailService.sendOtpEmail(email, otp);

  console.log(`✅ [OTP Service]: OTP sent to ${email}`);
  return otp; // Useful for logging in dev; never send this back to client
};


// ============================================================
// EXPORTED FUNCTION 2: verifyOtp
// ============================================================
/**
 * Verifies an OTP submitted by the user.
 *
 * Steps:
 *   1. Find the OTP document for this email
 *   2. If not found → expired or never requested
 *   3. If found but code doesn't match → wrong OTP
 *   4. If matched → delete the OTP (one-time use!) and return true
 *
 * @param  {string}  email - User's email
 * @param  {string}  code  - OTP entered by the user
 * @returns {boolean}      - true if valid, throws Error if not
 */
const verifyOtp = async (email, code) => {
  const record = await OTP.findOne({ email: email.toLowerCase().trim() });

  // No OTP document found → either expired (TTL deleted it) or never sent
  if (!record) {
    throw new Error('OTP has expired or was never requested. Please request a new one.');
  }

  // OTP code mismatch
  if (record.code !== code.trim()) {
    throw new Error('Invalid OTP. Please check your email and try again.');
  }

  // ✅ OTP is valid — delete it immediately so it cannot be reused
  await OTP.deleteOne({ _id: record._id });

  return true;
};

module.exports = { saveAndSendOtp, verifyOtp };
