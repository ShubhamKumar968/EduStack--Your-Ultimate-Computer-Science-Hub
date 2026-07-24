// ============================================================
// models/user.js
// ============================================================
// PURPOSE:
//   Defines the Mongoose schema and model for a User document.
//   Supports two registration flows:
//     1. Local (email + password)   → password is bcrypt-hashed
//     2. Google OAuth               → googleId is stored, no password
//
// ROLES:
//   'user'  → Regular student (default)
//   'admin' → Can create/manage subjects and resources
//
// KEY DESIGN DECISIONS:
//   • password is marked `select: false` — it is NEVER returned in
//     queries by default (prevents accidental leaks to the frontend).
//   • isVerified must be true before a user can log in (enforced in
//     authController). Email OTP verification sets it to true.
//   • avatar stores a Cloudinary URL (or default string).
//   • timestamps: true auto-adds createdAt and updatedAt fields.
// ============================================================

const mongoose = require('mongoose');
const bcrypt   = require('bcryptjs');

// ── Schema Definition ──────────────────────────────────────

const userSchema = new mongoose.Schema(
  {
    // ── Identity ──────────────────────────────────────────
    firstName: {
      type:     String,
      required: [true, 'First name is required'],
      trim:     true,
      maxlength: [50, 'First name cannot exceed 50 characters'],
    },

    lastName: {
      type:     String,
      required: [true, 'Last name is required'],
      trim:     true,
      maxlength: [50, 'Last name cannot exceed 50 characters'],
    },

    email: {
      type:      String,
      required:  [true, 'Email is required'],
      unique:    true,          // MongoDB unique index → duplicate insert fails fast
      lowercase: true,          // Always store lowercase (prevents case-mismatch duplicates)
      trim:      true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please enter a valid email address',
      ],
    },

    // ── Authentication ─────────────────────────────────────

    // select:false means password is NOT included in query results unless
    // explicitly requested with .select('+password').  Prevents leaks.
    password: {
      type:     String,
      select:   false,
      minlength: [6, 'Password must be at least 6 characters'],
    },

    // Stores Google OAuth user ID for social login.
    // null for local-auth users.
    googleId: {
      type:    String,
      default: null,
    },

    // ── Role & Status ──────────────────────────────────────

    role: {
      type:    String,
      enum:    ['user', 'student', 'contributor', 'admin'],  // 'user' / 'student' (default student/user), 'contributor', 'admin'
      default: 'user',
    },

    // isVerified is set to false on registration.
    // The OTP email flow sets it to true.
    // Login is blocked if isVerified === false.
    isVerified: {
      type:    Boolean,
      default: false,
    },

    // Premium access flag for DSA sheet and premium features
    isPremium: {
      type:    Boolean,
      default: false,
    },

    // ── Profile ────────────────────────────────────────────

    avatar: {
      type:    String,
      default: 'default-avatar.png', // Fallback; frontend maps this to a local image
    },

    // Optional fields students may fill in their profile
    phoneNumber: {
      type:  String,
      trim:  true,
      default: null,
    },

    bio: {
      type:     String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: '',
    },
  },
  {
    // Automatically adds createdAt and updatedAt fields
    timestamps: true,
  }
);

// ── Pre-Save Hook: Enforce One-Way Bcrypt Hashing ─────────────
// Guarantees passwords are ALWAYS stored as one-way salted bcrypt hashes.
// Never stored in plain-text or reversible encryption.
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();

  // If password is not already a bcrypt hash ($2a$ or $2b$), hash it with 12 salt rounds
  if (!this.password.startsWith('$2a$') && !this.password.startsWith('$2b$')) {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
  }
  next();
});

// ── Instance Method: comparePassword ─────────────────────────
// Used in authController to verify login passwords.
// We put this logic on the model so controllers stay clean.
//
// NOTE: We must use a regular function (not arrow function) here
// because `this` must refer to the user document instance.
userSchema.methods.comparePassword = async function (candidatePassword) {
  // `this.password` is the stored bcrypt hash
  return bcrypt.compare(candidatePassword, this.password);
};

// ── Virtual: fullName ─────────────────────────────────────────
// A virtual is a computed field NOT stored in MongoDB.
// Useful for quick display without changing the schema.
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

// ── Model Export ──────────────────────────────────────────────
// Mongoose prevents re-compiling a model that already exists
// (important in hot-reload dev environments).
const User = mongoose.models.User || mongoose.model('User', userSchema);

module.exports = User;
