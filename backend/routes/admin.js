const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, authorize } = require('../middleware/auth');
const { teacherIdParamValidator, handleValidationErrors } = require('../middleware/validators');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication as admin
router.use(authenticate);
router.use(authorize(USER_ROLES.ADMIN));

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get admin dashboard data
 * @access  Private (Admin)
 */
router.get('/dashboard', adminController.getDashboard);

/**
 * @route   GET /api/admin/statistics
 * @desc    Get system statistics
 * @access  Private (Admin)
 */
router.get('/statistics', adminController.getStatistics);

/**
 * @route   GET /api/admin/teachers
 * @desc    Get all teachers
 * @access  Private (Admin)
 */
router.get('/teachers', adminController.getTeachers);

/**
 * @route   POST /api/admin/teachers/:teacherId/approve
 * @desc    Approve a teacher
 * @access  Private (Admin)
 */
router.post(
  '/teachers/:teacherId/approve',
  teacherIdParamValidator,
  handleValidationErrors,
  adminController.approveTeacher
);

/**
 * @route   POST /api/admin/teachers/:teacherId/revoke
 * @desc    Revoke teacher approval
 * @access  Private (Admin)
 */
router.post(
  '/teachers/:teacherId/revoke',
  teacherIdParamValidator,
  handleValidationErrors,
  adminController.revokeApproval
);

/**
 * @route   DELETE /api/admin/teachers/:teacherId
 * @desc    Delete/Reject teacher application
 * @access  Private (Admin)
 */
router.delete(
  '/teachers/:teacherId',
  teacherIdParamValidator,
  handleValidationErrors,
  adminController.deleteTeacher
);

module.exports = router;
