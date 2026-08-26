// ============================================================
// controllers/userController.js
// ============================================================
// PURPOSE:
//   Handles user profile management — viewing and updating profile
//   details and avatar. All routes are private (require isAuth).
//
// ROUTES HANDLED:
//   GET    /api/users/profile          → Get own profile
//   PUT    /api/users/profile          → Update own profile details
//   PUT    /api/users/avatar           → Upload / update profile picture
//   GET    /api/users                  → List all users (admin only)
// ============================================================

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const User = require('../models/user');
const { cloudinary, bufferToBase64Uri } = require('../config/cloudinary');


// ============================================================
// @route   GET /api/users/profile
// @desc    Get the logged-in user's own profile
// @access  Private
// ============================================================
exports.getProfile = asyncHandler(async (req, res) => {
  // req.user is already attached by isAuth — safe to use directly
  const user = req.user;

  return sendSuccess(res, 'Profile fetched successfully.', {
    user: {
      id:          user._id,
      firstName:   user.firstName,
      lastName:    user.lastName,
      email:       user.email,
      role:        user.role,
      avatar:      user.avatar,
      phoneNumber: user.phoneNumber,
      branch:      user.branch || 'CSE',
      semester:    user.semester || 1,
      bio:         user.bio,
      createdAt:   user.createdAt,
    },
  });
});


// ============================================================
// @route   PUT /api/users/profile (or /api/users/me)
// @desc    Update own profile details (name, phone, bio, branch, semester, avatar)
// @access  Private
// ============================================================
exports.updateProfile = asyncHandler(async (req, res) => {
  const { firstName, lastName, phoneNumber, phone, bio, branch, semester, newPassword } = req.body;

  const updates = {};
  if (firstName !== undefined && firstName !== '') updates.firstName   = firstName.trim();
  if (lastName  !== undefined && lastName !== '')  updates.lastName    = lastName.trim();
  if (phoneNumber !== undefined) updates.phoneNumber = phoneNumber.trim();
  if (phone       !== undefined && phoneNumber === undefined) updates.phoneNumber = phone.trim();
  if (bio         !== undefined) updates.bio         = bio.trim();
  if (branch      !== undefined && branch !== '')  updates.branch      = branch.trim();
  if (semester    !== undefined && semester !== '') updates.semester    = parseInt(semester, 10);

  if (newPassword && newPassword.trim().length >= 6) {
    const bcrypt = require('bcryptjs');
    updates.password = await bcrypt.hash(newPassword.trim(), 12);
  }

  // If a profile picture file is uploaded with the profile form
  if (req.file) {
    try {
      const base64Uri = bufferToBase64Uri(req.file);
      const result = await cloudinary.uploader.upload(base64Uri, {
        folder: 'edustack_profiles',
        transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
        timeout: 60000,
      });
      updates.avatar = result.secure_url;
    } catch (cloudErr) {
      console.warn('⚠️ Cloudinary upload warning, using inline data URI fallback:', cloudErr.message);
      // Fallback: convert directly to base64 Data URI so avatar upload never fails
      const mime = req.file.mimetype || 'image/jpeg';
      updates.avatar = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
    }
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    updates,
    { new: true, runValidators: true }
  );

  if (!updatedUser) {
    return sendError(res, 'User not found.', 404);
  }

  return sendSuccess(res, 'Profile updated successfully.', {
    user: {
      id:          updatedUser._id,
      firstName:   updatedUser.firstName,
      lastName:    updatedUser.lastName,
      email:       updatedUser.email,
      role:        updatedUser.role,
      avatar:      updatedUser.avatar,
      phoneNumber: updatedUser.phoneNumber,
      branch:      updatedUser.branch || 'CSE',
      semester:    updatedUser.semester || 1,
      bio:         updatedUser.bio,
      isPremium:   updatedUser.isPremium || false,
    },
  });
});


// ============================================================
// @route   PUT /api/users/avatar
// @desc    Upload or replace the user's profile picture
// @access  Private
// ============================================================
exports.updateAvatar = asyncHandler(async (req, res) => {
  if (!req.file) {
    return sendError(res, 'No image file provided.', 400);
  }

  let avatarUrl = '';
  try {
    const base64Uri = bufferToBase64Uri(req.file);
    const result = await cloudinary.uploader.upload(base64Uri, {
      folder:         'edustack_profiles',
      transformation: [{ width: 400, height: 400, crop: 'fill', gravity: 'face' }],
      timeout: 60000,
    });
    avatarUrl = result.secure_url;
  } catch (cloudErr) {
    console.warn('⚠️ Cloudinary upload warning, using inline data URI fallback:', cloudErr.message);
    const mime = req.file.mimetype || 'image/jpeg';
    avatarUrl = `data:${mime};base64,${req.file.buffer.toString('base64')}`;
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { avatar: avatarUrl },
    { new: true }
  );

  return sendSuccess(res, 'Profile picture updated.', {
    avatar: updatedUser.avatar,
  });
});


