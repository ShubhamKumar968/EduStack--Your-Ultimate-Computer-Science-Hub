// ============================================================
// routes/enrollmentRoutes.js
// ============================================================
// BASE PATH (mounted in app.js): /api/enrollments
//
// ENDPOINT TABLE:
//   GET    /api/enrollments                   → Get my enrollments   (private)
//   GET    /api/enrollments/check/:subjectId  → Is enrolled?         (private)
//   POST   /api/enrollments/:subjectId        → Enroll in subject    (private)
//   DELETE /api/enrollments/:subjectId        → Unenroll from subject(private)
// ============================================================

const express = require('express');
const router  = express.Router();

const enrollmentController = require('../controllers/enrollmentController');
const isAuth               = require('../middlewares/isAuth');

// All enrollment routes require authentication
router.use(isAuth);

router.get('/check/:subjectId', enrollmentController.checkEnrollment);
router.get('/',                  enrollmentController.getEnrollments);
router.post('/:subjectId',      enrollmentController.enrollSubject);
router.delete('/:subjectId',    enrollmentController.unenrollSubject);

module.exports = router;
