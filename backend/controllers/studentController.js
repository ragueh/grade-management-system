const Student = require('../models/Student');
const { calculateStudentGrade, detectDecliningTrend, predictFinalGrade } = require('../utils/calculations');
const { logAudit, formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const { MESSAGES } = require('../config/constants');

/**
 * Get student dashboard data
 * GET /api/student/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get student record
    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json(formatErrorResponse('Student record not found'));
    }

    // Get statistics
    const stats = await Student.getStatistics(student.id);

    // Get recent marks
    const recentMarks = await require('../models/Mark').getRecentMarks(student.id, 5);

    // Get active alerts
    const alerts = await Student.getAlerts(student.id);

    // Get trend analysis
    const trend = await detectDecliningTrend(student.id);

    res.status(200).json(formatSuccessResponse('Dashboard data retrieved', {
      student,
      statistics: stats,
      recent_marks: recentMarks,
      alerts,
      trend,
    }));
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get student's marks
 * GET /api/student/marks
 */
const getMarks = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json(formatErrorResponse('Student record not found'));
    }

    const marks = await Student.getMarks(student.id);

    res.status(200).json(formatSuccessResponse('Marks retrieved', marks));
  } catch (error) {
    console.error('Get marks error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get student's current grade calculation
 * GET /api/student/grade
 */
const getGrade = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json(formatErrorResponse('Student record not found'));
    }

    const calculation = await calculateStudentGrade(student.id, student.class_id);

    res.status(200).json(formatSuccessResponse('Grade calculation retrieved', calculation));
  } catch (error) {
    console.error('Get grade error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get student's alerts
 * GET /api/student/alerts
 */
const getAlerts = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json(formatErrorResponse('Student record not found'));
    }

    const alerts = await Student.getAlerts(student.id);

    res.status(200).json(formatSuccessResponse('Alerts retrieved', alerts));
  } catch (error) {
    console.error('Get alerts error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get parent access status
 * GET /api/student/parent-access
 */
const getParentAccessStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json(formatErrorResponse('Student record not found'));
    }

    res.status(200).json(formatSuccessResponse('Parent access status retrieved', {
      allow_parent_access: student.allow_parent_access,
      has_parent_linked: !!student.parent_id,
    }));
  } catch (error) {
    console.error('Get parent access status error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Update parent access permission
 * PUT /api/student/parent-access
 */
const updateParentAccess = async (req, res) => {
  try {
    const userId = req.user.id;
    const { allow_parent_access } = req.body;

    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json(formatErrorResponse('Student record not found'));
    }

    if (!student.parent_id) {
      return res.status(400).json(formatErrorResponse('No parent linked to your account'));
    }

    const updatedStudent = await Student.updateParentAccess(student.id, allow_parent_access);

    await logAudit({
      action: allow_parent_access ? 'PARENT_ACCESS_GRANTED' : 'PARENT_ACCESS_REVOKED',
      userId,
      affectedTable: 'students',
      affectedRecordId: student.id,
      newValue: { allow_parent_access },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    });

    const message = allow_parent_access ? MESSAGES.SUCCESS.ACCESS_GRANTED : MESSAGES.SUCCESS.ACCESS_REVOKED;
    res.status(200).json(formatSuccessResponse(message, updatedStudent));
  } catch (error) {
    console.error('Update parent access error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get performance prediction
 * GET /api/student/prediction
 */
const getPrediction = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json(formatErrorResponse('Student record not found'));
    }

    const prediction = await predictFinalGrade(student.id, student.class_id);

    res.status(200).json(formatSuccessResponse('Prediction retrieved', prediction));
  } catch (error) {
    console.error('Get prediction error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get performance trend
 * GET /api/student/trend
 */
const getTrend = async (req, res) => {
  try {
    const userId = req.user.id;

    const student = await Student.findByUserId(userId);
    if (!student) {
      return res.status(404).json(formatErrorResponse('Student record not found'));
    }

    const trend = await detectDecliningTrend(student.id);

    res.status(200).json(formatSuccessResponse('Trend analysis retrieved', trend));
  } catch (error) {
    console.error('Get trend error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

module.exports = {
  getDashboard,
  getMarks,
  getGrade,
  getAlerts,
  getParentAccessStatus,
  updateParentAccess,
  getPrediction,
  getTrend,
};
