// ============================================================
// utils/asyncHandler.js
// ============================================================
// PURPOSE:
//   A higher-order wrapper function that eliminates the need to
//   write try/catch blocks inside every async route handler.
//
//   Instead of:
//     async (req, res, next) => {
//       try { ... }
//       catch (err) { next(err); }
//     }
//
//   You write:
//     asyncHandler(async (req, res, next) => { ... })
//
//   Any unhandled Promise rejection inside `fn` is automatically
//   caught and forwarded to Express's global error handler via
//   next(err).  This keeps controllers clean and DRY.
//
// HOW IT WORKS:
//   asyncHandler returns a new function that calls fn and
//   attaches a .catch(next) at the end.  If the async fn throws,
//   .catch forwards the error to the next middleware (errorHandler).
// ============================================================

/**
 * Wraps an async Express route handler to automatically catch
 * rejected Promises and forward them to the error-handling middleware.
 *
 * @param   {Function} fn  - Async route handler (req, res, next) => Promise
 * @returns {Function}     - Standard Express middleware function
 */
const asyncHandler = (fn) => {
  return (req, res, next) => {
    // Execute fn; if it returns a rejected promise, forward the error
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
