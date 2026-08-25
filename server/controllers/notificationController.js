// ============================================================
// controllers/notificationController.js
// ============================================================
// PURPOSE:
//   Handles broadcasting and fetching system notifications.
// ============================================================

const asyncHandler = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const Notification = require('../models/notification');

// ============================================================
// @route   POST /api/notifications
// @desc    Broadcast a new notification to all registered users
// @access  Private + Admin only
// ============================================================
exports.broadcastNotification = asyncHandler(async (req, res) => {
  const { title, message, type, link } = req.body;

  if (!title || !message) {
    return sendError(res, 'Title and message are required.', 400);
  }

  const notification = await Notification.create({
    title: title.trim(),
    message: message.trim(),
    type: type || 'announcement',
    link: link ? link.trim() : '',
    createdBy: req.user._id,
    readBy: [],
  });

  return sendSuccess(res, 'Notification broadcasted to all users successfully.', {
    notification,
  }, 201);
});

// ============================================================
// @route   GET /api/notifications
// @desc    Get all notifications for logged-in user with read status
// @access  Private
// ============================================================
exports.getNotifications = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Only fetch:
  //   1. Broadcasts → recipient is null (visible to everyone)
  //   2. Private     → recipient matches the logged-in user's ID
  const notifications = await Notification.find({
    $or: [
      { recipient: null },
      { recipient: userId },
    ],
  })
    .populate('createdBy', 'firstName lastName avatar')
    .sort({ createdAt: -1 })
    .limit(50);

  let unreadCount = 0;
  const userIdStr = userId.toString();

  const formatted = notifications.map((n) => {
    const isRead = n.readBy.some((id) => id.toString() === userIdStr);
    if (!isRead) unreadCount++;

    return {
      id: n._id,
      title: n.title,
      message: n.message,
      type: n.type,
      link: n.link,
      isRead,
      createdAt: n.createdAt,
      sender: n.createdBy ? `${n.createdBy.firstName} ${n.createdBy.lastName}` : 'EduStack Admin',
    };
  });

  return sendSuccess(res, 'Notifications fetched.', {
    unreadCount,
    notifications: formatted,
  });
});


// ============================================================
// @route   PUT /api/notifications/:id/read
// @desc    Mark a single notification as read by current user
// @access  Private
// ============================================================
exports.markAsRead = asyncHandler(async (req, res) => {
  const notification = await Notification.findById(req.params.id);

  if (!notification) {
    return sendError(res, 'Notification not found.', 404);
  }

  const userId = req.user._id;
  if (!notification.readBy.includes(userId)) {
    notification.readBy.push(userId);
    await notification.save();
  }

  return sendSuccess(res, 'Notification marked as read.');
});

// ============================================================
// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read by current user
// @access  Private
// ============================================================
exports.markAllAsRead = asyncHandler(async (req, res) => {
  const userId = req.user._id;

  // Only mark notifications this user is allowed to see
  await Notification.updateMany(
    {
      $and: [
        { readBy: { $ne: userId } },
        { $or: [{ recipient: null }, { recipient: userId }] },
      ],
    },
    { $addToSet: { readBy: userId } }
  );

  return sendSuccess(res, 'All notifications marked as read.');
});

// ============================================================
// @route   DELETE /api/notifications/:id
// @desc    Delete a notification broadcast
// @access  Private + Admin only
// ============================================================
exports.deleteNotification = asyncHandler(async (req, res) => {
  const notification = await Notification.findByIdAndDelete(req.params.id);

  if (!notification) {
    return sendError(res, 'Notification not found.', 404);
  }

  return sendSuccess(res, 'Notification deleted successfully.');
});
