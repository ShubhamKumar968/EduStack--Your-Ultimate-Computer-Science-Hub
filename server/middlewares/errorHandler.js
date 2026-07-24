// ============================================================
// middlewares/errorHandler.js
// ============================================================
// PURPOSE:
//   Global error-handling middleware — the LAST middleware registered
//   in app.js.  Catches every error forwarded via next(error) from
//   any route handler, service, or asyncHandler wrapper.
//
// EXPRESS ERROR HANDLER SIGNATURE:
//   A 4-parameter function (err, req, res, next) is automatically
//   recognised by Express as an error handler, NOT a regular middleware.
//   You MUST keep all four parameters even if `next` is unused.
//
// ERRORS THIS HANDLES:
//   • Mongoose ValidationError   → 400 Bad Request
//   • Mongoose CastError         → 400 (invalid ObjectId in URL params)
//   • Mongoose Duplicate Key     → 409 Conflict (e.g. duplicate email)
//   • JWT errors                 → 401 Unauthorized  (handled in isAuth too)
//   • Multer errors              → 400 Bad Request
//   • Custom thrown Errors       → status from err.statusCode or 500
//   • All others                 → 500 Internal Server Error
//
// PRODUCTION vs DEVELOPMENT:
//   In development → full stack trace is returned so you can debug easily.
//   In production  → only the message is returned (no stack leak to client).
// ============================================================

const { sendError } = require('../utils/apiResponse');

/**
 * Global Error Handler Middleware
 *
 * @param {Error}                      err  - The error object
 * @param {import('express').Request}  req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next  - Required by Express (even if unused)
 */
const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars

  // Log full error in development — helps with debugging
  if (process.env.NODE_ENV === 'development') {
    console.error('🔥 [Error Handler]:', err);
  } else {
    // In production, log only the message (not stack) to avoid noise
    console.error(`❌ [Error]: ${err.message}`);
  }

  // ── Default error values ───────────────────────────────────
  let statusCode = err.statusCode || 500;
  let message    = err.message    || 'Something went wrong on the server.';

  // ── Mongoose: Validation Error ─────────────────────────────
  // Happens when a document fails Mongoose schema validation on .save()
  if (err.name === 'ValidationError') {
    statusCode = 400;
    // Combine all field-level messages into one string
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join(', ');
  }

  // ── Mongoose: Cast Error ───────────────────────────────────
  // Happens when an invalid ObjectId is passed (e.g. GET /subjects/not-an-id)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid value for field: ${err.path}`;
  }

  // ── MongoDB: Duplicate Key Error ───────────────────────────
  // Happens when inserting a document that violates a unique index
  // err.code 11000 is MongoDB's duplicate key error code
  if (err.code === 11000) {
    statusCode = 409; // Conflict
    const field = Object.keys(err.keyValue)[0]; // e.g. "email"
    message = `An account with this ${field} already exists.`;
  }

  // ── JWT Errors ─────────────────────────────────────────────
  // These are usually caught in isAuth, but handle here as a safety net
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message    = 'Invalid token. Please log in again.';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message    = 'Session expired. Please log in again.';
  }

  // ── Multer Errors ──────────────────────────────────────────
  if (err.code === 'LIMIT_FILE_SIZE') {
    statusCode = 400;
    message = 'File size exceeds the allowed limit.';
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    statusCode = 400;
    message = 'Unexpected file field. Please check your upload form.';
  }

  // ── Final Response ─────────────────────────────────────────
  // In development, attach the stack trace to help debugging
  const responseData =
    process.env.NODE_ENV === 'development' ? { stack: err.stack } : {};

  return sendError(res, message, statusCode, responseData ? [responseData] : []);
};

module.exports = errorHandler;
