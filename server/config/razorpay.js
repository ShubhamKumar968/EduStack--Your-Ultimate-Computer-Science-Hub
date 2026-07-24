// ============================================================
// config/razorpay.js
// ============================================================
// PURPOSE:
//   Creates and exports a single Razorpay SDK instance using
//   the API key and secret stored in .env
//
//   This instance is used by:
//     services/razorpayService.js  → createOrder, verifySignature
//     controllers/paymentController.js → route handlers
//
// TEST vs LIVE:
//   • RAZORPAY_KEY_ID = rzp_test_... → Test mode (no real money)
//   • RAZORPAY_KEY_ID = rzp_live_... → Live mode (real transactions)
//   Switch by updating the .env file only — code doesn't change.
// ============================================================

const Razorpay = require('razorpay');

// Instantiate Razorpay once. 
// Both key_id and key_secret are required — Razorpay throws if missing.
const razorpayInstance = new Razorpay({
  key_id:     process.env.RAZORPAY_KEY_ID || 'rzp_test_SzB3NDxEfBigtw',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '03ARk7pafGqo8rCOfAwfDo93',
});

console.log('✅ [Razorpay]: SDK instance created.');

module.exports = razorpayInstance;
