// ============================================================
// models/favourite.js
// ============================================================
// PURPOSE:
//   Tracks which resources a user has bookmarked/favourited.
//   Each document represents ONE bookmark: user ↔ resource.
//
// DESIGN DECISIONS:
//   • Compound unique index on { user, resource } prevents a user
//     from bookmarking the same resource more than once.
//   • To get all favourites of a user:
//       Favourite.find({ user: userId }).populate('resource')
//   • To check if a specific resource is favourited by user:
//       Favourite.findOne({ user: userId, resource: resourceId })
//   • To remove a favourite:
//       Favourite.findOneAndDelete({ user: userId, resource: resourceId })
// ============================================================

const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema(
  {
    // The user who bookmarked the resource
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // The resource that was bookmarked
    resource: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Resource',
      required: true,
    },
  },
  { timestamps: true } // createdAt tells us when it was bookmarked
);

// ── Unique Compound Index ──────────────────────────────────
// Ensures each (user, resource) pair is unique — no duplicate bookmarks.
// MongoDB will throw a duplicate-key error if you try to insert twice;
// the controller catches this and returns a clean 409 response.
favouriteSchema.index({ user: 1, resource: 1 }, { unique: true });

const Favourite = mongoose.models.Favourite || mongoose.model('Favourite', favouriteSchema);

module.exports = Favourite;
