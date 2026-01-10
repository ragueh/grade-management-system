const Parent = require('../models/Parent');
const { formatSuccessResponse, formatErrorResponse } = require('../utils/helpers');
const { MESSAGES } = require('../config/constants');

/**
 * Get parent dashboard data
 * GET /api/parent/dashboard
 */
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get parent record
    const parent = await Parent.findByUserId(userId);
    if (!parent) {
      return res.status(404).json(formatErrorResponse('Parent record not found'));
    }

    // Get children with access
    const children = await Parent.getAccessibleChildren(parent.id);

    // Get statistics
    const stats = await Parent.getStatistics(parent.id);

    res.status(200).json(formatSuccessResponse('Dashboard data retrieved', {
      parent,
      children,
      statistics: stats,
    }));
  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get all children (including those without access granted)
 * GET /api/parent/children
 */
const getChildren = async (req, res) => {
  try {
    const userId = req.user.id;

    const parent = await Parent.findByUserId(userId);
    if (!parent) {
      return res.status(404).json(formatErrorResponse('Parent record not found'));
    }

    const children = await Parent.getChildren(parent.id);

    res.status(200).json(formatSuccessResponse('Children retrieved', children));
  } catch (error) {
    console.error('Get children error:', error);
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get child's marks
 * GET /api/parent/children/:studentId/marks
 */
const getChildMarks = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentId = req.params.studentId;

    const parent = await Parent.findByUserId(userId);
    if (!parent) {
      return res.status(404).json(formatErrorResponse('Parent record not found'));
    }

    // Check access
    const hasAccess = await Parent.hasAccessToStudent(parent.id, studentId);
    if (!hasAccess) {
      return res.status(403).json(formatErrorResponse(MESSAGES.ERROR.PARENT_ACCESS_DENIED));
    }

    const marks = await Parent.getChildMarks(parent.id, studentId);

    res.status(200).json(formatSuccessResponse('Child marks retrieved', marks));
  } catch (error) {
    console.error('Get child marks error:', error);
    if (error.message.includes('Access denied')) {
      return res.status(403).json(formatErrorResponse(error.message));
    }
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get child's grade calculation
 * GET /api/parent/children/:studentId/grade
 */
const getChildGrade = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentId = req.params.studentId;

    const parent = await Parent.findByUserId(userId);
    if (!parent) {
      return res.status(404).json(formatErrorResponse('Parent record not found'));
    }

    // Check access
    const hasAccess = await Parent.hasAccessToStudent(parent.id, studentId);
    if (!hasAccess) {
      return res.status(403).json(formatErrorResponse(MESSAGES.ERROR.PARENT_ACCESS_DENIED));
    }

    const calculation = await Parent.getChildCalculation(parent.id, studentId);

    res.status(200).json(formatSuccessResponse('Child grade retrieved', calculation));
  } catch (error) {
    console.error('Get child grade error:', error);
    if (error.message.includes('Access denied')) {
      return res.status(403).json(formatErrorResponse(error.message));
    }
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

/**
 * Get child's alerts
 * GET /api/parent/children/:studentId/alerts
 */
const getChildAlerts = async (req, res) => {
  try {
    const userId = req.user.id;
    const studentId = req.params.studentId;

    const parent = await Parent.findByUserId(userId);
    if (!parent) {
      return res.status(404).json(formatErrorResponse('Parent record not found'));
    }

    // Check access
    const hasAccess = await Parent.hasAccessToStudent(parent.id, studentId);
    if (!hasAccess) {
      return res.status(403).json(formatErrorResponse(MESSAGES.ERROR.PARENT_ACCESS_DENIED));
    }

    const alerts = await Parent.getChildAlerts(parent.id, studentId);

    res.status(200).json(formatSuccessResponse('Child alerts retrieved', alerts));
  } catch (error) {
    console.error('Get child alerts error:', error);
    if (error.message.includes('Access denied')) {
      return res.status(403).json(formatErrorResponse(error.message));
    }
    res.status(500).json(formatErrorResponse(MESSAGES.ERROR.INTERNAL_SERVER));
  }
};

module.exports = {
  getDashboard,
  getChildren,
  getChildMarks,
  getChildGrade,
  getChildAlerts,
};
