// ============================================================
// routes/notificationRoutes.js
// ============================================================
// BASE PATH (mounted in app.js): /api/notifications
// ============================================================

const express = require('express');
const router = express.Router();

const notificationController = require('../controllers/notificationController');
const isAuth = require('../middlewares/isAuth');
const requireRole = require('../middlewares/requireRole');

// All notification routes require authentication
router.use(isAuth);

// User notification routes
router.get('/', notificationController.getNotifications);
router.put('/read-all', notificationController.markAllAsRead);
router.put('/:id/read', notificationController.markAsRead);

// Admin-only notification routes
router.post('/', requireRole('admin'), notificationController.broadcastNotification);
router.delete('/:id', requireRole('admin'), notificationController.deleteNotification);

module.exports = router;
