// ============================================================
// models/notification.js
// ============================================================
// PURPOSE:
//   Represents notifications in EduStack.
//   recipient = null  → broadcast (shown to ALL logged-in users)
//   recipient = userId → private (shown ONLY to that specific user)
// ============================================================

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [120, 'Title cannot exceed 120 characters'],
    },

    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [1000, 'Message cannot exceed 1000 characters'],
    },

    type: {
      type: String,
      enum: ['announcement', 'alert', 'update', 'system'],
      default: 'announcement',
    },

    link: {
      type: String,
      default: '',
      trim: true,
    },

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // null = broadcast to ALL users
    // userId = private notification for ONE specific user only
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // Array of User ObjectIds who have read/dismissed this notification
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

const Notification = mongoose.models.Notification || mongoose.model('Notification', notificationSchema);

module.exports = Notification;
