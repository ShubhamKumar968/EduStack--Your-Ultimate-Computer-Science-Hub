// ============================================================
// controllers/enrollmentController.js
// ============================================================
// PURPOSE:
//   Manages user subject enrollments in MongoDB.
//
// ROUTES HANDLED:
//   GET    /api/enrollments                    → Get logged-in user's enrollments
//   POST   /api/enrollments/:subjectId         → Enroll in a subject
//   DELETE /api/enrollments/:subjectId         → Unenroll from a subject
//   GET    /api/enrollments/check/:subjectId   → Check enrollment status
// ============================================================

const mongoose = require('mongoose');
const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const Enrollment = require('../models/enrollment');
const Subject    = require('../models/subject');

// Helper to resolve Subject by ObjectId or Subject Name/Code
async function findSubjectByIdOrName(key) {
  if (!key) return null;
  if (mongoose.Types.ObjectId.isValid(key)) {
    const sub = await Subject.findById(key);
    if (sub) return sub;
  }
  return Subject.findOne({
    $or: [
      { name: new RegExp(`^${key}$`, 'i') },
      { code: key.toUpperCase() }
    ]
  });
}

// ============================================================
// @route   GET /api/enrollments
// @desc    Get all enrolled subjects for the logged-in user
// @access  Private
// ============================================================
exports.getEnrollments = asyncHandler(async (req, res) => {
  const enrollments = await Enrollment.find({ user: req.user._id })
    .populate('subject')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'Enrollments fetched successfully.', {
    count: enrollments.length,
    enrollments,
  });
});

// ============================================================
// @route   POST /api/enrollments/:subjectId
// @desc    Enroll logged-in user in a subject
// @access  Private
// ============================================================
exports.enrollSubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const subject = await findSubjectByIdOrName(subjectId);
  if (!subject) {
    return sendError(res, 'Subject not found.', 404);
  }

  // Check if already enrolled
  const existing = await Enrollment.findOne({
    user: req.user._id,
    subject: subject._id,
  });

  if (existing) {
    return sendSuccess(res, 'Already enrolled in this subject.', { enrollment: existing });
  }

  const enrollment = await Enrollment.create({
    user: req.user._id,
    subject: subject._id,
  });

  // Populate subject details in response
  await enrollment.populate('subject');

  return sendSuccess(res, 'Successfully enrolled in subject.', { enrollment }, 201);
});

// ============================================================
// @route   DELETE /api/enrollments/:subjectId
// @desc    Unenroll logged-in user from a subject
// @access  Private
// ============================================================
exports.unenrollSubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const subject = await findSubjectByIdOrName(subjectId);
  const targetSubjectId = subject ? subject._id : (mongoose.Types.ObjectId.isValid(subjectId) ? subjectId : null);

  if (!targetSubjectId) {
    return sendError(res, 'Subject not found.', 404);
  }

  const enrollment = await Enrollment.findOneAndDelete({
    user: req.user._id,
    subject: targetSubjectId,
  });

  if (!enrollment) {
    return sendError(res, 'You are not enrolled in this subject.', 404);
  }

  return sendSuccess(res, 'Successfully unenrolled from subject.');
});

// ============================================================
// @route   GET /api/enrollments/check/:subjectId
// @desc    Check if logged-in user is enrolled in a specific subject
// @access  Private
// ============================================================
exports.checkEnrollment = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  const subject = await findSubjectByIdOrName(subjectId);
  const targetSubjectId = subject ? subject._id : (mongoose.Types.ObjectId.isValid(subjectId) ? subjectId : null);

  if (!targetSubjectId) {
    return sendSuccess(res, 'Enrollment checked.', { isEnrolled: false });
  }

  const exists = await Enrollment.exists({
    user: req.user._id,
    subject: targetSubjectId,
  });

  return sendSuccess(res, 'Enrollment checked.', { isEnrolled: !!exists });
});
