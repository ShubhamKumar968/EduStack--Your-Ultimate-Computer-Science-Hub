// ============================================================
// routes/userRoutes.js
// ============================================================
// BASE PATH (mounted in app.js): /api/users
//
// ENDPOINT TABLE:
//   GET  /api/users           → List all users      (admin only)
//   GET  /api/users/profile   → Get own profile     (private)
//   PUT  /api/users/profile   → Update own profile  (private)
//   PUT  /api/users/avatar    → Update avatar       (private)
// ============================================================

const express = require('express');
const multer  = require('multer');
const router  = express.Router();

const userController = require('../controllers/userController');
const isAuth         = require('../middlewares/isAuth');
const requireRole    = require('../middlewares/requireRole');

// Multer for single image upload (avatar only)
const upload = multer({
  storage: multer.memoryStorage(),
  limits:  { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed.'), false);
    }
  },
});

// All user routes require authentication
router.use(isAuth);

// ── User Routes ───────────────────────────────────────────────
router.get('/profile', userController.getProfile);
router.get('/me',      userController.getProfile);

// Profile updates support optional single file avatar upload
router.put('/profile', upload.single('avatar'), userController.updateProfile);
router.put('/me',      upload.single('avatar'), userController.updateProfile);
router.put('/avatar',  upload.single('avatar'), userController.updateAvatar);
router.put('/become-contributor', userController.becomeContributor);
router.post('/become-contributor', userController.becomeContributor);
router.put('/become_contributor', userController.becomeContributor);
router.post('/become_contributor', userController.becomeContributor);

// Admin only: list all users
router.get('/', requireRole('admin'), userController.getAllUsers);

module.exports = router;
