// ============================================================
// validators/subjectValidator.js
// ============================================================
// PURPOSE:
//   express-validator rules for subject and resource management.
// ============================================================

const { body } = require('express-validator');

// ============================================================
// RULE SET 1: createSubjectRules
// Used by: POST /api/subjects
// ============================================================
const createSubjectRules = [
  body('name')
    .trim()
    .notEmpty().withMessage('Subject name is required.')
    .isLength({ max: 100 }).withMessage('Subject name cannot exceed 100 characters.'),

  body('code')
    .trim()
    .notEmpty().withMessage('Subject code is required.')
    .isLength({ max: 15 }).withMessage('Subject code cannot exceed 15 characters.')
    .isAlphanumeric().withMessage('Subject code must be alphanumeric (e.g. DSA, DBMS).'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters.'),

  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be a number between 1 and 8.'),

  body('branch')
    .optional()
    .isIn(['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'All'])
    .withMessage('Branch must be one of: CSE, IT, ECE, EEE, MECH, CIVIL, All.'),
];

// ============================================================
// RULE SET 2: updateSubjectRules
// Used by: PUT /api/subjects/:id
// ============================================================
const updateSubjectRules = [
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 }).withMessage('Subject name cannot exceed 100 characters.'),

  body('code')
    .optional()
    .trim()
    .isLength({ max: 15 }).withMessage('Subject code cannot exceed 15 characters.')
    .isAlphanumeric().withMessage('Subject code must be alphanumeric.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters.'),

  body('semester')
    .optional()
    .isInt({ min: 1, max: 8 }).withMessage('Semester must be between 1 and 8.'),

  body('branch')
    .optional()
    .isIn(['CSE', 'IT', 'ECE', 'EEE', 'MECH', 'CIVIL', 'All'])
    .withMessage('Branch must be one of: CSE, IT, ECE, EEE, MECH, CIVIL, All.'),
];

// ============================================================
// RULE SET 3: createResourceRules
// Used by: POST /api/resources
// ============================================================
const createResourceRules = [
  body('title')
    .trim()
    .notEmpty().withMessage('Resource title is required.')
    .isLength({ max: 150 }).withMessage('Title cannot exceed 150 characters.'),

  body('type')
    .notEmpty().withMessage('Resource type is required.')
    .isIn(['note', 'pyq', 'playlist', 'link', 'platform'])
    .withMessage('Type must be one of: note, pyq, playlist, link, platform.'),

  body('url')
    .trim()
    .notEmpty().withMessage('Resource URL (Drive link, YouTube link, etc.) is required.')
    .isURL().withMessage('Please provide a valid URL.'),

  body('subject')
    .notEmpty().withMessage('Subject ID is required.')
    .isMongoId().withMessage('Subject ID must be a valid MongoDB ObjectId.'),

  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 }).withMessage('Description cannot exceed 500 characters.'),

  body('isPremium')
    .optional()
    .isBoolean().withMessage('isPremium must be true or false.'),
];

module.exports = {
  createSubjectRules,
  updateSubjectRules,
  createResourceRules,
};
