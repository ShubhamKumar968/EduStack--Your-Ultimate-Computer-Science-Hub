// ============================================================
// validators/authValidator.js
// ============================================================
// PURPOSE:
//   Defines express-validator rule arrays for auth-related routes.
//   Exported arrays are used directly in route definitions, followed
//   by the validateRequest middleware which reads the results.
//
// PATTERN:
//   router.post('/register', registerRules, validateRequest, controller.fn);
//
// WHY SEPARATE FROM CONTROLLERS?
//   Controllers should only contain business logic.
//   Validation rules can be long — keeping them here keeps routes clean.
//   They can also be reused across multiple routes (e.g. email rule).
// ============================================================

const { body } = require('express-validator');

// ── Reusable individual rule builders ────────────────────────
// Defined once, composed into arrays below

const emailRule = body('email')
  .trim()
  .notEmpty().withMessage('Email is required.')
  .isEmail().withMessage('Please enter a valid email address.')
  .normalizeEmail({ gmail_remove_dots: false }); // keeps foo.bar@gmail distinct

const passwordRule = body('password')
  .trim()
  .notEmpty().withMessage('Password is required.')
  .isLength({ min: 6 }).withMessage('Password must be at least 6 characters.')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$#!%*?&])/)
  .withMessage(
    'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@, $, #, !, %, *, ?, &).'
  );

// ============================================================
// RULE SET 1: registerRules
// Used by: POST /api/auth/register
// ============================================================
const registerRules = [
  // First name: letters and spaces only, max 50 chars
  body('firstName')
    .trim()
    .notEmpty().withMessage('First name is required.')
    .isAlpha('en-US', { ignore: ' ' }).withMessage('First name can only contain letters.')
    .isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters.'),

  // Last name: same rules as first name
  body('lastName')
    .trim()
    .notEmpty().withMessage('Last name is required.')
    .isAlpha('en-US', { ignore: ' ' }).withMessage('Last name can only contain letters.')
    .isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters.'),

  emailRule,

  passwordRule,

  // confirmPassword must exactly match password
  body('confirmPassword')
    .trim()
    .notEmpty().withMessage('Please confirm your password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
];

// ============================================================
// RULE SET 2: loginRules
// Used by: POST /api/auth/login
// ============================================================
const loginRules = [
  emailRule,

  body('password')
    .trim()
    .notEmpty().withMessage('Password is required.'),
  // NOTE: We don't apply strong password rules here — if the user
  // forgot their password they should use forgot-password flow.
  // We just need the field to not be empty.
];

// ============================================================
// RULE SET 3: forgotPasswordRules
// Used by: POST /api/auth/forgot-password
// ============================================================
const forgotPasswordRules = [
  emailRule,
];

// ============================================================
// RULE SET 4: verifyOtpRules
// Used by: POST /api/auth/verify-otp
// ============================================================
const verifyOtpRules = [
  emailRule,

  body('otp')
    .trim()
    .notEmpty().withMessage('OTP is required.')
    .isLength({ min: 6, max: 6 }).withMessage('OTP must be exactly 6 digits.')
    .isNumeric().withMessage('OTP must contain only digits.'),
];

// ============================================================
// RULE SET 5: resetPasswordRules
// Used by: POST /api/auth/reset-password
// ============================================================
const resetPasswordRules = [
  emailRule,

  passwordRule,

  body('confirmPassword')
    .trim()
    .notEmpty().withMessage('Please confirm your new password.')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match.');
      }
      return true;
    }),
];

module.exports = {
  registerRules,
  loginRules,
  forgotPasswordRules,
  verifyOtpRules,
  resetPasswordRules,
};
