// ============================================================
// routes/subjectRoutes.js
// ============================================================
// BASE PATH (mounted in app.js): /api/subjects
//
// ENDPOINT TABLE:
//   GET    /api/subjects        → List all subjects          (public)
//   GET    /api/subjects/:id    → Get one subject            (public)
//   POST   /api/subjects        → Create subject             (admin)
//   PUT    /api/subjects/:id    → Update subject             (admin)
//   DELETE /api/subjects/:id    → Delete subject + resources (admin)
// ============================================================

const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const subjectController = require('../controllers/subjectController');
const isAuth            = require('../middlewares/isAuth');
const requireRole       = require('../middlewares/requireRole');
const validateRequest   = require('../middlewares/validateRequest');
const { createSubjectRules, updateSubjectRules } = require('../validators/subjectValidator');

// Multer for optional thumbnail upload (images only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 3 * 1024 * 1024 }, // 3 MB max for thumbnails
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed for subject thumbnails.'), false);
    }
  },
});

// ── Public Routes ─────────────────────────────────────────────
router.get('/',    subjectController.getAllSubjects);
router.get('/:id', subjectController.getSubjectById);

// ── Admin Routes ──────────────────────────────────────────────
// isAuth verifies JWT → requireRole checks role === 'admin'
router.post(
  '/',
  isAuth, requireRole('admin', 'contributor'),
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'photo', maxCount: 1 }]),
  subjectController.createSubject
);

router.put(
  '/:id',
  isAuth, requireRole('admin', 'contributor'),
  upload.fields([{ name: 'thumbnail', maxCount: 1 }, { name: 'photo', maxCount: 1 }]),
  subjectController.updateSubject
);

// Only admins can delete subjects (contributors can create/update but NOT delete)
router.delete('/:id', isAuth, requireRole('admin'), subjectController.deleteSubject);

module.exports = router;
