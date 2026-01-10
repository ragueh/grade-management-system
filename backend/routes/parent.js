const express = require('express');
const router = express.Router();
const parentController = require('../controllers/parentController');
const { authenticate, authorize } = require('../middleware/auth');
const { idParamValidator, handleValidationErrors } = require('../middleware/validators');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication as parent
router.use(authenticate);
router.use(authorize(USER_ROLES.PARENT));

/**
 * @route   GET /api/parent/dashboard
 * @desc    Get parent dashboard data
 * @access  Private (Parent)
 */
router.get('/dashboard', parentController.getDashboard);

/**
 * @route   GET /api/parent/children
 * @desc    Get all children
 * @access  Private (Parent)
 */
router.get('/children', parentController.getChildren);

/**
 * @route   GET /api/parent/children/:studentId/marks
 * @desc    Get child's marks (requires student permission)
 * @access  Private (Parent with access)
 */
router.get(
  '/children/:studentId/marks',
  idParamValidator,
  handleValidationErrors,
  parentController.getChildMarks
);

/**
 * @route   GET /api/parent/children/:studentId/grade
 * @desc    Get child's grade calculation (requires student permission)
 * @access  Private (Parent with access)
 */
router.get(
  '/children/:studentId/grade',
  idParamValidator,
  handleValidationErrors,
  parentController.getChildGrade
);

/**
 * @route   GET /api/parent/children/:studentId/alerts
 * @desc    Get child's alerts (requires student permission)
 * @access  Private (Parent with access)
 */
router.get(
  '/children/:studentId/alerts',
  idParamValidator,
  handleValidationErrors,
  parentController.getChildAlerts
);

module.exports = router;
