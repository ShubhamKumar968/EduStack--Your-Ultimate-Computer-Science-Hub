// ============================================================
// models/otp.js
// ============================================================
// PURPOSE:
//   Stores one-time passwords (OTPs) sent via email for:
//     • Account email verification after signup
//     • Password reset flow
//
// KEY DESIGN DECISIONS:
//   • TTL Index on `createdAt` — MongoDB automatically DELETES
//     the OTP document after OTP_EXPIRES_MIN minutes. This means
//     we never need a cron job to clean up expired OTPs.
//   • One OTP per email → { email } has a unique index. If a new
//     OTP is requested, we upsert (findOneAndUpdate with upsert:true)
//     which replaces the old one automatically.
// ============================================================

const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  // The email this OTP belongs to (tied to a User's email)
  email: {
    type:     String,
    required: true,
    lowercase: true,
    trim:     true,
    unique:   true, // Only one active OTP per email at any time
  },

  // The 6-digit numeric OTP code (stored as string to preserve leading zeros)
  code: {
    type:     String,
    required: true,
  },

  // createdAt is used by the TTL index below.
  // We set it manually so we can control the exact expiry timestamp.
  createdAt: {
    type:    Date,
    default: Date.now,
  },
});

// ── TTL Index ─────────────────────────────────────────────────
// expireAfterSeconds tells MongoDB to delete this document
// OTP_EXPIRES_MIN * 60 seconds after the `createdAt` field value.
// Default: 10 minutes (600 seconds) if env variable is not set.
//
// IMPORTANT: After adding this index for the first time, it may
// take up to 60 seconds for MongoDB to enforce it (background task).
otpSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: (parseInt(process.env.OTP_EXPIRES_MIN) || 10) * 60 }
);

const OTP = mongoose.models.OTP || mongoose.model('OTP', otpSchema);

module.exports = OTP;
