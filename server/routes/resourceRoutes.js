// ============================================================
// routes/resourceRoutes.js
// ============================================================
// BASE PATH (mounted in app.js): /api/resources
//
// ENDPOINT TABLE:
//   GET    /api/resources                   → All resources (public, filterable)
//   GET    /api/resources/:id               → Single resource (public)
//   GET    /api/resources/subject/:subId    → By subject     (public)
//   POST   /api/resources                   → Create link    (admin)
//   PUT    /api/resources/:id               → Update link    (admin)
//   DELETE /api/resources/:id               → Delete link    (admin)
// ============================================================

const express = require('express');
const router  = express.Router();

const resourceController = require('../controllers/resourceController');
const isAuth             = require('../middlewares/isAuth');
const requireRole        = require('../middlewares/requireRole');
const validateRequest    = require('../middlewares/validateRequest');
const { createResourceRules } = require('../validators/subjectValidator');

// ── Public Routes ─────────────────────────────────────────────
// IMPORTANT: /subject/:subjectId must come BEFORE /:id
router.get('/subject/:subjectId', resourceController.getResourcesBySubject);
router.get('/',                   resourceController.getAllResources);
router.get('/:id',                resourceController.getResourceById);

// ── Admin & Contributor Routes ────────────────────────────────
router.post(
  '/',
  isAuth, requireRole('admin', 'contributor'),
  createResourceRules, validateRequest,
  resourceController.createResource
);

router.put(
  '/:id',
  isAuth, requireRole('admin'),
  resourceController.updateResource
);

router.delete('/:id', isAuth, requireRole('admin'), resourceController.deleteResource);

module.exports = router;
