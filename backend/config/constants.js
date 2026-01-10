require('dotenv').config();

// Marking System Constants (0-20 Scale)
const MARKING_SYSTEM = {
  MAX_SCORE: parseFloat(process.env.MAX_SCORE) || 20,
  MIN_SCORE: parseFloat(process.env.MIN_SCORE) || 0,
  WARNING_THRESHOLD: parseFloat(process.env.WARNING_THRESHOLD) || 12, // 60% of 20
  CRITICAL_THRESHOLD: parseFloat(process.env.CRITICAL_THRESHOLD) || 10, // 50% of 20
};

// Grade Boundaries (0-20 Scale)
const GRADE_BOUNDARIES = {
  A: {
    min: parseFloat(process.env.GRADE_A_MIN) || 18, // 90-100%
    max: 20,
    letter: 'A',
    description: 'Excellent',
    color: '#10b981', // Green
  },
  B: {
    min: parseFloat(process.env.GRADE_B_MIN) || 16, // 80-90%
    max: 18,
    letter: 'B',
    description: 'Very Good',
    color: '#3b82f6', // Blue
  },
  C: {
    min: parseFloat(process.env.GRADE_C_MIN) || 14, // 70-80%
    max: 16,
    letter: 'C',
    description: 'Good',
    color: '#f59e0b', // Amber
  },
  D: {
    min: parseFloat(process.env.GRADE_D_MIN) || 12, // 60-70%
    max: 14,
    letter: 'D',
    description: 'Satisfactory',
    color: '#f97316', // Orange
  },
  F: {
    min: 0,
    max: 12, // <60%
    letter: 'F',
    description: 'Needs Improvement',
    color: '#ef4444', // Red
  },
};

// Convert score to letter grade
const getLetterGrade = (score) => {
  if (score >= GRADE_BOUNDARIES.A.min) return GRADE_BOUNDARIES.A;
  if (score >= GRADE_BOUNDARIES.B.min) return GRADE_BOUNDARIES.B;
  if (score >= GRADE_BOUNDARIES.C.min) return GRADE_BOUNDARIES.C;
  if (score >= GRADE_BOUNDARIES.D.min) return GRADE_BOUNDARIES.D;
  return GRADE_BOUNDARIES.F;
};

// Convert score to percentage
const scoreToPercentage = (score, maxScore = MARKING_SYSTEM.MAX_SCORE) => {
  return ((score / maxScore) * 100).toFixed(2);
};

// User Roles
const USER_ROLES = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student',
  PARENT: 'parent',
};

// Mark Status
const MARK_STATUS = {
  DRAFT: 'draft',
  PUBLISHED: 'published',
};

// Alert Types
const ALERT_TYPES = {
  LOW_SCORE: 'low_score',
  DECLINING_TREND: 'declining_trend',
  ATTENDANCE: 'attendance',
  CUSTOM: 'custom',
};

// Severity Levels
const SEVERITY_LEVELS = {
  INFO: 'info',
  WARNING: 'warning',
  CRITICAL: 'critical',
};

// File Upload Configuration
const FILE_UPLOAD = {
  MAX_FILE_SIZE: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB
  ALLOWED_FILE_TYPES: (process.env.ALLOWED_FILE_TYPES || 'text/csv,application/vnd.ms-excel').split(','),
};

// Pagination
const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// Rate Limiting
const RATE_LIMIT = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
};

// Response Messages
const MESSAGES = {
  SUCCESS: {
    LOGIN: 'Login successful',
    REGISTER: 'Registration successful',
    CREATED: 'Created successfully',
    UPDATED: 'Updated successfully',
    DELETED: 'Deleted successfully',
    MARK_SAVED: 'Mark saved successfully',
    ACCESS_GRANTED: 'Access granted successfully',
    ACCESS_REVOKED: 'Access revoked successfully',
  },
  ERROR: {
    INTERNAL_SERVER: 'Internal server error',
    UNAUTHORIZED: 'Unauthorized access',
    FORBIDDEN: 'Access forbidden',
    NOT_FOUND: 'Resource not found',
    INVALID_CREDENTIALS: 'Invalid email or password',
    ACCOUNT_LOCKED: 'Account locked due to multiple failed login attempts',
    VALIDATION_ERROR: 'Validation error',
    DUPLICATE_ENTRY: 'Duplicate entry',
    INVALID_SCORE: 'Score must be between 0 and 20',
    WEIGHTS_EXCEED: 'Total assessment weights cannot exceed 100%',
    PARENT_ACCESS_DENIED: 'Parent access not granted by student',
  },
};

module.exports = {
  MARKING_SYSTEM,
  GRADE_BOUNDARIES,
  getLetterGrade,
  scoreToPercentage,
  USER_ROLES,
  MARK_STATUS,
  ALERT_TYPES,
  SEVERITY_LEVELS,
  FILE_UPLOAD,
  PAGINATION,
  RATE_LIMIT,
  MESSAGES,
};
