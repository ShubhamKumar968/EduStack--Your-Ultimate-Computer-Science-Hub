// ============================================================
// controllers/contributorRequestController.js
// ============================================================
// PURPOSE:
//   Handles student applications to become an EduStack Contributor
//   and the Admin review / approval / rejection workflows.
// ============================================================

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const ContributorRequest = require('../models/contributorRequest');
const User = require('../models/user');
const Notification = require('../models/notification');

// ============================================================
// @route   POST /api/contributor-requests
// @desc    Submit a request to become a Contributor
// @access  Private (Logged-in Student/User)
// ============================================================
exports.submitRequest = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) {
    return sendError(res, 'User not found.', 404);
  }

  if (user.role === 'admin') {
    return sendSuccess(res, 'You are an Admin Host and already have full publishing access.', {
      status: 'approved',
      role: 'admin',
    });
  }

  if (user.role === 'contributor') {
    return sendSuccess(res, 'You are already an active EduStack Contributor.', {
      status: 'approved',
      role: 'contributor',
    });
  }

  const { reason, branch, semester } = req.body;

  if (!reason || !reason.trim()) {
    return sendError(res, 'Please provide a reason or summary of the materials you plan to contribute.', 400);
  }

  // Check if an existing pending request is already waiting for review
  const existingPending = await ContributorRequest.findOne({
    user: user._id,
    status: 'pending',
  });

  if (existingPending) {
    return sendError(
      res,
      'You already have a pending contributor application under review. Please wait for an admin to approve it.',
      400
    );
  }

  // If user previously had a rejected or old request, update it or create a fresh one
  const newRequest = await ContributorRequest.create({
    user: user._id,
    branch: (branch || user.branch || 'CSE').trim(),
    semester: semester ? parseInt(semester, 10) : (user.semester || 1),
    reason: reason.trim(),
    status: 'pending',
    reviewedBy: null,
    reviewedAt: null,
    adminNote: '',
  });

  // Create a private alert notification for Admin only
  try {
    // Find any admin to set as recipient (private admin-only notification)
    const adminUser = await User.findOne({ role: 'admin' }).select('_id').lean();
    await Notification.create({
      title: '📩 New Contributor Request',
      message: `${user.firstName} ${user.lastName} (${user.email}) requested to become an EduStack Contributor for ${branch || user.branch || 'CSE'} Sem ${semester || user.semester || 1}.`,
      type: 'alert',
      link: '/admin/contributor-requests.html',
      createdBy: user._id,
      recipient: adminUser ? adminUser._id : null, // private to admin; fallback broadcast if no admin found
      readBy: [],
    });
  } catch (notifErr) {
    console.warn('⚠️ Could not create request notification:', notifErr.message);
  }

  return sendSuccess(
    res,
    '🎉 Contributor application submitted successfully! Our admin team will review it shortly.',
    { request: newRequest },
    201
  );
});

// ============================================================
// @route   GET /api/contributor-requests/my-status
// @desc    Check logged-in user's latest contributor application status
// @access  Private
// ============================================================
exports.getMyRequestStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('firstName lastName email role branch semester avatar');
  if (!user) {
    return sendError(res, 'User not found.', 404);
  }

  const isContributor = user.role === 'contributor' || user.role === 'admin';

  const latestRequest = await ContributorRequest.findOne({ user: user._id })
    .sort({ createdAt: -1 })
    .populate('reviewedBy', 'firstName lastName email');

  return sendSuccess(res, 'Contributor request status fetched.', {
    user: {
      id: user._id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      role: user.role,
      branch: user.branch,
      semester: user.semester,
    },
    isContributor,
    request: latestRequest,
  });
});