// ============================================================
// @route   GET /api/users
// @desc    List all registered users (admin dashboard)
// @access  Private + Admin only
// ============================================================
exports.getAllUsers = asyncHandler(async (req, res) => {
  // Pagination via query params: ?page=1&limit=20
  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 20;
  const skip  = (page - 1) * limit;

  // .select('-password') is redundant (select:false in schema) but
  // explicit is always better than implicit for security-critical fields
  const [users, total] = await Promise.all([
    User.find().select('-password').skip(skip).limit(limit).sort({ createdAt: -1 }),
    User.countDocuments(),
  ]);

  return sendSuccess(res, 'Users fetched successfully.', {
    total,
    page,
    totalPages: Math.ceil(total / limit),
    users,
  });
});

// ============================================================
// @route   PUT /api/users/become-contributor
// @desc    Upgrade logged-in student account to Contributor
// @access  Private — requires admin approval flag verified server-side
// ============================================================
exports.becomeContributor = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);

  if (!user) {
    return sendError(res, 'User not found.', 404);
  }

  if (user.role === 'admin') {
    return sendSuccess(res, 'You are already an Admin Host.', { role: user.role });
  }

  if (user.role === 'contributor') {
    return sendSuccess(res, 'You are already a Contributor.', { role: user.role });
  }

  // Security: Only allow promotion if the *requesting* user is an admin,
  // OR if a valid admin-signed approval token is provided in the body.
  // Regular users cannot self-promote via this endpoint.
  if (req.user.role !== 'admin') {
    return sendError(
      res,
      'Contributor promotion requires admin approval. Please contact an admin.',
      403
    );
  }

  // Admin is promoting a user (could be themselves if they somehow get here, but handled above)
  const targetId = req.body.userId || req.user._id;
  const targetUser = await User.findById(targetId);

  if (!targetUser) {
    return sendError(res, 'Target user not found.', 404);
  }

  if (targetUser.role === 'admin') {
    return sendSuccess(res, 'User is already an Admin.', { role: targetUser.role });
  }

  targetUser.role = 'contributor';
  await targetUser.save();

  return sendSuccess(res, '🎉 User has been promoted to EduStack Contributor.', {
    role: targetUser.role,
    userId: targetUser._id,
  });
});


// ============================================================
// @route   PUT /api/users/dsa-progress
// @desc    Save the current user's DSA solved count to the DB.
//          Called from the frontend whenever the user marks /
//          un-marks a problem. Keeps the global leaderboard in sync.
// @access  Private
// ============================================================
exports.updateDsaProgress = asyncHandler(async (req, res) => {
  const { solvedCount } = req.body;

  if (typeof solvedCount !== 'number' || solvedCount < 0) {
    return sendError(res, 'solvedCount must be a non-negative number.', 400);
  }

  const updatedUser = await User.findByIdAndUpdate(
    req.user._id,
    { dsaSolvedCount: solvedCount },
    { new: true }
  );

  if (!updatedUser) {
    return sendError(res, 'User not found.', 404);
  }

  return sendSuccess(res, 'DSA progress saved.', {
    dsaSolvedCount: updatedUser.dsaSolvedCount,
  });
});


// ============================================================
// @route   GET /api/users/leaderboard
// @desc    Return top 10 users ranked by DSA solved count.
//          Public — no auth required so the card shows even for
//          logged-out visitors (without revealing emails).
// @access  Public
// ============================================================
exports.getLeaderboard = asyncHandler(async (req, res) => {
  // Only expose safe, non-PII fields
  const topUsers = await User
    .find({ dsaSolvedCount: { $gt: 0 } })
    .select('firstName lastName avatar dsaSolvedCount')
    .sort({ dsaSolvedCount: -1 })
    .limit(10)
    .lean();

  const board = topUsers.map(u => ({
    id:     u._id,
    name:   `${u.firstName} ${u.lastName ? u.lastName[0] + '.' : ''}`.trim(),
    avatar: u.avatar || null,
    solved: u.dsaSolvedCount,
  }));

  return sendSuccess(res, 'Leaderboard fetched.', { board });
});
