// ============================================================
// middlewares/requireRole.js
// ============================================================
// PURPOSE:
//   Role-based access control (RBAC) middleware factory.
//   Restricts a route to users who have one of the allowed roles.
//
// USAGE:
//   requireRole('admin')           → only admin can access
//   requireRole('admin', 'user')   → both roles can access
//
// IMPORTANT:
//   This middleware MUST be placed AFTER isAuth in the chain.
//   isAuth sets req.user — requireRole reads req.user.role.
//   Calling requireRole without isAuth will crash because req.user
//   will be undefined.
//
// EXAMPLE ROUTE:
//   router.post('/subjects', isAuth, requireRole('admin'), subjectController.create);
// ============================================================

const { sendError } = require('../utils/apiResponse');

/**
 * requireRole — RBAC Middleware Factory
 *
 * @param  {...string} roles  - One or more allowed roles (e.g. 'admin', 'user')
 * @returns {Function}        - Express middleware function
 */
const requireRole = (...roles) => {
  return (req, res, next) => {
    // Guard: isAuth must have run first and populated req.user
    if (!req.user) {
      return sendError(res, 'Authentication required. Please log in.', 401);
    }

    // Check if the logged-in user's role is in the allowed roles list
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        `Access denied. This action requires one of the following roles: [${roles.join(', ')}].`,
        403 // 403 Forbidden (authenticated but not authorised)
      );
    }

    next(); // ✅ Role is allowed — proceed to the controller
  };
};

module.exports = requireRole;
