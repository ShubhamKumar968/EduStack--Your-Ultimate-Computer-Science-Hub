// ============================================================
// models/resource.js
// ============================================================
// PURPOSE:
//   Represents a learning resource attached to a subject.
//
// RESOURCE TYPES & WHERE LINKS COME FROM:
//   'note'     → Google Drive / OneDrive link to a PDF/doc
//   'pyq'      → Google Drive link to a Previous Year Question paper
//   'playlist' → YouTube playlist link for a subject
//   'link'     → Any curated external link (GFG article, docs, etc.)
//   'platform' → Coding platform link (LeetCode, Codeforces, etc.)
//
// ❌ NO FILE UPLOADS — everything is a URL.
//    Students paste their Drive/YouTube links; we just store and serve them.
//    Cloudinary is NOT used here — it is only used for images
//    (user avatars → edustack_profiles, subject thumbnails → edustack_subjects).
//
// RELATIONSHIPS:
//   subject    → Many-to-one with Subject (a subject has many resources)
//   uploadedBy → Many-to-one with User    (the admin who added this)
// ============================================================

const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    // ── Display Info ───────────────────────────────────────────

    // What the resource is called on the UI card
    title: {
      type:      String,
      required:  [true, 'Resource title is required'],
      trim:      true,
      maxlength: [150, 'Title cannot exceed 150 characters'],
    },

    // Optional short description visible on the resource card
    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default:   '',
    },

    // ── Type ───────────────────────────────────────────────────
    // Tells the frontend HOW to render/label this resource
    type: {
      type:    String,
      enum:    ['note', 'pyq', 'playlist', 'link', 'platform'],
      required: [true, 'Resource type is required'],
    },

    // ── The actual link ────────────────────────────────────────
    // For ALL types this is an external URL:
    //   note/pyq  → Google Drive shareable link
    //   playlist  → YouTube playlist URL
    //   link      → GFG, official docs, blog, etc.
    //   platform  → LeetCode, HackerRank, Codeforces, etc.
    url: {
      type:     String,
      required: [true, 'Resource URL is required'],
      trim:     true,
    },

    // ── Relationships ──────────────────────────────────────────

    // Which subject does this resource belong to?
    subject: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Subject',
      required: [true, 'Resource must be linked to a subject'],
    },

    // Which admin added this resource?
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',
    },

    // ── Access Control ─────────────────────────────────────────
    // If true, only premium users can access this resource
    isPremium: {
      type:    Boolean,
      default: false,
    },

    // ── Analytics ──────────────────────────────────────────────
    // Simple view counter — incremented each time this resource is clicked
    views: {
      type:    Number,
      default: 0,
      min:     0,
    },
  },
  { timestamps: true } // auto-adds createdAt, updatedAt
);

// ── Compound Index ─────────────────────────────────────────────
// Makes queries like "all notes for subject X" fast
resourceSchema.index({ subject: 1, type: 1 });

const Resource = mongoose.models.Resource || mongoose.model('Resource', resourceSchema);

module.exports = Resource;
