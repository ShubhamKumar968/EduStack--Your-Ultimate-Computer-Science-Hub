// ============================================================
// middlewares/validateRequest.js
// ============================================================
// PURPOSE:
//   Acts as the bridge between express-validator rules (defined in
//   validators/) and the controller.  Place it after the validation
//   chain in a route definition.
//
// HOW express-validator WORKS:
//   1. You define rules in a validators/ file using body(), param(), query()
//   2. Express runs each rule and stores errors in req (internally)
//   3. This middleware calls validationResult(req) to collect those errors
//   4. If there are errors → respond 422 immediately (controller never runs)
//   5. If no errors → call next() so the controller runs
//
// USAGE IN A ROUTE:
//   const { registerRules } = require('../validators/authValidator');
//   const validateRequest   = require('../middlewares/validateRequest');
//
//   router.post('/register', registerRules, validateRequest, authController.register);
//
// ERROR FORMAT SENT TO CLIENT:
//   {
//     success: false,
//     message: "Validation failed",
//     errors: [
//       { field: "email",    message: "Please enter a valid email" },
//       { field: "password", message: "Password too short" }
//     ]
//   }
// ============================================================

const { validationResult } = require('express-validator');
const { sendError }        = require('../utils/apiResponse');

/**
 * validateRequest — Collects express-validator errors and short-circuits
 * the request with a 422 response if any rules failed.
 */
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  // .isEmpty() returns true when there are no validation errors
  if (!errors.isEmpty()) {
    // Map to a clean { field, message } format for the frontend
    const formattedErrors = errors.array().map((err) => ({
      field:   err.path,   // the field name (e.g. "email", "password")
      message: err.msg,    // the error message string
    }));

    return sendError(res, 'Validation failed. Please check your input.', 422, formattedErrors);
  }

  next(); // ✅ No errors — hand control to the controller
};

module.exports = validateRequest;
