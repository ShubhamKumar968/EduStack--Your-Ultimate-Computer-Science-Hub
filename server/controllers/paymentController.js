// ============================================================
// controllers/paymentController.js
// ============================================================
// PURPOSE:
//   Handles the Razorpay payment flow for EduStack Premium access.
//
// PAYMENT FLOW (2 steps):
//   Step 1 → POST /api/payments/create-order
//              Frontend calls this first.
//              We create a Razorpay order and return the orderId.
//              Frontend opens the Razorpay checkout UI with this orderId.
//
//   Step 2 → POST /api/payments/verify
//              After user pays, Razorpay gives the frontend:
//                razorpayOrderId, razorpayPaymentId, razorpaySignature
//              Frontend sends these to us.
//              We verify the HMAC signature → if valid, grant premium access.
//
// OTHER ROUTES:
//   GET /api/payments/history → User's payment history
//   GET /api/payments/key     → Returns the public Razorpay KEY_ID
//                               (safe to expose — only secret is private)
// ============================================================

const asyncHandler     = require('../utils/asyncHandler');
const { sendSuccess, sendError } = require('../utils/apiResponse');
const razorpayService  = require('../services/razorpayService');
const Payment          = require('../models/payment');
const User             = require('../models/user');

// EduStack Premium price: ₹5 for simulation purpose → stored as paise (500 paise)
const PREMIUM_PRICE_PAISE = 500;


// ============================================================
// @route   GET /api/payments/key
// @desc    Return Razorpay public key ID to the frontend
// @access  Public
// ============================================================
exports.getRazorpayKey = asyncHandler(async (req, res) => {
  // The KEY_ID is public — it's safe to expose to the browser.
  // The KEY_SECRET must NEVER be sent to the frontend.
  return sendSuccess(res, 'Razorpay key fetched.', {
    keyId: process.env.RAZORPAY_KEY_ID,
  });
});


// ============================================================
// @route   POST /api/payments/create-order
// @desc    Create a Razorpay order for Premium access
// @access  Private
// ============================================================
exports.createOrder = asyncHandler(async (req, res) => {
  // Create order via Razorpay API (handled in razorpayService)
  const order = await razorpayService.createOrder(PREMIUM_PRICE_PAISE);

  // Save the order in MongoDB with status 'created'
  // This lets us track incomplete payments (abandoned carts)
  await Payment.create({
    user:             req.user._id,
    razorpayOrderId:  order.id,
    amount:           PREMIUM_PRICE_PAISE,
    currency:         'INR',
    status:           'created',
    description:      'EduStack Premium Access',
  });

  return sendSuccess(res, 'Order created. Proceed to payment.', {
    orderId:  order.id,
    amount:   PREMIUM_PRICE_PAISE,
    currency: 'INR',
    keyId:    process.env.RAZORPAY_KEY_ID, // Frontend needs this to open checkout
  });
});


// ============================================================
// @route   POST /api/payments/verify
// @desc    Verify Razorpay payment signature and grant premium
// @access  Private
// ============================================================
exports.verifyPayment = asyncHandler(async (req, res) => {
  const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

  // ── Validate required fields ───────────────────────────────
  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    return sendError(res, 'Missing payment verification fields.', 400);
  }

  // ── Verify HMAC signature ──────────────────────────────────
  // This is the most critical step — prevents fake payment confirmations
  const isValid = razorpayService.verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!isValid) {
    // Mark the payment as failed in DB so we can investigate
    await Payment.findOneAndUpdate(
      { razorpayOrderId },
      { status: 'failed' }
    );
    return sendError(res, 'Payment verification failed. Possible fraud attempt.', 400);
  }

  // ── Signature is valid → update payment record ─────────────
  await Payment.findOneAndUpdate(
    { razorpayOrderId },
    {
      razorpayPaymentId,
      razorpaySignature,
      status: 'paid',
    }
  );

  // ── Grant Premium Access ───────────────────────────────────
  await User.findByIdAndUpdate(req.user._id, { isPremium: true });

  return sendSuccess(res, 'Payment verified! You now have Premium access.', {
    razorpayPaymentId,
    amount:   PREMIUM_PRICE_PAISE / 100, // Return in rupees for display
    currency: 'INR',
  });
});


// ============================================================
// @route   POST /api/payments/simulate
// @desc    Direct payment simulation endpoint for test mode
// @access  Private
// ============================================================
exports.simulatePayment = asyncHandler(async (req, res) => {
  const simulatedPaymentId = `pay_sim_${Date.now()}`;
  const simulatedOrderId   = `order_sim_${Date.now()}`;

  await Payment.create({
    user:             req.user._id,
    razorpayOrderId:  simulatedOrderId,
    razorpayPaymentId: simulatedPaymentId,
    amount:           PREMIUM_PRICE_PAISE,
    currency:         'INR',
    status:           'paid',
    description:      'EduStack Premium Access (Test Simulation)',
  });

  await User.findByIdAndUpdate(req.user._id, { isPremium: true });

  return sendSuccess(res, '🎉 Test payment simulated successfully! Premium access granted.', {
    razorpayPaymentId: simulatedPaymentId,
    amount:   PREMIUM_PRICE_PAISE / 100,
    currency: 'INR',
  });
});


// ============================================================
// @route   GET /api/payments/history
// @desc    Get the logged-in user's payment history
// @access  Private
// ============================================================
exports.getPaymentHistory = asyncHandler(async (req, res) => {
  const payments = await Payment.find({ user: req.user._id })
    .sort({ createdAt: -1 }); // Most recent first

  return sendSuccess(res, 'Payment history fetched.', {
    count: payments.length,
    payments,
  });
});
