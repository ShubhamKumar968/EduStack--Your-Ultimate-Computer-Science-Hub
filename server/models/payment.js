// ============================================================
// models/payment.js
// ============================================================
// PURPOSE:
//   Records every Razorpay payment transaction in MongoDB.
//   Created in two stages:
//     1. ORDER CREATED  → status: 'created'   (when order is placed)
//     2. PAYMENT DONE   → status: 'paid'      (after Razorpay webhook verify)
//     3. PAYMENT FAILED → status: 'failed'    (if verification fails)
//
// RAZORPAY FLOW (simplified):
//   Frontend calls POST /api/payments/create-order
//     → We create an order via Razorpay API → get razorpayOrderId
//     → Save Payment doc with status 'created'
//   User pays on Razorpay checkout UI
//     → Frontend receives razorpayPaymentId + razorpaySignature
//     → Calls POST /api/payments/verify
//     → We verify HMAC signature → update status to 'paid'
//
// WHY STORE BOTH IDs?
//   razorpayOrderId  is created by us before payment.
//   razorpayPaymentId is assigned by Razorpay after payment.
//   Both are needed together for HMAC signature verification.
// ============================================================

const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema(
  {
    // The user who initiated the payment
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'User',
      required: true,
    },

    // ── Razorpay Identifiers ──────────────────────────────────

    // Order ID from Razorpay (e.g. "order_abc123") — created before payment
    razorpayOrderId: {
      type:     String,
      required: true,
      unique:   true,
    },

    // Payment ID from Razorpay (e.g. "pay_xyz789") — assigned after payment
    // null until the payment is verified
    razorpayPaymentId: {
      type:    String,
      default: null,
    },

    // HMAC signature sent by Razorpay — stored for audit trail
    razorpaySignature: {
      type:    String,
      default: null,
    },

    // ── Amount ────────────────────────────────────────────────

    // Amount in PAISE (Razorpay uses smallest currency unit)
    // e.g. ₹199 → store 19900
    amount: {
      type:     Number,
      required: true,
    },

    // Currency code (default INR)
    currency: {
      type:    String,
      default: 'INR',
    },

    // ── Status ────────────────────────────────────────────────

    // Lifecycle: created → paid | failed
    status: {
      type:    String,
      enum:    ['created', 'paid', 'failed'],
      default: 'created',
    },

    // Optional: what the user was paying for (e.g. 'premium_access')
    description: {
      type:    String,
      default: 'EduStack Premium Access',
    },
  },
  { timestamps: true } // createdAt = when order was placed
);

const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema);

module.exports = Payment;
