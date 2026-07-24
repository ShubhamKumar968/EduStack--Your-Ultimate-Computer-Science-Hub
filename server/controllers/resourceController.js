// ============================================================
// controllers/resourceController.js
// ============================================================
// PURPOSE:
//   CRUD for learning resources (Drive links for notes/PYQs, YouTube playlists, external links).
//   All resources are URL-based (no Cloudinary file uploads for resources).
//
// ROUTES HANDLED:
//   GET    /api/resources                → All resources (filterable)
//   GET    /api/resources/:id            → Single resource
//   GET    /api/resources/subject/:subId → All resources for a subject
//   POST   /api/resources                → Create resource (admin)
//   PUT    /api/resources/:id            → Update resource (admin)
//   DELETE /api/resources/:id            → Delete resource (admin)
// ============================================================

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const Resource = require('../models/resource');
const Subject  = require('../models/subject');

// ============================================================
// @route   GET /api/resources
// @desc    Get all resources with optional filters
// @access  Public
// ============================================================
exports.getAllResources = asyncHandler(async (req, res) => {
  const filter = {};

  // Filter by type: ?type=note | pyq | playlist | link | platform
  if (req.query.type)    filter.type    = req.query.type;

  // Filter by subject ID: ?subject=<mongoId>
  if (req.query.subject) filter.subject = req.query.subject;

  // Filter by premium: ?isPremium=true
  if (req.query.isPremium !== undefined) {
    filter.isPremium = req.query.isPremium === 'true';
  }

  // Text search in title
  if (req.query.search) {
    filter.title = new RegExp(req.query.search, 'i');
  }

  // Pagination
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip  = (page - 1) * limit;

  const [resources, total] = await Promise.all([
    Resource.find(filter)
      .populate('subject', 'name code')
      .populate('uploadedBy', 'firstName lastName')
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 }),
    Resource.countDocuments(filter),
  ]);

  return sendSuccess(res, 'Resources fetched.', {
    total,
    page,
    totalPages: Math.ceil(total / limit),
    resources,
  });
});

// ============================================================
// @route   GET /api/resources/subject/:subjectId
// @desc    Get all resources for a specific subject
// @access  Public
// ============================================================
exports.getResourcesBySubject = asyncHandler(async (req, res) => {
  const { subjectId } = req.params;

  // Verify the subject actually exists
  const subject = await Subject.findById(subjectId);
  if (!subject) {
    return sendError(res, 'Subject not found.', 404);
  }

  // Optional type filter: /subject/:id?type=note
  const filter = { subject: subjectId };
  if (req.query.type) filter.type = req.query.type;

  const resources = await Resource.find(filter)
    .populate('uploadedBy', 'firstName lastName')
    .sort({ createdAt: -1 });

  return sendSuccess(res, `Resources for "${subject.name}" fetched.`, {
    subject: { id: subject._id, name: subject.name, code: subject.code },
    count: resources.length,
    resources,
  });
});

// ============================================================
// @route   GET /api/resources/:id
// @desc    Get a single resource by ID (also increments view count)
// @access  Public
// ============================================================
exports.getResourceById = asyncHandler(async (req, res) => {
  const resource = await Resource.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  )
    .populate('subject',    'name code')
    .populate('uploadedBy', 'firstName lastName');

  if (!resource) {
    return sendError(res, 'Resource not found.', 404);
  }

  return sendSuccess(res, 'Resource fetched.', { resource });
});

// ============================================================
// @route   POST /api/resources
// @desc    Create a new resource link
// @access  Private + Admin only
// ============================================================
exports.createResource = asyncHandler(async (req, res) => {
  const { title, description, type, subject, branch, isPremium, url } = req.body;

  if (!subject) {
    return sendError(res, 'Subject is required.', 400);
  }

  const mongoose = require('mongoose');
  let subjectDoc = null;

  if (mongoose.Types.ObjectId.isValid(subject)) {
    subjectDoc = await Subject.findById(subject);
  }

  if (!subjectDoc) {
    const subName = subject.toString().trim();
    subjectDoc = await Subject.findOne({
      $or: [
        { name: new RegExp(`^${subName}$`, 'i') },
        { code: subName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase() }
      ]
    });

    // Auto-create subject if it does not exist yet in database
    if (!subjectDoc) {
      const code = subName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 10).toUpperCase() || 'GENERIC';
      try {
        subjectDoc = await Subject.create({
          name: subName,
          code,
          branch: branch || 'CSE',
          semester: 1,
          description: `Subject created for resource: ${title}`,
          createdBy: req.user._id,
        });
      } catch (subErr) {
        subjectDoc = await Subject.findOne();
      }
    }
  }

  const resource = await Resource.create({
    title:       title.trim(),
    description: description?.trim() || '',
    type,
    subject:     subjectDoc._id,
    url:         url.trim(),
    isPremium:   isPremium === true || isPremium === 'true',
    uploadedBy:  req.user._id,
  });

  return sendSuccess(res, 'Resource created successfully.', { resource, subject: subjectDoc }, 201);
});

// ============================================================
// @route   PUT /api/resources/:id
// @desc    Update a resource's details/URL
// @access  Private + Admin only
// ============================================================
exports.updateResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return sendError(res, 'Resource not found.', 404);
  }

  const { title, description, type, isPremium, url } = req.body;

  if (title       !== undefined) resource.title       = title.trim();
  if (description !== undefined) resource.description = description.trim();
  if (type        !== undefined) resource.type        = type;
  if (isPremium   !== undefined) resource.isPremium   = isPremium === true || isPremium === 'true';
  if (url         !== undefined) resource.url         = url.trim();

  await resource.save();

  return sendSuccess(res, 'Resource link updated successfully.', { resource });
});

// ============================================================
// @route   DELETE /api/resources/:id
// @desc    Delete a resource link
// @access  Private + Admin only
// ============================================================
exports.deleteResource = asyncHandler(async (req, res) => {
  const resource = await Resource.findById(req.params.id);

  if (!resource) {
    return sendError(res, 'Resource not found.', 404);
  }

  await resource.deleteOne();

  return sendSuccess(res, 'Resource link deleted successfully.');
});
