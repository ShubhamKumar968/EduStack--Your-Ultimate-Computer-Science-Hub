// ============================================================
// models/subject.js
// ============================================================
// PURPOSE:
//   Represents a CS/Engineering subject (e.g. DSA, DBMS, CN).
//   Each subject is a container that resources (notes, PYQs,
//   links) are attached to via their subjectId reference.
//
// WHO CAN CREATE?
//   Only admin users — enforced at the route level via
//   requireRole('admin') middleware, NOT inside this model.
//
// FIELDS:
//   name        → Subject display name  (e.g. "Data Structures & Algorithms")
//   code        → Short code            (e.g. "DSA", "DBMS")
//   description → Brief overview shown on the subject card
//   thumbnail   → Cloudinary URL for subject cover image
//   semester    → Which semester it belongs to (1–8)
//   branch      → e.g. "CSE", "IT", "ECE" — "All" means common to all branches
//   createdBy   → Reference to the admin User who created this subject
// ============================================================

const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    name: {
      type:      String,
      required:  [true, 'Subject name is required'],
      trim:      true,
      unique:    true, // No two subjects with the same name
      maxlength: [100, 'Subject name cannot exceed 100 characters'],
    },

    // Short code used for filtering / display tags
    code: {
      type:      String,
      required:  [true, 'Subject code is required'],
      trim:      true,
      uppercase: true,   // Always store as uppercase: "dsa" → "DSA"
      maxlength: [15, 'Code cannot exceed 15 characters'],
    },

    description: {
      type:      String,
      trim:      true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default:   '',
    },

    // Cloudinary secure_url or empty string
    thumbnail: {
      type:    String,
      default: '',
    },

    // Semester number (1 to 8 for a 4-year BE/BTech program)
    semester: {
      type:    Number,
      min:     [1, 'Semester must be between 1 and 8'],
      max:     [8, 'Semester must be between 1 and 8'],
      default: null,
    },

    // Target branch of engineering
    branch: {
      type:    String,
      enum:    ['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'OTHER', 'All'],
      default: 'CSE',
    },

    notesLink: {
      type:    String,
      default: '',
    },

    youtubeLink: {
      type:    String,
      default: '',
    },

    pyqLink: {
      type:    String,
      default: '',
    },

    rating: {
      type:    Number,
      default: 4.5,
    },

    // Reference to the admin who created this subject
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref:  'User',   // Tells Mongoose to populate from the User collection
    },
  },
  { timestamps: true }
);

const Subject = mongoose.models.Subject || mongoose.model('Subject', subjectSchema);

module.exports = Subject;
