// ============================================================
// utils/apiResponse.js
// ============================================================
// PURPOSE:
//   Provides two standardized helper functions — sendSuccess and
//   sendError — that every controller uses to send consistent
//   JSON responses.  A uniform envelope prevents the frontend
//   from having to guess the shape of every endpoint's reply.
//
// RESPONSE ENVELOPE SHAPE:
//   {
//     success : true | false,
//     message : "Human-readable message",
//     data    : { ... } | null,         // present on success
//     errors  : [ ... ] | undefined     // present on validation errors
//   }
// ============================================================

/**
 * Send a standardised SUCCESS response.
 *
 * @param {import('express').Response} res   - Express response object
 * @param {string}  message                  - Human-readable success message
 * @param {object}  [data={}]                - Payload to send to the client
 * @param {number}  [statusCode=200]         - HTTP status code (default 200)
 *
 * @example
 *   sendSuccess(res, 'User created', { userId: '...' }, 201);
 */
const sendSuccess = (res, message, data = {}, statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

/**
 * Send a standardised ERROR response.
 *
 * @param {import('express').Response} res   - Express response object
 * @param {string}  message                  - Human-readable error message
 * @param {number}  [statusCode=500]         - HTTP status code (default 500)
 * @param {Array}   [errors=[]]              - Array of validation / field errors
 *
 * @example
 *   sendError(res, 'Email already exists', 409);
 *   sendError(res, 'Validation failed', 422, errors.array());
 */
const sendError = (res, message, statusCode = 500, errors = []) => {
  const body = {
    success: false,
    message,
  };

  // Only attach the errors array when it is non-empty (keeps the response lean)
  if (errors.length > 0) {
    body.errors = errors;
  }

  return res.status(statusCode).json(body);
};

module.exports = { sendSuccess, sendError };
