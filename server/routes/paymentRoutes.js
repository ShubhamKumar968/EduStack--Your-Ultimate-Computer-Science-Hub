// ============================================================
// routes/paymentRoutes.js
// ============================================================
// BASE PATH (mounted in app.js): /api/payments
//
// ENDPOINT TABLE:
//   GET  /api/payments/key             → Get Razorpay public key  (public)
//   POST /api/payments/create-order    → Create Razorpay order    (private)
//   POST /api/payments/verify          → Verify payment & unlock  (private)
//   GET  /api/payments/history         → My payment history       (private)
// ============================================================

const express = require('express');
const router  = express.Router();

const paymentController = require('../controllers/paymentController');
const isAuth            = require('../middlewares/isAuth');

// Public: frontend needs the key to open Razorpay checkout
router.get('/key', paymentController.getRazorpayKey);

// Private routes
router.use(isAuth);
router.post('/create-order', paymentController.createOrder);
router.post('/verify',       paymentController.verifyPayment);
router.post('/simulate',     paymentController.simulatePayment);
router.get('/history',       paymentController.getPaymentHistory);

module.exports = router;
