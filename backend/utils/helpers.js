const bcrypt = require('bcryptjs');
const { bcryptConfig } = require('../config/auth');
const { query } = require('../config/database');
const { PAGINATION } = require('../config/constants');

/**
 * Hash password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
const hashPassword = async (password) => {
  return await bcrypt.hash(password, bcryptConfig.rounds);
};

/**
 * Compare password with hash
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} Match result
 */
const comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

/**
 * Log audit trail
 * @param {Object} params - Audit log parameters
 */
const logAudit = async ({ action, userId, affectedTable, affectedRecordId, oldValue, newValue, ipAddress, userAgent }) => {
  try {
    await query(
      `INSERT INTO audit_log (action, user_id, affected_table, affected_record_id, old_value, new_value, ip_address, user_agent)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [
        action,
        userId,
        affectedTable,
        affectedRecordId,
        oldValue ? JSON.stringify(oldValue) : null,
        newValue ? JSON.stringify(newValue) : null,
        ipAddress,
        userAgent,
      ]
    );
  } catch (error) {
    console.error('Audit logging error:', error);
    // Don't throw error - audit logging should not break the main operation
  }
};

/**
 * Get pagination parameters
 * @param {Object} query - Request query object
 * @returns {Object} Pagination params
 */
const getPaginationParams = (queryParams) => {
  const page = parseInt(queryParams.page) || PAGINATION.DEFAULT_PAGE;
  const limit = Math.min(
    parseInt(queryParams.limit) || PAGINATION.DEFAULT_LIMIT,
    PAGINATION.MAX_LIMIT
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

/**
 * Build pagination response
 * @param {Array} data - Data array
 * @param {number} total - Total count
 * @param {number} page - Current page
 * @param {number} limit - Items per page
 * @returns {Object} Paginated response
 */
const buildPaginationResponse = (data, total, page, limit) => {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage: page < totalPages,
      hasPreviousPage: page > 1,
    },
  };
};

/**
 * Format date to YYYY-MM-DD
 * @param {Date} date - Date object
 * @returns {string} Formatted date
 */
const formatDate = (date) => {
  return new Date(date).toISOString().split('T')[0];
};

/**
 * Calculate weighted average
 * @param {Array} marks - Array of { score, weight } objects
 * @returns {number} Weighted average
 */
const calculateWeightedAverage = (marks) => {
  if (!marks || marks.length === 0) return 0;

  const totalWeight = marks.reduce((sum, mark) => sum + parseFloat(mark.weight), 0);
  const weightedSum = marks.reduce((sum, mark) => sum + (parseFloat(mark.score) * parseFloat(mark.weight) / 100), 0);

  // If total weight is not 100%, adjust the calculation
  if (totalWeight < 100) {
    return parseFloat((weightedSum / (totalWeight / 100)).toFixed(2));
  }

  return parseFloat(weightedSum.toFixed(2));
};

/**
 * Check if user account is locked
 * @param {Object} user - User object
 * @returns {boolean} Is locked
 */
const isAccountLocked = (user) => {
  if (!user.locked_until) return false;
  return new Date(user.locked_until) > new Date();
};

/**
 * Calculate lock time based on login attempts
 * @param {number} attempts - Number of failed attempts
 * @returns {Date} Lock until timestamp
 */
const calculateLockTime = (attempts) => {
  // Lock for 15 minutes after max attempts
  const lockMinutes = 15;
  const lockTime = new Date();
  lockTime.setMinutes(lockTime.getMinutes() + lockMinutes);
  return lockTime;
};

/**
 * Sanitize user object (remove sensitive data)
 * @param {Object} user - User object
 * @returns {Object} Sanitized user
 */
const sanitizeUser = (user) => {
  const { password_hash, login_attempts, locked_until, ...sanitized } = user;
  return sanitized;
};

/**
 * Generate random token
 * @param {number} length - Token length
 * @returns {string} Random token
 */
const generateRandomToken = (length = 32) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Validate date is not in future
 * @param {string} date - Date string
 * @returns {boolean} Is valid
 */
const isValidAssessmentDate = (date) => {
  const assessmentDate = new Date(date);
  const today = new Date();
  today.setHours(23, 59, 59, 999); // End of today
  return assessmentDate <= today;
};

/**
 * Format error response
 * @param {string} message - Error message
 * @param {Array} errors - Error array
 * @returns {Object} Error response
 */
const formatErrorResponse = (message, errors = null) => {
  const response = {
    success: false,
    message,
  };

  if (errors) {
    response.errors = errors;
  }

  return response;
};

/**
 * Format success response
 * @param {string} message - Success message
 * @param {Object} data - Response data
 * @returns {Object} Success response
 */
const formatSuccessResponse = (message, data = null) => {
  const response = {
    success: true,
    message,
  };

  if (data) {
    response.data = data;
  }

  return response;
};

module.exports = {
  hashPassword,
  comparePassword,
  logAudit,
  getPaginationParams,
  buildPaginationResponse,
  formatDate,
  calculateWeightedAverage,
  isAccountLocked,
  calculateLockTime,
  sanitizeUser,
  generateRandomToken,
  isValidAssessmentDate,
  formatErrorResponse,
  formatSuccessResponse,
};
