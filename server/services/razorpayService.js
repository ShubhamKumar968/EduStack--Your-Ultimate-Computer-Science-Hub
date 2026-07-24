// ============================================================
// services/razorpayService.js
// ============================================================
// PURPOSE:
//   Wraps the Razorpay SDK to provide two clean functions:
//     1. createOrder(amount, currency) → creates a Razorpay order
//     2. verifyPaymentSignature(...)   → validates Razorpay's HMAC
//
//   Controllers use these functions — they never import the Razorpay
//   SDK directly.  This keeps payment logic in one place and makes
//   testing / swapping providers easy.
//
// SECURITY — Why verify the signature?
//   When the user completes payment, Razorpay sends:
//     razorpayOrderId + razorpayPaymentId + razorpaySignature
//   The signature is an HMAC-SHA256 hash of
//     "<orderId>|<paymentId>"  keyed with our KEY_SECRET.
//   We recompute the expected hash and compare.
//   If they match → payment is genuine (not tampered).
//   If they don't → reject immediately (possible fraud attempt).
// ============================================================

const crypto          = require('crypto');    // Built-in Node.js module for HMAC
const razorpayInstance = require('../config/razorpay');

// ============================================================
// EXPORTED FUNCTION 1: createOrder
// ============================================================
/**
 * Creates a new Razorpay order.
 * The frontend uses the returned orderId to open the Razorpay checkout.
 *
 * @param {number} amount    - Amount in PAISE (e.g. ₹199 → pass 19900)
 * @param {string} currency  - Currency code (default 'INR')
 * @returns {Promise<object>} - Razorpay order object
 *   { id, entity, amount, currency, status: 'created', ... }
 */
const createOrder = async (amount, currency = 'INR') => {
  const options = {
    amount,                   // Amount in paise — must be integer
    currency,
    receipt: `rcpt_${Date.now()}`, // Unique receipt ID for your records
    payment_capture: 1,            // 1 = auto-capture payment immediately
  };

  // Razorpay SDK method — returns a Promise
  const order = await razorpayInstance.orders.create(options);
  return order;
};


// ============================================================
// EXPORTED FUNCTION 2: verifyPaymentSignature
// ============================================================
/**
 * Verifies the HMAC-SHA256 signature sent by Razorpay after payment.
 *
 * HOW HMAC WORKS:
 *   We build the string: "<razorpayOrderId>|<razorpayPaymentId>"
 *   Then hash it using HMAC-SHA256 with our KEY_SECRET.
 *   Razorpay does the same on their side and sends us the result.
 *   If our hash === their hash → signature is genuine.
 *
 * crypto.timingSafeEqual() is used instead of === to prevent
 * timing-based attacks that could guess the secret bit-by-bit.
 *
 * @param {string} razorpayOrderId   - Order ID (from createOrder step)
 * @param {string} razorpayPaymentId - Payment ID (from Razorpay checkout callback)
 * @param {string} razorpaySignature - Signature from Razorpay checkout callback
 * @returns {boolean}                - true if valid, false if tampered/invalid
 */
const verifyPaymentSignature = (razorpayOrderId, razorpayPaymentId, razorpaySignature) => {
  // Step 1: Build the message string that Razorpay signed
  const message = `${razorpayOrderId}|${razorpayPaymentId}`;

  // Step 2: Compute expected HMAC-SHA256 using our secret key
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(message)
    .digest('hex'); // Output as hex string

  // Step 3: Compare safely using timingSafeEqual
  // Convert both strings to Buffer first (required by timingSafeEqual)
  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature, 'hex'),
      Buffer.from(razorpaySignature,  'hex')
    );
  } catch {
    // If signature strings differ in length, timingSafeEqual throws.
    // That means signature is invalid — return false.
    return false;
  }
};

module.exports = { createOrder, verifyPaymentSignature };
