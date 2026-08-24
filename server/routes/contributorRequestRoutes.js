// ============================================================
// routes/contributorRequestRoutes.js
// ============================================================
// BASE PATH (mounted in app.js): /api/contributor-requests
//
// ENDPOINT TABLE:
//   POST /api/contributor-requests            → Submit request to become contributor (isAuth)
//   GET  /api/contributor-requests/my-status  → Get own request status (isAuth)
//   GET  /api/contributor-requests            → List all requests (admin only)
//   PUT  /api/contributor-requests/:id/approve→ Approve request & promote user (admin only)
//   PUT  /api/contributor-requests/:id/reject → Reject request with feedback (admin only)
// ============================================================

const express = require('express');
const router = express.Router();

const contributorRequestController = require('../controllers/contributorRequestController');
const isAuth = require('../middlewares/isAuth');
const requireRole = require('../middlewares/requireRole');

// All routes require authentication
router.use(isAuth);

// Student endpoints
router.post('/', contributorRequestController.submitRequest);
router.get('/my-status', contributorRequestController.getMyRequestStatus);

// Admin endpoints
router.get('/', requireRole('admin'), contributorRequestController.getAllRequests);
router.put('/:id/approve', requireRole('admin'), contributorRequestController.approveRequest);
router.put('/:id/reject', requireRole('admin'), contributorRequestController.rejectRequest);

module.exports = router;
