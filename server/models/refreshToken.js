// ============================================================
// models/refreshToken.js
// ============================================================
// PURPOSE:
//   Stores refresh tokens in MongoDB for server-side revocation.
//   We NEVER store the raw refresh token — only a SHA-256 hash of it.
//   This way, even if the DB is breached, attackers cannot use the tokens.
//
// DESIGN DECISIONS:
//   • tokenHash  — SHA-256 of the raw JWT string (one-way, irreversible)
//   • userId     — Links the token to a user for targeted revocation
//   • expiresAt  — MongoDB TTL index auto-deletes expired tokens (30 days)
//   • isRevoked  — Manual flag for immediate invalidation (logout, password change)
//
// HOW IT WORKS:
//   1. On login → raw refresh token is generated → hash stored here
//   2. On /refresh → incoming token is hashed → compared against DB
//   3. On logout  → token document is deleted from DB (physically removed)
//   4. Token rotation → old hash deleted, new hash inserted on each refresh
//
// INTERVIEW POINT:
//   "We use DB-backed refresh tokens so we can immediately revoke them
//    on logout, password change, or suspicious activity — something
//    stateless JWTs alone cannot do."
// ============================================================

const mongoose = require('mongoose');

const refreshTokenSchema = new mongoose.Schema(
  {
    // SHA-256 hash of the raw refresh JWT — safe to store in DB
    tokenHash: {
      type:     String,
      required: true,
      index:    true, // Fast lookup on every /refresh call
    },

    // The user this refresh token belongs to
    userId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
      index:    true, // Fast lookup when revoking all tokens for a user
    },

    // When this token should expire (30 days from issuance)
    // MongoDB TTL index reads this field and auto-deletes the document
    expiresAt: {
      type:     Date,
      required: true,
    },

    // Manual revocation flag — set to true on logout or forced sign-out
    // Allows immediate invalidation before the TTL fires
    isRevoked: {
      type:    Boolean,
      default: false,
    },
  },
  {
    // createdAt tells us when the session started (useful for audit logs)
    timestamps: true,
  }
);

// ── MongoDB TTL Index ──────────────────────────────────────────
// MongoDB automatically removes documents when `expiresAt` is reached.
// expireAfterSeconds: 0 means "expire exactly at the expiresAt date".
// This keeps the collection lean without any manual cleanup job.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const RefreshToken = mongoose.models.RefreshToken ||
  mongoose.model('RefreshToken', refreshTokenSchema);

module.exports = RefreshToken;
