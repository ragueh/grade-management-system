const express = require('express');
const router = express.Router();
const studentController = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/auth');
const { parentAccessValidators, handleValidationErrors } = require('../middleware/validators');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication as student
router.use(authenticate);
router.use(authorize(USER_ROLES.STUDENT));

/**
 * @route   GET /api/student/dashboard
 * @desc    Get student dashboard data
 * @access  Private (Student)
 */
router.get('/dashboard', studentController.getDashboard);

/**
 * @route   GET /api/student/marks
 * @desc    Get student's marks
 * @access  Private (Student)
 */
router.get('/marks', studentController.getMarks);

/**
 * @route   GET /api/student/grade
 * @desc    Get student's current grade calculation
 * @access  Private (Student)
 */
router.get('/grade', studentController.getGrade);

/**
 * @route   GET /api/student/alerts
 * @desc    Get student's active alerts
 * @access  Private (Student)
 */
router.get('/alerts', studentController.getAlerts);

/**
 * @route   GET /api/student/parent-access
 * @desc    Get parent access status
 * @access  Private (Student)
 */
router.get('/parent-access', studentController.getParentAccessStatus);

/**
 * @route   PUT /api/student/parent-access
 * @desc    Update parent access permission
 * @access  Private (Student)
 */
router.put(
  '/parent-access',
  parentAccessValidators,
  handleValidationErrors,
  studentController.updateParentAccess
);

/**
 * @route   GET /api/student/prediction
 * @desc    Get predicted final grade
 * @access  Private (Student)
 */
router.get('/prediction', studentController.getPrediction);

/**
 * @route   GET /api/student/trend
 * @desc    Get performance trend analysis
 * @access  Private (Student)
 */
router.get('/trend', studentController.getTrend);

module.exports = router;
