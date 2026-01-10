const express = require('express');
const router = express.Router();
const teacherController = require('../controllers/teacherController');
const { authenticate, authorize, checkClassOwnership, checkTeacherApproval } = require('../middleware/auth');
const {
  classCreationValidators,
  assessmentTypeValidators,
  markEntryValidators,
  idParamValidator,
  handleValidationErrors,
} = require('../middleware/validators');
const { USER_ROLES } = require('../config/constants');

// All routes require authentication as teacher
router.use(authenticate);
router.use(authorize(USER_ROLES.TEACHER));
router.use(checkTeacherApproval); // Ensure teacher is approved by admin

/**
 * @route   GET /api/teacher/dashboard
 * @desc    Get teacher dashboard data
 * @access  Private (Teacher)
 */
router.get('/dashboard', teacherController.getDashboard);

/**
 * @route   GET /api/teacher/classes
 * @desc    Get all teacher's classes
 * @access  Private (Teacher)
 */
router.get('/classes', teacherController.getClasses);

/**
 * @route   POST /api/teacher/classes
 * @desc    Create a new class
 * @access  Private (Teacher)
 */
router.post(
  '/classes',
  classCreationValidators,
  handleValidationErrors,
  teacherController.createClass
);

/**
 * @route   GET /api/teacher/classes/:id
 * @desc    Get class details with students
 * @access  Private (Teacher - owner only)
 */
router.get(
  '/classes/:id',
  idParamValidator,
  handleValidationErrors,
  checkClassOwnership,
  teacherController.getClassDetails
);

/**
 * @route   PUT /api/teacher/classes/:id
 * @desc    Update class
 * @access  Private (Teacher - owner only)
 */
router.put(
  '/classes/:id',
  idParamValidator,
  handleValidationErrors,
  checkClassOwnership,
  teacherController.updateClass
);

/**
 * @route   GET /api/teacher/classes/:classId/assessments
 * @desc    Get assessments for a class
 * @access  Private (Teacher - owner only)
 */
router.get(
  '/classes/:classId/assessments',
  checkClassOwnership,
  teacherController.getAssessments
);

/**
 * @route   POST /api/teacher/classes/:classId/assessments
 * @desc    Create assessment type for a class
 * @access  Private (Teacher - owner only)
 */
router.post(
  '/classes/:classId/assessments',
  checkClassOwnership,
  assessmentTypeValidators,
  handleValidationErrors,
  teacherController.createAssessment
);

/**
 * @route   PUT /api/teacher/assessments/:id
 * @desc    Update assessment type
 * @access  Private (Teacher - owner only)
 */
router.put(
  '/assessments/:id',
  idParamValidator,
  handleValidationErrors,
  teacherController.updateAssessment
);

/**
 * @route   GET /api/teacher/classes/:classId/marks
 * @desc    Get all marks for a class
 * @access  Private (Teacher - owner only)
 */
router.get(
  '/classes/:classId/marks',
  checkClassOwnership,
  teacherController.getClassMarks
);

/**
 * @route   POST /api/teacher/marks
 * @desc    Create a new mark
 * @access  Private (Teacher)
 */
router.post(
  '/marks',
  markEntryValidators,
  handleValidationErrors,
  teacherController.createMark
);

/**
 * @route   PUT /api/teacher/marks/:id
 * @desc    Update a mark
 * @access  Private (Teacher)
 */
router.put(
  '/marks/:id',
  idParamValidator,
  handleValidationErrors,
  teacherController.updateMark
);

/**
 * @route   DELETE /api/teacher/marks/:id
 * @desc    Delete a mark
 * @access  Private (Teacher)
 */
router.delete(
  '/marks/:id',
  idParamValidator,
  handleValidationErrors,
  teacherController.deleteMark
);

/**
 * @route   POST /api/teacher/classes/:classId/recalculate
 * @desc    Recalculate all grades for a class
 * @access  Private (Teacher - owner only)
 */
router.post(
  '/classes/:classId/recalculate',
  checkClassOwnership,
  teacherController.recalculateGrades
);

module.exports = router;
