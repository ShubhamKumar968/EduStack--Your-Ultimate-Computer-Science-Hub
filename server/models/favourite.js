// ============================================================
// models/favourite.js
// ============================================================
// PURPOSE:
//   Tracks which subjects or resources a user has bookmarked.
//   Each document represents ONE bookmark: user ↔ resource OR user ↔ subject.
// ============================================================

const mongoose = require('mongoose');

const favouriteSchema = new mongoose.Schema(
  {
    // The user who bookmarked the item
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // The resource that was bookmarked (optional)
    resource: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Resource',
      default:  null,
    },

    // The subject that was bookmarked (optional)
    subject: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Subject',
      default:  null,
    },
  },
  { timestamps: true }
);

// Ensure at least one reference is provided
favouriteSchema.pre('validate', function (next) {
  if (!this.resource && !this.subject) {
    return next(new Error('Favourite must refer to either a Resource or a Subject.'));
  }
  next();
});

// Indexes for fast lookups
favouriteSchema.index({ user: 1, resource: 1 }, { sparse: true });
favouriteSchema.index({ user: 1, subject: 1 }, { sparse: true });

const Favourite = mongoose.models.Favourite || mongoose.model('Favourite', favouriteSchema);

module.exports = Favourite;
