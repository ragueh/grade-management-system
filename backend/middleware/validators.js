const { body, param, query, validationResult } = require('express-validator');
const { MARKING_SYSTEM, USER_ROLES } = require('../config/constants');

/**
 * Middleware to handle validation errors
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation error',
      errors: errors.array(),
    });
  }
  next();
};

/**
 * User Registration Validators
 */
const registerValidators = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  body('first_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('First name must be between 2 and 100 characters'),
  body('last_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Last name must be between 2 and 100 characters'),
  body('role')
    .isIn(Object.values(USER_ROLES))
    .withMessage('Invalid user role'),
  body('phone_number')
    .optional()
    .matches(/^[\d\s\-\+\(\)]+$/)
    .withMessage('Invalid phone number format'),
];

/**
 * Login Validators
 */
const loginValidators = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

/**
 * Mark Entry Validators
 */
const markEntryValidators = [
  body('student_id')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  body('assessment_id')
    .isInt({ min: 1 })
    .withMessage('Valid assessment ID is required'),
  body('assessment_date')
    .isISO8601()
    .withMessage('Valid date is required (YYYY-MM-DD)'),
  body('score')
    .isFloat({ min: MARKING_SYSTEM.MIN_SCORE, max: MARKING_SYSTEM.MAX_SCORE })
    .withMessage(`Score must be between ${MARKING_SYSTEM.MIN_SCORE} and ${MARKING_SYSTEM.MAX_SCORE}`),
  body('teacher_comment')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Comment must not exceed 500 characters'),
  body('status')
    .optional()
    .isIn(['draft', 'published'])
    .withMessage('Status must be either draft or published'),
];

/**
 * Assessment Type Validators
 */
const assessmentTypeValidators = [
  body('class_id')
    .isInt({ min: 1 })
    .withMessage('Valid class ID is required'),
  body('type_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Assessment type name must be between 2 and 100 characters'),
  body('weight')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Weight must be between 0 and 100'),
  body('max_score')
    .optional()
    .equals(String(MARKING_SYSTEM.MAX_SCORE))
    .withMessage(`Max score must be ${MARKING_SYSTEM.MAX_SCORE}`),
  body('display_order')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Display order must be a positive integer'),
];

/**
 * Class Creation Validators
 */
const classCreationValidators = [
  body('class_name')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Class name must be between 2 and 100 characters'),
  body('subject')
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Subject must be between 2 and 100 characters'),
  body('academic_year')
    .matches(/^\d{4}-\d{4}$/)
    .withMessage('Academic year must be in format YYYY-YYYY (e.g., 2024-2025)'),
];

/**
 * Student Registration Validators (Teacher adding student to class)
 */
const studentRegistrationValidators = [
  body('student_id')
    .trim()
    .isLength({ min: 3, max: 50 })
    .withMessage('Student ID must be between 3 and 50 characters'),
  body('class_id')
    .isInt({ min: 1 })
    .withMessage('Valid class ID is required'),
];

/**
 * Parent Access Validators
 */
const parentAccessValidators = [
  body('allow_parent_access')
    .isBoolean()
    .withMessage('Parent access must be true or false'),
];

/**
 * Alert Creation Validators
 */
const alertValidators = [
  body('student_id')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
  body('class_id')
    .isInt({ min: 1 })
    .withMessage('Valid class ID is required'),
  body('alert_type')
    .isIn(['low_score', 'declining_trend', 'attendance', 'custom'])
    .withMessage('Invalid alert type'),
  body('severity')
    .optional()
    .isIn(['info', 'warning', 'critical'])
    .withMessage('Invalid severity level'),
  body('message')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Message must be between 10 and 500 characters'),
];

/**
 * ID Parameter Validator
 */
const idParamValidator = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('Valid ID is required'),
];

/**
 * Teacher ID Parameter Validator
 */
const teacherIdParamValidator = [
  param('teacherId')
    .isInt({ min: 1 })
    .withMessage('Valid teacher ID is required'),
];

/**
 * Student ID Parameter Validator
 */
const studentIdParamValidator = [
  param('studentId')
    .isInt({ min: 1 })
    .withMessage('Valid student ID is required'),
];

/**
 * Pagination Validators
 */
const paginationValidators = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

module.exports = {
  handleValidationErrors,
  registerValidators,
  loginValidators,
  markEntryValidators,
  assessmentTypeValidators,
  classCreationValidators,
  studentRegistrationValidators,
  parentAccessValidators,
  alertValidators,
  idParamValidator,
  teacherIdParamValidator,
  studentIdParamValidator,
  paginationValidators,
};