// ============================================================
// @route   GET /api/contributor-requests
// @desc    Get all contributor requests with filters and counts (Admin only)
// @access  Private + Admin only
// ============================================================
exports.getAllRequests = asyncHandler(async (req, res) => {
  const status = (req.query.status || 'all').toLowerCase();
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 20;
  const skip = (page - 1) * limit;
  const search = (req.query.search || '').trim().toLowerCase();

  const filter = {};
  if (status && status !== 'all' && ['pending', 'approved', 'rejected'].includes(status)) {
    filter.status = status;
  }

  // Aggregate summary counts across all statuses
  const [pendingCount, approvedCount, rejectedCount, totalCount] = await Promise.all([
    ContributorRequest.countDocuments({ status: 'pending' }),
    ContributorRequest.countDocuments({ status: 'approved' }),
    ContributorRequest.countDocuments({ status: 'rejected' }),
    ContributorRequest.countDocuments(),
  ]);

  let query = ContributorRequest.find(filter)
    .populate('user', 'firstName lastName email avatar role branch semester createdAt')
    .populate('reviewedBy', 'firstName lastName email')
    .sort({ createdAt: -1 });

  let allResults = await query.lean();

  // Filter by search string in user name or email if specified
  if (search) {
    allResults = allResults.filter((item) => {
      const user = item.user;
      if (!user) return false;
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.toLowerCase();
      const email = (user.email || '').toLowerCase();
      return fullName.includes(search) || email.includes(search);
    });
  }

  const totalFiltered = allResults.length;
  const paginatedRequests = allResults.slice(skip, skip + limit);

  return sendSuccess(res, 'Contributor requests fetched successfully.', {
    counts: {
      pending: pendingCount,
      approved: approvedCount,
      rejected: rejectedCount,
      total: totalCount,
    },
    total: totalFiltered,
    page,
    totalPages: Math.ceil(totalFiltered / limit) || 1,
    requests: paginatedRequests,
  });
});

// ============================================================
// @route   PUT /api/contributor-requests/:id/approve
// @desc    Approve a contributor request & elevate student to Contributor
// @access  Private + Admin only
// ============================================================
exports.approveRequest = asyncHandler(async (req, res) => {
  const request = await ContributorRequest.findById(req.params.id);
  if (!request) {
    return sendError(res, 'Contributor request not found.', 404);
  }

  const targetUser = await User.findById(request.user);
  if (!targetUser) {
    return sendError(res, 'User associated with this request was not found.', 404);
  }

  // Update target user's role to contributor
  if (targetUser.role !== 'admin') {
    targetUser.role = 'contributor';
    await targetUser.save();
  }

  // Update request document
  request.status = 'approved';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.adminNote = req.body.adminNote ? req.body.adminNote.trim() : 'Approved by Admin';
  await request.save();

  // Create a private notification for the approved student only
  try {
    await Notification.create({
      title: '🎉 Contributor Request Approved!',
      message: `Congratulations ${targetUser.firstName || 'Student'}! Your application to become an EduStack Contributor has been approved. You can now upload study notes, PYQs, and lecture materials directly from the Contributor Hub.`,
      type: 'update',
      link: '/contribute.html',
      createdBy: req.user._id,
      recipient: targetUser._id,  // private — only the approved student sees this
      readBy: [],
    });
  } catch (notifErr) {
    console.warn('⚠️ Could not create notification on contributor approval:', notifErr.message);
  }

  return sendSuccess(res, `🎉 ${targetUser.firstName} ${targetUser.lastName} has been approved as an EduStack Contributor!`, {
    requestId: request._id,
    userId: targetUser._id,
    role: targetUser.role,
    status: request.status,
  });
});

// ============================================================
// @route   PUT /api/contributor-requests/:id/reject
// @desc    Reject a contributor request with feedback
// @access  Private + Admin only
// ============================================================
exports.rejectRequest = asyncHandler(async (req, res) => {
  const request = await ContributorRequest.findById(req.params.id);
  if (!request) {
    return sendError(res, 'Contributor request not found.', 404);
  }

  const targetUser = await User.findById(request.user);

  request.status = 'rejected';
  request.reviewedBy = req.user._id;
  request.reviewedAt = new Date();
  request.adminNote = (req.body.reason || req.body.adminNote || 'Application declined by admin.').trim();
  await request.save();

  // Create a private notification for the rejected student only
  try {
    await Notification.create({
      title: '📋 Contributor Application Update',
      message: `Hello ${targetUser ? targetUser.firstName : 'Student'}, your contributor request has been reviewed. Feedback: "${request.adminNote}"`,
      type: 'alert',
      link: '/contribute.html',
      createdBy: req.user._id,
      recipient: targetUser ? targetUser._id : null,  // private — only the rejected student sees this
      readBy: [],
    });
  } catch (notifErr) {
    console.warn('⚠️ Could not create reject notification:', notifErr.message);
  }

  return sendSuccess(res, 'Contributor application has been rejected.', {
    requestId: request._id,
    userId: targetUser ? targetUser._id : null,
    status: request.status,
    adminNote: request.adminNote,
  });
});
