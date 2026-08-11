// ============================================================
// models/enrollment.js
// ============================================================
// PURPOSE:
//   Tracks student / admin enrollments in CS & Engineering subjects.
//   Each document represents ONE active enrollment: user ↔ subject.
//
// DESIGN DECISIONS:
//   • Compound unique index on { user, subject } prevents a user
//     from enrolling in the same subject more than once.
//   • To get all enrollments of a user:
//       Enrollment.find({ user: userId }).populate('subject')
//   • To check if a user is enrolled in a subject:
//       Enrollment.findOne({ user: userId, subject: subjectId })
// ============================================================

const mongoose = require('mongoose');

const enrollmentSchema = new mongoose.Schema(
  {
    // The user who enrolled in the subject
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // The subject the user enrolled in
    subject: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Subject',
      required: true,
    },
  },
  { timestamps: true } // auto-adds createdAt (enrolledAt) and updatedAt
);

// ── Unique Compound Index ──────────────────────────────────
// Prevents duplicate enrollment documents for the same user and subject
enrollmentSchema.index({ user: 1, subject: 1 }, { unique: true });

const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);

module.exports = Enrollment;
