// ============================================================
// models/contributorRequest.js
// ============================================================
// PURPOSE:
//   Represents an application from a student to become an
//   EduStack Contributor, subject to Admin review & approval.
// ============================================================

const mongoose = require('mongoose');

const contributorRequestSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    branch: {
      type: String,
      trim: true,
      default: 'CSE',
    },

    semester: {
      type: Number,
      min: 1,
      max: 8,
      default: 1,
    },

    reason: {
      type: String,
      required: [true, 'Please provide a brief reason or planned contributions'],
      trim: true,
      maxlength: [1000, 'Reason cannot exceed 1000 characters'],
    },

    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
      index: true,
    },

    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    reviewedAt: {
      type: Date,
      default: null,
    },

    adminNote: {
      type: String,
      trim: true,
      default: '',
      maxlength: [500, 'Admin note cannot exceed 500 characters'],
    },
  },
  { timestamps: true }
);

const ContributorRequest =
  mongoose.models.ContributorRequest ||
  mongoose.model('ContributorRequest', contributorRequestSchema);

module.exports = ContributorRequest;
