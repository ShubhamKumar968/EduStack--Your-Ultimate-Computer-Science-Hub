// ============================================================
// controllers/subjectController.js
// ============================================================
// PURPOSE:
//   CRUD operations for subjects (CS/Engineering course subjects).
//   Read operations (GET) are public — anyone can browse subjects.
//   Write operations (POST/PUT/DELETE) are admin-only.
//
// ROUTES HANDLED:
//   GET    /api/subjects          → List all subjects (with filters)
//   GET    /api/subjects/:id      → Get a single subject by ID
//   POST   /api/subjects          → Create new subject (admin)
//   PUT    /api/subjects/:id      → Update subject (admin)
//   DELETE /api/subjects/:id      → Delete subject (admin)
// ============================================================

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const Subject = require('../models/subject');
const Resource = require('../models/resource');
const { cloudinary, bufferToBase64Uri } = require('../config/cloudinary');


// ============================================================
// @route   GET /api/subjects
// @desc    Get all subjects — supports filtering and search
// @access  Public
// ============================================================
exports.getAllSubjects = asyncHandler(async (req, res) => {
  const filter = {};

  if (req.query.branch)   filter.branch   = req.query.branch;
  if (req.query.semester) filter.semester = parseInt(req.query.semester);

  if (req.query.search) {
    const regex = new RegExp(req.query.search, 'i');
    filter.$or = [{ name: regex }, { code: regex }];
  }

  let subjects = await Subject.find(filter)
    .populate('createdBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return sendSuccess(res, 'Subjects fetched successfully.', {
    count: subjects.length,
    subjects,
  });
});


// ============================================================
// @route   GET /api/subjects/:id
// @desc    Get a single subject by ID, with its resource count
// @access  Public
// ============================================================
exports.getSubjectById = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id)
    .populate('createdBy', 'firstName lastName email');

  if (!subject) {
    return sendError(res, 'Subject not found.', 404);
  }

  const resourceCount = await Resource.countDocuments({ subject: subject._id });

  return sendSuccess(res, 'Subject fetched successfully.', {
    subject,
    resourceCount,
  });
});


// ============================================================
// @route   POST /api/subjects
// @desc    Create a new subject
// @access  Private + Admin only
// ============================================================
exports.createSubject = asyncHandler(async (req, res) => {
  let { name, subjectName, code, description, semester, branch, notesLink, youtubeLink, pyqLink, rating } = req.body;
  const subName = (name || subjectName || '').trim();

  if (!subName) {
    return sendError(res, 'Subject name is required.', 400);
  }

  // Generate unique code to avoid collisions between subjects
  const baseCode = (code || subName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 8)).toUpperCase() || 'SUB';
  const subCode = `${baseCode}-${Math.floor(100 + Math.random() * 900)}`;

  const fileObj = req.file || (req.files && (req.files.thumbnail?.[0] || req.files.photo?.[0]));

  let thumbnailUrl = '';
  if (fileObj) {
    try {
      const base64Uri = bufferToBase64Uri(fileObj);
      const uploaded  = await cloudinary.uploader.upload(base64Uri, {
        folder:  'edustack_subjects',
        timeout: 60000,
      });
      thumbnailUrl = uploaded.secure_url;
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary thumbnail upload warning:', cloudErr.message);
      const mime = fileObj.mimetype || 'image/png';
      thumbnailUrl = `data:${mime};base64,${fileObj.buffer.toString('base64')}`;
    }
  }

  // Look up duplicate subject strictly by exact name
  let subject = await Subject.findOne({
    name: new RegExp(`^${subName.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&')}$`, 'i')
  });

  if (subject) {
    // If subject with same name exists, update its links and description
    if (notesLink) subject.notesLink = notesLink.trim();
    if (youtubeLink) subject.youtubeLink = youtubeLink.trim();
    if (pyqLink) subject.pyqLink = pyqLink.trim();
    if (description) subject.description = description.trim();
    if (thumbnailUrl) subject.thumbnail = thumbnailUrl;
    if (branch) subject.branch = branch;
    if (semester) subject.semester = parseInt(semester);
    await subject.save();
    return sendSuccess(res, 'Subject study materials updated successfully.', { subject }, 200);
  }

  // Create new subject document
  subject = await Subject.create({
    name:        subName,
    code:        subCode,
    description: description?.trim() || '',
    semester:    semester ? parseInt(semester) : 1,
    branch:      branch || 'CSE',
    notesLink:   notesLink?.trim() || '',
    youtubeLink: youtubeLink?.trim() || '',
    pyqLink:     pyqLink?.trim() || '',
    rating:      rating ? parseFloat(rating) : 4.5,
    thumbnail:   thumbnailUrl,
    createdBy:   req.user ? req.user._id : null,
  });

  return sendSuccess(res, 'Subject created successfully.', { subject }, 201);
});


// ============================================================
// @route   PUT /api/subjects/:id
// @desc    Update a subject's details
// @access  Private + Admin only
// ============================================================
exports.updateSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return sendError(res, 'Subject not found.', 404);
  }

  const { name, subjectName, code, description, semester, branch, notesLink, youtubeLink, pyqLink, rating } = req.body;
  const subName = (name || subjectName || '').trim();

  if (subName)                      subject.name        = subName;
  if (code)                         subject.code        = code.toUpperCase().trim();
  if (description !== undefined)    subject.description = description.trim();
  if (semester)                     subject.semester    = parseInt(semester);
  if (branch)                       subject.branch      = branch;
  if (notesLink !== undefined)      subject.notesLink   = notesLink.trim();
  if (youtubeLink !== undefined)    subject.youtubeLink = youtubeLink.trim();
  if (pyqLink !== undefined)        subject.pyqLink     = pyqLink.trim();
  if (rating)                       subject.rating      = parseFloat(rating);

  const fileObj = req.file || (req.files && (req.files.thumbnail?.[0] || req.files.photo?.[0]));

  if (fileObj) {
    try {
      const base64Uri = bufferToBase64Uri(fileObj);
      const uploaded  = await cloudinary.uploader.upload(base64Uri, {
        folder:  'edustack_subjects',
        timeout: 60000,
      });
      subject.thumbnail = uploaded.secure_url;
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary thumbnail upload warning:', cloudErr.message);
      const mime = fileObj.mimetype || 'image/png';
      subject.thumbnail = `data:${mime};base64,${fileObj.buffer.toString('base64')}`;
    }
  }

  await subject.save();

  return sendSuccess(res, 'Subject updated successfully.', { subject });
});


// ============================================================
// @route   DELETE /api/subjects/:id
// @desc    Delete a subject (also deletes all its resources)
// @access  Private + Admin only
// ============================================================
exports.deleteSubject = asyncHandler(async (req, res) => {
  const subject = await Subject.findById(req.params.id);

  if (!subject) {
    return sendError(res, 'Subject not found.', 404);
  }

  // ── Cascade delete: remove all resources for this subject ──
  // Without this, orphaned Resource documents would pile up in MongoDB
  await Resource.deleteMany({ subject: subject._id });

  await subject.deleteOne();

  return sendSuccess(res, 'Subject and all its resources deleted successfully.');
});
